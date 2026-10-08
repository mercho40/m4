<script lang="ts">
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import * as Field from "#lib/components/ui/field/index.js";
	import SocialButtons from "#lib/components/social-buttons.svelte";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";

	const id = $props.id();
	let submitting = $state(false);
	let message = $state("");

	async function onsubmit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		submitting = true;
		message = "";

		try {
			// Imported on submit, so the auth client is not part of the page load.
			const { authClient } = await import("#lib/auth-client.js");
			const { error } = await authClient.signIn.email({
				email: String(data.get("email")).trim(),
				password: String(data.get("password")),
			});
			// The API has set the session cookie; rerun the loads so they see it.
			if (!error) return await goto(resolve("/(protected)/account"), { refreshAll: true });
			message = error.message || "That email and password combination is not correct.";
		} catch {
			message = "Could not reach the server. Try again.";
		}
		submitting = false;
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<h1 class="text-2xl leading-snug font-medium">Log in</h1>
		<Card.Description>Enter your email below to log in to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<!--
			`method="POST"` only matters before hydration: a submit then posts to this
			page instead of falling back to GET, which would put the password in the URL.
		-->
		<form
			method="POST"
			{onsubmit}
			aria-busy={submitting}
			aria-describedby={message ? `login-error-${id}` : undefined}
		>
			<Field.Group>
				<Field.Field>
					<Field.Label for="email-{id}">Email</Field.Label>
					<Input
						id="email-{id}"
						name="email"
						type="email"
						autocomplete="username"
						placeholder="m@example.com"
						required
						aria-invalid={message ? "true" : undefined}
						aria-describedby={message ? `login-error-${id}` : undefined}
					/>
				</Field.Field>
				<Field.Field>
					<Field.Label for="password-{id}">Password</Field.Label>
					<Input
						id="password-{id}"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						aria-invalid={message ? "true" : undefined}
						aria-describedby={message ? `login-error-${id}` : undefined}
					/>
				</Field.Field>
				{#if message}
					<Field.Error id="login-error-{id}">{message}</Field.Error>
				{/if}
				<Field.Field>
					<Button type="submit" class="w-full" disabled={submitting}>
						{submitting ? "Logging in..." : "Login"}
					</Button>
					<SocialButtons label="Login with" bind:busy={submitting} onerror={(text: string) => (message = text)} />
					<Field.Description class="text-center">
						Don't have an account? <a href={resolve("/signup")} class="underline">Sign up</a>
					</Field.Description>
				</Field.Field>
			</Field.Group>
		</form>
	</Card.Content>
</Card.Root>
