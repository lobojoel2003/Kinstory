// Audio plumbing around ffmpeg: whisper.cpp wants 16 kHz mono WAV, and the
// book wants to know how long everyone talked.

import { execFile } from 'node:child_process';
import { config } from './config.ts';

function run(
	bin: string,
	args: string[],
	timeoutMs = 10 * 60 * 1000
): Promise<{ stdout: string; stderr: string }> {
	return new Promise((resolve, reject) => {
		execFile(
			bin,
			args,
			{ timeout: timeoutMs, maxBuffer: 32 * 1024 * 1024 },
			(err, stdout, stderr) => {
				if (err) {
					const missing = (err as NodeJS.ErrnoException).code === 'ENOENT';
					reject(
						new Error(
							missing
								? `${bin} is not installed or not on PATH`
								: `${bin} failed: ${stderr.split('\n').slice(-6).join(' ').trim() || err.message}`
						)
					);
				} else resolve({ stdout, stderr });
			}
		);
	});
}

/** Converts any audio ffmpeg understands into 16 kHz mono 16-bit PCM WAV. */
export async function toWhisperWav(input: string, output: string): Promise<void> {
	await run(config().FFMPEG_BIN, [
		'-nostdin',
		'-hide_banner',
		'-loglevel',
		'error',
		'-y',
		'-i',
		input,
		'-vn',
		'-ac',
		'1',
		'-ar',
		'16000',
		'-c:a',
		'pcm_s16le',
		output
	]);
}

/** Duration in seconds, or null if ffprobe cannot tell. */
export async function probeDuration(input: string): Promise<number | null> {
	try {
		const { stdout } = await run(
			config().FFPROBE_BIN,
			['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', input],
			60_000
		);
		const d = Number.parseFloat(stdout.trim());
		return Number.isFinite(d) ? d : null;
	} catch {
		return null;
	}
}

const EXT_BY_MIME: Record<string, string> = {
	'audio/webm': 'webm',
	'audio/ogg': 'ogg',
	'audio/opus': 'opus',
	'audio/mpeg': 'mp3',
	'audio/mp3': 'mp3',
	'audio/mp4': 'm4a',
	'audio/x-m4a': 'm4a',
	'audio/m4a': 'm4a',
	'audio/aac': 'aac',
	'audio/wav': 'wav',
	'audio/x-wav': 'wav',
	'audio/wave': 'wav',
	'audio/flac': 'flac',
	'audio/x-flac': 'flac',
	'audio/amr': 'amr',
	'audio/3gpp': '3gp',
	'video/webm': 'webm',
	'video/mp4': 'm4a'
};

/** File extension for an uploaded audio type, falling back to the file name. */
export function audioExtension(mime: string | null | undefined, filename?: string): string | null {
	const base = (mime ?? '').split(';')[0].trim().toLowerCase();
	if (EXT_BY_MIME[base]) return EXT_BY_MIME[base];
	const m = /\.([a-z0-9]{2,4})$/i.exec(filename ?? '');
	const ext = m?.[1].toLowerCase();
	return ext && Object.values(EXT_BY_MIME).includes(ext) ? ext : null;
}

export const AUDIO_MIME_BY_EXT: Record<string, string> = {
	webm: 'audio/webm',
	ogg: 'audio/ogg',
	opus: 'audio/ogg',
	mp3: 'audio/mpeg',
	m4a: 'audio/mp4',
	aac: 'audio/aac',
	wav: 'audio/wav',
	flac: 'audio/flac',
	amr: 'audio/amr',
	'3gp': 'audio/3gpp'
};
