import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against the production build (`npm run build` first)
// with the fake transcriber, so no speech model is needed.
const PORT = Number(process.env.E2E_PORT ?? 4173);
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: 'tests/e2e',
	testMatch: '**/*.e2e.ts',
	timeout: 90_000,
	expect: { timeout: 15_000 },
	fullyParallel: false,
	workers: 1,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: BASE,
		trace: 'retain-on-failure',
		// Lets the suite use a browser installed elsewhere (e.g. a preinstalled Chromium).
		launchOptions: process.env.PW_CHROMIUM_PATH
			? { executablePath: process.env.PW_CHROMIUM_PATH }
			: {}
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'node build',
		url: `${BASE}/api/health`,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
		stdout: 'pipe',
		env: {
			PORT: String(PORT),
			ORIGIN: BASE,
			PUBLIC_URL: BASE,
			DATABASE_URL:
				process.env.DATABASE_URL_E2E ?? 'postgres://kinstory:kinstory@localhost:5432/kinstory_e2e',
			DATA_DIR: mkdtempSync(join(tmpdir(), 'kinstory-e2e-')),
			TRANSCRIBE_PROVIDER: 'fake',
			BODY_SIZE_LIMIT: '300M',
			WORKER_CONCURRENCY: '2'
		}
	}
});
