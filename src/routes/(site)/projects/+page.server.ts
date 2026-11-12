import { db } from '#lib/server/db.ts';
import { requireUser } from '#lib/server/guard.ts';
import { listProjects } from '#lib/server/repo/projects.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	return { projects: await listProjects(db(), user.id) };
};
