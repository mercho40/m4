import type { Cookies, RequestEvent } from "@sveltejs/kit";
import { parseJSON } from "better-auth/client";
import { parseSetCookieHeader, type getCookieCache } from "better-auth/cookies";
import { PUBLIC_API_URL } from "$app/env/public";

const API_BASE = PUBLIC_API_URL.replace(/\/$/, "");

/** The shape `get-session` answers with, the same one the cookie cache holds. */
type Session = Awaited<ReturnType<typeof getCookieCache>>;

/**
 * Relay the API's `Set-Cookie` headers onto this response.
 *
 * The API and the app are separate origins, so its cookies have to be re-issued
 * by SvelteKit. Going through `cookies.set` rather than appending raw headers
 * lets SvelteKit reconcile them with anything else set during the request, and
 * keeps `Domain` intact for the cross-subdomain deployment. It also means they
 * still go out when `handle` answers with a redirect instead of calling `resolve`.
 */
function relayCookies(response: Response, cookies: Cookies) {
	for (const raw of response.headers.getSetCookie()) {
		for (const [name, attributes] of parseSetCookieHeader(raw)) {
			const expires = attributes.expires;
			cookies.set(name, attributes.value ?? "", {
				path: attributes.path ?? "/",
				httpOnly: attributes.httponly ?? false,
				secure: attributes.secure ?? false,
				sameSite: (attributes.samesite as "lax" | "strict" | "none" | undefined) ?? "lax",
				domain: attributes.domain,
				maxAge: attributes["max-age"],
				expires: expires ? new Date(expires as string | number | Date) : undefined,
			});
		}
	}
}

/**
 * Revalidate the visitor's session against the API, which re-checks it in the
 * database and re-issues the cookie cache. That cookie is relayed so `handle`
 * can take its fast path again. `handleFetch` attaches the visitor's cookie.
 * Throws when the API is unreachable.
 */
export async function getSession(event: RequestEvent): Promise<Session> {
	const response = await event.fetch(`${API_BASE}/api/auth/get-session`, {
		headers: { accept: "application/json" },
	});

	relayCookies(response, event.cookies);

	// Better Auth's own client parser, which revives the ISO date strings into
	// `Date`s, so a revalidated session has the same shape as one read from
	// the cookie cache. Plain `response.json()` would leave them strings.
	return response.ok ? parseJSON<Session>(await response.text()) : null;
}
