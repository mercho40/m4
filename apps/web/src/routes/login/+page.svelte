<script lang="ts">
	import { PUBLIC_API_URL } from "$app/env/public";
	import LoginForm from "#lib/components/login-form.svelte";
</script>

<svelte:head>
	<title>Log in — M4</title>
	<meta name="description" content="Log in to your M4 account." />
	<meta name="robots" content="noindex, follow" />
	<!--
		Sign-in goes straight from the browser to the API, so open that connection
		while the visitor types. No `crossorigin`: the auth client sends cookies.
	-->
	<link rel="preconnect" href={new URL(PUBLIC_API_URL).origin} />
</svelte:head>

<main id="main-content" class="flex min-h-svh items-center justify-center p-6 md:p-10">
	<LoginForm />
</main>
