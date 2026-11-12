import { error, fail, redirect } from '@sveltejs/kit';
import { createSession, SESSION_COOKIE } from '#lib/server/auth.ts';
import { config } from '#lib/server/config.ts';
import { db } from '#lib/server/db.ts';
import { field, safeNext } from '#lib/server/guard.ts';
import { limited } from '#lib/server/ratelimit.ts';
import { createUser, EmailTakenError, userCount } from '#lib/server/repo/users.ts';
import type { Actions, PageServerLoad } from './$types';

// Sign-up can be closed after the family has joined (ALLOW_SIGNUP=false);
// the very first account and invitation links always work.
async function signupOpen(next: string | null): Promise<boolean> {
	if (config().ALLOW_SIGNUP) return true;
	if (next?.startsWith('/invite/')) return true;
	return (await userCount(db())) === 0;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) redirect(303, safeNext(url.searchParams.get('next')));
	const next = url.searchParams.get('next');
	if (!(await signupOpen(next)))
		error(
			403,
			'New accounts are closed on this Kinstory. Ask the person who runs it for an invitation.'
		);
	return { next };
};

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		if (!(await signupOpen(url.searchParams.get('next'))))
			error(403, 'New accounts are closed on this Kinstory.');
		const form = await request.formData();
		const name = field(form, 'name', 120);
		const email = field(form, 'email', 320);
		const password = (form.get('password') as string | null) ?? '';
		const values = { name, email };
		if (limited(`signup:${getClientAddress()}`, 10, 60 * 60_000)) {
			return fail(429, {
				...values,
				error: 'Too many new accounts from here. Please try again later.'
			});
		}
		if (!name)
			return fail(400, {
				...values,
				error: 'Please tell us your name — it appears beside the questions you ask.'
			});
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
			return fail(400, { ...values, error: 'Please enter a valid email address.' });
		if (password.length < 10)
			return fail(400, { ...values, error: 'Please choose a password of at least 10 characters.' });
		try {
			const user = await createUser(db(), { name, email, password });
			const { token, expiresAt } = await createSession(db(), user.id);
			cookies.set(SESSION_COOKIE, token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: url.protocol === 'https:',
				expires: expiresAt
			});
		} catch (err) {
			if (err instanceof EmailTakenError)
				return fail(400, {
					...values,
					error: 'There is already an account with that email. Try signing in.'
				});
			throw err;
		}
		redirect(303, safeNext(url.searchParams.get('next'), '/projects/new'));
	}
};
