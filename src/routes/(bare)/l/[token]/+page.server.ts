import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db.ts';
import { getProject } from '#lib/server/repo/projects.ts';
import { recordingsForStory, storyByShareToken } from '#lib/server/repo/stories.ts';
import { storytellerById } from '#lib/server/repo/storytellers.ts';
import { paragraphs, smarten } from '#lib/server/text/typography.ts';
import type { PageServerLoad } from './$types';

/** The page behind a book's "hear it in their voice" QR code. Only live when the family turns QR codes on. */
export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const sql = db();
	const story = await storyByShareToken(sql, params.token);
	const project = story ? await getProject(sql, story.projectId) : null;
	if (!story || !project?.listenQr) error(404, 'This story is not shared.');
	const [recordings, teller] = await Promise.all([
		recordingsForStory(sql, story.id),
		story.storytellerId ? storytellerById(sql, story.storytellerId) : null
	]);
	setHeaders({ 'x-robots-tag': 'noindex', 'cache-control': 'private, max-age=60' });
	return {
		title: smarten(story.title),
		question: story.question ? smarten(story.question) : null,
		askedBy: story.askedBy,
		teller: teller?.name ?? null,
		book: project.title,
		paragraphs: paragraphs(story.body).map(smarten),
		recordings: recordings
			.filter((r) => r.status !== 'failed' || r.bytes)
			.map((r) => ({ id: r.id, duration: r.durationSeconds }))
	};
};
