import { describe, expect, it } from 'vitest';
import { DEFAULT_DESIGN, spineWidth } from '#lib/book-options.ts';
import {
	buildBookData,
	buildCoverData,
	pullQuotePosition,
	type BookInput
} from '#lib/server/book/book-data.ts';
import { BOOK_LABELS } from '#lib/server/book/labels.ts';

function input(overrides: Partial<BookInput> = {}): BookInput {
	return {
		title: 'Bread & Salt',
		subtitle: 'Stories from Rosa',
		author: 'Rosa Delgado',
		imprint: 'Printed for the Delgado family',
		dedication: 'For the grandchildren',
		afterword: 'First paragraph.\n\nSecond paragraph.',
		blurb: '"Not the whole song."',
		language: 'en',
		design: { ...DEFAULT_DESIGN, listenQr: true },
		frontispiece: null,
		coverPhoto: null,
		now: new Date('2026-11-01T12:00:00Z'),
		stories: [
			{
				id: 's1',
				title: 'The Kitchen',
				question: "What did your mother's kitchen smell like?",
				askedBy: 'Maya',
				part: 'San Telmo',
				body: 'One "quoted" line.\n\nTwo.\n\nThree.\n\nFour.',
				pullQuote: '"Not the whole song."',
				recordedAt: new Date('2026-03-08T12:00:00Z'),
				recordedVia: 'phone',
				listenUrl: 'https://kin.example/l/abc',
				photos: [
					{
						id: 'p1',
						file: '/tmp/p1.jpg',
						width: 1500,
						height: 1000,
						caption: 'The house',
						layout: 'full',
						anchor: 9
					}
				]
			},
			{
				id: 's2',
				title: 'Empty',
				question: null,
				askedBy: null,
				part: 'San Telmo',
				body: '   ',
				pullQuote: null,
				recordedAt: null,
				recordedVia: null,
				listenUrl: null,
				photos: []
			},
			{
				id: 's3',
				title: 'Crossing',
				question: null,
				askedBy: null,
				part: 'Across the Water',
				body: 'We left in March.',
				pullQuote: null,
				recordedAt: new Date('2026-05-17T12:00:00Z'),
				recordedVia: 'web',
				listenUrl: null,
				photos: []
			}
		],
		...overrides
	};
}

describe('buildBookData', () => {
	const { data, assets } = buildBookData(input());

	it('groups consecutive stories into parts and skips empty ones', () => {
		expect(data.parts.map((p) => p.title)).toEqual(['San Telmo', 'Across the Water']);
		expect(data.parts[0].stories.map((s) => s.id)).toEqual(['s1']);
	});

	it('sets typographic quotes everywhere text is printed', () => {
		const s = data.parts[0].stories[0];
		expect(s.question).toBe('What did your mother’s kitchen smell like?');
		expect(s.paragraphs[0]).toBe('One “quoted” line.');
		expect(s.pullQuote).toBe('Not the whole song.');
	});

	it('places the pull quote mid-story and clamps photo anchors', () => {
		const s = data.parts[0].stories[0];
		expect(s.pullQuoteAfter).toBe(2);
		expect(s.photos[0]).toMatchObject({
			src: '/img/p1.jpg',
			after: 4,
			aspect: 1.5,
			caption: 'The house'
		});
	});

	it('describes how and when each story was recorded', () => {
		expect(data.parts[0].stories[0].recorded).toBe('Told by telephone · March 8, 2026');
		expect(data.parts[1].stories[0].recorded).toBe('Recorded as a voice note · May 17, 2026');
	});

	it('writes a colophon that credits the storyteller', () => {
		expect(data.meta.colophon).toContain(
			'These stories were told aloud between March 2026 and May 2026 and transcribed with care. The words are Rosa Delgado’s own.'
		);
		expect(data.meta.imprint).toBe('Printed for the Delgado family · 2026');
		expect(data.meta.afterword).toEqual(['First paragraph.', 'Second paragraph.']);
	});

	it('lists the photos and QR codes the renderer must prepare', () => {
		expect(assets).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ kind: 'photo', path: '/img/p1.jpg', source: '/tmp/p1.jpg' }),
				expect.objectContaining({
					kind: 'qr',
					path: '/img/qr-s1.svg',
					source: 'https://kin.example/l/abc'
				})
			])
		);
	});

	it('omits QR codes when they are turned off', () => {
		const off = buildBookData(input({ design: { ...DEFAULT_DESIGN, listenQr: false } }));
		expect(off.assets.some((a) => a.kind === 'qr')).toBe(false);
		expect(off.data.parts[0].stories[0].qr).toBeNull();
	});

	it('uses the book’s language for labels and dates', () => {
		const es = buildBookData(input({ language: 'es' }));
		expect(es.data.labels.contents).toBe('Índice');
		expect(es.data.parts[0].stories[0].recorded).toBe('Contado por teléfono · 8 de marzo de 2026');
	});
});

describe('cover', () => {
	it('sizes the spine from the page count and paper', () => {
		expect(spineWidth(200, 'cream', 'outside')).toBe(0.5);
		expect(spineWidth(200, 'white', 'all')).toBeCloseTo(0.51, 2);
	});

	it('uses neutral cloth for black-and-white books', () => {
		const { data } = buildCoverData(input({ design: { ...DEFAULT_DESIGN, color: false } }), 0.4);
		expect(data.cloth).toBe('#2a2a2a');
		expect(data.spine).toBe(0.4);
		expect(data.blurb).toBe('“Not the whole song.”');
	});
});

describe('pullQuotePosition', () => {
	it('never places a pull quote first or last', () => {
		expect(pullQuotePosition(2)).toBeNull();
		expect(pullQuotePosition(3)).toBe(2);
		expect(pullQuotePosition(7)).toBe(4);
	});
});

describe('labels', () => {
	it('translates every label in every language', () => {
		const keys = Object.keys(BOOK_LABELS.en).sort();
		for (const [lang, labels] of Object.entries(BOOK_LABELS)) {
			expect(Object.keys(labels).sort(), lang).toEqual(keys);
			for (const v of Object.values(labels)) expect(v.length, lang).toBeGreaterThan(0);
		}
	});
});
