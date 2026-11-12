// Turns stories and design choices into the JSON contract read by
// templates/book.typ and templates/cover.typ. Pure: no IO, so it is easy to
// test and the renderer decides where files go.

import { COVER_COLORS, TRIMS, type BookDesign, type PhotoLayout } from '#lib/book-options.ts';
import { paragraphs, smarten } from '../text/typography.ts';
import { labelsFor, TYPE_NOTES } from './labels.ts';

export interface PhotoInput {
	id: string;
	file: string; // absolute path on disk
	width: number;
	height: number;
	caption: string | null;
	layout: PhotoLayout;
	/** Paragraph after which the photo sits: 0 = before the text, null = after the last paragraph. */
	anchor: number | null;
}

export interface StoryInput {
	id: string;
	title: string;
	question: string | null;
	askedBy: string | null;
	part: string | null;
	body: string;
	pullQuote: string | null;
	recordedAt: Date | null;
	recordedVia: 'phone' | 'web' | 'upload' | null;
	photos: PhotoInput[];
	listenUrl: string | null;
}

export interface BookInput {
	title: string;
	subtitle: string | null;
	author: string;
	imprint: string | null;
	dedication: string | null;
	afterword: string | null;
	blurb: string | null;
	language: string;
	design: BookDesign;
	frontispiece: (Omit<PhotoInput, 'layout' | 'anchor'> & { caption: string | null }) | null;
	coverPhoto: Omit<PhotoInput, 'layout' | 'anchor' | 'caption'> | null;
	stories: StoryInput[];
	now?: Date;
}

/** A file the renderer must place in the Typst root before compiling. */
export interface Asset {
	kind: 'photo' | 'qr';
	/** Root-relative path used inside the templates, e.g. "/img/abc.jpg". */
	path: string;
	/** Source file for photos, URL for QR codes. */
	source: string;
	/** Longest edge in pixels the photo needs at 300 ppi. */
	maxPx?: number;
}

export interface BookJsonPhoto {
	src: string;
	caption: string | null;
	layout: PhotoLayout;
	after: number | null;
	aspect: number;
}

export interface BookJsonStory {
	id: string;
	title: string;
	question: string | null;
	askedBy: string | null;
	recorded: string | null;
	paragraphs: string[];
	pullQuote: string | null;
	pullQuoteAfter: number | null;
	photos: BookJsonPhoto[];
	qr: string | null;
}

export interface BookJson {
	lang: string;
	labels: ReturnType<typeof labelsFor>;
	typeNote: string;
	meta: {
		title: string;
		subtitle: string | null;
		author: string;
		imprint: string | null;
		year: number;
		dedication: string | null;
		colophon: string[];
		afterword: string[];
	};
	format: {
		width: number;
		height: number;
		bleed: number;
		bleedMode: BookDesign['bleedMode'];
		theme: BookDesign['theme'];
		color: boolean;
		dropCaps: boolean;
		chapterNumbers: boolean;
		questionsIndex: boolean;
		chapterOpensRecto: boolean;
	};
	frontispiece: { src: string; caption: string | null; aspect: number } | null;
	parts: { title: string | null; stories: BookJsonStory[] }[];
}

export interface CoverJson {
	lang: string;
	title: string;
	subtitle: string | null;
	author: string;
	blurb: string | null;
	madeWith: string;
	theme: BookDesign['theme'];
	cloth: string;
	ink: string;
	width: number;
	height: number;
	bleed: number;
	spine: number;
	photo: { src: string; aspect: number } | null;
}

const BLEED_IN = 0.125;

/** Where a pull quote reads best: near the middle, never first or last. */
export function pullQuotePosition(count: number): number | null {
	if (count < 3) return null;
	return Math.min(count - 1, Math.max(2, Math.ceil(count / 2)));
}

function formatDate(d: Date, lang: string): string {
	try {
		return new Intl.DateTimeFormat(lang, {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(d);
	} catch {
		return d.toISOString().slice(0, 10);
	}
}

function monthYear(d: Date, lang: string): string {
	try {
		return new Intl.DateTimeFormat(lang, {
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(d);
	} catch {
		return d.toISOString().slice(0, 7);
	}
}

const clean = (s: string | null | undefined): string | null => {
	const t = s?.trim();
	return t ? smarten(t) : null;
};

export function buildBookData(input: BookInput): { data: BookJson; assets: Asset[] } {
	const labels = labelsFor(input.language);
	const trim = TRIMS[input.design.trim];
	const now = input.now ?? new Date();
	const assets: Asset[] = [];
	const photoPx = Math.round(Math.max(trim.width, trim.height) * 300);

	const photoAsset = (p: { id: string; file: string }) => {
		const path = `/img/${p.id}.jpg`;
		if (!assets.some((a) => a.path === path)) {
			assets.push({ kind: 'photo', path, source: p.file, maxPx: photoPx });
		}
		return path;
	};

	const parts: BookJson['parts'] = [];
	for (const s of input.stories) {
		const paras = paragraphs(s.body).map(smarten);
		if (paras.length === 0) continue;
		const partTitle = clean(s.part);
		let part = parts[parts.length - 1];
		if (!part || part.title !== partTitle) {
			part = { title: partTitle, stories: [] };
			parts.push(part);
		}

		let recorded: string | null = null;
		if (s.recordedAt) {
			const how =
				s.recordedVia === 'phone'
					? labels.toldByPhone
					: s.recordedVia === 'web'
						? labels.toldByVoiceNote
						: labels.toldInPerson;
			recorded = `${how} · ${formatDate(s.recordedAt, input.language)}`;
		}

		let qr: string | null = null;
		if (input.design.listenQr && s.listenUrl) {
			qr = `/img/qr-${s.id}.svg`;
			assets.push({ kind: 'qr', path: qr, source: s.listenUrl });
		}

		const pull = clean(s.pullQuote);
		part.stories.push({
			id: s.id,
			title: clean(s.title) ?? 'Untitled',
			question: clean(s.question),
			askedBy: clean(s.askedBy),
			recorded,
			paragraphs: paras,
			pullQuote: pull ? pull.replace(/^[“"]+|[”"]+$/g, '') : null,
			pullQuoteAfter: pull ? pullQuotePosition(paras.length) : null,
			photos: s.photos.map((p) => ({
				src: photoAsset(p),
				caption: clean(p.caption),
				layout: p.layout,
				after: p.anchor === null ? null : Math.max(0, Math.min(p.anchor, paras.length)),
				aspect: p.width / p.height
			})),
			qr
		});
	}

	const dates = input.stories
		.map((s) => s.recordedAt)
		.filter((d): d is Date => d instanceof Date)
		.sort((a, b) => +a - +b);
	const year = (dates.at(-1) ?? now).getUTCFullYear();
	const colophon: string[] = [`© ${year} ${input.author} and family.`];
	if (dates.length > 0) {
		const first = monthYear(dates[0], input.language);
		const last = monthYear(dates[dates.length - 1], input.language);
		colophon.push(
			first === last
				? `These stories were told aloud in ${first} and transcribed with care. The words are ${input.author}’s own.`
				: `These stories were told aloud between ${first} and ${last} and transcribed with care. The words are ${input.author}’s own.`
		);
	}
	if (input.imprint) colophon.push(smarten(input.imprint));
	colophon.push(labels.madeWith);
	colophon.push(`${labels.firstPrinting}, ${monthYear(now, input.language)}.`);

	const data: BookJson = {
		lang: input.language,
		labels,
		typeNote: TYPE_NOTES[input.design.theme],
		meta: {
			title: smarten(input.title.trim()) || 'Untitled',
			subtitle: clean(input.subtitle),
			author: smarten(input.author.trim()),
			imprint: clean(input.imprint) ? `${clean(input.imprint)} · ${year}` : String(year),
			year,
			dedication: clean(input.dedication),
			colophon,
			afterword: input.afterword ? paragraphs(input.afterword).map(smarten) : []
		},
		format: {
			width: trim.width,
			height: trim.height,
			bleed: BLEED_IN,
			bleedMode: input.design.bleedMode,
			theme: input.design.theme,
			color: input.design.color,
			dropCaps: input.design.dropCaps,
			chapterNumbers: input.design.chapterNumbers,
			questionsIndex: input.design.questionsIndex,
			chapterOpensRecto: true
		},
		frontispiece: input.frontispiece
			? {
					src: photoAsset(input.frontispiece),
					caption: clean(input.frontispiece.caption),
					aspect: input.frontispiece.width / input.frontispiece.height
				}
			: null,
		parts
	};
	return { data, assets };
}

export function buildCoverData(
	input: BookInput,
	spine: number
): { data: CoverJson; assets: Asset[] } {
	const trim = TRIMS[input.design.trim];
	const colors = COVER_COLORS[input.design.coverColor];
	const assets: Asset[] = [];
	let photo: CoverJson['photo'] = null;
	if (input.coverPhoto) {
		const path = `/img/cover-${input.coverPhoto.id}.jpg`;
		assets.push({
			kind: 'photo',
			path,
			source: input.coverPhoto.file,
			maxPx: Math.round(trim.width * 300)
		});
		photo = { src: path, aspect: input.coverPhoto.width / input.coverPhoto.height };
	}
	return {
		data: {
			lang: input.language,
			title: smarten(input.title.trim()) || 'Untitled',
			subtitle: clean(input.subtitle),
			author: smarten(input.author.trim()),
			blurb: clean(input.blurb),
			madeWith: labelsFor(input.language).madeWith,
			theme: input.design.theme,
			cloth: input.design.color ? colors.cloth : '#2a2a2a',
			ink: input.design.color ? colors.ink : '#f0f0f0',
			width: trim.width,
			height: trim.height,
			bleed: BLEED_IN,
			spine,
			photo
		},
		assets
	};
}
