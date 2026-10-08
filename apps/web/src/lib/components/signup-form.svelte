<script lang="ts">
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import * as Field from "#lib/components/ui/field/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import SocialButtons from "#lib/components/social-buttons.svelte";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";

	// Per-instance ids: hardcoded ones collide with any other form on the page
	// (login-form renders its own email/password fields) and mis-target labels.
	const id = $props.id();
	let submitting = $state(false);
	let message = $state("");

	async function onsubmit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);

		if (data.get("password") !== data.get("confirmPassword")) {
			message = "Those passwords do not match.";
			return;
		}

		submitting = true;
		message = "";

		try {
			// Imported on submit, so the auth client is not part of the page load.
			const { authClient } = await import("#lib/auth-client.js");
			const { error } = await authClient.signUp.email({
				name: String(data.get("name")).trim(),
				email: String(data.get("email")).trim(),
				password: String(data.get("password")),
			});
			// Sign-up also signs in; rerun the loads so they see the new session.
			if (!error) return await goto(resolve("/(protected)/account"), { refreshAll: true });
			message = error.message || "That account could not be created.";
		} catch {
			message = "Could not reach the server. Try again.";
		}
		submitting = false;
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<h1 class="text-2xl leading-snug font-medium">Create an account</h1>
		<Card.Description>Enter your information below to create your account</Card.Description>
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
			aria-describedby={message ? `signup-error-${id}` : undefined}
		>
			<Field.Group>
				<Field.Field>
					<Field.Label for="name-{id}">Full Name</Field.Label>
					<Input
						id="name-{id}"
						name="name"
						type="text"
						autocomplete="name"
						placeholder="John Doe"
						required
						aria-invalid={message ? "true" : undefined}
						aria-describedby={message ? `signup-error-${id}` : undefined}
					/>
				</Field.Field>
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
						aria-describedby={message ? `signup-error-${id}` : undefined}
					/>
				</Field.Field>
				<Field.Field>
					<Field.Label for="password-{id}">Password</Field.Label>
					<Input
						id="password-{id}"
						name="password"
						type="password"
						autocomplete="new-password"
						minlength={8}
						required
						aria-invalid={message ? "true" : undefined}
						aria-describedby={message
							? `password-description-${id} signup-error-${id}`
							: `password-description-${id}`}
					/>
					<Field.Description id="password-description-{id}">Must be at least 8 characters long.</Field.Description>
				</Field.Field>
				<Field.Field>
					<Field.Label for="confirm-password-{id}">Confirm Password</Field.Label>
					<Input
						id="confirm-password-{id}"
						name="confirmPassword"
						type="password"
						autocomplete="new-password"
						minlength={8}
						required
						aria-invalid={message ? "true" : undefined}
						aria-describedby={message ? `signup-error-${id}` : undefined}
					/>
				</Field.Field>
				{#if message}
					<Field.Error id="signup-error-{id}">{message}</Field.Error>
				{/if}
				<Field.Group>
					<Field.Field>
						<Button type="submit" class="w-full" disabled={submitting}>
							{submitting ? "Creating account..." : "Create Account"}
						</Button>
						<SocialButtons label="Sign up with" bind:busy={submitting} onerror={(text: string) => (message = text)} />
						<Field.Description class="px-6 text-center">
							Already have an account? <a href={resolve("/login")} class="underline">Sign in</a>
						</Field.Description>
					</Field.Field>
				</Field.Group>
			</Field.Group>
		</form>
	</Card.Content>
</Card.Root>
