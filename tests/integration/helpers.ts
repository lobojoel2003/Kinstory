// Shared set-up for integration tests: a disposable database schema, a
// temporary data directory and the fake transcriber.

import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.DATABASE_URL =
	process.env.DATABASE_URL_TEST ?? 'postgres://kinstory:kinstory@localhost:5432/kinstory_test';
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'kinstory-test-data-'));
process.env.TRANSCRIBE_PROVIDER = 'fake';
process.env.PUBLIC_URL = 'https://kinstory.test';
process.env.TWILIO_ACCOUNT_SID = 'AC00000000000000000000000000000000';
process.env.TWILIO_AUTH_TOKEN = 'test-token';
process.env.TWILIO_PHONE_NUMBER = '+15550100199';

const { resetConfig } = await import('#lib/server/config.ts');
resetConfig();
const { closeDb, db } = await import('#lib/server/db.ts');
const { migrate } = await import('#lib/server/migrate.ts');

export { closeDb, db };

/** Drops and recreates the schema, then applies every migration. */
export async function freshDatabase(): Promise<void> {
	const sql = db();
	await sql.unsafe('drop schema if exists public cascade; create schema public;');
	await migrate(sql);
}

/** A short spoken-length WAV made with ffmpeg, standing in for a voice note. */
export function makeAudio(seconds = 3): string {
	const file = join(mkdtempSync(join(tmpdir(), 'kinstory-audio-')), 'note.wav');
	execFileSync('ffmpeg', [
		'-hide_banner',
		'-loglevel',
		'error',
		'-y',
		'-f',
		'lavfi',
		'-i',
		`sine=frequency=330:duration=${seconds}`,
		'-ac',
		'1',
		file
	]);
	return file;
}

export function hasBinary(bin: string, args = ['--version']): boolean {
	try {
		execFileSync(bin, args, { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}
