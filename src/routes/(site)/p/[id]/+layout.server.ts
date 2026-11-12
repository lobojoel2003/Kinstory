import { config } from '#lib/server/config.ts';
import { db } from '#lib/server/db.ts';
import { requireProject } from '#lib/server/guard.ts';
import { listStorytellers } from '#lib/server/repo/storytellers.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const { project } = await requireProject(event);
	const c = config();
	return {
		project,
		storytellers: await listStorytellers(db(), project.id),
		capabilities: {
			voice: c.voiceEnabled,
			mail: c.mailEnabled,
			publicUrl: c.publicUrl ?? event.url.origin,
			phoneNumber: c.voiceEnabled ? (c.TWILIO_PHONE_NUMBER ?? null) : null,
			transcription: c.TRANSCRIBE_PROVIDER
		}
	};
};
