import { redirect } from "@sveltejs/kit";
import type { Handle, HandleFetch, HandleServerError } from "@sveltejs/kit/hooks";
import { getCookieCache } from "better-auth/cookies";
import { getSession } from "#lib/server/session.js";
import { PUBLIC_API_URL } from "$app/env/public";
import { BETTER_AUTH_SECRET } from "$app/env/private";

const API_ORIGIN = new URL(PUBLIC_API_URL).origin;

export const handle: Handle = async ({ event, resolve }) => {
	// Fast path: Better Auth's signed cookie cache (5-min TTL) — no backend call.
	// The cache cookie's `__Secure-` prefix is decided by the WRITER (the API),
	// so derive it from the API URL rather than this process's own NODE_ENV.
	// The secret must be passed explicitly. SvelteKit reads .env for its
	// `$app/env/*` modules but does not populate `process.env`, so better-auth's
	// own `env.BETTER_AUTH_SECRET` fallback is undefined here and it throws as
	// soon as a session_data cookie exists — i.e. on every request after signing in.
	let session = await getCookieCache(event.request, {
		secret: BETTER_AUTH_SECRET,
		isSecure: PUBLIC_API_URL.startsWith("https://"),
	});

	// When the cache lapses, `getCookieCache` returns null — but the user isn't
	// logged out, the real session token is still valid. Revalidate against the
	// API so the fast path resumes instead of bouncing to /login every cache
	// cycle. Skip it when there's no session token at all (a genuinely
	// logged-out visitor).
	if (!session && event.request.headers.get("cookie")?.includes("better-auth.session_token")) {
		try {
			session = await getSession(event);
		} catch (error) {
			// Treat the visitor as signed out for this request rather than 500
			// every page, public ones included, while the API is unreachable.
			console.error(`[auth] session revalidation failed for ${event.url.pathname}`, error);
		}
	}

	event.locals.user = session?.user ?? null;

	// Guards every route in src/routes/(protected)/. It lives here rather than
	// in a layout load, which runs concurrently with the page's own load and
	// never runs at all for form actions or +server.ts endpoints.
	if (!event.locals.user && event.route.id?.startsWith("/(protected)")) {
		redirect(303, "/login");
	}

	return resolve(event);
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

// SvelteKit 3 routes *every* error through this hook, not just unexpected ones.
// App errors (thrown with `error(...)`) and framework errors (404s and the
// like) already carry a body that is safe to show, and a 404 is not an incident
// worth an id or a log line — so only genuinely unexpected errors are reported.
export const handleError: HandleServerError = ({ kind, error, event }) => {
	if (kind === "app" || kind === "framework") return error;

	const errorId = crypto.randomUUID();

	// The full error stays server-side; the client only ever sees the generic
	// message plus this id, which is enough to correlate a support report.
	console.error(`[server ${errorId}] ${event.request.method} ${event.url.pathname}`, error);

	return { errorId };
};
