import { json } from '@sveltejs/kit';
import { db } from '#lib/server/db.ts';
import { version } from '#lib/version.ts';
import type { RequestHandler } from './$types';

/** Liveness and readiness for containers and uptime monitors. */
export const GET: RequestHandler = async () => {
	let database = 'ok';
	try {
		await db()`select 1`;
	} catch {
		database = 'unavailable';
	}
	const healthy = database === 'ok';
	return json(
		{ status: healthy ? 'ok' : 'degraded', database, ...version },
		{ status: healthy ? 200 : 503, headers: { 'cache-control': 'no-store' } }
	);
};
