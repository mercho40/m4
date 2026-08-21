import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@back/db/drizzle";
import { BETTER_AUTH_URL, WEB_URL } from "@back/lib/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    // Without this the adapter issues multi-table writes unwrapped, so a failed
    // sign-up can leave an orphaned user row behind.
    transaction: true,
  }),
  // Telemetry is opt-in in Better Auth (default off); kept explicit as
  // belt-and-braces. Note it does not override BETTER_AUTH_TELEMETRY=1.
  telemetry: { enabled: false },
  emailAndPassword: {
    enabled: true,
  },
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
  // Joined session reads — one query instead of two on getSession.
  // Lives under advanced.database; `experimental` is stored but never read.
  advanced: { database: { joins: true } },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
});
