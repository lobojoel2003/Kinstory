<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Account · Kinstory</title></svelte:head>

<div class="narrow page">
	<header class="page-head">
		<h1>Your account</h1>
		<p>Signed in as {data.me.email}.</p>
	</header>

	<div class="stack" style="--gap: 1.25rem">
		<form
			class="card"
			method="POST"
			action="?/profile"
			use:enhance={() =>
				({ update }) =>
					update({ reset: false })}
		>
			<h3>Name</h3>
			<div class="field">
				<label for="name">First name</label>
				<input id="name" name="name" value={data.me.name} required />
				<p class="hint">Used for “asked by” on questions you add.</p>
			</div>
			{#if form?.profileError}<p class="notice error">{form.profileError}</p>{/if}
			{#if form?.profileSaved}<p class="notice ok">Saved.</p>{/if}
			<p><button class="btn primary">Save</button></p>
		</form>

		<form class="card" method="POST" action="?/password" use:enhance>
			<h3>Password</h3>
			<div class="fields">
				<div>
					<label for="current">Current password</label>
					<input
						id="current"
						name="current"
						type="password"
						autocomplete="current-password"
						required
					/>
				</div>
				<div>
					<label for="next">New password</label>
					<input
						id="next"
						name="next"
						type="password"
						autocomplete="new-password"
						minlength="10"
						required
					/>
				</div>
			</div>
			{#if form?.passwordError}<p class="notice error">{form.passwordError}</p>{/if}
			{#if form?.passwordSaved}<p class="notice ok">Password changed.</p>{/if}
			<p><button class="btn primary">Change password</button></p>
		</form>
	</div>
</div>

<style>
	form p {
		margin: 1rem 0 0;
	}
	.notice {
		margin-top: 1rem;
	}
</style>
