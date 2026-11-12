import { describe, expect, it } from 'vitest';
import {
	paragraphs,
	smarten,
	titleFromQuestion,
	truncate,
	wordCount
} from '#lib/server/text/typography.ts';
import { segmentsToParagraphs, stripArtefacts, tidy } from '#lib/server/text/transcript.ts';

describe('smarten', () => {
	it('curls double quotes around speech', () => {
		expect(smarten('She said, "You feel it." Then left.')).toBe(
			'She said, “You feel it.” Then left.'
		);
	});

	it('turns apostrophes in contractions and possessives into right quotes', () => {
		expect(smarten("I don't know Rosa's sister.")).toBe('I don’t know Rosa’s sister.');
	});

	it('handles abbreviated years and single-quoted words', () => {
		expect(smarten("Back in '66 we said 'hello' a lot")).toBe('Back in ’66 we said ‘hello’ a lot');
	});

	it('makes dashes and ellipses', () => {
		expect(smarten('Well -- I never... no.')).toBe('Well — I never… no.');
		expect(smarten('1950--1960')).toBe('1950—1960');
	});

	it('leaves text without straight punctuation alone', () => {
		const t = 'Already “curly” and fine — thanks.';
		expect(smarten(t)).toBe(t);
	});
});

describe('paragraphs and helpers', () => {
	it('splits on blank lines and collapses whitespace', () => {
		expect(paragraphs('One\nline.\n\n\n  Two   lines \r\n\r\nThree')).toEqual([
			'One line.',
			'Two lines',
			'Three'
		]);
	});

	it('counts words', () => {
		expect(wordCount('  The house on the hill. ')).toBe(5);
		expect(wordCount('')).toBe(0);
	});

	it('truncates on a word boundary', () => {
		expect(truncate('What did your mother’s kitchen smell like on Sundays?', 30)).toBe(
			'What did your mother’s…'
		);
		expect(truncate('Short', 30)).toBe('Short');
	});

	it('makes a provisional title from a question', () => {
		expect(titleFromQuestion('How did you meet Grandpa?')).toBe('How did you meet Grandpa');
		expect(titleFromQuestion(null)).toBe('Untitled story');
	});
});

describe('transcript clean-up', () => {
	it('removes recogniser artefacts', () => {
		expect(stripArtefacts('[BLANK_AUDIO] We went home. (music) Then slept.')).toBe(
			'We went home. Then slept.'
		);
	});

	it('removes hesitation sounds and stutters but keeps meaning', () => {
		expect(tidy('Um, well, I I went to the the market, uh, every day.')).toBe(
			'Well, I went to the market, every day.'
		);
	});

	it('keeps deliberate repeats separated by punctuation', () => {
		expect(tidy('The rope went slap, slap against the pole.')).toBe(
			'The rope went slap, slap against the pole.'
		);
	});

	it('capitalises a sentence whose first word was a filler', () => {
		expect(tidy('Uh the boats came in late.')).toBe('The boats came in late.');
	});

	it('starts a new paragraph after a long pause', () => {
		const paras = segmentsToParagraphs([
			{ start: 0, end: 3, text: 'We lived by the sea.' },
			{ start: 3.2, end: 6, text: 'My father fished.' },
			{ start: 9.5, end: 12, text: 'Years later we moved.' }
		]);
		expect(paras).toEqual(['We lived by the sea. My father fished.', 'Years later we moved.']);
	});

	it('breaks very long runs at a sentence end', () => {
		const long = Array.from({ length: 40 }, (_, i) => ({
			start: i * 3,
			end: i * 3 + 2.9,
			text: 'This is one more sentence of the story.'
		}));
		const paras = segmentsToParagraphs(long, { maxWords: 60 });
		expect(paras.length).toBeGreaterThan(3);
		expect(paras.every((p) => p.endsWith('.'))).toBe(true);
	});
});
