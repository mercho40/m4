import { Elysia } from "elysia";
import { auth } from "#back/lib/auth.js";
import { cors } from "@elysiajs/cors";
import { WEB_URL } from "#back/lib/env.js";

// user middleware (compute user and session and pass to routes)
const betterAuth = new Elysia({ name: "better-auth" })
  // Scoped to Better Auth's base path, which Elysia's guide recommends: a bare
  // `.mount(auth.handler)` sends every unknown path through Better Auth too.
  // The guide's `.mount("/prefix", …)` cannot be used as written: Elysia
  // strips the prefix before Better Auth sees the request, but Better Auth
  // builds OAuth callback and email URLs from BETTER_AUTH_URL without it.
  // This is what `mount` does internally, minus the path rewrite.
  .all("/api/auth/*", ({ request }) => auth.handler(request), { parse: "none" })
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) return status(401);

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });

const app = new Elysia()
  // The browser calls the Better Auth routes directly, with its cookies.
  .use(
    cors({
      origin: WEB_URL,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      // Default is 5s, so nearly every call pays a preflight round-trip.
      maxAge: 600,
      // Default `true` echoes the request's header names back; pin it instead.
      exposeHeaders: [],
    }),
  )
  .use(betterAuth)
  .get("/health", () => ({ status: "ok", timestamp: Date.now() }))
  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

// The binary is PID 1 in its container, where SIGTERM has no default action:
// unhandled, every redeploy waits out the stop timeout and is then killed
// mid-request. Stop accepting connections, let in-flight requests finish.
process.on("SIGTERM", async () => {
  await app.stop();
  process.exit(0);
});
export type App = typeof app;
