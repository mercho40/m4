// Requests as the browser on the web app's origin sends them to the API.
import { TEST_ENV } from "#test/env.js";

interface Options {
  cookie?: string;
  body?: unknown;
}

export function apiRequest(
  method: string,
  path: string,
  options: Options = {},
): Request {
  const headers = new Headers({ origin: TEST_ENV.WEB_URL });
  if (options.cookie) headers.set("cookie", options.cookie);
  let body: string | undefined;
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }
  return new Request(new URL(path, TEST_ENV.BETTER_AUTH_URL).href, {
    method,
    headers,
    body,
  });
}

/** The `name=value; …` Cookie header a browser would send after these responses. */
export function cookiesFrom(...responses: Response[]): string {
  const jar = new Map<string, string>();
  for (const response of responses) {
    for (const raw of response.headers.getSetCookie()) {
      const pair = raw.split(";")[0] ?? "";
      const at = pair.indexOf("=");
      if (at > 0) jar.set(pair.slice(0, at).trim(), pair.slice(at + 1));
    }
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

/** A fresh address, so tests never collide on the unique email. */
export function uniqueEmail(): string {
  return `${crypto.randomUUID()}@example.test`;
}
