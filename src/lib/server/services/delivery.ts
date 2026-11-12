// Sends each storyteller their question on their schedule: a phone call, a
// text message with their answer link, or an email.

import { elderStrings } from '#lib/elder-strings.ts';
import { shortName } from '#lib/names.ts';
import type { Storyteller } from '#lib/types.ts';
import { config } from '../config.ts';
import type { Sql } from '../db.ts';
import { enqueue, type Job } from '../jobs.ts';
import { log } from '../log.ts';
import { sendMail } from '../mail.ts';
import { getProject } from '../repo/projects.ts';
import { markPromptSent } from '../repo/prompts.ts';
import { currentPrompt, markPrompted, storytellerById } from '../repo/storytellers.ts';
import { isDue } from '../schedule.ts';
import { placeCall, sendSms } from '../voice/twilio.ts';

export class DeliveryError extends Error {}

export function answerLink(teller: Storyteller): string | null {
	const base = config().publicUrl;
	return base ? `${base}/a/${teller.answerToken}` : null;
}

/** Sends the storyteller's current question now, by their chosen route. */
export async function deliverPrompt(
	sql: Sql,
	teller: Storyteller,
	via = teller.delivery
): Promise<string> {
	const c = config();
	const prompt = await currentPrompt(sql, teller);
	const lang = (await getProject(sql, teller.projectId))?.language ?? 'en';
	const t = elderStrings(lang);
	const name = shortName(teller.name);
	const link = answerLink(teller);

	switch (via) {
		case 'call': {
			if (!c.voiceEnabled) throw new DeliveryError('The phone line is not configured.');
			if (!teller.phone) throw new DeliveryError(`Add a phone number for ${teller.name} first.`);
			if (!c.publicUrl)
				throw new DeliveryError('Set PUBLIC_URL so the phone gateway can reach Kinstory.');
			await placeCall(teller.phone, `${c.publicUrl}/api/voice/answer?s=${teller.id}`);
			break;
		}
		case 'sms': {
			if (!c.voiceEnabled)
				throw new DeliveryError('Text messages need the phone gateway configured.');
			if (!teller.phone) throw new DeliveryError(`Add a phone number for ${teller.name} first.`);
			if (!link) throw new DeliveryError('Set PUBLIC_URL so the answer link can be shared.');
			const q = prompt
				? `${prompt.askedBy ? t.questionFrom(prompt.askedBy) : ''}: “${prompt.text}”`
				: t.anyStory;
			await sendSms(
				teller.phone,
				`${t.hello(teller.name)} ${q.replace(/^: /, '')}\n${t.record}: ${link}`
			);
			break;
		}
		case 'email': {
			if (!c.mailEnabled) throw new DeliveryError('Email is not configured (SMTP_URL).');
			if (!teller.email) throw new DeliveryError(`Add an email address for ${teller.name} first.`);
			if (!link) throw new DeliveryError('Set PUBLIC_URL so the answer link can be shared.');
			await sendMail({
				to: teller.email,
				subject: prompt ? prompt.text : t.anyStory,
				text: [
					t.greeting(name),
					'',
					prompt
						? `${prompt.askedBy ? `${t.questionFrom(prompt.askedBy)}:\n` : ''}${prompt.text}`
						: t.anyStory,
					'',
					`${t.record}: ${link}`,
					c.voiceEnabled ? `\n${t.orCall(c.TWILIO_PHONE_NUMBER!, teller.pin)}` : ''
				].join('\n')
			});
			break;
		}
		default:
			throw new DeliveryError('Choose how this storyteller receives questions first.');
	}
	if (prompt) await markPromptSent(sql, prompt.id);
	await markPrompted(sql, teller.id);
	log.info('prompt delivered', { teller: teller.id, via });
	return via;
}

export async function deliverPromptJob(job: Job<{ tellerId: string }>, sql: Sql): Promise<void> {
	const teller = await storytellerById(sql, job.payload.tellerId);
	if (teller && teller.delivery !== 'none') await deliverPrompt(sql, teller);
}

/** Runs every minute: queues deliveries whose weekly moment has come. */
export async function scheduleTick(sql: Sql, now = new Date()): Promise<number> {
	const candidates = await sql<Storyteller[]>`
		select * from storytellers where delivery <> 'none' and call_day is not null and call_time is not null`;
	let queued = 0;
	for (const s of candidates) {
		let occ: Date | null;
		try {
			occ = isDue(s, now);
		} catch {
			continue; // invalid time zone saved; the settings page flags it
		}
		if (!occ) continue;
		// Claim this occurrence atomically so two processes never both call.
		const claimed = await sql`
			update storytellers set last_prompted_at = ${now}
			where id = ${s.id} and (last_prompted_at is null or last_prompted_at < ${occ})`;
		if (claimed.count === 1) {
			await enqueue(sql, 'deliver-prompt', { tellerId: s.id }, { maxAttempts: 3 });
			queued++;
		}
	}
	return queued;
}
