<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import {
		BLEED_MODES,
		COVER_COLORS,
		LANGUAGES,
		PAPERS,
		spineWidth,
		THEMES,
		TRIMS
	} from '#lib/book-options.ts';
	import Icon from '#lib/components/Icon.svelte';
	import SpreadViewer from '#lib/components/SpreadViewer.svelte';
	import { ago } from '#lib/format.ts';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const p = $derived(data.project);
	const base = $derived(`/p/${p.id}`);
	const latest = $derived(data.renders[0] ?? null);
	const done = $derived(data.renders.find((r) => r.status === 'done') ?? null);
	const busy = $derived(latest?.status === 'pending' || latest?.status === 'running');
	const trim = $derived(TRIMS[p.trim]);
	let saving = $state(false);

	onMount(() => {
		const t = setInterval(() => busy && invalidateAll(), 2000);
		return () => clearInterval(t);
	});

	const themeSample: Record<string, string> = {
		heirloom: 'font-family: "EB Garamond", serif',
		caslon: 'font-family: "Libre Caslon Text", "EB Garamond", serif',
		modern: 'font-family: "Newsreader", Georgia, serif'
	};
</script>

<svelte:head><title>Book · {p.title}</title></svelte:head>

<div class="container page">
	<header class="page-head">
		<h1>The book</h1>
		<p>
			Choose how it looks, then typeset. Kinstory gives you two print-ready PDFs: the pages, and a
			full cover with the spine sized to the page count.
		</p>
	</header>

	<div class="layout">
		<form
			class="settings stack"
			method="POST"
			action="?/save"
			style="--gap: 1.25rem"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					await update({ reset: false });
					saving = false;
				};
			}}
		>
			{#if form?.error}<p class="notice error">{form.error}</p>{/if}

			<section class="card">
				<h3>Title & front matter</h3>
				<div class="stack" style="--gap:.9rem">
					<div>
						<label for="title">Title</label><input
							id="title"
							name="title"
							value={p.title}
							required
						/>
					</div>
					<div>
						<label for="subtitle">Subtitle</label><input
							id="subtitle"
							name="subtitle"
							value={p.subtitle ?? ''}
							placeholder="Stories told to her grandchildren, 2025–2026"
						/>
					</div>
					<div>
						<label for="dedication">Dedication</label><textarea
							id="dedication"
							name="dedication"
							rows="2"
							placeholder="For …">{p.dedication ?? ''}</textarea
						>
					</div>
					<div class="fields">
						<div>
							<label for="imprint">Imprint line</label><input
								id="imprint"
								name="imprint"
								value={p.imprint ?? ''}
								placeholder="Printed for the Delgado family"
							/>
						</div>
						<div>
							<label for="language">Language</label>
							<select id="language" name="language">
								{#each Object.entries(LANGUAGES) as [k, v] (k)}<option
										value={k}
										selected={p.language === k}>{v}</option
									>{/each}
							</select>
						</div>
					</div>
					<div>
						<label for="afterword"
							>Afterword <span class="faint">(optional, from the family)</span></label
						><textarea id="afterword" name="afterword" rows="4">{p.afterword ?? ''}</textarea>
					</div>
					<div>
						<label for="blurb">Back cover</label><textarea
							id="blurb"
							name="blurb"
							rows="2"
							placeholder="A favourite line from the stories">{p.blurb ?? ''}</textarea
						>
					</div>
				</div>
			</section>

			<section class="card">
				<h3>Typeface</h3>
				<div class="choices" style="--min: 170px">
					{#each Object.entries(THEMES) as [k, t] (k)}
						<label class="choice theme">
							<input type="radio" name="theme" value={k} checked={p.theme === k} />
							<em style={themeSample[k]}>Aa</em>
							<strong>{t.label}</strong>
							<span>{t.note}</span>
						</label>
					{/each}
				</div>
			</section>

			<section class="card">
				<h3>Size & printing</h3>
				<span class="label">Trim size</span>
				<div class="choices" style="--min: 140px">
					{#each Object.entries(TRIMS) as [k, t] (k)}
						<label class="choice"
							><input type="radio" name="trim" value={k} checked={p.trim === k} /><strong
								>{t.label}</strong
							><span>{t.note}</span></label
						>
					{/each}
				</div>
				<span class="label gap">Where will you print it?</span>
				<div class="choices" style="--min: 190px">
					{#each Object.entries(BLEED_MODES) as [k, b] (k)}
						<label class="choice"
							><input type="radio" name="bleedMode" value={k} checked={p.bleedMode === k} /><strong
								>{b.label}</strong
							><span>{b.note}</span></label
						>
					{/each}
				</div>
				<div class="fields gap">
					<div>
						<span class="label">Ink</span>
						<div class="row" style="--gap:.5rem">
							<label class="choice mini"
								><input type="radio" name="color" value="color" checked={p.color} /><strong
									>Colour</strong
								></label
							>
							<label class="choice mini"
								><input type="radio" name="color" value="mono" checked={!p.color} /><strong
									>Black & white</strong
								></label
							>
						</div>
					</div>
					<div>
						<label for="paper">Paper</label>
						<select id="paper" name="paper">
							{#each Object.entries(PAPERS) as [k, v] (k)}<option value={k} selected={p.paper === k}
									>{v.label}</option
								>{/each}
						</select>
					</div>
				</div>
			</section>

			<section class="card">
				<h3>Details</h3>
				<div class="stack" style="--gap:.6rem">
					<label class="check"
						><input type="checkbox" name="dropCaps" checked={p.dropCaps} />
						<span>Drop caps at the start of each story</span></label
					>
					<label class="check"
						><input type="checkbox" name="chapterNumbers" checked={p.chapterNumbers} />
						<span>Chapter numbers (“Chapter Three”)</span></label
					>
					<label class="check"
						><input type="checkbox" name="questionsIndex" checked={p.questionsIndex} />
						<span>“The Questions” — every question asked, and by whom, at the back</span></label
					>
					<label class="check"
						><input type="checkbox" name="listenQr" checked={p.listenQr} />
						<span
							>A QR code on each chapter opening to hear the story in their voice <span
								class="faint">(needs PUBLIC_URL)</span
							></span
						></label
					>
				</div>
			</section>

			<section class="card">
				<h3>Cover</h3>
				<span class="label">Cloth</span>
				<div class="swatches">
					{#each Object.entries(COVER_COLORS) as [k, c] (k)}
						<label class="swatch" title={c.label} style="--cloth: {c.cloth}; --ink: {c.ink}">
							<input type="radio" name="coverColor" value={k} checked={p.coverColor === k} />
							<span>Aa</span>
							<small>{c.label}</small>
						</label>
					{/each}
				</div>
				<div class="fields gap">
					<div>
						<label for="coverPhotoId">Cover photo</label>
						<select id="coverPhotoId" name="coverPhotoId">
							<option value="">No photo</option>
							{#each data.photos as ph (ph.id)}<option
									value={ph.id}
									selected={p.coverPhotoId === ph.id}
									>{ph.caption ?? `Photo ${ph.id.slice(0, 6)}`}</option
								>{/each}
						</select>
					</div>
					<div>
						<label for="frontispiecePhotoId"
							>Frontispiece <span class="faint">(facing the title page)</span></label
						>
						<select id="frontispiecePhotoId" name="frontispiecePhotoId">
							<option value="">None</option>
							{#each data.photos as ph (ph.id)}<option
									value={ph.id}
									selected={p.frontispiecePhotoId === ph.id}
									>{ph.caption ?? `Photo ${ph.id.slice(0, 6)}`}</option
								>{/each}
						</select>
					</div>
				</div>
				<div class="gap">
					<label for="frontispieceCaption">Frontispiece caption</label><input
						id="frontispieceCaption"
						name="frontispieceCaption"
						value={p.frontispieceCaption ?? ''}
					/>
				</div>
			</section>

			<div class="savebar card">
				<span class="small muted"
					>{data.printable}
					{data.printable === 1 ? 'story' : 'stories'} with text will be included.</span
				>
				<span class="row" style="--gap:.5rem">
					<button class="btn" disabled={saving}>Save</button>
					<button
						class="btn primary"
						name="typeset"
						value="1"
						disabled={saving || busy || data.printable === 0}
						><Icon name="sparkles" size={16} /> Save & typeset</button
					>
				</span>
			</div>
		</form>

		<aside class="preview">
			<div class="card">
				{#if busy}
					<div class="working" role="status">
						<div class="spinner"></div>
						<p>
							<b>Typesetting…</b><br /><span class="small muted"
								>Measuring drop caps, balancing titles, placing photos. Usually under a minute.</span
							>
						</p>
					</div>
				{:else if latest?.status === 'failed'}
					<p class="notice error">
						<Icon name="alert" size={16} />
						{latest.error ?? 'Typesetting failed.'}
					</p>
				{/if}

				{#if done?.pages}
					<SpreadViewer
						pages={done.pages}
						aspect={trim.width / trim.height}
						src={(n) => `${base}/renders/${done.id}/pages/${String(n).padStart(4, '0')}.webp`}
					/>
					<div class="downloads">
						<a class="btn primary" href="{base}/renders/{done.id}/interior.pdf?download"
							><Icon name="download" size={16} /> Interior PDF</a
						>
						<a class="btn" href="{base}/renders/{done.id}/cover.pdf?download"
							><Icon name="download" size={16} /> Cover PDF</a
						>
						<a
							class="btn ghost"
							href="{base}/renders/{done.id}/interior.pdf"
							target="_blank"
							rel="noreferrer"><Icon name="external" size={15} /> Open</a
						>
					</div>
					<img
						class="coverimg"
						src="{base}/renders/{done.id}/cover.webp"
						alt="The full cover: back, spine and front"
					/>
					<dl class="specs">
						<div>
							<dt>Pages</dt>
							<dd>{done.pages}</dd>
						</div>
						<div>
							<dt>Trim</dt>
							<dd>{TRIMS[(done.settings.trim as keyof typeof TRIMS) ?? p.trim]?.label}</dd>
						</div>
						<div>
							<dt>Spine</dt>
							<dd>{done.spineInches?.toFixed(3)} in</dd>
						</div>
						<div>
							<dt>Bleed</dt>
							<dd>
								{BLEED_MODES[(done.settings.bleedMode as keyof typeof BLEED_MODES) ?? 'none']
									?.label}
							</dd>
						</div>
					</dl>
					<p class="small muted">
						Typeset {ago(done.finishedAt)}. Print-on-demand services ask for at least 24 pages (KDP)
						or 32 (Lulu); blank pages count. Order one proof copy before ordering for the family.
					</p>
				{:else if !busy}
					<div class="empty">
						<Icon name="book" size={30} />
						<h3>Nothing typeset yet</h3>
						<p>
							Press “Save & typeset” to see the book. It takes a few seconds and you can do it as
							often as you like.
						</p>
						<p class="small">
							Estimated spine at today’s length: {spineWidth(
								Math.max(24, Math.round(data.stats.words / 280) + 14),
								p.paper,
								p.bleedMode
							).toFixed(2)} in
						</p>
					</div>
				{/if}
			</div>
		</aside>
	</div>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
		gap: 1.5rem;
		align-items: start;
	}
	.preview {
		position: sticky;
		top: 80px;
	}
	.gap {
		margin-top: 1rem;
	}
	.label.gap {
		display: block;
	}
	.theme em {
		display: block;
		font-style: normal;
		font-size: 2.2rem;
		line-height: 1;
		margin-bottom: 0.4rem;
		color: var(--accent);
	}
	.choice.mini {
		padding: 0.45rem 0.9rem;
	}
	.swatches {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
	}
	.swatch {
		position: relative;
		width: 70px;
		cursor: pointer;
		text-align: center;
		margin: 0;
	}
	.swatch input {
		position: absolute;
		opacity: 0;
	}
	.swatch span {
		display: grid;
		place-items: center;
		height: 92px;
		border-radius: 2px 6px 6px 2px;
		background: var(--cloth);
		color: var(--ink);
		font: 400 1.5rem var(--font-display);
		box-shadow: inset 4px 0 6px -4px rgb(0 0 0 / 0.5);
		outline: 2px solid transparent;
		outline-offset: 3px;
		transition: outline-color 0.15s;
	}
	.swatch input:checked + span {
		outline-color: var(--accent);
	}
	.swatch input:focus-visible + span {
		outline-color: var(--focus);
	}
	.swatch small {
		display: block;
		font-size: 0.72rem;
		color: var(--muted);
		margin-top: 0.3rem;
	}
	.savebar {
		position: sticky;
		bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.8rem 1rem;
		box-shadow: var(--shadow-lg);
	}
	.working {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1.2rem;
	}
	.working p {
		margin: 0;
	}
	.spinner {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 3px solid var(--line);
		border-top-color: var(--accent);
		animation: spin 0.9s linear infinite;
		flex: none;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.downloads {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin: 1.3rem 0 1rem;
	}
	.coverimg {
		width: 100%;
		border-radius: 3px;
		box-shadow: var(--shadow);
		margin: 0.5rem 0 1rem;
	}
	.specs {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
		margin: 0 0 0.8rem;
	}
	.specs div {
		background: var(--paper);
		border-radius: 8px;
		padding: 0.55rem 0.7rem;
	}
	.specs dt {
		font-size: 0.7rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.specs dd {
		margin: 0;
		font-weight: 550;
		font-size: 0.88rem;
	}
	@media (max-width: 1080px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.preview {
			position: static;
			order: -1;
		}
	}
</style>
