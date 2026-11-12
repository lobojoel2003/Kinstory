<script lang="ts">
	import type { ElderStrings } from '#lib/elder-strings.ts';
	import { clock } from '#lib/format.ts';
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';

	let {
		t,
		uploadUrl,
		promptId,
		onsent
	}: { t: ElderStrings; uploadUrl: string; promptId: string | null; onsent: () => void } = $props();

	type Phase = 'idle' | 'recording' | 'recorded' | 'sending' | 'error';
	let phase: Phase = $state('idle');
	let seconds = $state(0);
	let level = $state(0);
	let progress = $state(0);
	let blob: Blob | null = $state(null);
	let blobUrl: string | null = $state(null);
	let micBlocked = $state(false);

	let recorder: MediaRecorder | null = null;
	let stream: MediaStream | null = null;
	let chunks: Blob[] = [];
	let timer: ReturnType<typeof setInterval> | null = null;
	let raf = 0;
	let audioCtx: AudioContext | null = null;
	let wakeLock: { release(): Promise<void> } | null = null;

	function pickMime(): string {
		const options = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'];
		return (
			options.find(
				(m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)
			) ?? ''
		);
	}

	async function start() {
		micBlocked = false;
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
			});
		} catch {
			micBlocked = true;
			return;
		}
		const mimeType = pickMime();
		recorder = new MediaRecorder(
			stream,
			mimeType ? { mimeType, audioBitsPerSecond: 64000 } : undefined
		);
		chunks = [];
		recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
		recorder.onstop = () => {
			blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
			blobUrl = URL.createObjectURL(blob);
			phase = 'recorded';
		};
		recorder.start(1000);
		phase = 'recording';
		seconds = 0;
		timer = setInterval(() => seconds++, 1000);
		meter(stream);
		try {
			wakeLock =
				(await (
					navigator as Navigator & {
						wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> };
					}
				).wakeLock?.request('screen')) ?? null;
		} catch {
			wakeLock = null;
		}
	}

	function meter(s: MediaStream) {
		try {
			audioCtx = new AudioContext();
			const analyser = audioCtx.createAnalyser();
			analyser.fftSize = 512;
			audioCtx.createMediaStreamSource(s).connect(analyser);
			const data = new Uint8Array(analyser.fftSize);
			const loop = () => {
				analyser.getByteTimeDomainData(data);
				let peak = 0;
				for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
				level = level * 0.7 + (peak / 128) * 0.3;
				raf = requestAnimationFrame(loop);
			};
			loop();
		} catch {
			// The level ring is decoration; recording works without it.
		}
	}

	function cleanup() {
		if (timer) clearInterval(timer);
		cancelAnimationFrame(raf);
		stream?.getTracks().forEach((tr) => tr.stop());
		void audioCtx?.close().catch(() => {});
		void wakeLock?.release().catch(() => {});
		timer = null;
		audioCtx = null;
		wakeLock = null;
		level = 0;
	}

	function stop() {
		recorder?.stop();
		cleanup();
	}

	function again() {
		if (blobUrl) URL.revokeObjectURL(blobUrl);
		blob = null;
		blobUrl = null;
		phase = 'idle';
		seconds = 0;
	}

	function send(file: Blob, name: string) {
		phase = 'sending';
		progress = 0;
		const body = new FormData();
		body.set('audio', file, name);
		if (promptId) body.set('prompt', promptId);
		const xhr = new XMLHttpRequest();
		xhr.open('POST', uploadUrl);
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) progress = e.loaded / e.total;
		};
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				again();
				onsent();
			} else phase = 'error';
		};
		xhr.onerror = () => (phase = 'error');
		xhr.send(body);
	}

	function sendRecording() {
		if (!blob) return;
		const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
		send(blob, `answer.${ext}`);
	}

	function pickFile(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) send(file, file.name);
	}

	function beforeUnload(e: BeforeUnloadEvent) {
		if (phase === 'recording' || phase === 'recorded' || phase === 'sending') e.preventDefault();
	}

	// Browser-only teardown (onDestroy would also run during server rendering).
	onMount(() => cleanup);
</script>

<svelte:window onbeforeunload={beforeUnload} />

<div class="recorder" data-phase={phase}>
	{#if phase === 'idle' || phase === 'error'}
		<button class="big" onclick={start} aria-label={t.record}>
			<Icon name="mic" size={64} />
		</button>
		<p class="cue">{t.record}</p>
		{#if phase === 'error'}<p class="problem" role="alert">{t.failed}</p>{/if}
		{#if micBlocked}<p class="problem" role="alert">{t.micBlocked}</p>{/if}
		<label class="file">
			<input type="file" accept="audio/*,.m4a,.opus,.ogg,.mp3,.wav,.amr" onchange={pickFile} />
			<Icon name="upload" size={16} />
			{t.upload}
		</label>
	{:else if phase === 'recording'}
		<button
			class="big live"
			onclick={stop}
			aria-label={t.stop}
			style="--level: {Math.min(1, level * 3)}"
		>
			<span class="ring"></span>
			<Icon name="stop" size={48} />
		</button>
		<p class="cue">
			<span class="rec"></span>{t.recording} · <span class="time">{clock(seconds)}</span>
		</p>
		<p class="sub">{t.stop}</p>
	{:else if phase === 'recorded' && blobUrl}
		<div class="review">
			<audio src={blobUrl} controls></audio>
			<button class="btn primary huge" onclick={sendRecording}
				><Icon name="heart" size={22} /> {t.send}</button
			>
			<button class="btn large" onclick={again}><Icon name="refresh" size={18} /> {t.again}</button>
		</div>
	{:else if phase === 'sending'}
		<div class="sending" role="status">
			<div class="bar"><span style="width: {Math.round(progress * 100)}%"></span></div>
			<p class="cue">{t.sending}</p>
		</div>
	{/if}
</div>

<style>
	.recorder {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.9rem;
	}
	.big {
		position: relative;
		width: 196px;
		height: 196px;
		border-radius: 50%;
		border: 0;
		background: var(--accent);
		color: #fff8f2;
		display: grid;
		place-items: center;
		cursor: pointer;
		box-shadow:
			0 18px 40px -16px rgb(122 46 34 / 0.75),
			inset 0 -6px 0 rgb(0 0 0 / 0.12);
		transition: transform 0.15s;
	}
	.big:hover {
		transform: scale(1.02);
	}
	.big:active {
		transform: scale(0.98);
	}
	.big.live {
		background: #2b2420;
	}
	.ring {
		position: absolute;
		inset: -14px;
		border-radius: 50%;
		border: 6px solid var(--accent);
		opacity: calc(0.25 + var(--level) * 0.75);
		transform: scale(calc(1 + var(--level) * 0.12));
		transition:
			transform 0.08s,
			opacity 0.08s;
	}
	.cue {
		font: 500 1.45rem/1.3 var(--font-ui);
		color: var(--ink);
		margin: 0.4rem 0 0;
	}
	.sub {
		font-size: 1.1rem;
		color: var(--muted);
		margin: 0;
	}
	.rec {
		display: inline-block;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #c2392b;
		margin-right: 0.5rem;
		animation: pulse 1.1s infinite;
	}
	.time {
		font-variant-numeric: tabular-nums;
	}
	.problem {
		font-size: 1.05rem;
		color: var(--danger);
		max-width: 30ch;
	}
	.file {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		margin-top: 1.4rem;
		color: var(--muted);
		font-size: 1rem;
		font-weight: 450;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	.file input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
	}
	.review {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		width: min(100%, 420px);
	}
	.review audio {
		width: 100%;
	}
	.huge {
		min-height: 68px;
		font-size: 1.3rem;
		border-radius: 18px;
	}
	.review .large {
		font-size: 1.1rem;
		border-radius: 14px;
	}
	.sending {
		width: min(100%, 360px);
		padding: 2rem 0;
	}
	.bar {
		height: 12px;
		border-radius: 999px;
		background: var(--paper-2);
		overflow: hidden;
		border: 1px solid var(--line);
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--accent);
		transition: width 0.2s;
	}
</style>
