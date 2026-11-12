// Process start-up: migrate the database, start the background worker and,
// when asked, create the demo family.

import { config } from './config.ts';
import { closeDb, db } from './db.ts';
import { Worker } from './jobs.ts';
import { log } from './log.ts';
import { migrate } from './migrate.ts';
import { renderFailed, renderJob } from './services/book.ts';
import { transcribeFailed, transcribeJob } from './services/capture.ts';
import { deliverPromptJob, scheduleTick } from './services/delivery.ts';
import { fetchPhoneRecordingJob } from './services/phone.ts';
import { deleteExpiredSessions } from './auth.ts';

let started: Promise<void> | null = null;
let worker: Worker | null = null;

export function startRuntime(): Promise<void> {
	started ??= (async () => {
		const c = config();
		const sql = db();
		const applied = await migrate(sql);
		if (applied.length) log.info('database migrated', { applied });
		if (c.SEED_DEMO) {
			const { seedDemo } = await import('./demo/seed.ts');
			const demo = await seedDemo(sql);
			if (demo) {
				const { requestRender } = await import('./services/book.ts');
				const { getProject } = await import('./repo/projects.ts');
				const project = await getProject(sql, demo.projectId);
				if (project) await requestRender(sql, project, null);
				log.info('demo ready', { email: demo.email, password: demo.password });
			}
		}
		if (c.WORKER) {
			worker = new Worker(
				sql,
				{
					transcribe: transcribeJob as never,
					render: renderJob as never,
					'fetch-phone-recording': fetchPhoneRecordingJob as never,
					'deliver-prompt': deliverPromptJob as never
				},
				{
					concurrency: c.WORKER_CONCURRENCY,
					onFailed: async (job, err) => {
						if (job.kind === 'transcribe') await transcribeFailed(sql, job, err);
						if (job.kind === 'render') await renderFailed(sql, job, err);
					},
					tick: async () => {
						await scheduleTick(sql);
						await deleteExpiredSessions(sql);
					}
				}
			);
			worker.start();
		}
		// adapter-node emits this on SIGTERM/SIGINT once requests have drained.
		process.once('sveltekit:shutdown' as never, () => {
			void stopRuntime().then(closeDb);
		});
	})().catch((err) => {
		started = null;
		throw err;
	});
	return started;
}

/** Nudges the worker after enqueueing so work starts without waiting for the next poll. */
export function pokeWorker(): void {
	worker?.poke();
}

export async function stopRuntime(): Promise<void> {
	await worker?.stop();
}
