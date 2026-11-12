// Everything a recording goes through: stored as it arrived, converted,
// transcribed, shaped into paragraphs and turned into (or appended to) a story.

import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import type { Recording, RecordingSource, Storyteller } from '#lib/types.ts';
import { probeDuration, toWhisperWav } from '../audio.ts';
import type { Db, Sql } from '../db.ts';
import { enqueue, type Job } from '../jobs.ts';
import { log } from '../log.ts';
import { getProject } from '../repo/projects.ts';
import { markPromptAnswered, promptById } from '../repo/prompts.ts';
import { appendToStory, createRecording, createStory, getRecording } from '../repo/stories.ts';
import { storytellerById } from '../repo/storytellers.ts';
import { filePath, keys, putFile } from '../storage.ts';
import { titleFromQuestion } from '../text/typography.ts';
import { segmentsToText } from '../text/transcript.ts';
import { transcriber } from '../transcribe/index.ts';
import { notifyAnswer } from './notify.ts';

export interface IngestInput {
	teller: Storyteller;
	promptId: string | null;
	storyId?: string | null;
	source: RecordingSource;
	data: Buffer | Readable | ReadableStream<Uint8Array>;
	ext: string;
	mime: string | null;
	externalId?: string | null;
}

/** Stores a new answer and queues it for transcription. */
export async function ingestRecording(sql: Sql, input: IngestInput): Promise<Recording> {
	const id = randomUUID();
	const key = keys.audio(input.teller.projectId, id, input.ext);
	const bytes = await putFile(key, input.data);
	let promptId = input.promptId;
	if (promptId) {
		const p = await promptById(sql, promptId);
		if (!p || p.projectId !== input.teller.projectId) promptId = null;
	}
	const rec = await createRecording(sql, {
		id,
		projectId: input.teller.projectId,
		storytellerId: input.teller.id,
		promptId,
		storyId: input.storyId ?? null,
		source: input.source,
		fileKey: key,
		mime: input.mime,
		bytes,
		externalId: input.externalId ?? null
	});
	if (promptId) await markPromptAnswered(sql, promptId);
	await enqueue(sql, 'transcribe', { recordingId: rec.id }, { maxAttempts: 3 });
	log.info('recording received', { id: rec.id, source: input.source, bytes });
	return rec;
}

/** Job handler: transcribe one recording and file the text into a story. */
export async function transcribeJob(
	job: Job<{ recordingId: string; refile?: boolean }>,
	sql: Sql
): Promise<void> {
	const rec = await getRecording(sql, job.payload.recordingId);
	if (!rec) return; // deleted meanwhile
	await sql`update recordings set status = 'processing', error = null where id = ${rec.id}`;

	const work = await mkdtemp(join(tmpdir(), 'kinstory-audio-'));
	try {
		const source = filePath(rec.fileKey);
		const wav = join(work, 'audio.wav');
		await toWhisperWav(source, wav);
		const duration = await probeDuration(wav);
		const project = await getProject(sql, rec.projectId);

		const t = transcriber();
		let text = '';
		let segments = null;
		let language = null;
		if (t) {
			const result = await t.transcribe(wav, { language: project?.language });
			segments = result.segments;
			language = result.language;
			text = segmentsToText(result.segments);
		}

		await sql`
			update recordings set status = 'done', transcript = ${text}, segments = ${segments ? sql.json(segments as never) : null},
				language = ${language}, duration_seconds = ${duration}
			where id = ${rec.id}`;
		// A re-transcription only refreshes the recording; the family decides
		// whether to swap it into the story they may already have edited.
		if (job.payload.refile !== false)
			await fileIntoStory(sql, { ...rec, transcript: text, durationSeconds: duration });
	} finally {
		await rm(work, { recursive: true, force: true });
	}
}

/** Creates a story for a fresh answer, or appends a follow-up to its story. */
export async function fileIntoStory(sql: Db, rec: Recording): Promise<string> {
	const text = rec.transcript ?? '';
	if (rec.storyId) {
		if (text) await appendToStory(sql, rec.storyId, text);
		return rec.storyId;
	}
	const prompt = rec.promptId ? await promptById(sql, rec.promptId) : null;
	const teller = rec.storytellerId ? await storytellerById(sql, rec.storytellerId) : null;
	const story = await createStory(sql, rec.projectId, {
		title: titleFromQuestion(prompt?.text),
		body: text,
		question: prompt?.text ?? null,
		askedBy: prompt?.askedBy ?? null,
		storytellerId: rec.storytellerId,
		promptId: rec.promptId,
		recordedAt: rec.createdAt,
		recordedVia: rec.source
	});
	await sql`update recordings set story_id = ${story.id} where id = ${rec.id}`;
	await notifyAnswer(sql, {
		projectId: rec.projectId,
		storyId: story.id,
		tellerName: teller?.name ?? 'Your storyteller',
		question: prompt?.text ?? null
	});
	return story.id;
}

/** When transcription fails for good, keep the audio and give the family a story to fill in by hand. */
export async function transcribeFailed(sql: Sql, job: Job, err: unknown): Promise<void> {
	const id = (job.payload as { recordingId?: string }).recordingId;
	if (!id) return;
	const message = err instanceof Error ? err.message : String(err);
	await sql`update recordings set status = 'failed', error = ${message} where id = ${id}`;
	const rec = await getRecording(sql, id);
	if (rec && !rec.storyId) await fileIntoStory(sql, { ...rec, transcript: '' });
}
