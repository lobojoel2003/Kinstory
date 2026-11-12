<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const from = $derived(data.askers || 'your family');
	const pretty = (n: string) => n.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '+1 ($1) $2-$3');
</script>

<svelte:head><title>Card for {data.name} · Kinstory</title></svelte:head>

<div class="toolbar no-print">
	<a class="btn small ghost" href="/p/{data.project.id}"
		><Icon name="arrow-left" size={14} /> Back</a
	>
	<button class="btn small primary" onclick={() => print()}
		><Icon name="printer" size={14} /> Print</button
	>
</div>

<article class="card-print">
	<header>
		<p class="kicker">For {data.name}</p>
		<h1>Your family would love to hear your stories.</h1>
		<p class="lede">
			Each week there’s a new question from {from}. Answer whenever you like, in your own words.
			There is nothing to install.
		</p>
	</header>

	<div class="ways">
		{#if data.phone}
			<section>
				<h2><span>1</span> Call</h2>
				<p class="big">{pretty(data.phone)}</p>
				<p>
					You’ll hear this week’s question, then talk for as long as you like. If you’re asked for a
					code, press:
				</p>
				<p class="pin">{data.pin.split('').join(' ')}</p>
			</section>
		{/if}
		<section>
			<h2>
				<span>{data.phone ? 2 : 1}</span>
				{data.phone ? 'Or use your phone camera' : 'Use your phone camera'}
			</h2>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG generated on the server by the qrcode library from our own URL -->
			<div class="qr">{@html data.qr}</div>
			<p>
				Point the camera at this square and tap the link. Press the big red button and start
				talking.
			</p>
		</section>
	</div>

	<footer>
		<Logo size={22} />
		<span>{data.project.title}</span>
	</footer>
</article>

<style>
	:global(body) {
		background: var(--paper-2);
	}
	.toolbar {
		display: flex;
		justify-content: space-between;
		width: min(100% - 2rem, 760px);
		margin: 1.2rem auto;
	}
	.card-print {
		width: min(100% - 2rem, 760px);
		margin: 0 auto 3rem;
		background: #fffdf8;
		border: 1px solid var(--line);
		border-radius: 18px;
		box-shadow: var(--shadow-lg);
		padding: 3rem 3.2rem 2rem;
		font-size: 1.15rem;
	}
	.kicker {
		font-size: 0.9rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 0.6rem;
	}
	h1 {
		font: 400 2.7rem/1.1 var(--font-display);
		margin-bottom: 0.8rem;
	}
	.lede {
		font-family: var(--font-text);
		font-size: 1.35rem;
		color: var(--ink-2);
	}
	.ways {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 2rem;
		margin: 2.2rem 0;
	}
	h2 {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font: 600 1.15rem var(--font-ui);
		margin-bottom: 0.8rem;
	}
	h2 span {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--accent);
		color: #fff;
		font-size: 1rem;
	}
	.big {
		font: 500 2.1rem/1.1 var(--font-ui);
		letter-spacing: 0.01em;
		margin-bottom: 0.7rem;
	}
	.pin {
		font: 600 2rem/1 var(--font-ui);
		letter-spacing: 0.25em;
		color: var(--accent);
	}
	.qr {
		width: 190px;
		height: 190px;
		padding: 12px;
		background: #fff;
		border: 1px solid var(--line);
		border-radius: 12px;
		margin-bottom: 0.9rem;
	}
	.qr :global(svg) {
		width: 100%;
		height: 100%;
	}
	footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1.2rem;
		border-top: 1px solid var(--line);
		color: var(--muted);
		font-size: 0.9rem;
	}
	@media print {
		@page {
			margin: 12mm;
		}
		:global(body) {
			background: #fff;
		}
		.card-print {
			box-shadow: none;
			margin: 0;
			width: 100%;
		}
	}
</style>
