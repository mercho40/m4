import svelte from "eslint-plugin-svelte";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import base from "./base.js";

// AGENTS.md's import rules for the SvelteKit app. A package that sets
// no-restricted-imports again spreads these into its own.
export const restrictedImports = {
	paths: [{ name: "@lucide/svelte", message: "Import each icon on its own: @lucide/svelte/icons/<name>." }],
	patterns: [
		{ group: ["$env/*"], message: "Declare it in src/env.ts and import it from $app/env/public or $app/env/private." },
		{ group: ["$lib", "$lib/*"], message: "There is no $lib: import from #lib/<file>.js." },
	],
};

export default defineConfig(
	base,
	svelte.configs.recommended,
	{
		files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
		languageOptions: {
			parserOptions: { parser: tseslint.parser, extraFileExtensions: [".svelte"] },
		},
	},
	{
		rules: { "no-restricted-imports": ["error", restrictedImports] },
	},
);
