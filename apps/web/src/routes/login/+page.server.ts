import { fail, redirect } from "@sveltejs/kit";
import { callAuth, socialSignIn } from "#lib/server/auth-api.js";
import type { Actions, PageServerLoad } from "./$types";

// Mirror image of the (protected) guard: the server already knows who this is,
// so decide here instead of rendering the form and undoing it after hydration.
export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, "/");
};

export const actions: Actions = {
	// Named rather than default so the social action can live alongside it.
	login: async (event) => {
		const { request } = event;
		const data = await request.formData();
		const email = String(data.get("email") ?? "").trim();
		const password = String(data.get("password") ?? "");

		if (!email || !password) {
			return fail(400, { email, message: "Enter your email and password." });
		}

		const result = await callAuth("sign-in/email", { email, password }, event);

		if (!result.ok) {
			// Never echo the password back — only the email, so the field can be refilled.
			return fail(result.status === 401 ? 400 : result.status, {
				email,
				message: result.message || "That email and password combination is not correct.",
			});
		}

		redirect(303, "/");
	},

	social: socialSignIn,
};
