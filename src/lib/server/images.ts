import sharp from 'sharp';

export interface ImageInfo {
	width: number;
	height: number;
	format: string;
}

/** Reads dimensions after EXIF rotation, so portrait phone photos report as portrait. */
export async function imageInfo(input: string | Buffer): Promise<ImageInfo> {
	const meta = await sharp(input).metadata();
	if (!meta.width || !meta.height) throw new Error('Not a readable image');
	const rotated = (meta.orientation ?? 1) >= 5;
	return {
		width: rotated ? meta.height : meta.width,
		height: rotated ? meta.width : meta.height,
		format: meta.format ?? 'unknown'
	};
}

/**
 * Normalises an uploaded photo for storage: applies EXIF rotation, strips
 * metadata such as GPS location, caps very large images and re-encodes as JPEG.
 */
export async function normalizePhoto(
	input: Buffer
): Promise<{ data: Buffer; width: number; height: number }> {
	const { data, info } = await sharp(input, { failOn: 'error' })
		.rotate()
		.resize({ width: 4000, height: 4000, fit: 'inside', withoutEnlargement: true })
		.flatten({ background: '#ffffff' })
		.jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true })
		.toBuffer({ resolveWithObject: true });
	return { data, width: info.width, height: info.height };
}

/** Small preview for the web interface. */
export async function thumbnail(input: string | Buffer, size = 640): Promise<Buffer> {
	return sharp(input)
		.rotate()
		.resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
		.webp({ quality: 78 })
		.toBuffer();
}

/** Prepares a photo for print: sRGB JPEG at no more than `maxPx` on the long edge, optionally greyscale. */
export async function prepareForPrint(
	src: string,
	dest: string,
	opts: { maxPx: number; grayscale: boolean }
): Promise<void> {
	let img = sharp(src)
		.rotate()
		.resize({ width: opts.maxPx, height: opts.maxPx, fit: 'inside', withoutEnlargement: true });
	img = img.flatten({ background: '#ffffff' });
	if (opts.grayscale) img = img.grayscale();
	await img.toColourspace('srgb').jpeg({ quality: 90, chromaSubsampling: '4:4:4' }).toFile(dest);
}
