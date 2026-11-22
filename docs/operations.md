# Operations

Procedures for running m4 in production: what to do, in what order, and why. The workflows in `.github/` are the
reference for how things work; this file is for the steps that live outside them.

A fresh copy of the template has none of this set up, and its workflows say so with a notice and skip: CI's `Test` and
`PR checks` run in full, deploys, previews and rollbacks do nothing until configured.

## One-time setup

### Secrets and variables

Repository settings → Secrets and variables → Actions. Each part turns on once everything it needs is set; a part with
some but not all of its values fails the Deploy job rather than ship half-configured.

| Name                         | Kind     | Read by                                | What                                                                                                                   |
| ---------------------------- | -------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `HALOY_API_TOKEN`            | secret   | deploy, rollback, pr, preview-teardown | haloyd's API token. Turns the API deploy on.                                                                           |
| `DATABASE_URL`               | secret   | deploy, rollback                       | Production's Postgres. On Neon, the **direct** host, not `-pooler`: drizzle-kit migrates through it.                    |
| `BETTER_AUTH_SECRET`         | secret   | deploy, rollback                       | Both apps': Deploy sends it to the API and, as a Worker secret, to the web app.                                        |
| `GITHUB_CLIENT_SECRET`       | secret   | deploy, rollback                       | Optional, with its `GITHUB_CLIENT_ID` uncommented in `apps/back/haloy.yaml`.                                           |
| `GOOGLE_CLIENT_SECRET`       | secret   | deploy, rollback                       | Optional, likewise.                                                                                                    |
| `CLOUDFLARE_API_TOKEN`       | secret   | deploy, rollback, pr, preview-*        | An API token from the "Edit Cloudflare Workers" template, covering the custom domains' zones. Turns the web deploy on. |
| `CLOUDFLARE_ACCOUNT_ID`      | variable | deploy, rollback, pr, preview-*        | The Cloudflare account the Worker lives in.                                                                            |
| `PUBLIC_API_URL`             | variable | ci, deploy                             | The API's origin, `https://api.example.com`: haloy.yaml's domain. Inlined into the web build.                          |
| `PUBLIC_SITE_URL`            | variable | ci, deploy                             | The web app's canonical origin: `https://` and `WEB_DOMAIN`, or the Worker's `workers.dev` URL. Must be haloy.yaml's `WEB_URL`. |
| `WEB_DOMAIN`                 | variable | deploy                                 | Optional: production's custom domain, `app.example.com`. Without it the Worker serves only its `workers.dev` URL. Unsetting it detaches nothing: remove the old domain in the dashboard. |
| `NEON_API_KEY`               | secret   | deploy, pr, preview-*                  | Optional: restore points before migrating, the migration rehearsal, and previews' databases.                           |
| `NEON_PROJECT_ID`            | variable | deploy, pr, preview-*                  | The Neon project production lives in.                                                                                  |
| `NEON_PARENT_BRANCH`         | variable | deploy, pr                             | Production's branch (its name or id).                                                                                  |
| `NEON_ROLE`, `NEON_DATABASE` | variable | pr                                     | The role and database in `DATABASE_URL`; default `neondb_owner` and `neondb`.                                          |
| `PREVIEW_DOMAIN`             | variable | deploy, pr, preview-*                  | The previews' parent domain (see Previews). Turns previews on, with the Haloy, Cloudflare and Neon rows above.                |
| `PREVIEW_BETTER_AUTH_SECRET` | secret   | pr                                     | Previews' own secret, never production's.                                                                              |
| `PREVIEW_MAX`                | variable | pr                                     | Open previews allowed at once; default 2.                                                                              |
| `TURBO_TEAM`                 | variable | ci, deploy                             | Optional: the Vercel team slug whose Remote Cache Turborepo uses.                                                      |

### Before the first deploy

1. The web app's values are the variables above, never committed: nothing in `apps/web` names a domain. For the API,
   replace every `example.com` in `apps/back/haloy.yaml` (`server`, the domain, `BETTER_AUTH_URL`, `WEB_URL`,
   `COOKIE_DOMAIN`); Deploy refuses to ship the placeholder. Sign-in needs both apps on subdomains of one parent domain,
   which is `COOKIE_DOMAIN` (AGENTS.md, "Deployment"), so a web app on `workers.dev` alone serves only signed-out
   pages: `workers.dev` is a public suffix, and no cookie spans it.
2. Cloudflare: the zones of `WEB_DOMAIN` and `PREVIEW_DOMAIN`, if set, on the account; the Worker's custom domains create
   their own DNS records and certificates. The API's host points at the Haloy server.
3. Nothing to set on the Worker by hand: each deploy sends `PUBLIC_SITE_URL` as a var and
   `BETTER_AUTH_SECRET` as a secret, and drops any other var. A var added in the dashboard does not survive a deploy;
   add it to the workflow instead.
4. Run the Deploy workflow by hand once. Unconfigured runs succeed too, so a push would deploy only what changed since
   the last of them; a manual run deploys both halves.

### The `main` ruleset

Settings → General: allow squash merging only, with the PR title and description as the commit. Settings → Rules, a
ruleset on the default branch: require a pull request; require status checks `Test` and `PR checks`, with branches up to
date before merging; block force pushes and deletions. Up to date matters: Deploy skips re-testing a commit only when
its tree is exactly the one the PR's `Test` passed on (`.github/scripts/tested.sh`).

### The `preview` label

`gh label create preview --color 0E8A16 --description "Deploy a full-stack preview"`

### Turborepo's remote cache

Set `TURBO_TEAM`, then let this repository's GitHub OIDC tokens use the team's Remote Cache (the "Turborepo CLI" OIDC
policy in the Vercel team's settings; `vercel/setup-turborepo-remote-cache-action` documents it). Without it Turborepo
runs uncached: slower, never wrong.

## Deploying

- Every push to `main` deploys (`deploy.yml`). If CI's `Test` already passed on exactly that tree in the PR it squashes,
  it is not tested again. Then, each only if it changed since the last successful deploy: migrations, the API with
  Haloy, then the web app with `wrangler deploy`, built with the `PUBLIC_*` variables. Workers has no Git integration
  here: nothing deploys the web app but this job.
- A change to a variable deploys nothing by itself: run the Deploy workflow by hand after changing one.
- With Neon configured, a deploy that migrates first leaves a restore point, `backup/pre-deploy-<sha7>`, for 3 days;
  the newest two are kept (the free plan holds 10 branches, shared with previews and the rehearsal). Without Neon, take
  your provider's backup before merging a migration.
- `haloy deploy` exits 0 even when the new container fails its health check, so the job reads its output.
- A change both apps read ships the tolerant side first, in its own PR: the API deploys before the web app, and either
  can be rolled back alone.

## Rolling back

- The `Rollback` workflow (Actions): run it with an empty version to list candidates, then again with the chosen one.
  `back` takes a Haloy deployment id, `web` a Worker version id (`wrangler deployments list`). Never from a laptop:
  haloy reads local `.env` files.
- A Worker version keeps the secret and vars it shipped with, so a web rollback restores those too. The next Deploy
  replaces it as usual.
- The database is not rolled back. Expand-only migrations keep an older API working on the newer schema; a bad migration
  is undone from the restore point with `neon branches restore`.

## Migrations

- Change `apps/back/src/db/schema.ts`, then `bun run db:generate --name <change>`, and commit the new folder whole. CI
  fails a schema change without its migration.
- Never edit, rename or delete a migration that reached `main`. The migrator picks what to run by folder name alone: it
  stores each file's hash but never compares it, so an edit is skipped silently wherever it already ran, and a rename
  runs again. CI refuses both (`.github/scripts/migrations-unchanged.sh`).
- Deploy migrates before the new API starts, while the old one still serves. So every migration must work with the
  code already running:
  - **Expand**, with the code that uses it: new tables, nullable columns or columns with defaults, indexes.
  - **Contract**, in a later PR, once nothing deployed reads the old shape: drops and renames. Mark the title with `!`.
    A rename is an expand (new column, backfill, code reads it) then a contract (drop the old). Never roll the API back
    past a contract.
- The migrator runs every pending migration in one transaction, so a failure applies none of them, and a statement that
  cannot run in a transaction (`CREATE INDEX CONCURRENTLY`) cannot go through it.
- With Neon configured, `PR checks` applies a PR's migrations to a throwaway branch of production, real data included.

## Previews

- The `preview` label (at most `PREVIEW_MAX` open) deploys the API as `m4-back-pr-<n>` at
  `https://pr-<n>.api.<PREVIEW_DOMAIN>` and the web app as Worker Preview `pr-<n>` at
  `https://pr-<n>.app.<PREVIEW_DOMAIN>`, with its own `PUBLIC_SITE_URL` and `PREVIEW_BETTER_AUTH_SECRET` (Previews
  never inherit the Worker's). The database is a Neon branch copied from production, reset on every push.
  Closing the PR or removing the label tears it down; `preview-sweep.yml` catches what is missed, and unlabels PRs idle
  for 7 days.
- `PREVIEW_DOMAIN` is a registrable domain of its own (`example-preview.dev`), never a subdomain of production's:
  production's session cookie, scoped to production's parent domain, would reach preview code otherwise.
- DNS for it: `*.api.<PREVIEW_DOMAIN>` to the Haloy server. `app.<PREVIEW_DOMAIN>` is the Worker's preview-only custom
  domain, which Deploy adds: Cloudflare creates `*.app.<PREVIEW_DOMAIN>` and its certificate, but only once a deploy from
  `main` has deployed the web app with `PREVIEW_DOMAIN` set: run Deploy by hand after setting it. The first
  Preview's certificate can take minutes.
- Previews are public. To restrict them, put Cloudflare Access in front of `*.app.<PREVIEW_DOMAIN>`.
- Previews hold a copy of production's users. Treat access to a preview, and to its logs, as access to production data.
- Previews share one cookie domain and cookie name, so signing in to one preview signs out of another.
- Social sign-in is off on previews (providers accept only exact redirect URIs); email and password work.
- Logs: render the config as `pr.yml` does, then run haloy with every `from.env` name set to anything (haloy resolves
  them all):
  `PREVIEW_DATABASE_URL=unused PREVIEW_BETTER_AUTH_SECRET=unused haloy logs -c apps/back/haloy.pr.yaml`.
