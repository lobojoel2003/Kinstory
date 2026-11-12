// Weekly prompt schedules, computed in the storyteller's own time zone so
// "Sundays at 10:30" stays 10:30 for them across daylight-saving changes.

const DAY_MS = 86_400_000;

/** Milliseconds to add to UTC to get local wall-clock time in `tz` at `date`. */
export function tzOffset(date: Date, tz: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).formatToParts(date);
	const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
	const local = Date.UTC(
		get('year'),
		get('month') - 1,
		get('day'),
		get('hour'),
		get('minute'),
		get('second')
	);
	return local - Math.floor(date.getTime() / 1000) * 1000;
}

/** The UTC instant at which the wall clock in `tz` reads the given local time. */
export function zonedTime(
	y: number,
	m: number,
	d: number,
	h: number,
	min: number,
	tz: string
): Date {
	const guess = Date.UTC(y, m, d, h, min);
	let t = guess - tzOffset(new Date(guess), tz);
	t = guess - tzOffset(new Date(t), tz); // second pass settles DST transitions
	return new Date(t);
}

export function isValidTimeZone(tz: string): boolean {
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}

/** Most recent scheduled moment at or before `now` for weekday `day` (0 = Sunday) at `time` ("HH:MM"). */
export function lastOccurrence(day: number, time: string, tz: string, now: Date): Date {
	const [h, min] = time.split(':').map(Number);
	const local = new Date(now.getTime() + tzOffset(now, tz));
	const back = (local.getUTCDay() - day + 7) % 7;
	const base = new Date(local.getTime() - back * DAY_MS);
	let occ = zonedTime(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), h, min, tz);
	if (occ.getTime() > now.getTime()) {
		const prev = new Date(base.getTime() - 7 * DAY_MS);
		occ = zonedTime(prev.getUTCFullYear(), prev.getUTCMonth(), prev.getUTCDate(), h, min, tz);
	}
	return occ;
}

export function nextOccurrence(day: number, time: string, tz: string, now: Date): Date {
	return lastOccurrence(day, time, tz, new Date(now.getTime() + 7 * DAY_MS));
}

/** How late a missed delivery may still go out (e.g. after a restart). */
export const GRACE_MS = 6 * 3600 * 1000;

export function isDue(
	s: {
		callDay: number | null;
		callTime: string | null;
		timezone: string;
		lastPromptedAt: Date | null;
	},
	now: Date
): Date | null {
	if (s.callDay === null || !s.callTime) return null;
	const occ = lastOccurrence(s.callDay, s.callTime, s.timezone, now);
	if (now.getTime() - occ.getTime() > GRACE_MS) return null;
	if (s.lastPromptedAt && s.lastPromptedAt.getTime() >= occ.getTime()) return null;
	return occ;
}
