// Files live on local disk under DATA_DIR, addressed by keys such as
// "projects/<id>/audio/<id>.webm". Keeping everything in one directory makes
// backups a single copy and lets families take their data with them.

import { createReadStream, createWriteStream } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { config } from './config.ts';

const KEY = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

export function dataDir(): string {
	return resolve(config().DATA_DIR);
}

/** Absolute path for a key, refusing anything that would escape DATA_DIR. */
export function filePath(key: string): string {
	if (!KEY.test(key) || key.split('/').some((p) => p === '..' || p === '.' || p === '')) {
		throw new Error(`Invalid storage key: ${key}`);
	}
	const root = dataDir();
	const full = resolve(root, key);
	if (!full.startsWith(root + sep)) throw new Error(`Invalid storage key: ${key}`);
	return full;
}

/** Writes a file atomically: readers never see a half-written file. */
export async function putFile(
	key: string,
	data: Buffer | Uint8Array | Readable | ReadableStream<Uint8Array>
): Promise<number> {
	const full = filePath(key);
	await mkdir(dirname(full), { recursive: true });
	const tmp = `${full}.${randomBytes(6).toString('hex')}.partial`;
	try {
		if (data instanceof Uint8Array) {
			await writeFile(tmp, data);
		} else {
			const src =
				data instanceof Readable
					? data
					: Readable.fromWeb(data as import('node:stream/web').ReadableStream);
			await pipeline(src, createWriteStream(tmp));
		}
		await rename(tmp, full);
	} catch (err) {
		await rm(tmp, { force: true });
		throw err;
	}
	return (await stat(full)).size;
}

export function readFileBuffer(key: string): Promise<Buffer> {
	return readFile(filePath(key));
}

export async function fileSize(key: string): Promise<number | null> {
	try {
		return (await stat(filePath(key))).size;
	} catch {
		return null;
	}
}

/** Web stream of a stored file, optionally a byte range (for audio seeking). */
export function fileStream(
	key: string,
	range?: { start: number; end: number }
): ReadableStream<Uint8Array> {
	const node = createReadStream(filePath(key), range);
	return Readable.toWeb(node) as ReadableStream<Uint8Array>;
}

export async function removeFile(key: string): Promise<void> {
	await rm(filePath(key), { force: true });
}

export async function removeDir(key: string): Promise<void> {
	await rm(filePath(key), { recursive: true, force: true });
}

export const keys = {
	audio: (projectId: string, id: string, ext: string) => `projects/${projectId}/audio/${id}.${ext}`,
	photo: (projectId: string, id: string) => `projects/${projectId}/photos/${id}.jpg`,
	thumb: (projectId: string, id: string) => `projects/${projectId}/photos/${id}.thumb.webp`,
	render: (projectId: string, id: string) => `projects/${projectId}/renders/${id}`,
	project: (projectId: string) => `projects/${projectId}`
};

export const joinKey = (...parts: string[]) =>
	join(...parts)
		.split(sep)
		.join('/');
