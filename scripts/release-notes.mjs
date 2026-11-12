#!/usr/bin/env node
// Prints the CHANGELOG.md section for a version, for the GitHub release body.
//
//   node scripts/release-notes.mjs 1.0.0 > notes.md

import { readFileSync } from 'node:fs';

const version = (process.argv[2] ?? '').replace(/^v/, '');
if (!version) {
	console.error('usage: release-notes.mjs <version>');
	process.exit(1);
}
const text = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const lines = text.split('\n');
const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
if (start === -1) {
	console.error(`No CHANGELOG section for ${version}`);
	process.exit(1);
}
let end = lines.findIndex((l, i) => i > start && /^## \[/.test(l));
if (end === -1) end = lines.findIndex((l, i) => i > start && /^\[[^\]]+\]: /.test(l));
const body = lines
	.slice(start + 1, end === -1 ? undefined : end)
	.join('\n')
	.trim();
process.stdout.write(`${body}\n`);
