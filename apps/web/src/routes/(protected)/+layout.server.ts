import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

// Belt-and-braces only: the guard that actually holds is in hooks.server.ts,
// which also covers form actions and endpoints and runs before any page load.
export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user) redirect(303, "/login");
};
