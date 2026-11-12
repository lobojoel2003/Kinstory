// Print typography for plain text: curly quotes, real dashes and ellipses.
// Transcripts and hand edits arrive as typewriter text; the book should not.

const OPENERS = /[\s([{—–-]/;

/** Converts straight quotes, double hyphens and triple dots to their typographic forms. */
export function smarten(input: string): string {
	let out = '';
	const s = input
		.replace(/\.\.\./g, '…')
		.replace(/ ?--- ?/g, '—')
		.replace(/ -- /g, ' — ')
		.replace(/--/g, '—');
	for (let i = 0; i < s.length; i++) {
		const ch = s[i];
		const prev = i > 0 ? s[i - 1] : '';
		const next = i + 1 < s.length ? s[i + 1] : '';
		if (ch === '"') {
			out += prev === '' || OPENERS.test(prev) ? '“' : '”';
		} else if (ch === "'") {
			if (/[A-Za-z0-9À-ɏ]/.test(prev) && /[A-Za-zÀ-ɏ]/.test(next)) {
				out += '’'; // contraction: don't, Rosa's
			} else if (
				(prev === '' || OPENERS.test(prev)) &&
				/\d/.test(next) &&
				/\d{2}\b/.test(s.slice(i + 1, i + 4))
			) {
				out += '’'; // abbreviated year: '66
			} else if (prev === '' || OPENERS.test(prev)) {
				out += '‘';
			} else {
				out += '’';
			}
		} else {
			out += ch;
		}
	}
	return out;
}

/** Splits text into paragraphs on blank lines, collapsing internal whitespace. */
export function paragraphs(text: string): string[] {
	return text
		.replace(/\r\n?/g, '\n')
		.split(/\n\s*\n/)
		.map((p) => p.replace(/\s+/g, ' ').trim())
		.filter(Boolean);
}

/** Word count, for story lengths and reading-time estimates. */
export function wordCount(text: string): number {
	const m = text.trim().match(/\S+/g);
	return m ? m.length : 0;
}

/** Shortens text to at most `max` characters on a word boundary. */
export function truncate(text: string, max: number): string {
	const t = text.trim();
	if (t.length <= max) return t;
	const cut = t.slice(0, max - 1);
	const at = cut.lastIndexOf(' ');
	return `${(at > max * 0.5 ? cut.slice(0, at) : cut).replace(/[\s,;:.]+$/, '')}…`;
}

/** Turns a question into a provisional story title: "How did you meet Grandpa?" → "How Did You Meet Grandpa". */
export function titleFromQuestion(question: string | null | undefined): string {
	if (!question) return 'Untitled story';
	const q = question.trim().replace(/[?.!]+$/, '');
	return truncate(q, 80) || 'Untitled story';
}
