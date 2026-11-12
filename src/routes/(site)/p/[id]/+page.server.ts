import { fail } from '@sveltejs/kit';
import { db } from '#lib/server/db.ts';
import { field, requireProject } from '#lib/server/guard.ts';
import { setPromptStatus } from '#lib/server/repo/prompts.ts';
import { latestDoneRender } from '#lib/server/repo/renders.ts';
import { projectStats, recentRecordings } from '#lib/server/repo/stories.ts';
import { currentPrompt, getStoryteller, listStorytellers } from '#lib/server/repo/storytellers.ts';
import { deliverPrompt, DeliveryError } from '#lib/server/services/delivery.ts';
import { nextOccurrence } from '#lib/server/schedule.ts';
import type { Delivery } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { project } = await requireProject(event);
	const sql = db();
	const tellers = await listStorytellers(sql, project.id);
	const now = new Date();
	const current = await Promise.all(
		tellers.map(async (t) => {
			let next: Date | null = null;
			try {
				if (t.callDay !== null && t.callTime && t.delivery !== 'none')
					next = nextOccurrence(t.callDay, t.callTime, t.timezone, now);
			} catch {
				next = null;
			}
			return { teller: t, prompt: await currentPrompt(sql, t), next };
		})
	);
	const [stats, recent, render] = await Promise.all([
		projectStats(sql, project.id),
		recentRecordings(sql, project.id),
		latestDoneRender(sql, project.id)
	]);
	return { current, stats, recent, render, welcome: event.url.searchParams.has('welcome') };
};

export const actions: Actions = {
	send: async (event) => {
		const { project } = await requireProject(event);
		const form = await event.request.formData();
		const teller = await getStoryteller(db(), project.id, field(form, 'teller') ?? '');
		const via = field(form, 'via') as Delivery | null;
		if (!teller || !via || !['call', 'sms', 'email'].includes(via))
			return fail(400, { sendError: 'Choose how to send the question.' });
		try {
			await deliverPrompt(db(), teller, via);
		} catch (err) {
			if (err instanceof DeliveryError) return fail(400, { sendError: err.message });
			return fail(502, { sendError: `Could not send: ${(err as Error).message}` });
		}
		const what =
			via === 'call'
				? `Calling ${teller.name} now.`
				: via === 'sms'
					? `Text sent to ${teller.name}.`
					: `Email sent to ${teller.name}.`;
		return { sent: what };
	},
	skip: async (event) => {
		const { project } = await requireProject(event);
		const id = field(await event.request.formData(), 'prompt');
		if (id) await setPromptStatus(db(), project.id, id, 'skipped');
		return { skipped: true };
	}
};
