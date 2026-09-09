import { getCookieCache } from "better-auth/cookies";
import { authClient } from "$lib/auth-client";
import { PUBLIC_API_URL } from "$env/static/public";
import { BETTER_AUTH_SECRET } from "$env/static/private";
import type { Handle, HandleFetch, HandleServerError } from "@sveltejs/kit";

const API_ORIGIN = new URL(PUBLIC_API_URL).origin;

export const handle: Handle = async ({ event, resolve }) => {
	// Fast path: Better Auth's signed cookie cache (5-min TTL) — no backend call.
	// The cache cookie's `__Secure-` prefix is decided by the WRITER (the API),
	// so derive it from the API URL rather than this process's own NODE_ENV.
	// The secret must be passed explicitly. SvelteKit reads .env for its `$env/*`
	// modules but does not populate `process.env`, so better-auth's own
	// `env.BETTER_AUTH_SECRET` fallback is undefined here and it throws as soon
	// as a session_data cookie exists — i.e. on every request after signing in.
	let session = await getCookieCache(event.request, {
		secret: BETTER_AUTH_SECRET,
		isSecure: PUBLIC_API_URL.startsWith("https://"),
	});
	let refreshedCookies: string[] = [];

	const cookieHeader = event.request.headers.get("cookie") ?? "";
	// When the cache lapses, `getCookieCache` returns null — but the user isn't
	// logged out, the real session token is still valid. Revalidate via Better
	// Auth's `getSession` (which calls the backend, re-checks the session in the
	// DB, and re-issues a fresh cache cookie); relay that Set-Cookie so the fast
	// path resumes instead of bouncing to /login every cache cycle. Skip it when
	// there's no session token at all (a genuinely logged-out visitor).
	if (!session && cookieHeader.includes("better-auth.session_token")) {
		const { data } = await authClient.getSession({
			fetchOptions: {
				headers: { cookie: cookieHeader },
				onResponse(context) {
					refreshedCookies = context.response.headers.getSetCookie();
				},
			},
		});
		session = (data ?? null) as typeof session;
	}

	event.locals.user = session?.user ?? null;

	const response = await resolve(event, {
		// SvelteKit preloads js and css by default but never fonts, "since this
		// may cause unnecessary files to be downloaded". That caveat does not
		// apply here: layout.css declares exactly one @font-face and the build
		// emits a single .woff2, so preloading it is a straight LCP win on a
		// render-blocking asset.
		preload: ({ type, path }) =>
			type === "js" || type === "css" || (type === "font" && path.endsWith(".woff2")),
	});

	// Relay the refreshed cache cookie.
	for (const cookie of refreshedCookies) {
		response.headers.append("set-cookie", cookie);
	}
	return response;
};

// In production the app and the API are sibling subdomains sharing a parent
// cookie domain. SvelteKit deliberately does not forward such cookies through
// `event.fetch` — it "has no way to know which domain the cookie belongs to" —
// so server-side calls to the API would arrive unauthenticated. Attaching the
// cookie here fixes it once, for every `event.fetch` caller.
export const handleFetch: HandleFetch = ({ event, request, fetch }) => {
	if (new URL(request.url).origin === API_ORIGIN) {
		const cookie = event.request.headers.get("cookie");
		if (cookie) request.headers.set("cookie", cookie);
	}

	return fetch(request);
};

export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();

	// The full error stays server-side; the client only ever sees the generic
	// message plus this id, which is enough to correlate a support report.
	console.error(`[server ${errorId}] ${status} ${event.request.method} ${event.url.pathname}`, error);

	return { message, errorId };
};
