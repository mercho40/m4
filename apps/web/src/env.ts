import { building } from "$app/env";
import { defineEnvVars } from "@sveltejs/kit/env";

/**
 * A declared variable without a schema must be set, but may be empty. This
 * also rejects the empty string, which a bare `KEY=` line lets through.
 */
const required = (name: string) => (value: string | undefined) => {
	if (!value) throw new Error(`${name} must be set.`);
	return value;
};

/**
 * Optional, but when set it must be an absolute http(s) URL. Something like
 * `example.com` would otherwise pass here and then make `getSiteOrigin`'s
 * `new URL()` throw on every request instead of once at startup.
 */
const optionalSiteUrl = (value: string | undefined) => {
	const url = value?.trim();
	if (!url) return undefined;

	let protocol: string | undefined;
	try {
		protocol = new URL(url).protocol;
	} catch {
		// Not a URL at all: reported below with the same message.
	}

	if (protocol !== "https:" && protocol !== "http:") {
		throw new Error(`PUBLIC_SITE_URL must be an absolute http(s) URL such as https://example.com, not "${url}".`);
	}

	return url;
};

export const variables = defineEnvVars({
	// Static, so it is inlined at build time and must be present for `vite
	// build`. It is public anyway, so baking it into the bundle exposes nothing.
	PUBLIC_API_URL: { public: true, static: true, schema: required("PUBLIC_API_URL") },

	// Dynamic, so it is read when the server starts and never written into the
	// build output, where Turborepo would cache it and a cache hit could ship a
	// stale secret after rotation. Nothing reads it during the build
	// (prerendered requests carry no session cookie), so it is only required
	// at runtime.
	BETTER_AUTH_SECRET: {
		schema: (value) => (building ? (value ?? "") : required("BETTER_AUTH_SECRET")(value)),
	},

	// Dynamic so a deployment can change it without a rebuild, and optional in
	// dev, where `getSiteOrigin` falls back to the request's own origin. It only
	// *has* to be set when building, which `getSiteOrigin` enforces, because it
	// is baked into the prerendered robots.txt, sitemap.xml and llms.txt.
	PUBLIC_SITE_URL: { public: true, schema: optionalSiteUrl },
});
