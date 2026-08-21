import { Elysia } from "elysia";
import { auth } from "@back/lib/auth";
import { cors } from "@elysiajs/cors";
import { WEB_URL } from "@back/lib/env";

// user middleware (compute user and session and pass to routes)
const betterAuth = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
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
  .use(betterAuth)
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
  .get("/health", () => ({ status: "ok", timestamp: Date.now() }))
  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
export type App = typeof app 
