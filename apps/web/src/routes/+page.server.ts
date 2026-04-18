import { api } from "$lib/api";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const { data } = await api.health.get();
	return { health: data };
};
