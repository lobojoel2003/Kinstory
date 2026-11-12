import { fail, redirect } from '@sveltejs/kit';
import { audioExtension } from '#lib/server/audio.ts';
import { db } from '#lib/server/db.ts';
import { field, requireProject } from '#lib/server/guard.ts';
import { getPrompt } from '#lib/server/repo/prompts.ts';
import { createStory, listStories, reorderStories } from '#lib/server/repo/stories.ts';
import { getStoryteller } from '#lib/server/repo/storytellers.ts';
import { pokeWorker } from '#lib/server/runtime.ts';
import { ingestRecording } from '#lib/server/services/capture.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { project } = await requireProject(event);
	return { stories: await listStories(db(), project.id) };
};

export const actions: Actions = {
	reorder: async (event) => {
		const { project } = await requireProject(event);
		const form = await event.request.formData();
		const raw = String(form.get('order') ?? '[]');
		let order: { id: string; part: string | null }[];
		try {
			order = (JSON.parse(raw) as { id: string; part: string | null }[]).map((o) => ({
				id: String(o.id),
				part: o.part ? String(o.part).trim().slice(0, 120) || null : null
			}));
		} catch {
			return fail(400, { error: 'Could not read the new order.' });
		}
		await reorderStories(db(), project.id, order);
		return { saved: true };
	},
	include: async (event) => {
		const { project } = await requireProject(event);
		const form = await event.request.formData();
		const id = field(form, 'id');
		if (id)
			await db()`update stories set include_in_book = not include_in_book where id = ${id} and project_id = ${project.id}`;
		return {};
	},
	new: async (event) => {
		const { project } = await requireProject(event);
		const story = await createStory(db(), project.id, { title: 'Untitled story' });
		redirect(303, `/p/${project.id}/stories/${story.id}`);
	},
	upload: async (event) => {
		const { project } = await requireProject(event);
		const sql = db();
		const form = await event.request.formData();
		const teller = await getStoryteller(sql, project.id, field(form, 'teller') ?? '');
		const file = form.get('audio');
		if (!teller) return fail(400, { uploadError: 'Choose who is speaking.' });
		if (!(file instanceof File) || file.size === 0)
			return fail(400, { uploadError: 'Choose an audio file.' });
		const ext = audioExtension(file.type, file.name);
		if (!ext)
			return fail(400, {
				uploadError: 'That file does not look like audio (try MP3, M4A, WAV, OGG or WebM).'
			});
		const promptId = field(form, 'prompt');
		const prompt = promptId ? await getPrompt(sql, project.id, promptId) : null;
		await ingestRecording(sql, {
			teller,
			promptId: prompt?.id ?? null,
			source: 'upload',
			data: file.stream(),
			ext,
			mime: file.type || null
		});
		pokeWorker();
		return { uploaded: true };
	}
};
