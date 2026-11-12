<script lang="ts">
	import Icon from './Icon.svelte';

	let { pages, src, aspect }: { pages: number; src: (n: number) => string; aspect: number } =
		$props();

	// Page 1 is a recto on its own; after that pages pair as verso + recto.
	const spreads = $derived(Math.floor(pages / 2) + 1);
	let index = $state(0);
	const left = $derived(index === 0 ? null : 2 * index);
	const right = $derived(index === 0 ? 1 : 2 * index + 1 <= pages ? 2 * index + 1 : null);

	function go(d: number) {
		index = Math.max(0, Math.min(spreads - 1, index + d));
	}
</script>

<!-- The range slider below handles arrow keys for keyboard users. -->
<div class="viewer" role="region" aria-label="Book preview">
	<div class="spread" style="--aspect: {aspect}">
		<div class="page left">
			{#if left && left <= pages}<img src={src(left)} alt="Page {left}" />{/if}
		</div>
		<div class="page right">
			{#if right}<img src={src(right)} alt="Page {right}" />{/if}
		</div>
		<div class="gutter"></div>
	</div>
	<div class="controls">
		<button
			class="btn icon"
			onclick={() => go(-1)}
			disabled={index === 0}
			aria-label="Previous pages"><Icon name="arrow-left" size={16} /></button
		>
		<input type="range" min="0" max={spreads - 1} bind:value={index} aria-label="Turn to page" />
		<span class="small muted where"
			>{index === 0 ? 'Page 1' : `Pages ${left}–${right ?? left}`} of {pages}</span
		>
		<button
			class="btn icon"
			onclick={() => go(1)}
			disabled={index >= spreads - 1}
			aria-label="Next pages"><Icon name="arrow-right" size={16} /></button
		>
	</div>
</div>

<style>
	.spread {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		filter: drop-shadow(0 18px 30px rgb(60 40 20 / 0.22));
	}
	.page {
		aspect-ratio: var(--aspect);
		background: #fff;
		overflow: hidden;
	}
	.page.left {
		border-radius: 3px 0 0 3px;
	}
	.page.right {
		border-radius: 0 3px 3px 0;
	}
	.page:empty {
		background: transparent;
	}
	.page img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.gutter {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 40px;
		transform: translateX(-50%);
		background: linear-gradient(
			to right,
			transparent,
			rgb(0 0 0 / 0.07) 45%,
			rgb(0 0 0 / 0.12) 50%,
			rgb(0 0 0 / 0.04) 55%,
			transparent
		);
		pointer-events: none;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		margin-top: 1.2rem;
	}
	.controls input {
		flex: 1;
		accent-color: var(--accent);
	}
	.where {
		min-width: 9rem;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
</style>
