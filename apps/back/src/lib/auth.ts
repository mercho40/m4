import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "#back/db/drizzle.js";
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL, COOKIE_DOMAIN, WEB_URL } from "#back/lib/env.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    // Without this the adapter issues multi-table writes unwrapped, so a failed
    // sign-up can leave an orphaned user row behind.
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  // Registered only when actually configured. The `as string` casts previously
  // here produced `client_id=undefined` redirects to a broken provider page;
  // an unregistered provider returns PROVIDER_NOT_FOUND at the API boundary.
  socialProviders: {
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  trustedOrigins: [WEB_URL],
  advanced: {
    // Joined session reads — one query instead of two on getSession.
    // Lives under advanced.database; `experimental` is stored but never read.
    database: { joins: true },
    // In production the web app and this API sit on sibling subdomains, so the
    // session cookie has to be scoped to the shared parent or the browser will
    // not send it to the web origin — which is where hooks.server.ts reads it.
    // This also keeps Safari's ITP from treating the API as a third party.
    ...(COOKIE_DOMAIN
      ? { crossSubDomainCookies: { enabled: true, domain: COOKIE_DOMAIN } }
      : {}),
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
});
