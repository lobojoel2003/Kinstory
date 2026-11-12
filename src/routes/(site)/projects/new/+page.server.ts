import { fail, redirect } from '@sveltejs/kit';
import { isKey, LANGUAGES } from '#lib/book-options.ts';
import { db } from '#lib/server/db.ts';
import { field, requireUser } from '#lib/server/guard.ts';
import { createProject } from '#lib/server/repo/projects.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	const user = requireUser(event);
	return { me: user };
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const storytellerName = field(form, 'storyteller', 120);
		const title =
			field(form, 'title', 200) ?? (storytellerName ? `The Stories of ${storytellerName}` : null);
		const askedBy = field(form, 'askedBy', 120) ?? user.name;
		const language = field(form, 'language', 5) ?? 'en';
		if (!storytellerName)
			return fail(400, { error: 'Who will be telling the stories?', title, askedBy });
		const project = await createProject(db(), user.id, {
			title: title!,
			storytellerName,
			askedBy,
			language: isKey(LANGUAGES, language) ? language : 'en'
		});
		redirect(303, `/p/${project.id}?welcome=1`);
	}
};
