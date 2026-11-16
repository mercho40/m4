import config from "@repo/eslint-config/svelte";
import { defineConfig } from "eslint/config";

export default defineConfig(config, {
	// shadcn-svelte's components, kept as the registry writes them. Button
	// renders whatever `href` its caller passes, and the callers are linted.
	files: ["src/lib/components/ui/**"],
	rules: { "svelte/no-navigation-without-resolve": "off" },
});
