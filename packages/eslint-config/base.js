import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

// Shared by every workspace. Formatting is `bun fmt`'s job: nothing here is
// stylistic.
export default defineConfig(
	globalIgnores([
		"**/node_modules/",
		"**/.svelte-kit/",
		"**/.svelte-check/",
		"**/.wrangler/",
		"**/build/",
		"**/coverage/",
		// Playwright's reports and traces (e2e/).
		"**/playwright-report/",
		"**/test-results/",
		// The compiled API binary and its source map.
		"apps/back/server",
		"apps/back/server.map",
	]),
	js.configs.recommended,
	tseslint.configs.recommended,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// TypeScript already checks for undefined names, and this rule misreads
			// type-only globals such as SvelteKit's `App` namespace.
			"no-undef": "off",
			// `bun fmt` prints every semicolon and breaks a long chain before a
			// computed access, which this rule, written for code that leans on
			// semicolon insertion, refuses.
			"no-unexpected-multiline": "off",
			"@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
		},
	},
);
