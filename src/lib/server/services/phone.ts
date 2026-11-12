// Call flows. Inbound: the storyteller rings the Kinstory number and is
// recognised by caller ID (or a six-digit code). Outbound: Kinstory rings
// them on their weekly schedule. Either way they hear one question and talk.

import { elderStrings, PHONE_VOICES } from '#lib/elder-strings.ts';
import { shortName } from '#lib/names.ts';
import type { Storyteller } from '#lib/types.ts';
import { config } from '../config.ts';
import type { Sql } from '../db.ts';
import { enqueue, type Job } from '../jobs.ts';
import { log } from '../log.ts';
import { getProject } from '../repo/projects.ts';
import { promptById } from '../repo/prompts.ts';
import { recordingByExternalId } from '../repo/stories.ts';
import { currentPrompt, markPrompted, storytellerById } from '../repo/storytellers.ts';
import {
	deleteRemoteRecording,
	downloadRecording,
	pause,
	recordVerb,
	say,
	twiml,
	type Voice
} from '../voice/twilio.ts';
import { ingestRecording } from './capture.ts';

export function baseUrl(url: URL): string {
	return config().publicUrl ?? url.origin;
}

function voiceFor(lang: string): Voice {
	const c = config();
	if (lang === 'en' || !PHONE_VOICES[lang])
		return { voice: c.VOICE_TTS_VOICE, language: c.VOICE_TTS_LANGUAGE };
	return PHONE_VOICES[lang];
}

async function languageOf(sql: Sql, teller: Storyteller): Promise<string> {
	return (await getProject(sql, teller.projectId))?.language ?? 'en';
}

/** Greets the storyteller, reads the current question and records the answer. */
export async function questionAndRecord(
	sql: Sql,
	teller: Storyteller,
	url: URL,
	answeredBy?: string
): Promise<Response> {
	const lang = await languageOf(sql, teller);
	const t = elderStrings(lang);
	const v = voiceFor(lang);
	if (answeredBy && answeredBy.startsWith('machine')) {
		return twiml(
			say(t.voicemail(shortName(teller.name), spoken(config().TWILIO_PHONE_NUMBER ?? '')), v) +
				'<Hangup/>'
		);
	}
	const prompt = await currentPrompt(sql, teller);
	const base = baseUrl(url);
	const q = new URLSearchParams({ s: teller.id, ...(prompt ? { p: prompt.id } : {}) });
	await markPrompted(sql, teller.id);
	const intro = prompt
		? say(
				`${t.hello(shortName(teller.name))} ${t.thisWeek(prompt.askedBy ? shortName(prompt.askedBy) : null)}`,
				v
			) +
			pause(1) +
			say(prompt.text, v) +
			pause(1) +
			say(t.takeYourTime, v)
		: say(`${t.hello(shortName(teller.name))} ${t.noQuestion}`, v);
	return twiml(
		intro +
			recordVerb(`${base}/api/voice/done?${q}`, `${base}/api/voice/recording?${q}`) +
			say(t.didNotHear, v) +
			'<Hangup/>'
	);
}

export function askForPin(url: URL, lang = 'en'): Response {
	const t = elderStrings(lang);
	const v = voiceFor(lang);
	return twiml(
		`<Gather input="dtmf" numDigits="6" timeout="12" action="${baseUrl(url)}/api/voice/pin" method="POST">${say(t.enterCode, v)}</Gather>` +
			say(t.didNotHear, v) +
			'<Hangup/>'
	);
}

export function wrongPin(lang = 'en'): Response {
	return twiml(say(elderStrings(lang).codeWrong, voiceFor(lang)) + '<Hangup/>');
}

export async function thanks(sql: Sql, teller: Storyteller): Promise<Response> {
	const lang = await languageOf(sql, teller);
	return twiml(
		say(elderStrings(lang).thanks(shortName(teller.name)), voiceFor(lang)) + '<Hangup/>'
	);
}

/** Reads a phone number digit by digit so text-to-speech does not say "five billion". */
export function spoken(e164: string): string {
	return e164.replace(/[^\d]/g, '').split('').join(' ');
}

/** The gateway says a recording is ready: fetch it in the background. */
export async function recordingReady(
	sql: Sql,
	params: Record<string, string>,
	tellerId: string,
	promptId: string | null
): Promise<void> {
	const sid = params.RecordingSid;
	const recUrl = params.RecordingUrl;
	if (!sid || !recUrl || (params.RecordingStatus && params.RecordingStatus !== 'completed')) return;
	if (Number(params.RecordingDuration ?? '1') < 1) return;
	if (await recordingByExternalId(sql, sid)) return;
	await enqueue(
		sql,
		'fetch-phone-recording',
		{ recordingSid: sid, recordingUrl: recUrl, tellerId, promptId },
		{ maxAttempts: 5 }
	);
}

export async function fetchPhoneRecordingJob(
	job: Job<{
		recordingSid: string;
		recordingUrl: string;
		tellerId: string;
		promptId: string | null;
	}>,
	sql: Sql
): Promise<void> {
	const { recordingSid, recordingUrl, tellerId, promptId } = job.payload;
	if (await recordingByExternalId(sql, recordingSid)) return;
	const teller = await storytellerById(sql, tellerId);
	if (!teller) return;
	const prompt = promptId ? await promptById(sql, promptId) : null;
	const { data, mime } = await downloadRecording(recordingUrl);
	await ingestRecording(sql, {
		teller,
		promptId: prompt?.projectId === teller.projectId ? prompt.id : null,
		source: 'phone',
		data,
		ext: 'mp3',
		mime,
		externalId: recordingSid
	});
	try {
		await deleteRemoteRecording(recordingSid);
	} catch (err) {
		log.warn('could not delete gateway copy of recording', { err, recordingSid });
	}
}
