import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Project, Role } from '#lib/types.ts';
import type { SessionUser } from './auth.ts';
import { db } from './db.ts';
import { getProjectForUser } from './repo/projects.ts';

/** The signed-in user, or a redirect to the sign-in page that comes back here. */
export function requireUser(event: Pick<RequestEvent, 'locals' | 'url'>): SessionUser {
	const user = event.locals.user;
	if (!user)
		redirect(303, `/login?next=${encodeURIComponent(event.url.pathname + event.url.search)}`);
	return user;
}

/**
 * The project in the route, checked against the signed-in user's membership.
 * Used by every load function, action and endpoint under /p/[id].
 */
export async function requireProject(
	event: Pick<RequestEvent, 'locals' | 'url' | 'params'>,
	role?: Role
): Promise<{ user: SessionUser; project: Project & { role: Role } }> {
	const user = requireUser(event);
	const id = (event.params as Record<string, string | undefined>).id ?? '';
	const project = await getProjectForUser(db(), id, user.id);
	if (!project) error(404, 'Book not found');
	if (role === 'owner' && project.role !== 'owner') error(403, 'Only the book’s owner can do that');
	return { user, project };
}

/** A safe same-site redirect target from a ?next= parameter. */
export function safeNext(next: string | null, fallback = '/projects'): string {
	if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\'))
		return fallback;
	return next;
}

/** Trimmed string form field, or null when blank. */
export function field(form: FormData, name: string, max = 20_000): string | null {
	const v = form.get(name);
	if (typeof v !== 'string') return null;
	const t = v.trim();
	return t ? t.slice(0, max) : null;
}
