# Decisions

Settled product and architecture decisions, each with the reason it was made. Read before designing; change one through
a PR. `AGENTS.md` holds the rules that follow from them; this file holds the why.

## Settled (2026-11-15)

- **D-1. The web app and the API live on subdomains of one parent domain.** The session cookie is set by the API and
  read by the web server, so both origins must receive it (`COOKIE_DOMAIN`). Unrelated domains break sign-in, and
  Safari's ITP blocks the cookie outright.
- **D-2. `main` is production; GitHub Actions deploys it, API first.** One job (`deploy.yml`) runs migrations, then the
  API, then the web app, so a new web build never calls an endpoint that isn't live yet. Nothing else deploys the web
  app: no Workers Git integration.
- **D-3. Full-stack previews live on a separate parent domain** (`PREVIEW_DOMAIN`), on a Neon branch copied from
  production: the API on Haloy, the web app as a Worker Preview on a preview-only custom domain. Production's cookies
  never reach preview code, and preview sign-in works because the preview API and web app share that domain. Previews
  share one cookie domain, so signing in to one signs you out of another; a per-preview cookie prefix would fix it if
  that starts to matter.
- **D-4. Migrations are expand-only and never edited once applied.** The migrator matches applied migrations by folder
  name, so an edit is silently skipped where it ran. Expand-only keeps an older API working on a newer schema, which
  is what makes rolling the API back safe.
- **D-5. One implementer and one review per PR.** The review is `review-loop` (a fresh Claude Opus run, at most three
  rounds), or a `council` when the user asks for one. PR checks require its line in the description.
- **D-6. TypeScript stays on 6 for now.** svelte-check and SvelteKit 3.2 accept only TypeScript 5 or 6 as their peer,
  and both apps must declare the same `typescript` so they share one `elysia` copy. TypeScript 7 runs beside it as
  `@typescript/native` for `svelte-check --tsgo`. Revisit when svelte-check's peer range allows 7.
- **D-7. New dependency versions wait 3 days** (`minimumReleaseAge` in `bunfig.toml`), and no dependency runs install
  scripts (`trustedDependencies: []`): a compromised release usually surfaces within that window.
- **D-8. The web app runs on Cloudflare Workers, placed in São Paulo.** Same platform as Restoman's frontends, deployed
  and rolled back with `wrangler` from GitHub Actions, with Previews on a custom domain for full-stack previews. The
  placement hint (`aws:sa-east-1`) keeps its server-side calls next to the API; static files still come from the nearest
  edge. Replaces Vercel (`gru1`).

## Open

- Whether to register `drizzle-kit mcp`. Not now: it adds nothing the CLI's `--output json` lacks, and it hands agents
  `push` and `fix_conflicts`, which write to a live database or delete migration folders.
