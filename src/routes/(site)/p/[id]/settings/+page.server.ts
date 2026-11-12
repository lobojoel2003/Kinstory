import { fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db.ts';
import { field, requireProject } from '#lib/server/guard.ts';
import {
	createInvite,
	deleteProject,
	listMembers,
	removeMember
} from '#lib/server/repo/projects.ts';
import {
	createStoryteller,
	deleteStoryteller,
	getStoryteller,
	normalizePhone,
	PhoneTakenError,
	rotateAnswerLink,
	updateStoryteller
} from '#lib/server/repo/storytellers.ts';
import { isValidTimeZone } from '#lib/server/schedule.ts';
import { removeDir, keys } from '#lib/server/storage.ts';
import type { Delivery } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { project, user } = await requireProject(event);
	return {
		members: await listMembers(db(), project.id),
		me: user,
		timeZones: Intl.supportedValuesOf('timeZone')
	};
};

export const actions: Actions = {
	teller: async (event) => {
		const { project } = await requireProject(event);
		const form = await event.request.formData();
		const id = field(form, 'id') ?? '';
		const teller = await getStoryteller(db(), project.id, id);
		if (!teller) return fail(404, { tellerError: 'Storyteller not found', id });
		const name = field(form, 'name', 120);
		const phoneRaw = field(form, 'phone', 40);
		const phone = normalizePhone(phoneRaw);
		const email = field(form, 'email', 320);
		const delivery = (field(form, 'delivery') ?? 'none') as Delivery;
		const timezone = field(form, 'timezone', 64) ?? 'UTC';
		const dayRaw = field(form, 'callDay');
		const callTime = field(form, 'callTime', 5);
		if (!name) return fail(400, { tellerError: 'A name is needed.', id });
		if (phoneRaw && !phone)
			return fail(400, {
				tellerError:
					'That phone number doesn’t look right. Include the country code, e.g. +1 555 555 0142.',
				id
			});
		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
			return fail(400, { tellerError: 'That email address doesn’t look right.', id });
		if (!['none', 'call', 'sms', 'email'].includes(delivery))
			return fail(400, { tellerError: 'Choose how questions are sent.', id });
		if ((delivery === 'call' || delivery === 'sms') && !phone)
			return fail(400, {
				tellerError: 'Add a phone number to send questions by phone or text.',
				id
			});
		if (delivery === 'email' && !email)
			return fail(400, { tellerError: 'Add an email address to send questions by email.', id });
		if (!isValidTimeZone(timezone)) return fail(400, { tellerError: 'Unknown time zone.', id });
		if (callTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(callTime))
			return fail(400, { tellerError: 'Use a time like 10:30.', id });
		const callDay = dayRaw === null || dayRaw === '' ? null : Number(dayRaw);
		try {
			await updateStoryteller(db(), project.id, teller.id, {
				name,
				phone,
				email,
				delivery,
				timezone,
				callDay: callDay !== null && callDay >= 0 && callDay <= 6 ? callDay : null,
				callTime: callTime ?? null
			});
		} catch (err) {
			if (err instanceof PhoneTakenError) return fail(400, { tellerError: err.message, id });
			throw err;
		}
		return { tellerSaved: id };
	},
	addTeller: async (event) => {
		const { project } = await requireProject(event);
		const name = field(await event.request.formData(), 'name', 120);
		if (!name) return fail(400, { addError: 'A name is needed.' });
		await createStoryteller(db(), project.id, { name });
		return { added: true };
	},
	removeTeller: async (event) => {
		const { project } = await requireProject(event, 'owner');
		const id = field(await event.request.formData(), 'id');
		if (id) await deleteStoryteller(db(), project.id, id);
		return {};
	},
	rotate: async (event) => {
		const { project } = await requireProject(event);
		const id = field(await event.request.formData(), 'id');
		if (id) await rotateAnswerLink(db(), project.id, id);
		return { rotated: id };
	},
	invite: async (event) => {
		const { project, user } = await requireProject(event);
		const token = await createInvite(db(), project.id, user.id, 'editor');
		return { invite: `${event.url.origin}/invite/${token}` };
	},
	removeMember: async (event) => {
		const { project, user } = await requireProject(event);
		const id = field(await event.request.formData(), 'user');
		if (!id) return fail(400, {});
		if (id !== user.id && project.role !== 'owner')
			return fail(403, { memberError: 'Only the owner can remove people.' });
		if (!(await removeMember(db(), project.id, id)))
			return fail(400, { memberError: 'A book always needs an owner.' });
		if (id === user.id) redirect(303, '/projects');
		return {};
	},
	delete: async (event) => {
		const { project } = await requireProject(event, 'owner');
		const confirm = field(await event.request.formData(), 'confirm', 200);
		if (confirm !== project.title)
			return fail(400, { deleteError: 'Type the book’s title exactly to confirm.' });
		await deleteProject(db(), project.id);
		await removeDir(keys.project(project.id));
		redirect(303, '/projects');
	}
};
