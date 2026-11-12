#!/usr/bin/env node
// Release guard used by CI: the git tag (v1.2.3) must match package.json,
// and CHANGELOG.md must have a section for that version.
//
//   node scripts/check-version.mjs v1.2.3
//   node scripts/check-version.mjs            # uses GITHUB_REF_NAME on tag builds

import { readFileSync } from 'node:fs';

// On tag builds GitHub sets GITHUB_REF_TYPE=tag; branch builds only check the changelog.
const tag =
	process.argv[2] ??
	(process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : '') ??
	'';
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');

const semver = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;
const fail = (msg) => {
	console.error(`✗ ${msg}`);
	process.exit(1);
};

if (!semver.test(pkg.version)) fail(`package.json version "${pkg.version}" is not SemVer`);
if (tag) {
	if (!semver.test(tag)) fail(`tag "${tag}" is not a SemVer tag like v1.2.3`);
	if (tag.replace(/^v/, '') !== pkg.version)
		fail(`tag ${tag} does not match package.json version ${pkg.version}`);
}
if (!new RegExp(`^## \\[${pkg.version.replace(/\./g, '\\.')}\\]`, 'm').test(changelog)) {
	fail(`CHANGELOG.md has no "## [${pkg.version}]" section`);
}
console.log(`✓ version ${pkg.version}${tag ? ` matches tag ${tag}` : ''} and has release notes`);
