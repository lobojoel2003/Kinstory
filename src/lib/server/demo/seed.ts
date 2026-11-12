// Creates the fictional demo family in the database: an account, a book,
// six stories with photos, and a queue of questions still to ask.

import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { Sql } from '../db.ts';
import { normalizePhoto } from '../images.ts';
import { log } from '../log.ts';
import { createProject } from '../repo/projects.ts';
import { addPrompt } from '../repo/prompts.ts';
import { createPhoto, createStory } from '../repo/stories.ts';
import { listStorytellers } from '../repo/storytellers.ts';
import { createUser } from '../repo/users.ts';
import { keys, putFile } from '../storage.ts';
import { demoPhotoPath, loadDemo } from './fixture.ts';

export async function seedDemo(
	sql: Sql
): Promise<{ email: string; password: string; projectId: string } | null> {
	const demo = await loadDemo();
	const [existing] = await sql<
		{ id: string }[]
	>`select id from users where lower(email) = lower(${demo.organizer.email})`;
	if (existing) return null;

	const user = await createUser(sql, demo.organizer);
	const project = await createProject(sql, user.id, {
		title: demo.project.title,
		storytellerName: demo.storyteller.name,
		askedBy: demo.organizer.name.split(' ')[0]
	});
	// The starter questions are replaced by the demo's own.
	await sql`delete from prompts where project_id = ${project.id}`;
	const [teller] = await listStorytellers(sql, project.id);
	await sql`
		update storytellers set phone = ${demo.storyteller.phone}, timezone = ${demo.storyteller.timezone},
			call_day = ${demo.storyteller.callDay}, call_time = ${demo.storyteller.callTime}, delivery = 'call'
		where id = ${teller.id}`;

	const photoIds = new Map<string, string>();
	const photo = async (name: string, storyId: string | null, caption: string | null) => {
		const { data, width, height } = await normalizePhoto(await readFile(demoPhotoPath(name)));
		const id = randomUUID();
		const key = keys.photo(project.id, id);
		await putFile(key, data);
		const row = await createPhoto(sql, {
			id,
			projectId: project.id,
			storyId,
			fileKey: key,
			width,
			height,
			caption
		});
		photoIds.set(name, row.id);
		return row;
	};

	for (const part of demo.parts) {
		for (const s of part.stories) {
			const [prompt] = await sql<{ id: string }[]>`
				insert into prompts (project_id, storyteller_id, text, asked_by, status, sent_at, answered_at)
				values (${project.id}, ${teller.id}, ${s.question}, ${s.askedBy}, 'answered', ${s.recorded}, ${s.recorded})
				returning id`;
			const story = await createStory(sql, project.id, {
				title: s.title,
				body: s.text,
				question: s.question,
				askedBy: s.askedBy,
				storytellerId: teller.id,
				promptId: prompt.id,
				recordedAt: new Date(`${s.recorded}T15:00:00Z`),
				recordedVia: s.via === 'phone' ? 'phone' : 'web',
				part: part.title
			});
			await sql`update stories set pull_quote = ${s.pullQuote}, status = 'ready' where id = ${story.id}`;
			for (const p of s.photos) {
				const row = await photo(p.photo, story.id, p.caption);
				await sql`update photos set layout = ${p.layout}, anchor = ${p.after} where id = ${row.id}`;
			}
		}
	}

	const front = await photo(demo.frontispiece.photo, null, demo.frontispiece.caption);
	await sql`
		update projects set subtitle = ${demo.project.subtitle}, imprint = ${demo.project.imprint},
			dedication = ${demo.project.dedication}, afterword = ${demo.project.afterword.join('\n\n')},
			blurb = ${demo.project.blurb}, frontispiece_photo_id = ${front.id}, cover_photo_id = ${front.id},
			frontispiece_caption = ${demo.frontispiece.caption}, listen_qr = true
		where id = ${project.id}`;

	for (const [i, q] of [
		'What was the best meal you ever ate?',
		'Tell me about the first time you saw snow.',
		'What songs did you sing to your children?',
		'Who in the family were you closest to growing up?'
	].entries()) {
		await addPrompt(sql, project.id, {
			text: q,
			askedBy: demo.members[i % demo.members.length],
			storytellerId: teller.id
		});
	}
	log.info('demo family created', { email: demo.organizer.email });
	return { email: demo.organizer.email, password: demo.organizer.password, projectId: project.id };
}
