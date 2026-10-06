import { resolve } from "$app/paths";
import { siteUrl } from "#lib/server/site-url.js";
import type { RequestHandler } from "./$types";

// Static content: prerendered to a file on the CDN rather than deployed as a
// serverless function, so crawler traffic costs no invocations. Requires
// PUBLIC_SITE_URL at build time (enforced in getSiteOrigin).
export const prerender = true;

export const GET: RequestHandler = ({ url }) => {
	const sitemap = siteUrl(url, resolve("/sitemap.xml"));

	return new Response(
		[
			"User-agent: *",
			"Allow: /",
			// Only paths here, so there is no need for the canonical origin.
			`Disallow: ${new URL(resolve("/login"), url).pathname}`,
			`Disallow: ${new URL(resolve("/signup"), url).pathname}`,
			`Sitemap: ${sitemap.href}`,
		].join("\n"),
		{
			headers: {
				"cache-control": "public, max-age=3600",
				"content-type": "text/plain; charset=utf-8",
			},
		},
	);
};
