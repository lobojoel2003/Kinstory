<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const next = $derived(encodeURIComponent(page.url.pathname));
</script>

<svelte:head><title>Join “{data.invite.title}” · Kinstory</title></svelte:head>

<div class="narrow page">
	<div class="card invite">
		<p class="eyebrow">Invitation</p>
		<h1>
			{data.invite.inviter ?? 'Your family'} invited you to help with <em>{data.invite.title}</em>
		</h1>
		{#if data.invite.expired || data.invite.used}
			<p class="notice error">
				This link has {data.invite.used ? 'already been used' : 'expired'}. Ask for a new one.
			</p>
		{:else if data.signedIn}
			<p class="muted">You’ll be able to add questions, edit stories and design the book.</p>
			<form method="POST"><button class="btn primary large">Join the book</button></form>
		{:else}
			<p class="muted">Create an account or sign in to join. It takes a minute.</p>
			<div class="row">
				<a class="btn primary large" href="/signup?next={next}">Create an account</a>
				<a class="btn large" href="/login?next={next}">Sign in</a>
			</div>
		{/if}
	</div>
</div>

<style>
	.invite {
		padding: 2.2rem;
		text-align: center;
	}
	.invite h1 {
		font-size: 2rem;
	}
	.row {
		justify-content: center;
	}
</style>
