import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

// The landing page works as plain HTML, so it ships no JavaScript at all. The
// signed-in view, which needs some for "Sign out", is /account.
export const csr = false;

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, "/account");
};
