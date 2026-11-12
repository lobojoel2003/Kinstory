<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Create an account · Kinstory</title></svelte:head>

<div class="auth">
	<div class="card">
		<p class="eyebrow">Start a book</p>
		<h1>Create your account</h1>
		<p class="muted">You’ll organise the questions. Your storyteller never needs an account.</p>
		{#if form?.error}<p class="notice error" role="alert">
				<Icon name="alert" size={16} />
				{form.error}
			</p>{/if}
		<form
			method="POST"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
		>
			<div class="field">
				<label for="name">Your first name</label>
				<input id="name" name="name" autocomplete="given-name" required value={form?.name ?? ''} />
				<p class="hint">Shown as “asked by …” beside your questions in the book.</p>
			</div>
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
					autocomplete="new-password"
					minlength="10"
					required
				/>
				<p class="hint">At least 10 characters.</p>
			</div>
			<button class="btn primary large wide" disabled={busy}
				>{busy ? 'Creating…' : 'Create account'}</button
			>
		</form>
		<p class="small muted alt">
			Already have an account? <a
				href="/login{data.next ? `?next=${encodeURIComponent(data.next)}` : ''}">Sign in</a
			>
		</p>
	</div>
</div>

<style>
	.auth {
		display: grid;
		place-items: center;
		padding: 4rem 1.25rem;
	}
	.card {
		width: min(100%, 440px);
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
