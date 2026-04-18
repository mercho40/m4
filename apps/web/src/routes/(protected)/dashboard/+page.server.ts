import { api } from "$lib/api";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request }) => {
	const { data, error: err } = await api.dashboard.get({
		headers: { cookie: request.headers.get("cookie") ?? "" },
	});

	if (err) error(401, "Failed to fetch dashboard data");

	return { dashboard: data };
};
