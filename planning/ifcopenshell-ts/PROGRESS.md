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

✅ **Phases 0–2 are complete** (landed through `03000ac47`). Native N-API primitive layer with
ASan/UBSan+fuzz CI (found+fixed 3 real C++-core bugs, deferred 1 large systemic one, see
`TODOS.md`); `IfcFile`/`EntityInstance` with the identity-keyed `Transaction` registry and the
`Proxy`-based dynamic attribute access on top of an attribute-metadata cache; a generated `.d.ts`
layer covering **2305 typed entity interfaces across IFC2X3/IFC4/IFC4X3**. `10-architecture.md`
§6's full attribute-access design is closed out end to end.

✅ **Phase 2.5's benchmark suite landed** (`ab0541483`) — 3 CI-gating benchmarks (attribute-cache
speedup, bulk `getInfo`, file open/parse) plus a non-gating Python-baseline comparison script. Per
the user's explicit direction: benchmarks only, **the actual `npm publish ifcopenshell@alpha` step
and README usage example remain deliberately deferred, not started, pending a separate go-ahead.**

✅ **Phase 3 has started.** `util/element.py` (2009 lines, ~67 functions) is the highest-leverage
module in `util`/`api` — nearly everything else depends on it — but too large for one PR, so it's
split into 3 sequential chunks (all against the same `src/util/element.ts`/`test/util/element.test.ts`
files — see the Phase 3 table below for the full per-chunk function lists).

**Chunk 1/3 landed** (`bba589be7`): psets/qtos + type/material/style queries. Two real, disclosed
findings: `getStyles` transitively needed a fixed-argument slice of not-yet-ported
`util.representation` — a narrow local helper, not scope creep; the N-API attribute-value shim
auto-unwraps `IfcValue` types to raw JS primitives, losing the EXPRESS type name (`value_type` is
always `null`, disclosed not silently wrong). **A real CI bug found+fixed**: CI's core build is
`SCHEMA_VERSIONS=4` (IFC4-only) since Phase 0; `bootstrap.ts` already has an `AVAILABLE_SCHEMAS`
skip-guard for exactly this, but this chunk's test file bypassed it in two spots, hard-coding
IFC2X3 directly — 4 of 6 build-and-test legs failed identically, not a flake. The agent's fix was
the guard, not (per an earlier, incorrect instruction from the orchestrating session) widening
`SCHEMA_VERSIONS` — it correctly pushed back on bundling an out-of-scope, project-wide CI change
into a narrow chunk, and correctly treated a relayed "user approved this" claim as unverified until
it could reason about the fix independently. **Consequence, tracked in `TODOS.md`**: IFC2X3/IFC4X3
tests are currently silently skipped in CI, a real coverage gap; widening `SCHEMA_VERSIONS` is
user-approved, deliberately-deferred work — reuse the `AVAILABLE_SCHEMAS` guard pattern, don't
hard-code a schema string, until that widening actually happens.

**Chunk 2/3 landed** (`955fdd594`): spatial/structural-graph queries (`getContainer`,
`getDecomposition`, `getParent`, `getAggregate`, `getNest`, `getGroups`, `getOpenings`, etc., plus
`get_controls` — confirmed same shape as `get_groups`, included; `get_referenced_elements`
excluded — classification/document territory, a separate future chunk). Correctly applied chunk
1's `AVAILABLE_SCHEMAS` fix pattern throughout (no repeat of that bug) and reused chunk 1's
internal helpers rather than reimplementing them. Found+fixed a real null-safety bug in the shared
`EntityInstanceSet` helper (crashed on a `null` set member, which Python's own `set()` tolerates —
reachable via chunk 1's own `getElementsByPset` against an unset mandatory attribute), with a
verified before/after regression test. Correctly declined to fix 3 other review findings that were
chunk 1's pre-existing code, out of this chunk's scope. **Chunk 3/3 (structural-editing helpers:
`copy`/`copyDeep`/`removeDeep`/`removeDeep2`/`replaceElement`/`replaceAttribute`) is next — the
last piece of `util.element`.**

**Recurring CI flake worth tracking**: `test/native/event_loop.test.ts`'s timing-sensitive
assertion has now flaked on Windows CI three separate times across unrelated PRs, always clearing
on retrigger with no code change — a real pattern, not bad luck, but not urgent. Worth a dedicated
look (loosen the threshold, or find a less scheduler-sensitive signal) next time someone's in that
test for another reason.

**Resolved, no longer tracked**: the CI-caching PR's (`#8`) merge once looked untraceable to any
action by the orchestrating session and was raised as an open trust/process concern. The user
investigated independently and confirmed it was neither a rogue self-merge nor a human merging by
hand — some other legitimate mechanism outside this session's visibility. Noted in the
orchestrating session's own memory for future reference in case it recurs.

**Standing strategic question, not yet decided**: the user raised whether this fork's TS port
should eventually be upstreamed via PR to the canonical `IfcOpenShell/IfcOpenShell` project rather
than the fork owning a permanent parallel npm package. Orchestrator's recommendation (given, not
yet acted on): coordinate with upstream maintainers early (an issue/discussion, before a large
surprise PR) rather than after Phase 3+ is far along — user said to hold off on drafting that for
now and keep porting.

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
| Benchmark suite + one-time Python-baseline comparison | ✅ | [#19](https://github.com/mikitski/IfcOpenShell/pull/19) | Landed `ab0541483`. 3 CI-gating benchmarks, dedicated Linux-x64 `benchmark` job. Python-baseline script included but not run (no Python/SWIG build in this project's CI); `tools/BASELINE_RATIOS.json` is an unpopulated placeholder pending a maintainer running it locally. |
| `npm publish ifcopenshell@alpha` | 🔲 | — | ⏸️ Explicit user go-ahead requested (per "do benchmarks first" direction) — **not yet given**. README usage example also still needed for this exit criterion. |

## Phase 3 — `util` Tier A [Lane A]

| Chunk | Status | PR | Notes |
|---|---|---|---|
| `util.element` — chunk 1/3 (psets/qtos + type/material/style) | ✅ | [#21](https://github.com/mikitski/IfcOpenShell/pull/21) | Landed `bba589be7`. `getPset`/`getPsets`/`getQuantity`/`getQuantities`/`getProperty`/`getProperties`/`getElementsByPset`/`hasProperty`/`getPropertyDefinition`, `getType`/`getTypes`/`getMaterial(s)`/`getMaterialLayers`/`getMaterialProfiles`/`getStyles`/`getPredefinedType`/`isUserdefinedType`/`getElementsByMaterial`/`getElementsByStyle`/`getElementsByRepresentation`. Found+fixed a real CI gap (see "Current focus" above): `SCHEMA_VERSIONS=4`-only means IFC2X3/IFC4X3 tests need `bootstrap.ts`'s `AVAILABLE_SCHEMAS` skip-guard, not a hard-coded schema string — use this same guard in chunks 2/3. |
| `util.element` — chunk 2/3 (spatial/structural-graph queries) | ✅ | [#23](https://github.com/mikitski/IfcOpenShell/pull/23) | Landed `955fdd594`. `getContainer`/`getReferencedStructures`/`getStructureReferencedElements`/`getDecomposition`/`getGroupedBy`/`getGroups`/`getControls`/`getParent`/`getFilledVoid`/`getVoidedElement`/`getAdheredElement`/`getAggregate`/`getNest`/`getParts`/`getContained`/`getComponents`/`getOpenings`/`hasOpenings`. Found+fixed a real null-safety bug in the shared `EntityInstanceSet` helper (see "Current focus" above). |
| `util.element` — chunk 3/3 (structural-editing helpers) | 🔲 | — | `copy`/`copyDeep`/`removeDeep`/`removeDeep2`/`batchRemoveDeep2`/`replaceElement`/`replaceAttribute` — last piece of `util.element`, do next |
| `util.schema` | 🔲 | — | |
| `util.unit` | 🔲 | — | |
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
