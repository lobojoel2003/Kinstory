import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db.ts';
import { requireProject } from '#lib/server/guard.ts';
import { getRender, latestDoneRender } from '#lib/server/repo/renders.ts';
import { serveFile } from '#lib/server/serve.ts';
import { slug } from '#lib/server/services/export.ts';
import type { RequestHandler } from './$types';

const FILES = /^(interior\.pdf|cover\.pdf|cover\.webp|front\.webp|pages\/\d{4}\.webp)$/;

export const GET: RequestHandler = async (event) => {
	const { project } = await requireProject(event);
	const { renderId, file } = event.params;
	if (!FILES.test(file)) error(404, 'Not found');
	const render =
		renderId === 'latest'
			? await latestDoneRender(db(), project.id)
			: await getRender(db(), project.id, renderId);
	if (!render?.dirKey || render.status !== 'done') error(404, 'Not rendered yet');
	const pdf = file.endsWith('.pdf');
	const name = pdf
		? `${slug(project.title)}-${file.replace('.pdf', '')}-${render.createdAt.toISOString().slice(0, 10)}.pdf`
		: undefined;
	return serveFile(`${render.dirKey}/${file}`, event.request, {
		type: pdf ? 'application/pdf' : 'image/webp',
		filename: name,
		download: event.url.searchParams.has('download'),
		cache: renderId === 'latest' ? 'private, no-cache' : 'private, max-age=31536000, immutable'
	});
};
