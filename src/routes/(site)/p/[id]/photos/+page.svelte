<script lang="ts">
	import { enhance } from '$app/forms';
	import { PHOTO_LAYOUTS } from '#lib/book-options.ts';
	import Icon from '#lib/components/Icon.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const base = $derived(`/p/${data.project.id}`);
	let uploading = $state(false);
</script>

<svelte:head><title>Photos · {data.project.title}</title></svelte:head>

<div class="container page">
	<header class="page-head spread">
		<div>
			<h1>Photos</h1>
			<p>
				Scan the old albums. Write down the names on the back while someone still knows them — the
				captions go in the book.
			</p>
		</div>
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
		>
			<label class="btn primary" aria-disabled={uploading}>
				<Icon name="upload" size={16} />
				{uploading ? 'Uploading…' : 'Upload photos'}
				<input
					type="file"
					name="photos"
					accept="image/*"
					multiple
					hidden
					onchange={(e) => (e.currentTarget as HTMLInputElement).form?.requestSubmit()}
				/>
			</label>
		</form>
	</header>

	{#if form?.error}<p class="notice error">{form.error}</p>{/if}

	{#if data.photos.length === 0}
		<div class="card empty">
			<Icon name="image" size={30} />
			<h3>No photos yet</h3>
			<p>Photos make the book. Upload a few and attach them to the stories they belong to.</p>
		</div>
	{:else}
		<div class="grid" style="--min: 250px">
			{#each data.photos as p (p.id)}
				<form
					class="card flush photo"
					method="POST"
					action="?/save"
					use:enhance={() =>
						({ update }) =>
							update({ reset: false })}
				>
					<input type="hidden" name="id" value={p.id} />
					<div class="img">
						<img
							src="{base}/media/photo/{p.id}?size=thumb"
							alt={p.caption ?? 'Photo'}
							loading="lazy"
						/>
						<div class="badges">
							{#if data.project.coverPhotoId === p.id}<span class="chip accent">Cover</span>{/if}
							{#if data.project.frontispiecePhotoId === p.id}<span class="chip accent"
									>Frontispiece</span
								>{/if}
						</div>
					</div>
					<div class="body stack" style="--gap:.5rem">
						<input
							name="caption"
							value={p.caption ?? ''}
							placeholder="Who, where, when?"
							aria-label="Caption"
						/>
						<select name="story" aria-label="Story">
							<option value="">Not in a story</option>
							{#each data.stories as s (s.id)}<option value={s.id} selected={p.storyId === s.id}
									>{s.title}</option
								>{/each}
						</select>
						<div class="row" style="--gap:.4rem">
							<select name="layout" aria-label="Layout" style="flex:1">
								{#each Object.entries(PHOTO_LAYOUTS) as [k, v] (k)}<option
										value={k}
										selected={p.layout === k}>{v}</option
									>{/each}
							</select>
							<select name="role" aria-label="Use as" style="flex:1">
								<option value="">Use as…</option>
								<option value="cover">Cover photo</option>
								<option value="frontispiece">Frontispiece</option>
							</select>
						</div>
						<div class="spread">
							<span class="small faint"
								>{p.width} × {p.height}{p.width < 1200 ? ' · small for print' : ''}</span
							>
							<span class="row" style="--gap:.3rem">
								<button class="btn small primary">{form?.saved === p.id ? 'Saved' : 'Save'}</button>
								<button
									class="btn small icon ghost danger"
									formaction="?/delete"
									aria-label="Delete photo"
									onclick={(e) => {
										if (!confirm('Delete this photo?')) e.preventDefault();
									}}><Icon name="trash" size={14} /></button
								>
							</span>
						</div>
					</div>
				</form>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page-head form {
		margin: 0;
	}
	.photo .img {
		position: relative;
		aspect-ratio: 4 / 3;
		background: var(--paper-2);
	}
	.photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.badges {
		position: absolute;
		top: 0.6rem;
		left: 0.6rem;
		display: flex;
		gap: 0.3rem;
	}
	.body {
		padding: 0.9rem;
	}
	.body input,
	.body select {
		font-size: 0.85rem;
		padding: 0.42rem 0.6rem;
	}
	.body select {
		padding-right: 1.8rem;
	}
</style>
