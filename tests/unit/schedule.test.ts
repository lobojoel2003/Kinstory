import { describe, expect, it } from 'vitest';
import {
	GRACE_MS,
	isDue,
	isValidTimeZone,
	lastOccurrence,
	nextOccurrence,
	zonedTime
} from '#lib/server/schedule.ts';

const NY = 'America/New_York';

describe('zonedTime', () => {
	it('converts local wall-clock time to UTC, both sides of a DST change', () => {
		// 2026-10-25 is daylight time in New York (UTC-4); 2026-11-08 is standard time (UTC-5).
		expect(zonedTime(2026, 9, 25, 10, 30, NY).toISOString()).toBe('2026-10-25T14:30:00.000Z');
		expect(zonedTime(2026, 10, 8, 10, 30, NY).toISOString()).toBe('2026-11-08T15:30:00.000Z');
	});
});

describe('weekly occurrences', () => {
	it('finds the most recent Sunday 10:30 in the storyteller’s zone', () => {
		const now = new Date('2026-11-12T17:00:00Z'); // Thursday
		expect(lastOccurrence(0, '10:30', NY, now).toISOString()).toBe('2026-11-08T15:30:00.000Z');
		expect(nextOccurrence(0, '10:30', NY, now).toISOString()).toBe('2026-11-15T15:30:00.000Z');
	});

	it('uses today when today’s time has passed, last week when it has not', () => {
		const sundayMorning = new Date('2026-11-15T14:00:00Z'); // 09:00 in New York
		expect(lastOccurrence(0, '10:30', NY, sundayMorning).toISOString()).toBe(
			'2026-11-08T15:30:00.000Z'
		);
		const sundayLater = new Date('2026-11-15T16:00:00Z'); // 11:00 in New York
		expect(lastOccurrence(0, '10:30', NY, sundayLater).toISOString()).toBe(
			'2026-11-15T15:30:00.000Z'
		);
	});

	it('keeps the local time steady across the end of daylight saving', () => {
		// DST ends on 2026-11-01 in the US.
		const before = lastOccurrence(0, '10:30', NY, new Date('2026-10-26T00:00:00Z'));
		const after = lastOccurrence(0, '10:30', NY, new Date('2026-11-02T00:00:00Z'));
		expect(before.toISOString()).toBe('2026-10-25T14:30:00.000Z');
		expect(after.toISOString()).toBe('2026-11-01T15:30:00.000Z');
	});

	it('works for zones ahead of UTC', () => {
		const now = new Date('2026-11-12T00:00:00Z'); // Thursday 11:00 in Sydney
		expect(lastOccurrence(4, '09:00', 'Australia/Sydney', now).toISOString()).toBe(
			'2026-11-11T22:00:00.000Z'
		);
	});
});

describe('isDue', () => {
	const base = { callDay: 0, callTime: '10:30', timezone: NY };
	const occ = new Date('2026-11-15T15:30:00Z');

	it('is due just after the scheduled moment', () => {
		expect(
			isDue({ ...base, lastPromptedAt: null }, new Date(occ.getTime() + 60_000))?.toISOString()
		).toBe(occ.toISOString());
	});

	it('is not due twice for the same week', () => {
		expect(
			isDue(
				{ ...base, lastPromptedAt: new Date(occ.getTime() + 30_000) },
				new Date(occ.getTime() + 120_000)
			)
		).toBeNull();
	});

	it('gives up on deliveries missed by more than the grace period', () => {
		expect(
			isDue({ ...base, lastPromptedAt: null }, new Date(occ.getTime() + GRACE_MS + 60_000))
		).toBeNull();
	});

	it('is never due without a schedule', () => {
		expect(isDue({ ...base, callDay: null, lastPromptedAt: null }, occ)).toBeNull();
	});
});

describe('isValidTimeZone', () => {
	it('accepts IANA names and rejects nonsense', () => {
		expect(isValidTimeZone('Europe/Lisbon')).toBe(true);
		expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false);
	});
});
