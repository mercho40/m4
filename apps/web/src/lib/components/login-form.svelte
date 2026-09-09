<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription,
		FieldError,
	} from "$lib/components/ui/field/index.js";
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";

	// `form` is the action's return value, threaded down from +page.svelte.
	let { form }: { form?: { email?: string; message?: string } | null } = $props();

	const id = $props.id();
	let submitting = $state(false);

	// `use:enhance` is SvelteKit's own API for progressive enhancement — the one
	// place `use:` is still correct in Svelte 5. Without JavaScript the form
	// still posts natively; this only removes the full-page reload.
	const enhanceSubmit = () => {
		submitting = true;
		return async ({ update }: { update: (opts?: { reset?: boolean }) => Promise<void> }) => {
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
			<FieldGroup>
				<Field>
					<FieldLabel for="email-{id}">Email</FieldLabel>
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
				</Field>
				<Field>
					<div class="flex items-center">
						<FieldLabel for="password-{id}">Password</FieldLabel>
						<!-- <a href="/forgot-password" class="ms-auto inline-block text-sm underline"> -->
						<!-- 	Forgot your password? -->
						<!-- </a> -->
					</div>
					<Input
						id="password-{id}"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						aria-invalid={form?.message ? "true" : undefined}
						aria-describedby={form?.message ? `login-error-${id}` : undefined}
					/>
				</Field>
				{#if form?.message}
					<FieldError id="login-error-{id}">{form.message}</FieldError>
				{/if}
				<Field>
					<Button type="submit" class="w-full" disabled={submitting}>
						{submitting ? "Logging in..." : "Login"}
					</Button>
					<!--
						`formaction` retargets these submits at the social action without
						nesting a second <form>, and `formnovalidate` skips the email and
						password `required` checks, which do not apply to this path.
					-->
					<Button
						type="submit"
						formaction="?/social"
						formnovalidate
						name="provider"
						value="google"
						variant="outline"
						class="w-full"
						disabled={submitting}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
								fill="currentColor"
							/>
						</svg>
						Login with Google
					</Button>
					<Button
						type="submit"
						formaction="?/social"
						formnovalidate
						name="provider"
						value="github"
						variant="outline"
						class="w-full"
						disabled={submitting}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path
								d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
							/>
						</svg>
						Login with GitHub
					</Button>
					<FieldDescription class="text-center">
						Don't have an account? <a href={resolve("/signup")} class="underline">Sign up</a>
					</FieldDescription>
				</Field>
			</FieldGroup>
		</form>
	</Card.Content>
</Card.Root>
