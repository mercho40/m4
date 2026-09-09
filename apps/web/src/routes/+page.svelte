<script lang="ts">
	import { resolve } from "$app/paths";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import ThemeToggle from "$lib/components/theme-toggle.svelte";

	let { data } = $props();

	const description =
		"M4 is a full-stack TypeScript starter with Bun, SvelteKit, Elysia, Better Auth, Drizzle, PostgreSQL, and end-to-end typed APIs.";
	const canonicalUrl = $derived(new URL(resolve("/"), data.siteUrl).href);
	const structuredData = $derived({
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "SoftwareApplication",
				name: "M4",
				applicationCategory: "DeveloperApplication",
				operatingSystem: "Cross-platform",
				description,
				url: canonicalUrl,
				codeRepository: "https://github.com/mercho40/m4",
				programmingLanguage: ["TypeScript", "Svelte"],
				softwareRequirements: "Bun and PostgreSQL",
				isAccessibleForFree: true,
				featureList: [
					"Server-rendered SvelteKit frontend",
					"Elysia API server",
					"Better Auth authentication",
					"Drizzle ORM with PostgreSQL",
					"End-to-end typed Eden Treaty API client",
				],
			},
			{
				"@type": "FAQPage",
				mainEntity: [
					{
						"@type": "Question",
						name: "What is M4?",
						acceptedAnswer: {
							"@type": "Answer",
							text: "M4 is a full-stack TypeScript starter for authenticated web applications.",
						},
					},
					{
						"@type": "Question",
						name: "What technology does M4 include?",
						acceptedAnswer: {
							"@type": "Answer",
							text: "M4 includes Bun, SvelteKit, Elysia, Better Auth, Drizzle ORM, PostgreSQL, Tailwind CSS, and Eden Treaty.",
						},
					},
					{
						"@type": "Question",
						name: "How does M4 keep frontend and backend types aligned?",
						acceptedAnswer: {
							"@type": "Answer",
							text: "The frontend consumes the Elysia application type through Eden Treaty, giving API calls end-to-end type safety.",
						},
					},
				],
			},
		],
	});
	const structuredDataJson = $derived(JSON.stringify(structuredData).replaceAll("<", "\\u003c"));
</script>

<svelte:head>
	<title>{data.user ? "Your account — M4" : "M4 — Full-stack TypeScript starter"}</title>
	<meta name="description" content={description} />
	<meta name="robots" content={data.user ? "noindex, nofollow" : "index, follow"} />
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
	{#if !data.user}
		<script type="application/ld+json">{@html structuredDataJson}</script>
	{/if}
</svelte:head>

<main id="main-content" class="mx-auto flex min-h-svh w-full max-w-5xl flex-col justify-center gap-12 p-6 md:p-10">
	{#if data.user}
		<Card.Root class="mx-auto w-full max-w-sm">
			<Card.Header>
				<h1 class="text-2xl leading-snug font-medium">Welcome back</h1>
				<Card.Description>{data.user.name}</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-1">
					<p class="text-muted-foreground text-sm">Email</p>
					<p class="text-sm font-medium">{data.user.email}</p>
				</div>
				<form method="POST" action={resolve("/logout")}>
					<Button type="submit" variant="outline" class="w-full">Sign out</Button>
				</form>
			</Card.Content>
			<Card.Footer class="flex-col items-center gap-2">
				<ThemeToggle />
			</Card.Footer>
		</Card.Root>
	{:else}
		<div class="grid items-center gap-10 md:grid-cols-[1fr_22rem]">
			<section aria-labelledby="product-title" class="space-y-5">
				<p class="text-muted-foreground text-sm font-medium tracking-widest uppercase">Full-stack TypeScript starter</p>
				<h1 id="product-title" class="max-w-2xl text-4xl leading-tight font-semibold tracking-tight text-balance md:text-5xl">
					Ship the product, not the plumbing.
				</h1>
				<p class="text-muted-foreground max-w-2xl text-lg leading-relaxed text-pretty">{description}</p>
				<ul class="grid gap-2 text-sm sm:grid-cols-2" aria-label="Included capabilities">
					<li>Server-rendered SvelteKit 5</li>
					<li>Type-safe Elysia APIs</li>
					<li>Better Auth sessions</li>
					<li>Drizzle and PostgreSQL</li>
				</ul>
			</section>

			<Card.Root class="w-full">
				<Card.Header>
					<h2 class="text-2xl leading-snug font-medium">Get started</h2>
					<Card.Description>Sign in to continue or create an account.</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<Button href={resolve("/login")} class="w-full">Log in</Button>
					<Button href={resolve("/signup")} variant="outline" class="w-full">Sign up</Button>
				</Card.Content>
				<Card.Footer class="flex-col items-center gap-2">
					<ThemeToggle />
				</Card.Footer>
			</Card.Root>
		</div>

		<section aria-labelledby="faq-title" class="border-border space-y-6 border-t pt-10">
			<div class="max-w-2xl space-y-2">
				<h2 id="faq-title" class="text-2xl font-semibold tracking-tight">M4 at a glance</h2>
				<p class="text-muted-foreground">Direct answers for developers evaluating the starter.</p>
			</div>
			<dl class="grid gap-6 md:grid-cols-3">
				<div class="space-y-2">
					<dt class="font-medium">What is M4?</dt>
					<dd class="text-muted-foreground text-sm leading-relaxed">
						M4 is a full-stack TypeScript starter for authenticated web applications.
					</dd>
				</div>
				<div class="space-y-2">
					<dt class="font-medium">What is included?</dt>
					<dd class="text-muted-foreground text-sm leading-relaxed">
						Bun, SvelteKit, Elysia, Better Auth, Drizzle, PostgreSQL, Tailwind CSS, and Eden Treaty.
					</dd>
				</div>
				<div class="space-y-2">
					<dt class="font-medium">How are APIs type-safe?</dt>
					<dd class="text-muted-foreground text-sm leading-relaxed">
						Eden Treaty consumes the Elysia application type so frontend API calls stay aligned with the backend.
					</dd>
				</div>
			</dl>
		</section>
	{/if}
</main>
