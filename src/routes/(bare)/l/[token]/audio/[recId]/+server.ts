import { error } from '@sveltejs/kit';
import { AUDIO_MIME_BY_EXT } from '#lib/server/audio.ts';
import { db } from '#lib/server/db.ts';
import { getProject } from '#lib/server/repo/projects.ts';
import { getRecording, storyByShareToken } from '#lib/server/repo/stories.ts';
import { serveFile } from '#lib/server/serve.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request }) => {
	const sql = db();
	const story = await storyByShareToken(sql, params.token);
	const project = story ? await getProject(sql, story.projectId) : null;
	if (!story || !project?.listenQr) error(404, 'Not shared');
	const rec = await getRecording(sql, params.recId);
	if (!rec || rec.storyId !== story.id) error(404, 'Not found');
	const ext = rec.fileKey.split('.').pop() ?? 'webm';
	return serveFile(rec.fileKey, request, {
		type: AUDIO_MIME_BY_EXT[ext] ?? 'application/octet-stream',
		cache: 'private, max-age=3600'
	});
};
