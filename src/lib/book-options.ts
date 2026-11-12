// Book design options shared by the designer UI and the renderer.

export const TRIMS = {
	'6x9': {
		label: '6 × 9 in',
		note: 'Trade paperback, the standard memoir size',
		width: 6,
		height: 9
	},
	'5.5x8.5': {
		label: '5.5 × 8.5 in',
		note: 'Digest, light and pocketable',
		width: 5.5,
		height: 8.5
	},
	'7x10': { label: '7 × 10 in', note: 'Large trade, more room for photos', width: 7, height: 10 },
	'8x10': { label: '8 × 10 in', note: 'Photo book proportions', width: 8, height: 10 },
	a5: {
		label: 'A5',
		note: '148 × 210 mm, common outside North America',
		width: 5.827,
		height: 8.268
	}
} as const;
export type TrimId = keyof typeof TRIMS;

export const THEMES = {
	heirloom: {
		label: 'Heirloom',
		note: 'EB Garamond with Cormorant titles. Classic, warm, a little romantic.',
		body: 'EB Garamond',
		display: 'Cormorant Garamond'
	},
	caslon: {
		label: 'Almanac',
		note: 'Libre Caslon. Sturdy eighteenth-century letters with a printer’s ornament.',
		body: 'Libre Caslon Text',
		display: 'Libre Caslon Display'
	},
	modern: {
		label: 'Field Notes',
		note: 'Newsreader with Inter labels. Quiet, contemporary, very readable.',
		body: 'Newsreader',
		display: 'Newsreader'
	}
} as const;
export type ThemeId = keyof typeof THEMES;

export const BLEED_MODES = {
	none: {
		label: 'Home printing or screen',
		note: 'No bleed. Best for reading on screen or printing at a copy shop.'
	},
	all: { label: 'Lulu and most print-on-demand', note: '⅛ in bleed on every edge.' },
	outside: {
		label: 'Amazon KDP or IngramSpark',
		note: '⅛ in bleed on the outside, top and bottom edges.'
	}
} as const;
export type BleedMode = keyof typeof BLEED_MODES;

/** Paper thickness per page (inches), used to size the cover spine. */
export const PAPERS = {
	cream: { label: 'Cream', caliper: 0.0025 },
	white: { label: 'White', caliper: 0.002252 }
} as const;
export type PaperId = keyof typeof PAPERS;

export const COVER_COLORS = {
	oxblood: { label: 'Oxblood', cloth: '#5e2620', ink: '#f2e7d3' },
	forest: { label: 'Forest', cloth: '#2c4436', ink: '#efe8d6' },
	navy: { label: 'Navy', cloth: '#1f2c42', ink: '#ece5d4' },
	ochre: { label: 'Ochre', cloth: '#a8742c', ink: '#fbf4e4' },
	charcoal: { label: 'Charcoal', cloth: '#2a2826', ink: '#ece6da' },
	linen: { label: 'Linen', cloth: '#e7dfcf', ink: '#2a2420' }
} as const;
export type CoverColor = keyof typeof COVER_COLORS;

export const PHOTO_LAYOUTS = {
	full: 'Full width',
	inset: 'Inset',
	pair: 'Side by side (pairs with the next photo)',
	plate: 'Full page'
} as const;
export type PhotoLayout = keyof typeof PHOTO_LAYOUTS;

export const LANGUAGES = {
	en: 'English',
	es: 'Español',
	fr: 'Français',
	de: 'Deutsch',
	it: 'Italiano',
	pt: 'Português',
	nl: 'Nederlands'
} as const;
export type LanguageId = keyof typeof LANGUAGES;

export interface BookDesign {
	trim: TrimId;
	theme: ThemeId;
	color: boolean;
	bleedMode: BleedMode;
	paper: PaperId;
	dropCaps: boolean;
	chapterNumbers: boolean;
	questionsIndex: boolean;
	listenQr: boolean;
	coverColor: CoverColor;
}

export const DEFAULT_DESIGN: BookDesign = {
	trim: '6x9',
	theme: 'heirloom',
	color: true,
	bleedMode: 'none',
	paper: 'cream',
	dropCaps: true,
	chapterNumbers: true,
	questionsIndex: true,
	listenQr: false,
	coverColor: 'oxblood'
};

export function isKey<T extends object>(obj: T, key: unknown): key is keyof T {
	return typeof key === 'string' && Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Spine width in inches for a page count. Lulu adds a 0.06 in allowance for
 * the cover wrap; KDP and IngramSpark use the paper thickness alone.
 */
export function spineWidth(pages: number, paper: PaperId, bleedMode: BleedMode = 'all'): number {
	const allowance = bleedMode === 'all' ? 0.06 : 0;
	return Math.round((pages * PAPERS[paper].caliper + allowance) * 1000) / 1000;
}
