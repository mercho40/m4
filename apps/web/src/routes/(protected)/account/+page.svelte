<script lang="ts">
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { Button } from "#lib/components/ui/button/index.js";

	let { data } = $props();

	// When the provider supports RP-initiated logout, the client sends the
	// browser to its logout page instead.
	async function signOut() {
		// Imported on click, so the page does not load the auth client up front.
		const { authClient } = await import("#lib/auth-client.js");
		const { error } = await authClient.signOut();
		if (!error) await goto(resolve("/"));
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

	<div>
		<Button variant="outline" onclick={signOut}>Sign out</Button>
	</div>
</main>
