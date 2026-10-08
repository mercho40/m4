import { fail, redirect, type Action, type Cookies, type RequestEvent } from "@sveltejs/kit";
import { parseSetCookieHeader, type getCookieCache } from "better-auth/cookies";
import { resolve } from "$app/paths";
import { PUBLIC_API_URL } from "$app/env/public";
import { clientHeaders } from "#lib/server/client-ip.js";
import { getSiteOrigin, siteUrl } from "#lib/server/site-url.js";

const API_BASE = PUBLIC_API_URL.replace(/\/$/, "");

/**
 * Origin of each social provider's authorization endpoint, as Better Auth
 * builds it. The sign-in action lets `redirect` leave the app only for the
 * chosen provider's origin, so a backend that answered with anything else
 * fails loudly instead of becoming an open redirect.
 */
const SOCIAL_PROVIDER_ORIGINS = {
	google: "https://accounts.google.com",
	github: "https://github.com",
} as const;

type SocialProvider = keyof typeof SOCIAL_PROVIDER_ORIGINS;

const isSocialProvider = (value: string): value is SocialProvider => Object.hasOwn(SOCIAL_PROVIDER_ORIGINS, value);

/** The shape `get-session` answers with, the same one the cookie cache holds. */
type Session = Awaited<ReturnType<typeof getCookieCache>>;

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

/**
 * Revalidate the visitor's session against the API, which re-checks it in the
 * database and re-issues the cookie cache. That cookie is relayed so `handle`
 * can take its fast path again. Throws when the API is unreachable.
 */
export async function getSession(event: RequestEvent): Promise<Session> {
	const response = await event.fetch(`${API_BASE}/api/auth/get-session`, {
		headers: { ...(await clientHeaders(event)), accept: "application/json" },
	});

	relayCookies(response, event.cookies);

	return response.ok ? ((await response.json()) as Session) : null;
}

/**
 * The `social` form action shared by the login and signup pages: start the
 * OAuth flow on the API, then send the browser to the provider.
 */
export const socialSignIn: Action = async (event) => {
	const provider = String((await event.request.formData()).get("provider") ?? "");

	if (!isSocialProvider(provider)) {
		return fail(400, { message: "Unknown sign-in provider." });
	}

	const result = await callAuth(
		"sign-in/social",
		// The canonical origin, like the Origin header callAuth sends: Better Auth
		// rejects a callbackURL outside `trustedOrigins`, which the request's
		// own origin need not be (a *.vercel.app deployment URL, say).
		{ provider, callbackURL: siteUrl(event.url, resolve("/")).href },
		event,
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
};
