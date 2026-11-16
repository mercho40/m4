---
name: review-loop
description: Review a change with a fresh read-only reviewer, in a loop of at most three rounds. Run it before opening a PR and before pushing new work to one, every time, whether or not the user asked; PR checks fail without the line it writes. A council replaces it when the user asks for one. Also when the user says "review loop".
---

# Review loop

Adapted from tstack's `sol-loop` (MIT, see `../tstack-LICENSE`). A fresh reviewer that did not write the change reads
it, you answer its findings, and it checks again. This is the PR's one review (one implementer, one review), run as a
loop; a `council` replaces it when the user asks for one.

Make the smallest changes that answer real findings. Push back on the rest: review loops grow a PR one cheap-looking
fix at a time.

## Reviewer

A fresh Claude Opus run at high effort. In Claude Code, start it with the `Agent` tool. In T3 Code, use the native
`Agent` too; `delegate_task` is only for another provider's model. If the user names another reviewer, it replaces
Opus here; do not run two reviewers.

The reviewer never edits, commits, pushes, comments on PRs or starts subagents. Do not edit the files under review
while it runs. No reply, an error or a timeout is not approval.

## Budget

- At most 3 rounds. Round 1 reads the whole change. Rounds 2 and 3 read only what changed since and the open findings.
- Stop early when a round returns only nits. Declined nits, and fixes to comments, docs or formatting, need no new
  round.
- Keep a ledger: id, severity, outcome (fixed, disagreed with evidence, declined).

## 1. Scope

Run `git status --short`. Do not stash, discard or include unrelated changes. After `git fetch origin`, the base is
`git merge-base HEAD origin/main` (or the PR's base). The change is base to working tree, untracked files included.
Use one diff command every round.

State the intent and what is out of scope in one or two sentences. Run the checks that cover the change (AGENTS.md:
the touched tests, `bun run check` before a push). Do not send code that fails them; note pre-existing failures in the
brief.

## 2. Round 1 brief

The reviewer has no history. Send:

```
Review only. Do not edit, commit, push, comment on PRs, or start subagents.
Repo: <abs path> Base: <sha> Intent: <intent> Out of scope: <scope> Checks: <results>
See: git diff <base> [-- <paths>]; git status --short (read untracked files).
Read AGENTS.md and the surrounding code. Find bugs, broken callers, a mismatch with the intent, and broken rules
from AGENTS.md (authentication and sessions, cookies across the two origins, migrations, env vars, the Eden contract).
Skip style unless it hides a bug. Hold to the smallest change: flag code, tests or guards the intent does not need.
Other paths, rare cases, small performance costs and extra compatibility are nits.
blocker = the intended case is wrong. should = a real bug callers will hit, within the intent. nit = the rest.
Reply:
VERDICT: APPROVE or CHANGES
R1 [blocker|should|nit] <file>:<line> <claim>. Fix: <suggestion>   (stable ids)
```

## 3. Answer findings

Check each finding and its severity yourself; another path, a rare case or a small cost is a nit, whatever its label.

- Agree: the smallest fix. Prefer deleting or narrowing code over a new helper, cache, lock or option. Add one focused
  test only if the fix changes behaviour a test should hold.
- Disagree: say why, with evidence (file:line, a test, output).
- Out of scope, or a nit: decline in one line and list it as a follow-up.

Re-run the checks and `git diff --shortstat <base>`. If the review grew the diff, cut first. Do not agree just to end
the loop.

## 4. Next round

Only if the budget allows and a blocker or should is open, or behaviour changed since the last approval. Start a fresh
reviewer with the round 1 brief, the ledger (`fixed:` / `disagree:` / `declined:` with evidence) and the change since
the last round. Ask it to mark each old id `resolved` or `still open: <reason>`.

## 5. Stop

- **Agreed:** APPROVE on the current diff, nothing blocker or should open, no concern of your own.
- **Stuck:** an item still disputed after two replies, or the budget is spent. Show both sides in two or three lines
  each; the user decides. The budget ending is not approval.

Put this line in the PR's description, at the start of a line above the model line (PR checks look for it), now if the
PR exists or else when you file it:

`Reviewed with review-loop: <N> rounds with <model>. Verdict: approved` (or `stuck`, with the open items)

A PR that skips the review says why instead: `Not reviewed: <why>`.

Report the rounds, the model, what the review changed, the diff size before and after, and each fixed or declined
finding with its reason.
