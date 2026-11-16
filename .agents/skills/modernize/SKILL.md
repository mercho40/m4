---
name: modernize
description: Bring an old PR up to date with main, deciding first whether it should still exist. Use when asked to rebase or update a PR, or to "modernize" one.
---

# Modernize

Adapted from tstack's `modernize` (MIT, see `../tstack-LICENSE`). Modernize the idea, not just the branch: a clean
rebase does not prove the PR still belongs in the product.

## Guardrails

- Fetch first: `origin/main`, the PR's branch, and any branch the work depends on.
- Treat changes in the worktree as the user's. If it is dirty or in use, work in a new worktree.
- Modernizing allows rebasing and updating the PR's branch. It does not allow merging, closing, changing the base, or
  growing the scope.
- Push a rebased branch only with `--force-with-lease=<branch>:<head before the rebase>`.
- No PR comment unless the user asked for one.

## What the PR was for

Record the PR's URL, state, base, head branch and commit, author, checks and reviews. Read its title, body, linked
issue, commits, review threads and whole diff. State the smallest goal it was after before judging how it got there.
Record the merge base, so the PR's own changes and `main`'s since then can be read apart.

## What changed around it

Read `main`'s commits since the merge base, and search merged and open PRs that touch the same code or behaviour:

- Has the same problem been solved on `main` already?
- Did an API route, a type, the schema, a dependency, or a rule in AGENTS.md it relies on change?
- Was the code it changes deleted, moved or simplified on purpose?
- Would landing it bring back old behaviour, or make two ways to do the same thing?
- Is it still worth what it costs to keep?

No conflicts in Git does not mean the PR is current.

## Decide before pushing

- **MODERNIZE:** the goal still matters and the shape is right. Rebase, resolve, check, push.
- **REWORK:** the goal still matters but a rebase would keep the wrong shape. Describe the smallest rewrite and stop,
  unless the user also asked for the rework.
- **CLOSE:** superseded, obsolete, wrong, or not worth its cost. Cite the evidence and stop. Never close it without
  the user's permission. Age is not evidence; effort already spent is not a reason to keep it.

## Rebase

1. Branch or worktree at the recorded head; rebase its commits onto the fetched `origin/main`.
2. Resolve each conflict by the PR's intent and `main`'s newer rules. If a conflict shows a disagreement about the
   product or the architecture, stop and reconsider the decision instead of guessing.
3. Files that are generated, not merged by hand:
   - **Migrations:** never edit or rename an applied one (CI checks). If both sides added one, drop the PR's folder
     and regenerate it on top (`bunx drizzle-kit generate --name <change>`, then `check`, in `apps/back`).
   - **`bun.lock`:** take `main`'s, then `bun install`; if dependencies changed, confirm both apps still resolve one
     `elysia` (`readlink apps/*/node_modules/elysia`).
4. Compare the series before and after with `git range-diff`, and read the final diff: no intended behaviour lost, no
   behaviour that already landed brought back.
5. Run the checks of what the PR touches, and `bun run check`. Tell real failures from ones already on `main`.
6. Push with the lease. If the lease fails, fetch and decide again; never overwrite new work.

## Report

Lead with MODERNIZE, REWORK or CLOSE and the reason. Then: what changed on `main` that matters, conflicts of intent
(or that there were none), the rebase and push, the checks and their results, and what is left to decide, with the
PR's link. Keep what you observed apart from what you judge, and say what you could not verify.
