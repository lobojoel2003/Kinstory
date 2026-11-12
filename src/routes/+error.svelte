<script lang="ts">
	import { page } from '$app/state';
	import Logo from '#lib/components/Logo.svelte';
</script>

<svelte:head><title>{page.status} · Kinstory</title></svelte:head>

<main class="narrow page err">
	<a href="/" class="home"><Logo /></a>
	<p class="eyebrow">Error {page.status}</p>
	<h1>{page.status === 404 ? 'This page has wandered off.' : 'Something went wrong.'}</h1>
	<p class="muted">{page.error?.message ?? 'Please try again in a moment.'}</p>
	<p><a class="btn" href="/">Back to Kinstory</a></p>
</main>

<style>
	.err {
		padding-top: 12vh;
	}
	.home {
		display: inline-block;
		margin-bottom: 3rem;
		text-decoration: none;
	}
</style>
