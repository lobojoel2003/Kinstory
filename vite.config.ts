import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
	version: string;
};

function gitSha(): string {
	if (process.env.GIT_SHA) return process.env.GIT_SHA.slice(0, 7);
	try {
		return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		return 'unknown';
	}
}

const build = {
	version: pkg.version,
	number: process.env.BUILD_NUMBER || 'dev',
	sha: gitSha(),
	date: process.env.BUILD_DATE || new Date().toISOString()
};

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(build.version),
		__BUILD_NUMBER__: JSON.stringify(build.number),
		__GIT_SHA__: JSON.stringify(build.sha),
		__BUILD_DATE__: JSON.stringify(build.date)
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ out: 'build' }),
			// The phone gateway posts forms from its own servers; those webhooks are
			// verified by signature, and src/hooks.server.ts applies the usual
			// same-origin rule to every other route.
			csrf: { trustedOrigins: ['*'] },
			version: { name: `${build.version}+${build.number}.${build.sha}` }
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.{test,spec}.ts', 'tests/unit/**/*.test.ts'],
					exclude: ['src/**/*.svelte.{test,spec}.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'integration',
					environment: 'node',
					include: ['tests/integration/**/*.test.ts'],
					fileParallelism: false,
					testTimeout: 120_000,
					hookTimeout: 60_000
				}
			}
		]
	}
});
