<script lang="ts">
	import { Button } from "#lib/components/ui/button/index.js";
	import { authClient } from "#lib/auth-client.js";
	import { page } from "$app/state";
	import { resolve } from "$app/paths";

	type Props = {
		/** Prefixes each provider name, e.g. "Login with" → "Login with Google". */
		label: string;
		/** Shared with the surrounding form, so neither submits while the other is pending. */
		busy?: boolean;
		onerror: (message: string) => void;
	};

	let { label, busy = $bindable(false), onerror }: Props = $props();

	async function signIn(provider: "google" | "github") {
		busy = true;
		try {
			const { error } = await authClient.signIn.social({
				provider,
				// The canonical origin: Better Auth rejects a callbackURL outside
				// `trustedOrigins`, which the page's own origin need not be (a
				// *.vercel.app deployment URL, say).
				callbackURL: new URL(resolve("/"), page.data.siteUrl).href,
			});
			// On success the client has already sent the browser to the provider.
			if (!error) return;
			// Providers are registered on the API only when configured, so an
			// unconfigured one lands here instead of redirecting to a broken page.
			onerror(error.message || "That sign-in provider is unavailable.");
		} catch {
			onerror("Could not reach the server. Try again.");
		}
		busy = false;
	}
</script>

<Button type="button" variant="outline" class="w-full" disabled={busy} onclick={() => signIn("google")}>
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
		<path
			d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
			fill="currentColor"
		/>
	</svg>
	{label} Google
</Button>
<Button type="button" variant="outline" class="w-full" disabled={busy} onclick={() => signIn("github")}>
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path
			d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
		/>
	</svg>
	{label} GitHub
</Button>
