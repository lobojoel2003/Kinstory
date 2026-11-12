// Voice gateway webhooks (TwiML). Point your number's "a call comes in"
// webhook at POST {PUBLIC_URL}/api/voice/incoming; the other steps are
// referenced from the TwiML Kinstory returns.
//
//   incoming   a storyteller rings the Kinstory number
//   answer     a storyteller picks up a call Kinstory placed (?s=storyteller)
//   pin        digits entered by a caller we did not recognise
//   done       the recording has ended: say thank you
//   recording  the recording file is ready to fetch (status callback)

import { error } from '@sveltejs/kit';
import { config } from '#lib/server/config.ts';
import { db } from '#lib/server/db.ts';
import { log } from '#lib/server/log.ts';
import { limited } from '#lib/server/ratelimit.ts';
import {
	storytellerById,
	storytellerByPhone,
	storytellerByPin
} from '#lib/server/repo/storytellers.ts';
import { pokeWorker } from '#lib/server/runtime.ts';
import {
	askForPin,
	questionAndRecord,
	recordingReady,
	thanks,
	wrongPin
} from '#lib/server/services/phone.ts';
import { readWebhook, twiml } from '#lib/server/voice/twilio.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, url }) => {
	const c = config();
	if (!c.voiceEnabled && !c.VOICE_SKIP_SIGNATURE_CHECK)
		error(404, 'The phone line is not configured');
	const { ok, params: p } = await readWebhook(request, url);
	if (!ok) {
		log.warn('voice webhook with a bad signature', { step: params.step });
		error(403, 'Invalid signature');
	}
	const sql = db();
	const tellerParam = url.searchParams.get('s');
	const promptParam = url.searchParams.get('p');

	switch (params.step) {
		case 'incoming': {
			const teller = p.From ? await storytellerByPhone(sql, p.From) : null;
			return teller ? questionAndRecord(sql, teller, url) : askForPin(url);
		}
		case 'answer': {
			const teller = tellerParam ? await storytellerById(sql, tellerParam) : null;
			if (!teller) return twiml('<Hangup/>');
			return questionAndRecord(sql, teller, url, p.AnsweredBy);
		}
		case 'pin': {
			if (limited(`pin:${p.From ?? 'unknown'}`, 5, 15 * 60_000)) return wrongPin();
			const teller = await storytellerByPin(sql, (p.Digits ?? '').trim());
			return teller ? questionAndRecord(sql, teller, url) : wrongPin();
		}
		case 'done': {
			const teller = tellerParam ? await storytellerById(sql, tellerParam) : null;
			return teller ? thanks(sql, teller) : twiml('<Hangup/>');
		}
		case 'recording': {
			if (tellerParam) {
				await recordingReady(sql, p, tellerParam, promptParam);
				pokeWorker();
			}
			return new Response(null, { status: 204 });
		}
		default:
			error(404, 'Unknown step');
	}
};
