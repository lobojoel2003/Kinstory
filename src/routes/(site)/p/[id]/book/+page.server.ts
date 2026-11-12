import { fail } from '@sveltejs/kit';
import {
	BLEED_MODES,
	COVER_COLORS,
	isKey,
	LANGUAGES,
	PAPERS,
	THEMES,
	TRIMS
} from '#lib/book-options.ts';
import { db } from '#lib/server/db.ts';
import { field, requireProject } from '#lib/server/guard.ts';
import { getProject, updateDesign, updateProjectDetails } from '#lib/server/repo/projects.ts';
import { latestRenders } from '#lib/server/repo/renders.ts';
import { listPhotos, projectStats } from '#lib/server/repo/stories.ts';
import { pokeWorker } from '#lib/server/runtime.ts';
import { requestRender } from '#lib/server/services/book.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { project } = await requireProject(event);
	const sql = db();
	const [renders, photos, stats, [{ n: printable }]] = await Promise.all([
		latestRenders(sql, project.id),
		listPhotos(sql, project.id),
		projectStats(sql, project.id),
		sql<
			{ n: number }[]
		>`select count(*)::int as n from stories where project_id = ${project.id} and include_in_book and trim(body) <> ''`
	]);
	return { renders, photos, stats, printable };
};

export const actions: Actions = {
	save: async (event) => {
		const { project } = await requireProject(event);
		const form = await event.request.formData();
		const pick = <T extends object>(obj: T, name: string, fallback: keyof T): keyof T => {
			const v = field(form, name);
			return isKey(obj, v) ? v : fallback;
		};
		const title = field(form, 'title', 200);
		if (!title) return fail(400, { error: 'The book needs a title.' });
		const sql = db();
		await updateProjectDetails(sql, project.id, {
			title,
			subtitle: field(form, 'subtitle', 300),
			imprint: field(form, 'imprint', 200),
			dedication: field(form, 'dedication', 1000),
			afterword: field(form, 'afterword', 20_000),
			blurb: field(form, 'blurb', 600),
			language: pick(LANGUAGES, 'language', project.language) as string
		});
		await updateDesign(sql, project.id, {
			trim: pick(TRIMS, 'trim', project.trim),
			theme: pick(THEMES, 'theme', project.theme),
			color: form.get('color') !== 'mono',
			bleedMode: pick(BLEED_MODES, 'bleedMode', project.bleedMode),
			paper: pick(PAPERS, 'paper', project.paper),
			coverColor: pick(COVER_COLORS, 'coverColor', project.coverColor),
			dropCaps: form.get('dropCaps') === 'on',
			chapterNumbers: form.get('chapterNumbers') === 'on',
			questionsIndex: form.get('questionsIndex') === 'on',
			listenQr: form.get('listenQr') === 'on',
			coverPhotoId: field(form, 'coverPhotoId'),
			frontispiecePhotoId: field(form, 'frontispiecePhotoId'),
			frontispieceCaption: field(form, 'frontispieceCaption', 300)
		});
		if (form.get('typeset') === '1') {
			const fresh = await getProject(sql, project.id);
			if (fresh) await requestRender(sql, fresh, null);
			pokeWorker();
			return { typesetting: true };
		}
		return { saved: true };
	}
};
