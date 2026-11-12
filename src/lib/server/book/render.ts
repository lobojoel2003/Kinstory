// Runs Typst over a temporary working directory holding the templates, the
// JSON data and print-ready copies of every photo.

import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { TRIMS, spineWidth } from '#lib/book-options.ts';
import { prepareForPrint } from '../images.ts';
import { fontsDir, templatesDir, typstBin } from '../paths.ts';
import { buildBookData, buildCoverData, type Asset, type BookInput } from './book-data.ts';

const TEMPLATE_FILES = ['theme.typ', 'book.typ', 'cover.typ'];
const TIMEOUT_MS = 10 * 60 * 1000;

export class TypstError extends Error {
	constructor(
		message: string,
		readonly stderr: string
	) {
		super(message);
		this.name = 'TypstError';
	}
}

function run(bin: string, args: string[], cwd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile(
			bin,
			args,
			{ cwd, timeout: TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024 },
			(err, stdout, stderr) => {
				if (err) {
					const missing = (err as NodeJS.ErrnoException).code === 'ENOENT';
					reject(
						new TypstError(
							missing
								? `Typst was not found (${bin}). Run "npm run setup:typst" or set TYPST_BIN.`
								: `Typst failed: ${stderr.trim().split('\n').slice(0, 12).join('\n') || err.message}`,
							stderr
						)
					);
				} else {
					resolve(stdout);
				}
			}
		);
	});
}

async function typst(
	work: string,
	entry: string,
	dataFile: string,
	output: string,
	extra: string[] = []
) {
	const args = [
		'compile',
		'--root',
		work,
		'--font-path',
		fontsDir(),
		'--input',
		`data=/${dataFile}`,
		...(process.env.KINSTORY_SYSTEM_FONTS === '1' ? [] : ['--ignore-system-fonts']),
		...extra,
		join(work, entry),
		output
	];
	await run(typstBin(), args, work);
}

async function prepareWork(): Promise<string> {
	const work = await mkdtemp(join(tmpdir(), 'kinstory-book-'));
	await mkdir(join(work, 'img'), { recursive: true });
	for (const f of TEMPLATE_FILES) await copyFile(join(templatesDir(), f), join(work, f));
	return work;
}

async function materialise(work: string, assets: Asset[], grayscale: boolean) {
	await Promise.all(
		assets.map(async (a) => {
			const dest = join(work, a.path);
			if (a.kind === 'qr') {
				const svg = await QRCode.toString(a.source, {
					type: 'svg',
					margin: 0,
					errorCorrectionLevel: 'M',
					color: { dark: grayscale ? '#000000ff' : '#1c1916ff', light: '#00000000' }
				});
				await writeFile(dest, svg);
			} else {
				await prepareForPrint(a.source, dest, { maxPx: a.maxPx ?? 2400, grayscale });
			}
		})
	);
}

export interface InteriorResult {
	pdf: string;
	pages: number;
	previews: string[];
}

/**
 * Renders the book interior to `outDir/interior.pdf`. With `previews`, also
 * writes one WebP image per page to `outDir/pages/` for the spread viewer.
 */
export async function renderInterior(
	input: BookInput,
	outDir: string,
	opts: { previews?: boolean; previewPpi?: number } = {}
): Promise<InteriorResult> {
	const { data, assets } = buildBookData(input);
	const work = await prepareWork();
	try {
		await materialise(work, assets, !input.design.color);
		await writeFile(join(work, 'book.json'), JSON.stringify(data));
		await mkdir(outDir, { recursive: true });
		const pdf = join(outDir, 'interior.pdf');
		await typst(work, 'book.typ', 'book.json', pdf);

		const pngDir = join(work, 'png');
		await mkdir(pngDir);
		await typst(work, 'book.typ', 'book.json', join(pngDir, '{0p}.png'), [
			'--format',
			'png',
			'--ppi',
			String(opts.previews ? (opts.previewPpi ?? 110) : 12)
		]);
		const pngs = (await readdir(pngDir)).filter((f) => f.endsWith('.png')).sort();
		const previews: string[] = [];
		if (opts.previews) {
			const pagesDir = join(outDir, 'pages');
			await mkdir(pagesDir, { recursive: true });
			for (const [i, f] of pngs.entries()) {
				const out = join(pagesDir, `${String(i + 1).padStart(4, '0')}.webp`);
				await sharp(join(pngDir, f)).webp({ quality: 82 }).toFile(out);
				previews.push(out);
			}
		}
		return { pdf, pages: pngs.length, previews };
	} finally {
		if (process.env.KINSTORY_KEEP_WORK !== '1') await rm(work, { recursive: true, force: true });
		else console.log(`kept ${work}`);
	}
}

export interface CoverResult {
	pdf: string;
	preview: string;
	front: string;
	spine: number;
}

/** Renders the full cover spread to `outDir/cover.pdf` plus a spread and a front-cover preview. */
export async function renderCover(
	input: BookInput,
	pages: number,
	outDir: string
): Promise<CoverResult> {
	const spine = spineWidth(pages, input.design.paper, input.design.bleedMode);
	const { data, assets } = buildCoverData(input, spine);
	const work = await prepareWork();
	try {
		await materialise(work, assets, !input.design.color);
		await writeFile(join(work, 'cover.json'), JSON.stringify(data));
		await mkdir(outDir, { recursive: true });
		const pdf = join(outDir, 'cover.pdf');
		await typst(work, 'cover.typ', 'cover.json', pdf);

		const ppi = 110;
		const png = join(work, 'cover.png');
		await typst(work, 'cover.typ', 'cover.json', png, ['--format', 'png', '--ppi', String(ppi)]);
		const preview = join(outDir, 'cover.webp');
		await sharp(png).webp({ quality: 85 }).toFile(preview);

		const trim = TRIMS[input.design.trim];
		const meta = await sharp(png).metadata();
		const left = Math.round((data.bleed + trim.width + spine) * ppi);
		const front = join(outDir, 'front.webp');
		await sharp(png)
			.extract({
				left: Math.min(left, (meta.width ?? left + 1) - 1),
				top: Math.round(data.bleed * ppi),
				width: Math.min(Math.round(trim.width * ppi), (meta.width ?? 0) - left),
				height: Math.round(trim.height * ppi)
			})
			.webp({ quality: 85 })
			.toFile(front);
		return { pdf, preview, front, spine };
	} finally {
		if (process.env.KINSTORY_KEEP_WORK !== '1') await rm(work, { recursive: true, force: true });
		else console.log(`kept ${work}`);
	}
}
