import { fail } from '@sveltejs/kit';
import { isKey, PHOTO_LAYOUTS } from '#lib/book-options.ts';
import { db } from '#lib/server/db.ts';
import { field, requireProject } from '#lib/server/guard.ts';
import { listPhotos, updatePhoto } from '#lib/server/repo/stories.ts';
import { addPhoto, PhotoError, removePhoto } from '#lib/server/services/photos.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { project } = await requireProject(event);
	const sql = db();
	const [photos, stories] = await Promise.all([
		listPhotos(sql, project.id),
		sql<
			{ id: string; title: string }[]
		>`select id, title from stories where project_id = ${project.id} order by position, created_at`
	]);
	return { photos, stories };
};

export const actions: Actions = {
	upload: async (event) => {
		const { project } = await requireProject(event);
		const files = (await event.request.formData())
			.getAll('photos')
			.filter((f): f is File => f instanceof File && f.size > 0);
		if (!files.length) return fail(400, { error: 'Choose one or more photos.' });
		try {
			for (const f of files) await addPhoto(db(), project.id, null, f);
		} catch (err) {
			if (err instanceof PhotoError) return fail(400, { error: err.message });
			throw err;
		}
		return { added: files.length };
	},
	save: async (event) => {
		const { project } = await requireProject(event);
		const form = await event.request.formData();
		const id = field(form, 'id');
		if (!id) return fail(400, {});
		const sql = db();
		const [current] = await sql<
			{ anchor: number | null }[]
		>`select anchor from photos where id = ${id} and project_id = ${project.id}`;
		const layout = field(form, 'layout');
		await updatePhoto(sql, project.id, id, {
			caption: field(form, 'caption', 300),
			layout: isKey(PHOTO_LAYOUTS, layout) ? layout : 'full',
			anchor: current?.anchor ?? null,
			storyId: field(form, 'story')
		});
		const role = field(form, 'role');
		if (role === 'cover')
			await sql`update projects set cover_photo_id = ${id} where id = ${project.id}`;
		if (role === 'frontispiece')
			await sql`update projects set frontispiece_photo_id = ${id} where id = ${project.id}`;
		return { saved: id };
	},
	delete: async (event) => {
		const { project } = await requireProject(event);
		const id = field(await event.request.formData(), 'id');
		if (id) await removePhoto(db(), project.id, id);
		return {};
	}
};
