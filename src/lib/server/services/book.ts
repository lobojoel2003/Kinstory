// Assembles a book from the database and renders it in the background.

import type { Project, Render } from '#lib/types.ts';
import type { BookInput } from '../book/book-data.ts';
import { renderCover, renderInterior } from '../book/render.ts';
import { config } from '../config.ts';
import type { Db, Sql } from '../db.ts';
import { enqueue, type Job } from '../jobs.ts';
import { designOf, getProject } from '../repo/projects.ts';
import { createRender, pruneRenders, renderById, setRenderStatus } from '../repo/renders.ts';
import { getPhoto, storiesForBook } from '../repo/stories.ts';
import { listStorytellers } from '../repo/storytellers.ts';
import { filePath, keys, removeDir } from '../storage.ts';

export async function bookInput(sql: Db, project: Project): Promise<BookInput> {
	const [stories, tellers] = await Promise.all([
		storiesForBook(sql, project.id),
		listStorytellers(sql, project.id)
	]);
	const base = config().publicUrl;
	const photo = async (id: string | null) => (id ? getPhoto(sql, project.id, id) : null);
	const [front, cover] = await Promise.all([
		photo(project.frontispiecePhotoId),
		photo(project.coverPhotoId)
	]);
	return {
		title: project.title,
		subtitle: project.subtitle,
		author: tellers.map((t) => t.name).join(' & ') || project.title,
		imprint: project.imprint,
		dedication: project.dedication,
		afterword: project.afterword,
		blurb: project.blurb,
		language: project.language,
		design: designOf(project),
		frontispiece: front
			? {
					id: front.id,
					file: filePath(front.fileKey),
					width: front.width,
					height: front.height,
					caption: project.frontispieceCaption ?? front.caption
				}
			: null,
		coverPhoto: cover
			? { id: cover.id, file: filePath(cover.fileKey), width: cover.width, height: cover.height }
			: null,
		stories: stories.map((s) => ({
			id: s.id,
			title: s.title,
			question: s.question,
			askedBy: s.askedBy,
			part: s.part,
			body: s.body,
			pullQuote: s.pullQuote,
			recordedAt: s.recordedAt,
			recordedVia: s.recordedVia,
			listenUrl: base ? `${base}/l/${s.shareToken}` : null,
			photos: s.photos.map((p) => ({
				id: p.id,
				file: filePath(p.fileKey),
				width: p.width,
				height: p.height,
				caption: p.caption,
				layout: p.layout,
				anchor: p.anchor
			}))
		}))
	};
}

/** Queues a render of the project's current state. */
export async function requestRender(
	sql: Sql,
	project: Project,
	userId: string | null
): Promise<Render> {
	const render = await createRender(sql, project.id, userId, { ...designOf(project) });
	await enqueue(sql, 'render', { renderId: render.id }, { maxAttempts: 1 });
	return render;
}

export async function renderJob(job: Job<{ renderId: string }>, sql: Sql): Promise<void> {
	const render = await renderById(sql, job.payload.renderId);
	if (!render) return;
	const project = await getProject(sql, render.projectId);
	if (!project) return;
	await setRenderStatus(sql, render.id, { status: 'running' });
	const input = await bookInput(sql, project);
	if (input.stories.length === 0) {
		throw new Error('There are no stories with text to put in the book yet.');
	}
	const dirKey = keys.render(project.id, render.id);
	const out = filePath(dirKey);
	const interior = await renderInterior(input, out, { previews: true });
	const cover = await renderCover(input, interior.pages, out);
	await setRenderStatus(sql, render.id, {
		status: 'done',
		dirKey,
		pages: interior.pages,
		spineInches: cover.spine
	});
	for (const old of await pruneRenders(sql, project.id)) {
		if (old.dirKey) await removeDir(old.dirKey);
	}
}

export async function renderFailed(sql: Sql, job: Job, err: unknown): Promise<void> {
	const id = (job.payload as { renderId?: string }).renderId;
	if (id)
		await setRenderStatus(sql, id, {
			status: 'failed',
			error: err instanceof Error ? err.message : String(err)
		});
}
