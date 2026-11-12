// "Take your stories with you": a zip of everything the family put into
// Kinstory, in open formats, readable without Kinstory.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Zip, ZipDeflate, ZipPassThrough } from 'fflate';
import type { Project } from '#lib/types.ts';
import type { Db } from '../db.ts';
import { listPhotos, listStories } from '../repo/stories.ts';
import { latestDoneRender } from '../repo/renders.ts';
import { listStorytellers } from '../repo/storytellers.ts';
import { listPrompts } from '../repo/prompts.ts';
import { filePath } from '../storage.ts';
import type { Recording } from '#lib/types.ts';

export function slug(s: string): string {
	return (
		s
			.normalize('NFKD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 60) || 'untitled'
	);
}

function yamlString(v: string | null | undefined): string {
	return v == null ? '~' : JSON.stringify(v);
}

const README = (p: Project) => `${p.title}
${'='.repeat(p.title.length)}

This archive holds everything your family put into Kinstory for this book.

  stories/     Each story as a Markdown file you can open in any text editor.
  audio/       The original recordings, exactly as they were received.
  photos/      Photos at the resolution they were uploaded.
  book/        The most recent print-ready PDFs (interior and cover).
  book.json    All of the above as structured data, including transcripts
               with timestamps, questions, captions and design settings.

Kinstory is free software. These files are yours.
`;

export function exportStream(sql: Db, project: Project): ReadableStream<Uint8Array> {
	return new ReadableStream<Uint8Array>({
		async start(controller) {
			const zip = new Zip((err, chunk, final) => {
				if (err) controller.error(err);
				else {
					controller.enqueue(chunk);
					if (final) controller.close();
				}
			});
			const addText = (name: string, text: string) => {
				const f = new ZipDeflate(name, { level: 6 });
				zip.add(f);
				f.push(new TextEncoder().encode(text), true);
			};
			const addFile = async (name: string, path: string) => {
				try {
					const data = await readFile(path);
					const f = new ZipPassThrough(name);
					zip.add(f);
					f.push(data, true);
				} catch {
					// A missing file should not sink the whole export.
				}
			};

			try {
				const [stories, photos, tellers, prompts, render] = await Promise.all([
					listStories(sql, project.id),
					listPhotos(sql, project.id),
					listStorytellers(sql, project.id),
					listPrompts(sql, project.id),
					latestDoneRender(sql, project.id)
				]);
				const recordings = await sql<
					Recording[]
				>`select * from recordings where project_id = ${project.id} order by created_at`;

				addText('README.txt', README(project));
				const storyFiles = new Map<string, string>();
				for (const [i, s] of stories.entries()) {
					const name = `${String(i + 1).padStart(3, '0')}-${slug(s.title)}`;
					storyFiles.set(s.id, name);
					const md = [
						'---',
						`title: ${yamlString(s.title)}`,
						`question: ${yamlString(s.question)}`,
						`asked_by: ${yamlString(s.askedBy)}`,
						`part: ${yamlString(s.part)}`,
						`recorded: ${s.recordedAt ? s.recordedAt.toISOString() : '~'}`,
						`recorded_via: ${yamlString(s.recordedVia)}`,
						`in_book: ${s.includeInBook}`,
						'---',
						'',
						`# ${s.title}`,
						'',
						s.question ? `> ${s.question}${s.askedBy ? ` — ${s.askedBy}` : ''}\n` : '',
						s.body.trim(),
						''
					].join('\n');
					addText(`stories/${name}.md`, md);
				}
				for (const r of recordings) {
					const folder = r.storyId ? (storyFiles.get(r.storyId) ?? 'unfiled') : 'unfiled';
					const ext = r.fileKey.split('.').pop();
					await addFile(
						`audio/${folder}/${r.createdAt.toISOString().slice(0, 10)}-${r.id.slice(0, 8)}.${ext}`,
						filePath(r.fileKey)
					);
				}
				for (const p of photos) await addFile(`photos/${p.id}.jpg`, filePath(p.fileKey));
				if (render?.dirKey) {
					const dir = filePath(render.dirKey);
					await addFile(`book/${slug(project.title)}-interior.pdf`, join(dir, 'interior.pdf'));
					await addFile(`book/${slug(project.title)}-cover.pdf`, join(dir, 'cover.pdf'));
				}
				addText(
					'book.json',
					JSON.stringify(
						{
							format: 'kinstory-export',
							version: 1,
							exportedAt: new Date().toISOString(),
							project,
							storytellers: tellers.map(({ answerToken: _a, pin: _p, ...t }) => t),
							prompts,
							stories: stories.map((s) => ({ ...s, file: `stories/${storyFiles.get(s.id)}.md` })),
							recordings: recordings.map(({ fileKey: _f, ...r }) => r),
							photos: photos.map(({ fileKey: _f, ...p }) => ({ ...p, file: `photos/${p.id}.jpg` }))
						},
						null,
						2
					)
				);
				zip.end();
			} catch (err) {
				controller.error(err);
			}
		}
	});
}
