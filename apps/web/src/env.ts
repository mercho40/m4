import { building } from "$app/env";
import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
	// Inlined at build time, so it must be set for `vite build`. It is public
	// anyway, so baking it into the bundle exposes nothing.
	PUBLIC_API_URL: { public: true, static: true },

	// Read when the app starts, so the secret never lands in the build output,
	// where Turborepo would cache it and a cache hit could ship a stale secret
	// after rotation. Optional while building, required at runtime.
	BETTER_AUTH_SECRET: {
		schema: (value) => {
			if (!building && !value) throw new Error("BETTER_AUTH_SECRET must be set.");
			return value ?? "";
		},
	},

	// Read when the app starts, for the canonical URL on server-rendered pages.
	// Everything prerendered keeps the build-time value until the next build:
	// robots.txt, sitemap.xml, llms.txt, and the social sign-in callback URLs
	// on /login and /signup. Optional at runtime, where `getSiteOrigin` falls
	// back to the request's own origin; required when building, which
	// `getSiteOrigin` enforces.
	PUBLIC_SITE_URL: { public: true, schema: (value) => value || undefined },
});
