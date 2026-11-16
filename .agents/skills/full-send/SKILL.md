---
name: full-send
description: Take a task end to end to a merged PR and a production deploy, with nobody watching. Use when the user says "full send".
---

# Full send

Adapted from tstack's `full-send` (MIT, see `../tstack-LICENSE`). The user is not watching: your updates go unread
until long after you stop. You own the work from its current state to a merged PR deployed to production (every push
to `main` deploys). If the user did not clearly ask for a full send, do not assume this autonomy.

## What this request allows

Commit, push, rebase, fix conflicts, and `git push --force-with-lease` on this task's own branch. Run the app, the dev
servers, a browser and the tests, as proof needs, without asking first. Squash-merge the PR once it passes the gate.

It does not allow: bypassing branch protection (`--admin`), pushing to `main` directly, running the Rollback workflow,
touching production or its data any other way, deleting data, closing a PR, or force-pushing another branch.

## Steps

1. **Finish the change.** The smallest change that does what was asked. Fix the case that happened, not every case that
   could. On `main`, branch first (`<type>/<summary>`).
2. **Prove it.** See "Proof".
3. **Review it** with the `review-loop` skill, or `council` when the user asked for one.
4. **File the PR** with the `file-pr` skill: it rebases, runs `bun run check`, and writes the proof, the review's line
   and the labels.
5. **Wait for CI.** In T3 Code, `watch_pull_request` and end your turn; otherwise one background `gh pr checks --watch`.
   Never a polling or sleep loop. Fix real failures, with proof for each fix before you push it. Tell a failure in
   the code from a flaky runner.
6. **Merge** when the gate passes (below).
7. **Watch the deploy** (below).
8. **Report:** the PR link, the merge commit, the deploy's result, the proof, the review's outcome, and each decision
   you made for the user.

Stay active from step 1 to step 7: if you end your turn while checks are pending without a watcher, nothing wakes you.

## Proof

Evidence you saw yourself in this session, the most direct the change allows:

- Reproduce the failure, apply the fix, and watch the same reproduction pass.
- The tests of what you touched (`bun test <file>` in `apps/back`, against Postgres; `bunx vitest run <file>` in
  `apps/web`; `bun run e2e` for a flow across both apps), and `bun run check`.
- For UI and runtime behaviour, run it and look at the change in a browser (`test-m4`). Green tests do not prove a
  screen works.

If you cannot prove a change, you do not have full confidence: ask.

## The gate

All true on the latest commit:

- Your proof covers every change in the diff.
- `Test` and `PR checks` are green.
- Each review finding is fixed or declined with a written reason, and no human review asks for changes.
- The branch is up to date with `main`. `watch_pull_request` reports conflicts, not a branch that is behind: check
  `gh pr view --json mergeStateStatus` yourself. Never merge when commits landed on `main` after the last green run and
  touch the PR's files: rebase, push and wait again.

## Merge

Right before merging, `git fetch` and check the live PR once more: open, not a draft, its head the commit you checked,
up to date. Then `gh pr merge <n> --squash`, with the PR title as the commit subject. Never `--admin`.

Stop at the gate instead, and hand over as `full-stop` does, when the PR:

- is a design pass (`design-review`: the owner decides on the preview);
- is a contract change: a migration that drops or rewrites data, or a PR marked `!`;
- removes or changes something the live web app still calls on the API (the API deploys first, so it breaks until the
  web app catches up), unless the PR says why that is safe;
- carries an owner's call that a `council` only recommended, still unanswered.

## Watch the deploy

The merge starts the Deploy workflow on `main` (`.github/workflows/deploy.yml`): `Test` if that commit was not tested,
the migrations, the API through Haloy, then the web app to Cloudflare Workers with wrangler. Wait for its run on the merge commit
with one background `gh run watch <id> --exit-status`. A deploy that skips because its variables and secrets are not
configured (`docs/operations.md`) is not a failure: report it as skipped. If it fails, read its log and report what
failed; do not run Rollback or push a fix to `main` without asking. A fix goes through a new PR.

## Asking

A question in a normal message goes unseen and the thread looks done. Ask with the harness's question tool
(`AskUserQuestion`), with all the context in the question: the PR link, what blocks you, and the options with your
recommendation first. Ask only when you cannot go on alone: you cannot prove the change, the gate cannot pass and you
cannot fix it, the next step is outside what this request allows, the goal is ambiguous in a way that changes the
result, another PR makes this one obsolete, or the deploy failed. Decide everything else with sensible defaults, and
list those decisions in the report.

If no answer comes, take the safe path: leave the PR open and unmerged, and start the final message with the question.
In T3 Code, `unwatch_pull_request` before asking or handing over.
