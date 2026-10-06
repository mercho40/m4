import adapter from "@sveltejs/adapter-vercel";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		tailwindcss(),
		// SvelteKit 3 takes its configuration here rather than in svelte.config.js.
		// Options that aren't SvelteKit's own are forwarded to vite-plugin-svelte.
		sveltekit({
			// Deployed to Vercel as serverless functions.
			//
			// `runtime` is marked deprecated upstream, but it is required here: the
			// adapter infers the default from the *local* Node version, and this
			// machine runs Node 26, which is outside its supported set [20, 22, 24].
			// Without it, `bun run build` fails locally and in CI even though the
			// Vercel build itself would succeed. Keep the Vercel project's Node
			// version on 24 so the two agree. Drop this once the adapter reads the
			// runtime from Vercel project config.
			adapter: adapter({ runtime: "nodejs24.x" }),
			dynamicCompileOptions: ({ filename }) =>
				filename.includes("node_modules") ? undefined : { runes: true },
		}),
	],
});
