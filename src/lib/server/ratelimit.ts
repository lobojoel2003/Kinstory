// In-memory sliding-window limiter for sign-in and other abuse-prone
// endpoints. Per process; fine for the single-server installs Kinstory targets.

const hits = new Map<string, number[]>();

export function limited(key: string, max: number, windowMs: number, now = Date.now()): boolean {
	const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
	if (recent.length >= max) {
		hits.set(key, recent);
		return true;
	}
	recent.push(now);
	hits.set(key, recent);
	if (hits.size > 50_000) {
		for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
	}
	return false;
}

export function resetLimits(): void {
	hits.clear();
}
