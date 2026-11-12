import { error, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db.ts';
import { requireUser } from '#lib/server/guard.ts';
import { acceptInvite, findInvite } from '#lib/server/repo/projects.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const invite = await findInvite(db(), params.token);
	if (!invite) error(404, 'This invitation link is not valid.');
	return { invite, signedIn: Boolean(locals.user) };
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireUser(event);
		const projectId = await acceptInvite(db(), event.params.token, user.id);
		if (!projectId)
			error(410, 'This invitation has expired or was already used. Ask for a new link.');
		redirect(303, `/p/${projectId}`);
	}
};
