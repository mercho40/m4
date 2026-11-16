import adapter from "@sveltejs/adapter-cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		tailwindcss(),
		// SvelteKit 3 takes its configuration here rather than in svelte.config.js.
		// Options that aren't SvelteKit's own are forwarded to vite-plugin-svelte.
		sveltekit({
			// Deployed to Cloudflare Workers (wrangler.jsonc, which also places
			// it next to the API).
			adapter: adapter(),
			// The app's one stylesheet is small, so it goes inline in the HTML,
			// saving a render-blocking request on first load. The trade: every page
			// carries it and the browser cannot cache it separately. Past this size
			// SvelteKit goes back to a <link>.
			inlineStyleThreshold: 50_000,
			compilerOptions: {
				// Force runes mode for the project, except for libraries.
				runes: ({ filename }) => (filename.split(/[/\\]/).includes("node_modules") ? undefined : true),
			},
		}),
	],
	// `bun run test`: plain modules in Node. Vitest runs in mode "test", so
	// .env.test (committed) fills in the env modules whatever a developer's .env
	// says. A test without an assertion fails.
	test: {
		expect: { requireAssertions: true },
		environment: "node",
		include: ["src/**/*.{test,spec}.{js,ts}"],
	},
});
