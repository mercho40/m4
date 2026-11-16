// Before `playwright test` (the `e2e` script, which `turbo run test` leaves
// out): empties and migrates the e2e database, and builds the web app against
// the e2e API. Playwright then starts both servers (playwright.config.ts).
// Not a globalSetup: Playwright starts its webServers before running one.
import { SQL } from "bun";
import { BUILD_ENV, DATABASE_URL, ROOT } from "./env.ts";

function run(step: string, cmd: string[], options: { cwd: string; env: Record<string, string | undefined> }) {
	console.log(`e2e: ${step}`);
	const { exitCode } = Bun.spawnSync({ cmd, ...options, stdout: "inherit", stderr: "inherit" });
	if (exitCode !== 0) {
		console.error(`e2e: ${step} failed (exit ${exitCode})`);
		process.exit(exitCode ?? 1);
	}
}

const url = new URL(DATABASE_URL);
const name = decodeURIComponent(url.pathname.slice(1));
const maintenance = new URL(url);
maintenance.pathname = "/postgres";

console.log(`e2e: recreating ${name}`);
const admin = new SQL({ url: maintenance.href, max: 1 });
try {
	// The name passed env.ts's _e2e check; identifiers cannot be bound as parameters.
	await admin.unsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
	await admin.unsafe(`CREATE DATABASE "${name}"`);
} catch (error) {
	console.error(`e2e: cannot reach Postgres at ${url.host}. Locally: docker compose up -d`);
	throw error;
} finally {
	await admin.close();
}

// drizzle-kit, as production is migrated.
run("migrating", ["bunx", "drizzle-kit", "migrate"], {
	cwd: `${ROOT}apps/back`,
	env: { PATH: process.env.PATH, HOME: process.env.HOME, DATABASE_URL },
});

// Through Turborepo, so a second run with nothing changed is a cache hit.
run("building the web app", ["bunx", "turbo", "run", "build", "--filter=@repo/web", "--ui=stream"], {
	cwd: ROOT,
	env: { ...process.env, ...BUILD_ENV },
});
