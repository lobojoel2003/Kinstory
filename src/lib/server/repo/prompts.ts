import type { Prompt } from '#lib/types.ts';
import type { Db, Sql } from '../db.ts';

const UUID = /^[0-9a-f-]{36}$/i;

export async function listPrompts(sql: Db, projectId: string): Promise<Prompt[]> {
	return sql<Prompt[]>`
		select * from prompts where project_id = ${projectId}
		order by case status when 'sent' then 0 when 'queued' then 1 when 'answered' then 2 else 3 end, position, created_at`;
}

export async function addPrompt(
	sql: Db,
	projectId: string,
	input: { text: string; askedBy: string | null; storytellerId: string | null; first?: boolean }
): Promise<Prompt> {
	const [{ min, max }] = await sql<{ min: number; max: number }[]>`
		select coalesce(min(position), 0)::int as min, coalesce(max(position), 0)::int as max
		from prompts where project_id = ${projectId} and status = 'queued'`;
	const [row] = await sql<Prompt[]>`
		insert into prompts (project_id, storyteller_id, text, asked_by, position)
		values (${projectId}, ${input.storytellerId}, ${input.text.trim()}, ${input.askedBy?.trim() || null}, ${input.first ? min - 1 : max + 1})
		returning *`;
	return row;
}

export async function getPrompt(sql: Db, projectId: string, id: string): Promise<Prompt | null> {
	if (!UUID.test(id)) return null;
	const [row] = await sql<
		Prompt[]
	>`select * from prompts where id = ${id} and project_id = ${projectId}`;
	return row ?? null;
}

export async function promptById(sql: Db, id: string): Promise<Prompt | null> {
	if (!UUID.test(id)) return null;
	const [row] = await sql<Prompt[]>`select * from prompts where id = ${id}`;
	return row ?? null;
}

export async function updatePromptText(
	sql: Db,
	projectId: string,
	id: string,
	text: string,
	askedBy: string | null
): Promise<void> {
	await sql`update prompts set text = ${text.trim()}, asked_by = ${askedBy?.trim() || null} where id = ${id} and project_id = ${projectId}`;
}

export async function setPromptStatus(
	sql: Db,
	projectId: string,
	id: string,
	status: 'queued' | 'skipped'
): Promise<void> {
	await sql`
		update prompts set status = ${status}, sent_at = case when ${status} = 'queued' then null else sent_at end
		where id = ${id} and project_id = ${projectId} and status <> 'answered'`;
}

export async function deletePrompt(sql: Db, projectId: string, id: string): Promise<void> {
	await sql`delete from prompts where id = ${id} and project_id = ${projectId} and status <> 'answered'`;
}

/** Moves a queued question to the front of the queue. */
export async function promotePrompt(sql: Db, projectId: string, id: string): Promise<void> {
	await sql`
		update prompts set position = (select coalesce(min(position), 0) - 1 from prompts where project_id = ${projectId})
		where id = ${id} and project_id = ${projectId}`;
}

/** Saves a new queue order from an ordered list of ids. */
export async function reorderPrompts(sql: Sql, projectId: string, ids: string[]): Promise<void> {
	await sql.begin(async (tx) => {
		for (const [i, id] of ids.filter((x) => UUID.test(x)).entries()) {
			await tx`update prompts set position = ${i} where id = ${id} and project_id = ${projectId}`;
		}
	});
}

export async function markPromptSent(sql: Db, id: string): Promise<void> {
	await sql`update prompts set status = 'sent', sent_at = coalesce(sent_at, now()) where id = ${id} and status = 'queued'`;
}

export async function markPromptAnswered(sql: Db, id: string): Promise<void> {
	await sql`update prompts set status = 'answered', answered_at = coalesce(answered_at, now()) where id = ${id}`;
}
