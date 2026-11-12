<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import { REPO_URL } from '#lib/meta.ts';
</script>

<svelte:head>
	<title>Kinstory · Record a grandparent's stories and print a book</title>
</svelte:head>

<section class="hero">
	<div class="container hero-grid">
		<div class="copy">
			<p class="eyebrow">Free & open source · runs on your own server</p>
			<h1>Their stories, in their own words, in a book you can hold.</h1>
			<p class="lede">
				Kinstory sends your grandparent one question a week. They answer with a phone call or a
				voice note — no app to install, nothing to learn. Their words are transcribed on your own
				server and typeset into a print-ready book.
			</p>
			<div class="row">
				<a href="/signup" class="btn primary large"
					>Start a book <Icon name="arrow-right" size={16} /></a
				>
				<a href="#sample" class="btn large">See a sample</a>
			</div>
		</div>
		<figure class="art" aria-label="A finished Kinstory book: cover and an opening spread">
			<img
				class="cover"
				src="/showcase/cover.webp"
				alt="Cover of the sample book Bread & Salt"
				width="660"
				height="990"
			/>
			<img
				class="spread"
				src="/showcase/spread-opening.webp"
				alt="Chapter opening with a drop cap and the question that prompted the story"
				width="1320"
				height="990"
			/>
		</figure>
	</div>
</section>

<section class="how container">
	<p class="eyebrow">How it works</p>
	<div class="steps">
		<article>
			<span class="num">1</span>
			<Icon name="list" size={22} />
			<h3>Ask</h3>
			<p>
				Choose from a library of questions written to open memories — “What did your mother’s
				kitchen smell like?” — or write your own. Each week, one goes out.
			</p>
		</article>
		<article>
			<span class="num">2</span>
			<Icon name="phone" size={22} />
			<h3>Listen</h3>
			<p>
				Grandma answers on the phone she already has, or taps one big button on a private link.
				whisper.cpp transcribes it on your server; no recording goes to a cloud AI.
			</p>
		</article>
		<article>
			<span class="num">3</span>
			<Icon name="book" size={22} />
			<h3>Keep</h3>
			<p>
				Tidy the transcript, add photos, pick a typeface. Kinstory sets the book with Typst and
				gives you print-ready PDFs for Lulu, Amazon KDP or the copy shop down the road.
			</p>
		</article>
	</div>
</section>

<section id="sample" class="sample">
	<div class="container">
		<p class="eyebrow">The book is the product</p>
		<h2>Real typography, not a template with your text pasted in.</h2>
		<p class="muted intro">
			Drop caps measured to the line, small-capital lead-ins, balanced titles, running heads, an
			index of every question asked, and photos placed so they never strand a lonely line. Three
			typefaces, five trim sizes, colour or black and white, with the bleed each printer expects.
		</p>
		<div class="spreads">
			<img
				src="/showcase/spread-photo.webp"
				alt="A spread with a photograph, caption and pull quote"
				loading="lazy"
				width="1320"
				height="990"
			/>
			<img
				src="/showcase/spread-themes.webp"
				alt="The same chapter set in the Almanac and Field Notes themes"
				loading="lazy"
				width="1320"
				height="990"
			/>
		</div>
	</div>
</section>

<section class="why container">
	<div class="why-grid">
		<div>
			<p class="eyebrow">Why Kinstory</p>
			<h2>Stories shouldn’t need a subscription.</h2>
			<p class="muted">
				The paid services charge around a hundred dollars a year and keep the recordings on their
				servers. Kinstory is free software: run it on a small server or a home machine, keep every
				recording, and export everything as plain files whenever you like.
			</p>
			<a class="btn" href={REPO_URL}><Icon name="external" size={15} /> Source code</a>
		</div>
		<ul class="points list">
			<li>
				<Icon name="phone" />
				<div>
					<b>No app for the storyteller.</b> A weekly phone call, a text with a link, or a printed card
					for the fridge with a number to ring.
				</div>
			</li>
			<li>
				<Icon name="shield" />
				<div>
					<b>Private by design.</b> Transcription runs locally. Phone recordings are deleted from the
					gateway as soon as Kinstory has its copy.
				</div>
			</li>
			<li>
				<Icon name="users" />
				<div>
					<b>The whole family can ask.</b> Invite cousins to add questions and help edit; every question
					is credited in the book.
				</div>
			</li>
			<li>
				<Icon name="download" />
				<div>
					<b>Yours to keep.</b> One click exports audio, transcripts, photos and PDFs in open formats.
				</div>
			</li>
		</ul>
	</div>
</section>

<section class="cta">
	<div class="narrow">
		<h2>Start this Sunday.</h2>
		<p class="muted">
			It takes five minutes to set up the first question. The book takes care of itself, one answer
			at a time.
		</p>
		<a href="/signup" class="btn primary large">Start a book</a>
	</div>
</section>

<style>
	.hero {
		padding: 4.5rem 0 3rem;
		background:
			radial-gradient(1200px 500px at 85% 10%, rgb(122 46 34 / 0.07), transparent 60%),
			radial-gradient(800px 400px at 0% 100%, rgb(167 120 44 / 0.08), transparent 60%);
	}
	.hero-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
		gap: 3.5rem;
		align-items: center;
	}
	h1 {
		font-size: clamp(2.5rem, 5vw, 4rem);
		margin-bottom: 1.2rem;
	}
	.lede {
		font-family: var(--font-text);
		font-size: 1.3rem;
		line-height: 1.5;
		color: var(--ink-2);
		max-width: 34ch;
		margin-bottom: 1.8rem;
	}
	.art {
		position: relative;
		margin: 0;
		height: 470px;
	}
	.art img {
		position: absolute;
		border-radius: 3px;
		box-shadow: var(--shadow-lg);
	}
	.art .spread {
		right: 0;
		top: 40px;
		width: 82%;
		height: auto;
	}
	.art .cover {
		left: 0;
		top: 0;
		width: 38%;
		height: auto;
		border-radius: 2px 6px 6px 2px;
		z-index: 2;
		transform: rotate(-3deg);
	}
	.how {
		padding: 3.5rem 0;
	}
	.steps {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.25rem;
		margin-top: 1rem;
	}
	.steps article {
		position: relative;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 1.5rem;
		color: var(--accent);
	}
	.steps h3 {
		margin-top: 0.6rem;
		color: var(--ink);
	}
	.steps p {
		color: var(--muted);
		margin: 0;
	}
	.num {
		position: absolute;
		right: 1.2rem;
		top: 0.4rem;
		font: 300 3.2rem/1 var(--font-display);
		color: var(--line-strong);
	}
	.sample {
		padding: 4rem 0;
		background: var(--paper-2);
		border-block: 1px solid var(--line);
	}
	.intro {
		max-width: 68ch;
		font-size: 1.02rem;
	}
	.spreads {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-top: 2rem;
	}
	.spreads img {
		width: 100%;
		height: auto;
		border-radius: 3px;
		box-shadow: var(--shadow-lg);
	}
	.why {
		padding: 4rem 0;
	}
	.why-grid {
		display: grid;
		grid-template-columns: 1fr 1.1fr;
		gap: 3rem;
		align-items: start;
	}
	.points li {
		display: flex;
		gap: 0.9rem;
		color: var(--ink-2);
	}
	.points li :global(svg) {
		color: var(--accent);
		flex: none;
		margin-top: 0.2rem;
	}
	.cta {
		text-align: center;
		padding: 4rem 0 5rem;
	}
	@media (max-width: 900px) {
		.hero-grid,
		.why-grid,
		.spreads {
			grid-template-columns: 1fr;
		}
		.steps {
			grid-template-columns: 1fr;
		}
		.art {
			height: 360px;
		}
	}
</style>
