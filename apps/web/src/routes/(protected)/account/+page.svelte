<script lang="ts">
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { Button } from "#lib/components/ui/button/index.js";

	let { data } = $props();

	let signingOut = $state(false);
	let message = $state("");

	// When the provider supports RP-initiated logout, the client sends the
	// browser to its logout page instead.
	async function signOut() {
		signingOut = true;
		message = "";

		try {
			// Imported on click, so the page does not load the auth client up front.
			const { authClient } = await import("#lib/auth-client.js");
			const { error } = await authClient.signOut();
			if (!error) return await goto(resolve("/"));
			message = error.message || "Could not sign out. Try again.";
		} catch {
			message = "Could not reach the server. Try again.";
		}
		signingOut = false;
	}
</script>

<svelte:head>
	<title>Your account — M4</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main id="main-content" class="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-10 px-6 py-16">
	<div class="space-y-4">
		<h1 class="text-5xl font-bold tracking-tight md:text-6xl">Welcome back</h1>
		<p class="text-muted-foreground text-lg">{data.user?.email}</p>
	</div>

	<div class="space-y-3">
		<Button variant="outline" onclick={signOut} disabled={signingOut}>
			{signingOut ? "Signing out..." : "Sign out"}
		</Button>
		{#if message}
			<p role="alert" class="text-destructive text-sm">{message}</p>
		{/if}
	</div>
</main>
