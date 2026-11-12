import { error } from '@sveltejs/kit';
import { fileSize, fileStream } from './storage.ts';

/** Serves a stored file, honouring HTTP Range requests so audio can seek. */
export async function serveFile(
	key: string,
	request: Request,
	opts: { type: string; filename?: string; download?: boolean; cache?: string }
): Promise<Response> {
	const size = await fileSize(key);
	if (size === null) error(404, 'File not found');
	const headers: Record<string, string> = {
		'content-type': opts.type,
		'accept-ranges': 'bytes',
		'cache-control': opts.cache ?? 'private, max-age=3600'
	};
	if (opts.filename) {
		headers['content-disposition'] =
			`${opts.download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(opts.filename)}`;
	}
	const range = request.headers.get('range');
	const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
	if (m && (m[1] || m[2])) {
		let start = m[1] ? Number(m[1]) : size - Number(m[2]);
		let end = m[1] && m[2] ? Number(m[2]) : size - 1;
		start = Math.max(0, start);
		end = Math.min(size - 1, end);
		if (start > end || start >= size) {
			return new Response(null, { status: 416, headers: { 'content-range': `bytes */${size}` } });
		}
		return new Response(fileStream(key, { start, end }), {
			status: 206,
			headers: {
				...headers,
				'content-range': `bytes ${start}-${end}/${size}`,
				'content-length': String(end - start + 1)
			}
		});
	}
	return new Response(fileStream(key), { headers: { ...headers, 'content-length': String(size) } });
}
