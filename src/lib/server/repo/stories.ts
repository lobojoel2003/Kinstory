import type { Photo, Recording, Story, StoryListItem } from '#lib/types.ts';
import { randomToken } from '../auth.ts';
import type { Db, Sql } from '../db.ts';

const UUID = /^[0-9a-f-]{36}$/i;

export async function listStories(sql: Db, projectId: string): Promise<StoryListItem[]> {
	return sql<StoryListItem[]>`
		select s.*,
			coalesce(array_length(regexp_split_to_array(trim(s.body), '\\s+'), 1), 0)::int as words,
			coalesce((select sum(duration_seconds) from recordings r where r.story_id = s.id), 0)::int as seconds,
			(select count(*)::int from photos p where p.story_id = s.id) as photo_count,
			(select count(*)::int from recordings r where r.story_id = s.id and r.status in ('pending', 'processing')) as pending
		from stories s
		where s.project_id = ${projectId}
		order by s.position, s.created_at`;
}

export async function getStory(sql: Db, projectId: string, id: string): Promise<Story | null> {
	if (!UUID.test(id)) return null;
	const [row] = await sql<
		Story[]
	>`select * from stories where id = ${id} and project_id = ${projectId}`;
	return row ?? null;
}

export async function storyByShareToken(sql: Db, token: string): Promise<Story | null> {
	if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
	const [row] = await sql<Story[]>`select * from stories where share_token = ${token}`;
	return row ?? null;
}

export async function createStory(
	sql: Db,
	projectId: string,
	input: {
		title: string;
		body?: string;
		question?: string | null;
		askedBy?: string | null;
		storytellerId?: string | null;
		promptId?: string | null;
		recordedAt?: Date | null;
		recordedVia?: Story['recordedVia'];
		part?: string | null;
	}
): Promise<Story> {
	const [row] = await sql<Story[]>`
		insert into stories (project_id, storyteller_id, prompt_id, title, question, asked_by, body, part, position, recorded_at, recorded_via, share_token)
		values (
			${projectId}, ${input.storytellerId ?? null}, ${input.promptId ?? null}, ${input.title}, ${input.question ?? null},
			${input.askedBy ?? null}, ${input.body ?? ''}, ${input.part ?? null},
			(select coalesce(max(position), 0) + 1 from stories where project_id = ${projectId}),
			${input.recordedAt ?? null}, ${input.recordedVia ?? null}, ${randomToken(18)}
		)
		returning *`;
	return row;
}

export interface StoryUpdate {
	title: string;
	question: string | null;
	askedBy: string | null;
	body: string;
	pullQuote: string | null;
	part: string | null;
	includeInBook: boolean;
	status: 'draft' | 'ready';
}

export async function updateStory(
	sql: Db,
	projectId: string,
	id: string,
	u: StoryUpdate
): Promise<void> {
	await sql`
		update stories set
			title = ${u.title}, question = ${u.question}, asked_by = ${u.askedBy}, body = ${u.body},
			pull_quote = ${u.pullQuote}, part = ${u.part}, include_in_book = ${u.includeInBook}, status = ${u.status},
			updated_at = now()
		where id = ${id} and project_id = ${projectId}`;
}

export async function appendToStory(sql: Db, id: string, text: string): Promise<void> {
	await sql`
		update stories set body = case when trim(body) = '' then ${text} else body || E'\n\n' || ${text} end, updated_at = now()
		where id = ${id}`;
}

export async function reorderStories(
	sql: Sql,
	projectId: string,
	order: { id: string; part: string | null }[]
): Promise<void> {
	await sql.begin(async (tx) => {
		for (const [i, s] of order.filter((x) => UUID.test(x.id)).entries()) {
			await tx`update stories set position = ${i}, part = ${s.part} where id = ${s.id} and project_id = ${projectId}`;
		}
	});
}

export async function deleteStory(sql: Db, projectId: string, id: string): Promise<void> {
	await sql`delete from stories where id = ${id} and project_id = ${projectId}`;
}

/** Stories in book order with their photos, for the renderer. */
export async function storiesForBook(
	sql: Db,
	projectId: string
): Promise<(Story & { photos: Photo[] })[]> {
	const stories = await sql<Story[]>`
		select * from stories where project_id = ${projectId} and include_in_book and trim(body) <> ''
		order by position, created_at`;
	if (stories.length === 0) return [];
	const photos = await sql<Photo[]>`
		select * from photos where story_id in ${sql(stories.map((s) => s.id))} order by position, created_at`;
	return stories.map((s) => ({ ...s, photos: photos.filter((p) => p.storyId === s.id) }));
}

// Recordings -------------------------------------------------------------------

export async function createRecording(
	sql: Db,
	input: Pick<
		Recording,
		| 'projectId'
		| 'storytellerId'
		| 'promptId'
		| 'storyId'
		| 'source'
		| 'fileKey'
		| 'mime'
		| 'bytes'
		| 'externalId'
	> & {
		id?: string;
	}
): Promise<Recording> {
	const [row] = await sql<Recording[]>`
		insert into recordings (id, project_id, storyteller_id, prompt_id, story_id, source, file_key, mime, bytes, external_id)
		values (
			coalesce(${input.id ?? null}::uuid, gen_random_uuid()), ${input.projectId}, ${input.storytellerId}, ${input.promptId},
			${input.storyId}, ${input.source}, ${input.fileKey}, ${input.mime}, ${input.bytes}, ${input.externalId}
		)
		returning *`;
	return row;
}

export async function getRecording(sql: Db, id: string): Promise<Recording | null> {
	if (!UUID.test(id)) return null;
	const [row] = await sql<Recording[]>`select * from recordings where id = ${id}`;
	return row ?? null;
}

export async function recordingByExternalId(
	sql: Db,
	externalId: string
): Promise<Recording | null> {
	const [row] = await sql<Recording[]>`select * from recordings where external_id = ${externalId}`;
	return row ?? null;
}

export async function recordingsForStory(sql: Db, storyId: string): Promise<Recording[]> {
	return sql<Recording[]>`select * from recordings where story_id = ${storyId} order by created_at`;
}

export async function recentRecordings(sql: Db, projectId: string, limit = 8) {
	return sql<
		(Recording & {
			storyTitle: string | null;
			tellerName: string | null;
			question: string | null;
		})[]
	>`
		select r.*, s.title as story_title, t.name as teller_name, p.text as question
		from recordings r
		left join stories s on s.id = r.story_id
		left join storytellers t on t.id = r.storyteller_id
		left join prompts p on p.id = r.prompt_id
		where r.project_id = ${projectId}
		order by r.created_at desc
		limit ${limit}`;
}

export async function projectStats(sql: Db, projectId: string) {
	const [row] = await sql<
		{
			stories: number;
			ready: number;
			minutes: number;
			words: number;
			photos: number;
			queued: number;
		}[]
	>`
		select
			(select count(*)::int from stories where project_id = ${projectId}) as stories,
			(select count(*)::int from stories where project_id = ${projectId} and status = 'ready') as ready,
			(select coalesce(round(sum(duration_seconds) / 60), 0)::int from recordings where project_id = ${projectId}) as minutes,
			(select coalesce(sum(array_length(regexp_split_to_array(trim(body), '\\s+'), 1)), 0)::int from stories where project_id = ${projectId} and trim(body) <> '') as words,
			(select count(*)::int from photos where project_id = ${projectId}) as photos,
			(select count(*)::int from prompts where project_id = ${projectId} and status in ('queued', 'sent')) as queued`;
	return row;
}

// Photos -----------------------------------------------------------------------

export async function listPhotos(sql: Db, projectId: string): Promise<Photo[]> {
	return sql<
		Photo[]
	>`select * from photos where project_id = ${projectId} order by created_at desc`;
}

export async function getPhoto(sql: Db, projectId: string, id: string): Promise<Photo | null> {
	if (!UUID.test(id)) return null;
	const [row] = await sql<
		Photo[]
	>`select * from photos where id = ${id} and project_id = ${projectId}`;
	return row ?? null;
}

export async function createPhoto(
	sql: Db,
	input: {
		id: string;
		projectId: string;
		storyId: string | null;
		fileKey: string;
		width: number;
		height: number;
		caption: string | null;
	}
): Promise<Photo> {
	const [row] = await sql<Photo[]>`
		insert into photos (id, project_id, story_id, file_key, width, height, caption, position)
		values (${input.id}, ${input.projectId}, ${input.storyId}, ${input.fileKey}, ${input.width}, ${input.height}, ${input.caption},
			(select coalesce(max(position), 0) + 1 from photos where story_id is not distinct from ${input.storyId} and project_id = ${input.projectId}))
		returning *`;
	return row;
}

export async function updatePhoto(
	sql: Db,
	projectId: string,
	id: string,
	u: {
		caption: string | null;
		layout: Photo['layout'];
		anchor: number | null;
		storyId: string | null;
	}
): Promise<void> {
	await sql`
		update photos set caption = ${u.caption}, layout = ${u.layout}, anchor = ${u.anchor},
			story_id = (select id from stories where id = ${u.storyId} and project_id = ${projectId})
		where id = ${id} and project_id = ${projectId}`;
}

export async function deletePhoto(sql: Db, projectId: string, id: string): Promise<Photo | null> {
	const [row] = await sql<
		Photo[]
	>`delete from photos where id = ${id} and project_id = ${projectId} returning *`;
	return row ?? null;
}
