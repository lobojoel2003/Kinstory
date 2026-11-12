<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Icon from '#lib/components/Icon.svelte';
	import { duration, plural } from '#lib/format.ts';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const base = $derived(`/p/${data.project.id}`);
	const parts = $derived([...new Set(data.stories.map((s) => s.part).filter(Boolean))] as string[]);
	const pending = $derived(data.stories.some((s) => s.pending > 0));
	let uploading = $state(false);

	onMount(() => {
		const t = setInterval(() => pending && invalidateAll(), 4000);
		return () => clearInterval(t);
	});

	function orderJson(index: number, delta: number, partFor?: { id: string; part: string }): string {
		const items = data.stories.map((s) => ({
			id: s.id,
			part: partFor && partFor.id === s.id ? partFor.part : s.part
		}));
		const j = index + delta;
		if (delta && j >= 0 && j < items.length) [items[index], items[j]] = [items[j], items[index]];
		return JSON.stringify(items);
	}

	const totalWords = $derived(
		data.stories.filter((s) => s.includeInBook).reduce((n, s) => n + s.words, 0)
	);
</script>

<svelte:head><title>Stories · {data.project.title}</title></svelte:head>

<div class="container page">
	<header class="page-head spread">
		<div>
			<h1>Stories</h1>
			<p>
				In book order. Group them into parts — “Childhood”, “The Bakery Years” — and the book gets
				part pages of its own.
			</p>
		</div>
		<form method="POST" action="?/new">
			<button class="btn primary"><Icon name="plus" size={16} /> Write a story</button>
		</form>
	</header>

	{#if data.stories.length === 0}
		<div class="card empty">
			<Icon name="feather" size={30} />
			<h3>No stories yet</h3>
			<p>Answers arrive here automatically, transcribed and ready for a light edit.</p>
		</div>
	{:else}
		<p class="muted small summary">
			{plural(data.stories.filter((s) => s.includeInBook).length, 'story', 'stories')} in the book · about
			{Math.max(1, Math.round(totalWords / 300))} printed pages of text
		</p>
		<ol class="stories">
			{#each data.stories as s, i (s.id)}
				{#if s.part && s.part !== data.stories[i - 1]?.part}
					<li class="part"><span class="eyebrow">Part</span> {s.part}</li>
				{/if}
				<li class="story card" class:excluded={!s.includeInBook}>
					<div class="order">
						<form method="POST" action="?/reorder" use:enhance>
							<input type="hidden" name="order" value={orderJson(i, -1)} />
							<button class="btn icon ghost" disabled={i === 0} aria-label="Move up"
								><Icon name="arrow-up" size={15} /></button
							>
						</form>
						<span class="n">{i + 1}</span>
						<form method="POST" action="?/reorder" use:enhance>
							<input type="hidden" name="order" value={orderJson(i, 1)} />
							<button
								class="btn icon ghost"
								disabled={i === data.stories.length - 1}
								aria-label="Move down"><Icon name="arrow-down" size={15} /></button
							>
						</form>
					</div>
					<a class="main" href="{base}/stories/{s.id}">
						<h3>{s.title}</h3>
						{#if s.question}<p class="q">{s.question}</p>{/if}
						<p class="small muted meta">
							{#if s.pending}<span class="chip gold"
									><span class="dot pulse"></span>Transcribing</span
								>{/if}
							{#if s.status === 'ready'}<span class="chip sage">Ready</span>{:else}<span
									class="chip">Draft</span
								>{/if}
							{plural(s.words, 'word')}{s.seconds
								? ` · ${duration(s.seconds)} of audio`
								: ''}{s.photoCount ? ` · ${plural(s.photoCount, 'photo')}` : ''}
						</p>
					</a>
					<div class="side">
						<form
							method="POST"
							action="?/reorder"
							use:enhance={() =>
								({ update }) =>
									update({ reset: false })}
							class="partform"
						>
							<input
								name="part-{s.id}"
								list="parts"
								placeholder="Part…"
								value={s.part ?? ''}
								aria-label="Part for {s.title}"
								onchange={(e) => {
									const f = (e.currentTarget as HTMLInputElement).form!;
									(f.elements.namedItem('order') as HTMLInputElement).value = orderJson(i, 0, {
										id: s.id,
										part: (e.currentTarget as HTMLInputElement).value
									});
									f.requestSubmit();
								}}
							/>
							<input type="hidden" name="order" value={orderJson(i, 0)} />
						</form>
						<form method="POST" action="?/include" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button
								class="btn small"
								class:ghost={s.includeInBook}
								title={s.includeInBook ? 'Leave out of the book' : 'Put back in the book'}
							>
								{s.includeInBook ? 'In book' : 'Left out'}
							</button>
						</form>
					</div>
				</li>
			{/each}
		</ol>
		<datalist id="parts"
			>{#each parts as p (p)}<option value={p}></option>{/each}</datalist
		>
	{/if}

	<section class="card upload">
		<h3>Add a recording you already have</h3>
		<p class="muted small">
			A voice message from WhatsApp, an old cassette you digitised, a video call recording: any
			audio file works. It is transcribed like any other answer.
		</p>
		<form
			method="POST"
			action="?/upload"
			enctype="multipart/form-data"
			use:enhance={() => {
				uploading = true;
				return async ({ update }) => {
					await update();
					uploading = false;
				};
			}}
			class="row"
		>
			<select name="teller" aria-label="Who is speaking" style="width:auto">
				{#each data.storytellers as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
			</select>
			<input
				type="file"
				name="audio"
				accept="audio/*,video/mp4,.m4a,.opus,.ogg,.mp3,.wav,.amr,.flac"
				required
			/>
			<button class="btn primary" disabled={uploading}
				><Icon name="upload" size={16} /> {uploading ? 'Uploading…' : 'Upload'}</button
			>
		</form>
		{#if form?.uploadError}<p class="notice error">{form.uploadError}</p>{/if}
		{#if form?.uploaded}<p class="notice ok">
				Got it. The transcript will appear in the list in a minute or two.
			</p>{/if}
	</section>
</div>

<style>
	.summary {
		margin: -0.6rem 0 1rem;
	}
	.stories {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.part {
		font: 400 1.6rem/1.2 var(--font-display);
		margin: 1.2rem 0 0.2rem;
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
	}
	.story {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem 1.1rem 0.9rem 0.6rem;
	}
	.story.excluded {
		opacity: 0.6;
	}
	.order {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.order form {
		margin: 0;
	}
	.n {
		font: 400 1.2rem/1 var(--font-display);
		color: var(--faint);
	}
	.main {
		flex: 1;
		min-width: 0;
		text-decoration: none;
		color: inherit;
	}
	.main h3 {
		margin: 0;
		font-size: 1.4rem;
	}
	.main:hover h3 {
		color: var(--accent);
	}
	.q {
		font-family: var(--font-text);
		font-style: italic;
		color: var(--muted);
		margin: 0.1rem 0 0.35rem;
	}
	.meta {
		margin: 0;
		display: flex;
		gap: 0.45rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.side {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.side form {
		margin: 0;
	}
	.partform input {
		width: 150px;
		padding: 0.4rem 0.6rem;
		font-size: 0.85rem;
	}
	.upload {
		margin-top: 2rem;
	}
	.upload .row {
		margin-top: 0.6rem;
	}
	.upload input[type='file'] {
		flex: 1;
		min-width: 200px;
		font-size: 0.85rem;
	}
	.notice {
		margin-top: 0.8rem;
	}
	@media (max-width: 720px) {
		.story {
			flex-wrap: wrap;
		}
		.side {
			width: 100%;
			justify-content: flex-end;
		}
	}
</style>
