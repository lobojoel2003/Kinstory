// Runtime configuration, read from the environment once and validated.
// See .env.example for every variable with a description.

import { z } from 'zod';

const bool = (fallback: boolean) =>
	z
		.string()
		.optional()
		.transform((v) =>
			v === undefined || v === '' ? fallback : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())
		);

const int = (fallback: number) =>
	z
		.string()
		.optional()
		.transform((v, ctx) => {
			if (v === undefined || v === '') return fallback;
			const n = Number(v);
			if (!Number.isInteger(n)) {
				ctx.addIssue({ code: 'custom', message: 'must be an integer' });
				return z.NEVER;
			}
			return n;
		});

const optional = z
	.string()
	.optional()
	.transform((v) => (v ? v : undefined));

const schema = z.object({
	DATABASE_URL: z.string().default('postgres://kinstory:kinstory@localhost:5432/kinstory'),
	DATABASE_POOL_SIZE: int(10),
	PUBLIC_URL: optional,
	ORIGIN: optional,
	DATA_DIR: z.string().default('./data'),
	ALLOW_SIGNUP: bool(true),
	SESSION_DAYS: int(30),
	SEED_DEMO: bool(false),

	WORKER: bool(true),
	WORKER_CONCURRENCY: int(2),

	TRANSCRIBE_PROVIDER: z.enum(['whisper-cpp', 'http', 'fake', 'none']).default('whisper-cpp'),
	WHISPER_BIN: z.string().default('whisper-cli'),
	WHISPER_MODEL: z.string().default('./models/ggml-base.en.bin'),
	WHISPER_THREADS: int(4),
	WHISPER_LANGUAGE: z.string().default('auto'),
	TRANSCRIBE_URL: optional,
	TRANSCRIBE_API_KEY: optional,
	TRANSCRIBE_MODEL: optional,
	FFMPEG_BIN: z.string().default('ffmpeg'),
	FFPROBE_BIN: z.string().default('ffprobe'),

	TWILIO_ACCOUNT_SID: optional,
	TWILIO_AUTH_TOKEN: optional,
	TWILIO_PHONE_NUMBER: optional,
	TWILIO_API_BASE: z.string().default('https://api.twilio.com'),
	VOICE_TTS_VOICE: z.string().default('Polly.Joanna-Neural'),
	VOICE_TTS_LANGUAGE: z.string().default('en-US'),
	VOICE_MAX_RECORDING_SECONDS: int(1800),
	VOICE_SILENCE_TIMEOUT: int(20),
	VOICE_SKIP_SIGNATURE_CHECK: bool(false),

	SMTP_URL: optional,
	MAIL_FROM: z.string().default('Kinstory <kinstory@localhost>')
});

export type Config = z.infer<typeof schema> & {
	/** Canonical external URL without a trailing slash, when known. */
	publicUrl: string | undefined;
	voiceEnabled: boolean;
	mailEnabled: boolean;
};

let cached: Config | null = null;

export function config(): Config {
	if (cached) return cached;
	const parsed = schema.safeParse(process.env);
	if (!parsed.success) {
		const problems = parsed.error.issues
			.map((i) => `  ${i.path.join('.')}: ${i.message}`)
			.join('\n');
		throw new Error(`Invalid Kinstory configuration:\n${problems}`);
	}
	const c = parsed.data;
	cached = {
		...c,
		publicUrl: (c.PUBLIC_URL ?? c.ORIGIN)?.replace(/\/+$/, ''),
		voiceEnabled: Boolean(c.TWILIO_ACCOUNT_SID && c.TWILIO_AUTH_TOKEN && c.TWILIO_PHONE_NUMBER),
		mailEnabled: Boolean(c.SMTP_URL)
	};
	return cached;
}

/** For tests: forget the cached configuration so changed env vars apply. */
export function resetConfig(): void {
	cached = null;
}
