<script lang="ts">
	let { size = 30, wordmark = true }: { size?: number; wordmark?: boolean } = $props();
</script>

<span class="logo">
	<!-- An open book: the storyteller's voice on the left page, their words on the right. -->
	<svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
		<rect width="64" height="64" rx="15" fill="#7a2e22" />
		<path d="M10 45.5c7.2-3.6 14.4-3.6 21.5 0V20.5c-7.1-3.6-14.3-3.6-21.5 0z" fill="#fbf4ea" />
		<path d="M54 45.5c-7.2-3.6-14.4-3.6-21.5 0V20.5c7.1-3.6 14.3-3.6 21.5 0z" fill="#f1e5d3" />
		<g stroke="#7a2e22" stroke-width="2.4" stroke-linecap="round">
			<path d="M15 30.5v5M19 27.5v11M23 29.5v7M27 31.5v3" />
		</g>
		<g stroke="#b5866f" stroke-width="2" stroke-linecap="round">
			<path d="M37.5 27.5h11M37.5 32h11M37.5 36.5h7.5" />
		</g>
	</svg>
	{#if wordmark}<span class="word">Kinstory</span>{/if}
</span>

<style>
	.logo {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		color: var(--ink);
	}
	.word {
		font-family: var(--font-display);
		font-size: 1.55rem;
		font-weight: 500;
		letter-spacing: 0.01em;
		line-height: 1;
	}
</style>
