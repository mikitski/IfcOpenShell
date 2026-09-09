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

✅ **Phase 1 is complete** (landed `9d0dda897`, `dc7c890ee`). Its last chunk — ASan/UBSan CI + a
real libFuzzer harness + event-loop-liveness testing — was the highest-yield chunk of the phase:
standing up genuinely new CI surface (no ASan/UBSan or libFuzzer job existed anywhere in this repo
before) immediately surfaced 3 real, fixed bugs in the shared C++ core (a `spf_header` memory leak;
the Rule-of-Five heap-use-after-free that fix itself exposed, closed with full deep-copy/move
semantics; a `token::to_string()`/`as_string()` stack-overflow from unbounded mutual recursion,
root-caused and closed for all 10 `token_type` values, not band-aided) and 1 much larger,
deliberately-deferred systemic finding (regular DATA-section entities never freed anywhere in
`src/ifcparse` — investigated, confirmed systemic, `detect_leaks=0` on the `fuzz` job per explicit
user direction, fully documented in `TODOS.md` for whoever picks up that ownership-model fix next).

✅ **Phase 2's first chunk — `IfcFile`/`EntityInstance` foundation — landed** (squash-merged to
`v0.9.0` as `6b9963954`). Near-verbatim port of `file_mixin`/`entity_instance_mixin`: the
identity-keyed (`file_pointer()`) `Transaction`/undo-redo registry (per
`research/07-fresh-wrapper-per-access.md`'s confirmed finding — every native accessor mints a
fresh JS wrapper, so `EntityInstance.equals()` compares via `identity()`, never `===`), the full
`.get()`/`.set()` attribute-access escape hatch implementing the real forward/inverse/category
dispatch, `getInfo()`, `guid.ts`/`settings.ts`/`template.ts`, and the `createTestFile()` bootstrap
fixture every later phase's tests build on. Two small new N-API primitives added along the way
(`file_pointer()`, `traverse()`/`traverse_breadth_first()` on `entity_instance`). One CI flake hit
and resolved: Windows x64 failed at the pre-existing "Install build dependencies" vcpkg step
(unrelated to this PR's own code); confirmed transient by re-running.

✅ **Phase 2's second chunk — `Proxy`-based dynamic attribute access + the schema-driven `.d.ts`
generator — landed** (squash-merged to `v0.9.0` as `03000ac47`), closing out `10-architecture.md`
§6's full design. Every `EntityInstance` is now `Proxy`-wrapped at construction (confirmed
`instanceof EntityInstance` still holds through the wrapper), so `wall.Name = "x"` works directly —
the trap dispatches through the prior chunk's existing `.get()`/`.set()` primitives, never
reimplementing that logic. A `Map<schemaIdentifier, Map<className, AttributeMeta[]>>` cache
(populated once per schema, never per-access) backs the trap's category/index lookups; the required
differential correctness test (`40-testing-strategy.md` §5.5) passes for every entity class across
all three schema versions and caught two real, pre-existing bugs along the way — a derived-attribute
miscount, and an inverse-attribute name collision across sibling relationship classes (fixed by
switching to the correctly-scoped `file.get_inverse(...)` primitive instead of a name-only match).
The `.d.ts` generator (a new Node-based tool, not a wrappergen/Python extension — `entity.supertype()`
carries no recoverable name via the current primitive surface, so generated interfaces are flat, not
`extends`-chained, a disclosed deviation) emits **2305 typed entity interfaces across
IFC2X3/IFC4/IFC4X3 (653/776/876), none skipped**; the exit-criterion test (`wall.Name` type-checks as
`string | null` via real `tsc --noEmit`) passes. One real bug found and fixed mid-PR: a Windows-only
`spawnSync npx ENOENT` (the classic Node-on-Windows `.cmd`-resolution gotcha) breaking the type-check
test's own subprocess invocation — fixed with `shell: true`, verified with both a positive and a
deliberately-broken negative-case check so the fix doesn't silently swallow real `tsc` failures. One
unrelated CI flake (a timing-sensitive assertion in Phase 1's pre-existing `event_loop.test.ts`,
untouched by this PR) hit once on Windows x64 and cleared on retrigger — confirmed not a regression
since Windows arm64 passed the same test on the same commit. **Phase 2 remaining**: the differential
cache-correctness test row and this chunk's own row in the table below are now both satisfied by this
same landing.

Also resolved this window: the CI-caching PR's (`#8`, `56acf8063`) merge initially looked
untraceable to any action by the orchestrating session and was raised as an open trust/process
concern in an earlier revision of this note. The user investigated independently and confirmed it
was neither a rogue self-merge by the dispatched agent nor a human merging by hand — some other
legitimate mechanism outside this session's visibility. **Resolved, not an ongoing issue** (noted
in the orchestrating session's own memory for future reference, in case a similar situation
recurs).

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
| "Fresh wrapper per access" identity spike (blocks rest of phase) | ✅ | [#5](https://github.com/mikitski/IfcOpenShell/pull/5) | Resolved empirically during Phase 1's primitive-binding chunk — **fresh wrapper, confirmed**. See `research/07-fresh-wrapper-per-access.md`. |
| `IfcFile` (`file_mixin` port, incl. `dispose()`) | ✅ | [#15](https://github.com/mikitski/IfcOpenShell/pull/15) | Landed `6b9963954`. Identity-keyed `Transaction`/undo-redo registry, full `Transaction` port, `createEntity`/`add`/`byType`/`traverse`/`getInverse`/`remove`/`batch`/`write`/`[Symbol.iterator]`/`dispose()` (delegates to Phase 1's native `dispose()`). New `file_pointer()` primitive added for the registry key. |
| `EntityInstance` (Proxy + attribute-metadata cache) | ✅ | [#15](https://github.com/mikitski/IfcOpenShell/pull/15), [#17](https://github.com/mikitski/IfcOpenShell/pull/17) | Foundation (`identity()`/`isA()`/`equals()`, `.get()`/`.set()`, `getInfo()`, `walk()`) landed `6b9963954`; `Proxy` wrapping + the `Map<schemaIdentifier, Map<className, AttributeMeta[]>>` cache landed `03000ac47`. Every `EntityInstance` is `Proxy`-wrapped at construction; `instanceof` confirmed to still hold. Cache differential test caught 2 real bugs (a derived-attribute miscount, an inverse-attribute name collision across sibling relationship classes). |
| `.d.ts` generator (or hand-written fallback for high-traffic classes) | ✅ | [#17](https://github.com/mikitski/IfcOpenShell/pull/17) | Landed `03000ac47`. New Node-based tool (not wrappergen/Python — no recoverable supertype name via the current primitive surface, so interfaces are flat, not `extends`-chained, a disclosed deviation). **2305 typed entity interfaces generated (653/776/876 across IFC2X3/IFC4/IFC4X3), none skipped.** `10-architecture.md` §6 exit criterion passes (`wall.Name` type-checks as `string \| null` via real `tsc --noEmit`). Found+fixed a Windows-only `spawnSync npx ENOENT` bug in the type-check test itself along the way. |
| `guid.ts`, `settings.ts`, `template.ts` | ✅ | [#15](https://github.com/mikitski/IfcOpenShell/pull/15) | Landed `6b9963954` alongside `IfcFile`/`EntityInstance`. |
| Differential cache-correctness test (all 3 schema versions) | ✅ | [#17](https://github.com/mikitski/IfcOpenShell/pull/17) | Landed `03000ac47`, alongside the Proxy/cache chunk above (same test, same PR — see that row's notes). |

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
