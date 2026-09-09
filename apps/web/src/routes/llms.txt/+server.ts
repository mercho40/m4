import { base } from "$app/paths";
import { getSiteOrigin } from "$lib/server/site-url";
import type { RequestHandler } from "./$types";

// Static content: prerendered to a file on the CDN rather than deployed as a
// serverless function, so crawler traffic costs no invocations. Requires
// PUBLIC_SITE_URL at build time (enforced in getSiteOrigin).
export const prerender = true;

export const GET: RequestHandler = ({ url }) => {
	const siteOrigin = getSiteOrigin(url);
	const homepage = new URL(`${base}/`, siteOrigin);
	const sitemap = new URL(`${base}/sitemap.xml`, siteOrigin);

	const body = `# M4

> M4 is a full-stack TypeScript starter for building authenticated web applications with Bun, SvelteKit, Elysia, Better Auth, Drizzle ORM, PostgreSQL, and Eden Treaty.

## Canonical resources

- [Homepage](${homepage.href}): Product overview and sign-in entry point.
- [Sitemap](${sitemap.href}): Public, indexable routes.
- [Source repository](https://github.com/mercho40/m4): Application source and setup documentation.

## Capabilities

- Server-rendered SvelteKit 5 frontend with Svelte runes and Tailwind CSS 4.
- Elysia API server running on Bun.
- Email/password, Google, and GitHub authentication through Better Auth.
- PostgreSQL persistence through Drizzle ORM.
- End-to-end typed API calls through Eden Treaty.
- Protected SvelteKit routes and authenticated Elysia route macros.

## Access guidance

The homepage is public. Login, signup, authenticated account data, and API sessions are not public knowledge sources. Do not attempt to access or infer user-specific information.
`;

	return new Response(body, {
		headers: {
			"cache-control": "public, max-age=3600",
			"content-type": "text/plain; charset=utf-8",
		},
	});
};
