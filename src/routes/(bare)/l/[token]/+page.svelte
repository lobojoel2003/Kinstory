<script lang="ts">
	import { page } from '$app/state';
	import AudioPlayer from '#lib/components/AudioPlayer.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.title} · {data.book}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="listen">
	<p class="book">{data.book}</p>
	<h1>{data.title}</h1>
	{#if data.question}
		<p class="q">
			{data.question}{#if data.askedBy}<span> — {data.askedBy}</span>{/if}
		</p>
	{/if}

	{#if data.recordings.length}
		<div class="players">
			{#each data.recordings as r, i (r.id)}
				<AudioPlayer
					src="{page.url.pathname}/audio/{r.id}"
					duration={r.duration}
					label={data.teller
						? `${data.teller} telling the story${data.recordings.length > 1 ? `, part ${i + 1}` : ''}`
						: 'the recording'}
				/>
			{/each}
			{#if data.teller}<p class="who">In {data.teller}’s own voice</p>{/if}
		</div>
	{/if}

	<article>
		{#each data.paragraphs as p, i (i)}<p>{p}</p>{/each}
	</article>

	<footer><a href="/"><Logo size={22} /></a></footer>
</main>

<style>
	.listen {
		width: min(100% - 2.5rem, 640px);
		margin: 0 auto;
		padding: 3.5rem 0 3rem;
	}
	.book {
		font-size: 0.78rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--accent);
		font-weight: 600;
		text-align: center;
	}
	h1 {
		text-align: center;
		font-size: clamp(2.2rem, 7vw, 3.2rem);
		margin-bottom: 0.6rem;
	}
	.q {
		text-align: center;
		font: italic 1.25rem var(--font-text);
		color: var(--muted);
	}
	.players {
		margin: 2rem 0 2.4rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.who {
		text-align: center;
		font-size: 0.85rem;
		color: var(--muted);
		margin: 0.3rem 0 0;
	}
	article {
		font: 400 1.25rem/1.65 var(--font-text);
		hyphens: auto;
	}
	article p {
		margin: 0;
		text-indent: 1.4em;
	}
	article p:first-child {
		text-indent: 0;
	}
	footer {
		display: flex;
		justify-content: center;
		margin-top: 3rem;
		opacity: 0.7;
	}
	footer a {
		text-decoration: none;
	}
</style>
