import { mkdirSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { API_ENV, API_URL, LOGS, ROOT, WEB_ENV, WEB_URL } from "./env.ts";

// The whole stack, as close to production as a laptop gets: the API from its
// source and the web app's production build (setup.ts) as a Worker, under
// `wrangler dev` (workerd, the runtime production runs it on),
// on ports of their own so a running `bun run dev` is never reused or
// disturbed. `bun run e2e` from the repository root runs setup.ts first.

const CI = Boolean(process.env.CI);

/** A server's output goes to .logs/<name>.log. */
mkdirSync(LOGS, { recursive: true });
const logTo = (name: string) => `> "${LOGS}${name}.log" 2>&1`;

const quiet = { FORCE_COLOR: "0", NO_COLOR: "1" };

export default defineConfig({
	testDir: "tests",
	testMatch: "*.e2e.ts",
	workers: 1,
	forbidOnly: CI,
	retries: 0,
	reporter: [["list"]],
	use: {
		baseURL: WEB_URL,
		trace: "retain-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: [
		{
			command: `bun --no-env-file src/index.ts ${logTo("api")}`,
			cwd: `${ROOT}apps/back`,
			url: `${API_URL}/health`,
			env: { ...quiet, ...API_ENV },
			reuseExistingServer: false,
			gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
			timeout: 30_000,
		},
		{
			// A Worker's environment is its vars and secrets, not the process's:
			// WEB_ENV goes in as --var, and apps/web/.env (a developer's own
			// values, which wrangler dev would otherwise load) is left out.
			command: [
				"bunx wrangler dev .svelte-kit/cloudflare/_worker.js",
				`--port ${new URL(WEB_URL).port}`,
				...Object.entries(WEB_ENV).map(([name, value]) => `--var ${name}:${value}`),
				logTo("web"),
			].join(" "),
			cwd: `${ROOT}apps/web`,
			url: WEB_URL,
			env: { ...quiet, CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false", WRANGLER_SEND_METRICS: "false" },
			reuseExistingServer: false,
			gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
			timeout: 30_000,
		},
	],
});
