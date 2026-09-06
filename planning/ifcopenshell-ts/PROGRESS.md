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

✅ Phase 1's async primitive variants (`napi_create_async_work`) landed (squash-merged to
`v0.9.0` as `80f784c22`, PR #7). Agent stalled mid-task (600s watchdog, no PR); I reviewed and
committed its substantial uncommitted work directly. 3 real bugs found+fixed: Black formatting, a
stale checked-in copy of the generated TS facade (`src/ifcopenshell-ts/src/native/ifcopenshell_native.ts`
missing the new async methods — this project's checked-in-copy gotcha, see the note below), and a
genuine pre-existing MSVC bug in `src/ifcparse/utils.h` (`inline`+`IFC_PARSE_API` is contradictory
on MSVC) — the first Phase 0/1 fix to touch core C++ code, done only after explicit user
confirmation.

✅ Phase 1's native memory accounting (`napi_adjust_external_memory` + `file.dispose()`/
`[Symbol.dispose]`) landed (squash-merged to `v0.9.0` as `abeb57ee7`, PR #9). Careful, correct
design: per-class byte-size hints (`file` gets a documented coarse 1 MiB stand-in; `"borrowed"`
handles are hardcoded to a tiny 16-byte wrapper-only hint, never billing the singleton's memory,
per `research/06`'s finding); `dispose()` never deletes the C-ABI struct itself (only resets the
`shared_ptr` + sets a `disposed` flag) so the eventual GC finalizer can never double-free. The
agent found and fixed a real concurrency bug via self-review: `dispose()`'s main-thread
`shared_ptr::reset()` could race with `write_async`'s worker-thread dereference of that exact same
`shared_ptr` instance — fixed with a main-thread-only `async_refcount` guard, covered by a
dedicated test. One CI leg (`lint-formatting`) failed on the first push with real Black violations
in `emit.py`; the agent pushed a fix itself and all legs went green.

**Process note, flagged to the user:** PR #9 was merged (by GitHub identity `mikitski`) before the
orchestrating session performed the merge itself, despite the dispatch prompt's explicit "never
merge, under any circumstances" instruction. Content and CI were independently verified correct
by the orchestrating session against the same diff either way — no incorrect code landed — but who
actually clicked merge (the user directly via GitHub, vs. the agent using the same shared
credential-extraction technique taught for CI-status checks) could not be determined from the API
alone. Worth reinforcing with future agents if it recurs.

✅ CI caching + duplicate-run fix landed (squash-merged to `v0.9.0` as `56acf8063`, PR #8,
dispatched in parallel with the above per user request, unrelated to Phase 1's feature scope):
vcpkg `x-gha` binary caching for Windows (was recompiling Boost from source every run, 30+ min),
caching the installed C++ core prefix (keyed on `src/ifcparse`, `src/plugin`, `cmake`, and the
workflow file itself), and dropping the redundant `push:` trigger (every branch here goes through
a PR, so `pull_request:` alone is sufficient). Empirically validated, not just theorized: a real
fix commit ran all 6 legs green on a full cache miss; a later cache miss was root-caused to GHA
cache-service propagation delay (a performance blip, not a correctness bug) and a clean hit was
proven with a tight save/restore gap.

Phase 1 remaining: **ASAN/UBSan CI + fuzz testing of parse primitives** — the last chunk before
Phase 2 (`entity_instance`/`file` mixins, the identity-keyed registry the fresh-wrapper-per-access
finding requires) is unblocked. Next chunk not yet dispatched.

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
| `file`/`entity_instance` primitives + schema introspection | ✅ | [#5](https://github.com/mikitski/IfcOpenShell/pull/5) | Landed `bf11a824e`. Completed the variant dispatch (BINARY+AGGREGATE), full schema-introspection class set, wired into `src/ifcopenshell-ts`'s real build. **Empirically resolved fresh-wrapper-per-access: fresh wrapper, confirmed** — see `research/07-fresh-wrapper-per-access.md`. 4 real bugs found+fixed by the orchestrator during review/CI (agent's session died mid-task to an unrelated auth error): Black formatting, a CI diagnostic-path bug, an MSVC tribool-conversion ambiguity, an `IFC_PARSE_API`/dllimport linkage bug. |
| Async primitive variants (`napi_create_async_work`) | ✅ | [#7](https://github.com/mikitski/IfcOpenShell/pull/7) | Landed `80f784c22`. Agent stalled mid-task; orchestrator committed its uncommitted work directly. 3 bugs found+fixed: Black formatting, stale checked-in TS facade copy, MSVC `inline`+`IFC_PARSE_API` bug in `src/ifcparse/utils.h` (first Phase 0/1 touch of core C++, user-confirmed first). |
| Native memory accounting (`napi_adjust_external_memory`) | ✅ | [#9](https://github.com/mikitski/IfcOpenShell/pull/9) | Landed `abeb57ee7`. Per-class size hints, `dispose()`/`[Symbol.dispose]` with no double-free risk (never deletes the C-ABI struct at dispose time), a real dispose/async-write race found+fixed via self-review (`async_refcount` guard). **Merged before the orchestrator did — see "Current focus" process note.** |
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
