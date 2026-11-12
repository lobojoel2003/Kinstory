// Speech-to-text. The default runs whisper.cpp locally, so recordings never
// leave the family's own server. An HTTP provider can point at a
// whisper.cpp server or any OpenAI-compatible /audio/transcriptions endpoint.

import { execFile } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { basename } from 'node:path';
import type { Segment } from '#lib/types.ts';
import { config } from '../config.ts';

export interface Transcript {
	text: string;
	segments: Segment[];
	language: string | null;
}

export interface Transcriber {
	name: string;
	/** `wav` is 16 kHz mono PCM, prepared by the caller. */
	transcribe(wav: string, opts: { language?: string }): Promise<Transcript>;
}

/** whisper.cpp timestamps look like "00:01:02,345". */
export function parseTimestamp(ts: string): number {
	const m = /^(\d+):(\d+):(\d+)[.,](\d+)$/.exec(ts.trim());
	if (!m) return 0;
	return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(`0.${m[4]}`);
}

interface WhisperCppJson {
	result?: { language?: string };
	transcription?: {
		timestamps?: { from: string; to: string };
		offsets?: { from: number; to: number };
		text: string;
	}[];
}

export function parseWhisperCppJson(json: WhisperCppJson): Transcript {
	const segments: Segment[] = (json.transcription ?? []).map((t) => ({
		start: t.offsets ? t.offsets.from / 1000 : parseTimestamp(t.timestamps?.from ?? ''),
		end: t.offsets ? t.offsets.to / 1000 : parseTimestamp(t.timestamps?.to ?? ''),
		text: t.text.trim()
	}));
	return {
		text: segments
			.map((s) => s.text)
			.join(' ')
			.replace(/\s+/g, ' ')
			.trim(),
		segments: segments.filter((s) => s.text),
		language: json.result?.language ?? null
	};
}

interface OpenAiVerbose {
	text?: string;
	language?: string;
	segments?: { start: number; end: number; text: string }[];
}

const LANGUAGE_NAMES: Record<string, string> = {
	english: 'en',
	spanish: 'es',
	french: 'fr',
	german: 'de',
	italian: 'it',
	portuguese: 'pt',
	dutch: 'nl'
};

export function parseOpenAiVerbose(json: OpenAiVerbose): Transcript {
	const segments = (json.segments ?? [])
		.map((s) => ({ start: s.start, end: s.end, text: s.text.trim() }))
		.filter((s) => s.text);
	const lang = json.language?.toLowerCase() ?? null;
	return {
		text: (json.text ?? segments.map((s) => s.text).join(' ')).trim(),
		segments: segments.length
			? segments
			: json.text
				? [{ start: 0, end: 0, text: json.text.trim() }]
				: [],
		language: lang ? (LANGUAGE_NAMES[lang] ?? lang) : null
	};
}

class WhisperCpp implements Transcriber {
	name = 'whisper.cpp';
	async transcribe(wav: string, opts: { language?: string }): Promise<Transcript> {
		const c = config();
		const outBase = `${wav}.whisper`;
		const args = [
			'-m',
			c.WHISPER_MODEL,
			'-f',
			wav,
			'-t',
			String(c.WHISPER_THREADS),
			'-l',
			opts.language || c.WHISPER_LANGUAGE,
			'-oj',
			'-of',
			outBase,
			'-np'
		];
		await new Promise<void>((resolve, reject) => {
			execFile(
				c.WHISPER_BIN,
				args,
				{ timeout: 60 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 },
				(err, _out, stderr) => {
					if (err) {
						const missing = (err as NodeJS.ErrnoException).code === 'ENOENT';
						reject(
							new Error(
								missing
									? `whisper.cpp (${c.WHISPER_BIN}) is not installed. Use the Docker image, install whisper.cpp, or set TRANSCRIBE_PROVIDER.`
									: `whisper.cpp failed: ${stderr.split('\n').filter(Boolean).slice(-4).join(' ')}`
							)
						);
					} else resolve();
				}
			);
		});
		try {
			return parseWhisperCppJson(
				JSON.parse(await readFile(`${outBase}.json`, 'utf8')) as WhisperCppJson
			);
		} finally {
			await rm(`${outBase}.json`, { force: true });
		}
	}
}

class HttpTranscriber implements Transcriber {
	name = 'http';
	async transcribe(wav: string, opts: { language?: string }): Promise<Transcript> {
		const c = config();
		if (!c.TRANSCRIBE_URL) throw new Error('TRANSCRIBE_URL is not set');
		const form = new FormData();
		form.set('file', new Blob([await readFile(wav)], { type: 'audio/wav' }), basename(wav));
		form.set('response_format', 'verbose_json');
		form.set('temperature', '0');
		if (c.TRANSCRIBE_MODEL) form.set('model', c.TRANSCRIBE_MODEL);
		const lang = opts.language || c.WHISPER_LANGUAGE;
		if (lang && lang !== 'auto') form.set('language', lang);
		const res = await fetch(c.TRANSCRIBE_URL, {
			method: 'POST',
			body: form,
			headers: c.TRANSCRIBE_API_KEY ? { authorization: `Bearer ${c.TRANSCRIBE_API_KEY}` } : {},
			signal: AbortSignal.timeout(60 * 60 * 1000)
		});
		if (!res.ok)
			throw new Error(
				`Transcription service answered ${res.status}: ${(await res.text()).slice(0, 300)}`
			);
		return parseOpenAiVerbose((await res.json()) as OpenAiVerbose);
	}
}

/** Deterministic stand-in for tests and demos: no model required. */
class FakeTranscriber implements Transcriber {
	name = 'fake';
	async transcribe(): Promise<Transcript> {
		const segments: Segment[] = [
			{ start: 0, end: 4.2, text: 'Well, um, let me think about that.' },
			{
				start: 4.4,
				end: 11,
				text: 'We lived in a small house by the water, and every morning my father went down to the boats.'
			},
			{
				start: 13.5,
				end: 19,
				text: 'I still remember the smell of the bread my mother made on Sundays.'
			}
		];
		return { text: segments.map((s) => s.text).join(' '), segments, language: 'en' };
	}
}

export function transcriber(): Transcriber | null {
	switch (config().TRANSCRIBE_PROVIDER) {
		case 'whisper-cpp':
			return new WhisperCpp();
		case 'http':
			return new HttpTranscriber();
		case 'fake':
			return new FakeTranscriber();
		default:
			return null;
	}
}
