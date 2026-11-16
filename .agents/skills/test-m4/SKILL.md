---
name: test-m4
description: Prove a change in the running app, in a browser, as a freshly signed-up user and as a visitor who is signed out. Use for every change a person can see or click in apps/web, or that changes sign-in, sessions or an API route the web app calls, before review-loop and before calling the work done; also when asked to run, try or screenshot m4.
---

# Test m4

Written after T3 Code's `test-t3-app` skill. Green tests do not prove a screen works. Look at the change in the real
app, signed in and signed out, and say what you saw. The PR names what you could not check.

## Start the app

1. **Env.** `apps/back/.env` and `apps/web/.env` must exist. If one is missing, copy its `.env.example`, set
   `DATABASE_URL=postgresql://m4:m4@localhost:5432/m4` in the API's, and give both the same `BETTER_AUTH_SECRET`
   (`openssl rand -base64 32`). Never overwrite an existing `.env`: it is the developer's.
2. **Database.** `docker compose up -d` (Postgres on 5432), then `bun run db:migrate`. Never drop or reset the local
   database without asking: it may hold the developer's data.
3. **Ports.** The API is on 3000 and the web app on 3001, and other worktrees and the developer use them too. Run
   `ss -H -ltnp` first. A dev server from this worktree (`/proc/<pid>/cwd`) you may reuse; one from another checkout
   is not your code: ask, never kill it.
4. **Dev.** `bun run dev` in the background, keeping its PID, and wait until `http://localhost:3000/health` answers
   and `http://localhost:3001` loads.

## Walk it

Use the harness's browser: T3 Code's preview tools, Claude in Chrome, or the `agent-browser` CLI. `bun run e2e`
(Playwright) checks the flow automatically; it does not replace looking at the change.

1. **Signed out.** `/` shows the landing page. `/account` sends you to `/login`.
2. **Sign up** at `/signup` with a fresh random address (`m4-test-<random>@example.com`) and a password of at least 8
   characters. No email is sent: sign-up signs you in and lands on `/account`, which shows that address.
3. **Signed in.** `/` sends you to `/account`. Reload `/account`: the session holds.
4. **Sign out** on `/account`: back on `/`, and `/account` sends you to `/login` again.
5. **Sign in** at `/login` with the same address and password: back on `/account`.

Then the change itself, signed in and signed out where it applies, and the paths around it, not only the one you
changed.

- **Widths.** A phone's (390 px) and a laptop's. There is one dark theme and one language.
- For a visible change, take before and after screenshots for the PR. Upload them to the PR; never commit them.

## Stop

Stop what you started, by the PID you kept, unless the user wants to look. Leave the test users in the local database.
Report what you looked at, signed in or out, at which widths, and what you could not check (social sign-in without
provider credentials, cookies across real subdomains, anything only production has).
