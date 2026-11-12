import type { Delivery, Prompt, Storyteller } from '#lib/types.ts';
import { randomPin, randomToken } from '../auth.ts';
import type { Db } from '../db.ts';

export class PhoneTakenError extends Error {
	constructor() {
		super('That phone number already belongs to another storyteller.');
	}
}

/** Normalises a phone number to E.164 where possible: "(555) 555-0142" → "+15555550142". */
export function normalizePhone(
	input: string | null | undefined,
	defaultCountry = '1'
): string | null {
	if (!input) return null;
	const trimmed = input.trim();
	if (!trimmed) return null;
	const digits = trimmed.replace(/[^\d]/g, '');
	if (trimmed.startsWith('+')) return digits.length >= 8 ? `+${digits}` : null;
	if (trimmed.startsWith('00')) return digits.length >= 10 ? `+${digits.slice(2)}` : null;
	if (digits.length === 10 && defaultCountry === '1') return `+1${digits}`;
	if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
	return digits.length >= 8 ? `+${digits}` : null;
}

export async function createStoryteller(
	sql: Db,
	projectId: string,
	input: { name: string; phone?: string | null }
): Promise<Storyteller> {
	// PINs are unique; retry on the rare collision.
	for (let attempt = 0; attempt < 8; attempt++) {
		try {
			const [row] = await sql<Storyteller[]>`
				insert into storytellers (project_id, name, phone, pin, answer_token)
				values (${projectId}, ${input.name.trim()}, ${normalizePhone(input.phone)}, ${randomPin()}, ${randomToken(18)})
				returning *`;
			return row;
		} catch (err) {
			const e = err as { code?: string; constraint_name?: string };
			if (e.code === '23505' && e.constraint_name === 'storytellers_phone_key')
				throw new PhoneTakenError();
			if (e.code !== '23505') throw err;
		}
	}
	throw new Error('Could not allocate a storyteller code');
}

export async function listStorytellers(sql: Db, projectId: string): Promise<Storyteller[]> {
	return sql<
		Storyteller[]
	>`select * from storytellers where project_id = ${projectId} order by created_at`;
}

export async function getStoryteller(
	sql: Db,
	projectId: string,
	id: string
): Promise<Storyteller | null> {
	if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
	const [row] = await sql<
		Storyteller[]
	>`select * from storytellers where id = ${id} and project_id = ${projectId}`;
	return row ?? null;
}

export async function storytellerById(sql: Db, id: string): Promise<Storyteller | null> {
	if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
	const [row] = await sql<Storyteller[]>`select * from storytellers where id = ${id}`;
	return row ?? null;
}

export async function storytellerByToken(sql: Db, token: string): Promise<Storyteller | null> {
	if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
	const [row] = await sql<Storyteller[]>`select * from storytellers where answer_token = ${token}`;
	return row ?? null;
}

export async function storytellerByPhone(sql: Db, phone: string): Promise<Storyteller | null> {
	const p = normalizePhone(phone);
	if (!p) return null;
	const [row] = await sql<Storyteller[]>`select * from storytellers where phone = ${p}`;
	return row ?? null;
}

export async function storytellerByPin(sql: Db, pin: string): Promise<Storyteller | null> {
	if (!/^\d{6}$/.test(pin)) return null;
	const [row] = await sql<Storyteller[]>`select * from storytellers where pin = ${pin}`;
	return row ?? null;
}

export interface StorytellerUpdate {
	name: string;
	phone: string | null;
	email: string | null;
	delivery: Delivery;
	timezone: string;
	callDay: number | null;
	callTime: string | null;
}

export async function updateStoryteller(
	sql: Db,
	projectId: string,
	id: string,
	u: StorytellerUpdate
): Promise<void> {
	try {
		await sql`
			update storytellers set
				name = ${u.name.trim()}, phone = ${normalizePhone(u.phone)}, email = ${u.email?.trim() || null},
				delivery = ${u.delivery}, timezone = ${u.timezone}, call_day = ${u.callDay}, call_time = ${u.callTime}
			where id = ${id} and project_id = ${projectId}`;
	} catch (err) {
		const e = err as { code?: string; constraint_name?: string };
		if (e.code === '23505' && e.constraint_name === 'storytellers_phone_key')
			throw new PhoneTakenError();
		throw err;
	}
}

export async function rotateAnswerLink(sql: Db, projectId: string, id: string): Promise<void> {
	await sql`update storytellers set answer_token = ${randomToken(18)} where id = ${id} and project_id = ${projectId}`;
}

export async function deleteStoryteller(sql: Db, projectId: string, id: string): Promise<void> {
	await sql`delete from storytellers where id = ${id} and project_id = ${projectId}`;
}

/**
 * The question a storyteller should answer next: the oldest one already sent
 * and still open, otherwise the first one waiting in the queue.
 */
export async function currentPrompt(sql: Db, teller: Storyteller): Promise<Prompt | null> {
	const [row] = await sql<Prompt[]>`
		select * from prompts
		where project_id = ${teller.projectId}
			and (storyteller_id = ${teller.id} or storyteller_id is null)
			and status in ('sent', 'queued')
		order by (status = 'sent') desc, position, created_at
		limit 1`;
	return row ?? null;
}

/** Open questions, for the "answer a different question" list. */
export async function openPrompts(sql: Db, teller: Storyteller, limit = 12): Promise<Prompt[]> {
	return sql<Prompt[]>`
		select * from prompts
		where project_id = ${teller.projectId}
			and (storyteller_id = ${teller.id} or storyteller_id is null)
			and status in ('sent', 'queued')
		order by (status = 'sent') desc, position, created_at
		limit ${limit}`;
}

export async function markPrompted(sql: Db, tellerId: string, at = new Date()): Promise<void> {
	await sql`update storytellers set last_prompted_at = ${at} where id = ${tellerId}`;
}
