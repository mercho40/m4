<script lang="ts">
	import SignupForm from "$lib/components/signup-form.svelte";

	// The action's return value, passed down so the form can show validation
	// errors and refill what the user typed.
	let { form } = $props();
</script>

<svelte:head>
	<title>Sign up — M4</title>
	<meta name="description" content="Create your M4 account." />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<main id="main-content" class="flex min-h-svh items-center justify-center p-6 md:p-10">
	<SignupForm {form} />
</main>
