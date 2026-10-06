import type { HandleClientError } from "@sveltejs/kit/hooks";

// Client counterpart to the server's handleError, and the same filtering: only
// unexpected errors get an id and a log line. Errors already transformed by the
// server hook are not passed here a second time.
export const handleError: HandleClientError = ({ kind, error, event }) => {
	if (kind === "app" || kind === "framework") return error;

	const errorId = crypto.randomUUID();

	// Unexpected client-side errors would otherwise vanish into the user's
	// console. The id is echoed in +error.svelte so a user can quote it.
	console.error(`[client ${errorId}] ${event.url.pathname}`, error);

	return { errorId };
};
