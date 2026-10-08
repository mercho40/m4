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
	// Named rather than default so the social action can live alongside it.
	login: async ({ request, fetch, cookies, url }) => {
		const data = await request.formData();
		const email = String(data.get("email") ?? "").trim();
		const password = String(data.get("password") ?? "");

		if (!email || !password) {
			return fail(400, { email, message: "Enter your email and password." });
		}

		const result = await callAuth("sign-in/email", { email, password }, { fetch, cookies, origin: getSiteOrigin(url) });

		if (!result.ok) {
			// Never echo the password back — only the email, so the field can be refilled.
			return fail(result.status === 401 ? 400 : result.status, {
				email,
				message: result.message || "That email and password combination is not correct.",
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
			// Providers are registered on the backend only when configured, so an
			// unconfigured one lands here instead of redirecting to a broken page.
			return fail(400, { message: result.message || "That sign-in provider is unavailable." });
		}

		// `target` is minted by our backend and leaves the app, which SvelteKit 3
		// only permits for allowlisted origins. Allowing just the chosen
		// provider's means a misconfigured or compromised backend produces an
		// error here rather than an open redirect.
		redirect(303, target, { external: [SOCIAL_PROVIDER_ORIGINS[provider]] });
	},
};
