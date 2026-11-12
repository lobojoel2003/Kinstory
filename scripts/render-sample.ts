// Renders the demo family's book (interior + cover) without a database.
// Used to produce the sample PDFs attached to each GitHub release and the
// spreads in the README.
//
//   npm run render:sample                      # heirloom, 6x9, colour → sample/
//   npm run render:sample -- --theme caslon --out sample/caslon

import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { isKey, THEMES, TRIMS, BLEED_MODES } from '../src/lib/book-options.ts';
import { renderCover, renderInterior } from '../src/lib/server/book/render.ts';
import { demoBookInput } from '../src/lib/server/demo/fixture.ts';

const { values } = parseArgs({
	options: {
		theme: { type: 'string', default: 'heirloom' },
		trim: { type: 'string', default: '6x9' },
		bleed: { type: 'string', default: 'none' },
		mono: { type: 'boolean', default: false },
		previews: { type: 'boolean', default: false },
		out: { type: 'string', default: 'sample' }
	}
});

if (!isKey(THEMES, values.theme)) throw new Error(`Unknown theme ${values.theme}`);
if (!isKey(TRIMS, values.trim)) throw new Error(`Unknown trim ${values.trim}`);
if (!isKey(BLEED_MODES, values.bleed)) throw new Error(`Unknown bleed mode ${values.bleed}`);

const started = Date.now();
const input = await demoBookInput({
	theme: values.theme,
	trim: values.trim,
	bleedMode: values.bleed,
	color: !values.mono,
	listenQr: true
});
const out = resolve(values.out);
const interior = await renderInterior(input, out, { previews: values.previews });
const cover = await renderCover(input, interior.pages, out);
console.log(
	`Rendered ${interior.pages} pages in ${((Date.now() - started) / 1000).toFixed(1)}s\n  ${interior.pdf}\n  ${cover.pdf} (spine ${cover.spine} in)`
);
