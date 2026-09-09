<script lang="ts">
	import LoginForm from "$lib/components/login-form.svelte";

	// The action's return value, passed down so the form can show validation
	// errors and refill what the user typed.
	let { form } = $props();
</script>

<svelte:head>
	<title>Log in — M4</title>
	<meta name="description" content="Log in to your M4 account." />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<main id="main-content" class="flex min-h-svh items-center justify-center p-6 md:p-10">
	<LoginForm {form} />
</main>
