<script lang="ts">
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<meta name="theme-color" content="#f7f3ec" />
	<meta
		name="description"
		content="Record a grandparent's stories by phone or voice note and print them as a beautiful book. Free, open source, self-hosted."
	/>
</svelte:head>

{@render children()}
