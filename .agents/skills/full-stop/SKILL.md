---
name: full-stop
description: Take a task end to end to a PR that is ready to merge, then stop without merging. Use when the user says "full stop", even as a closing "Full stop." that reads like emphasis.
---

# Full stop

Adapted from tstack's `full-stop` (MIT, see `../tstack-LICENSE`). Do the same work as `full-send`, but stop with the PR
ready for the user to merge.

Read [full-send](../full-send/SKILL.md) and follow its steps 1 to 5, its proof, its gate and its rules for asking. A
"full stop" request gives the same permissions, without the merge. The rules below take precedence.

## No merging

Never merge, enable auto-merge, push to `main`, bypass branch protection, or have another agent do any of these.

## Hand over at the gate

When full-send's gate passes, fetch and check the live PR once more: open, not a draft, its head the commit you
checked, up to date with `main`. If someone else merged it, say so instead.

In T3 Code, `unwatch_pull_request` first. Report:

- the PR link and its head commit;
- **ready to merge**, **waiting for a human review**, or **blocked** with what blocks it, what you tried and what is
  needed;
- the proof, the review's outcome, and each decision you made for the user;
- what remains unverified.
