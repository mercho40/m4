import { parseSetCookieHeader } from "better-auth/cookies";
import { PUBLIC_API_URL } from "$app/env/public";
import type { Cookies, RequestEvent } from "@sveltejs/kit";
import { clientHeaders } from "#lib/server/client-ip.js";
import { getSiteOrigin } from "#lib/server/site-url.js";

const API_BASE = PUBLIC_API_URL.replace(/\/$/, "");

/**
 * Origin of each social provider's authorization endpoint, as Better Auth
 * builds it. The sign-in actions let `redirect` leave the app only for the
 * chosen provider's origin, so a backend that answered with anything else
 * fails loudly instead of becoming an open redirect.
 */
export const SOCIAL_PROVIDER_ORIGINS = {
	google: "https://accounts.google.com",
	github: "https://github.com",
} as const;

export type SocialProvider = keyof typeof SOCIAL_PROVIDER_ORIGINS;

export const isSocialProvider = (value: string): value is SocialProvider =>
	Object.hasOwn(SOCIAL_PROVIDER_ORIGINS, value);

type AuthResponse = {
	ok: boolean;
	status: number;
	message: string;
	data: Record<string, unknown> | null;
};

/**
 * Relay the API's `Set-Cookie` headers onto this response.
 *
 * The API and the app are separate origins, so its cookies have to be re-issued
 * by SvelteKit. Going through `cookies.set` rather than appending raw headers
 * lets SvelteKit reconcile them with anything else set during the request, and
 * keeps `Domain` intact for the cross-subdomain deployment. It also means they
 * still go out when `handle` answers with a redirect instead of calling `resolve`.
 */
export function relayCookies(response: Response, cookies: Cookies) {
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
 * POST to a Better Auth endpoint from the server, relaying any session cookies.
 *
 * Goes through `event.fetch` so `handleFetch` can attach the incoming cookie
 * for calls that need an existing session.
 */
export async function callAuth(path: string, body: unknown, event: RequestEvent): Promise<AuthResponse> {
	let response: Response;
	try {
		response = await event.fetch(`${API_BASE}/api/auth/${path}`, {
			method: "POST",
			// Better Auth checks Origin against `trustedOrigins` and answers 403
			// "Invalid origin" without it — server-to-server calls carry no browser
			// Origin, so it has to be set explicitly to the app's public origin.
			headers: {
				...(await clientHeaders(event)),
				"content-type": "application/json",
				accept: "application/json",
				origin: getSiteOrigin(event.url),
			},
			body: JSON.stringify(body),
		});
	} catch {
		// Backend unreachable — surface it as a form error rather than a 500.
		return { ok: false, status: 503, message: "Could not reach the server. Try again.", data: null };
	}

	relayCookies(response, event.cookies);

	const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;

	return {
		ok: response.ok,
		status: response.status,
		message: typeof data?.message === "string" ? data.message : "",
		data,
	};
}
