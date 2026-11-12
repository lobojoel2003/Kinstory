import postgres from 'postgres';
import { config } from './config.ts';

export type Sql = postgres.Sql<Record<string, unknown>>;
export type Tx = postgres.TransactionSql<Record<string, unknown>>;
/** Either the pool or an open transaction. */
export type Db = Sql | Tx;

let pool: Sql | null = null;

/**
 * The shared connection pool. Column names are converted between snake_case
 * in Postgres and camelCase in TypeScript.
 */
export function db(): Sql {
	if (!pool) {
		pool = postgres(config().DATABASE_URL, {
			max: config().DATABASE_POOL_SIZE,
			transform: postgres.camel,
			onnotice: () => {},
			connection: { application_name: 'kinstory' }
		}) as Sql;
	}
	return pool;
}

export async function closeDb(): Promise<void> {
	if (pool) {
		const p = pool;
		pool = null;
		await p.end({ timeout: 5 });
	}
}
