<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import { LICENSE_NAME, REPO_URL } from '#lib/meta.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<header class="top no-print">
	<div class="container bar">
		<a href={data.user ? '/projects' : '/'} class="brand" aria-label="Kinstory home"><Logo /></a>
		<nav aria-label="Account">
			{#if data.user}
				<a href="/projects" class="btn ghost small"><Icon name="book" size={16} /> Your books</a>
				<a href="/account" class="btn ghost small" title="Account">{data.user.name}</a>
				<form method="POST" action="/logout">
					<button class="btn ghost small icon" title="Sign out" aria-label="Sign out"
						><Icon name="logout" size={16} /></button
					>
				</form>
			{:else}
				<a href="/login" class="btn ghost small">Sign in</a>
				<a href="/signup" class="btn primary small">Start a book</a>
			{/if}
		</nav>
	</div>
</header>

<main>
	{@render children()}
</main>

<footer class="foot no-print">
	<div class="container spread">
		<span>
			<a href={REPO_URL}>Kinstory</a> is free software under the {LICENSE_NAME}. Your family's
			stories stay on your server.
		</span>
		<span class="ver" title="Built {data.version.date}">
			v{data.version.version} · build {data.version.build} · {data.version.commit}
		</span>
	</div>
</footer>

<style>
	.top {
		position: sticky;
		top: 0;
		z-index: 20;
		background: rgb(247 243 236 / 0.86);
		backdrop-filter: saturate(1.4) blur(10px);
		border-bottom: 1px solid var(--line);
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 64px;
	}
	.brand {
		text-decoration: none;
	}
	nav {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	nav form {
		margin: 0;
	}
	main {
		min-height: calc(100vh - 64px - 74px);
	}
	.foot {
		border-top: 1px solid var(--line);
		padding: 1.4rem 0;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.foot a {
		color: inherit;
	}
	.ver {
		font-variant-numeric: tabular-nums;
		color: var(--faint);
	}
	@media (max-width: 560px) {
		nav :global(.btn.ghost:not(.icon)) {
			display: none;
		}
	}
</style>
