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
export const BETTER_AUTH_URL = required("BETTER_AUTH_URL");
export const WEB_URL = required("WEB_URL");
