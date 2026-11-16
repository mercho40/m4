# Vendored agent skills

Copied verbatim from upstream rather than installed through a third-party CLI,
so the contents are reviewable in `git diff` and pinned to a known commit.

These live in `.agents/skills/` — the harness-neutral location — and
`.claude/skills` is a symlink to this directory so Claude Code finds them.
Both are tracked, so a fresh clone gets the skills and the symlink together.

| Skill | Upstream | Commit | Path in upstream |
|---|---|---|---|
| `drizzle` | `drizzle-kit` on npm | `1.0.0-rc.5` (skills revision 15) | `skills/drizzle/` |
| `elysiajs` | https://github.com/elysiajs/skills | `8fd8031` | `elysia/` |
| `shadcn-svelte` | https://github.com/huntabyte/shadcn-svelte | `493481f` | `skills/shadcn-svelte/` |
| `svelte-core-bestpractices` | https://github.com/sveltejs/ai-tools | `6b5d0da` | `tools/skills/svelte-core-bestpractices/` |

The Svelte tooling was previously delivered by the `svelte@svelte` Claude Code
plugin. That plugin is now disabled: it installs outside the repo, so teammates
and non-Claude harnesses got none of it, and leaving it enabled alongside these
copies would give Claude Code two skills of each name and two MCP servers both
called `svelte`. The trade is that updates are manual now — re-vendor at a newer
commit, same as the other skills.

To update, re-clone at a newer commit and copy the same directories:

```sh
git clone --depth 1 https://github.com/elysiajs/skills /tmp/elysia-skills
cp -R /tmp/elysia-skills/elysia .agents/skills/elysiajs
```

`drizzle` ships inside the installed `drizzle-kit`, so it updates with it: after
bumping `drizzle-kit`, copy `skills/drizzle/` from the installed package
(`readlink -f apps/back/node_modules/drizzle-kit`). The skill's own staleness
check runs `drizzle-kit skills version` and tells you when they differ. Its fix,
`drizzle-kit skills`, runs the third-party `skills` CLI; copy instead.

`shadcn-svelte/assets/` (screenshots), `evals/` and `agents/openai.yml` were dropped — not used by the skill.
`svelte-code-writer` and the `svelte-file-editor` subagent from the same Svelte repo were dropped too: the first wraps
the Svelte MCP's tools in a CLI, and `.claude/settings.json` turns that MCP on; the second started a subagent for every
`.svelte` edit, against the one-implementer rule.

## Adapted, not vendored

Rewritten for this repo, so updating them means reading upstream's changes, not copying. Their licence is
`tstack-LICENSE` (MIT, Theo Browne).

| Skill | From | Commit | What changed |
|---|---|---|---|
| `full-send` | https://github.com/t3dotgg/tstack | `11e37a7` | This repo's checks, proof and gate; squash-merges, then watches the deploy; stops before merging a design pass, a contract change, or one the live web app cannot survive while the API deploys first |
| `full-stop` | same | `11e37a7` | Points at `full-send`, without the merge |
| `review-loop` | same (`sol-loop`) | `11e37a7` | A fresh Claude Opus run as the reviewer; at most 3 rounds |
| `modernize` | same | `11e37a7` | Migrations and `bun.lock` regenerated, never merged by hand |
| `council` | same | `11e37a7` | Three fresh Claude Opus runs unless the user names members; decides a question by majority, or reviews a change for at most 3 rounds; on a PR it is the one review |
| `file-pr` | same | `11e37a7` | This repo's title rule, PR template, the review's line PR checks look for, labels and credit lines; folds in `leaving-pr-comments`' note for the rare comment |
| `takeover` | same | `11e37a7` | A new branch by default, `modernize` then `test-m4`, `review-loop` and `file-pr`; authors checked in `git log`, never an agent as co-author |
| `design-review` | same (`council`), and pingdotgg/t3code#25968's brief | `11e37a7` | Scores screenshots of m4's pages against reference apps the user picks per pass; Claude Opus only by default; stops at 9 in every category or 5 rounds |

`test-m4` is written here after T3 Code's `test-t3-app` (https://github.com/pingdotgg/t3code, `c2e54e3`): local
Postgres, a fresh user signed up at `/signup`, signed in and out.

Not taken: `babysit-pr` (this repo has no review bots; T3 Code's PR watcher covers CI) and `leaving-pr-comments`
(agents here rarely comment; `file-pr` keeps its note).

## Drizzle

The `drizzle` skill is vendored whole. It is sound for this repo: it targets
drizzle-kit 1.0's folder-per-migration layout, the `--output json` envelope,
`missing_hints` and `check`, all of which the installed `1.0.0-rc.5` has. Its
other dialects (MySQL, SQLite, MSSQL, CockroachDB, SingleStore) are threaded
through every topic file, not in files of their own, so they stay: cutting them
would break the verbatim copy for little gain, and only `SKILL.md` loads by
default. This repo generates and migrates; it never uses `push` or `pull`,
whatever the skill says about local iteration.

`drizzle-kit mcp` (a stdio MCP server exposing `generate`, `fix_conflicts`,
`push`, `pull`, `check`, `export` and `up`) is not registered in `.mcp.json`.
It adds nothing the CLI's `--output json` does not give, it has no `migrate`,
it reads `drizzle.config.ts` from its own working directory (so it would need a
wrapper that starts it in `apps/back`), and it would hand agents `push` and
`fix_conflicts`, which write to a live database or delete migration folders.

## Deliberately not installed

- **shadcn/ui's skill and MCP** (`shadcn-ui/ui`) are React-bound but trigger on
  any `components.json`, which this repo has. They drive `npx shadcn@latest`
  subcommands that do not exist in the shadcn-svelte CLI.
