// Email to the family when a new answer arrives. Optional: without SMTP
// configured, Kinstory simply shows new stories on the dashboard.

import type { Db } from '../db.ts';
import { config } from '../config.ts';
import { log } from '../log.ts';
import { sendMail } from '../mail.ts';

export async function notifyAnswer(
	sql: Db,
	a: { projectId: string; storyId: string; tellerName: string; question: string | null }
): Promise<void> {
	if (!config().mailEnabled) return;
	const members = await sql<{ email: string; name: string }[]>`
		select u.email, u.name from project_members m join users u on u.id = m.user_id where m.project_id = ${a.projectId}`;
	const url = config().publicUrl
		? `${config().publicUrl}/p/${a.projectId}/stories/${a.storyId}`
		: null;
	const subject = a.question
		? `${a.tellerName} answered: “${a.question}”`
		: `${a.tellerName} told a new story`;
	for (const m of members) {
		try {
			await sendMail({
				to: m.email,
				subject,
				text: [
					`Hi ${m.name},`,
					'',
					`${a.tellerName} just recorded a new answer${a.question ? ` to “${a.question}”` : ''}.`,
					'The transcript is ready for a light edit.',
					'',
					url ?? 'Open Kinstory to read and listen.',
					'',
					'— Kinstory'
				].join('\n')
			});
		} catch (err) {
			log.warn('answer notification failed', { err, to: m.email });
		}
	}
}
