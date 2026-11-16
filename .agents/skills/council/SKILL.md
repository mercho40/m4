---
name: council
description: Ask three independent reviewers, alone and in parallel, to settle a decision or to review a change, plan or design, and loop on their findings. Use when the user says "council" or asks for several independent opinions, and when you face a big call you would otherwise put to the owner (a product or architecture choice), to bring them a recommendation. Never as a PR's routine review.
---

# Council

Adapted from tstack's `council` (MIT, see `../tstack-LICENSE`). Three members who did not do the work, and do not see
each other's answers, give one answer each. You weigh them against the code.

Not for every PR: a PR's one review is `review-loop` unless the user asks for a council. A design pass is
`design-review`, the council's screenshot form.

## Members

The ones the user names. Otherwise three fresh runs of Claude Opus at high effort.

- Claude: three `Agent` calls in one message, so they run in parallel (`model: "opus"`, `effort: "high"`).
- Another provider's model, when the user names one: in T3 Code, `orchestrator_capabilities` once, then one
  `delegate_task` per member. If a named member cannot be reached, say so; never substitute another.

Members read; they never edit, commit, push, comment on PRs or start subagents. Do not edit the files they are reading
while they run. A member that does not answer, or answers out of format, gives `no answer`; never invent one.

## The brief

The same brief to each, standalone (they have no history): the repository's path, the question or the change (its base
and diff command), the intent and what is out of scope, the facts and constraints that bind the answer (AGENTS.md
rules, the owner's calls), and the reply format below. Never a target, your preference, or another member's answer.

## Decide

For a question with options. Each member replies:

```
CHOICE: <option>
WHY: <the reasons, citing files or rules>
RISKS: <what could go wrong with it>
```

The majority wins. With no majority, or when every member rejects every option, the user decides: show the options and
each member's reasoning in two or three lines. A call that belongs to the owner (a product decision, or an architecture
choice the template commits every project to) the majority only recommends, unless the owner asked the council to
settle it: put it to them (`AskUserQuestion`, or the PR's **Decisions**), and `full-send` never merges on it. Check each
answer's facts against the code before you count it; one that rests on a false fact does not count. Ask again only
when a new fact changes the question.

## Review

For a change, a plan or a design doc. Before it starts, fix what you already know is wrong and run the checks that
cover it (AGENTS.md); do not hand the council known bugs.

Each member scores it out of 10 and lists findings, with the same severities and format as `review-loop`'s brief
(`blocker`, `should`, `nit`, with a file, a line and a fix). As each answer arrives, check its findings against the code
and decide while the others run; once all have answered, fix what you agree with in the smallest way and decline the
rest with evidence. Then a new round with fresh members, the ledger of fixed and declined findings, and what changed
since.

Stop when every member scores 9 or more with no `blocker` or `should` open, or early when a round returns only nits
(verdict `approved` either way). After 3 rounds (more only when the user asks) the verdict is `stuck`: show the open
items, both sides in two or three lines, and the user decides. A review that grows the change is failing: fight scope.

## The PR

When the work is a PR, the council is its review: no `review-loop` as well. Put the `Reviewed with council:` line
before the model line of the description, at the start of a line (PR checks look for it), then the table:

```markdown
Reviewed with council: 2 rounds with 3 × Claude Opus 5.5. Verdict: approved

| Member | Round 1 | Round 2 |
| --- | --- | --- |
| Claude Opus 5.5 (1) | 7/10 | 9/10 |
```

For a decision, the description gets the question, the choice and the vote. Edit the description; do not post a
comment. Without a PR, the same goes in your reply.

Report each member's answer in a line or two, what you changed, what you declined and why, and what the user still has
to decide.
