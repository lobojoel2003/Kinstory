import { describe, expect, it } from 'vitest';
import { ELDER_STRINGS, PHONE_VOICES } from '#lib/elder-strings.ts';
import { joinNames, shortName } from '#lib/names.ts';
import { PROMPT_LIBRARY, STARTER_QUESTIONS } from '#lib/prompts.ts';
import { audioExtension } from '#lib/server/audio.ts';
import { safeNext } from '#lib/server/guard.ts';
import { limited } from '#lib/server/ratelimit.ts';
import { slug } from '#lib/server/services/export.ts';
import {
	parseOpenAiVerbose,
	parseTimestamp,
	parseWhisperCppJson
} from '#lib/server/transcribe/index.ts';
import { hashPassword, randomPin, randomToken, verifyPassword } from '#lib/server/auth.ts';
import { filePath } from '#lib/server/storage.ts';

describe('names', () => {
	it('addresses storytellers the way family would', () => {
		expect(shortName('Rosa Delgado')).toBe('Rosa');
		expect(shortName('Grandma Rosa')).toBe('Grandma Rosa');
		expect(shortName('Abuela Carmen Ruiz')).toBe('Abuela Carmen');
		expect(shortName('Nell')).toBe('Nell');
	});

	it('joins names without repeats', () => {
		expect(joinNames(['Daniel', 'Lucía', 'Maya', 'Maya Delgado'])).toBe('Daniel, Lucía and Maya');
		expect(joinNames(['Maya'])).toBe('Maya');
		expect(joinNames([])).toBe('');
	});
});

describe('storyteller-facing strings', () => {
	it('exist in every language, with a phone voice for each', () => {
		const keys = Object.keys(ELDER_STRINGS.en).sort();
		for (const [lang, strings] of Object.entries(ELDER_STRINGS)) {
			expect(Object.keys(strings).sort(), lang).toEqual(keys);
			expect(PHONE_VOICES[lang], lang).toBeDefined();
			expect(strings.hello('Rosa')).toContain('Rosa');
			expect(strings.orCall('+1 555', '123456')).toContain('123456');
		}
	});
});

describe('question library', () => {
	it('has no duplicate questions and every starter is well formed', () => {
		const all = PROMPT_LIBRARY.flatMap((c) => c.questions);
		expect(new Set(all).size).toBe(all.length);
		for (const q of [...all, ...STARTER_QUESTIONS]) expect(q).toMatch(/[?.]$/);
	});
});

describe('transcription output parsing', () => {
	it('reads whisper.cpp JSON', () => {
		const t = parseWhisperCppJson({
			result: { language: 'en' },
			transcription: [
				{
					timestamps: { from: '00:00:00,000', to: '00:00:04,200' },
					offsets: { from: 0, to: 4200 },
					text: ' And so my fellow Americans,'
				},
				{
					timestamps: { from: '00:00:04,200', to: '00:00:08,000' },
					offsets: { from: 4200, to: 8000 },
					text: ' ask not.'
				}
			]
		});
		expect(t).toEqual({
			text: 'And so my fellow Americans, ask not.',
			language: 'en',
			segments: [
				{ start: 0, end: 4.2, text: 'And so my fellow Americans,' },
				{ start: 4.2, end: 8, text: 'ask not.' }
			]
		});
	});

	it('reads OpenAI-style verbose JSON and normalises language names', () => {
		const t = parseOpenAiVerbose({
			text: ' Hola. ',
			language: 'spanish',
			segments: [{ start: 0, end: 1, text: ' Hola.' }]
		});
		expect(t.language).toBe('es');
		expect(t.segments).toEqual([{ start: 0, end: 1, text: 'Hola.' }]);
	});

	it('parses timestamps', () => {
		expect(parseTimestamp('01:02:03,500')).toBe(3723.5);
		expect(parseTimestamp('nonsense')).toBe(0);
	});
});

describe('audio types', () => {
	it('maps MIME types and file names to extensions', () => {
		expect(audioExtension('audio/webm;codecs=opus')).toBe('webm');
		expect(audioExtension('audio/mp4')).toBe('m4a');
		expect(audioExtension('', 'PTT-20260101.opus')).toBe('opus');
		expect(audioExtension('application/pdf', 'thing.pdf')).toBeNull();
	});
});

describe('security helpers', () => {
	it('hashes and verifies passwords', async () => {
		const h = await hashPassword('correct horse battery staple');
		expect(h).toMatch(/^scrypt\$16384\$8\$1\$/);
		expect(await verifyPassword('correct horse battery staple', h)).toBe(true);
		expect(await verifyPassword('wrong', h)).toBe(false);
		expect(await verifyPassword('x', 'garbage')).toBe(false);
	});

	it('makes unguessable tokens and six-digit codes', () => {
		expect(randomToken(24)).toMatch(/^[A-Za-z0-9_-]{32}$/);
		expect(randomToken()).not.toBe(randomToken());
		expect(randomPin()).toMatch(/^[1-9]\d{5}$/);
	});

	it('only redirects to same-site paths', () => {
		expect(safeNext('/p/123')).toBe('/p/123');
		expect(safeNext('//evil.example')).toBe('/projects');
		expect(safeNext('https://evil.example')).toBe('/projects');
		expect(safeNext('/\\evil.example')).toBe('/projects');
		expect(safeNext(null)).toBe('/projects');
	});

	it('refuses storage keys that escape the data directory', () => {
		expect(() => filePath('projects/a/audio/b.webm')).not.toThrow();
		expect(() => filePath('../etc/passwd')).toThrow();
		expect(() => filePath('projects/../../etc/passwd')).toThrow();
		expect(() => filePath('/etc/passwd')).toThrow();
	});

	it('rate-limits within a window', () => {
		const key = `test-${Math.random()}`;
		const results = Array.from({ length: 4 }, () => limited(key, 3, 60_000));
		expect(results).toEqual([false, false, false, true]);
	});

	it('makes file-name slugs', () => {
		expect(slug('Bread & Salt: Rosa’s Stories')).toBe('bread-salt-rosa-s-stories');
		expect(slug('Ñandú')).toBe('nandu');
		expect(slug('!!!')).toBe('untitled');
	});
});
