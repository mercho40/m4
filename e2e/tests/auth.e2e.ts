import { expect, test } from "@playwright/test";

const PASSWORD = "correct horse battery staple";

test("signs up, lands on /account, signs out back to /", async ({ page }) => {
	const email = `${crypto.randomUUID()}@example.test`;

	// /signup is prerendered and signs up from the browser: wait for the page to
	// settle so the form is hydrated before it is submitted.
	await page.goto("/signup", { waitUntil: "networkidle" });
	await page.getByLabel("Full Name").fill("E2E Person");
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
	await page.getByLabel("Confirm Password").fill(PASSWORD);
	await page.getByRole("button", { name: "Create Account" }).click();

	await expect(page).toHaveURL("/account");
	await expect(page.getByText(email)).toBeVisible();

	await page.getByRole("button", { name: "Sign out" }).click();
	await expect(page).toHaveURL("/");
	await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();

	// Signed out on the server too: the protected route sends the visitor away.
	await page.goto("/account");
	await expect(page).toHaveURL("/login");
});
