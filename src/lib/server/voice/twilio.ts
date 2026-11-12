// The phone line. Kinstory speaks TwiML, the XML dialect Twilio invented and
// other voice gateways (SignalWire, Telnyx TeXML) accept, so any of them can
// carry the calls. All webhooks are verified with the gateway's signature.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.ts';

/** Escapes text for inclusion in XML. */
export function xml(s: string): string {
	return s.replace(
		/[<>&'"]/g,
		(c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!
	);
}

/**
 * Twilio's request signature: HMAC-SHA1 over the full URL followed by every
 * POST parameter, sorted by name, as name+value. Base64 encoded.
 */
export function signature(authToken: string, url: string, params: Record<string, string>): string {
	const data = Object.keys(params)
		.sort()
		.reduce((acc, k) => acc + k + params[k], url);
	return createHmac('sha1', authToken).update(Buffer.from(data, 'utf8')).digest('base64');
}

export function validSignature(
	authToken: string,
	header: string | null,
	url: string,
	params: Record<string, string>
): boolean {
	if (!header) return false;
	const expected = Buffer.from(signature(authToken, url, params));
	const given = Buffer.from(header);
	return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Reads a webhook, checking its signature against the public URL it was sent to. */
export async function readWebhook(
	request: Request,
	url: URL
): Promise<{ ok: boolean; params: Record<string, string> }> {
	const c = config();
	const form = await request.formData();
	const params: Record<string, string> = {};
	for (const [k, v] of form) if (typeof v === 'string') params[k] = v;
	if (c.VOICE_SKIP_SIGNATURE_CHECK) return { ok: true, params };
	if (!c.TWILIO_AUTH_TOKEN) return { ok: false, params };
	const external = c.publicUrl ? `${c.publicUrl}${url.pathname}${url.search}` : url.href;
	return {
		ok: validSignature(
			c.TWILIO_AUTH_TOKEN,
			request.headers.get('x-twilio-signature') ?? request.headers.get('x-signalwire-signature'),
			external,
			params
		),
		params
	};
}

export function twiml(body: string): Response {
	return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
		headers: { 'content-type': 'text/xml; charset=utf-8', 'cache-control': 'no-store' }
	});
}

export interface Voice {
	voice: string;
	language: string;
}

export const say = (text: string, v: Voice) =>
	`<Say voice="${xml(v.voice)}" language="${xml(v.language)}">${xml(text)}</Say>`;
export const pause = (s = 1) => `<Pause length="${s}"/>`;

export function recordVerb(action: string, statusCallback: string): string {
	const c = config();
	return (
		`<Record action="${xml(action)}" method="POST" maxLength="${c.VOICE_MAX_RECORDING_SECONDS}" timeout="${c.VOICE_SILENCE_TIMEOUT}" ` +
		`finishOnKey="#" playBeep="true" trim="trim-silence" recordingStatusCallback="${xml(statusCallback)}" ` +
		`recordingStatusCallbackMethod="POST" recordingStatusCallbackEvent="completed"/>`
	);
}

// REST API -----------------------------------------------------------------------

function api(path: string): string {
	const c = config();
	return `${c.TWILIO_API_BASE.replace(/\/+$/, '')}/2010-04-01/Accounts/${c.TWILIO_ACCOUNT_SID}${path}`;
}

function authHeader(): string {
	const c = config();
	return `Basic ${Buffer.from(`${c.TWILIO_ACCOUNT_SID}:${c.TWILIO_AUTH_TOKEN}`).toString('base64')}`;
}

async function post(path: string, body: Record<string, string>): Promise<Record<string, unknown>> {
	const res = await fetch(api(path), {
		method: 'POST',
		headers: { authorization: authHeader(), 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams(body),
		signal: AbortSignal.timeout(30_000)
	});
	const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
	if (!res.ok)
		throw new Error(`Voice gateway error ${res.status}: ${String(json.message ?? res.statusText)}`);
	return json;
}

/** Rings the storyteller; when they pick up the gateway fetches `answerUrl` for instructions. */
export async function placeCall(to: string, answerUrl: string): Promise<string> {
	const c = config();
	const r = await post('/Calls.json', {
		To: to,
		From: c.TWILIO_PHONE_NUMBER!,
		Url: answerUrl,
		Method: 'POST',
		MachineDetection: 'Enable'
	});
	return String(r.sid ?? '');
}

export async function sendSms(to: string, body: string): Promise<void> {
	await post('/Messages.json', { To: to, From: config().TWILIO_PHONE_NUMBER!, Body: body });
}

/** Downloads a finished call recording as MP3. Only gateway URLs are fetched, with credentials. */
export async function downloadRecording(
	recordingUrl: string
): Promise<{ data: Buffer; mime: string }> {
	const c = config();
	const base = new URL(c.TWILIO_API_BASE);
	const url = new URL(recordingUrl.endsWith('.mp3') ? recordingUrl : `${recordingUrl}.mp3`);
	const trusted =
		url.protocol === 'https:' &&
		(url.hostname === base.hostname || url.hostname.endsWith('.twilio.com'));
	if (!trusted) throw new Error(`Refusing to download a recording from ${url.hostname}`);
	const res = await fetch(url, {
		headers: { authorization: authHeader() },
		signal: AbortSignal.timeout(5 * 60_000)
	});
	if (!res.ok) throw new Error(`Recording download failed: HTTP ${res.status}`);
	return {
		data: Buffer.from(await res.arrayBuffer()),
		mime: res.headers.get('content-type') ?? 'audio/mpeg'
	};
}

/** Deletes the gateway's copy once Kinstory has its own: the family's server is the only home. */
export async function deleteRemoteRecording(recordingSid: string): Promise<void> {
	if (!/^RE[0-9a-f]{32}$/i.test(recordingSid)) return;
	await fetch(api(`/Recordings/${recordingSid}.json`), {
		method: 'DELETE',
		headers: { authorization: authHeader() },
		signal: AbortSignal.timeout(30_000)
	});
}
