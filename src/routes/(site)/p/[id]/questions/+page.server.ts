import { fail } from '@sveltejs/kit';
import { db } from '#lib/server/db.ts';
import { field, requireProject } from '#lib/server/guard.ts';
import {
	addPrompt,
	deletePrompt,
	listPrompts,
	promotePrompt,
	reorderPrompts,
	setPromptStatus,
	updatePromptText
} from '#lib/server/repo/prompts.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { project, user } = await requireProject(event);
	return { prompts: await listPrompts(db(), project.id), me: user };
};

export const actions: Actions = {
	add: async (event) => {
		const { project } = await requireProject(event);
		const form = await event.request.formData();
		const text = field(form, 'text', 500);
		if (!text) return fail(400, { addError: 'Write a question first.' });
		const teller = field(form, 'teller');
		await addPrompt(db(), project.id, {
			text,
			askedBy: field(form, 'askedBy', 120),
			storytellerId: teller && teller !== 'any' ? teller : null,
			first: form.get('first') === 'on'
		});
		return { added: text };
	},
	edit: async (event) => {
		const { project } = await requireProject(event);
		const form = await event.request.formData();
		const id = field(form, 'id');
		const text = field(form, 'text', 500);
		if (!id || !text) return fail(400, { editError: 'A question cannot be empty.' });
		await updatePromptText(db(), project.id, id, text, field(form, 'askedBy', 120));
		return { edited: true };
	},
	move: async (event) => {
		const { project } = await requireProject(event);
		const form = await event.request.formData();
		const order = String(form.get('order') ?? '')
			.split(',')
			.filter(Boolean);
		if (order.length) await reorderPrompts(db(), project.id, order);
		return { moved: true };
	},
	top: async (event) => {
		const { project } = await requireProject(event);
		const id = field(await event.request.formData(), 'id');
		if (id) await promotePrompt(db(), project.id, id);
		return { moved: true };
	},
	skip: async (event) => {
		const { project } = await requireProject(event);
		const id = field(await event.request.formData(), 'id');
		if (id) await setPromptStatus(db(), project.id, id, 'skipped');
		return {};
	},
	restore: async (event) => {
		const { project } = await requireProject(event);
		const id = field(await event.request.formData(), 'id');
		if (id) await setPromptStatus(db(), project.id, id, 'queued');
		return {};
	},
	delete: async (event) => {
		const { project } = await requireProject(event);
		const id = field(await event.request.formData(), 'id');
		if (id) await deletePrompt(db(), project.id, id);
		return {};
	}
};
