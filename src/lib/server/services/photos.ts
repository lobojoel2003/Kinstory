import { randomUUID } from 'node:crypto';
import type { Photo } from '#lib/types.ts';
import type { Db } from '../db.ts';
import { normalizePhoto } from '../images.ts';
import { createPhoto, deletePhoto } from '../repo/stories.ts';
import { keys, putFile, removeFile } from '../storage.ts';

export const MAX_PHOTO_BYTES = 40 * 1024 * 1024;

export class PhotoError extends Error {}

/** Stores an uploaded image: rotated upright, location data stripped, JPEG. */
export async function addPhoto(
	sql: Db,
	projectId: string,
	storyId: string | null,
	file: File
): Promise<Photo> {
	if (file.size > MAX_PHOTO_BYTES) throw new PhotoError(`${file.name} is larger than 40 MB.`);
	let normalized;
	try {
		normalized = await normalizePhoto(Buffer.from(await file.arrayBuffer()));
	} catch {
		throw new PhotoError(
			`${file.name || 'That file'} is not an image Kinstory can read (try JPEG, PNG or WebP).`
		);
	}
	const id = randomUUID();
	const key = keys.photo(projectId, id);
	await putFile(key, normalized.data);
	return createPhoto(sql, {
		id,
		projectId,
		storyId,
		fileKey: key,
		width: normalized.width,
		height: normalized.height,
		caption: null
	});
}

export async function removePhoto(sql: Db, projectId: string, id: string): Promise<void> {
	const photo = await deletePhoto(sql, projectId, id);
	if (photo) {
		await removeFile(photo.fileKey);
		await removeFile(keys.thumb(projectId, photo.id));
	}
}
