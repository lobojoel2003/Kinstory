import { error, fail, redirect } from '@sveltejs/kit';
import { isKey, PHOTO_LAYOUTS } from '#lib/book-options.ts';
import { db } from '#lib/server/db.ts';
import { field, requireProject } from '#lib/server/guard.ts';
import { enqueue } from '#lib/server/jobs.ts';
import {
	deleteStory,
	getRecording,
	getStory,
	recordingsForStory,
	updatePhoto,
	updateStory
} from '#lib/server/repo/stories.ts';
import { pokeWorker } from '#lib/server/runtime.ts';
import { addPhoto, PhotoError, removePhoto } from '#lib/server/services/photos.ts';
import { paragraphs } from '#lib/server/text/typography.ts';
import { tidy } from '#lib/server/text/transcript.ts';
import type { Photo } from '#lib/types.ts';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

async function loadStory(event: Pick<RequestEvent, 'locals' | 'url' | 'params'>) {
	const { project } = await requireProject(event);
	const story = await getStory(db(), project.id, event.params.storyId);
	if (!story) error(404, 'Story not found');
	return { project, story };
}

export const load: PageServerLoad = async (event) => {
	const { project, story } = await loadStory(event);
	const sql = db();
	const [recordings, photos, parts, neighbours] = await Promise.all([
		recordingsForStory(sql, story.id),
		sql<Photo[]>`select * from photos where story_id = ${story.id} order by position, created_at`,
		sql<
			{ part: string }[]
		>`select distinct part from stories where project_id = ${project.id} and part is not null order by part`,
		sql<{ id: string; title: string; position: number }[]>`
			select id, title, position from stories where project_id = ${project.id} order by position, created_at`
	]);
	const i = neighbours.findIndex((s) => s.id === story.id);
	return {
		story,
		recordings,
		photos,
		parts: parts.map((p) => p.part),
		prev: neighbours[i - 1] ?? null,
		next: neighbours[i + 1] ?? null
	};
};

export const actions: Actions = {
	save: async (event) => {
		const { project, story } = await loadStory(event);
		const form = await event.request.formData();
		const body = String(form.get('body') ?? '')
			.replace(/\r\n?/g, '\n')
			.slice(0, 400_000);
		await updateStory(db(), project.id, story.id, {
			title: field(form, 'title', 200) ?? 'Untitled story',
			question: field(form, 'question', 500),
			askedBy: field(form, 'askedBy', 120),
			body,
			pullQuote: field(form, 'pullQuote', 400),
			part: field(form, 'part', 120),
			includeInBook: form.get('includeInBook') === 'on',
			status: form.get('status') === 'ready' ? 'ready' : 'draft'
		});
		return { saved: true };
	},
	tidy: async (event) => {
		const { story } = await loadStory(event);
		const body = paragraphs(story.body).map(tidy).filter(Boolean).join('\n\n');
		await db()`update stories set body = ${body}, updated_at = now() where id = ${story.id}`;
		return { tidied: true };
	},
	retranscribe: async (event) => {
		const { project } = await loadStory(event);
		const rec = await getRecording(db(), field(await event.request.formData(), 'recording') ?? '');
		if (!rec || rec.projectId !== project.id) return fail(404, { error: 'Recording not found' });
		await db()`update recordings set status = 'pending', error = null where id = ${rec.id}`;
		await enqueue(db(), 'transcribe', { recordingId: rec.id, refile: false });
		pokeWorker();
		return { retranscribing: true };
	},
	useTranscript: async (event) => {
		const { project, story } = await loadStory(event);
		const rec = await getRecording(db(), field(await event.request.formData(), 'recording') ?? '');
		if (!rec || rec.projectId !== project.id || !rec.transcript)
			return fail(404, { error: 'No transcript to use' });
		await db()`update stories set body = ${rec.transcript}, updated_at = now() where id = ${story.id}`;
		return { replaced: true };
	},
	photos: async (event) => {
		const { project, story } = await loadStory(event);
		const files = (await event.request.formData())
			.getAll('photos')
			.filter((f): f is File => f instanceof File && f.size > 0);
		try {
			for (const f of files) await addPhoto(db(), project.id, story.id, f);
		} catch (err) {
			if (err instanceof PhotoError) return fail(400, { photoError: err.message });
			throw err;
		}
		return { photosAdded: files.length };
	},
	photo: async (event) => {
		const { project, story } = await loadStory(event);
		const form = await event.request.formData();
		const id = field(form, 'id');
		const layout = field(form, 'layout');
		const anchorRaw = field(form, 'anchor');
		if (!id) return fail(400, {});
		if (form.get('remove') === 'delete') {
			await removePhoto(db(), project.id, id);
			return {};
		}
		await updatePhoto(db(), project.id, id, {
			caption: field(form, 'caption', 300),
			layout: isKey(PHOTO_LAYOUTS, layout) ? layout : 'full',
			anchor:
				anchorRaw === null || anchorRaw === 'end'
					? null
					: Math.max(0, Number.parseInt(anchorRaw, 10) || 0),
			storyId: form.get('remove') === 'detach' ? null : story.id
		});
		return { photoSaved: true };
	},
	delete: async (event) => {
		const { project, story } = await loadStory(event);
		await deleteStory(db(), project.id, story.id);
		redirect(303, `/p/${project.id}/stories`);
	}
};
