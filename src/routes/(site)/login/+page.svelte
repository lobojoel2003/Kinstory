<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Sign in · Kinstory</title></svelte:head>

<div class="auth">
	<div class="card">
		<h1>Welcome back</h1>
		<p class="muted">Sign in to keep gathering stories.</p>
		{#if form?.error}<p class="notice error" role="alert">
				<Icon name="alert" size={16} />
				{form.error}
			</p>{/if}
		<form
			method="POST"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update();
					busy = false;
				};
			}}
		>
			<div class="field">
				<label for="email">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					value={form?.email ?? ''}
				/>
			</div>
			<div class="field">
				<label for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
				/>
			</div>
			<button class="btn primary large wide" disabled={busy}
				>{busy ? 'Signing in…' : 'Sign in'}</button
			>
		</form>
		{#if data.allowSignup}
			<p class="small muted alt">
				New here? <a href="/signup{data.next ? `?next=${encodeURIComponent(data.next)}` : ''}"
					>Create an account</a
				>
			</p>
		{/if}
	</div>
</div>

<style>
	.auth {
		display: grid;
		place-items: center;
		padding: 4rem 1.25rem;
	}
	.card {
		width: min(100%, 420px);
		padding: 2rem 2rem 1.5rem;
	}
	form {
		margin-top: 1.25rem;
	}
	.wide {
		width: 100%;
		margin-top: 1.4rem;
	}
	.alt {
		text-align: center;
		margin: 1.25rem 0 0;
	}
	.notice {
		margin-top: 1rem;
	}
</style>
