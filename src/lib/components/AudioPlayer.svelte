<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		src,
		label = 'Recording',
		duration = null
	}: { src: string; label?: string; duration?: number | null } = $props();

	let audio: HTMLAudioElement | undefined = $state();
	let playing = $state(false);
	let current = $state(0);
	let total = $state(0);
	const length = $derived(total || duration || 0);

	function fmt(s: number) {
		if (!Number.isFinite(s)) return '0:00';
		const m = Math.floor(s / 60);
		return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
	}

	function toggle() {
		if (!audio) return;
		if (audio.paused) void audio.play();
		else audio.pause();
	}

	function seek(e: Event) {
		if (audio) audio.currentTime = Number((e.target as HTMLInputElement).value);
	}
</script>

<div class="player">
	<button
		type="button"
		class="play"
		onclick={toggle}
		aria-label={playing ? `Pause ${label}` : `Play ${label}`}
	>
		<Icon name={playing ? 'pause' : 'play'} size={16} />
	</button>
	<div class="track">
		<input
			type="range"
			min="0"
			max={length || 1}
			step="0.1"
			value={current}
			oninput={seek}
			aria-label="Position in {label}"
			style="--p: {length ? (current / length) * 100 : 0}%"
		/>
		<div class="times"><span>{fmt(current)}</span><span>{fmt(length)}</span></div>
	</div>
	<audio
		bind:this={audio}
		{src}
		preload="metadata"
		onplay={() => (playing = true)}
		onpause={() => (playing = false)}
		onended={() => (playing = false)}
		ontimeupdate={() => (current = audio?.currentTime ?? 0)}
		onloadedmetadata={() => (total = Number.isFinite(audio?.duration) ? (audio?.duration ?? 0) : 0)}
	></audio>
</div>

<style>
	.player {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.55rem 0.8rem 0.55rem 0.55rem;
		border-radius: 999px;
		background: var(--paper-2);
		border: 1px solid var(--line);
	}
	.play {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 0;
		background: var(--accent);
		color: #fff8f2;
		display: grid;
		place-items: center;
		cursor: pointer;
		flex: none;
	}
	.play:hover {
		background: var(--accent-2);
	}
	.track {
		flex: 1;
		min-width: 0;
	}
	input[type='range'] {
		width: 100%;
		height: 4px;
		appearance: none;
		background: linear-gradient(to right, var(--accent) var(--p), var(--line-strong) var(--p));
		border-radius: 4px;
		margin: 0.35rem 0 0.15rem;
	}
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--accent);
	}
	input[type='range']::-moz-range-thumb {
		width: 12px;
		height: 12px;
		border: 0;
		border-radius: 50%;
		background: var(--accent);
	}
	.times {
		display: flex;
		justify-content: space-between;
		font-size: 0.72rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
</style>
