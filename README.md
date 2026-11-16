# M4

Full-stack TypeScript monorepo starter template.

## Stack

- **Runtime:** Bun
- **Monorepo:** Turborepo
- **Frontend:** SvelteKit 3 (Svelte 5), Tailwind CSS 4, shadcn-svelte
- **Backend:** Elysia
- **Auth:** Better Auth (email/password, Google, GitHub)
- **Database:** Drizzle ORM, PostgreSQL
- **API Client:** Eden Treaty (type-safe RPC)

## Setup

```bash
bun install
```

Copy environment files and fill in your values:

```bash
cp apps/back/.env.example apps/back/.env
cp apps/web/.env.example apps/web/.env
```

The `BETTER_AUTH_SECRET` must match in both apps. Generate one with:

```bash
openssl rand -base64 32
```

Start the local database (Postgres 18) and run migrations:

```bash
docker compose up -d
bun run db:migrate
```

## Development

```bash
bun run dev
```

This starts both apps:
- **Frontend:** http://localhost:3001
- **Backend:** http://localhost:3000

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all apps in development |
| `bun run check` | Format check, then lint, type-check and test what changed since `origin/main` |
| `bun run lint` | ESLint across the monorepo |
| `bun run check-types` | Type check across monorepo |
| `bun run test` | API tests on real Postgres, web tests with Vitest |
| `bun run e2e` | Playwright end-to-end tests (own servers and database) |
| `bun run format:fix` | Format with `bun fmt` |
| `bun run build` | Build all apps |
| `bun run start` | Build, then run the API's compiled binary locally |
| `bun run db:generate` | Generate a migration from schema changes |
| `bun run db:migrate` | Apply migrations |
| `bun run db:studio` | Open Drizzle Studio |

## Deployment

Every push to `main` deploys through GitHub Actions: migrations, the API with Haloy, then the web app on Cloudflare Workers. A fresh
copy of the template skips these steps until configured; see [`docs/operations.md`](docs/operations.md).

## Project Structure

```
apps/
  back/           Elysia API server (port 3000)
    src/
      app.ts          The app: routes, auth macro, `type App`
      index.ts        Server entry: listens, drains on SIGTERM
      lib/auth.ts     Better Auth configuration
      db/schema.ts    Drizzle database schema
      db/relations.ts Drizzle relations (for Better Auth joins)
      db/drizzle.ts   Database client
  web/            SvelteKit frontend (port 3001)
    src/
      hooks.server.ts     Auth session from cookie cache
      lib/api.ts          Eden Treaty client
      lib/auth-client.ts  Better Auth client (browser)
      lib/server/session.ts  Session revalidation for hooks
      lib/components/     App components
      lib/components/ui/  shadcn-svelte components
      routes/
        login/            Login page (prerendered)
        signup/           Signup page (prerendered)
        (protected)/account/  Signed-in view
packages/
  eslint-config/  Shared ESLint config
e2e/              Playwright end-to-end tests
docs/             Decisions and operations
```
