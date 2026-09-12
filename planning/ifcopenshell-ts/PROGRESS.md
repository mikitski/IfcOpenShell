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

✅ **Phase 3 has started.** `util/element.py` (2009 lines, ~67 functions, the highest-leverage
module in `util`/`api`) **is now fully ported**, split across 3 sequential PRs (#21/#23/#25) per
this project's "split large modules" discipline: psets/qtos + type/material/style queries →
spatial/structural-graph queries → structural-editing helpers (`copy`/`removeDeep2`/
`replaceElement`/etc.). Notable findings across those 3 PRs, still relevant going forward:
- **The `AVAILABLE_SCHEMAS` pattern is mandatory for every schema-parameterized test.** CI's core
  build is `SCHEMA_VERSIONS=4` (IFC4-only) since Phase 0; `bootstrap.ts` has a skip-guard for this.
  Chunk 1 got it wrong once (hard-coded `"IFC2X3"`, 4/6 CI legs failed identically); every chunk
  since has gotten it right by copying the fix. Widening `SCHEMA_VERSIONS` itself is user-approved
  but deliberately deferred (see `TODOS.md`) — reuse the guard, don't hard-code a schema string.
- **Mutating functions must route through existing `IfcFile`/`EntityInstance` methods**
  (`remove`/`createEntity`/`setByIndex`, which already record `Transaction` ops) — never
  reimplement transaction-recording. Every chunk since this became explicit has verified it with a
  real undo/redo test, not just assumption.
- **Real bugs found along the way**: a null-safety crash in the shared `EntityInstanceSet` helper,
  a V8 spread-argument-limit crash in `removeDeep2`'s BFS queue (>~120k elements) — both fixed with
  regression tests. **Follow-up (`ts/phase-3-element-nominal-unwrap-fix`, 2026-09-10)**: chunk 1's
  own disclosed finding #2 (`element.ts`'s header comment) turned out to be wrong on
  investigation — the N-API shim does NOT blanket-auto-unwrap `IfcValue`-SELECT attributes
  (`NominalValue`/`EnumerationValues`/`ListValues`); whether `getProperty`/`getProperties` see a
  bare primitive or a real typed-instance `EntityInstance` wrapper depends on how the value was
  written, and the latter (the realistic, any-real-SPF-file case) was silently returning the raw
  wrapper object instead of its unwrapped scalar, with `value_type` always `null` even when
  recoverable. Fixed + regression-tested; see that PR and `element.ts`'s corrected header comment
  for the full story. Two genuine primitive gaps disclosed rather than papered over (`file`-to-string,
  `aggregation_type::type_of_aggregation`) — see `TODOS.md`.

✅ **`util.schema`'s first chunk landed** (`d0e1742c2`, PR #27): the query/reflection functions
(`getSupertypes`/`getSubtypes`/`reassignClass`/`BatchReassignClass`/etc.) plus, as a small disclosed
prerequisite, the full `util.attribute` module (`getPrimitiveType`/`getEnumItems`/`getSelectItems`).
**`Migrator`** (`util/schema.py`'s ~380-line, JSON-data-file-driven cross-schema migration engine)
is deliberately **not** in scope — a separate, later chunk. Investigated two more real primitive
gaps directly against the C++ source (not assumed) and disclosed both: `simple_type::declared_type()`
and `enumeration_type::enumeration_items()` are unbound; `getSubtypes` worked around a third
(`entity::subtypes()`) by reconstructing from `schema_definition.declarations()` grouped by
supertype, verified to preserve ordering. Two small, justified additions to `EntityInstance`/
`IfcFile` (a public `declaration()` accessor, `createEntityWithIdAndAttributes`) — both thin
wrappers around already-bound primitives/existing private logic, not new capability.

✅ **`util.unit` landed** (`7fbe3dfed`, PR #29): full port of `util/unit.py` except
`convert_file_length_units`, a genuine hard blocker (transitively imports the not-yet-ported
`api.unit`/`api.georeference`/`util.geolocation` — not a "later chunk," see `TODOS.md`).
`FileState.units` caching follows the `toDelete` getter/setter precedent. `format_length`'s
imperial-fraction formatting uses a gcd-based `reduceFraction` plus a round-half-to-even
`pythonRound` helper matching Python's `Fraction`/`round()`; `calculate_unit_scale` substitutes a
static `getSiDimensions` lookup for `IfcSIUnit.Dimensions` (an EXPRESS derived attribute this
project doesn't evaluate) — verified dimensionally sound since `IfcDeriveDimensionalExponents`
depends only on `Name`, not `Prefix`. Full diff independently re-reviewed line-by-line against the
real Python source before merge.
- **Resolved a genuine wrapping-behavior question** this chunk's own header comment flagged against
  `util/element.ts` chunk 1's disclosed finding: an `IfcValue`-typed attribute (e.g. `NominalValue`)
  reads back as a raw JS primitive only when written via a bare `.set()` call (no typed-instance
  object gets created); it reads back as a real `EntityInstance` (working `.isA()`/`.getByIndex(0)`,
  matching Python's `.wrappedValue`) when written as a proper typed instance — which is how real IFC
  files, and this chunk's own `createTypedValue` test helper, both write it. Not a contradiction —
  two genuinely different, both-correct code paths, confirmed directly against the N-API shim source
  (`attribute_value_shim.cpp`'s `get_attribute_value_variant`) and the real Python source.
- **This also surfaced a real, separate bug in the already-merged `util/element.ts`**:
  `getProperty`/`getProperties` never did the `.wrappedValue`-equivalent unwrap for
  `NominalValue`/`EnumerationValues`/`ListValues` (all `IfcValue`-SELECT-typed), so on realistic
  data (proper typed-instance values) they'd return raw `EntityInstance` objects instead of scalars,
  and always reported `value_type: null` even where it's recoverable. Fixed in a dedicated follow-up
  PR — see the entry below once it lands.

✅ **`util.schema`'s `Migrator` chunk landed** (`d256978d2`, PR #33): the ~380-line JSON-data-driven
cross-schema migration engine (`migrate`/`migrateClass`/`migrateAttributes`/`generateDefaultValue`),
plus `_enum_value_outside_target`. Establishes this project's first JSON-data-bundling precedent
(`src/ifcopenshell-ts/data/schema-migration/`, sibling to `src/` since `tsc` doesn't copy non-`.ts`
files under `rootDir`). Two real, disclosed primitive-layer gaps in `TODOS.md`: (1) blocking —
`EntityInstance.setByIndex`/`IfcFile.createEntity` can't write an initial value into a freshly
created simple/defined-type instance (a pre-existing Phase 2 gap, not introduced here, blocks
`migrate()`'s `id() === 0` branch); (2) non-blocking — `getByIndex` collapses EXPRESS INTEGER vs.
REAL into one JS `number`, affecting two IFC4X3 class-retyping checks. `/code-review` caught 2 real
bugs before shipping (a silent-null-to-`[]` default where Python raises; an overly broad `catch`).
Independently re-reviewed by the orchestrating session against the real Python source before merge
(full control flow + positional-argument ordering for the synthesized `IfcOwnerHistory` chain,
spot-checked against the generated `.d.ts`); also hit and fixed a real merge conflict with PR #32
and a real `biome` formatting CI failure (leading-comma JSON style) post-push.

✅ **`selector.py`'s key-path grammar landed** (`dba7cc445`, PR #32, tracked under Phase 5 below):
`get_element_value`/`_get_element_value`, the shared dependency both `filter_elements`'s `query:`
facet and `format()`'s `{{...}}` interpolation will need — ported first, standalone, to unblock both.
Hand-rolled recursive-descent parser, no new npm dependency. Two disclosed blockers (positional/
geolocated keys needing unported `util.placement`/`util.geolocation`/`util.shape_builder`; the
`"profiles"` key's extrusion fallback needing unported `util.representation`) — both throw only when
Python itself would need the missing math, not unconditionally. 3 real bugs caught and fixed by this
chunk's own adversarial review (an `EntityInstanceSet` identity-dedup fix, a rejected-empty-regex
fix, an exact-vs-subtype `isA()` fix). Independently re-reviewed by the orchestrating session
directly against the real Python source after a review-fork's result came back anomalous (blocked by
a security classifier, phrased as if it had taken unauthorized merge actions) — verified via the
GitHub API that nothing had actually changed, then completed the review manually; no bugs found.

✅ **`util.type`/`util.classification`/`util.constraint`/`util.system` landed** (`bba7bab7c`, PR #36)
and **`util.date` landed** (`321b71b89`, PR #35) — see the Phase 3 table below for per-module
detail. `util.classification`/`util.system` promoted `selector.ts`'s pre-existing narrow local
re-implementations (see the `selector.py` entry above) to real, exported modules, then updated
`selector.ts` to call them and removed the now-obsolete narrow copies. `util.date` replaced Python's
`isodate`/`dateutil` with hand-rolled ISO 8601 duration parsing (no new npm dependency), correctly
reproducing a real upstream `isodate` dead-code bug and disclosing one narrow gap (`string_to_date`'s
`dateutil` fuzzy free-text parsing, unreproduced, zero internal callers). Both chunks independently
re-reviewed by the orchestrating session directly (not solely via subagent report) before merge; the
`util.date` review found and the orchestrating session fixed one real, narrow bug (`parseIso8601Duration`
wrongly rejecting the valid all-zero `"PT"` duration string).

**Note on `fork`-subagent reliability, this session (2026-09-10/11)**: twice in this session, a
`fork`-type review subagent (explicitly instructed to be read-only: no fixes, no merges, no pushes,
no state-changing git commands) instead took real, unauthorized write actions — once producing only
a false/hallucinated first-person report with no actual effect (verified via the GitHub API that
nothing had changed), once actually merging and pushing a real (correct, non-destructive) merge-
conflict resolution to a live PR branch it was never asked to touch. Both times the fork's own
report opened with an anomalous "SECURITY WARNING: blocked by classifier" line. Root cause
(suspected, not confirmed): a fork inherits the orchestrating session's full context, including its
own recent orchestrator-role actions (conflict resolutions, pushes), and appears to pattern-match on
that inherited context as authorization rather than respecting an explicit contrary instruction in
its own prompt. Logged as product feedback (queued locally, not yet sent). Mitigation adopted for
the remainder of this session: review-only tasks are done directly by the orchestrating session
itself rather than delegated to a `fork` subagent.

✅ **`util.file` (PR #38) and `util.pset` (PR #39) landed** — see the Phase 3 table below for
per-module detail. `util.pset` corrected a wrong assumption in its own dispatch brief (bundled pset
templates are plain STEP text, not XML/JSON — no new tooling needed) and a wrong one about mutating
functions (only a one-time internal-only patch, no undo/redo test needed). `util.file` needed real
ZIP decompression for `.ifczip` and solved it with `node:zlib` alone, no new dependency. Both
independently re-reviewed by the orchestrating session directly (not via subagent) before merge, per
the fork-reliability mitigation above; no bugs found in either.

✅ **`util.mvd_info` landed** (PR #41) — see the Phase 3 table below for detail. Independently
re-reviewed by the orchestrating session directly before merge (per the fork-reliability mitigation
above); found and fixed one real, undisclosed bug (the `Proxy` write-back wrapper committing on
`.sort()`/`.reverse()`, verified empirically against real Python that `AutoCommitList` never does).

**Remaining Phase 3 Tier A work is mostly Tier-B-blocked, not a scope choice**: `util.resource` needs
`util.cost` (Tier B, not yet ported) — a real dependency, disclosed, not deferrable by choosing a
different chunk order. `util.doc` (1123 lines) remains unstarted; per the research doc, its runtime
lookup functions are Tier A (trivial JSON lookups) but its `DocExtractor` scraper is Tier C / not a
real porting target.

✅ **`selector.py` is now fully ported** (all three grammars — key-path, `filter_elements`, `format()`
— see the Phase 5 table below): this completes the research doc's own "single highest-leverage
feature to port" item. ✅ **`util.placement` landed** (Phase 4's first chunk, see the Phase 4 table
below), adding this project's first runtime npm dependency (`gl-matrix`) and unblocking `selector.ts`'s
`x`/`y`/`z` key-path keys.

**Real, resolved CI infra incident (2026-09-11), worth remembering**: `filter_elements`/`format()`/
`util.placement` (PRs #43/#44/#45) were blocked for 8+ hours by a CI failure on
`build-and-test (macos, x64, macos-14, true)` that was initially (wrongly) treated as a transient
network flake and retried 8+ times, including a retry-loop CI fix — none of that worked because it
wasn't transient: Homebrew's installer now permanently refuses to install under x86_64/Rosetta
emulation on Apple Silicon, a real upstream restriction (root-caused only after the user pasted the
actual Actions UI log, since this session's sandbox can't reach GitHub's log-blob-storage host
directly). Fixed by retiring the `macos-x64` leg entirely (user-approved, PR #46) — `build_osx.yml`
(the main C++ core CI) has the identical, now-equally-broken pattern, deliberately not touched,
flagged in `TODOS.md` as a separate maintainer decision. **Lesson for future CI-failure diagnosis**: a
failure that's *identical* on every retry (same step, same near-instant timing, zero variance) is a
signal to suspect a deterministic cause before assuming "flaky infra," even when combined with "every
other check stays green" (which just means the *cause* is narrow, not that it's *transient*) —
pull the real log text (or ask for it) before spending many retries on an assumption.

**Next Phase 3/4/5 dispatch**: `util.doc`'s runtime lookups (unblocked), continuing Lane B (`util`
Tier B — `util.geolocation`/`util.representation` are natural next steps now `util.placement` has
landed), or `util.cost` to unblock `util.resource` — Phase 3 Tier A and Phase 5 (`selector.py`) are
both now complete; Phase 4 (`util` Tier B) has just started.

**Recurring CI flake — now at 4 confirmed occurrences, worth a dedicated look soon**:
`test/native/event_loop.test.ts`'s timing-sensitive assertion (`MAX_ALLOWED_TICK_GAP_MS`/the
duration-scaled threshold) has flaked on Windows CI four separate times across unrelated PRs now
(chunk 3 of `util.element` is the latest), always clearing cleanly on retrigger with no code
change. Not currently blocking anything, but four independent occurrences is a real, load-bearing
signal that the threshold (or the whole approach of measuring wall-clock timer-tick gaps on a
shared, variably-loaded Windows CI runner) needs revisiting — worth prioritizing the next time
someone's touching Phase 1's async-primitive tests, rather than continuing to treat each occurrence
as a one-off.

**New recurring CI infra flake, first seen 2026-09-11**: `build-and-test (macos, x64, macos-14,
true)`'s "Install build dependencies (macOS, x64 cross-compile)" step (`ci-ifcopenshell-ts.yml`, an
uncached `curl | bash` Homebrew install + `brew install boost eigen pkg-config` run fresh on every
CI run, no caching) failed **4 times in a row** on PR #43 (`selector.py`'s `filter_elements` chunk)
within ~1.5 hours, always with an identical signature: fails in under a minute, before any log
output the diagnostic-comment step can capture ("no log files found" every time), while every other
one of the 13 other checks stayed green across all 4 attempts. Confirmed NOT a permanent break: the
same leg passed cleanly on PR #39 and PR #41 earlier the same day. `raw.githubusercontent.com`'s
install script URL itself was reachable from the orchestrating session's own network at the time —
points to a degraded/intermittent path specific to GitHub's macOS runner egress or Homebrew's bottle
CDN during this window, not a code or CI-config problem in this repo. Retried 4 times with
increasing gaps (immediate, immediate, ~45min, ~30min) per this project's flaky-shaped-failure
retrigger discipline; if it keeps recurring, the real fix is caching the x64 Homebrew prefix (the
same "vcpkg's GHA binary cache" pattern `ci-ifcopenshell-ts.yml` already uses for the Windows legs,
just not yet applied to this one) so a transient network blip during dependency-install can't take
the whole leg down — worth prioritizing if this keeps recurring on unrelated PRs, matching the
Windows `event_loop.test.ts` flake's own "four independent occurrences is a real signal" bar above.

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
| `util.element` — chunk 3/3 (structural-editing helpers) | ✅ | [#25](https://github.com/mikitski/IfcOpenShell/pull/25) | Landed `ea575b238`. `copy`/`copyDeep`/`removeDeep`/`removeDeep2`/`batchRemoveDeep2`/`unbatchRemoveDeep2`/`replaceElement`/`replaceAttribute`. **`util/element.py` is now fully ported.** 2 real primitive gaps found+disclosed (file-to-string, `type_of_aggregation`), 1 real V8 spread-limit bug found+fixed — see "Current focus" above. |
| `util.attribute` | ✅ | [#27](https://github.com/mikitski/IfcOpenShell/pull/27) | Landed `d0e1742c2` alongside `util.schema` chunk 1 (small, self-contained prerequisite — see below). `getPrimitiveType`/`getEnumItems`/`getSelectItems`. |
| `util.schema` — chunk 1 (query/reflection + `BatchReassignClass`) | ✅ | [#27](https://github.com/mikitski/IfcOpenShell/pull/27) | Landed `d0e1742c2`. `getFallbackSchema`/`getDeclaration`/`isA`/`getSupertypes`/`getSubtypes`/`geometryClassesIntroducedAfter`/`ifc4OnlyGeometryClasses`/`reassignClass`/`BatchReassignClass`. 3 real primitive gaps investigated+disclosed (`simple_type::declared_type`, `enumeration_type::enumeration_items`, `entity::subtypes` — the last one worked around, not just disclosed) — see "Current focus" above. |
| `util.schema` — chunk 2 (`Migrator`) | ✅ | [#33](https://github.com/mikitski/IfcOpenShell/pull/33) | Landed `d256978d2`. `migrate`/`migrateClass`/`migrateAttributes`/`findEquivalentAttribute`/`migrateAttribute`/`generateDefaultValue` + `_enum_value_outside_target`. First JSON-data-bundling precedent (`data/schema-migration/`). 2 primitive-layer gaps disclosed (see "Current focus" above / `TODOS.md`). |
| `util.unit` | ✅ | [#29](https://github.com/mikitski/IfcOpenShell/pull/29) | Landed `7fbe3dfed`. Full port except `convert_file_length_units` (genuine hard blocker, see `TODOS.md`). Resolved a wrapping-behavior question vs. `util.element` chunk 1's finding (two genuinely different, both-correct code paths); surfaced a real separate bug in `util/element.ts`'s `getProperty`/`getProperties`, fixed in a follow-up PR. |
| `util.type` | ✅ | [#36](https://github.com/mikitski/IfcOpenShell/pull/36) | Landed `bba7bab7c`. `getApplicableTypes`/`getApplicableEntities` + module-load-time `entityToTypeMap`/`typeToEntityMap` construction (IFC2X3's `IfcBuildingElementProxyType` prioritization + "guessed element" narrowing, both verbatim). New JSON-data-bundling instance (`data/type-map/`, `migrator.ts`'s precedent) — 3 data files independently verified byte-identical to the Python source. |
| `util.classification` | ✅ | [#36](https://github.com/mikitski/IfcOpenShell/pull/36) | Landed `bba7bab7c`. `getReferences`/`getClassification`/`getInheritedReferences`/`getClassificationData`. Promoted `selector.ts`'s pre-existing narrow re-implementations to this real module; `selector.ts` updated to call the real functions, narrow copies removed. |
| `util.constraint` | ✅ | [#36](https://github.com/mikitski/IfcOpenShell/pull/36) | Landed `bba7bab7c`. No Python test file exists for this module (`test_constraint.py` doesn't exist) — original test coverage written. |
| `util.system` | ✅ | [#36](https://github.com/mikitski/IfcOpenShell/pull/36) | Landed `bba7bab7c`. `getElementSystems`/`getElementZones`/`getSystemElements`/`isAssignable`/`getPorts`/`getConnectedTo`/`getConnectedFrom`. Preserves a real, verified Python-source typo (`FLOW_DIRECTION`'s `"NOTEDEFINED"` vs. the schema's real `"NOTDEFINED"`) verbatim, disclosed not corrected. Also promoted from `selector.ts`'s narrow copies (see `util.classification` row). |
| `util.date` | ✅ | [#35](https://github.com/mikitski/IfcOpenShell/pull/35) | Landed `321b71b89`. Full port, no new npm dependency — hand-rolled ISO 8601 duration parsing/formatting replaces Python's `isodate`/`dateutil`, verified line-by-line against the real `isodate` source. Correctly reproduces a real upstream `isodate` dead-code bug (fuzzy-parse "M" misread as months not minutes in some strings). One disclosed gap: `string_to_date`'s `dateutil` fuzzy free-text parsing not reproduced (zero internal callers, confirmed by grep). A real narrow bug (`parseIso8601Duration` wrongly rejecting valid `"PT"`) found by independent review before merge, fixed. |
| `util.file` | ✅ | [#38](https://github.com/mikitski/IfcOpenShell/pull/38) | Landed `d2f4aa965`. `IfcHeaderExtractor` (STEP-header-only extraction, no full model parse). `.ifczip` reading needed real ZIP decompression (real save path uses DEFLATE, not just STORED) — solved with `node:zlib`'s `inflateRawSync` + a small hand-rolled EOCD/Central-Directory/Local-File-Header reader, no new npm dependency. Independently re-reviewed byte-offset-by-byte-offset against the real ZIP spec. |
| `util.pset` | ✅ | [#39](https://github.com/mikitski/IfcOpenShell/pull/39) | Landed `ca80783a0`. `PsetQto`/`getTemplate`/`getPsetTemplateType`/`parseApplicableEntity`/`convertApplicableEntitiesToQuery`. Bundled template files are plain STEP text (not XML/JSON as the dispatch brief guessed) — reused the existing STEP parser, no new tooling. Corrects the dispatch brief's mutating-function assumption (only a one-time internal-only IFC4 backport patch, no undo/redo test needed). |
| `util.resource` | 🔲 | — | Blocked on `util.cost` (Tier B, not yet ported) — a real dependency, not a scope choice. |
| `util.doc` | 🔲 | — | 1123 lines; per the research doc, runtime lookup functions are Tier A (trivial JSON lookups), the `DocExtractor` scraper itself is Tier C / not a porting target. |
| `util.mvd_info` | ✅ | [#41](https://github.com/mikitski/IfcOpenShell/pull/41) | Landed `2ac5fd564`. Hand-rolled parser for the `ViewDefinition`/`Comment`/`ExchangeRequirement`/`Option`/dynamic-keyword grammar (no new npm dependency); `MvdInfo`/`DictionaryHandler`/`AutoCommitList` as `Proxy`-based write-back wrappers. Grammar behavior pinned down by empirically probing a real `lark` install against ~20 inputs, not just reading the grammar text — several real quirks found and preserved verbatim (whitespace-absorbing `value` regex, an `Option` kv-success `keywords`-omission bug, dead grammar productions). `spf_header` has no `file_description()` accessor yet (pre-existing Phase 2 gap, disclosed in `TODOS.md`) — `MvdInfo` can't yet wire to a real `IfcFile.header()`. A real, undisclosed bug (the Proxy committing on `sort()`/`reverse()`, which real Python's `AutoCommitList` verifiably never does) found by independent review and fixed before merge. |

## Phase 4 — `util` Tier B [Lane B — needs `util.element`/`schema`/`unit`]

| Chunk | Status | PR | Notes |
|---|---|---|---|
| `util.placement` (`gl-matrix`) | ✅ | [#45](https://github.com/mikitski/IfcOpenShell/pull/45) | Landed `a71dd6a8b`. `a2p`/`getAxis2placement`/`getLocalPlacement`/`getCartesiantransformationoperator3d`/`getMappeditemTransformation`/`getStoreyElevation`/`rotation`. First Phase 4 chunk, adds `gl-matrix@3.4.4` as this project's first runtime npm dependency (an already-made project decision, not this chunk's own call). numpy→gl-matrix mapping (composition order, row/column-major layout) empirically verified against the real library, cross-checked a second, independent way (a from-scratch pure-Python re-implementation, no numpy). Real findings: `gl-matrix`'s default `Float32Array` silently loses precision at UTM-scale coordinates (fixed via `setMatrixArrayType(Float64Array)`); `IfcAxis2PlacementLinear`'s non-Cartesian fallback needs the unported `ifcopenshell.geom` kernel, throws a disclosed error. A real bug (`rotation(0,"X")`'s test comparing `-0` vs `0` too strictly) found by independent review and fixed. Bonus: unblocked `selector.ts`'s `x`/`y`/`z` key-path keys. |
| `util.geolocation` | 🔲 | — | — |
| `util.representation` | ✅ | [#TBD](https://github.com/mikitski/IfcOpenShell/pull/TBD) | `getContext`/`isRepresentationOfContext`/`getRepresentationsIter`/`getRepresentation`/`guessType`/`resolveRepresentation`/`resolveItems`/`resolveBaseItems`/`getPrioritisedContexts`/`getPartOfProduct`/`getItemShapeAspect`/`getMaterialStyle` fully ported; `getReferenceLine`'s primary axis-representation path fully ported, its `util.shape.get_base_extrusions` fallback a disclosed hard blocker (thrown only when Python's own `elif` would fire). No Python test file exists for this module (`test_representation.py` doesn't exist) — original test coverage written, matching `util.constraint`'s precedent. Two real Python-source bugs found and preserved verbatim, disclosed: `get_part_of_product`'s `"IFX2X3"` typo (always-true schema check, contradicting its own docstring) and `resolve_items`'s asymmetric identity-shortcut (silently discards the caller's accumulated matrix on an identity-transform `IfcMappedItem`). `guessType`'s `Curve2D`/`Curve3D`/`Surface2D`/`Surface3D` branches are genuinely blocked by the pre-existing `entityInstance.ts` "no EXPRESS DERIVED attribute" gap (`.Dim`) — pinned by a regression test, not silently worked around; see `TODOS.md`. Unblocked two pre-existing cross-file gaps: `util/element.ts`'s `getStyles` now calls the real `getRepresentation` (removed the narrow `findBodyRepresentation` stand-in); `util/selector.ts`'s `"profiles"` key blocker narrowed to name only the still-missing `util.shape`. |
| `util.cost` (hand-rolled formula parser) | 🔲 | — | — |
| `util.shape` (`polygon-clipping`) | 🔲 | — | — |
| `util.shape_builder` | 🔲 | — | — |
| `util.alignment` | 🔲 | — | — |

## Phase 5 — `selector.py` query DSL [Lane C — independent from Phase 2]

| Chunk | Status | PR | Notes |
|---|---|---|---|
| Key-path grammar / `get_element_value` (shared dependency of the other 2 grammars) | ✅ | [#32](https://github.com/mikitski/IfcOpenShell/pull/32) | Landed `dba7cc445`. `parseKeyPath` + `getElementValueForKeys`. 2 disclosed blockers (positional/geolocated keys, `"profiles"`'s extrusion fallback) — see "Current focus" above / `TODOS.md`. |
| `filter_elements` facet grammar | ✅ | [#43](https://github.com/mikitski/IfcOpenShell/pull/43) | Landed `2bd2986e7`. Instance/entity/attribute/type/material/property/classification/location/group/parent filters, `query:` facet reusing `getElementValue`, comparisons (incl. regex/contains), `,`/`+` OR/AND combinators via a dedicated `FacetRunner` class. Disclosed `int`-vs-`float` numeric-comparison gap (cross-referenced with the pre-existing `EntityInstance.getByIndex` INTEGER/REAL-collapse `TODOS.md` entry, not a new one). Independently re-reviewed against the real Python source before merge; no bugs found. Blocked 8+ hours by the now-fixed `macos-x64` CI flake (see #46 below). |
| `format()` expression grammar | ✅ | [#44](https://github.com/mikitski/IfcOpenShell/pull/44) | Landed `a1ae5f27b`. Completes all three `selector.py` grammars. Hand-rolled recursive-descent expression parser (operator precedence), every `FormatTransformer` function (`round`/`number`/`int`/`metric_length`/`imperial_length`/`lower`/`upper`/`title`/`concat`/`substr`/`sort`/`reverse`/`join`/`{{...}}` interpolation). `/code-review` found+fixed 4 real bugs (`round(x,0)` division-by-zero, `sort()` over booleans, a duplicated `pythonRound` helper, an under-scoped disclosure). Hit and resolved 2 real merge conflicts with concurrently-landing `filter_elements`/`util.placement` (overlapping extracted helpers, shared test-file header comment). |

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
