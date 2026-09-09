import type { HandleClientError } from "@sveltejs/kit";

// Client counterpart to the server's handleError. Unexpected client-side errors
// would otherwise vanish into the user's console. The id is echoed in
// +error.svelte so a user can quote it.
export const handleError: HandleClientError = ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();

	console.error(`[client ${errorId}] ${status} ${event.url.pathname}`, error);

	return { message, errorId };
};
