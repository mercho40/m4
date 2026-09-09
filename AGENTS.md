# AGENTS.md

Guidance for AI coding agents working in this repository.

This is the canonical instructions file. `CLAUDE.md` is a symlink to it, so
Claude Code, and any harness following the `AGENTS.md` convention, read the same
text. Edit this file, never the symlink.

## Commands

```bash
# Development (starts both apps via Turbo)
bun run dev

# Type checking across monorepo
bun run check-types

# Build all apps
bun run build

# Database (run from apps/back/)
bunx drizzle-kit generate    # Generate migrations from schema changes
bunx drizzle-kit migrate     # Apply migrations
bunx drizzle-kit studio      # Open Drizzle Studio UI
```

## Architecture

Bun monorepo with Turborepo. Two apps, no shared packages yet.

**`apps/back`** (port 3000) — Elysia API server with Better Auth, Drizzle ORM, PostgreSQL.

**`apps/web`** (port 3001) — SvelteKit 5 frontend with Svelte runes, Tailwind CSS 4, svelte-adapter-bun.

### Type-Safe API Communication

Eden Treaty provides end-to-end type safety between frontend and backend. The backend exports `type App = typeof app` from `src/index.ts`. The frontend imports that type in `src/lib/api.ts` via the `@back/*` alias (declared in `svelte.config.js` under `kit.alias`; `tsconfig.json` inherits the generated mapping).

`src/lib/api.ts` exports a factory, not a singleton: `createApi(fetch)` returns a Treaty client bound to the fetch you pass, so server loads can hand it `event.fetch`. Nothing imports it yet — `/health` is currently the only Treaty-reachable route, since Better Auth's endpoints are mounted outside Elysia's typed router.

When calling a protected endpoint from a server load, forward the cookie:
`createApi(fetch).some.route.get({ headers: { cookie: request.headers.get("cookie") ?? "" } })`.

`apps/web` depends on `@repo/back` (`workspace:*`) so Turborepo can see the edge and invalidate the web type-check when the backend contract changes.

### Authentication Flow

**Server-side (every request):** `hooks.server.ts` reads the session from Better Auth's cookie cache via `getCookieCache()` — no API call to the backend. Populates `event.locals.user` (only; there is no `locals.session`). When the 5-minute cache lapses but a session token is still present, it revalidates via `authClient.getSession()` and relays the refreshed `Set-Cookie`. Requires `BETTER_AUTH_SECRET` in the web app's env (must match the backend's secret).

**Route protection:** The `(protected)` route group has a `+layout.server.ts` that redirects to `/login` if no session. Any route inside `src/routes/(protected)/` is automatically guarded.

**Backend route protection:** an Elysia auth macro is defined in `src/index.ts` — add `{ auth: true }` to any route options and it resolves the session from request headers, returns 401 if missing, and provides `user` and `session` to the handler. No route uses it yet; `/health` is public.

**Client-side auth:** `authClient` from `src/lib/auth-client.ts` handles sign in/up/out mutations. Login and signup are server-rendered, not prerendered: `login/+page.server.ts` and `signup/+page.server.ts` redirect an already-authenticated visitor with `redirect(303, "/")`, mirroring the `(protected)` guard in the opposite direction.

### Database

Drizzle ORM with PostgreSQL. Schema in `apps/back/src/db/schema.ts`. Four tables: `user`, `session`, `account`, `verification` — the Better Auth core set. No plugins are enabled beyond the defaults.

Better Auth >= 1.7 scopes account identity by `issuer` rather than `provider_id`, so `account` carries a required `issuer` column and a unique index on `(issuer, account_id)`. Issuer values come from `@better-auth/core/db`: `local:<id>` for credential accounts, `local:oauth:<id>` for OAuth providers that declare no issuer of their own, and the provider's own value where it does (google uses `https://accounts.google.com`).

### UI Components

`src/lib/components/ui/` contains shadcn-svelte style components (bits-ui + Tailwind). `src/lib/components/` contains app-level components (login-form, signup-form, theme-toggle). Use `cn()` from `src/lib/utils.ts` for class merging.

## Environment Variables

**`apps/back/.env`:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

`DATABASE_URL`, `BETTER_AUTH_URL` and `WEB_URL` are validated at import time in `src/lib/env.ts` and throw when missing — a non-null assertion only silences the type checker, and a missing `WEB_URL` would otherwise widen CORS to `*`. Social providers register only when both of their credentials are present. Runtime vars are listed in `turbo.json` under `passThroughEnv`, since Turborepo 2.x runs tasks in strict env mode.

**`apps/web/.env`:** `PUBLIC_API_URL`, `BETTER_AUTH_SECRET` (must match backend)

## Deployment

**`apps/web` → Vercel.** Uses `@sveltejs/adapter-vercel`. Set the Vercel project's
Node version to **24**: the adapter only accepts 20, 22 or 24, and
`svelte.config.js` pins `runtime: "nodejs24.x"` because this machine's Node (26)
is outside the set the adapter can infer from. Environment: `PUBLIC_API_URL`
(the API origin) and `BETTER_AUTH_SECRET` (must match the backend's).

**`apps/back` → Docker, deployed with Haloy.** Build context is the repo root,
not `apps/back`, because the Bun workspace install needs the root lockfile:

```bash
docker build -f apps/back/Dockerfile -t m4-back .
```

Multi-stage: `oven/bun` compiles a self-contained binary, which is copied into
`gcr.io/distroless/base-debian12`. The runtime image has no Bun and no
`node_modules`. It listens on `PORT` (8080 in the image) and serves `/health`.

**Both apps must sit on subdomains of one parent domain** — e.g.
`app.example.com` and `api.example.com`. Set `COOKIE_DOMAIN=example.com` on the
backend, which turns on `advanced.crossSubDomainCookies`. This is not optional
polish: `hooks.server.ts` reads the session cookie from requests to the *web*
origin, but the cookie is set by the *API* origin. On unrelated domains the
browser never sends it and Safari's ITP blocks it outright. It works locally
only because both apps are on `localhost`, where cookies ignore the port.

**Migrations run separately, before deploying.** The distroless runtime image
carries only the compiled binary — no Bun, no `drizzle-kit`, no `pg` — so it
cannot migrate itself. From `apps/back`, against the production database:

```bash
DATABASE_URL=<production> bunx drizzle-kit migrate
```

Note `drizzle-kit` needs the `pg` devDependency; the `bun-sql` driver the app
uses at runtime is not one the CLI can drive.

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

Vendored skills live in `.agents/skills/` — `elysiajs`, `shadcn-svelte`,
`svelte-code-writer`, `svelte-core-bestpractices` — with `.claude/skills`
symlinked to that directory so Claude Code picks them up. `.claude/agents/`
holds the Svelte file-editor subagent. See `.agents/skills/README.md` for
provenance, pinned commits, and what was deliberately left out.

`.mcp.json` registers two remote HTTP documentation servers, `better-auth` and
`svelte`. Both are read-only and need no credentials, so any harness that reads
`.mcp.json` gets them. Nothing here depends on a Claude Code plugin.

## Documentation Lookup

Prefer these over recalling API surface from memory — several of these libraries
changed shape recently and the wrong-version answer is the common failure.

- **Turborepo:** `turbo docs <query>` returns URLs pinned to the installed
  version (v2-10-11.turborepo.dev). Append `.md` to fetch any of them as
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
  specific page from there. Skip `llms-full.txt`; it is 3.5 MB and mixes 1.0-beta
  notes into stable docs, which misleads against the installed 0.45.2.
- **Elysia:** `https://elysiajs.com/llms.txt`, and the vendored skill in
  `.agents/skills/elysiajs/` already covers the macro, lifecycle, Eden, CORS, and
  the Better Auth / Drizzle / SvelteKit integrations.
