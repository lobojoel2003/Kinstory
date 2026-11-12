// Shaping raw speech-to-text output into readable prose without rewriting it.
// The elder's own words are the point of the book, so the only changes made
// here are the ones a careful human transcriber would make: drop recogniser
// artefacts, optionally drop hesitation sounds, and break into paragraphs
// where the speaker paused.

export interface Segment {
	start: number; // seconds
	end: number; // seconds
	text: string;
}

const ARTEFACTS =
	/\s*(\[[^\]]*\]|\((?:music|applause|silence|inaudible|blank[_ ]audio|noise|static|coughs?|coughing|background noise)[^)]*\)|♪+)\s*/gi;
const FILLERS =
	/(^|[\s,.;:!?])(?:u+m+|u+h+m*|e+r+m+|e+h+|h+m+|mm+-?hmm|a+h+)(?=[\s,.;:!?]|$)[,.]?/gi;

/** Removes recogniser artefacts such as "[BLANK_AUDIO]" or "(music)". */
export function stripArtefacts(text: string): string {
	return text
		.replace(ARTEFACTS, ' ')
		.replace(/\s{2,}/g, ' ')
		.trim();
}

/**
 * Light-touch clean-up: hesitation sounds ("um", "uh"), stuttered repeats
 * ("the the") and the stray punctuation they leave behind.
 */
export function tidy(text: string): string {
	let t = stripArtefacts(text);
	t = t.replace(FILLERS, '$1');
	// Stuttered word repeats: "I I went" → "I went". Leaves deliberate repeats
	// separated by punctuation ("slap, slap") alone.
	t = t.replace(/\b([A-Za-zÀ-ɏ']+)(\s+\1\b)+/gi, '$1');
	t = t
		.replace(/\s+([,.;:!?])/g, '$1')
		.replace(/([,;:])(?=[,.;:!?])/g, '')
		.replace(/^[,.;:\s]+/, '')
		.replace(/([.!?])\s*,/g, '$1')
		.replace(/\s{2,}/g, ' ')
		.trim();
	// Capitalise sentence starts that lost their first word.
	t = t.replace(/(^|[.!?]\s+)([a-z])/g, (_, p, c: string) => p + c.toUpperCase());
	return t;
}

export interface ParagraphOptions {
	/** Silence (seconds) between segments that starts a new paragraph. */
	pause?: number;
	/** Soft cap on paragraph length; a sentence end after this many words starts a new one. */
	maxWords?: number;
	tidy?: boolean;
}

/** Joins timed segments into paragraphs, splitting on long pauses and very long runs. */
export function segmentsToParagraphs(segments: Segment[], opts: ParagraphOptions = {}): string[] {
	const pause = opts.pause ?? 1.6;
	const maxWords = opts.maxWords ?? 140;
	const out: string[] = [];
	let current: string[] = [];
	let words = 0;
	let lastEnd: number | null = null;

	const flush = () => {
		const raw = current.join(' ');
		const text = opts.tidy === false ? stripArtefacts(raw) : tidy(raw);
		if (text) out.push(text);
		current = [];
		words = 0;
	};

	for (const seg of segments) {
		const text = seg.text.trim();
		if (!text) continue;
		const gap = lastEnd === null ? 0 : seg.start - lastEnd;
		const prevEndsSentence =
			current.length > 0 && /[.!?…]["”’)]?$/.test(current[current.length - 1]);
		if (current.length && (gap >= pause || (words >= maxWords && prevEndsSentence))) {
			flush();
		}
		current.push(text);
		words += text.split(/\s+/).length;
		lastEnd = seg.end;
	}
	if (current.length) flush();
	return out;
}

/** Plain text (paragraphs separated by blank lines) from segments. */
export function segmentsToText(segments: Segment[], opts?: ParagraphOptions): string {
	return segmentsToParagraphs(segments, opts).join('\n\n');
}
