<script lang="ts">
	import { page } from '$app/state';
	import Icon, { type IconName } from '#lib/components/Icon.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const base = $derived(`/p/${data.project.id}`);
	const tabs: { href: string; label: string; icon: IconName }[] = $derived([
		{ href: base, label: 'Overview', icon: 'home' },
		{ href: `${base}/questions`, label: 'Questions', icon: 'list' },
		{ href: `${base}/stories`, label: 'Stories', icon: 'feather' },
		{ href: `${base}/photos`, label: 'Photos', icon: 'image' },
		{ href: `${base}/book`, label: 'Book', icon: 'book' },
		{ href: `${base}/settings`, label: 'Settings', icon: 'settings' }
	]);
	const active = (href: string) =>
		href === base ? page.url.pathname === base : page.url.pathname.startsWith(href);
</script>

<div class="project-head no-print">
	<div class="container">
		<div class="title">
			<a href={base} class="name">{data.project.title}</a>
			<span class="muted small">
				{data.storytellers.map((s) => s.name).join(' & ') || 'No storyteller yet'}
			</span>
		</div>
		<nav aria-label="Book sections">
			{#each tabs as t (t.href)}
				<a
					href={t.href}
					class:active={active(t.href)}
					aria-current={active(t.href) ? 'page' : undefined}
				>
					<Icon name={t.icon} size={16} />
					<span>{t.label}</span>
				</a>
			{/each}
		</nav>
	</div>
</div>

{@render children()}

<style>
	.project-head {
		background: var(--surface);
		border-bottom: 1px solid var(--line);
	}
	.title {
		display: flex;
		align-items: baseline;
		gap: 0.8rem;
		padding-top: 1.1rem;
		flex-wrap: wrap;
	}
	.name {
		font: 400 1.6rem/1.1 var(--font-display);
		color: var(--ink);
		text-decoration: none;
	}
	nav {
		display: flex;
		gap: 0.2rem;
		margin-top: 0.7rem;
		overflow-x: auto;
		scrollbar-width: none;
	}
	nav a {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.6rem 0.85rem 0.75rem;
		color: var(--muted);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9rem;
		border-bottom: 2px solid transparent;
		white-space: nowrap;
	}
	nav a:hover {
		color: var(--ink);
	}
	nav a.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}
	@media (max-width: 640px) {
		nav a span {
			display: none;
		}
		nav a.active span {
			display: inline;
		}
	}
</style>
