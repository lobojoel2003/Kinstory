import { db } from '#lib/server/db.ts';
import { requireProject } from '#lib/server/guard.ts';
import { exportStream, slug } from '#lib/server/services/export.ts';
import type { RequestHandler } from './$types';

/** Everything in the book as a zip of open formats. */
export const GET: RequestHandler = async (event) => {
	const { project } = await requireProject(event);
	const name = `${slug(project.title)}-kinstory-${new Date().toISOString().slice(0, 10)}.zip`;
	return new Response(exportStream(db(), project), {
		headers: {
			'content-type': 'application/zip',
			'content-disposition': `attachment; filename="${name}"`,
			'cache-control': 'no-store'
		}
	});
};
