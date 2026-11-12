import { building, dev } from '$app/env';
import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit/hooks';
import { SESSION_COOKIE, validateSession } from '#lib/server/auth.ts';
import { config } from '#lib/server/config.ts';
import { db } from '#lib/server/db.ts';
import { log } from '#lib/server/log.ts';
import { startRuntime } from '#lib/server/runtime.ts';

export const init: ServerInit = async () => {
	if (building) return;
	await startRuntime();
};

// Paths that receive cross-site POSTs by design. They authenticate with the
// voice gateway's HMAC signature instead of a same-origin check.
const SIGNED_WEBHOOKS = /^\/api\/voice\//;
// Pages reached through private links: never leak the token in a Referer.
const PRIVATE_LINKS = /^\/(a|l|invite)\//;

function isFormLike(request: Request): boolean {
	const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
	return (
		!type ||
		type === 'application/x-www-form-urlencoded' ||
		type === 'multipart/form-data' ||
		type === 'text/plain'
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	const { request, url } = event;

	// CSRF: SvelteKit's own check is turned off (see vite.config.ts) so the
	// voice webhooks can work; this applies the same rule everywhere else.
	if (
		!dev &&
		['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) &&
		isFormLike(request) &&
		!SIGNED_WEBHOOKS.test(url.pathname)
	) {
		const origin = request.headers.get('origin');
		const publicOrigin = config().publicUrl ? new URL(config().publicUrl!).origin : null;
		if (!origin || (origin !== url.origin && origin !== publicOrigin)) {
			return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
				status: 403
			});
		}
	}

	event.locals.user = null;
	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const session = await validateSession(db(), token);
		if (session) {
			event.locals.user = session.user;
			event.cookies.set(SESSION_COOKIE, token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: url.protocol === 'https:',
				expires: session.expiresAt
			});
		} else {
			event.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}

	const response = await resolve(event);
	const h = response.headers;
	h.set('x-content-type-options', 'nosniff');
	h.set('x-frame-options', 'DENY');
	h.set(
		'referrer-policy',
		PRIVATE_LINKS.test(url.pathname) ? 'no-referrer' : 'strict-origin-when-cross-origin'
	);
	h.set('permissions-policy', 'microphone=(self), camera=(), geolocation=()');
	if (url.protocol === 'https:') h.set('strict-transport-security', 'max-age=31536000');
	return response;
};

export const handleError: HandleServerError = ({ error, event, kind }) => {
	if (kind === 'unknown') {
		log.error('request failed', {
			path: event.url.pathname,
			err: error instanceof Error ? error : new Error(String(error))
		});
	}
};
