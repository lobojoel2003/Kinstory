<script lang="ts">
	import { COVER_COLORS } from '#lib/book-options.ts';
	import Icon from '#lib/components/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Your books · Kinstory</title></svelte:head>

<div class="container page">
	<header class="page-head spread">
		<div>
			<h1>Your books</h1>
			<p>Each book gathers one storyteller’s answers — or a couple’s — over weeks and months.</p>
		</div>
		<a class="btn primary" href="/projects/new"><Icon name="plus" size={16} /> Start a new book</a>
	</header>

	{#if data.projects.length === 0}
		<div class="card empty">
			<h3>No books yet</h3>
			<p>Start one for a grandparent, a parent, or anyone whose stories you don’t want to lose.</p>
			<a class="btn primary" href="/projects/new">Start your first book</a>
		</div>
	{:else}
		<div class="shelf">
			{#each data.projects as p (p.id)}
				{@const cloth = COVER_COLORS[p.coverColor] ?? COVER_COLORS.oxblood}
				<a class="book" href="/p/{p.id}">
					<div class="cover" style="--cloth: {cloth.cloth}; --ink: {cloth.ink}">
						{#if p.coverPreview}
							<img src="/p/{p.id}/renders/latest/front.webp" alt="" loading="lazy" />
						{:else}
							<span class="t">{p.title}</span>
							<span class="a">{p.storytellerNames}</span>
						{/if}
					</div>
					<div class="meta">
						<h3>{p.title}</h3>
						<p class="muted small">
							{p.storytellerNames ?? 'No storyteller yet'} · {p.storyCount}
							{p.storyCount === 1 ? 'story' : 'stories'}{p.minutes
								? ` · ${p.minutes} min recorded`
								: ''}
						</p>
						{#if p.role === 'editor'}<span class="chip">Shared with you</span>{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.shelf {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
		gap: 2rem 1.5rem;
	}
	.book {
		text-decoration: none;
		color: inherit;
	}
	.cover {
		aspect-ratio: 2 / 3;
		border-radius: 3px 8px 8px 3px;
		background: var(--cloth);
		color: var(--ink);
		box-shadow:
			inset 6px 0 10px -6px rgb(0 0 0 / 0.45),
			var(--shadow-lg);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		text-align: center;
		padding: 18% 12% 14%;
		overflow: hidden;
		transition: transform 0.2s;
	}
	.cover img {
		width: calc(100% + 24%);
		max-width: none;
		margin: -27% -12% -21%;
		height: auto;
	}
	.book:hover .cover {
		transform: translateY(-4px) rotate(-0.6deg);
	}
	.t {
		font: 300 1.7rem/1.1 var(--font-display);
	}
	.a {
		font-size: 0.7rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}
	.meta {
		margin-top: 0.9rem;
	}
	.meta h3 {
		margin: 0 0 0.15rem;
		font-size: 1.25rem;
	}
	.meta p {
		margin: 0 0 0.4rem;
	}
</style>
