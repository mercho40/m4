import { resolve } from "$app/paths";
import { PUBLIC_API_URL } from "$app/env/public";
import { getSiteOrigin } from "#lib/server/site-url.js";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ fetch, request, url }) => {
	const response = await fetch(`${PUBLIC_API_URL.replace(/\/$/, "")}/api/auth/sign-out`, {
		method: "POST",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			// The session cookie is attached by handleFetch, which covers every
			// event.fetch call to the API origin.
			origin: request.headers.get("origin") ?? getSiteOrigin(url),
		},
		body: JSON.stringify({ disableRedirect: true }),
		redirect: "manual",
	});

	if (!response.ok) {
		return new Response("Sign out is temporarily unavailable.", { status: 502 });
	}

	const result = (await response.json()) as { url?: string };
	let location: string = resolve("/");

	if (result.url) {
		const providerLogout = new URL(result.url);
		if (providerLogout.protocol === "https:" || providerLogout.protocol === "http:") {
			location = providerLogout.href;
		}
	}

	const headers = new Headers({ location });
	for (const cookie of response.headers.getSetCookie()) {
		headers.append("set-cookie", cookie);
	}

	return new Response(null, { status: 303, headers });
};
