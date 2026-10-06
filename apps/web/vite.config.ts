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
			// `runtime` is pinned because the adapter otherwise picks the Node
			// version running the build, and only accepts 22 or 24. On Vercel that
			// is the project's Node setting, but this machine runs Node 26, so
			// `bun run build` fails locally without the pin. Keep the Vercel project
			// on Node 24 so the two agree.
			adapter: adapter({ runtime: "nodejs24.x" }),
			dynamicCompileOptions: ({ filename }) =>
				filename.includes("node_modules") ? undefined : { runes: true },
		}),
	],
});
