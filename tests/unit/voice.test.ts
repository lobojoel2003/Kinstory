import { describe, expect, it } from 'vitest';
import { signature, validSignature, xml } from '#lib/server/voice/twilio.ts';
import { spoken } from '#lib/server/services/phone.ts';
import { normalizePhone } from '#lib/server/repo/storytellers.ts';

describe('gateway signatures', () => {
	// The worked example from Twilio's webhook security documentation.
	const url = 'https://mycompany.com/myapp.php?foo=1&bar=2';
	const params = {
		CallSid: 'CA1234567890ABCDE',
		Caller: '+12349013030',
		Digits: '1234',
		From: '+12349013030',
		To: '+18005551212'
	};

	it('matches the documented signature', () => {
		expect(signature('12345', url, params)).toBe('0/KCTR6DLpKmkAf8muzZqo1nDgQ=');
	});

	it('accepts a valid signature and rejects a tampered request', () => {
		expect(validSignature('12345', '0/KCTR6DLpKmkAf8muzZqo1nDgQ=', url, params)).toBe(true);
		expect(
			validSignature('12345', '0/KCTR6DLpKmkAf8muzZqo1nDgQ=', url, { ...params, Digits: '9999' })
		).toBe(false);
		expect(validSignature('12345', null, url, params)).toBe(false);
		expect(validSignature('wrong', '0/KCTR6DLpKmkAf8muzZqo1nDgQ=', url, params)).toBe(false);
	});
});

describe('TwiML helpers', () => {
	it('escapes text placed in XML', () => {
		expect(xml(`Tom & Rosa's "kitchen" <1950>`)).toBe(
			'Tom &amp; Rosa&apos;s &quot;kitchen&quot; &lt;1950&gt;'
		);
	});

	it('reads phone numbers digit by digit', () => {
		expect(spoken('+1 (555) 010-0199')).toBe('1 5 5 5 0 1 0 0 1 9 9');
	});
});

describe('normalizePhone', () => {
	it('normalises common formats to E.164', () => {
		expect(normalizePhone('(555) 555-0142')).toBe('+15555550142');
		expect(normalizePhone('+44 20 7946 0958')).toBe('+442079460958');
		expect(normalizePhone('0044 20 7946 0958')).toBe('+442079460958');
		expect(normalizePhone('1-555-555-0142')).toBe('+15555550142');
	});

	it('rejects things that are not phone numbers', () => {
		expect(normalizePhone('')).toBeNull();
		expect(normalizePhone('call me')).toBeNull();
		expect(normalizePhone('+12')).toBeNull();
	});
});
