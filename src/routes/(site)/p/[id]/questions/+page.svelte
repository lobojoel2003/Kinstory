<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import { ago } from '#lib/format.ts';
	import { PROMPT_LIBRARY } from '#lib/prompts.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const open = $derived(data.prompts.filter((p) => p.status === 'queued' || p.status === 'sent'));
	const answered = $derived(data.prompts.filter((p) => p.status === 'answered'));
	const skipped = $derived(data.prompts.filter((p) => p.status === 'skipped'));
	const known = $derived(new Set(data.prompts.map((p) => p.text.trim().toLowerCase())));

	let category = $state(PROMPT_LIBRARY[0].id);
	let editing: string | null = $state(null);
	let draft = $state('');
	const tellerName = (id: string | null) => data.storytellers.find((s) => s.id === id)?.name;

	function orderWith(index: number, delta: number): string {
		const ids = open.map((p) => p.id);
		const j = index + delta;
		if (j < 0 || j >= ids.length) return ids.join(',');
		[ids[index], ids[j]] = [ids[j], ids[index]];
		return ids.join(',');
	}
</script>

<svelte:head><title>Questions · {data.project.title}</title></svelte:head>

<div class="container page">
	<header class="page-head">
		<h1>Questions</h1>
		<p>
			One question goes out each week, from the top of the queue. The best ones are specific: a
			place, a smell, a person, a day.
		</p>
	</header>

	<div class="layout">
		<div class="stack" style="--gap: 1.4rem">
			<form
				class="card add"
				method="POST"
				action="?/add"
				use:enhance={() =>
					async ({ update }) => {
						await update();
						draft = '';
					}}
			>
				<label for="text">Ask something new</label>
				<textarea
					id="text"
					name="text"
					rows="2"
					bind:value={draft}
					placeholder="What was the bravest thing you ever did?"
					required></textarea>
				<div class="row opts">
					<input name="askedBy" value={data.me.name} aria-label="Asked by" class="asker" />
					{#if data.storytellers.length > 1}
						<select name="teller" aria-label="For">
							<option value="any">For anyone</option>
							{#each data.storytellers as t (t.id)}<option value={t.id}>For {t.name}</option>{/each}
						</select>
					{/if}
					<label class="check small"><input type="checkbox" name="first" /> Ask it next</label>
					<button class="btn primary"><Icon name="plus" size={16} /> Add to queue</button>
				</div>
				{#if form?.addError}<p class="notice error">{form.addError}</p>{/if}
			</form>

			<section class="card">
				<div class="card-head">
					<h3>Up next</h3>
					<span class="muted small">{open.length} waiting</span>
				</div>
				{#if open.length === 0}
					<p class="muted">The queue is empty. Add a question above, or pick from the library.</p>
				{:else}
					<ol class="list queue">
						{#each open as p, i (p.id)}
							<li class:sent={p.status === 'sent'}>
								<span class="n">{i + 1}</span>
								<div class="body">
									{#if editing === p.id}
										<form
											method="POST"
											action="?/edit"
											use:enhance={() =>
												async ({ update }) => {
													await update();
													editing = null;
												}}
											class="stack"
											style="--gap: .5rem"
										>
											<input type="hidden" name="id" value={p.id} />
											<textarea name="text" rows="2" value={p.text}></textarea>
											<div class="row">
												<input
													name="askedBy"
													value={p.askedBy ?? ''}
													placeholder="Asked by"
													class="asker"
												/>
												<button class="btn small primary">Save</button>
												<button
													type="button"
													class="btn small ghost"
													onclick={() => (editing = null)}>Cancel</button
												>
											</div>
										</form>
									{:else}
										<p class="text">{p.text}</p>
										<p class="small muted meta">
											{#if p.status === 'sent'}<span class="chip accent">Sent {ago(p.sentAt)}</span
												>{/if}
											{p.askedBy ? `asked by ${p.askedBy}` : ''}{tellerName(p.storytellerId)
												? ` · for ${tellerName(p.storytellerId)}`
												: ''}
										</p>
									{/if}
								</div>
								{#if editing !== p.id}
									<div class="tools">
										<form method="POST" action="?/move" use:enhance>
											<input type="hidden" name="order" value={orderWith(i, -1)} />
											<button
												class="btn icon ghost"
												disabled={i === 0}
												title="Move up"
												aria-label="Move up"><Icon name="arrow-up" size={15} /></button
											>
										</form>
										<form method="POST" action="?/move" use:enhance>
											<input type="hidden" name="order" value={orderWith(i, 1)} />
											<button
												class="btn icon ghost"
												disabled={i === open.length - 1}
												title="Move down"
												aria-label="Move down"><Icon name="arrow-down" size={15} /></button
											>
										</form>
										<button
											class="btn icon ghost"
											title="Edit"
											aria-label="Edit"
											onclick={() => (editing = p.id)}><Icon name="edit" size={15} /></button
										>
										<form method="POST" action="?/skip" use:enhance>
											<input type="hidden" name="id" value={p.id} />
											<button class="btn icon ghost" title="Skip" aria-label="Skip"
												><Icon name="x" size={15} /></button
											>
										</form>
									</div>
								{/if}
							</li>
						{/each}
					</ol>
				{/if}
			</section>

			{#if answered.length}
				<section class="card">
					<div class="card-head">
						<h3>Answered</h3>
						<span class="muted small">{answered.length}</span>
					</div>
					<ul class="list done">
						{#each answered as p (p.id)}
							<li>
								<Icon name="check" size={16} /><span>{p.text}</span><span class="small muted"
									>{ago(p.answeredAt)}</span
								>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if skipped.length}
				<details class="card">
					<summary><h3>Skipped ({skipped.length})</h3></summary>
					<ul class="list done">
						{#each skipped as p (p.id)}
							<li>
								<span>{p.text}</span>
								<form method="POST" action="?/restore" use:enhance>
									<input type="hidden" name="id" value={p.id} /><button class="btn small"
										>Restore</button
									>
								</form>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={p.id} /><button class="btn small danger"
										>Delete</button
									>
								</form>
							</li>
						{/each}
					</ul>
				</details>
			{/if}
		</div>

		<aside class="card library">
			<h3>Question library</h3>
			<p class="small muted">
				Written to open memories, not to interview. Add any to the end of the queue.
			</p>
			<div class="cats" role="tablist">
				{#each PROMPT_LIBRARY as c (c.id)}
					<button
						role="tab"
						class="chip"
						class:accent={category === c.id}
						aria-selected={category === c.id}
						onclick={() => (category = c.id)}>{c.label}</button
					>
				{/each}
			</div>
			<ul class="list lib">
				{#each PROMPT_LIBRARY.find((c) => c.id === category)?.questions ?? [] as q (q)}
					{@const have = known.has(q.toLowerCase())}
					<li>
						<span class:have>{q}</span>
						<form method="POST" action="?/add" use:enhance>
							<input type="hidden" name="text" value={q} />
							<input type="hidden" name="askedBy" value={data.me.name} />
							<button
								class="btn icon small"
								disabled={have}
								title={have ? 'Already in your list' : 'Add to queue'}
								aria-label={have ? 'Already added' : `Add “${q}”`}
							>
								<Icon name={have ? 'check' : 'plus'} size={15} />
							</button>
						</form>
					</li>
				{/each}
			</ul>
		</aside>
	</div>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 380px;
		gap: 1.5rem;
		align-items: start;
	}
	.add textarea {
		font: 400 1.15rem/1.4 var(--font-text);
		min-height: 3.6rem;
	}
	.opts {
		margin-top: 0.75rem;
		justify-content: flex-end;
	}
	.opts .check {
		margin: 0;
	}
	.asker {
		width: 160px;
	}
	.opts select {
		width: auto;
	}
	.queue {
		counter-reset: q;
	}
	.queue li {
		display: flex;
		gap: 0.9rem;
		align-items: flex-start;
	}
	.queue li.sent .n {
		background: var(--accent);
		color: #fff;
	}
	.n {
		flex: none;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--paper-2);
		color: var(--muted);
		display: grid;
		place-items: center;
		font-size: 0.78rem;
		font-weight: 600;
		margin-top: 0.15rem;
	}
	.body {
		flex: 1;
		min-width: 0;
	}
	.text {
		font: 400 1.15rem/1.35 var(--font-text);
		margin: 0;
	}
	.meta {
		margin: 0.2rem 0 0;
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.tools {
		display: flex;
		gap: 0.1rem;
		flex: none;
	}
	.tools form {
		margin: 0;
	}
	.done li {
		display: flex;
		gap: 0.7rem;
		align-items: center;
		font-family: var(--font-text);
		font-size: 1.05rem;
	}
	.done li :global(svg) {
		color: var(--sage);
		flex: none;
	}
	.done li span:first-of-type {
		flex: 1;
	}
	.done form {
		margin: 0;
	}
	details summary {
		cursor: pointer;
		list-style: none;
	}
	details summary h3 {
		margin: 0;
		display: inline;
	}
	.library {
		position: sticky;
		top: 80px;
	}
	.cats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 0.8rem 0 0.5rem;
	}
	.cats button {
		border: 0;
		cursor: pointer;
	}
	.lib li {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		font-family: var(--font-text);
		font-size: 1.05rem;
		line-height: 1.3;
	}
	.lib li span {
		flex: 1;
	}
	.lib .have {
		color: var(--faint);
	}
	.lib form {
		margin: 0;
	}
	@media (max-width: 1000px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.library {
			position: static;
		}
	}
</style>
