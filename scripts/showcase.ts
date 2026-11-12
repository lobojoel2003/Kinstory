// Renders the demo book and composes the spreads shown on the landing page
// and in the README: static/showcase/*.webp and docs/images/*.jpg.
//
//   npm run showcase

import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { renderCover, renderInterior } from '../src/lib/server/book/render.ts';
import { demoBookInput } from '../src/lib/server/demo/fixture.ts';
import type { ThemeId } from '../src/lib/book-options.ts';

const root = resolve(import.meta.dirname, '..');
const site = join(root, 'static', 'showcase');
const docs = join(root, 'docs', 'images');
await mkdir(site, { recursive: true });
await mkdir(docs, { recursive: true });

const PAGE_W = 660;
const PAGE_H = 990;
const BG = '#efe8dc';

async function render(theme: ThemeId) {
	const dir = await mkdtemp(join(tmpdir(), `kinstory-showcase-${theme}-`));
	const input = await demoBookInput({ theme, listenQr: true });
	const interior = await renderInterior(input, dir, { previews: true, previewPpi: 110 });
	const cover = await renderCover(input, interior.pages, dir);
	const page = (n: number) => join(dir, 'pages', `${String(n).padStart(4, '0')}.webp`);
	return { dir, pages: interior.pages, page, cover };
}

/** Two pages side by side with a gutter shadow, on a paper-coloured backdrop. */
async function spread(left: string | null, right: string | null, pad = 40): Promise<Buffer> {
	const width = PAGE_W * 2 + pad * 2;
	const height = PAGE_H + pad * 2;
	const shadow = Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><filter id="b"><feGaussianBlur stdDeviation="14"/></filter></defs><rect x="${pad + 6}" y="${pad + 16}" width="${PAGE_W * 2 - 12}" height="${PAGE_H - 8}" fill="#5a4630" opacity="0.28" filter="url(#b)"/></svg>`
	);
	const gutter = Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="${PAGE_H}"><defs><linearGradient id="g"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.45" stop-color="#000" stop-opacity="0.07"/><stop offset="0.5" stop-color="#000" stop-opacity="0.14"/><stop offset="0.56" stop-color="#000" stop-opacity="0.04"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs><rect width="80" height="${PAGE_H}" fill="url(#g)"/></svg>`
	);
	const layers: sharp.OverlayOptions[] = [{ input: shadow, top: 0, left: 0 }];
	const blank = await sharp({
		create: { width: PAGE_W, height: PAGE_H, channels: 3, background: '#ffffff' }
	})
		.png()
		.toBuffer();
	layers.push({
		input: left ? await sharp(left).resize(PAGE_W, PAGE_H).toBuffer() : blank,
		top: pad,
		left: pad
	});
	layers.push({
		input: right ? await sharp(right).resize(PAGE_W, PAGE_H).toBuffer() : blank,
		top: pad,
		left: pad + PAGE_W
	});
	layers.push({ input: gutter, top: pad, left: pad + PAGE_W - 40 });
	return sharp({ create: { width, height, channels: 3, background: BG } })
		.composite(layers)
		.png()
		.toBuffer();
}

async function save(name: string, png: Buffer) {
	await sharp(png)
		.webp({ quality: 84 })
		.toFile(join(site, `${name}.webp`));
	await sharp(png)
		.jpeg({ quality: 86, mozjpeg: true })
		.toFile(join(docs, `${name}.jpg`));
	console.log(`  ${name}`);
}

const heirloom = await render('heirloom');
const caslon = await render('caslon');
const modern = await render('modern');
try {
	console.log(`heirloom: ${heirloom.pages} pages`);
	await save('cover', await sharp(heirloom.cover.front).resize(PAGE_W, PAGE_H).png().toBuffer());
	await save(
		'cover-spread',
		await sharp(heirloom.cover.preview).resize({ width: 1600 }).png().toBuffer()
	);
	await save('spread-title', await spread(heirloom.page(2), heirloom.page(3)));
	await save('spread-opening', await spread(heirloom.page(12), heirloom.page(13)));
	await save('spread-photo', await spread(heirloom.page(14), heirloom.page(15)));
	await save('spread-themes', await spread(caslon.page(11), modern.page(11)));
	await save(
		'spread-questions',
		await spread(heirloom.page(heirloom.pages - 4), heirloom.page(heirloom.pages - 3))
	);
} finally {
	for (const r of [heirloom, caslon, modern]) await rm(r.dir, { recursive: true, force: true });
}
