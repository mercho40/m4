import { fail, redirect } from "@sveltejs/kit";
import { callAuth, isSocialProvider, SOCIAL_PROVIDER_ORIGINS } from "#lib/server/auth-api.js";
import { resolve } from "$app/paths";
import { getSiteOrigin, siteUrl } from "#lib/server/site-url.js";
import type { Actions, PageServerLoad } from "./$types";

// Mirror image of the (protected) guard: the server already knows who this is,
// so decide here instead of rendering the form and undoing it after hydration.
export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, "/");
};

export const actions: Actions = {
	signup: async ({ request, fetch, cookies, url }) => {
		const data = await request.formData();
		const name = String(data.get("name") ?? "").trim();
		const email = String(data.get("email") ?? "").trim();
		const password = String(data.get("password") ?? "");
		const confirmPassword = String(data.get("confirmPassword") ?? "");

		if (!name || !email || !password) {
			return fail(400, { name, email, message: "Fill in every field." });
		}

		// Was a client-side check only, so it vanished without JavaScript.
		if (password !== confirmPassword) {
			return fail(400, { name, email, message: "Those passwords do not match." });
		}

		const result = await callAuth("sign-up/email", { email, password, name }, { fetch, cookies, origin: getSiteOrigin(url) });

		if (!result.ok) {
			return fail(result.status === 401 ? 400 : result.status, {
				name,
				email,
				message: result.message || "That account could not be created.",
			});
		}

		redirect(303, "/");
	},

	social: async ({ request, fetch, cookies, url }) => {
		const provider = String((await request.formData()).get("provider") ?? "");

		if (!isSocialProvider(provider)) {
			return fail(400, { message: "Unknown sign-in provider." });
		}

		const result = await callAuth(
			"sign-in/social",
			// The canonical origin, like the Origin header below: Better Auth
			// rejects a callbackURL outside `trustedOrigins`, which the request's
			// own origin need not be (a *.vercel.app deployment URL, say).
			{ provider, callbackURL: siteUrl(url, resolve("/")).href },
			{ fetch, cookies, origin: getSiteOrigin(url) },
		);

		const target = typeof result.data?.url === "string" ? result.data.url : null;

		if (!result.ok || !target) {
			return fail(400, { message: result.message || "That sign-in provider is unavailable." });
		}

		// Only the chosen provider's origin is allowed; see the matching note in
		// login/+page.server.ts.
		redirect(303, target, { external: [SOCIAL_PROVIDER_ORIGINS[provider]] });
	},
};
