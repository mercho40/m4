import adapter from "@sveltejs/adapter-vercel";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
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
		alias: {
			"@back/*": "../back/src/*",
		},
		experimental: {
			// Wraps route components in an error boundary so an error thrown while
			// rendering shows +error.svelte instead of a bare 500. Available since
			// SvelteKit 2.54.
			handleRenderingErrors: true,
		},
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
