<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import CopyButton from '#lib/components/CopyButton.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { ago, duration, longDate, WEEKDAYS } from '#lib/format.ts';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const base = $derived(`/p/${data.project.id}`);
	const pending = $derived(
		data.recent.some((r) => r.status === 'pending' || r.status === 'processing')
	);

	// Refresh while answers are being transcribed.
	onMount(() => {
		const t = setInterval(() => {
			if (pending) void invalidateAll();
		}, 4000);
		return () => clearInterval(t);
	});

	const status = {
		pending: { label: 'Waiting', cls: 'gold', pulse: true },
		processing: { label: 'Transcribing', cls: 'gold', pulse: true },
		done: { label: 'Transcribed', cls: 'sage', pulse: false },
		failed: { label: 'Needs typing', cls: 'danger', pulse: false }
	} as const;
	const via = { phone: 'phone call', web: 'voice note', upload: 'upload' } as const;
</script>

<svelte:head><title>{data.project.title} · Kinstory</title></svelte:head>

<div class="container page">
	{#if data.welcome}
		<div class="notice ok welcome">
			<Icon name="sparkles" size={18} />
			<div>
				<b>Your book is set up, with nine questions waiting.</b> Next, send {data.storytellers[0]
					?.name ?? 'your storyteller'} their private answer link, or print a card with the phone number
				for their fridge.
			</div>
		</div>
	{/if}
	{#if form?.sent}<p class="notice ok"><Icon name="check" size={16} /> {form.sent}</p>{/if}
	{#if form?.sendError}<p class="notice error">
			<Icon name="alert" size={16} />
			{form.sendError}
		</p>{/if}

	<div class="layout">
		<div class="stack" style="--gap: 1.4rem">
			{#each data.current as { teller, prompt, next } (teller.id)}
				{@const link = `${data.capabilities.publicUrl}/a/${teller.answerToken}`}
				<section class="card week">
					<p class="eyebrow">This week’s question for {teller.name}</p>
					{#if prompt}
						<blockquote>
							<p class="q">{prompt.text}</p>
							{#if prompt.askedBy}<footer>asked by {prompt.askedBy}</footer>{/if}
						</blockquote>
					{:else}
						<blockquote><p class="q muted">No questions waiting.</p></blockquote>
						<a class="btn small" href="{base}/questions"
							><Icon name="plus" size={14} /> Add questions</a
						>
					{/if}

					<div class="send">
						{#if data.capabilities.voice && teller.phone}
							<form method="POST" action="?/send" use:enhance>
								<input type="hidden" name="teller" value={teller.id} /><input
									type="hidden"
									name="via"
									value="call"
								/>
								<button class="btn primary"
									><Icon name="phone" size={16} /> Call {teller.name} now</button
								>
							</form>
							<form method="POST" action="?/send" use:enhance>
								<input type="hidden" name="teller" value={teller.id} /><input
									type="hidden"
									name="via"
									value="sms"
								/>
								<button class="btn"><Icon name="message" size={16} /> Text the link</button>
							</form>
						{/if}
						{#if data.capabilities.mail && teller.email}
							<form method="POST" action="?/send" use:enhance>
								<input type="hidden" name="teller" value={teller.id} /><input
									type="hidden"
									name="via"
									value="email"
								/>
								<button class="btn"><Icon name="mail" size={16} /> Email the link</button>
							</form>
						{/if}
						<a class="btn" href="{base}/storytellers/{teller.id}/card"
							><Icon name="printer" size={16} /> Print a card</a
						>
						{#if prompt}
							<form method="POST" action="?/skip" use:enhance>
								<input type="hidden" name="prompt" value={prompt.id} />
								<button class="btn ghost">Skip this one</button>
							</form>
						{/if}
					</div>

					<div class="link">
						<span class="label">{teller.name}’s private answer link</span>
						<div class="row">
							<code>{link}</code>
							<CopyButton text={link} />
							<a class="btn small ghost" href={link} target="_blank" rel="noreferrer"
								><Icon name="external" size={14} /> Open</a
							>
						</div>
						<p class="hint">
							Anyone with this link can record an answer, so share it only with {teller.name}. One
							tap records; there’s nothing to install.
						</p>
					</div>

					<p class="schedule small muted">
						<Icon name="calendar" size={15} />
						{#if next && teller.callDay !== null}
							Kinstory {teller.delivery === 'call'
								? 'calls'
								: teller.delivery === 'sms'
									? 'texts'
									: 'emails'}
							{teller.name} every {WEEKDAYS[teller.callDay]} at {teller.callTime}. Next: {longDate(
								next,
								teller.timezone
							)}.
						{:else}
							No weekly schedule yet. <a href="{base}/settings#teller-{teller.id}">Set one</a> and the
							questions go out on their own.
						{/if}
					</p>
				</section>
			{/each}

			<section class="card">
				<div class="card-head">
					<h3>Latest answers</h3>
					<a href="{base}/stories" class="small">All stories →</a>
				</div>
				{#if data.recent.length === 0}
					<p class="muted">
						Nothing yet. When {data.storytellers[0]?.name ?? 'your storyteller'} answers, it appears here
						within a minute or two, already transcribed.
					</p>
				{:else}
					<ul class="list answers">
						{#each data.recent as r (r.id)}
							{@const s = status[r.status]}
							<li>
								<Icon name={r.source === 'phone' ? 'phone' : 'mic'} size={18} />
								<div class="what">
									{#if r.storyId}
										<a href="{base}/stories/{r.storyId}"
											>{r.storyTitle ?? r.question ?? 'Untitled story'}</a
										>
									{:else}
										<span>{r.question ?? 'A new story'}</span>
									{/if}
									<span class="small muted">
										{r.tellerName ?? ''} · {via[r.source]}{r.durationSeconds
											? ` · ${duration(r.durationSeconds)}`
											: ''} · {ago(r.createdAt)}
									</span>
								</div>
								<span class="chip {s.cls}"
									><span class="dot" class:pulse={s.pulse}></span>{s.label}</span
								>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>

		<aside class="stack" style="--gap: 1.4rem">
			<div class="stats">
				<div class="stat"><b>{data.stats.stories}</b><span>stories</span></div>
				<div class="stat"><b>{data.stats.minutes}</b><span>minutes told</span></div>
				<div class="stat"><b>{data.stats.words.toLocaleString('en')}</b><span>words</span></div>
				<div class="stat"><b>{data.stats.queued}</b><span>questions waiting</span></div>
			</div>

			<section class="card book">
				{#if data.render}
					<img
						src="{base}/renders/{data.render.id}/front.webp"
						alt="Front cover of {data.project.title}"
					/>
					<p class="small muted">
						{data.render.pages} pages · typeset {ago(data.render.finishedAt)}
					</p>
				{:else}
					<div class="placeholder"><Icon name="book" size={28} /></div>
					<p class="small muted">
						Typeset the book whenever you like — even with one story — to see how it’s coming along.
					</p>
				{/if}
				<a href="{base}/book" class="btn primary">Design & print the book</a>
			</section>
		</aside>
	</div>
</div>

<style>
	.welcome,
	.notice {
		margin-bottom: 1.4rem;
	}
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 320px;
		gap: 1.5rem;
		align-items: start;
	}
	.week {
		padding: 1.8rem 1.9rem 1.5rem;
	}
	blockquote {
		margin: 0.6rem 0 1.4rem;
	}
	.q {
		font: 400 2.1rem/1.15 var(--font-display);
		margin: 0;
	}
	blockquote footer {
		margin-top: 0.4rem;
		font-family: var(--font-text);
		font-style: italic;
		color: var(--muted);
		font-size: 1.05rem;
	}
	.send {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.send form {
		margin: 0;
	}
	.link {
		margin-top: 1.4rem;
		padding: 1rem 1.1rem;
		border-radius: var(--radius-sm);
		background: var(--paper);
		border: 1px dashed var(--line-strong);
	}
	.link code {
		font-size: 0.82rem;
		padding: 0.35rem 0.55rem;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 6px;
		overflow-wrap: anywhere;
		flex: 1;
		min-width: 0;
	}
	.link .hint {
		margin-bottom: 0;
	}
	.schedule {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin: 1.1rem 0 0;
	}
	.answers li {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		color: var(--muted);
	}
	.what {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
	.what a,
	.what > span:first-child {
		color: var(--ink);
		font-weight: 500;
		text-decoration: none;
	}
	.what a:hover {
		color: var(--accent);
	}
	.stats {
		grid-template-columns: 1fr 1fr;
	}
	.book {
		text-align: center;
	}
	.book img {
		width: 62%;
		margin: 0.2rem auto 0.8rem;
		border-radius: 2px 5px 5px 2px;
		box-shadow:
			inset 4px 0 8px -4px rgb(0 0 0 / 0.4),
			var(--shadow-lg);
	}
	.placeholder {
		width: 62%;
		aspect-ratio: 2/3;
		margin: 0.2rem auto 0.9rem;
		border-radius: 2px 6px 6px 2px;
		background: var(--accent);
		color: #f2e7d3;
		display: grid;
		place-items: center;
		box-shadow: var(--shadow-lg);
	}
	@media (max-width: 960px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
