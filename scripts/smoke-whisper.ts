// Transcribes one audio file with the configured provider and prints the
// paragraphs. CI uses it to prove the whisper.cpp integration works end to end:
//
//   WHISPER_BIN=… WHISPER_MODEL=… npx tsx scripts/smoke-whisper.ts samples/jfk.wav "ask not what your country"

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { toWhisperWav } from '../src/lib/server/audio.ts';
import { segmentsToParagraphs } from '../src/lib/server/text/transcript.ts';
import { transcriber } from '../src/lib/server/transcribe/index.ts';

const [input, expected] = process.argv.slice(2);
if (!input) {
	console.error('usage: smoke-whisper.ts <audio file> [expected phrase]');
	process.exit(2);
}

const t = transcriber();
if (!t) throw new Error('TRANSCRIBE_PROVIDER is "none"');
const work = await mkdtemp(join(tmpdir(), 'kinstory-smoke-'));
try {
	const wav = join(work, 'in.wav');
	await toWhisperWav(input, wav);
	const started = Date.now();
	const result = await t.transcribe(wav, { language: process.env.WHISPER_LANGUAGE });
	const text = segmentsToParagraphs(result.segments).join('\n\n');
	console.log(
		`${t.name} (${result.language ?? '?'}) in ${((Date.now() - started) / 1000).toFixed(1)}s:\n${text}`
	);
	if (expected && !text.toLowerCase().includes(expected.toLowerCase())) {
		console.error(`✗ expected the transcript to contain “${expected}”`);
		process.exit(1);
	}
	if (expected) console.log(`✓ found “${expected}”`);
} finally {
	await rm(work, { recursive: true, force: true });
}
