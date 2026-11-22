# AGENTS.md

Guidance for AI coding agents working in this repository.

This is the canonical instructions file, read by any harness following the
`AGENTS.md` convention (`CLAUDE.md` only imports it).

## How we like to work

Simple systems, the smallest change that makes the behaviour obvious. Don't keep
complexity because it exists, and don't add machinery because it looks
thorough. Fight scope creep; do what was asked, well.

The rest of this file is good defaults, not law. The developer's instructions
win. If a rule here fights the task, say so before breaking it.

## Every change

1. Branch from `main` as `<type>/<summary>`.
2. Make the smallest change, and run the checks of what you touched
   (`bun run check`, and `bun run build` when the build could break).
3. Walk "Hit every surface" below.
4. Prove it. Anything a person sees or clicks, and any change to sign-in,
   sessions or an API route the web app calls, gets a look in a browser: the
   `test-m4` skill.
5. Review it with the `review-loop` skill before you open a PR or push new work
   to one, whether or not you were asked (`council` instead when the user asks
   for one). It writes the description's review line; without it, or a
   `Not reviewed: <why>`, PR checks fail.
6. File the PR with the `file-pr` skill, and fix what CI reports. `full-send`
   takes all of this to a merged PR, `full-stop` to one ready to merge. Finish
   someone else's work with `takeover`, which keeps their credit; bring an old
   PR up to date with `modernize`.

## Hit every surface

A change that works on the path you tried can be missing everywhere else.
Before calling it done:

- **Both apps.** An API change reaches the web app through Treaty types and
  through `hooks.server.ts`; a web change may need an API route, CORS or a
  cookie setting.
- **Signed in and signed out**, and a session that lapsed (the cookie cache's
  15 minutes) or was revoked.
- **Widths.** A phone and a laptop.
- **The way back.** If you added a way in, add the way out and the way to see
  it.
- **Local and production.** Cookies behave differently on `localhost` than on
  two subdomains ("Deployment").

## Commands

```bash
docker compose up -d     # Local Postgres 18 (user, password and database `m4`)
bun run db:migrate       # Apply migrations (db:generate, db:studio likewise)
bun run dev              # Both apps, via Turbo
bun run check            # Format check, then lint, types and tests of what changed since origin/main
bun run lint             # ESLint, every workspace
bun run check-types
bun run test             # apps/back on real Postgres, apps/web with Vitest
bun run e2e              # Playwright, its own servers and database (e2e/)
bun run format:fix       # bun fmt, writes
bun run build
```

`bun scripts/setup-worktree.ts` readies a new git worktree (links the main
checkout's `.env` files, installs); T3 Code runs it on its own (`t3.json`).

Never `drizzle-kit push` or `pull`: every schema change goes through
`db:generate` and a committed migration.

## Architecture

Bun monorepo with Turborepo. Two apps (`apps/back`, `apps/web`), one shared
package (`packages/eslint-config`), and the Playwright suite in `e2e/`.

Every dependency's version lives once, in the root `package.json`'s
`workspaces.catalog`; workspaces write `"catalog:"`. Root `bunfig.toml` refuses
releases younger than 3 days (`minimumReleaseAge`; the exemption syntax is in
its comment) and keeps the isolated linker explicit. `trustedDependencies` is
empty, so no dependency runs install scripts.

**`apps/back`** (port 3000) — Elysia API server with Better Auth, Drizzle ORM, PostgreSQL.

**`apps/web`** (port 3001) — SvelteKit 3 frontend on Svelte 5 with runes and Tailwind CSS 4, deployed to Cloudflare Workers via `@sveltejs/adapter-cloudflare` (`apps/web/wrangler.jsonc`). Single dark theme: there is no light palette, no `.dark` class and no theme switcher, so the former `dark:` utilities were promoted to base styles in the UI components.

### Type-Safe API Communication

Eden Treaty provides end-to-end type safety between frontend and backend. The backend's `src/app.ts` builds the app and exports `type App = typeof app`, re-exported from `src/index.ts` (which only listens), which `apps/back/package.json` publishes as that package's `.` export, so the frontend imports the type by package name in `src/lib/api.ts`: `import type { App } from "@repo/back"`.

`src/lib/api.ts` exports a factory, not a singleton: `createApi(fetch)` returns a Treaty client bound to the fetch you pass, so server loads can hand it `event.fetch`. Nothing imports it yet — `/health` is currently the only route worth calling through Treaty: Better Auth's endpoints sit behind one untyped wildcard route, `.all("/api/auth/*")` in `src/app.ts`. That route, rather than the guide's bare `.mount(auth.handler)`, keeps unknown paths out of Better Auth; the guide's prefixed `.mount("/prefix", …)` would break it, because Elysia strips the prefix while Better Auth builds OAuth callback and email URLs from `BETTER_AUTH_URL` without it.

Server loads should pass `event.fetch`: `handleFetch` in `hooks.server.ts` attaches the visitor's cookie to every `event.fetch` call to the API origin, which SvelteKit does not do on its own for a sibling subdomain. So `createApi(fetch).some.route.get()` reaches a protected endpoint authenticated, with no headers to forward by hand.

`apps/web` depends on `@repo/back` (`workspace:*`) so Turborepo can see the edge and invalidate the web type-check when the backend contract changes. That edge is for types only: `apps/web/turbo.json` clears the `^build` dependency the root config gives `build`, so building the web app does not compile the backend's binary first. If the web app ever depends on a library package that needs building, list it there.

**Both apps must resolve the same `elysia` copy**, or `treaty<App>` fails with "does not satisfy the constraint 'Elysia<…>'". Bun's isolated installer gives a package a separate copy for each distinct set of resolved peers, and `elysia` has `typescript` and `@types/bun` as optional peers. So both apps declare the same `typescript` (`~6.0.3`), and `apps/back` uses `bun-types` rather than `@types/bun`, which the web app does not have. The catalog gives both the same ranges; confirm with `readlink apps/*/node_modules/elysia` after changing either app's dev dependencies. CI's `.github/scripts/single-copies.sh` checks it (and `typescript`, `better-auth`) on every PR. The web app's extra `@typescript/native` (TypeScript 7 under an alias) is what `svelte-check --tsgo` requires, and it is not a peer of anything.

### Authentication Flow

**Server-side (every request):** `hooks.server.ts` reads the session from Better Auth's cookie cache via `getCookieCache()` — no API call to the backend. Populates `event.locals.user` (only; there is no `locals.session`). When the cache lapses (15 minutes, `session.cookieCache.maxAge` in `apps/back/src/lib/auth.ts`; a session revoked on another device stays valid there for up to that long) but a session token is still present, it revalidates via `getSession()` in `#lib/server/session.ts` and relays the refreshed `Set-Cookie`. That call comes from the web server, so the API exempts `/get-session` from rate limiting (`rateLimit.customRules`); otherwise every visitor's revalidation would count against the server's one IP. Requires `BETTER_AUTH_SECRET` in the web app's env (must match the backend's secret).

**Route protection:** `handle` in `hooks.server.ts` redirects to `/login` when there is no user and `event.route.id` is inside the `(protected)` group, so every page, `__data.json` request, form action and `+server.ts` endpoint in `src/routes/(protected)/` is guarded before any of its code runs. `/account`, the signed-in view, is its only route so far. Do not move the guard into a `+layout.server.ts`: SvelteKit runs a layout load concurrently with the page's own `load`, and never for actions or endpoints. If the API is unreachable while revalidating, the visitor is treated as signed out for that request instead of the page 500-ing.

**Backend route protection:** an Elysia auth macro is defined in `src/app.ts` (the `betterAuth` plugin) — add `{ auth: true }` to any route options and it resolves the session from request headers, returns 401 if missing, and provides `user` and `session` to the handler. No route uses it yet; `/health` is public.

**Sign in / sign up / sign out** run in the browser, straight against the API, through `authClient` (`better-auth/svelte`) in `#lib/auth-client.ts`, which every caller imports dynamically on submit or click so it is not part of any page load. The API sets the session cookie on the domain both apps share, and Better Auth sees the browser's own `Origin`, user agent and IP: Haloy puts the real client address in `X-Forwarded-For`, so its per-IP rate limits apply to each visitor. The forms call `goto("/account", { refreshAll: true })` on success so the loads rerun with the new cookie; sign-out on `/account` goes back to `/`. Social sign-in (`social-buttons.svelte`) passes `/account` on the canonical origin (the root layout's `siteUrl`) as `callbackURL`, and the client follows the provider redirect itself. Sign-in therefore needs JavaScript; the forms keep `method="POST"` only so a submit before hydration cannot fall back to a GET with the password in the URL.

`/login` and `/signup` are prerendered (`+page.ts`), so they are static files with no function call per visit; the cost is that an already signed-in visitor sees the form instead of being redirected. `/` is the public landing page and ships no JavaScript (`csr = false` in `+page.server.ts`, whose load sends a signed-in visitor to `/account`). Both sign-in pages `preconnect` to the API origin.

The API's CORS config (`origin: WEB_URL`, `credentials: true`) is what lets these calls carry cookies.

### Database

Drizzle ORM 1.0 (release candidate, pinned exactly) with PostgreSQL. Schema in `apps/back/src/db/schema.ts`. Four tables: `user`, `session`, `account`, `verification` — the Better Auth core set. No plugins are enabled beyond the defaults.

Relations are Relational Queries v2, declared with `defineRelations` in `src/db/relations.ts` and passed to `drizzle({ relations })`; 1.0 removed the old `relations()` helper. Better Auth's joined reads (`advanced.database.joins`) run through them, which is why `auth.ts` imports `drizzleAdapter` from `@better-auth/drizzle-adapter/relations-v2` and passes `schema` explicitly. The default `better-auth/adapters/drizzle` still targets v1: it hands `db.query` a raw SQL `where`, which v2 rejects. The relation keys (`sessions`, `accounts`, `user`) are the ones Better Auth's generator emits; its join lookup depends on them.

`account.issuer` is **nullable and unindexed**, and that is deliberate. Better Auth 1.7.0-1.7.2 required the column and keyed account identity on `(issuer, account_id)`; 1.7.3 withdrew the requirement and no longer writes it, so a `NOT NULL` there rejects every insert and sign-up returns 500. Migration `20260909180819_relax_account_issuer` (formerly `0002`) relaxes it per the upstream 1.7 upgrade guide — index dropped first, then `NOT NULL` — keeping the column so existing rows survive and a rollback stays possible. Do not re-add the constraint. Migration `20261008183011_account_provider_lookup` (formerly `0003`; generated, not hand-edited) indexes `account(provider_id, account_id)`, which is how social sign-in looks an account up.

Migrations live in `apps/back/migrations`, one folder per migration
(`<UTC timestamp>_<name>/`, holding `migration.sql` and `snapshot.json`). That
is drizzle-kit 1.0's layout; `drizzle-kit up` converted the old `0000`-`0003`
files and `meta/_journal.json`, byte-for-byte on the SQL. Commit every folder
whole: `drizzle-kit generate` diffs the schema against the latest snapshot, and
the migrator records each applied migration by folder name in
`drizzle.__drizzle_migrations`. The first 1.0 `migrate` against a database the
0.x kit migrated adds `name` and `applied_at` columns to that table and
backfills `name` (old rows keep a null `applied_at`), so nothing is re-applied.
`20260821112456_add_account_issuer` and `20260909180819_relax_account_issuer`
are hand-edited after generation, so never regenerate them.

Never edit, rename or delete a migration once it has been applied anywhere. The
migrator picks what to run by folder name alone (it stores a hash but never
compares it): an edited migration is skipped silently wherever it already ran,
and a renamed one runs again. CI's `migrations-unchanged.sh` enforces this
against `main`; fix a mistake with a new migration. Migrations are expand-only
(new tables, nullable or defaulted columns, indexes); a contract change (a drop
or rename) gets a `!` in the PR title and ships only once nothing deployed
reads the old shape. All pending migrations run in one transaction, so
`CREATE INDEX CONCURRENTLY` cannot go through the migrator.
`bunx drizzle-kit check` verifies the folder set.

### UI Components

Library code is imported through the `#lib/*` subpath import declared in
`apps/web/package.json` (SvelteKit 3 dropped the generated `$lib` alias), and
those specifiers need a file extension: `#lib/utils.js`, not `#lib/utils`.

`apps/back` follows the same convention with `#back/*` for its own internal
imports. Neither app uses tsconfig `paths` or a SvelteKit `alias` any more:
subpath imports resolve against the *importing file's* nearest `package.json`,
so they keep working when the web app's type-check follows a type across the
workspace boundary into `apps/back/src` — which is what the old `@back/*` alias
existed to patch up. Use `.js` in these specifiers even though the files are
`.ts`; that is the standard ESM form and both TypeScript and Bun map it.

`src/lib/components/ui/` contains shadcn-svelte style components (bits-ui + Tailwind). `src/lib/components/` contains app-level components (login-form, signup-form, and the social-buttons they share). Use `cn()` from `src/lib/utils.ts` for class merging — it wraps tailwind-variants' merger, not a second tailwind-merge copy.

## Environment Variables

Copy each app's `.env.example` to `.env`; the examples' `DATABASE_URL` is the
`docker compose` database.

**`apps/back/.env`:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_URL`, `COOKIE_DOMAIN` (production only), `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and `WEB_URL` are validated at import time in `src/lib/env.ts` and throw when missing — a non-null assertion only silences the type checker, and a missing `WEB_URL` would otherwise widen CORS to `*`. Social providers register only when both of their credentials are present. Runtime vars are listed once in `turbo.json` under `globalPassThroughEnv`, since Turborepo 2.x runs tasks in strict env mode. `PUBLIC_*` is not listed: Turborepo's framework inference already covers it for the SvelteKit app, and hashes it. `NODE_ENV` is not listed either, so it cannot reach `build` without entering its hash; `start` sets it itself.

**`apps/web/.env`:** `PUBLIC_API_URL`, `PUBLIC_SITE_URL`, `BETTER_AUTH_SECRET` (must match backend)

Each one is declared in `src/env.ts` via `defineEnvVars`, which is what makes it
importable from `$app/env/public` or `$app/env/private` — SvelteKit 3 no longer
derives `$env/*` modules from the ambient environment (they are deprecated, and
removed in SvelteKit 4). The file follows the documented form, with no
validators of its own.

- `PUBLIC_API_URL` is `static`: inlined at build time, so it must be present
  for `vite build`.
- `BETTER_AUTH_SECRET` is dynamic and only required at runtime, so the secret
  never lands in the build output or in Turborepo's cache of it, where a cache
  hit could ship a stale secret after rotation. Do not make it `static`.
  `vite dev` does write its value to `.svelte-kit/generated/dev/`, which is why
  the `build` outputs in `turbo.json` exclude that directory.
- `PUBLIC_SITE_URL` is dynamic and optional at runtime. It must be an absolute
  URL such as `https://example.com`: nothing validates it, so a bare
  `example.com` makes every server-rendered page 500.

`PUBLIC_SITE_URL` is required **at build time**: `robots.txt`, `sitemap.xml` and `llms.txt` are prerendered, and `getSiteOrigin` throws during the build rather than bake SvelteKit's prerender placeholder origin into files crawlers read.

## Deployment

**`apps/web` → Cloudflare Workers.** `@sveltejs/adapter-cloudflare` builds the
Worker into `.svelte-kit/cloudflare`; `wrangler.jsonc` names it (`m4-web`) and
sets its placement:
`aws:sa-east-1`, so it runs next to the API and its database in São Paulo
rather than at the edge nearest the visitor, since server-side calls to the API
(session revalidation) would otherwise cross the continent. Static assets and
prerendered pages still come from the nearest edge. `nodejs_als` is the only
Node API it needs; don't turn on `nodejs_compat` without a reason. The Worker's
runtime values are its vars and secrets, not a process environment: the Deploy
job sends `PUBLIC_SITE_URL` and `BETTER_AUTH_SECRET` with every deploy.
`wrangler.jsonc` holds no domains: m4 is a template, so what differs per
deployment (the build values, production's custom domain, the preview domain)
lives in repository variables, and Deploy writes the domains into a generated
config (`.github/scripts/web-deploy-config.ts`). With no custom domain the
Worker serves only its `workers.dev` URL. Run
the production build locally on workerd with `bun run --cwd apps/web preview`
(`wrangler dev`, reading `apps/web/.env`); `bun run e2e` does the same.

**`apps/back` → Docker, deployed with Haloy.** Build context is the repo root,
not `apps/back`, because the Bun workspace install needs the root lockfile:

```bash
docker build -f apps/back/Dockerfile -t m4-back .
```

Multi-stage: `oven/bun` compiles a self-contained binary, which is copied into
`gcr.io/distroless/base-debian13:nonroot` (Debian 13 is the only base distroless
still updates; `nonroot` runs it unprivileged). The runtime image has no Bun and no
`node_modules`. It listens on `PORT` (8080 in the image) and serves `/health`.
The binary is PID 1 in the container, where SIGTERM has no default action, so
`src/index.ts` handles it (`app.ts` builds the app without listening, so tests can import it): stop accepting connections, let in-flight requests
finish, exit.

**Both apps must sit on subdomains of one parent domain** — e.g.
`app.example.com` and `api.example.com`. Set `COOKIE_DOMAIN=example.com` on the
backend, which turns on `advanced.crossSubDomainCookies`. This is not optional
polish: `hooks.server.ts` reads the session cookie from requests to the *web*
origin, but the cookie is set by the *API* origin. On unrelated domains the
browser never sends it and Safari's ITP blocks it outright. It works locally
only because both apps are on `localhost`, where cookies ignore the port.

**Every push to `main` deploys**, through `.github/workflows/deploy.yml`: CI's
`Test` (skipped when the PR already passed on the same tree), then migrations,
then the API with Haloy (`apps/back/haloy.yaml`), then the web app with
`wrangler deploy`. The API goes first because a new web build may call a new endpoint;
a change both sides must agree on ships the side that tolerates the other first,
in its own commit. Nothing else deploys the web app (no Workers Git
integration). Each half skips with a notice until its secrets and variables are
set, and the API's refuses to deploy while `haloy.yaml` still holds the
template's `example.com`. Setup, rollbacks (the `Rollback` workflow, never from a laptop)
and previews (the `preview` label on a PR) are in `docs/operations.md`.

**Migrations run in the Deploy job, before the API.** The distroless runtime
image carries only the compiled binary — no Bun, no `drizzle-kit`, no `pg` — so
it cannot migrate itself. `drizzle-kit` needs the `pg` devDependency; the
`bun-sql` driver the app uses at runtime is not one the CLI can drive.

## Testing

- Test behaviour that can break: sign-up, sign-in and sessions, route
  protection, persistence and migrations, and the logic a bug fix changed.
  Don't test what types guarantee, copy, static markup, or that a process
  starts.
- Extend an existing test before adding one. Test at the lowest layer that
  fails without the fix.
- API tests are `bun test` in `apps/back`, against the real app
  (`app.handle(new Request(…))`) on real Postgres. The preload
  (`apps/back/test/setup.ts`) refuses any database whose name does not end in
  `_test`, replaces the environment, and gives each worker its own
  `m4_test_<n>`, rebuilt from the migrations. Create your own data (random
  emails).
- Web tests are Vitest in Node for logic modules (`hooks.server.ts`), reading
  the committed `apps/web/.env.test`.
- `e2e/` is Playwright: its own API and web servers (ports 3070/3071; the web
  app's production build under `wrangler dev`) and database (`m4_e2e`), never
  the dev servers. Specs end in `.e2e.ts`. Chromium
  once: `cd e2e && bunx playwright install chromium`.

## Branches, PRs and deploys

- `main` is production. Branch as `<type>/<summary>`. PRs squash-merge, so the
  title is the commit: a Conventional Commit (`feat(web): …`; scopes `web`,
  `back`, `ci`, `deps`, `docs`), saying why the change matters. The description
  opens with the problem (`file-pr`). A PR merges when up to date with `main`,
  with `Test` and `PR checks` green.
- One implementer and one review per PR ("Every change").
- Unfinished work merges dark: behind a flag, or a route nothing links to.

## Documentation

- Don't document what the code already says: no catalogues of routes, fields or
  files here or in `docs/`. A reason the code can't show goes in a short
  comment beside it.
- When a documented rule changes, rewrite or remove it. Don't append a second
  account.
- Decisions and their reasons go in `docs/DECISIONS.md`; procedures in
  `docs/operations.md`. Don't commit agent work plans or scratch notes.

## Svelte MCP Tools

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

### 1. list-sections
Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths. When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation
Retrieves full documentation content for specific sections. Accepts single or multiple sections. After calling list-sections, you MUST analyze the returned sections (especially the use_cases field) and then use get-documentation to fetch ALL sections relevant to the user's task.

### 3. svelte-autofixer
Analyzes Svelte code and returns issues and suggestions. You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link
Generates a Svelte Playground link with the provided code. After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## Agent Tooling

Skills live in `.agents/skills/`, with `.claude/skills` symlinked to that
directory so Claude Code picks them up. Vendored: `elysiajs`, `shadcn-svelte`,
`svelte-core-bestpractices`, `drizzle`. Written for this repo, after tstack:
`review-loop`, `council`, `file-pr`, `full-send`, `full-stop`, `takeover`,
`modernize`, `design-review`, and `test-m4`. See `.agents/skills/README.md` for
provenance, pinned commits, and what was deliberately left out.

`.mcp.json` registers two remote HTTP documentation servers, `better-auth` and
`svelte`. Both are read-only and need no credentials, so any harness that reads
`.mcp.json` gets them; `.claude/settings.json` turns them on without a prompt.
Nothing here depends on a Claude Code plugin.

## Documentation Lookup

Prefer these over recalling API surface from memory — several of these libraries
changed shape recently and the wrong-version answer is the common failure.

- **Turborepo:** `turbo docs <query>` returns URLs pinned to the installed
  version (v2-11-11.turborepo.dev). Append `.md` to fetch any of them as
  markdown. This is the defense against turbo 1.x `pipeline` syntax.
- **Tailwind is v4, CSS-first.** Theme config lives in `@theme` inside
  `apps/web/src/routes/layout.css` (declared in `components.json`). Never create
  a `tailwind.config.*`. Tailwind publishes no llms.txt and no official skill,
  so this rule is the only guardrail.
- **Bits UI:** fetch `https://bits-ui.com/docs/components/<name>/llms.txt` for a
  single component (~39 KB). Do NOT fetch `https://bits-ui.com/docs/llms.txt` —
  it is 1.9 MB.
- **shadcn-svelte:** append `.md` to any docs URL, e.g.
  `https://www.shadcn-svelte.com/docs/components/button.md`.
- **Drizzle:** `https://orm.drizzle.team/llms.txt` (37 KB index) — fetch the
  specific page from there; the installed version is 1.0, so read the
  `upgrade-v1`, `v0-v1-changes` and `relations-v2` pages over anything older.
  Skip `llms-full.txt`; it is 3.5 MB and mixes 0.x and 1.0 material.
- **Elysia:** `https://elysiajs.com/llms.txt`, and the vendored skill in
  `.agents/skills/elysiajs/` already covers the macro, lifecycle, Eden, CORS, and
  the Better Auth / Drizzle / SvelteKit integrations.
