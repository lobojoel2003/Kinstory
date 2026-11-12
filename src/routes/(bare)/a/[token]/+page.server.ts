import { error } from '@sveltejs/kit';
import { shortName } from '#lib/names.ts';
import { config } from '#lib/server/config.ts';
import { db } from '#lib/server/db.ts';
import { getProject } from '#lib/server/repo/projects.ts';
import { currentPrompt, openPrompts, storytellerByToken } from '#lib/server/repo/storytellers.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const sql = db();
	const teller = await storytellerByToken(sql, params.token);
	if (!teller) error(404, 'This link is not valid any more. Please ask your family for a new one.');
	const [project, prompt, others] = await Promise.all([
		getProject(sql, teller.projectId),
		currentPrompt(sql, teller),
		openPrompts(sql, teller)
	]);
	setHeaders({ 'cache-control': 'no-store', 'x-robots-tag': 'noindex' });
	const c = config();
	return {
		name: shortName(teller.name),
		language: project?.language ?? 'en',
		prompt: prompt ? { id: prompt.id, text: prompt.text, askedBy: prompt.askedBy } : null,
		others: others.map((p) => ({ id: p.id, text: p.text, askedBy: p.askedBy })),
		phone: c.voiceEnabled ? (c.TWILIO_PHONE_NUMBER ?? null) : null,
		pin: teller.pin
	};
};
