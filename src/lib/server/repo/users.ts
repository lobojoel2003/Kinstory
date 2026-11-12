import type { User } from '#lib/types.ts';
import { hashPassword, verifyPassword } from '../auth.ts';
import type { Db } from '../db.ts';

export class EmailTakenError extends Error {
	constructor() {
		super('An account with that email already exists.');
	}
}

export async function createUser(
	sql: Db,
	input: { email: string; name: string; password: string }
): Promise<User> {
	const hash = await hashPassword(input.password);
	try {
		const [user] = await sql<User[]>`
			insert into users (email, name, password_hash)
			values (${input.email.trim()}, ${input.name.trim()}, ${hash})
			returning id, email, name, created_at`;
		return user;
	} catch (err) {
		if ((err as { code?: string }).code === '23505') throw new EmailTakenError();
		throw err;
	}
}

// A real hash to verify against when the email is unknown, so that response
// timing does not reveal which addresses have accounts.
let dummyHash: Promise<string> | null = null;

export async function authenticate(sql: Db, email: string, password: string): Promise<User | null> {
	const [row] = await sql<(User & { passwordHash: string })[]>`
		select id, email, name, created_at, password_hash from users where lower(email) = lower(${email.trim()})`;
	if (!row) {
		dummyHash ??= hashPassword('kinstory-timing-equaliser');
		await verifyPassword(password, await dummyHash);
		return null;
	}
	if (!(await verifyPassword(password, row.passwordHash))) return null;
	return { id: row.id, email: row.email, name: row.name, createdAt: row.createdAt };
}

export async function userCount(sql: Db): Promise<number> {
	const [r] = await sql<{ n: number }[]>`select count(*)::int as n from users`;
	return r.n;
}

export async function updateProfile(sql: Db, userId: string, name: string): Promise<void> {
	await sql`update users set name = ${name.trim()} where id = ${userId}`;
}

export async function changePassword(
	sql: Db,
	userId: string,
	current: string,
	next: string
): Promise<boolean> {
	const [row] = await sql<
		{ passwordHash: string }[]
	>`select password_hash from users where id = ${userId}`;
	if (!row || !(await verifyPassword(current, row.passwordHash))) return false;
	await sql`update users set password_hash = ${await hashPassword(next)} where id = ${userId}`;
	return true;
}
