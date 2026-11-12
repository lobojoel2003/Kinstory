<script lang="ts">
	import { enhance } from '$app/forms';
	import { LANGUAGES } from '#lib/book-options.ts';
	import Icon from '#lib/components/Icon.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let teller = $state('');
	let title = $state('');
	const placeholder = $derived(teller ? `The Stories of ${teller}` : 'The Stories of Grandma Rosa');
</script>

<svelte:head><title>Start a new book · Kinstory</title></svelte:head>

<div class="narrow page">
	<header class="page-head">
		<p class="eyebrow">New book</p>
		<h1>Whose stories are we keeping?</h1>
		<p>
			You can change all of this later. We’ll queue up nine good first questions to get you started.
		</p>
	</header>

	<form class="card stack" method="POST" use:enhance style="--gap: 1.2rem">
		{#if form?.error}<p class="notice error" role="alert">
				<Icon name="alert" size={16} />
				{form.error}
			</p>{/if}
		<div>
			<label for="storyteller">Storyteller’s name</label>
			<input
				id="storyteller"
				name="storyteller"
				bind:value={teller}
				placeholder="Grandma Rosa"
				required
				autocomplete="off"
			/>
			<p class="hint">As you’d like it printed on the book, e.g. “Rosa Delgado”.</p>
		</div>
		<div>
			<label for="title">Book title</label>
			<input id="title" name="title" bind:value={title} {placeholder} />
		</div>
		<div class="fields">
			<div>
				<label for="askedBy">Questions asked by</label>
				<input id="askedBy" name="askedBy" value={form?.askedBy ?? data.me.name} />
				<p class="hint">How the storyteller knows you: “Maya”, “your granddaughter Maya”.</p>
			</div>
			<div>
				<label for="language">Language of the stories</label>
				<select id="language" name="language">
					{#each Object.entries(LANGUAGES) as [code, name] (code)}
						<option value={code}>{name}</option>
					{/each}
				</select>
				<p class="hint">Used for the phone voice, transcription and hyphenation.</p>
			</div>
		</div>
		<div class="row" style="justify-content: flex-end">
			<a href="/projects" class="btn ghost">Cancel</a>
			<button class="btn primary">Create book <Icon name="arrow-right" size={16} /></button>
		</div>
	</form>
</div>
