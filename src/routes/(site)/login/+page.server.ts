import { fail, redirect } from '@sveltejs/kit';
import { createSession, SESSION_COOKIE } from '#lib/server/auth.ts';
import { config } from '#lib/server/config.ts';
import { db } from '#lib/server/db.ts';
import { field, safeNext } from '#lib/server/guard.ts';
import { limited } from '#lib/server/ratelimit.ts';
import { authenticate } from '#lib/server/repo/users.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, safeNext(url.searchParams.get('next')));
	return { allowSignup: config().ALLOW_SIGNUP, next: url.searchParams.get('next') };
};

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const form = await request.formData();
		const email = field(form, 'email', 320) ?? '';
		const password = (form.get('password') as string | null) ?? '';
		if (
			limited(`login:${getClientAddress()}`, 20, 15 * 60_000) ||
			limited(`login:${email.toLowerCase()}`, 8, 15 * 60_000)
		) {
			return fail(429, {
				email,
				error: 'Too many attempts. Please wait a few minutes and try again.'
			});
		}
		const user = await authenticate(db(), email, password);
		if (!user)
			return fail(400, { email, error: 'That email and password don’t match an account.' });
		const { token, expiresAt } = await createSession(db(), user.id);
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			expires: expiresAt
		});
		redirect(303, safeNext(url.searchParams.get('next')));
	}
};
