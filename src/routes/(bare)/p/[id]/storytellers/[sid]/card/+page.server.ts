import { error } from '@sveltejs/kit';
import QRCode from 'qrcode';
import { joinNames, shortName } from '#lib/names.ts';
import { config } from '#lib/server/config.ts';
import { db } from '#lib/server/db.ts';
import { requireProject } from '#lib/server/guard.ts';
import { getStoryteller } from '#lib/server/repo/storytellers.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { project } = await requireProject(event);
	const sql = db();
	const teller = await getStoryteller(sql, project.id, event.params.sid);
	if (!teller) error(404, 'Storyteller not found');
	const c = config();
	const link = `${c.publicUrl ?? event.url.origin}/a/${teller.answerToken}`;
	const askers = await sql<{ askedBy: string }[]>`
		select distinct asked_by from prompts where project_id = ${project.id} and asked_by is not null order by asked_by limit 6`;
	return {
		project: { id: project.id, title: project.title, language: project.language },
		name: shortName(teller.name),
		pin: teller.pin,
		phone: c.voiceEnabled ? (c.TWILIO_PHONE_NUMBER ?? null) : null,
		link,
		qr: await QRCode.toString(link, {
			type: 'svg',
			margin: 0,
			errorCorrectionLevel: 'M',
			color: { dark: '#1c1916ff', light: '#00000000' }
		}),
		askers: joinNames(askers.map((a) => a.askedBy))
	};
};
