import { error } from '@sveltejs/kit';
import { AUDIO_MIME_BY_EXT } from '#lib/server/audio.ts';
import { db } from '#lib/server/db.ts';
import { requireProject } from '#lib/server/guard.ts';
import { getRecording } from '#lib/server/repo/stories.ts';
import { serveFile } from '#lib/server/serve.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const { project } = await requireProject(event);
	const rec = await getRecording(db(), event.params.recId);
	if (!rec || rec.projectId !== project.id) error(404, 'Recording not found');
	const ext = rec.fileKey.split('.').pop() ?? 'webm';
	return serveFile(rec.fileKey, event.request, {
		type: AUDIO_MIME_BY_EXT[ext] ?? rec.mime ?? 'application/octet-stream',
		filename: `recording-${rec.createdAt.toISOString().slice(0, 10)}.${ext}`,
		download: event.url.searchParams.has('download')
	});
};
