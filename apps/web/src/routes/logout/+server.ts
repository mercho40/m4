import { resolve } from "$app/paths";
import { callAuth } from "#lib/server/auth-api.js";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async (event) => {
	// callAuth relays the cleared session cookies through `event.cookies`, which
	// SvelteKit adds to this response.
	const result = await callAuth("sign-out", { disableRedirect: true }, event);

	if (!result.ok) {
		return new Response("Sign out is temporarily unavailable.", { status: 502 });
	}

	// Better Auth returns the provider's own logout page when it supports
	// RP-initiated logout. It may be on any origin, hence a raw 303 rather than
	// `redirect`, which only leaves the app for allowlisted origins.
	let location: string = resolve("/");
	const providerLogout = typeof result.data?.url === "string" ? URL.parse(result.data.url) : null;
	if (providerLogout?.protocol === "https:" || providerLogout?.protocol === "http:") {
		location = providerLogout.href;
	}

	return new Response(null, { status: 303, headers: { location } });
};
