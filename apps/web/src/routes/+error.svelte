<script lang="ts">
	import { page } from "$app/state";
	import { resolve } from "$app/paths";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";

	// `error` is passed as a prop for rendering errors, which SvelteKit 3 routes
	// through the boundary around each +error.svelte; `page.error` covers load
	// errors.
	let { error }: { error?: App.Error } = $props();
	const shown = $derived(error ?? page.error);
	const status = $derived(page.status);
	const title = $derived(status === 404 ? "Page not found" : "Something went wrong");
</script>

<svelte:head>
	<title>{status} — M4</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main id="main-content" class="flex min-h-svh items-center justify-center p-6 md:p-10">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<p class="text-muted-foreground text-sm font-medium tracking-widest uppercase">{status}</p>
			<h1 class="text-2xl leading-snug font-medium">{title}</h1>
			<Card.Description>
				{shown?.message ?? "An unexpected error occurred."}
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if shown?.errorId}
				<div class="space-y-1">
					<p class="text-muted-foreground text-sm">Reference</p>
					<p class="font-mono text-sm font-medium">{shown.errorId}</p>
				</div>
			{/if}
			<Button href={resolve("/")} class="w-full">Back to home</Button>
		</Card.Content>
	</Card.Root>
</main>
