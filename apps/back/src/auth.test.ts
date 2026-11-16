import { describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import { app, betterAuth } from "#back/app.js";
import { db } from "#back/db/drizzle.js";
import { apiRequest, cookiesFrom, uniqueEmail } from "#test/http.js";

const PASSWORD = "correct horse battery staple";

async function signUp(email = uniqueEmail()) {
  const response = await app.handle(
    apiRequest("POST", "/api/auth/sign-up/email", {
      body: { name: "Test Person", email, password: PASSWORD },
    }),
  );
  return { email, response };
}

describe("email and password", () => {
  // Through the real app and database: a schema the auth library cannot write
  // (as when account.issuer was NOT NULL and Better Auth stopped filling it)
  // turns sign-up into a 500 here.
  test("signs up, signs in and reads the session back", async () => {
    const { email, response: signedUp } = await signUp();
    expect(signedUp.status).toBe(200);

    const user = await db.query.user.findFirst({
      where: { email },
      with: { accounts: true },
    });
    expect(user?.accounts).toHaveLength(1);
    expect(user?.accounts[0]?.providerId).toBe("credential");
    expect(user?.accounts[0]?.password).not.toBe(PASSWORD);

    const signedIn = await app.handle(
      apiRequest("POST", "/api/auth/sign-in/email", {
        body: { email, password: PASSWORD },
      }),
    );
    expect(signedIn.status).toBe(200);

    const session = await app.handle(
      apiRequest("GET", "/api/auth/get-session", {
        cookie: cookiesFrom(signedIn),
      }),
    );
    expect(session.status).toBe(200);
    const body = (await session.json()) as { user: { id: string; email: string } };
    expect(body.user).toMatchObject({ id: user?.id, email });
  });

  test("refuses a wrong password and a second sign-up for the same address", async () => {
    const { email } = await signUp();

    const wrong = await app.handle(
      apiRequest("POST", "/api/auth/sign-in/email", {
        body: { email, password: "not the password" },
      }),
    );
    expect(wrong.status).toBe(401);
    expect(wrong.headers.getSetCookie()).toEqual([]);

    const again = await signUp(email);
    expect(again.response.status).toBe(422);
    expect(again.response.headers.getSetCookie()).toEqual([]);
  });
});

describe("the auth macro", () => {
  // No production route uses `{ auth: true }` yet, so the test mounts one on
  // the same plugin the app uses.
  const guarded = new Elysia()
    .use(betterAuth)
    .get("/me", ({ user }) => ({ id: user.id }), { auth: true });

  test("answers 401 without a session", async () => {
    const response = await guarded.handle(apiRequest("GET", "/me"));
    expect(response.status).toBe(401);
  });

  test("answers 401 to a forged session cookie", async () => {
    const response = await guarded.handle(
      apiRequest("GET", "/me", {
        cookie: "better-auth.session_token=forged.signature",
      }),
    );
    expect(response.status).toBe(401);
  });

  test("hands the handler the signed-in user", async () => {
    const { email, response } = await signUp();
    const user = await db.query.user.findFirst({ where: { email } });

    const me = await guarded.handle(
      apiRequest("GET", "/me", { cookie: cookiesFrom(response) }),
    );
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ id: user?.id });
  });
});
