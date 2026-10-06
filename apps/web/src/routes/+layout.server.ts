import { getSiteOrigin } from "#lib/server/site-url.js";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = ({ locals, url }) => ({
	user: locals.user,
	siteUrl: getSiteOrigin(url),
});
