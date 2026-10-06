# Vendored agent skills

Copied verbatim from upstream rather than installed through a third-party CLI,
so the contents are reviewable in `git diff` and pinned to a known commit.

These live in `.agents/skills/` — the harness-neutral location — and
`.claude/skills` is a symlink to this directory so Claude Code finds them.
Both are tracked, so a fresh clone gets the skills and the symlink together.

| Skill | Upstream | Commit | Path in upstream |
|---|---|---|---|
| `elysiajs` | https://github.com/elysiajs/skills | `8fd8031` | `elysia/` |
| `shadcn-svelte` | https://github.com/huntabyte/shadcn-svelte | `493481f` | `skills/shadcn-svelte/` |
| `svelte-code-writer` | https://github.com/sveltejs/ai-tools | `6b5d0da` | `tools/skills/svelte-code-writer/` |
| `svelte-core-bestpractices` | https://github.com/sveltejs/ai-tools | `6b5d0da` | `tools/skills/svelte-core-bestpractices/` |

`.claude/agents/svelte-file-editor.md` comes from the same repo and commit
(`tools/agents/svelte-file-editor.md`). It is Claude-specific, so it lives under
`.claude/` rather than `.agents/`.

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

`shadcn-svelte/assets/` (screenshots) was dropped — not used by the skill.

## Deliberately not installed

- **shadcn/ui's skill and MCP** (`shadcn-ui/ui`) are React-bound but trigger on
  any `components.json`, which this repo has. They drive `npx shadcn@latest`
  subcommands that do not exist in the shadcn-svelte CLI.
- **Drizzle's skills and `drizzle-kit mcp`** ship only on `drizzle-kit@1.0.0-rc`.
  This repo is on 0.31.10 (current stable). The skills instruct the agent to pass
  `--output json` and handle a `missing_hints` status; neither exists in 0.31.10.
  Revisit when upgrading to 1.0.
