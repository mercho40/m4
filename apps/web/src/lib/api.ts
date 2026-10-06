import { treaty } from "@elysiajs/eden";
import type { App } from "@repo/back";
import { PUBLIC_API_URL } from "$app/env/public";

export const createApi = (fetch: typeof globalThis.fetch) =>
	treaty<App>(PUBLIC_API_URL, {
		fetch: { credentials: "include" },
		fetcher: fetch,
	});
