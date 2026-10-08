<script lang="ts">
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import * as Field from "#lib/components/ui/field/index.js";
	import SocialButtons from "#lib/components/social-buttons.svelte";
	import { enhance, type SubmitFunction } from "$app/forms";
	import { resolve } from "$app/paths";

	// `form` is the action's return value, threaded down from +page.svelte.
	let { form }: { form?: { email?: string; message?: string } | null } = $props();

	const id = $props.id();
	let submitting = $state(false);

	// `use:enhance` is SvelteKit's own API for progressive enhancement — the one
	// place `use:` is still correct in Svelte 5. Without JavaScript the form
	// still posts natively; this only removes the full-page reload.
	const enhanceSubmit: SubmitFunction = () => {
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			// Keep what the user typed on a failed attempt.
			await update({ reset: false });
		};
	};
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<h1 class="text-2xl leading-snug font-medium">Log in</h1>
		<Card.Description>Enter your email below to log in to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form
			method="POST"
			action="?/login"
			use:enhance={enhanceSubmit}
			aria-busy={submitting}
			aria-describedby={form?.message ? `login-error-${id}` : undefined}
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
						value={form?.email ?? ""}
						aria-invalid={form?.message ? "true" : undefined}
						aria-describedby={form?.message ? `login-error-${id}` : undefined}
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
						aria-invalid={form?.message ? "true" : undefined}
						aria-describedby={form?.message ? `login-error-${id}` : undefined}
					/>
				</Field.Field>
				{#if form?.message}
					<Field.Error id="login-error-{id}">{form.message}</Field.Error>
				{/if}
				<Field.Field>
					<Button type="submit" class="w-full" disabled={submitting}>
						{submitting ? "Logging in..." : "Login"}
					</Button>
					<SocialButtons label="Login with" disabled={submitting} />
					<Field.Description class="text-center">
						Don't have an account? <a href={resolve("/signup")} class="underline">Sign up</a>
					</Field.Description>
				</Field.Field>
			</Field.Group>
		</form>
	</Card.Content>
</Card.Root>
