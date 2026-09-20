# IfcOpenShell-TS — Orchestration Spec

Status: locked in 2026-09-20, by project owner. Written from the orchestrating session's
perspective: "I" is the orchestrating Claude Code session, "you" is the project owner. Adjusted
from the owner's original draft after a review pass against this project's actual, established
practice (see "Adjustments from the original draft" at the end).

## 1. Chunk source & granularity

Chunks come from `20-roadmap.md`, in phase order (0 → 1 → 2 → 2.5 → 3 → 4/5 → 6 → 6.5 → 7 → 8 →
9 → 10). Within phases 6–9, each `api`/`util` subpackage (or a small tightly-related group, e.g.
`pset` + `pset_template`) is its own chunk/PR — not the whole phase at once.

## 2. Sequencing

Phases 0–2 are strictly serial (one agent, one chunk in flight — hard dependency: native binding
must exist before the core TS layer, which must exist before anything else). From Phase 3 onward,
I dispatch concurrent agents across the independent lanes identified in the "Lane map" (see
`PROGRESS.md`): Lane A (`util` Tier A → `api` Tier 1 → 2 → 3), Lane B (`util` Tier B, once Lane
A's `element`/`schema`/`unit` land), Lane C (`selector.py` DSL, independent from Phase 2 on), Lane
D (`api` Tier 4 non-kernel, once its prerequisites land) — capped at a small number concurrent
(starting at 2–3) so I can actually track and review each one properly rather than losing the
thread.

**Current state (2026-09-20): Lanes A/B/C are all complete.** Only Lane D (Phase 9) is still
active, and it is one dependency chain of chunked sub-modules sharing common files (e.g.
`api/sequence/index.ts`), not several independent lanes — so there is currently nothing to run
concurrently against. Dispatch stays serial (one chunk in flight) until either Phase 9 surfaces
genuinely independent modules worth parallelizing, or Phase 10 does. Revisit this note if that
changes.

## 3. Per-chunk workflow

- I write a scoped implementation prompt: what to build, exactly which planning docs (and which
  sections) to read, the chunk's exit criterion, relevant prior decisions from `10-architecture.md`
  / `30-open-questions.md`, and any now-in-scope `TODOS.md` items.
- Agent implements in its worktree (see §5 below on isolation), runs `/review`, then `/ship`
  (pushes, opens a PR against `v0.9.0`, never merges).
- Agent reports the PR to me. **The agent does NOT edit `PROGRESS.md`/`TODOS.md`** — see the
  adjustment in §6 below for why this diverges from the owner's original draft.
- I review the PR against: architecture fidelity (matches `10-architecture.md`), the chunk's exit
  criterion met, tests present per `40-testing-strategy.md`, no scope creep beyond the chunk —
  and, per this project's standing "never trust a self-report" discipline, I re-verify every
  disclosed finding personally against the real Python source, the generated `.d.ts` files, or (as
  needed) a live trace script against the worktree's own built native addon.
- Clean → I run `/land-and-deploy` (its core merge logic, pragmatically adapted — this is a
  library with no deploy/canary target) to merge the PR, or `gh pr merge --squash --delete-branch`
  directly once CI is green and the PR is mergeable, whichever `/land-and-deploy`'s own machinery
  doesn't cleanly fit. Not clean → specific change instructions, loop back.
- Landed → I write the `PROGRESS.md`/`TODOS.md` updates myself (full narrative, independently
  verified, not the agent's self-report) and open a small docs-only PR. A docs-only PR does not
  require `/review`/`/ship`/`/land-and-deploy` — it can be merged directly with `gh pr merge` once
  CI is green and it's mergeable (this repo's branch protection requires every change, including
  docs, to go through a PR — direct pushes to `v0.9.0` are rejected).
- Docs PR open → I monitor for CI completion (via `Monitor`, keyed by check-run `id`) and merge
  once green. **While that CI runs, I generate the next chunk's prompt** rather than idling.

## 4. Publish gate

At Phase 2.5 (alpha) and Phase 6.5 (beta), the agent prepares everything up to the publish command
and stops. I bring it to you for explicit go-ahead before the actual `npm publish` runs — every
time, not just the first.

## 5. Agent isolation

Worktree-based, local. Each dispatched agent gets its own git worktree (currently via the Agent
tool's built-in `isolation: "worktree"`, which creates `.claude/worktrees/agent-<id>/` on a fresh
branch off `origin/v0.9.0`). `PROGRESS.md`'s older "Operational note" describing a manual
worktree-creation workaround for an `EPERM` failure in `isolation: "worktree"` is stale as of PR
#137 (that dispatch got a working worktree via `isolation: "worktree"` directly) — flagged for a
follow-up fix to that note, not repeated here as current practice.

No sandboxing package (`@anthropic-ai/sandbox-runtime` or otherwise) is present anywhere in this
repo. If sandboxing is enforced, it is at an infra layer outside what this session can see or
verify — this spec does not claim it as an active guarantee, and merge/review decisions should not
depend on it being true.

## 6. Escalation policy

An agent stuck on a technical problem (failing tests, build errors) gets 2–3 fix attempts before
escalating — to me, not you. I resolve it if the plan already has a clear answer (including
pre-agreed fallback criteria like the wrappergen spike's pass/fail conditions) or it's a trivial
call; a genuine unresolved product/design decision comes to you. Separately, credential-handling or
other trust/security incidents always come to you immediately regardless of whether they're
"technical" — that is not a judgment call I make alone.

## 7. Definition of done

The loop runs through Phase 10's exit criterion (full non-geometry parity). Phases G1 (geometry)
and B1 (browser) are explicitly post-v1 and out of scope for this loop unless you tell me
otherwise when we get there.

## Adjustments from the original draft

The owner's original draft (2026-09-20) was reviewed against this project's actual established
practice before being locked in here. Two points were surfaced and resolved by the owner directly:

- **Who writes `PROGRESS.md`/`TODOS.md` entries.** The original draft said the agent updates the
  relevant planning doc "with real outcomes as part of the same PR." Decided: keep the existing
  practice instead — the orchestrating session (me) writes the full narrative myself, after
  independently re-verifying every claim, in a separate post-merge docs-only PR. Rationale: matches
  this project's "never trust a self-report" discipline; the permanent record should not carry an
  agent's unverified framing of its own work, even as a first draft to edit.
- **Concurrency.** The original draft's 2–3-concurrent-agents cap is not new (already documented in
  `PROGRESS.md`'s Lane map) but was not reflected in recent practice, which has been serial.
  Decided: this is correctly serial for now, not a violation — Lanes A/B/C are complete, and Lane D
  (the only active lane) is presently one dependency chain, not several independent lanes to run
  side-by-side. Revisit when that changes.
- **Sandbox isolation wording.** The original draft specified agents run "sandboxed with
  `@anthropic-ai/sandbox-runtime`." That package isn't present in this repo and couldn't be
  confirmed. Decided: drop the claim rather than assert an unverifiable guarantee; record actual
  current behavior (Agent tool's built-in `isolation: "worktree"`) instead.
