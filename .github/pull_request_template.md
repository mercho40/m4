## What and why

<!-- Open with the problem, then how this fixes it (the file-pr skill). This becomes the squash commit's body on main. -->

## Database

- [ ] No migrations
- [ ] Expand only (new tables, nullable columns or columns with defaults, indexes)
- [ ] Contract (drops or renames). Title marked with `!`, and nothing deployed reads the old shape any more

## Checks

- [ ] Title is a Conventional Commit, e.g. `feat(web): add the settings page`
- [ ] Needs a preview? Add the `preview` label (at most 2 open at once)
- [ ] A line of its own: `Reviewed with review-loop: …` or `Reviewed with council: …` (the skill writes it), or
      `Not reviewed: <why>`
