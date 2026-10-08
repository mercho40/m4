import { createAuthClient } from "better-auth/svelte";
import { PUBLIC_API_URL } from "$app/env/public";

// Used in the browser only: sign-in, sign-up and sign-out go straight to the
// API, which sets the session cookie on the domain both apps share.
export const authClient = createAuthClient({
	baseURL: PUBLIC_API_URL,
});
