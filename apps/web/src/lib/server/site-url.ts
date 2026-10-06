import { building } from "$app/env";
import { PUBLIC_SITE_URL } from "$app/env/public";

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
	const configuredUrl = PUBLIC_SITE_URL.trim();

	if (!configuredUrl && building) {
		throw new Error(
			"PUBLIC_SITE_URL must be set when building: it is baked into the prerendered robots.txt, sitemap.xml and llms.txt.",
		);
	}

	return configuredUrl ? new URL(configuredUrl).origin : requestUrl.origin;
}

/**
 * Absolute URL for a route, on the canonical origin.
 *
 * `resolve` from `$app/paths` returns a path *relative to the page being
 * rendered* during SSR (`./login`, not `/login`), which is not something you
 * can paste into a sitemap or a robots.txt directive. Resolving it against the
 * request URL turns it back into a real pathname — preserving any configured
 * base path — which is then re-homed on the canonical origin.
 */
export function siteUrl(requestUrl: URL, resolvedPath: string): URL {
	const { pathname } = new URL(resolvedPath, requestUrl);

	return new URL(pathname, getSiteOrigin(requestUrl));
}
