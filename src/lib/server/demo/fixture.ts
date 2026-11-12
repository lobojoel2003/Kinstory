// Loads the fictional demo family in demo/rosa.json. Used by the demo seed,
// the sample-book render and the tests.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_DESIGN, type BookDesign, type PhotoLayout } from '#lib/book-options.ts';
import type { BookInput } from '../book/book-data.ts';
import { imageInfo } from '../images.ts';
import { assetsDir } from '../paths.ts';

export interface DemoPhoto {
	photo: string;
	caption: string;
	layout: PhotoLayout;
	after: number | null;
}

export interface DemoStory {
	title: string;
	question: string;
	askedBy: string;
	recorded: string;
	via: 'phone' | 'voice note';
	pullQuote: string | null;
	photos: DemoPhoto[];
	text: string;
}

export interface DemoFixture {
	organizer: { name: string; email: string; password: string };
	project: {
		title: string;
		subtitle: string;
		imprint: string;
		dedication: string;
		afterword: string[];
		blurb: string;
	};
	storyteller: { name: string; phone: string; timezone: string; callDay: number; callTime: string };
	members: string[];
	frontispiece: { photo: string; caption: string };
	parts: { title: string; stories: DemoStory[] }[];
}

export const demoDir = () => join(assetsDir(), 'demo');
export const demoPhotoPath = (name: string) => join(demoDir(), 'photos', `${name}.jpg`);

export async function loadDemo(): Promise<DemoFixture> {
	return JSON.parse(await readFile(join(demoDir(), 'rosa.json'), 'utf8')) as DemoFixture;
}

/** The demo family as renderer input, without touching the database. */
export async function demoBookInput(design: Partial<BookDesign> = {}): Promise<BookInput> {
	const demo = await loadDemo();
	const info = async (name: string) => ({
		file: demoPhotoPath(name),
		...(await imageInfo(demoPhotoPath(name)))
	});
	const stories: BookInput['stories'] = [];
	let n = 0;
	for (const part of demo.parts) {
		for (const s of part.stories) {
			n++;
			stories.push({
				id: `demo-${n}`,
				title: s.title,
				question: s.question,
				askedBy: s.askedBy,
				part: part.title,
				body: s.text,
				pullQuote: s.pullQuote,
				recordedAt: new Date(`${s.recorded}T12:00:00Z`),
				recordedVia: s.via === 'phone' ? 'phone' : 'web',
				listenUrl: `https://kinstory.example/l/demo-${n}`,
				photos: await Promise.all(
					s.photos.map(async (p, i) => ({
						id: `demo-${n}-${i}`,
						...(await info(p.photo)),
						caption: p.caption,
						layout: p.layout,
						anchor: p.after
					}))
				)
			});
		}
	}
	const front = await info(demo.frontispiece.photo);
	return {
		title: demo.project.title,
		subtitle: demo.project.subtitle,
		author: demo.storyteller.name,
		imprint: demo.project.imprint,
		dedication: demo.project.dedication,
		afterword: demo.project.afterword.join('\n\n'),
		blurb: demo.project.blurb,
		language: 'en',
		design: { ...DEFAULT_DESIGN, ...design },
		frontispiece: { id: 'frontispiece', ...front, caption: demo.frontispiece.caption },
		coverPhoto: { id: 'cover', ...(await info('harbour-wall')) },
		stories,
		now: new Date('2026-11-01T12:00:00Z')
	};
}
