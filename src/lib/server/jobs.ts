// Durable background jobs backed by the `jobs` table. Workers claim work with
// SELECT … FOR UPDATE SKIP LOCKED, so any number of Kinstory processes can
// share the queue, and nothing is lost if one restarts mid-job.

import type { Db, Sql } from './db.ts';
import { log } from './log.ts';

export type JobKind = 'transcribe' | 'render' | 'fetch-phone-recording' | 'deliver-prompt';

export interface Job<P = Record<string, unknown>> {
	id: number;
	kind: JobKind;
	payload: P;
	attempts: number;
	maxAttempts: number;
}

export type Handler = (job: Job<never>, sql: Sql) => Promise<void>;

export async function enqueue(
	sql: Db,
	kind: JobKind,
	payload: Record<string, unknown>,
	opts: { runAt?: Date; maxAttempts?: number } = {}
): Promise<number> {
	const [row] = await sql<{ id: number }[]>`
		insert into jobs (kind, payload, run_at, max_attempts)
		values (${kind}, ${sql.json(payload as never)}, ${opts.runAt ?? new Date()}, ${opts.maxAttempts ?? 3})
		returning id`;
	return Number(row.id);
}

/** Claims one ready job, or returns null. */
export async function claim(sql: Sql, kinds: JobKind[]): Promise<Job | null> {
	const [row] = await sql<Job[]>`
		update jobs set status = 'running', locked_at = now(), attempts = attempts + 1
		where id = (
			select id from jobs
			where status = 'queued' and run_at <= now() and kind in ${sql(kinds)}
			order by run_at, id
			for update skip locked
			limit 1
		)
		returning id, kind, payload, attempts, max_attempts`;
	return row ? { ...row, id: Number(row.id) } : null;
}

export async function complete(sql: Sql, id: number): Promise<void> {
	await sql`update jobs set status = 'done', finished_at = now(), locked_at = null where id = ${id}`;
}

/** Records a failure; retries with exponential backoff until attempts run out. */
export async function fail(sql: Sql, job: Job, err: unknown): Promise<'retry' | 'failed'> {
	const message = err instanceof Error ? err.message : String(err);
	if (job.attempts < job.maxAttempts) {
		const delay = Math.min(30 * 2 ** (job.attempts - 1), 3600);
		await sql`
			update jobs set status = 'queued', locked_at = null, last_error = ${message},
				run_at = now() + make_interval(secs => ${delay})
			where id = ${job.id}`;
		return 'retry';
	}
	await sql`update jobs set status = 'failed', locked_at = null, last_error = ${message}, finished_at = now() where id = ${job.id}`;
	return 'failed';
}

/** Re-queues jobs left "running" by a process that died (locked for over `minutes`). */
export async function recoverStale(sql: Sql, minutes = 30): Promise<number> {
	const r = await sql`
		update jobs set status = 'queued', locked_at = null
		where status = 'running' and locked_at < now() - make_interval(mins => ${minutes})`;
	return r.count;
}

export interface WorkerOptions {
	concurrency: number;
	pollMs?: number;
	/** Called after a job permanently fails, to mark the related record. */
	onFailed?: (job: Job, err: unknown) => Promise<void>;
	/** Runs every minute, e.g. to send scheduled prompts. */
	tick?: () => Promise<void>;
}

export class Worker {
	private running = false;
	private active = 0;
	private timers: NodeJS.Timeout[] = [];
	private wake: (() => void) | null = null;

	constructor(
		private sql: Sql,
		private handlers: Partial<Record<JobKind, Handler>>,
		private opts: WorkerOptions
	) {}

	start(): void {
		if (this.running) return;
		this.running = true;
		for (let i = 0; i < this.opts.concurrency; i++) void this.loop(i);
		const tick = async () => {
			try {
				await recoverStale(this.sql);
				await this.opts.tick?.();
			} catch (err) {
				log.error('worker tick failed', { err });
			}
		};
		const interval = setInterval(tick, 60_000);
		interval.unref();
		this.timers.push(interval);
		void tick();
		log.info('worker started', {
			concurrency: this.opts.concurrency,
			kinds: Object.keys(this.handlers)
		});
	}

	/** Wakes idle loops immediately, e.g. right after enqueueing. */
	poke(): void {
		this.wake?.();
	}

	async stop(): Promise<void> {
		this.running = false;
		this.timers.forEach(clearInterval);
		this.poke();
		while (this.active > 0) await new Promise((r) => setTimeout(r, 100));
	}

	private async loop(n: number) {
		const kinds = Object.keys(this.handlers) as JobKind[];
		while (this.running) {
			let job: Job | null = null;
			try {
				job = await claim(this.sql, kinds);
			} catch (err) {
				log.error('job claim failed', { err, loop: n });
			}
			if (!job) {
				await new Promise<void>((resolve) => {
					const t = setTimeout(resolve, this.opts.pollMs ?? 2000);
					t.unref();
					this.wake = () => {
						clearTimeout(t);
						resolve();
					};
				});
				continue;
			}
			this.active++;
			const started = Date.now();
			try {
				await this.handlers[job.kind]!(job as Job<never>, this.sql);
				await complete(this.sql, job.id);
				log.info('job done', { id: job.id, kind: job.kind, ms: Date.now() - started });
			} catch (err) {
				const outcome = await fail(this.sql, job, err).catch(() => 'failed' as const);
				log.warn('job error', { id: job.id, kind: job.kind, attempt: job.attempts, outcome, err });
				if (outcome === 'failed') await this.opts.onFailed?.(job, err).catch(() => {});
			} finally {
				this.active--;
			}
		}
	}
}
