import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Sql } from './db.ts';
import { log } from './log.ts';
import { migrationsDir } from './paths.ts';

const LOCK_ID = 727_274_001;

/**
 * Applies pending migrations from migrations/*.sql in name order. Safe to run
 * from several processes at once: an advisory lock serialises them.
 */
export async function migrate(sql: Sql, dir = migrationsDir()): Promise<string[]> {
	const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
	const applied: string[] = [];
	await sql.reserve().then(async (conn) => {
		try {
			await conn`select pg_advisory_lock(${LOCK_ID})`;
			await conn`
				create table if not exists schema_migrations (
					version text primary key,
					applied_at timestamptz not null default now()
				)`;
			const done = new Set(
				(await conn<{ version: string }[]>`select version from schema_migrations`).map(
					(r) => r.version
				)
			);
			for (const file of files) {
				if (done.has(file)) continue;
				const text = await readFile(join(dir, file), 'utf8');
				await conn.unsafe('begin');
				try {
					await conn.unsafe(text);
					await conn`insert into schema_migrations (version) values (${file})`;
					await conn.unsafe('commit');
				} catch (err) {
					await conn.unsafe('rollback');
					throw new Error(`Migration ${file} failed: ${(err as Error).message}`, { cause: err });
				}
				applied.push(file);
				log.info('migration applied', { file });
			}
		} finally {
			await conn`select pg_advisory_unlock(${LOCK_ID})`.catch(() => {});
			conn.release();
		}
	});
	return applied;
}
