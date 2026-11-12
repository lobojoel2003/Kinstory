#!/usr/bin/env node
// Generates the demo family's "old photographs" from simple vector scenes so
// that the repository ships no third-party imagery. Each scene is rasterised,
// toned sepia, softened, given film grain, a vignette and a deckled print
// border. Output: demo/photos/*.jpg
//
//   node scripts/demo-photos.mjs

import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const out = resolve(import.meta.dirname, '..', 'demo', 'photos');
mkdirSync(out, { recursive: true });

// Deterministic pseudo-random numbers so regenerated photos are identical.
function rng(seed) {
	let s = seed >>> 0;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 2 ** 32;
	};
}

const sky = (id, top, bottom) =>
	`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;

function clouds(r, w, h, n, color = '#ffffff', opacity = 0.55) {
	let s = '';
	for (let i = 0; i < n; i++) {
		const cx = r() * w;
		const cy = r() * h;
		const rx = 80 + r() * 220;
		s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.28}" fill="${color}" opacity="${opacity * (0.5 + r() * 0.5)}" filter="url(#soft)"/>`;
	}
	return s;
}

const defs = (extra = '') =>
	`<defs><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter><filter id="haze"><feGaussianBlur stdDeviation="3"/></filter>${extra}</defs>`;

const scenes = {
	'calle-del-mar': () => {
		const r = rng(7);
		const W = 1800;
		const H = 1200;
		return {
			W,
			H,
			svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs(sky('s', '#8ea4b3', '#ebe5d6') + sky('g', '#b8aa93', '#857761'))}
<rect width="${W}" height="${H}" fill="url(#s)"/>
${clouds(r, W, 420, 9)}
<rect y="650" width="${W}" height="90" fill="#93a5ad"/>
<rect y="735" width="${W}" height="${H}" fill="url(#g)"/>
<path d="M0 520 h470 v420 h-470z" fill="#e6e1d6"/><path d="M0 500 h490 v26 h-490z" fill="#9b8f7c"/>
<rect x="90" y="610" width="90" height="120" fill="#55615c"/><rect x="290" y="610" width="90" height="120" fill="#55615c"/>
<path d="M1310 560 h490 v380 h-490z" fill="#d9d2c4"/><path d="M1290 540 L1560 440 L1800 520 L1800 560 L1290 560z" fill="#7e5a47"/>
<rect x="1420" y="650" width="100" height="140" fill="#4d5752"/>
<path d="M500 930 V500 L900 330 L1300 500 V930z" fill="#f4f1ea"/>
<path d="M1300 500 V930 H1240 V520z" fill="#d6d0c4"/>
<path d="M460 512 L900 318 L1340 512 L1320 532 L900 352 L480 532z" fill="#7d4f3b"/>
<path d="M840 930 V720 a60 60 0 0 1 120 0 V930z" fill="#4b3a2d"/>
<rect x="610" y="600" width="130" height="170" fill="#3e4a46"/><rect x="595" y="600" width="12" height="170" fill="#6d7c73"/><rect x="742" y="600" width="12" height="170" fill="#6d7c73"/>
<rect x="1060" y="600" width="130" height="170" fill="#3e4a46"/><rect x="1045" y="600" width="12" height="170" fill="#6d7c73"/><rect x="1192" y="600" width="12" height="170" fill="#6d7c73"/>
<rect x="600" y="772" width="150" height="16" fill="#b9b1a4"/><rect x="1050" y="772" width="150" height="16" fill="#b9b1a4"/>
<circle cx="630" cy="760" r="18" fill="#6b4a3a"/><circle cx="680" cy="758" r="20" fill="#6b4a3a"/><circle cx="1150" cy="760" r="18" fill="#6b4a3a"/>
<path d="M0 940 H${W} V${H} H0z" fill="#a49680" opacity="0.6"/>
<path d="M80 1200 C120 1040 160 980 190 900 L215 900 C235 990 260 1060 300 1200z" fill="#3b3428"/>
<circle cx="200" cy="760" r="150" fill="#47533f"/><circle cx="90" cy="820" r="120" fill="#3f4a38"/><circle cx="310" cy="830" r="125" fill="#4a5742"/><circle cx="200" cy="640" r="110" fill="#526047"/>
<path d="M1520 1200 V420" stroke="#3a3229" stroke-width="16"/><path d="M1520 450 Q1100 520 640 470" stroke="#2f2a24" stroke-width="3" fill="none"/>
</svg>`
		};
	},
	harbour: () => {
		const r = rng(11);
		const W = 1500;
		const H = 1200;
		let boats = '';
		for (const [x, y, s] of [
			[260, 760, 1],
			[700, 820, 1.25],
			[1120, 740, 0.85]
		]) {
			boats += `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-140 0 H140 L100 60 H-110z" fill="#3a332b"/><path d="M-10 0 V-260" stroke="#3a332b" stroke-width="7"/><path d="M-6 -250 L110 -20 H-6z" fill="#e8e2d6" opacity="0.9"/><path d="M-120 64 H120" stroke="#c9c2b4" stroke-width="5" opacity="0.5"/></g>`;
		}
		let streaks = '';
		for (let i = 0; i < 40; i++) {
			const y = 650 + r() * 520;
			streaks += `<rect x="${r() * W}" y="${y}" width="${60 + r() * 260}" height="3" fill="#ffffff" opacity="${0.15 + r() * 0.25}"/>`;
		}
		return {
			W,
			H,
			svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs(sky('s', '#93a8b5', '#efe9dc') + sky('w', '#7f949d', '#4f5f66'))}
<rect width="${W}" height="${H}" fill="url(#s)"/>${clouds(r, W, 400, 7)}
<path d="M0 640 C300 560 520 590 760 620 C980 600 1200 520 1500 600 V660 H0z" fill="#8e9a96"/>
<rect y="640" width="${W}" height="${H}" fill="url(#w)"/>${streaks}${boats}
<path d="M0 1000 L1500 930 V1200 H0z" fill="#9c9282"/><path d="M0 1000 L1500 930 V950 L0 1022z" fill="#bdb3a2"/>
<circle cx="1320" cy="985" r="26" fill="#3b352e"/><rect x="1300" y="985" width="40" height="40" fill="#3b352e"/>
</svg>`
		};
	},
	church: () => {
		const r = rng(5);
		const W = 1200;
		const H = 1500;
		let houses = '';
		for (let i = 0; i < 16; i++) {
			const x = 40 + r() * 1100;
			const y = 980 + r() * 300;
			const w = 90 + r() * 120;
			houses += `<rect x="${x}" y="${y}" width="${w}" height="${80 + r() * 60}" fill="${r() > 0.5 ? '#efebe2' : '#ddd6c9'}"/><path d="M${x - 8} ${y} L${x + w / 2} ${y - 40} L${x + w + 8} ${y}z" fill="#83604c"/><rect x="${x + w * 0.3}" y="${y + 30}" width="22" height="30" fill="#4b5551"/>`;
		}
		return {
			W,
			H,
			svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs(sky('s', '#8399a8', '#ece6d8'))}
<rect width="${W}" height="${H}" fill="url(#s)"/>${clouds(r, W, 600, 8)}
<path d="M0 900 C260 760 520 700 700 720 C900 740 1050 820 1200 860 V${H} H0z" fill="#9a9a86"/>
<rect x="520" y="420" width="150" height="340" fill="#f1ede4"/><rect x="640" y="420" width="30" height="340" fill="#d6cfc2"/>
<path d="M505 425 L595 300 L685 425z" fill="#7a5644"/><path d="M595 300 V230 M570 255 H620" stroke="#3a332b" stroke-width="9"/>
<path d="M565 480 a30 30 0 0 1 60 0 V560 H565z" fill="#3e3a33"/>
<rect x="380" y="620" width="420" height="200" fill="#ece7dd"/><path d="M360 625 L590 540 L820 625z" fill="#7a5644"/><path d="M560 820 V720 a30 30 0 0 1 60 0 V820z" fill="#3e3a33"/>
<path d="M0 1000 C300 900 700 920 1200 960 V${H} H0z" fill="#b2ab98"/>${houses}
<path d="M0 1350 C400 1300 800 1320 1200 1290 V${H} H0z" fill="#6e6a5b"/>
</svg>`
		};
	},
	lighthouse: () => {
		const r = rng(3);
		const W = 1800;
		const H = 1200;
		return {
			W,
			H,
			svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs(sky('s', '#8fa2b0', '#f0eadc'))}
<rect width="${W}" height="${H}" fill="url(#s)"/>${clouds(r, W, 450, 10)}
<rect y="560" width="${W}" height="80" fill="#9aabb2"/>
<path d="M0 640 C300 580 600 600 900 620 C1200 560 1450 520 1800 560 V${H} H0z" fill="#b8b8a2"/>
<rect x="1350" y="300" width="70" height="260" fill="#f3efe6"/><rect x="1350" y="360" width="70" height="40" fill="#544c42"/><rect x="1350" y="460" width="70" height="40" fill="#544c42"/>
<rect x="1340" y="262" width="90" height="40" fill="#3f3a33"/><path d="M1335 262 L1385 220 L1435 262z" fill="#3f3a33"/>
<path d="M0 760 C350 660 700 690 1000 740 C1300 790 1550 700 1800 690 V${H} H0z" fill="#9d9c84"/>
<path d="M0 920 C400 820 800 860 1100 900 C1400 940 1600 880 1800 860 V${H} H0z" fill="#7f7e67"/>
<path d="M300 1200 C420 1060 640 980 900 900 C1100 840 1250 760 1380 600" stroke="#d9d3c2" stroke-width="34" fill="none" opacity="0.9"/>
<path d="M0 1080 C500 1000 1100 1040 1800 1010 V${H} H0z" fill="#5f5f4d"/>
<path d="M120 1200 C130 1100 150 1060 180 1040" stroke="#3b3a2f" stroke-width="5" fill="none"/><path d="M200 1200 C210 1110 230 1070 260 1052" stroke="#3b3a2f" stroke-width="4" fill="none"/>
</svg>`
		};
	},
	'la-estrella': () => {
		const W = 1200;
		const H = 1500;
		let loaves = '';
		for (let row = 0; row < 3; row++) {
			for (let i = 0; i < 6; i++) {
				loaves += `<ellipse cx="${300 + i * 110}" cy="${760 + row * 85}" rx="46" ry="24" fill="#9a6a3c" opacity="0.85"/>`;
			}
		}
		let stripes = '';
		for (let i = 0; i < 12; i++) {
			stripes += `<path d="M${200 + i * 70} 520 h35 l-12 90 h-40z" fill="#e9e3d6"/>`;
		}
		return {
			W,
			H,
			svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs(sky('s', '#384552', '#8d8f8c') + '<radialGradient id="glow"><stop offset="0" stop-color="#fff4d6"/><stop offset="1" stop-color="#fff4d6" stop-opacity="0"/></radialGradient>')}
<rect width="${W}" height="${H}" fill="url(#s)"/>
<rect x="120" y="180" width="960" height="1100" fill="#6b625a"/>
<rect x="200" y="250" width="160" height="200" fill="#2d2a27"/><rect x="520" y="250" width="160" height="200" fill="#e8c98d" opacity="0.8"/><rect x="840" y="250" width="160" height="200" fill="#2d2a27"/>
<rect x="190" y="440" width="820" height="70" fill="#2f2a25"/>
<text x="600" y="490" font-family="serif" font-size="54" letter-spacing="14" text-anchor="middle" fill="#f3e6c8">LA ESTRELLA</text>
<rect x="200" y="520" width="840" height="20" fill="#2f2a25"/>${stripes}
<rect x="230" y="640" width="700" height="380" fill="#f6dfa8"/><rect x="230" y="640" width="700" height="380" fill="url(#glow)"/>
${loaves}
<rect x="230" y="640" width="700" height="380" fill="none" stroke="#2b2622" stroke-width="18"/><path d="M580 640 V1020" stroke="#2b2622" stroke-width="10"/>
<rect x="950" y="700" width="110" height="560" fill="#3a332c"/><rect x="965" y="720" width="80" height="250" fill="#f1d9a0" opacity="0.7"/>
<rect y="1280" width="${W}" height="220" fill="#4f4c47"/><rect y="1280" width="${W}" height="16" fill="#76726a"/>
<ellipse cx="580" cy="1320" rx="420" ry="40" fill="#f6dfa8" opacity="0.25" filter="url(#soft)"/>
<path d="M60 1500 V420" stroke="#1f1d1b" stroke-width="18"/><circle cx="60" cy="400" r="34" fill="#fff0c8"/><circle cx="60" cy="400" r="140" fill="url(#glow)" opacity="0.7"/>
</svg>`
		};
	},
	'harbour-wall': () => {
		const r = rng(19);
		const W = 1200;
		const H = 1500;
		let streaks = '';
		for (let i = 0; i < 34; i++) {
			streaks += `<rect x="${r() * W}" y="${760 + r() * 330}" width="${40 + r() * 200}" height="3" fill="#ffffff" opacity="${0.15 + r() * 0.25}"/>`;
		}
		return {
			W,
			H,
			svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${defs(sky('s', '#8ea3b1', '#f1ebde') + sky('w', '#8597a0', '#55656b'))}
<rect width="${W}" height="${H}" fill="url(#s)"/>${clouds(r, W, 650, 9)}
<path d="M0 740 C250 700 420 720 560 735 V760 H0z" fill="#8f9a95"/>
<rect y="750" width="${W}" height="400" fill="url(#w)"/>${streaks}
<rect y="1080" width="${W}" height="420" fill="#a39886"/><rect y="1080" width="${W}" height="26" fill="#c2b8a6"/>
<path d="M0 1180 H${W} M0 1290 H${W} M0 1400 H${W}" stroke="#8c8272" stroke-width="4"/>
<path d="M150 1106 V1180 M420 1106 V1180 M700 1106 V1180 M980 1106 V1180 M300 1180 V1290 M560 1180 V1290 M840 1180 V1290" stroke="#8c8272" stroke-width="4"/>
<g transform="translate(520 1080)">
<path d="M-62 0 C-60 -70 -48 -120 -30 -150 H30 C48 -120 60 -70 62 0z" fill="#2e2a26"/>
<path d="M-30 -150 C-34 -200 -24 -232 0 -236 C24 -232 34 -200 30 -150z" fill="#3a3530"/>
<circle cx="0" cy="-262" r="30" fill="#2e2a26"/><path d="M-28 -270 C-22 -300 22 -300 30 -268 C20 -284 -18 -286 -28 -270z" fill="#1f1c19"/>
<path d="M-40 0 L-52 60 M40 0 L52 60" stroke="#2e2a26" stroke-width="14"/>
</g>
<path d="M980 1080 V560" stroke="#2a2724" stroke-width="14"/><path d="M955 560 h50 l-8 -40 h-34z" fill="#2a2724"/>
</svg>`
		};
	}
};

async function age(name, { W, H, svg }) {
	const r = rng(name.length * 97);
	const base = await sharp(Buffer.from(svg)).resize(W, H).blur(2.2).greyscale().toBuffer();

	// Film grain: random luminance noise, blended softly.
	const noise = Buffer.alloc(W * H);
	for (let i = 0; i < noise.length; i++) noise[i] = 128 + (r() - 0.5) * 70;
	const grain = await sharp(noise, { raw: { width: W, height: H, channels: 1 } })
		.blur(0.6)
		.png()
		.toBuffer();

	const vignette = Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="v" cx="50%" cy="48%" r="72%"><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#5a4a3a"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#v)"/></svg>`
	);

	const toned = await sharp(base)
		.composite([
			{ input: grain, blend: 'soft-light' },
			{ input: vignette, blend: 'multiply' }
		])
		.linear(0.82, 24)
		.tint({ r: 150, g: 112, b: 72 })
		.toBuffer();

	const pad = Math.round(W * 0.035);
	await sharp(toned)
		.extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#efe6d3' })
		.resize({ width: 1500 })
		.jpeg({ quality: 84, mozjpeg: true })
		.toFile(join(out, `${name}.jpg`));
	console.log(`demo/photos/${name}.jpg`);
}

for (const [name, scene] of Object.entries(scenes)) {
	await age(name, scene());
}
