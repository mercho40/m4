---
name: takeover
description: Finish someone else's work, a teammate's PR or branch or an agent's thread, to its original goal, and keep their credit. Use when the user asks to take over, finish, continue or pick up a PR, branch or thread that someone else started.
---

# Takeover

Adapted from tstack's `takeover` (MIT, see `../tstack-LICENSE`). You now own the original goal. You do not own the
first implementation: do not defend it because someone already built it.

## What you inherit

- Read the source whole: the PR's title, description, linked issue, commits, diff, review threads and checks; for a
  T3 Code thread, the thread (`t3_thread_read`) and its worktree's uncommitted changes. Read the user's later
  corrections too.
- Pin it to code: the head commit you start from, and any work not yet pushed. The handoff is context, not proof: a
  description that says "done" or "tested" may be wrong.
- State the original goal in a sentence, and what is left to reach it.

## Where to work

By default, a new branch: the original commits brought over as they are (cherry-picked or rebased, authors kept), your
fixes in commits of your own on top, and a new PR. Push to the original branch or edit the original PR only when the
user says so; then never rewrite its commits without asking. Never overwrite work that is not yours to change.

Bring it up to date with `modernize`'s questions and its MODERNIZE, REWORK or CLOSE call, rebasing your new branch,
never pushing the original. REWORK here means do the rework: the user already asked you to finish it. CLOSE you put to
the user.

## Finish it

- Rework what the goal needs, simplify where you can, and keep every behaviour the original meant to ship, on both
  apps where it reaches both. Leave out features it did not set out to add.
- Prove it yourself: the failure it fixes, then the real flow (`test-m4` for anything a person sees). Its passing
  tests are not your proof.
- Look at the source again before you file: its author may have pushed since you started.
- Review with `review-loop` (or `council` when the user asked for one), file with `file-pr`, and see CI through as
  `full-send` does.

## Credit

- Every commit you bring over keeps its author. Check who they are with `git log --format='%an <%ae>' <base>..<head>`;
  never guess an email.
- The squash keeps only the PR's title and description, so the new PR's description credits them twice: a line naming
  the original PR and who started it, and at its very end a `Co-authored-by: Name <email>` line for each human author
  other than the new PR's (`file-pr`, "Credit goes last"). Never one for an agent.

## Afterwards

Close the original PR, or comment on it, only when the user says so. A comment opens with the agent note in
`file-pr`, and links the new PR.

Report what you inherited (its head commit), what you changed and why, how you proved it, how the credit is kept, and
what is left to decide, with both PRs' links.
