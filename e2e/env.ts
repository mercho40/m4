// The end-to-end stack, shared by setup.ts (Bun) and playwright.config.ts and
// the tests (Node, through Playwright): the API and the web app on ports of
// their own (3070 and 3071), apart from `bun run dev`'s 3000 and 3001, over a
// database of their own, rebuilt on every run. Test-only values, nothing
// secret: never reuse one elsewhere.
import { fileURLToPath } from "node:url";

export const API_URL = "http://localhost:3070";
export const WEB_URL = "http://localhost:3071";

/**
 * Rebuilt on every run, so its name must end in _e2e: `bun run e2e` can never
 * empty a development database. Another server or credentials: set
 * E2E_DATABASE_URL.
 */
export const DATABASE_URL = process.env.E2E_DATABASE_URL || "postgresql://m4:m4@localhost:5432/m4_e2e";
if (!/_e2e$/.test(new URL(DATABASE_URL).pathname)) throw new Error("the e2e database's name must end in _e2e");

const SECRET = "e2e-only-secret-not-used-outside-the-e2e-suite";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
/** Where the servers write their output. */
export const LOGS = fileURLToPath(new URL(".logs/", import.meta.url));

/**
 * The API's whole environment (apps/back/src/lib/env.ts), passed instead of
 * apps/back/.env (`--no-env-file`); the empty ones blank whatever a
 * developer's shell exports. The source, in development mode, as `bun run dev`
 * runs it.
 */
export const API_ENV = {
	NODE_ENV: "development",
	DATABASE_URL,
	BETTER_AUTH_SECRET: SECRET,
	BETTER_AUTH_URL: API_URL,
	WEB_URL,
	COOKIE_DOMAIN: "",
	GITHUB_CLIENT_ID: "",
	GITHUB_CLIENT_SECRET: "",
	GOOGLE_CLIENT_ID: "",
	GOOGLE_CLIENT_SECRET: "",
	PORT: new URL(API_URL).port,
};

/**
 * The web app's build-time values (apps/web/src/env.ts), over whatever the
 * shell or apps/web/.env holds. Both PUBLIC_* ones, so Turborepo, which hashes
 * them, finds the same build again on the next run.
 */
export const BUILD_ENV = {
	PUBLIC_API_URL: API_URL,
	PUBLIC_SITE_URL: WEB_URL,
};

/** The web app's runtime values: the Worker's vars (playwright.config.ts). */
export const WEB_ENV = {
	BETTER_AUTH_SECRET: SECRET,
	PUBLIC_SITE_URL: WEB_URL,
};
