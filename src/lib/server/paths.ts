import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Directory holding templates/, fonts/ and migrations/. In development and in
 * the Docker image this is the working directory; KINSTORY_ASSETS_DIR
 * overrides it for unusual layouts.
 */
export function assetsDir(): string {
	return resolve(process.env.KINSTORY_ASSETS_DIR || process.cwd());
}

export const templatesDir = () => join(assetsDir(), 'templates');
export const fontsDir = () => join(assetsDir(), 'fonts');
export const migrationsDir = () => join(assetsDir(), 'migrations');

/** Typst binary: TYPST_BIN, then the copy installed by `npm run setup:typst`, then PATH. */
export function typstBin(): string {
	if (process.env.TYPST_BIN) return process.env.TYPST_BIN;
	const local = join(
		assetsDir(),
		'.tools',
		'bin',
		process.platform === 'win32' ? 'typst.exe' : 'typst'
	);
	return existsSync(local) ? local : 'typst';
}
