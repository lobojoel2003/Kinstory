import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db.ts';
import { requireProject } from '#lib/server/guard.ts';
import { thumbnail } from '#lib/server/images.ts';
import { getPhoto } from '#lib/server/repo/stories.ts';
import { serveFile } from '#lib/server/serve.ts';
import { fileSize, filePath, keys, putFile } from '#lib/server/storage.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const { project } = await requireProject(event);
	const photo = await getPhoto(db(), project.id, event.params.photoId);
	if (!photo) error(404, 'Photo not found');
	if (event.url.searchParams.get('size') === 'thumb') {
		const key = keys.thumb(project.id, photo.id);
		if ((await fileSize(key)) === null)
			await putFile(key, await thumbnail(filePath(photo.fileKey)));
		return serveFile(key, event.request, { type: 'image/webp', cache: 'private, max-age=86400' });
	}
	return serveFile(photo.fileKey, event.request, {
		type: 'image/jpeg',
		filename: `${photo.id}.jpg`,
		cache: 'private, max-age=86400'
	});
};
