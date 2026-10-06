import { defineEnvVars } from "@sveltejs/kit/env";

/**
 * Unset variables resolve to the empty string rather than failing, so anything
 * the app cannot run without needs an explicit validator. `static` variables
 * are inlined at build time, so these throw during `vite build`, not at boot.
 */
const required = (name: string) => (value: string | undefined) => {
	if (!value) throw new Error(`${name} must be set.`);
	return value;
};

export const variables = defineEnvVars({
	PUBLIC_API_URL: { public: true, static: true, schema: required("PUBLIC_API_URL") },
	BETTER_AUTH_SECRET: { static: true, schema: required("BETTER_AUTH_SECRET") },

	// Deliberately dynamic and optional: read at runtime so a deployment can set
	// it without a rebuild, and absent in dev, where `getSiteOrigin` falls back
	// to the request's own origin. It only *has* to be set when building, which
	// `getSiteOrigin` enforces, because it is baked into prerendered files.
	PUBLIC_SITE_URL: { public: true, schema: (value) => value ?? "" },
});
