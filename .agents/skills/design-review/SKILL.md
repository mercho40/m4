---
name: design-review
description: Run a design pass on m4's pages. Reviewers score fresh screenshots against reference apps the user picks, out of 10 per category, and you fix and recapture until 9 everywhere or 5 rounds. Use when the user says "design review" or asks for a UI or design pass.
---

# Design review

Adapted from tstack's `council` (MIT, see `../tstack-LICENSE`) and the brief in pingdotgg/t3code#25968.

Only for a **design pass**: a PR whose purpose is how screens look or read. Every other PR keeps `review-loop`. A design
pass still gets its `review-loop` for the code, once the design rounds are done.

## Reviewers

A list, so another model is one more line:

- Claude Opus 5.5 at high effort. Start it with the native `Agent` tool (`model: "opus"`), read-only.

Run each reviewer three times a round, in parallel, and take the median of each category: one run moves by about half
a point on the same screenshots, more than most fixes do. Each run is fresh: no history, no earlier scores. A reviewer
from another provider, when the user names one, starts with `delegate_task` beside the others and scores with them. A
reviewer that does not answer, or answers without the JSON block, gives `no score`; never invent one.

## The pack

Everything lives outside git, in `/tmp/m4-design-review/<branch>/`.

- **Ours.** With the app running (`test-m4`), capture each scene with the harness's browser at phone (390×844, 2×) and
  desktop (1440×900), into `round-<n>/{phone,desktop}/`. Scenes: `01-home` (`/`, signed out), `02-login`,
  `03-signup`, `04-signup-error` (passwords that do not match), `05-account` (signed in as a fresh user),
  `06-not-found` (any missing path). A long page gets a second shot scrolled to the bottom, `-end`.
- **References.** The user picks the reference apps for each pass; ask (`AskUserQuestion`) if they did not. Capture
  their public pages at the same steps and sizes into `references/<app>/`, with a README saying where each came from
  and which steps were out of reach. Third-party screenshots never go in git.

## A round

A round is capture, score, fix. Round 1 scores the branch before any change: its pack is the "before".

1. **Capture** the pack on the branch as it is.
2. **Brief.** Fill [brief.md](brief.md): the pack's folder, the references' folder and apps, and the files in each. The
   brief is blind: never give a target score, earlier scores, the stop rule, or what you changed. Same categories
   every round, so scores compare.
3. **Score.** Send the brief to each reviewer. Save each reply's JSON block beside the pack, as
   `round-<n>-<reviewer>-<run>.json`. Reviewers score the references by the same categories, so each category's median
   can be set against the best reference's: the aim is to lead every one of them. **Stop here** when every reviewer's
   median is at least 9 in every category on every device, or when this is round 5 (later only when the user asks):
   make no fix after the last score, so the PR's screenshots and scores match its code.
4. **Fix.** Read the fixes against the calls below and the code. Make the ones you agree with, the biggest gain first,
   within scope. Decline the rest in a line each (the PR lists them). Do not edit while a reviewer is still reading
   the pack.
5. **Check.** `bun run check` for what you touched, and the Svelte MCP's `svelte-autofixer` on every changed component
   until it reports nothing. Look at what changed in a browser. Then the next round, from step 1.

Past 9 each half point costs more rounds than everything before it. Once stopped, the owner decides on the preview.

## Fixed: the owner's calls

The brief names these. A reviewer may criticise them; you do not change them.

- shadcn-svelte components from `src/lib/components/ui/`, never restyled at the call site. A fix may choose another
  registry component, variant or size; adding one follows the `shadcn-svelte` skill.
- One dark theme: no light palette and no theme switcher. Colours come from the theme in `src/routes/layout.css`.
- `/` ships no JavaScript; sign-in and sign-up need it.
- English copy.

Fixes stay within layout, hierarchy, density, colour, copy, and which registry component a screen uses. No new
features, API changes or new data. Fight scope: a round that asks for a new screen gets a follow-up, not a fix.

**Drastic changes are welcome.** Within those limits, rework a page's whole layout, move things between pages or drop
what does not earn its place, when that scores better than polishing what is there. The brief asks reviewers for the
same.

## Watch for

- **Grey drift.** Reviewers' taste leans neutral, and the stock theme already is. Colour stays where it means
  something: the main action, errors, focus.
- **Contrast, measured.** For any colour you change, compute the contrast ratio of text on its background (4.5:1 for
  text, 3:1 for large text and controls) from the `oklch` values in `layout.css`; do not judge it by eye.
- **Scores are noisy**, and a reviewer swings on taste from round to round. Trust what several rounds ask for, not one
  round's. Once a call is made, add it to the brief's "Fixed" list: the reviewer then stops relitigating it.

## The PR

Label it `preview`. Before the model line of its description, add the scores, one table per reviewer, a row per
category and device and a column per round, then the fixes declined and why:

```markdown
## Design review

Rounds: 3. Reviewer: Claude Opus 5.5. References: <apps>.

| Category | Device | Round 1 | Round 2 | Round 3 |
| --- | --- | --- | --- | --- |
| Hierarchy | Phone | 7 | 8 | 9 |
```

Attach before-and-after screenshots of the scenes that changed (round 1's pack against the last round's) to the PR.
Edit the description each round; do not post comments for it.
