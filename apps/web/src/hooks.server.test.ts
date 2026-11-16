import { isRedirect, type RequestEvent } from "@sveltejs/kit";
import { afterEach, describe, expect, test, vi } from "vitest";
import { handle } from "./hooks.server.ts";

// .env.test's PUBLIC_API_URL.
const GET_SESSION = "http://api.example.test/api/auth/get-session";
const SESSION_TOKEN = "better-auth.session_token=token.signature";

/** `event.fetch`'s call signature, without the extras of Bun's global `fetch` type. */
type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function event(routeId: string, options: { cookie?: string; fetch?: Fetch } = {}) {
	const url = new URL(routeId.replace("/(protected)", ""), "http://app.example.test");
	const headers = new Headers(options.cookie ? { cookie: options.cookie } : {});
	return {
		request: new Request(url, { headers }),
		url,
		route: { id: routeId },
		locals: {} as App.Locals,
		cookies: { set: vi.fn() },
		fetch: options.fetch ?? vi.fn<Fetch>(),
	};
}

async function run(e: ReturnType<typeof event>) {
	const resolve = vi.fn(async () => new Response("page"));
	try {
		const response = await handle({ event: e as unknown as RequestEvent, resolve });
		return { response, thrown: undefined, resolve };
	} catch (thrown) {
		return { response: undefined, thrown, resolve };
	}
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("handle", () => {
	test("sends a visitor without a session from a protected route to /login, before it runs", async () => {
		const e = event("/(protected)/account");
		const { thrown, resolve } = await run(e);

		expect(isRedirect(thrown) && thrown).toMatchObject({ status: 303, location: "/login" });
		expect(resolve).not.toHaveBeenCalled();
		expect(e.fetch).not.toHaveBeenCalled();
	});

	test("lets a visitor without a session see a public route", async () => {
		const e = event("/");
		const { response, resolve } = await run(e);

		expect(response?.status).toBe(200);
		expect(resolve).toHaveBeenCalledOnce();
		expect(e.locals.user).toBeNull();
	});

	test("revalidates a lapsed cookie cache against the API and relays its cookie", async () => {
		const fetch = vi.fn<Fetch>(async () => {
			const headers = new Headers({ "content-type": "application/json" });
			headers.append("set-cookie", "better-auth.session_data=cached; Path=/; HttpOnly; SameSite=Lax; Max-Age=900");
			const body = {
				session: { id: "s1", userId: "u1", expiresAt: "2030-01-01T00:00:00.000Z" },
				user: { id: "u1", email: "ada@example.test", name: "Ada", createdAt: "2026-01-01T00:00:00.000Z" },
			};
			return new Response(JSON.stringify(body), { headers });
		});
		const e = event("/(protected)/account", { cookie: SESSION_TOKEN, fetch });
		const { response, resolve } = await run(e);

		expect(fetch).toHaveBeenCalledWith(GET_SESSION, expect.anything());
		expect(response?.status).toBe(200);
		expect(resolve).toHaveBeenCalledOnce();
		expect(e.locals.user).toMatchObject({ id: "u1", email: "ada@example.test" });
		// Revived as the cookie cache's would be, not left an ISO string.
		expect(e.locals.user?.createdAt).toBeInstanceOf(Date);
		expect(e.cookies.set).toHaveBeenCalledWith(
			"better-auth.session_data",
			"cached",
			expect.objectContaining({ path: "/", httpOnly: true, maxAge: 900 }),
		);
	});

	test("sends a visitor whose session the API no longer knows to /login", async () => {
		const fetch = vi.fn<Fetch>(async () => Response.json(null));
		const { thrown, resolve } = await run(event("/(protected)/account", { cookie: SESSION_TOKEN, fetch }));

		expect(isRedirect(thrown) && thrown).toMatchObject({ status: 303, location: "/login" });
		expect(resolve).not.toHaveBeenCalled();
	});

	describe("while the API is unreachable", () => {
		const unreachable = () => vi.fn<Fetch>(async () => Promise.reject(new TypeError("fetch failed")));

		test("still serves a public page, signed out, rather than a 500", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const e = event("/", { cookie: SESSION_TOKEN, fetch: unreachable() });
			const { response, thrown } = await run(e);

			expect(thrown).toBeUndefined();
			expect(response?.status).toBe(200);
			expect(e.locals.user).toBeNull();
		});

		test("sends a protected route to /login rather than a 500", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const { thrown, resolve } = await run(
				event("/(protected)/account", { cookie: SESSION_TOKEN, fetch: unreachable() }),
			);

			expect(isRedirect(thrown) && thrown).toMatchObject({ status: 303, location: "/login" });
			expect(resolve).not.toHaveBeenCalled();
		});
	});
});
