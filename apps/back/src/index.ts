import { app } from "#back/app.js";

// `||`, not `??`: an empty `PORT=` (as in .env.example) arrives as "".
app.listen(Number(process.env.PORT) || 3000);

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

export type { App } from "#back/app.js";
