import { DEFAULT_DESIGN, type BookDesign } from '#lib/book-options.ts';
import { STARTER_QUESTIONS } from '#lib/prompts.ts';
import type { Member, Project, ProjectSummary, Role } from '#lib/types.ts';
import { randomToken, sha256 } from '../auth.ts';
import type { Db, Sql } from '../db.ts';
import { createStoryteller } from './storytellers.ts';

export async function listProjects(sql: Db, userId: string): Promise<ProjectSummary[]> {
	return sql<ProjectSummary[]>`
		select p.*, m.role,
			(select string_agg(name, ' & ' order by created_at) from storytellers s where s.project_id = p.id) as storyteller_names,
			(select count(*)::int from stories st where st.project_id = p.id) as story_count,
			(select coalesce(round(sum(duration_seconds) / 60), 0)::int from recordings r where r.project_id = p.id) as minutes,
			(select dir_key from renders r where r.project_id = p.id and r.status = 'done' order by created_at desc limit 1) as cover_preview
		from projects p
		join project_members m on m.project_id = p.id and m.user_id = ${userId}
		order by p.updated_at desc`;
}

export interface NewProject {
	title: string;
	storytellerName: string;
	askedBy: string;
	language?: string;
}

/** Creates a book with its storyteller, the creator as owner and a starter set of questions. */
export async function createProject(sql: Sql, userId: string, input: NewProject): Promise<Project> {
	return sql.begin(async (tx) => {
		const [project] = await tx<Project[]>`
			insert into projects (title, language, created_by)
			values (${input.title.trim()}, ${input.language ?? 'en'}, ${userId})
			returning *`;
		await tx`insert into project_members (project_id, user_id, role) values (${project.id}, ${userId}, 'owner')`;
		const teller = await createStoryteller(tx, project.id, { name: input.storytellerName });
		let position = 0;
		for (const text of STARTER_QUESTIONS) {
			await tx`
				insert into prompts (project_id, storyteller_id, text, asked_by, position)
				values (${project.id}, ${teller.id}, ${text}, ${input.askedBy.trim() || null}, ${position++})`;
		}
		return project;
	}) as Promise<Project>;
}

/** The project if `userId` is a member, with their role. */
export async function getProjectForUser(
	sql: Db,
	projectId: string,
	userId: string
): Promise<(Project & { role: Role }) | null> {
	if (!/^[0-9a-f-]{36}$/i.test(projectId)) return null;
	const [row] = await sql<(Project & { role: Role })[]>`
		select p.*, m.role from projects p
		join project_members m on m.project_id = p.id and m.user_id = ${userId}
		where p.id = ${projectId}`;
	return row ?? null;
}

export async function getProject(sql: Db, projectId: string): Promise<Project | null> {
	const [row] = await sql<Project[]>`select * from projects where id = ${projectId}`;
	return row ?? null;
}

export interface ProjectDetails {
	title: string;
	subtitle: string | null;
	imprint: string | null;
	dedication: string | null;
	afterword: string | null;
	blurb: string | null;
	language: string;
}

export async function updateProjectDetails(
	sql: Db,
	projectId: string,
	d: ProjectDetails
): Promise<void> {
	await sql`
		update projects set
			title = ${d.title}, subtitle = ${d.subtitle}, imprint = ${d.imprint}, dedication = ${d.dedication},
			afterword = ${d.afterword}, blurb = ${d.blurb}, language = ${d.language}, updated_at = now()
		where id = ${projectId}`;
}

export function designOf(p: Project): BookDesign {
	return {
		trim: p.trim ?? DEFAULT_DESIGN.trim,
		theme: p.theme ?? DEFAULT_DESIGN.theme,
		color: p.color,
		bleedMode: p.bleedMode,
		paper: p.paper,
		dropCaps: p.dropCaps,
		chapterNumbers: p.chapterNumbers,
		questionsIndex: p.questionsIndex,
		listenQr: p.listenQr,
		coverColor: p.coverColor
	};
}

export async function updateDesign(
	sql: Db,
	projectId: string,
	d: BookDesign & {
		coverPhotoId: string | null;
		frontispiecePhotoId: string | null;
		frontispieceCaption: string | null;
	}
): Promise<void> {
	await sql`
		update projects set
			trim = ${d.trim}, theme = ${d.theme}, color = ${d.color}, bleed_mode = ${d.bleedMode}, paper = ${d.paper},
			drop_caps = ${d.dropCaps}, chapter_numbers = ${d.chapterNumbers}, questions_index = ${d.questionsIndex},
			listen_qr = ${d.listenQr}, cover_color = ${d.coverColor},
			cover_photo_id = (select id from photos where id = ${d.coverPhotoId} and project_id = ${projectId}),
			frontispiece_photo_id = (select id from photos where id = ${d.frontispiecePhotoId} and project_id = ${projectId}),
			frontispiece_caption = ${d.frontispieceCaption}, updated_at = now()
		where id = ${projectId}`;
}

export async function touchProject(sql: Db, projectId: string): Promise<void> {
	await sql`update projects set updated_at = now() where id = ${projectId}`;
}

export async function deleteProject(sql: Db, projectId: string): Promise<void> {
	await sql`delete from projects where id = ${projectId}`;
}

// Members and invitations -----------------------------------------------------

export async function listMembers(sql: Db, projectId: string): Promise<Member[]> {
	return sql<Member[]>`
		select u.id as user_id, u.name, u.email, m.role, m.created_at
		from project_members m join users u on u.id = m.user_id
		where m.project_id = ${projectId}
		order by m.role desc, m.created_at`;
}

export async function removeMember(sql: Db, projectId: string, userId: string): Promise<boolean> {
	const owners = await sql<{ n: number }[]>`
		select count(*)::int as n from project_members where project_id = ${projectId} and role = 'owner' and user_id <> ${userId}`;
	const [target] = await sql<
		{ role: Role }[]
	>`select role from project_members where project_id = ${projectId} and user_id = ${userId}`;
	if (!target) return false;
	if (target.role === 'owner' && owners[0].n === 0) return false; // never leave a book without an owner
	await sql`delete from project_members where project_id = ${projectId} and user_id = ${userId}`;
	return true;
}

export async function createInvite(
	sql: Db,
	projectId: string,
	createdBy: string,
	role: Role = 'editor'
): Promise<string> {
	const token = randomToken(24);
	await sql`
		insert into invites (token_hash, project_id, role, created_by, expires_at)
		values (${sha256(token)}, ${projectId}, ${role}, ${createdBy}, now() + interval '14 days')`;
	return token;
}

export async function findInvite(sql: Db, token: string) {
	const [row] = await sql<
		{
			projectId: string;
			role: Role;
			title: string;
			inviter: string | null;
			expired: boolean;
			used: boolean;
		}[]
	>`
		select i.project_id, i.role, p.title, u.name as inviter, i.expires_at < now() as expired, i.used_at is not null as used
		from invites i join projects p on p.id = i.project_id left join users u on u.id = i.created_by
		where i.token_hash = ${sha256(token)}`;
	return row ?? null;
}

export async function acceptInvite(
	sql: Sql,
	token: string,
	userId: string
): Promise<string | null> {
	return sql.begin(async (tx) => {
		const [inv] = await tx<{ projectId: string; role: Role }[]>`
			update invites set used_at = now(), used_by = ${userId}
			where token_hash = ${sha256(token)} and used_at is null and expires_at > now()
			returning project_id, role`;
		if (!inv) return null;
		await tx`
			insert into project_members (project_id, user_id, role) values (${inv.projectId}, ${userId}, ${inv.role})
			on conflict (project_id, user_id) do nothing`;
		return inv.projectId;
	}) as Promise<string | null>;
}
