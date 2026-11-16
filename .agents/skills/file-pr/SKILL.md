---
name: file-pr
description: File or update an m4 pull request whose title says why the change matters and whose description leads with the problem. Use whenever you open a PR or rewrite one's title or description, whether or not the user named the skill; full-send, full-stop and takeover file through it.
---

# File a PR

Adapted from tstack's `file-pr` (MIT, see `../tstack-LICENSE`).

## Before

- `gh pr view` on the branch: if a PR exists, update it rather than opening a second.
- Never from `main`: branch as `<type>/<summary>`.
- Read `git diff origin/main...HEAD` whole: it holds what the goal needs and nothing else (no stray files, plans or
  screenshots).
- When you file or push new work: rebase onto the latest `origin/main` and run `bun run check`. Rewording a PR
  needs neither.
- The review is done: `review-loop`, or a council when the user asked for one.

## Title

The squash makes it `main`'s commit: a Conventional Commit (`feat`, `fix`, `perf`, `refactor`, `chore`, `ci`, `build`,
`docs`, `test`, `revert`; scope `web`, `back`, `ci`, `deps` or `docs` when one fits; `!` for a breaking change; no
closing period). PR checks refuse anything else. It says what changes for the people it affects (who uses the app, or
the team for `chore`, `ci` and `docs`), in plain English, not which code moved:

- Bad: `fix(web): wrap signOut in try/catch on the account page`
- Good: `fix(web): a failed sign-out says so instead of leaving the button spinning`

## Description

Fill the PR template (`.github/pull_request_template.md`). Open with the problem, from what the user asked: who meets
it and what goes wrong, in a sentence or two. Then how this fixes it, briefly. Not an inventory of files and functions;
a reviewer reads the diff for that.

- Bad: "Wrapped `authClient.signOut()` in try/catch in `account/+page.svelte` and added a `message` state."
- Good: "With the API unreachable, Sign out on /account spun forever and nobody could tell they were still signed in.
  The page now says it failed, and the button works again."

Then, each only when it applies:

- **Proof:** one line on how you saw it work (`test-m4` for anything a person sees), and what you could not check.
- **Screens:** before and after screenshots of what a person sees, attached to the PR. If you cannot attach them, say
  so; never commit them.
- **Database:** the template's choice: no migrations, expand only, or contract. A contract migration (it drops or
  rewrites what the deployed code reads) marks the title with `!` and ships only once nothing deployed reads the old
  shape.
- **Decisions:** a call the owner should know you made, or a question for them.
- **The review's line**, at the start of a line: `Reviewed with review-loop: …` or `Reviewed with council: …`, or
  `Not reviewed: <why>`. PR checks refuse a description without one.

Then the model and harness that made it, subagents that wrote part of it included: `Made with <model> in <harness>.`
Use the name the harness reports; if it reports none, name the harness only.

**Credit goes last.** The squash makes the description `main`'s commit message, and Git reads `Co-authored-by:` only
in its last paragraph. So when other humans' commits are in the PR (`takeover`), end with a blank line and one
`Co-authored-by: Name <email>` line for each, nothing after them; the squash drops their authorship otherwise. Never
one for the PR's own author, or for an agent.

Read the title and the whole description, quotes and attachments included, for secrets and private details before
you file: tokens, `.env` values, users' emails from a database, production data.

## Filing

- A real PR, not a draft. `gh pr create --base main --title … --body-file <file>`; if GraphQL's rate limit is spent,
  `gh api repos/<owner>/<repo>/pulls -f title=… -f head=… -f base=main -F body=@<file>`.
- Label it `preview` when a person sees the change in a browser: it gets a full-stack preview.
- In T3 Code, link the PR to the thread.
- No follow-up comment unless the user asked for one. A comment you post for the user opens with
  `> [!NOTE]` / `> 🤖 **<model> responding on behalf of <user>**`, then the conclusion and its evidence.

Report the PR's link, its head commit, and its labels.
