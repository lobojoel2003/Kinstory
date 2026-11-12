import type { Render } from '#lib/types.ts';
import type { Db } from '../db.ts';

export async function createRender(
	sql: Db,
	projectId: string,
	requestedBy: string | null,
	settings: Record<string, unknown>
): Promise<Render> {
	const [row] = await sql<Render[]>`
		insert into renders (project_id, requested_by, settings) values (${projectId}, ${requestedBy}, ${sql.json(settings as never)})
		returning *`;
	return row;
}

export async function getRender(sql: Db, projectId: string, id: string): Promise<Render | null> {
	if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
	const [row] = await sql<
		Render[]
	>`select * from renders where id = ${id} and project_id = ${projectId}`;
	return row ?? null;
}

export async function renderById(sql: Db, id: string): Promise<Render | null> {
	const [row] = await sql<Render[]>`select * from renders where id = ${id}`;
	return row ?? null;
}

export async function latestRenders(sql: Db, projectId: string, limit = 6): Promise<Render[]> {
	return sql<
		Render[]
	>`select * from renders where project_id = ${projectId} order by created_at desc limit ${limit}`;
}

export async function latestDoneRender(sql: Db, projectId: string): Promise<Render | null> {
	const [row] = await sql<Render[]>`
		select * from renders where project_id = ${projectId} and status = 'done' order by created_at desc limit 1`;
	return row ?? null;
}

export async function setRenderStatus(
	sql: Db,
	id: string,
	u: {
		status: Render['status'];
		dirKey?: string | null;
		pages?: number | null;
		spineInches?: number | null;
		error?: string | null;
	}
): Promise<void> {
	await sql`
		update renders set status = ${u.status}, dir_key = coalesce(${u.dirKey ?? null}, dir_key), pages = coalesce(${u.pages ?? null}, pages),
			spine_inches = coalesce(${u.spineInches ?? null}, spine_inches), error = ${u.error ?? null},
			finished_at = case when ${u.status} in ('done', 'failed') then now() else null end
		where id = ${id}`;
}

/** Old renders beyond the newest `keep`, whose files can be removed. */
export async function pruneRenders(sql: Db, projectId: string, keep = 5): Promise<Render[]> {
	return sql<Render[]>`
		delete from renders where id in (
			select id from renders where project_id = ${projectId} and status in ('done', 'failed')
			order by created_at desc offset ${keep}
		) returning *`;
}
