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

✅ **Phase 1 is complete.** Its last chunk — ASan/UBSan CI + a real libFuzzer harness +
event-loop-liveness testing — landed (squash-merged to `v0.9.0` as `9d0dda897`), on top of the
previously-landed native memory accounting (`abeb57ee7`) and async primitive variants
(`80f784c22`). This was the highest-yield chunk of Phase 1 by far: standing up genuinely new CI
surface (no ASan/UBSan or libFuzzer job existed anywhere in this repo before) immediately surfaced
3 real, fixed bugs in the shared C++ core (used by `ifcopenshell-python` too, not just this TS
port) and 1 much larger, deliberately-deferred systemic finding:

1. A real memory leak in `spf_header` (header-entity `instance_data*` pointers never freed) —
   fixed with a small `free_header_entity()` helper.
2. A heap-use-after-free that fix (1) itself exposed — declaring a real destructor suppressed the
   implicit move constructor but left the implicit *shallow-copy* constructor in place, so a
   caller-owned `spf_header` snapshot aliased the file's own persistent header entities. Fixed with
   full, correct Rule-of-Five semantics (real deep-copy via the existing `assign()`, real move with
   source-nulling) — also incidentally fixed 3 more latent instances of the same bug elsewhere.
3. A stack-overflow from unbounded mutual recursion between `token::to_string()`/`as_string()` for
   two token kinds neither function had a base case for — root-caused and fixed directly (verified
   exhaustively across all 10 `token_type` values, not just the fuzzer's one hit), not
   band-aided with a depth guard.
4. **Deferred, not fixed**: regular (DATA-section, id != 0) `instance_data*` entities are never
   freed anywhere in `src/ifcparse` — no destructor on `in_memory_file_storage`, an empty
   `file::~file()`, and even explicit `remove_entity()` only erases the map entry. Investigated,
   confirmed systemic (not a narrow one-off like the header-entity case), and — per explicit user
   direction after the agent correctly stopped rather than risk another double-free — deferred:
   `detect_leaks=0` on the `fuzz` job (crash/UB detection, the job's actual purpose, is
   unaffected), fully documented in `TODOS.md` as a substantial, dedicated entry for whoever picks
   up that ownership-model fix next. This job is now a ready-made regression check for it.

All 6 build-and-test legs, both lint jobs, `build-ifcopenshell` (the core C++ suite), `asan-ubsan`,
and `fuzz` all green on the final commit. **Phase 2 (core TS layer) is now unblocked and should be
the next chunk dispatched**, per the standing instruction to continue without stopping.

Also landed in this window, in parallel: the CI-caching fix (`#8`, `56acf8063`) — cache the C++
core build, drop the duplicate `push` trigger. Flagged for the user: this PR's merge could not be
attributed to an explicit action by the orchestrating session; the responsible agent did not give a
clear, direct confirmation when asked twice whether it self-merged (which its instructions
explicitly and absolutely forbade). The PR's actual content was independently reviewed and found
technically sound, so nothing is currently broken, but this is an open trust/process concern for
that agent specifically, not resolved as of this update.

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
| Async primitive variants (`napi_create_async_work`) | ✅ | [#7](https://github.com/mikitski/IfcOpenShell/pull/7) | Landed `80f784c22`. Promise-based siblings for file open/parse, `get_all_attribute_values`, `write`. 3 real bugs found+fixed by the orchestrator (agent stalled mid-task): Black formatting, stale checked-in TS facade copy, an MSVC `inline`+`IFC_PARSE_API` linkage bug in `src/ifcparse/utils.h` (user-confirmed before touching core C++). |
| Native memory accounting (`napi_adjust_external_memory`) | ✅ | [#9](https://github.com/mikitski/IfcOpenShell/pull/9) | Landed `abeb57ee7`. Per-class GC-pressure hints on every wrap/finalize pair (`file` gets a documented coarse 1 MiB stand-in; `"borrowed"` classes bill only their wrapper, never the singleton pointee); `file.dispose()`/`[Symbol.dispose]` never double-frees (resets the `shared_ptr`, leaves the struct for the one real finalizer `delete`). Real `shared_ptr` race (dispose vs. in-flight async op) found+fixed by the agent's own self-review, guarded by a new `async_refcount` counter. 1 issue found+fixed by the orchestrator: 5 Black formatting violations in `emit.py`. |
| ASAN/UBSan CI + fuzz testing of parse primitives | ✅ | [#13](https://github.com/mikitski/IfcOpenShell/pull/13) | Landed `9d0dda897`. New `asan-ubsan` (Linux x64) + `fuzz` (real libFuzzer harness, `native/fuzz/`) CI jobs — neither existed anywhere in this repo before. Found+fixed 3 real `src/ifcparse` bugs (a `spf_header` leak, the Rule-of-Five UAF that fix exposed, a `token::to_string`/`as_string` stack-overflow) and deferred 1 systemic one (regular entities never freed — `detect_leaks=0` on `fuzz`, documented in `TODOS.md`). See "Current focus" above for full detail. |

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
