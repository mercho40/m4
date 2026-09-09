import { building } from "$app/environment";
import { env } from "$env/dynamic/public";

/**
 * Absolute origin for canonical URLs, the sitemap, robots and llms.txt.
 *
 * Falls back to the request's own origin, which is correct at runtime but not
 * during prerendering — there the URL is a build-time placeholder. Since
 * robots.txt, sitemap.xml and llms.txt are prerendered, an unset
 * PUBLIC_SITE_URL would silently bake that placeholder into files search
 * engines read, so fail the build instead.
 */
export function getSiteOrigin(requestUrl: URL): string {
	const configuredUrl = env.PUBLIC_SITE_URL?.trim();

	if (!configuredUrl && building) {
		throw new Error(
			"PUBLIC_SITE_URL must be set when building: it is baked into the prerendered robots.txt, sitemap.xml and llms.txt.",
		);
	}

	return configuredUrl ? new URL(configuredUrl).origin : requestUrl.origin;
}
