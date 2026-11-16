# Design review: m4

You are a senior product designer. Review m4's web app from the screenshots in this pack. This is a read-only review:
do not edit files, start servers, open browsers or start subagents. Read every image before you score.

m4 is a starter for web apps: a public landing page, sign-up and sign-in (email and password, or GitHub and Google),
and an account page for the signed-in user. Products built on it start from these pages, so they must be clear and
calm with nothing of their own to lean on: no product data, no illustrations. Visitors use a phone or a laptop.

## What is in the pack

Screenshots: `{{PACK}}`, one folder per device (`phone`, `desktop`). Phone is 390×844 at 2×; desktop 1440×900. Files
ending in `-end` are the same page scrolled to the bottom. Scenes, in the order a visitor meets them:

| Scene | What it is |
|---|---|
| 01-home | The landing page, signed out |
| 02-login | Sign in |
| 03-signup | Sign up |
| 04-signup-error | Sign up refusing passwords that do not match |
| 05-account | The account page, signed in |
| 06-not-found | The error page for a missing path |

{{FILES}}

Do not score the placeholder product name or description. Do score how the pages lay them out.

References: `{{REFERENCES}}`, one folder per app, screenshots of {{REFERENCE_APPS}} at the same steps, from their public
pages (some steps are missing; each folder's README says which). What visitors are used to, and what m4 is measured
against, not a look to copy.

{{REFERENCE_FILES}}

## Fixed

These are the owner's decisions. Say if one hurts, but score the screens within them and propose fixes that keep them:

- Components are shadcn-svelte's stock components, never restyled one by one. A fix may use another stock component,
  variant or size.
- One dark theme, with no light mode and no theme switcher.
- The landing page runs no JavaScript.
- English copy.
- No new features, pages or data: layout, hierarchy, density, colour, copy and component choice only.

Within these, drastic changes are welcome. If a page would be better rebuilt than polished (another layout, things
moved between pages, something dropped), say so and describe it. Simpler is better: propose what to remove, merge or
say once as readily as what to add.

## How to score

Score each category from 1 to 10 for each device. 10 is the best sign-up and account experience you know on that
device. 7 is solid but clearly behind the best.

Categories, by id:

- `hierarchy`: what matters on each page is seen first; the next step is obvious.
- `typography`: sizes, weights, line lengths.
- `layout`: spacing, alignment, density, how each page uses its space.
- `colour`: neutral structure, actions, errors and focus, in the dark theme.
- `components`: the right control for each job, used consistently.
- `flow`: from the landing page to an account and back out; nothing extra, nothing missing.
- `trust`: the visitor knows where they are, what an action will do, and what went wrong.
- `touch`: tap targets and reach on the phone; hover and pointer use on the desktop.
- `accessibility`: contrast, legibility, state never told by colour alone, focus and labels where visible.
- `copy`: clear, short, consistent English.

Score each reference app the same way: every category, each device, on the same scale, from what its screenshots show.
Where a reference's screenshots cannot show a category at all, give `null` rather than a guess.

Then say what feels worse, blander or less clear than it should, and what works well and must stay. Name the scene and
device each time.

Then list the five fixes that would raise the scores most, most important first. Each names the scene and device, what
is wrong, and the change you would make. Be specific: "on 03-signup, phone, the social buttons push the email field
below the fold; put them under the form" is useful, "improve spacing" is not.

## Reply format

`references` has one entry per reference app, by its folder's name, each shaped as `example` is below.

Plain prose and short lists. End with exactly one fenced `json` block in this shape, with your numbers:

```json
{
  "scores": {
    "phone": { "hierarchy": 0, "typography": 0, "layout": 0, "colour": 0, "components": 0, "flow": 0, "trust": 0, "touch": 0, "accessibility": 0, "copy": 0 },
    "desktop": { "hierarchy": 0, "typography": 0, "layout": 0, "colour": 0, "components": 0, "flow": 0, "trust": 0, "touch": 0, "accessibility": 0, "copy": 0 }
  },
  "references": {
    "example": {
      "phone": { "hierarchy": 0, "typography": 0, "layout": 0, "colour": 0, "components": 0, "flow": 0, "trust": 0, "touch": 0, "accessibility": 0, "copy": 0 },
      "desktop": { "hierarchy": 0, "typography": 0, "layout": 0, "colour": 0, "components": 0, "flow": 0, "trust": 0, "touch": 0, "accessibility": 0, "copy": 0 }
    }
  },
  "fixes": [{ "scene": "", "device": "", "problem": "", "change": "" }]
}
```
