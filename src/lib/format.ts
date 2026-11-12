// Small display helpers shared by pages.

export const WEEKDAYS = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
];

export function duration(seconds: number | null | undefined): string {
	if (!seconds) return '';
	const s = Math.round(seconds);
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m} min${s % 60 >= 30 ? '' : ''}`;
	return `${Math.floor(m / 60)} h ${m % 60} min`;
}

export function clock(seconds: number | null | undefined): string {
	const s = Math.max(0, Math.round(seconds ?? 0));
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function ago(date: Date | string | null | undefined, now = new Date()): string {
	if (!date) return '';
	const d = typeof date === 'string' ? new Date(date) : date;
	const diff = (now.getTime() - d.getTime()) / 1000;
	if (diff < 60) return 'just now';
	if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
	if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} d ago`;
	return d.toLocaleDateString('en', {
		day: 'numeric',
		month: 'short',
		year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric'
	});
}

export function longDate(date: Date | string | null | undefined, tz?: string): string {
	if (!date) return '';
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('en', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		timeZone: tz
	});
}

export function plural(n: number, one: string, many = `${one}s`): string {
	return `${n} ${n === 1 ? one : many}`;
}
