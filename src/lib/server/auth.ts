import {
	createHash,
	randomBytes,
	randomInt,
	scrypt as scryptCb,
	timingSafeEqual
} from 'node:crypto';
import { promisify } from 'node:util';
import { config } from './config.ts';
import type { Db } from './db.ts';

const scrypt = promisify(scryptCb) as (
	pw: string,
	salt: Buffer,
	len: number,
	opts: object
) => Promise<Buffer>;

export const SESSION_COOKIE = 'kinstory_session';
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const hash = await scrypt(password.normalize('NFKC'), salt, KEYLEN, {
		N,
		r: R,
		p: P,
		maxmem: 64 * 1024 * 1024
	});
	return `scrypt$${N}$${R}$${P}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const parts = stored.split('$');
	if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
	const [, n, r, p, saltB64, hashB64] = parts;
	const expected = Buffer.from(hashB64, 'base64url');
	const actual = await scrypt(
		password.normalize('NFKC'),
		Buffer.from(saltB64, 'base64url'),
		expected.length,
		{
			N: Number(n),
			r: Number(r),
			p: Number(p),
			maxmem: 64 * 1024 * 1024
		}
	);
	return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** URL-safe random token with `bytes` bytes of entropy. */
export function randomToken(bytes = 24): string {
	return randomBytes(bytes).toString('base64url');
}

export function sha256(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

/** Six-digit code a storyteller can key in when calling from an unknown number. */
export function randomPin(): string {
	return String(randomInt(100000, 1000000));
}

export interface SessionUser {
	id: string;
	email: string;
	name: string;
}

export async function createSession(
	sql: Db,
	userId: string
): Promise<{ token: string; expiresAt: Date }> {
	const token = randomToken(32);
	const expiresAt = new Date(Date.now() + config().SESSION_DAYS * 86_400_000);
	await sql`insert into sessions (id, user_id, expires_at) values (${sha256(token)}, ${userId}, ${expiresAt})`;
	return { token, expiresAt };
}

/**
 * Looks up the user for a session token. Sessions slide: one used in the
 * second half of its life is extended, so active people stay signed in.
 */
export async function validateSession(
	sql: Db,
	token: string
): Promise<{ user: SessionUser; expiresAt: Date } | null> {
	const id = sha256(token);
	const [row] = await sql<{ id: string; email: string; name: string; expiresAt: Date }[]>`
		select u.id, u.email, u.name, s.expires_at
		from sessions s join users u on u.id = s.user_id
		where s.id = ${id}`;
	if (!row) return null;
	const now = Date.now();
	if (row.expiresAt.getTime() <= now) {
		await sql`delete from sessions where id = ${id}`;
		return null;
	}
	const life = config().SESSION_DAYS * 86_400_000;
	let expiresAt = row.expiresAt;
	if (row.expiresAt.getTime() - now < life / 2) {
		expiresAt = new Date(now + life);
		await sql`update sessions set expires_at = ${expiresAt} where id = ${id}`;
	}
	return { user: { id: row.id, email: row.email, name: row.name }, expiresAt };
}

export async function deleteSession(sql: Db, token: string): Promise<void> {
	await sql`delete from sessions where id = ${sha256(token)}`;
}

export async function deleteExpiredSessions(sql: Db): Promise<number> {
	const r = await sql`delete from sessions where expires_at < now()`;
	return r.count;
}
