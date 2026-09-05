# IfcOpenShell-TS — Implementation Progress

Live execution tracker against `planning/ifcopenshell-ts/20-roadmap.md` (the source of truth for
*scope*; this file tracks *status* only — update the roadmap doc, not this one, if scope changes).
Updated by the orchestrating session after every chunk state change. Loop spec: sequential through
Phase 2, then parallel lanes from Phase 3 on (see Lane map below). Full orchestration spec agreed
2026-09-04, not repeated here — see the conversation history or ask the orchestrating session.

## Status legend

🔲 not started · 🔄 dispatched (agent working, worktree isolated) · 👀 in review (PR open,
orchestrator reviewing against design) · ✏️ changes requested · ✅ landed (`/land-and-deploy`'d) ·
🛑 blocked (needs user input) · ⏸️ paused (npm-publish confirmation gate — see Phase 2.5/6.5)

## Current focus

🔄 Phase 1's real primitive binding surface dispatched, working in `ts/phase-1-primitive-binding`
off `v0.9.0` (`a8b2a7517`). Also: a small docs-only tracker-sync PR (#4) is in flight, unrelated to
this work.

## Operational note: worktree isolation workaround

The Agent tool's built-in `isolation: "worktree"` fails in this sandbox (`EPERM` creating `.claude/`
inside this repo — confirmed not transient, reported as a product bug). Workaround in use for every
chunk: the orchestrating session manually runs `git worktree add -b <branch> <scratch-path> v0.9.0`
first, then dispatches the agent with no `isolation` param, instructed to `cd` into that pre-made
path as its first step. Branch naming convention: `ts/phase-<n>-<slug>`.

## Lane map (active from Phase 3 onward — Phases 0–2 are strictly serial)

- **Lane A** (main line): `util` Tier A → `api` Tier 1 → `api` Tier 2 → `api` Tier 3
- **Lane B**: `util` Tier B — needs Lane A's `util.element`/`util.schema`/`util.unit` landed first
- **Lane C**: `selector.py` query DSL — independent from Phase 2 onward, no `util`/`api` dependency
- **Lane D**: `api` Tier 4 non-kernel — needs Phase 4's matrix library + Phase 6's Tier 1 landed

Concurrency cap: 2–3 agents in flight at once, so review stays trackable.

---

## Phase 0 — Scaffolding

| Chunk | Status | PR | Notes |
|---|---|---|---|
| Package skeleton + native addon smoke test + CI (6 OS×arch combos) | ✅ | [#1](https://github.com/mikitski/IfcOpenShell/pull/1) | Landed `8931001035`; 5 real CI bugs found+fixed during bring-up |

## Phase 1 — Low-level binding

Split into sequential chunks (too large for one PR): the spike had to resolve before the primitive
binding could be built, since it decided generated-vs-hand-written.

| Chunk | Status | PR | Notes |
|---|---|---|---|
| `wrappergen` validation spike (generated vs. hand-written decision) | ✅ | [#3](https://github.com/mikitski/IfcOpenShell/pull/3) | Landed `a8b2a7517` — **PASS**: extend wrappergen. 5 bugs found+fixed, incl. a confirmed use-after-free (new "borrowed" handle-kind). See `research/06-wrappergen-spike-results.md`. |
| `file`/`entity_instance` primitives + schema introspection | 🔄 | — | dispatched, `ts/phase-1-primitive-binding` |
| Async primitive variants (`napi_create_async_work`) | 🔲 | — | — |
| Native memory accounting (`napi_adjust_external_memory`) | 🔲 | — | — |
| ASAN/UBSan CI + fuzz testing of parse primitives | 🔲 | — | — |

## Phase 2 — Core TS layer

| Chunk | Status | PR | Notes |
|---|---|---|---|
| "Fresh wrapper per access" identity spike (blocks rest of phase) | 🔲 | — | — |
| `IfcFile` (`file_mixin` port, incl. `dispose()`) | 🔲 | — | — |
| `EntityInstance` (Proxy + attribute-metadata cache) | 🔲 | — | — |
| `.d.ts` generator (or hand-written fallback for high-traffic classes) | 🔲 | — | — |
| `guid.ts`, `settings.ts`, `template.ts` | 🔲 | — | — |
| Differential cache-correctness test (all 3 schema versions) | 🔲 | — | — |

## Phase 2.5 — Alpha checkpoint ⏸️ npm-publish confirmation required

| Chunk | Status | PR | Notes |
|---|---|---|---|
| Benchmark suite + one-time Python-baseline comparison | 🔲 | — | — |
| `npm publish ifcopenshell@alpha` | 🔲 | — | ⏸️ stops for explicit user go-ahead |

## Phase 3 — `util` Tier A [Lane A]

| Chunk | Status | PR | Notes |
|---|---|---|---|
| `util.element` | 🔲 | — | do first — most depended-on |
| `util.schema` | 🔲 | — | |
| `util.unit` | 🔲 | — | |
| `util.attribute` | 🔲 | — | |
| `util.classification` | 🔲 | — | |
| `util.constraint` | 🔲 | — | |
| `util.date` | 🔲 | — | |
| `util.file` | 🔲 | — | |
| `util.pset` | 🔲 | — | |
| `util.resource` | 🔲 | — | |
| `util.system` | 🔲 | — | |
| `util.type` | 🔲 | — | |
| `util.doc` | 🔲 | — | |
| `util.mvd_info` | 🔲 | — | |

## Phase 4 — `util` Tier B [Lane B — needs `util.element`/`schema`/`unit`]

| Chunk | Status | PR | Notes |
|---|---|---|---|
| `util.placement` (`gl-matrix`) | 🔲 | — | — |
| `util.geolocation` | 🔲 | — | — |
| `util.representation` | 🔲 | — | — |
| `util.cost` (hand-rolled formula parser) | 🔲 | — | — |
| `util.shape` (`polygon-clipping`) | 🔲 | — | — |
| `util.shape_builder` | 🔲 | — | — |
| `util.alignment` | 🔲 | — | — |

## Phase 5 — `selector.py` query DSL [Lane C — independent from Phase 2]

| Chunk | Status | PR | Notes |
|---|---|---|---|
| Query DSL (3 grammars, hand-rolled recursive-descent) | 🔲 | — | — |

## Phase 6 — `api` Tier 1 [Lane A]

| Chunk | Status | PR | Notes |
|---|---|---|---|
| Pre/post-listener hook system (cross-cutting, do first) | 🔲 | — | — |
| `api.root` | 🔲 | — | small fn count, tricky logic — budget real time |
| `api.project` | 🔲 | — | — |
| `api.spatial` | 🔲 | — | — |
| `api.aggregate` | 🔲 | — | — |
| `api.owner` (+ injectable settings DI) | 🔲 | — | — |
| `api.unit` | 🔲 | — | — |
| `api.context` | 🔲 | — | — |
| `api.pset` | 🔲 | — | — |
| `api.type` | 🔲 | — | — |
| `api.classification` | 🔲 | — | — |
| `api.group` | 🔲 | — | — |
| `api.layer` | 🔲 | — | — |
| `api.document` | 🔲 | — | — |
| `api.library` | 🔲 | — | — |
| `api.constraint` | 🔲 | — | — |

## Phase 6.5 — Beta checkpoint ⏸️ npm-publish confirmation required

| Chunk | Status | PR | Notes |
|---|---|---|---|
| Benchmark re-run (no regression) | 🔲 | — | — |
| `npm publish ifcopenshell@beta` | 🔲 | — | ⏸️ stops for explicit user go-ahead |

## Phase 7 — `api` Tier 2 [Lane A]

| Chunk | Status | PR | Notes |
|---|---|---|---|
| `api.material` (discriminated-union design) | 🔲 | — | — |
| `api.feature` | 🔲 | — | — |
| `api.nest` | 🔲 | — | — |
| `api.style` | 🔲 | — | — |
| `api.system` | 🔲 | — | — |
| `api.resource` | 🔲 | — | — |
| `api.profile` | 🔲 | — | — |
| `api.cost` | 🔲 | — | — |

## Phase 8 — `api` Tier 3 [Lane A]

| Chunk | Status | PR | Notes |
|---|---|---|---|
| `api.sequence` | 🔲 | — | — |
| `api.structural` | 🔲 | — | — |
| `api.georeference` | 🔲 | — | — |
| `api.grid` | 🔲 | — | — |
| `api.boundary` | 🔲 | — | — |
| `api.drawing` | 🔲 | — | — |
| `api.control` | 🔲 | — | — |
| `api.pset_template` | 🔲 | — | — |

## Phase 9 — `api` Tier 4, non-kernel [Lane D — needs Phase 4 + Phase 6]

| Chunk | Status | PR | Notes |
|---|---|---|---|
| `api.geometry` — relationship-CRUD functions | 🔲 | — | — |
| `api.geometry` — parametric shape-builder functions | 🔲 | — | — |
| `api.alignment` (non-kernel) + `api.cogo` | 🔲 | — | — |

## Phase 10 — v1 completeness pass

| Chunk | Status | PR | Notes |
|---|---|---|---|
| `validate.py` port | 🔲 | — | — |
| Full parity audit (Python test tree ↔ TS test tree) | 🔲 | — | — |
| Niche `util` modules: `brick`, `fm`, `profiler` | 🔲 | — | — |
| Derived-attribute support (EXPRESS rules) | 🔲 | — | — |

**v1 done when every row above is ✅.**

---

## Post-v1 (out of scope for this loop unless redirected)

- Phase G1 — Geometry kernel binding
- Phase B1 — Browser/WASM target

## Blockers / escalations

- **2026-09-04 — GitHub push access — RESOLVED.** User fixed the PAT (it previously lacked repo
  access). Confirmed working via a real push. No longer blocking.
- **2026-09-04 — `gh` CLI broken in this sandbox — WORKED AROUND, not resolved.** `gh` (both
  `gh auth status` and any `gh api`/`gh pr *` call) fails with a client-side TLS certificate
  verification error (`x509: OSStatus -26276`), independent of token validity. `git` and raw `curl`
  (using the token from `git credential fill`) work fine over the same network path. Every `gh`
  operation in this orchestration loop (CI status checks, PR merge, branch deletion) is being
  substituted with the curl+credential-helper equivalent. Not investigated further — no need to fix
  the underlying `gh` install unless it becomes a blocker for something curl can't do.
- **2026-09-04 — Planning docs accidentally bundled into the Phase 0 merge commit — noted, not
  fixed.** The orchestrator's initial planning-docs commit (`ee5756693`) was made directly to local
  `v0.9.0` but never pushed to `origin` before the Phase 0 worktree was branched from it. When PR #1
  squash-merged, GitHub computed the diff against `origin/v0.9.0`'s actual (older) tip, so the merge
  commit `8931001035` — titled "Add ifcopenshell-ts Phase 0 scaffolding" — also carries the full
  `planning/ifcopenshell-ts/` doc tree (~3840 lines) that was really a separate, earlier piece of
  work with its own review process. Content is correct and complete either way; only the commit
  history/attribution is muddled. Not unwound via history rewrite (would mean force-pushing a
  shared branch, treated as out of bounds without being asked) — local `v0.9.0` was synced to match
  `origin` and remaining orchestration-tracking edits (this file, `TODOS.md`) were committed
  separately on top. No action needed going forward; future PRs won't repeat this since `v0.9.0` is
  now fully in sync.

## Timeline

- 2026-09-03/04: Planning docs written and reviewed via `/plan-eng-review` — all findings resolved,
  10 architecture/testing/performance gaps closed, 2 delivery checkpoints added.
- 2026-09-04: Implementation loop spec finalized (worktree isolation, per-module PR granularity,
  serial-then-parallel-lanes sequencing, npm-publish confirmation gate). This tracker created.
- 2026-09-04: Phase 0 dispatched, hit and recovered from a GitHub push-access credential issue, 3
  rounds of real CI failures (missing CMake flags for OCCT/CGAL, missing cmake-js N-API package.json,
  vcpkg header-only Boost gaps, macOS Intel runner scarcity) — all diagnosed and fixed by the
  implementation agent using a self-added PR-comment diagnostic mechanism (this sandbox can't reach
  GitHub Actions' log-download host directly). CI went fully green across all 6 OS×arch combos.
  PR #1 reviewed against design docs and squash-merged to `v0.9.0` as `8931001035`.
