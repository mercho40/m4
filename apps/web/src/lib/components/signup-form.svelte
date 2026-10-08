<script lang="ts">
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Card from "#lib/components/ui/card/index.js";
	import * as Field from "#lib/components/ui/field/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import SocialButtons from "#lib/components/social-buttons.svelte";
	import { enhance, type SubmitFunction } from "$app/forms";
	import { resolve } from "$app/paths";

	// `form` is the action's return value, threaded down from +page.svelte.
	let { form }: { form?: { name?: string; email?: string; message?: string } | null } = $props();

	// Per-instance ids: hardcoded ones collide with any other form on the page
	// (login-form renders its own email/password fields) and mis-target labels.
	const id = $props.id();
	let submitting = $state(false);

	const enhanceSubmit: SubmitFunction = () => {
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			await update({ reset: false });
		};
	};
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<h1 class="text-2xl leading-snug font-medium">Create an account</h1>
		<Card.Description>Enter your information below to create your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form
			method="POST"
			action="?/signup"
			use:enhance={enhanceSubmit}
			aria-busy={submitting}
			aria-describedby={form?.message ? `signup-error-${id}` : undefined}
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
						value={form?.name ?? ""}
						aria-invalid={form?.message ? "true" : undefined}
						aria-describedby={form?.message ? `signup-error-${id}` : undefined}
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
						value={form?.email ?? ""}
						aria-invalid={form?.message ? "true" : undefined}
						aria-describedby={form?.message ? `signup-error-${id}` : undefined}
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
						aria-invalid={form?.message ? "true" : undefined}
						aria-describedby={form?.message
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
						aria-invalid={form?.message ? "true" : undefined}
						aria-describedby={form?.message ? `signup-error-${id}` : undefined}
					/>
				</Field.Field>
				{#if form?.message}
					<Field.Error id="signup-error-{id}">{form.message}</Field.Error>
				{/if}
				<Field.Group>
					<Field.Field>
						<Button type="submit" class="w-full" disabled={submitting}>
							{submitting ? "Creating account..." : "Create Account"}
						</Button>
						<SocialButtons label="Sign up with" disabled={submitting} />
						<Field.Description class="px-6 text-center">
							Already have an account? <a href={resolve("/login")} class="underline">Sign in</a>
						</Field.Description>
					</Field.Field>
				</Field.Group>
			</Field.Group>
		</form>
	</Card.Content>
</Card.Root>
