<script lang="ts">
	import { enhance } from '$app/forms';
	import CopyButton from '#lib/components/CopyButton.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { WEEKDAYS } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const base = $derived(`/p/${data.project.id}`);
	const owner = $derived(data.project.role === 'owner');
	const caps = $derived(data.capabilities);
</script>

<svelte:head><title>Settings · {data.project.title}</title></svelte:head>

<div class="narrow page wide">
	<header class="page-head">
		<h1>Settings</h1>
		<p>Who tells the stories, how questions reach them, and who in the family helps.</p>
	</header>

	{#if !caps.voice || !caps.mail}
		<p class="notice">
			<Icon name="alert" size={16} />
			<span>
				{#if !caps.voice}The phone line is off: set the <code>TWILIO_*</code> variables to call and text
					storytellers.{/if}
				{#if !caps.mail}Email is off: set <code>SMTP_URL</code> to email questions and answer alerts.{/if}
				The private answer link works without either.
			</span>
		</p>
	{/if}

	<h2>Storytellers</h2>
	{#each data.storytellers as t (t.id)}
		<form
			id="teller-{t.id}"
			class="card teller"
			method="POST"
			action="?/teller"
			use:enhance={() =>
				({ update }) =>
					update({ reset: false })}
		>
			<input type="hidden" name="id" value={t.id} />
			<div class="fields">
				<div>
					<label for="name-{t.id}">Name</label><input
						id="name-{t.id}"
						name="name"
						value={t.name}
						required
					/>
				</div>
				<div>
					<label for="phone-{t.id}">Mobile or landline</label><input
						id="phone-{t.id}"
						name="phone"
						type="tel"
						value={t.phone ?? ''}
						placeholder="+1 555 555 0142"
					/>
				</div>
				<div>
					<label for="email-{t.id}">Email <span class="faint">(optional)</span></label><input
						id="email-{t.id}"
						name="email"
						type="email"
						value={t.email ?? ''}
					/>
				</div>
			</div>

			<span class="label gap">Each week, send the next question by</span>
			<div class="choices" style="--min: 140px">
				<label class="choice"
					><input
						type="radio"
						name="delivery"
						value="call"
						checked={t.delivery === 'call'}
						disabled={!caps.voice}
					/><strong>Phone call</strong><span>Kinstory rings and reads the question.</span></label
				>
				<label class="choice"
					><input
						type="radio"
						name="delivery"
						value="sms"
						checked={t.delivery === 'sms'}
						disabled={!caps.voice}
					/><strong>Text message</strong><span>With the answer link.</span></label
				>
				<label class="choice"
					><input
						type="radio"
						name="delivery"
						value="email"
						checked={t.delivery === 'email'}
						disabled={!caps.mail}
					/><strong>Email</strong><span>With the answer link.</span></label
				>
				<label class="choice"
					><input
						type="radio"
						name="delivery"
						value="none"
						checked={t.delivery === 'none'}
					/><strong>I’ll share it myself</strong><span>No automatic sending.</span></label
				>
			</div>

			<div class="fields gap">
				<div>
					<label for="day-{t.id}">Day</label>
					<select id="day-{t.id}" name="callDay">
						<option value="">No schedule</option>
						{#each WEEKDAYS as d, i (d)}<option value={i} selected={t.callDay === i}>{d}s</option
							>{/each}
					</select>
				</div>
				<div>
					<label for="time-{t.id}">Time</label><input
						id="time-{t.id}"
						name="callTime"
						type="time"
						value={t.callTime ?? '10:30'}
					/>
				</div>
				<div>
					<label for="tz-{t.id}">Their time zone</label>
					<select id="tz-{t.id}" name="timezone">
						{#each data.timeZones as z (z)}<option value={z} selected={t.timezone === z}
								>{z.replaceAll('_', ' ')}</option
							>{/each}
					</select>
				</div>
			</div>

			<div class="access">
				<div>
					<span class="label">Private answer link</span>
					<div class="row" style="--gap:.4rem">
						<code>{caps.publicUrl}/a/{t.answerToken}</code>
						<CopyButton text="{caps.publicUrl}/a/{t.answerToken}" />
					</div>
				</div>
				<div>
					<span class="label">Phone code</span>
					<code class="pin">{t.pin.slice(0, 3)} {t.pin.slice(3)}</code>
				</div>
			</div>
			<p class="hint">
				If they call {caps.phoneNumber ?? 'the Kinstory number'} from {t.phone
					? 'their saved number'
					: 'a number Kinstory doesn’t know'}, they’re {t.phone
					? 'recognised automatically'
					: 'asked for this code'}.
			</p>

			{#if form?.tellerError && form.id === t.id}<p class="notice error">{form.tellerError}</p>{/if}
			{#if form?.tellerSaved === t.id}<p class="notice ok">Saved.</p>{/if}
			{#if form?.rotated === t.id}<p class="notice ok">
					A new link was made. The old one no longer works.
				</p>{/if}

			<div class="spread gap">
				<span class="row" style="--gap:.4rem">
					<a class="btn small" href="{base}/storytellers/{t.id}/card"
						><Icon name="printer" size={14} /> Print card</a
					>
					<button
						class="btn small ghost"
						formaction="?/rotate"
						onclick={(e) => {
							if (!confirm('Make a new answer link? The current one will stop working.'))
								e.preventDefault();
						}}><Icon name="refresh" size={14} /> New link</button
					>
					{#if owner && data.storytellers.length > 1}
						<button
							class="btn small ghost danger"
							formaction="?/removeTeller"
							onclick={(e) => {
								if (!confirm(`Remove ${t.name}? Their stories stay in the book.`))
									e.preventDefault();
							}}>Remove</button
						>
					{/if}
				</span>
				<button class="btn primary">Save</button>
			</div>
		</form>
	{/each}

	<form class="row addteller" method="POST" action="?/addTeller" use:enhance>
		<input
			name="name"
			placeholder="Add another storyteller, e.g. Grandpa Tomás"
			aria-label="New storyteller's name"
			required
		/>
		<button class="btn"><Icon name="plus" size={15} /> Add</button>
	</form>
	{#if form?.addError}<p class="notice error">{form.addError}</p>{/if}

	<h2>Family</h2>
	<section class="card">
		<ul class="list">
			{#each data.members as m (m.userId)}
				<li class="spread">
					<span
						><b>{m.name}</b> <span class="muted small">{m.email}</span>
						{#if m.role === 'owner'}<span class="chip">Owner</span>{/if}</span
					>
					{#if (owner && m.userId !== data.me.id) || (m.userId === data.me.id && m.role !== 'owner')}
						<form method="POST" action="?/removeMember" use:enhance>
							<input type="hidden" name="user" value={m.userId} />
							<button class="btn small ghost">{m.userId === data.me.id ? 'Leave' : 'Remove'}</button
							>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
		{#if form && 'memberError' in form && form.memberError}<p class="notice error">
				{form.memberError}
			</p>{/if}
		<hr class="divider" />
		<form method="POST" action="?/invite" use:enhance class="spread">
			<span class="small muted"
				>Invite cousins, aunts and uncles to add questions and help edit. Links work once, for 14
				days.</span
			>
			<button class="btn"><Icon name="users" size={15} /> Make an invite link</button>
		</form>
		{#if form?.invite}
			<div class="row invite" style="--gap:.4rem">
				<code>{form.invite}</code><CopyButton text={form.invite} />
			</div>
		{/if}
	</section>

	<h2>Your data</h2>
	<section class="card spread">
		<div>
			<b>Export everything</b>
			<p class="small muted" style="margin:0">
				Audio, transcripts, stories as Markdown, photos and the latest PDFs, in one zip.
			</p>
		</div>
		<a class="btn" href="{base}/export" download><Icon name="download" size={15} /> Download zip</a>
	</section>

	{#if owner}
		<h2>Delete this book</h2>
		<form class="card danger-zone" method="POST" action="?/delete" use:enhance>
			<p class="small">
				This deletes every story, recording and photo in <b>{data.project.title}</b> from this server.
				Export first if you want a copy. Type the title to confirm.
			</p>
			<div class="row">
				<input name="confirm" placeholder={data.project.title} aria-label="Book title" /><button
					class="btn danger">Delete forever</button
				>
			</div>
			{#if form?.deleteError}<p class="notice error">{form.deleteError}</p>{/if}
		</form>
	{/if}
</div>

<style>
	.wide {
		width: min(100% - 2.5rem, 860px);
	}
	h2 {
		margin: 2.2rem 0 0.8rem;
		font-size: 1.6rem;
	}
	.notice code {
		font-size: 0.85em;
	}
	.teller {
		margin-bottom: 1rem;
		scroll-margin-top: 90px;
	}
	.gap {
		margin-top: 1.1rem;
	}
	.label.gap {
		display: block;
	}
	.access {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		margin-top: 1.2rem;
		padding: 0.9rem 1rem;
		background: var(--paper);
		border-radius: var(--radius-sm);
	}
	code {
		font-size: 0.8rem;
		padding: 0.3rem 0.5rem;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 6px;
		overflow-wrap: anywhere;
	}
	.access code:not(.pin) {
		flex: 1;
		min-width: 0;
	}
	.pin {
		font-size: 1.05rem;
		letter-spacing: 0.12em;
		display: inline-block;
	}
	.notice {
		margin-top: 0.9rem;
	}
	.addteller input {
		flex: 1;
	}
	.list li form {
		margin: 0;
	}
	.invite {
		margin-top: 0.8rem;
	}
	.invite code {
		flex: 1;
	}
	.danger-zone {
		border-color: #ecc9c4;
	}
	.danger-zone input {
		flex: 1;
	}
</style>
