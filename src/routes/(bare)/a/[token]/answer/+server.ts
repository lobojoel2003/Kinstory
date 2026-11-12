import { error, json } from '@sveltejs/kit';
import { audioExtension } from '#lib/server/audio.ts';
import { db } from '#lib/server/db.ts';
import { limited } from '#lib/server/ratelimit.ts';
import { storytellerByToken } from '#lib/server/repo/storytellers.ts';
import { pokeWorker } from '#lib/server/runtime.ts';
import { ingestRecording } from '#lib/server/services/capture.ts';
import type { RequestHandler } from './$types';

const MAX_BYTES = 250 * 1024 * 1024;

/** Receives a voice note from the storyteller's private answer page. */
export const POST: RequestHandler = async ({ params, request }) => {
	const sql = db();
	const teller = await storytellerByToken(sql, params.token);
	if (!teller) error(404, 'Unknown link');
	if (limited(`answer:${teller.id}`, 30, 60 * 60_000))
		error(429, 'Too many recordings in a short time. Please try again later.');

	const form = await request.formData();
	const file = form.get('audio');
	if (!(file instanceof File) || file.size === 0) error(400, 'No recording received');
	if (file.size > MAX_BYTES) error(413, 'That recording is too large');
	const ext = audioExtension(file.type, file.name);
	if (!ext) error(415, 'That file does not look like audio');
	const promptId = form.get('prompt');

	const rec = await ingestRecording(sql, {
		teller,
		promptId: typeof promptId === 'string' && promptId ? promptId : null,
		source: 'web',
		data: file.stream(),
		ext,
		mime: file.type || null
	});
	pokeWorker();
	return json({ ok: true, id: rec.id }, { status: 201 });
};
