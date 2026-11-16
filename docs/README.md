# m4's internal docs

What the code can't show: the decisions and their reasons, and the procedures for running production. How the code
works is in `AGENTS.md` and in comments beside it.

| File                               | What it is                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`DECISIONS.md`](DECISIONS.md)     | Product and architecture decisions, by id (`D-1`…), with their reasons. Change one there, in a PR, like code |
| [`operations.md`](operations.md)   | Procedures: one-time setup, deploys, rollbacks, migrations, previews                                          |

Rules:

- A decision's id never changes and is never reused; code comments may cite it. A decision replaced by another is
  marked "Superseded by D-n" rather than deleted.
- Rewrite a procedure when it changes; don't append a second account.
