// Preloaded into every test run (bunfig.toml), before any app module loads,
// so src/lib/env.ts validates the values settled here.
import { baseTestUrl, recreateDatabase, workerUrl } from "#test/database.js";
import { TEST_ENV, TEST_UNSET } from "#test/env.js";

// bun test sets NODE_ENV=test unless the shell already set something else.
// Better Auth reads it at import to relax its own checks (rate limits off).
if (process.env.NODE_ENV !== "test") {
	throw new Error(`NODE_ENV is "${process.env.NODE_ENV}"; the API tests only run with NODE_ENV=test`);
}

for (const name of TEST_UNSET) delete process.env[name];
Object.assign(process.env, TEST_ENV);

// Unset in a serial run; 1..N under --parallel=N. Each worker gets a database
// of its own, rebuilt from the migrations once per worker process: the marker
// keeps a second preload in the same process (a file under --isolate) from
// dropping the database the first one's connections still use.
const worker = Number(process.env.BUN_TEST_WORKER_ID ?? 1);
const url = workerUrl(baseTestUrl(TEST_ENV.DATABASE_URL), worker);
if (process.env.M4_TEST_DATABASE !== url.href) {
	await recreateDatabase(url);
	process.env.M4_TEST_DATABASE = url.href;
}
process.env.DATABASE_URL = url.href;
