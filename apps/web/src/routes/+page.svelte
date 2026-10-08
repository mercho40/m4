<script lang="ts">
	import { resolve } from "$app/paths";
	import { Button } from "#lib/components/ui/button/index.js";

	let { data } = $props();

	// One source of truth: this string is the meta description, the JSON-LD
	// description and the visible copy, so structured data cannot drift from
	// what a visitor actually sees.
	const description = "A full-stack TypeScript starter: SvelteKit, Elysia, Better Auth, and Drizzle.";
	const canonicalUrl = $derived(new URL(resolve("/"), data.siteUrl).href);
	const structuredData = $derived({
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: "M4",
		applicationCategory: "DeveloperApplication",
		operatingSystem: "Cross-platform",
		description,
		url: canonicalUrl,
		codeRepository: "https://github.com/mercho40/m4",
		isAccessibleForFree: true,
	});
	const structuredDataJson = $derived(JSON.stringify(structuredData).replaceAll("<", "\\u003c"));
</script>

<svelte:head>
	<title>M4 — Full-stack TypeScript starter</title>
	<meta name="description" content={description} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="M4" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:title" content="M4 — Full-stack TypeScript starter" />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="M4 — Full-stack TypeScript starter" />
	<meta name="twitter:description" content={description} />
	<!--
		Svelte treats a <script> element's content as raw text, so `{@html}` inside
		one ships literally. The whole element goes through `{@html}` instead; the
		`<` escaping above keeps the JSON from closing it early.
	-->
	{@html `<script type="application/ld+json">${structuredDataJson}</` + `script>`}
</svelte:head>

<main id="main-content" class="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-10 px-6 py-16">
	<div class="space-y-4">
		<h1 class="text-5xl font-bold tracking-tight md:text-6xl">
			M4<span class="text-muted-foreground ml-1 align-middle font-mono text-base font-normal md:text-lg"
				>[starter]</span
			>
		</h1>
		<p class="text-muted-foreground text-lg">
			{description}
		</p>
	</div>

	<!--
		The bordered panel is lakebed.dev's device: a mono label on the left, the
		action on the right. It gives the call to action enough weight to balance
		the wordmark, which two bare buttons did not.
	-->
	<div class="border-border flex flex-wrap items-center justify-between gap-4 rounded-lg border px-5 py-4">
		<p class="font-mono text-sm">Sign in to the demo</p>
		<div class="flex gap-2">
			<Button href={resolve("/login")} size="lg">Log in</Button>
			<Button href={resolve("/signup")} variant="outline" size="lg">Sign up</Button>
		</div>
	</div>

	<!--
		Addressed to coding agents, the way lakebed.dev points at its agents.md.
		/llms.txt is already served and prerendered; this makes it discoverable
		to a reader rather than only to something parsing robots.txt.
	-->
	<p class="text-muted-foreground text-sm">
		Agents: read <a href="/llms.txt" class="text-foreground underline underline-offset-4">/llms.txt</a>, then sign up
		above.
	</p>

	<div class="space-y-4">
		<hr class="border-border" />
		<p class="text-muted-foreground text-xs">
			<a
				href="https://github.com/mercho40/m4"
				class="underline underline-offset-4"
				rel="noreferrer">Source</a
			>
		</p>
	</div>
</main>
