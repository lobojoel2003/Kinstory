<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { PHOTO_LAYOUTS } from '#lib/book-options.ts';
	import AudioPlayer from '#lib/components/AudioPlayer.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { ago, duration, plural } from '#lib/format.ts';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const base = $derived(`/p/${data.project.id}`);

	let body = $state('');
	let pullQuote = $state('');
	let dirty = $state(false);
	let saving = $state(false);
	let textarea: HTMLTextAreaElement | undefined = $state();
	let saveForm: HTMLFormElement | undefined = $state();

	// Reset the editor whenever the server copy changes (navigation, tidy, replace).
	$effect.pre(() => {
		body = data.story.body;
		pullQuote = data.story.pullQuote ?? '';
		dirty = false;
	});

	const words = $derived((body.trim().match(/\S+/g) ?? []).length);
	const paraCount = $derived(body.split(/\n\s*\n/).filter((p) => p.trim()).length);
	const pending = $derived(
		data.recordings.some((r) => r.status === 'pending' || r.status === 'processing')
	);

	onMount(() => {
		const t = setInterval(() => pending && !dirty && invalidateAll(), 4000);
		return () => clearInterval(t);
	});

	function autosize() {
		if (!textarea) return;
		textarea.style.height = 'auto';
		textarea.style.height = `${textarea.scrollHeight + 4}px`;
	}
	$effect(() => {
		void body;
		autosize();
	});

	function useSelection() {
		if (!textarea) return;
		const sel = body
			.slice(textarea.selectionStart, textarea.selectionEnd)
			.trim()
			.replace(/\s+/g, ' ');
		if (sel) {
			pullQuote = sel.replace(/^["“]|["”]$/g, '');
			dirty = true;
		}
	}

	function keydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
			e.preventDefault();
			saveForm?.requestSubmit();
		}
	}

	function beforeUnload(e: BeforeUnloadEvent) {
		if (dirty) e.preventDefault();
	}

	const recStatus = {
		pending: ['Waiting to transcribe', 'gold'],
		processing: ['Transcribing…', 'gold'],
		done: ['Transcribed', 'sage'],
		failed: ['Transcription failed', 'danger']
	} as const;
</script>

<svelte:window onkeydown={keydown} onbeforeunload={beforeUnload} />
<svelte:head><title>{data.story.title} · {data.project.title}</title></svelte:head>

<div class="container page">
	<nav class="crumbs small">
		<a href="{base}/stories"><Icon name="arrow-left" size={14} /> All stories</a>
		<span class="row" style="--gap:.4rem">
			{#if data.prev}<a
					class="btn small ghost"
					href="{base}/stories/{data.prev.id}"
					title={data.prev.title}>← Previous</a
				>{/if}
			{#if data.next}<a
					class="btn small ghost"
					href="{base}/stories/{data.next.id}"
					title={data.next.title}>Next →</a
				>{/if}
		</span>
	</nav>

	<div class="layout">
		<form
			class="editor card"
			method="POST"
			action="?/save"
			bind:this={saveForm}
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					await update({ reset: false });
					saving = false;
					dirty = false;
				};
			}}
			oninput={() => (dirty = true)}
		>
			<input
				class="title"
				name="title"
				value={data.story.title}
				aria-label="Story title"
				required
			/>
			<div class="fields q">
				<div>
					<label for="question">The question</label>
					<input
						id="question"
						name="question"
						value={data.story.question ?? ''}
						placeholder="What question prompted this story?"
					/>
				</div>
				<div>
					<label for="askedBy">Asked by</label>
					<input id="askedBy" name="askedBy" value={data.story.askedBy ?? ''} />
				</div>
			</div>

			<label for="body" class="body-label">
				<span>The story, in their words</span>
				<span class="faint">{plural(words, 'word')} · {plural(paraCount, 'paragraph')}</span>
			</label>
			<textarea
				id="body"
				name="body"
				bind:this={textarea}
				bind:value={body}
				oninput={autosize}
				placeholder={pending
					? 'The transcript is on its way…'
					: 'Type or paste the story here. Leave a blank line between paragraphs.'}></textarea>
			<p class="hint">
				Edit lightly: fix what the transcriber misheard and keep their voice. A blank line starts a
				new paragraph.
			</p>

			<div class="pull">
				<label for="pullQuote"
					>Pull quote <span class="faint">— a line set large in the middle of the story</span
					></label
				>
				<div class="row">
					<input
						id="pullQuote"
						name="pullQuote"
						bind:value={pullQuote}
						placeholder="Select a sentence above, then press “Use selection”"
					/>
					<button type="button" class="btn small" onclick={useSelection}
						><Icon name="quote" size={14} /> Use selection</button
					>
				</div>
			</div>

			<div class="fields bottom">
				<div>
					<label for="part">Part</label>
					<input
						id="part"
						name="part"
						list="story-parts"
						value={data.story.part ?? ''}
						placeholder="e.g. Childhood"
					/>
					<datalist id="story-parts"
						>{#each data.parts as p (p)}<option value={p}></option>{/each}</datalist
					>
				</div>
				<div>
					<span class="label">Status</span>
					<div class="row" style="--gap:.5rem">
						<label class="choice mini"
							><input
								type="radio"
								name="status"
								value="draft"
								checked={data.story.status === 'draft'}
							/><strong>Draft</strong></label
						>
						<label class="choice mini"
							><input
								type="radio"
								name="status"
								value="ready"
								checked={data.story.status === 'ready'}
							/><strong>Ready</strong></label
						>
					</div>
				</div>
				<label class="check incl"
					><input type="checkbox" name="includeInBook" checked={data.story.includeInBook} /> Include in
					the book</label
				>
			</div>

			<div class="actions spread">
				<span class="small muted">
					{#if form?.saved && !dirty}<Icon name="check" size={14} /> Saved{:else if dirty}Unsaved
						changes · ⌘S to save{:else}Last edited {ago(data.story.updatedAt)}{/if}
				</span>
				<button class="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save story'}</button>
			</div>
		</form>

		<aside class="stack" style="--gap: 1.25rem">
			<section class="card">
				<h3>Recordings</h3>
				{#if data.recordings.length === 0}
					<p class="small muted">Written by hand — no recording for this story.</p>
				{/if}
				{#each data.recordings as r (r.id)}
					{@const [label, cls] = recStatus[r.status]}
					<div class="rec">
						<AudioPlayer
							src="{base}/media/audio/{r.id}"
							label="recording from {ago(r.createdAt)}"
							duration={r.durationSeconds}
						/>
						<p class="small muted">
							<span class="chip {cls}">{label}</span>
							{r.source === 'phone' ? 'Phone call' : r.source === 'web' ? 'Voice note' : 'Upload'} · {ago(
								r.createdAt
							)}{r.durationSeconds ? ` · ${duration(r.durationSeconds)}` : ''}
						</p>
						{#if r.status === 'failed' && r.error}<p class="small notice error">{r.error}</p>{/if}
						<div class="row" style="--gap:.4rem">
							<form method="POST" action="?/retranscribe" use:enhance>
								<input type="hidden" name="recording" value={r.id} />
								<button
									class="btn small ghost"
									disabled={r.status === 'pending' || r.status === 'processing'}
									><Icon name="refresh" size={14} /> Transcribe again</button
								>
							</form>
							{#if r.transcript && r.status === 'done'}
								<form
									method="POST"
									action="?/useTranscript"
									use:enhance
									onsubmit={(e) => {
										if (
											!confirm(
												'Replace the story text with this recording’s fresh transcript? Your edits will be lost.'
											)
										)
											e.preventDefault();
									}}
								>
									<input type="hidden" name="recording" value={r.id} />
									<button class="btn small ghost">Use this transcript</button>
								</form>
							{/if}
							<a class="btn small ghost" href="{base}/media/audio/{r.id}?download"
								><Icon name="download" size={14} /></a
							>
						</div>
					</div>
				{/each}
				<form method="POST" action="?/tidy" use:enhance class="tidy">
					<button class="btn small" disabled={dirty} title={dirty ? 'Save first' : ''}
						><Icon name="wand" size={14} /> Remove ums and repeats</button
					>
					<p class="hint">
						Takes out “um”, “uh” and stutters like “the the”. Nothing else changes.
					</p>
				</form>
			</section>

			<section class="card">
				<h3>Photos</h3>
				{#if form?.photoError}<p class="notice error small">{form.photoError}</p>{/if}
				{#each data.photos as p (p.id)}
					<form
						class="photo"
						method="POST"
						action="?/photo"
						use:enhance={() =>
							({ update }) =>
								update({ reset: false })}
					>
						<input type="hidden" name="id" value={p.id} />
						<img src="{base}/media/photo/{p.id}?size=thumb" alt={p.caption ?? 'Photo'} />
						<div class="stack" style="--gap:.45rem">
							<input
								name="caption"
								value={p.caption ?? ''}
								placeholder="Caption: who, where, when"
								aria-label="Caption"
							/>
							<div class="row" style="--gap:.4rem">
								<select name="layout" aria-label="Layout">
									{#each Object.entries(PHOTO_LAYOUTS) as [k, v] (k)}<option
											value={k}
											selected={p.layout === k}>{v}</option
										>{/each}
								</select>
								<select name="anchor" aria-label="Position">
									<option value="0" selected={p.anchor === 0}>Before the text</option>
									{#each Array.from({ length: Math.max(paraCount - 1, 0) }, (_, i) => i + 1) as n (n)}
										<option value={n} selected={p.anchor === n}>After paragraph {n}</option>
									{/each}
									<option value="end" selected={p.anchor === null || p.anchor >= paraCount}
										>At the end</option
									>
								</select>
							</div>
							<div class="row" style="--gap:.4rem">
								<button class="btn small primary">Save</button>
								<button class="btn small ghost" name="remove" value="detach">Unlink</button>
								<button
									class="btn small ghost danger"
									name="remove"
									value="delete"
									onclick={(e) => {
										if (!confirm('Delete this photo?')) e.preventDefault();
									}}>Delete</button
								>
							</div>
						</div>
					</form>
				{/each}
				<form
					method="POST"
					action="?/photos"
					enctype="multipart/form-data"
					use:enhance
					class="addphotos"
				>
					<label class="btn small"
						><Icon name="image" size={14} /> Add photos<input
							type="file"
							name="photos"
							accept="image/*"
							multiple
							hidden
							onchange={(e) => (e.currentTarget as HTMLInputElement).form?.requestSubmit()}
						/></label
					>
					<p class="hint">Location data is removed from photos when they are saved.</p>
				</form>
			</section>

			<form
				method="POST"
				action="?/delete"
				use:enhance
				onsubmit={(e) => {
					if (!confirm('Delete this story? Its recordings stay in the archive.'))
						e.preventDefault();
				}}
			>
				<button class="btn small danger"><Icon name="trash" size={14} /> Delete story</button>
			</form>
		</aside>
	</div>
</div>

<style>
	.crumbs {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.crumbs > a {
		display: inline-flex;
		gap: 0.35rem;
		align-items: center;
		color: var(--muted);
		text-decoration: none;
	}
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 360px;
		gap: 1.5rem;
		align-items: start;
	}
	.editor {
		padding: 2rem 2.2rem;
	}
	.title {
		font: 300 2.5rem/1.15 var(--font-display) !important;
		border: 0 !important;
		border-bottom: 1px solid var(--line) !important;
		border-radius: 0 !important;
		padding: 0 0 0.5rem !important;
		background: transparent !important;
		box-shadow: none !important;
		margin-bottom: 1.2rem;
	}
	.q {
		grid-template-columns: 1fr 180px;
		margin-bottom: 1.4rem;
	}
	.q input#question {
		font-family: var(--font-text);
		font-style: italic;
		font-size: 1.05rem;
	}
	.body-label {
		display: flex;
		justify-content: space-between;
	}
	textarea#body {
		font: 400 1.22rem/1.62 var(--font-text);
		min-height: 22rem;
		padding: 1.2rem 1.3rem;
		background: #fffefa;
		overflow: hidden;
	}
	.pull {
		margin-top: 1.4rem;
	}
	.pull input {
		flex: 1;
		font-family: var(--font-display);
		font-style: italic;
		font-size: 1.15rem;
	}
	.bottom {
		margin-top: 1.4rem;
		align-items: end;
	}
	.choice.mini {
		padding: 0.45rem 0.9rem;
	}
	.incl {
		margin: 0 0 0.6rem;
	}
	.actions {
		margin-top: 1.6rem;
		padding-top: 1.2rem;
		border-top: 1px solid var(--line);
	}
	.rec {
		padding: 0.6rem 0 0.9rem;
		border-bottom: 1px solid var(--line);
		margin-bottom: 0.6rem;
	}
	.rec p {
		margin: 0.45rem 0;
		display: flex;
		gap: 0.4rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.rec form {
		margin: 0;
	}
	.tidy {
		margin-top: 0.4rem;
	}
	.photo {
		display: grid;
		grid-template-columns: 88px 1fr;
		gap: 0.8rem;
		padding-bottom: 0.9rem;
		margin-bottom: 0.9rem;
		border-bottom: 1px solid var(--line);
	}
	.photo img {
		width: 88px;
		height: 88px;
		object-fit: cover;
		border-radius: 6px;
		border: 1px solid var(--line);
	}
	.photo select {
		font-size: 0.8rem;
		padding: 0.35rem 1.8rem 0.35rem 0.5rem;
		flex: 1;
		min-width: 0;
	}
	.photo input {
		font-size: 0.85rem;
		padding: 0.4rem 0.55rem;
	}
	.addphotos label {
		margin: 0;
	}
	@media (max-width: 1000px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.editor {
			padding: 1.3rem;
		}
	}
</style>
