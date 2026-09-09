import { base } from "$app/paths";
import { getSiteOrigin } from "$lib/server/site-url";
import type { RequestHandler } from "./$types";

// Static content: prerendered to a file on the CDN rather than deployed as a
// serverless function, so crawler traffic costs no invocations. Requires
// PUBLIC_SITE_URL at build time (enforced in getSiteOrigin).
export const prerender = true;

export const GET: RequestHandler = ({ url }) => {
	const sitemap = new URL(`${base}/sitemap.xml`, getSiteOrigin(url));

	return new Response(
		[
			"User-agent: *",
			"Allow: /",
			`Disallow: ${base}/login`,
			`Disallow: ${base}/signup`,
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
