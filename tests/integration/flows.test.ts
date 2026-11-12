import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { unzipSync } from 'fflate';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closeDb, db, freshDatabase, hasBinary, makeAudio } from './helpers.ts';
import { createSession, validateSession, deleteSession } from '#lib/server/auth.ts';
import { claim, complete, enqueue, fail, recoverStale } from '#lib/server/jobs.ts';
import { migrate } from '#lib/server/migrate.ts';
import {
	acceptInvite,
	createInvite,
	createProject,
	getProjectForUser,
	listMembers
} from '#lib/server/repo/projects.ts';
import { listPrompts, markPromptSent } from '#lib/server/repo/prompts.ts';
import { renderById } from '#lib/server/repo/renders.ts';
import { getRecording, listStories } from '#lib/server/repo/stories.ts';
import {
	currentPrompt,
	listStorytellers,
	storytellerByPhone,
	storytellerByPin
} from '#lib/server/repo/storytellers.ts';
import { authenticate, createUser, EmailTakenError } from '#lib/server/repo/users.ts';
import { renderJob, requestRender } from '#lib/server/services/book.ts';
import { ingestRecording, transcribeJob } from '#lib/server/services/capture.ts';
import { scheduleTick } from '#lib/server/services/delivery.ts';
import { exportStream } from '#lib/server/services/export.ts';
import { askForPin, questionAndRecord, recordingReady } from '#lib/server/services/phone.ts';
import { filePath } from '#lib/server/storage.ts';
import type { Job } from '#lib/server/jobs.ts';
import type { Project, Storyteller, User } from '#lib/types.ts';

const sql = () => db();
let owner: User;
let project: Project;
let teller: Storyteller;

beforeAll(async () => {
	await freshDatabase();
	owner = await createUser(sql(), {
		email: 'maya@example.com',
		name: 'Maya',
		password: 'a-long-password'
	});
	project = await createProject(sql(), owner.id, {
		title: 'Bread & Salt',
		storytellerName: 'Rosa Delgado',
		askedBy: 'Maya'
	});
	[teller] = await listStorytellers(sql(), project.id);
});

afterAll(async () => {
	await closeDb();
});

async function runNext(kind: Job['kind']) {
	const job = await claim(sql(), [kind]);
	expect(job, `a queued ${kind} job`).not.toBeNull();
	return job!;
}

describe('migrations', () => {
	it('are idempotent', async () => {
		expect(await migrate(sql())).toEqual([]);
	});
});

describe('accounts and sessions', () => {
	it('authenticates by email, case-insensitively', async () => {
		expect((await authenticate(sql(), 'MAYA@example.com', 'a-long-password'))?.id).toBe(owner.id);
		expect(await authenticate(sql(), 'maya@example.com', 'wrong')).toBeNull();
		expect(await authenticate(sql(), 'nobody@example.com', 'a-long-password')).toBeNull();
	});

	it('refuses a second account with the same email', async () => {
		await expect(
			createUser(sql(), { email: 'Maya@Example.com', name: 'M', password: 'xxxxxxxxxxxx' })
		).rejects.toBeInstanceOf(EmailTakenError);
	});

	it('stores only a hash of the session token', async () => {
		const { token } = await createSession(sql(), owner.id);
		const [row] = await sql()`select id from sessions where user_id = ${owner.id} limit 1`;
		expect(row.id).not.toBe(token);
		expect((await validateSession(sql(), token))?.user.email).toBe('maya@example.com');
		await deleteSession(sql(), token);
		expect(await validateSession(sql(), token)).toBeNull();
	});
});

describe('a new book', () => {
	it('starts with an owner, a storyteller with a code and link, and nine questions', async () => {
		const members = await listMembers(sql(), project.id);
		expect(members.map((m) => m.role)).toEqual(['owner']);
		expect(teller.pin).toMatch(/^\d{6}$/);
		expect(teller.answerToken.length).toBeGreaterThanOrEqual(24);
		const prompts = await listPrompts(sql(), project.id);
		expect(prompts).toHaveLength(9);
		expect(prompts.every((p) => p.askedBy === 'Maya')).toBe(true);
	});

	it('asks a sent question again until it is answered', async () => {
		const prompts = await listPrompts(sql(), project.id);
		expect((await currentPrompt(sql(), teller))?.id).toBe(prompts[0].id);
		await markPromptSent(sql(), prompts[2].id);
		expect((await currentPrompt(sql(), teller))?.id).toBe(prompts[2].id);
	});

	it('is invisible to people who are not members until they accept an invite', async () => {
		const cousin = await createUser(sql(), {
			email: 'dan@example.com',
			name: 'Daniel',
			password: 'another-long-one'
		});
		expect(await getProjectForUser(sql(), project.id, cousin.id)).toBeNull();
		const token = await createInvite(sql(), project.id, owner.id);
		expect(await acceptInvite(sql(), token, cousin.id)).toBe(project.id);
		expect((await getProjectForUser(sql(), project.id, cousin.id))?.role).toBe('editor');
		expect(await acceptInvite(sql(), token, cousin.id)).toBeNull(); // single use
	});
});

describe('from voice note to story', () => {
	it.skipIf(!hasBinary('ffmpeg', ['-version']))(
		'stores, transcribes, tidies and files the answer',
		async () => {
			const prompt = (await currentPrompt(sql(), teller))!;
			const rec = await ingestRecording(sql(), {
				teller,
				promptId: prompt.id,
				source: 'web',
				data: await readFile(makeAudio(3)),
				ext: 'wav',
				mime: 'audio/wav'
			});
			expect(rec.status).toBe('pending');

			const job = await runNext('transcribe');
			await transcribeJob(job as never, sql());
			await complete(sql(), job.id);

			const done = (await getRecording(sql(), rec.id))!;
			expect(done.status).toBe('done');
			expect(done.durationSeconds).toBeCloseTo(3, 0);
			expect(done.storyId).not.toBeNull();

			const stories = await listStories(sql(), project.id);
			const story = stories.find((s) => s.id === done.storyId)!;
			expect(story.question).toBe(prompt.text);
			expect(story.askedBy).toBe('Maya');
			expect(story.recordedVia).toBe('web');
			// The fake transcript starts "Well, um, let me think about that." and has a long pause.
			expect(story.body.split('\n\n')[0]).toBe(
				'Well, let me think about that. We lived in a small house by the water, and every morning my father went down to the boats.'
			);
			expect(story.body.split('\n\n')).toHaveLength(2);

			const answered = (await listPrompts(sql(), project.id)).find((p) => p.id === prompt.id)!;
			expect(answered.status).toBe('answered');
		}
	);
});

describe('job queue', () => {
	it('retries with backoff, then gives up', async () => {
		const id = await enqueue(sql(), 'deliver-prompt', { tellerId: 'nobody' }, { maxAttempts: 2 });
		const first = await runNext('deliver-prompt');
		expect(first.id).toBe(id);
		expect(await fail(sql(), first, new Error('busy'))).toBe('retry');
		expect(await claim(sql(), ['deliver-prompt'])).toBeNull(); // backing off
		await sql()`update jobs set run_at = now() where id = ${id}`;
		const second = await runNext('deliver-prompt');
		expect(second.attempts).toBe(2);
		expect(await fail(sql(), second, new Error('still busy'))).toBe('failed');
	});

	it('recovers jobs abandoned by a crashed worker', async () => {
		const id = await enqueue(sql(), 'render', { renderId: 'x' });
		await sql()`update jobs set status = 'running', locked_at = now() - interval '2 hours' where id = ${id}`;
		expect(await recoverStale(sql(), 30)).toBeGreaterThanOrEqual(1);
		const [row] = await sql()`select status from jobs where id = ${id}`;
		expect(row.status).toBe('queued');
		await sql()`delete from jobs where id = ${id}`;
	});
});

describe('weekly schedule', () => {
	it('queues one delivery per scheduled moment, even if ticked twice', async () => {
		await sql()`
			update storytellers set phone = '+15555550142', delivery = 'sms', call_day = 0, call_time = '10:30',
				timezone = 'America/New_York', last_prompted_at = null
			where id = ${teller.id}`;
		const sundayMorning = new Date('2026-11-15T15:31:00Z');
		expect(await scheduleTick(sql(), sundayMorning)).toBe(1);
		expect(await scheduleTick(sql(), new Date(sundayMorning.getTime() + 60_000))).toBe(0);
		const [job] =
			await sql()`select payload from jobs where kind = 'deliver-prompt' and status = 'queued'`;
		expect(job.payload).toEqual({ tellerId: teller.id });
	});
});

describe('phone line', () => {
	it('recognises the storyteller by number and code', async () => {
		expect((await storytellerByPhone(sql(), '(555) 555-0142'))?.id).toBe(teller.id);
		const fresh = (await listStorytellers(sql(), project.id))[0];
		expect((await storytellerByPin(sql(), fresh.pin))?.id).toBe(teller.id);
		expect(await storytellerByPin(sql(), '12')).toBeNull();
	});

	it('reads the current question and records the answer', async () => {
		const fresh = (await listStorytellers(sql(), project.id))[0];
		const res = await questionAndRecord(
			sql(),
			fresh,
			new URL('https://kinstory.test/api/voice/incoming')
		);
		const body = await res.text();
		expect(res.headers.get('content-type')).toContain('text/xml');
		expect(body).toContain('Hello Rosa.');
		expect(body).toContain('<Record action="https://kinstory.test/api/voice/done?s=');
		expect(body).toContain('recordingStatusCallback="https://kinstory.test/api/voice/recording?s=');
		expect(body).toMatch(/<Say voice="Polly\.Joanna-Neural" language="en-US">/);
	});

	it('leaves a short message on an answering machine', async () => {
		const fresh = (await listStorytellers(sql(), project.id))[0];
		const body = await (
			await questionAndRecord(sql(), fresh, new URL('https://kinstory.test/'), 'machine_start')
		).text();
		expect(body).toContain('Call 1 5 5 5 0 1 0 0 1 9 9');
		expect(body).not.toContain('<Record');
	});

	it('asks unknown callers for their code', async () => {
		const body = await askForPin(new URL('https://kinstory.test/api/voice/incoming')).text();
		expect(body).toContain('<Gather input="dtmf" numDigits="6"');
	});

	it('queues a finished call recording once', async () => {
		const params = {
			RecordingSid: 'RE0123456789abcdef0123456789abcdef',
			RecordingUrl: 'https://api.twilio.com/x',
			RecordingStatus: 'completed',
			RecordingDuration: '42'
		};
		await recordingReady(sql(), params, teller.id, null);
		const [{ n }] =
			await sql()`select count(*)::int as n from jobs where kind = 'fetch-phone-recording'`;
		expect(n).toBe(1);
	});
});

describe('export', () => {
	it('produces a zip with stories, audio and data', async () => {
		const res = new Response(exportStream(sql(), project));
		const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
		const names = Object.keys(files);
		expect(names).toContain('README.txt');
		expect(names).toContain('book.json');
		expect(names.some((n) => n.startsWith('stories/') && n.endsWith('.md'))).toBe(true);
		const data = JSON.parse(new TextDecoder().decode(files['book.json']));
		expect(data.format).toBe('kinstory-export');
		// Secrets that let someone answer as the storyteller are never exported.
		expect(JSON.stringify(data.storytellers)).not.toContain(teller.answerToken);
	});
});

describe('typesetting', () => {
	const typst = process.env.TYPST_BIN ?? join(process.cwd(), '.tools', 'bin', 'typst');
	it.skipIf(!hasBinary(typst) && !hasBinary('typst'))(
		'renders the interior and cover PDFs',
		async () => {
			const render = await requestRender(sql(), project, owner.id);
			const job = await runNext('render');
			await renderJob(job as never, sql());
			const done = (await renderById(sql(), render.id))!;
			expect(done.status).toBe('done');
			expect(done.pages).toBeGreaterThanOrEqual(8);
			expect(done.spineInches).toBeGreaterThan(0);
			const pdf = await readFile(filePath(`${done.dirKey}/interior.pdf`));
			expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
			const cover = await readFile(filePath(`${done.dirKey}/cover.pdf`));
			expect(cover.subarray(0, 5).toString()).toBe('%PDF-');
		}
	);
});
