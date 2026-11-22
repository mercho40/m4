// What a test database is, and the copy each `bun test --parallel` worker gets.
import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";

const TEST_NAME = /_test(_\d+)?$/;

export function databaseName(url: URL): string {
	return decodeURIComponent(url.pathname.slice(1));
}

/**
 * The base test database. Throws unless its name ends in _test, so a value
 * aimed at a real database stops the run before anything connects.
 */
export function baseTestUrl(raw: string): URL {
	const url = new URL(raw);
	if (!/_test$/.test(databaseName(url))) {
		throw new Error(`Refusing to run tests against "${databaseName(url)}": the name must end in _test`);
	}
	return url;
}

/** m4_test_1, m4_test_2 and so on: one per worker. */
export function workerUrl(base: URL, worker: number): URL {
	const url = new URL(base);
	url.pathname = `/${databaseName(base)}_${worker}`;
	if (!TEST_NAME.test(databaseName(url))) {
		throw new Error(`not a test database: ${databaseName(url)}`);
	}
	return url;
}

// Identifiers cannot be bound as parameters; these names passed the _test check.
const quoted = (name: string) => `"${name.replaceAll('"', '""')}"`;

/**
 * Drops and recreates the database `url` names, on the same server, then
 * applies every migration with the runtime migrator. Each run starts from the
 * migrations as they are now, which is also the test that they apply cleanly
 * from nothing.
 */
export async function recreateDatabase(url: URL): Promise<void> {
	const name = databaseName(url);
	if (!TEST_NAME.test(name)) throw new Error(`not a test database: ${name}`);

	const maintenance = new URL(url);
	maintenance.pathname = "/postgres";
	const admin = new SQL({ url: maintenance.href, max: 1 });
	try {
		await admin.unsafe(`DROP DATABASE IF EXISTS ${quoted(name)} WITH (FORCE)`);
	} catch (error) {
		console.error(`Cannot reach Postgres at ${url.host}. Locally: docker compose up -d`);
		throw error;
	}
	await admin.unsafe(`CREATE DATABASE ${quoted(name)}`);
	await admin.close();

	const db = drizzle({ connection: { url: url.href, max: 1 } });
	await migrate(db, {
		migrationsFolder: new URL("../migrations", import.meta.url).pathname,
	});
	await db.$client.close();
}
