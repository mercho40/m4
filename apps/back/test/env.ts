// The environment the API sees under test. test/setup.ts assigns these rather
// than defaulting to them, and the `test` script passes --no-env-file, so
// neither apps/back/.env nor an exported shell variable reaches a test.
// Test-only values matching docker-compose.yml; nothing here is a secret, so
// never reuse one elsewhere.
export const TEST_ENV = {
	// Another server or credentials: set TEST_DATABASE_URL. The name must still
	// end in _test (test/database.ts).
	DATABASE_URL: process.env.TEST_DATABASE_URL || "postgresql://m4:m4@localhost:5432/m4_test",
	BETTER_AUTH_SECRET: "test-only-secret-not-used-outside-the-test-suite",
	BETTER_AUTH_URL: "http://localhost:3000",
	WEB_URL: "http://localhost:3001",
} as const;

/**
 * Read by the API, and removed for tests so a developer's shell cannot change
 * the configuration under test: no social providers, no cross-subdomain cookie.
 */
export const TEST_UNSET = [
	"COOKIE_DOMAIN",
	"GITHUB_CLIENT_ID",
	"GITHUB_CLIENT_SECRET",
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"PORT",
] as const;
