// Required environment, validated once at import time.
//
// Non-null assertions (`process.env.X!`) only silence the type checker — at
// runtime a missing variable still arrives as `undefined`, and consumers treat
// that as "unset" rather than failing. @elysiajs/cors, for one, falls back to
// `origin: true` (= "*"), quietly widening CORS instead of erroring.
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required but was not set`);
  return value;
}

export const DATABASE_URL = required("DATABASE_URL");
export const BETTER_AUTH_SECRET = required("BETTER_AUTH_SECRET");
export const BETTER_AUTH_URL = required("BETTER_AUTH_URL");
export const WEB_URL = required("WEB_URL");

// Optional. Set to the shared parent domain in production (e.g. "example.com")
// when the web app and this API run on sibling subdomains, so the session
// cookie is visible to both. Leave unset in development, where both run on
// localhost and cookies are already shared across ports.
export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
