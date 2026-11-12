<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		text,
		label = 'Copy',
		small = true
	}: { text: string; label?: string; small?: boolean } = $props();
	let copied = $state(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			const t = document.createElement('textarea');
			t.value = text;
			document.body.append(t);
			t.select();
			document.execCommand('copy');
			t.remove();
		}
		copied = true;
		setTimeout(() => (copied = false), 1800);
	}
</script>

<button type="button" class="btn" class:small onclick={copy} aria-live="polite">
	<Icon name={copied ? 'check' : 'copy'} size={15} />
	{copied ? 'Copied' : label}
</button>
