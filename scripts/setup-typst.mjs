#!/usr/bin/env node
// Downloads the pinned Typst CLI into .tools/bin so that local development and
// tests do not depend on a system-wide install. Docker images install Typst
// in their own build stage, so this script is only for working on Kinstory.
//
//   node scripts/setup-typst.mjs          # install if missing
//   node scripts/setup-typst.mjs --force  # reinstall

import { execFileSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { chmod, rename } from 'node:fs/promises';
import { arch, platform, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const root = resolve(import.meta.dirname, '..');
const { typst: TYPST_VERSION } = JSON.parse(readFileSync(join(root, 'tools.json'), 'utf8'));
const binDir = join(root, '.tools', 'bin');
const exe = platform() === 'win32' ? 'typst.exe' : 'typst';
const target = join(binDir, exe);

const targets = {
	'linux-x64': 'x86_64-unknown-linux-musl',
	'linux-arm64': 'aarch64-unknown-linux-musl',
	'darwin-x64': 'x86_64-apple-darwin',
	'darwin-arm64': 'aarch64-apple-darwin',
	'win32-x64': 'x86_64-pc-windows-msvc'
};

function installedVersion() {
	if (!existsSync(target)) return null;
	try {
		return execFileSync(target, ['--version'], { encoding: 'utf8' }).trim();
	} catch {
		return null;
	}
}

const force = process.argv.includes('--force');
const current = installedVersion();
if (!force && current?.includes(TYPST_VERSION)) {
	console.log(`typst ${TYPST_VERSION} already installed at ${target}`);
	process.exit(0);
}

const triple = targets[`${platform()}-${arch()}`];
if (!triple) {
	console.error(
		`No prebuilt Typst for ${platform()}-${arch()}. Install Typst ${TYPST_VERSION} yourself and set TYPST_BIN.`
	);
	process.exit(1);
}

const isZip = platform() === 'win32';
const asset = `typst-${triple}.${isZip ? 'zip' : 'tar.xz'}`;
const url = `https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/${asset}`;
const work = join(tmpdir(), `kinstory-typst-${process.pid}`);
mkdirSync(work, { recursive: true });
mkdirSync(binDir, { recursive: true });

console.log(`Downloading ${url}`);
const res = await fetch(url);
if (!res.ok || !res.body) {
	console.error(`Download failed: HTTP ${res.status}`);
	process.exit(1);
}
const archive = join(work, asset);
await pipeline(Readable.fromWeb(res.body), createWriteStream(archive));

if (isZip) {
	execFileSync('tar', ['-xf', archive, '-C', work]);
} else {
	execFileSync('tar', ['-xJf', archive, '-C', work]);
}
await rename(join(work, `typst-${triple}`, exe), target);
await chmod(target, 0o755);
rmSync(work, { recursive: true, force: true });

console.log(`Installed ${installedVersion()} → ${target}`);
