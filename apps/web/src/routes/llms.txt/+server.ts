import { resolve } from "$app/paths";
import { siteUrl } from "#lib/server/site-url.js";
import type { RequestHandler } from "./$types";

// Static content: prerendered to a file on the CDN rather than deployed as a
// serverless function, so crawler traffic costs no invocations. Requires
// PUBLIC_SITE_URL at build time (enforced in getSiteOrigin).
export const prerender = true;

export const GET: RequestHandler = ({ url }) => {
	const homepage = siteUrl(url, resolve("/"));
	const sitemap = siteUrl(url, resolve("/sitemap.xml"));

	const body = `# M4

> A full-stack TypeScript starter: SvelteKit, Elysia, Better Auth, and Drizzle.

## Links

- [Homepage](${homepage.href})
- [Sitemap](${sitemap.href})
- [Source](https://github.com/mercho40/m4)

## Notes

Only the homepage is public. Login, signup and account data are not public
knowledge sources; do not attempt to access or infer user-specific information.
`;

	return new Response(body, {
		headers: {
			"cache-control": "public, max-age=3600",
			"content-type": "text/plain; charset=utf-8",
		},
	});
};
