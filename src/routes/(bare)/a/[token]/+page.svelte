<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '#lib/components/Icon.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import VoiceRecorder from '#lib/components/VoiceRecorder.svelte';
	import { elderStrings } from '#lib/elder-strings.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = $derived(elderStrings(data.language));

	// null = the storyteller chose "any story"; undefined = the suggested question.
	let chosen: string | null | undefined = $state(undefined);
	let choosing = $state(false);
	let sent = $state(false);

	const question = $derived(
		chosen === null
			? null
			: chosen === undefined
				? data.prompt
				: (data.others.find((p) => p.id === chosen) ?? data.prompt)
	);

	async function onsent() {
		sent = true;
		chosen = undefined;
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>{t.greeting(data.name)} · Kinstory</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="elder" lang={data.language}>
	<header><Logo size={28} /></header>

	{#if sent}
		<section class="done" aria-live="polite">
			<div class="tick"><Icon name="check" size={56} /></div>
			<h1>{t.sent}</h1>
			<button class="btn primary huge" onclick={() => (sent = false)}>{t.sentMore}</button>
		</section>
	{:else}
		<p class="hello">{t.greeting(data.name)}</p>

		{#if choosing}
			<section class="choose">
				<button class="opt any" onclick={() => ((chosen = null), (choosing = false))}>
					<Icon name="feather" size={22} />
					<span>{t.anyStory}</span>
				</button>
				{#each data.others as p (p.id)}
					<button class="opt" onclick={() => ((chosen = p.id), (choosing = false))}>
						<span>{p.text}</span>
						{#if p.askedBy}<small>{t.questionFrom(p.askedBy)}</small>{/if}
					</button>
				{/each}
			</section>
		{:else}
			<section class="question">
				{#if question}
					{#if question.askedBy}<p class="from">{t.questionFrom(question.askedBy)}</p>{/if}
					<h1>{question.text}</h1>
				{:else}
					<h1>{t.anyStory}</h1>
				{/if}
			</section>

			<VoiceRecorder
				{t}
				uploadUrl="{page.url.pathname}/answer"
				promptId={question?.id ?? null}
				{onsent}
			/>

			{#if data.others.length > 1 || data.prompt}
				<button class="switch" onclick={() => (choosing = true)}>{t.anotherQuestion}</button>
			{/if}
		{/if}

		{#if data.phone}
			<p class="phone"><Icon name="phone" size={18} /> {t.orCall(data.phone, data.pin)}</p>
		{/if}
	{/if}
</main>

<style>
	:global(body) {
		background: var(--paper);
	}
	.elder {
		width: min(100% - 2.5rem, 640px);
		margin: 0 auto;
		padding: 1.5rem 0 3rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		min-height: 100vh;
		min-height: 100dvh;
		font-size: 1.15rem;
	}
	header {
		margin-bottom: 2.2rem;
		opacity: 0.85;
	}
	.hello {
		font: 400 1.5rem/1.2 var(--font-text);
		font-style: italic;
		color: var(--muted);
		margin: 0 0 1.2rem;
	}
	.question {
		margin-bottom: 2.4rem;
	}
	.from {
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 0.8rem;
	}
	h1 {
		font: 400 clamp(2.1rem, 7vw, 3rem) / 1.12 var(--font-display);
		margin: 0;
		text-wrap: balance;
	}
	.switch {
		margin-top: 2.2rem;
		background: none;
		border: 0;
		font: 500 1.1rem var(--font-ui);
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 5px;
		cursor: pointer;
		padding: 0.6rem;
	}
	.choose {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		width: 100%;
	}
	.opt {
		text-align: left;
		padding: 1.1rem 1.3rem;
		border-radius: 16px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font: 400 1.35rem/1.3 var(--font-text);
		color: var(--ink);
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.opt small {
		font: 500 0.85rem var(--font-ui);
		color: var(--muted);
	}
	.opt.any {
		flex-direction: row;
		align-items: center;
		gap: 0.7rem;
		background: var(--accent-soft);
		border-color: #e3c4b8;
		color: var(--accent);
		font-family: var(--font-ui);
		font-size: 1.15rem;
		font-weight: 550;
	}
	.opt:hover {
		border-color: var(--accent);
	}
	.phone {
		margin-top: auto;
		padding-top: 3rem;
		display: flex;
		gap: 0.5rem;
		align-items: center;
		color: var(--muted);
		font-size: 1.05rem;
	}
	.done {
		padding-top: 10vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.2rem;
	}
	.tick {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background: var(--sage);
		color: #fff;
		display: grid;
		place-items: center;
		animation: pop 0.4s ease-out;
	}
	.huge {
		min-height: 64px;
		font-size: 1.2rem;
		padding-inline: 1.8rem;
		border-radius: 18px;
	}
	@keyframes pop {
		from {
			transform: scale(0.6);
			opacity: 0;
		}
	}
</style>
