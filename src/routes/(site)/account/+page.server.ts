import { fail } from '@sveltejs/kit';
import { db } from '#lib/server/db.ts';
import { field, requireUser } from '#lib/server/guard.ts';
import { changePassword, updateProfile } from '#lib/server/repo/users.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	return { me: requireUser(event) };
};

export const actions: Actions = {
	profile: async (event) => {
		const user = requireUser(event);
		const name = field(await event.request.formData(), 'name', 120);
		if (!name) return fail(400, { profileError: 'Please enter your name.' });
		await updateProfile(db(), user.id, name);
		return { profileSaved: true };
	},
	password: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const current = String(form.get('current') ?? '');
		const next = String(form.get('next') ?? '');
		if (next.length < 10)
			return fail(400, { passwordError: 'The new password needs at least 10 characters.' });
		if (!(await changePassword(db(), user.id, current, next)))
			return fail(400, { passwordError: 'Your current password is not right.' });
		return { passwordSaved: true };
	}
};
