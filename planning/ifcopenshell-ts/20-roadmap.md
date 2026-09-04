# IfcOpenShell-TS — Phased Roadmap

Status: reviewed by `plan-eng-review` 2026-09-03/04. Depends on `00-overview.md` (fixed
constraints) and the `research/` reports for the tiering data cited below.

## Reading this roadmap

"v1" (per `00-overview.md` §2) = full TS parity of `ifcopenshell` core + all of `ifcopenshell.api`
+ all of `ifcopenshell.util`, **excluding** anything that requires the geometry kernel. Eleven
numbered phases (0–10) get there, with two intermediate publish checkpoints inserted by
`plan-eng-review` (Phase 2.5 alpha, Phase 6.5 beta) so the roadmap doesn't have a single finish
line 8+ phases deep. Two more phases (G1, B1) are explicitly post-v1.

**The kernel-exclusion carve-out, precisely:** research confirmed only **3 files** in the entire
`api`/`util` surface call into `ifcopenshell.geom` (the compiled OCC/CGAL kernel) directly:
`api/alignment/util.py` (+ 2 alignment internals), `api/geometry/add_profile_representation.py`,
`api/material/edit_profile_usage.py`. Everything else in `api`/`util` — including `util/shape.py`
and `util/shape_builder.py`, which sound geometry-kernel-bound but confirmed via import inspection
to depend only on `numpy` + `shapely` (2D polygon math, building IFC *representation-item* entities,
not computing meshes) — is portable without a kernel decision. So "v1 excludes geometry" means:
port everything, and for those ~3 call sites, stub with a clear runtime error
(`GeometryKernelNotAvailableError` or similar) until the post-v1 kernel phase lands. This keeps
"full parity" achievable on the stated timeline instead of silently blocked on kernel work.

Phase numbers are sequencing, not calendar commitments — sizing/scheduling is for
`plan-eng-review`.

---

## Phase 0 — Scaffolding

- Create `src/ifcopenshell-ts/` package skeleton (see `50-repo-and-tooling.md`).
- Stand up the native-addon build (N-API via `node-addon-api`, CMake integration alongside the
  existing C++ build) with a **single smoke-test binding**: open a file, read its schema name,
  close it. No real API surface yet — this phase exists to de-risk the build/CI pipeline before
  any porting work starts.
- Lint/format/test-runner choices locked in (currently zero in-repo precedent for a TS *library* —
  see `research/05` gap list and `50-repo-and-tooling.md`).
- CI: addon builds on Linux/macOS/Windows **× x64/arm64** (matching the existing C++ CI matrix —
  `plan-eng-review`'s Step 0 check found `build_osx.yml` and `ci-ifcopenshell-python-pypi.yml`
  already build both architectures on macOS plus `linuxarm64`; a Node native addon is exactly as
  arch-specific as the `.pyd`/`.so` files those workflows produce today, so the matrix needs to
  cover the same combinations from the start, not be discovered later when an Apple Silicon or
  Graviton `npm install` breaks), `npm test` runs in the same `ci.yml` fan-out pattern used for
  other sub-packages.

**Exit criterion:** `npm install && npm test` passes in CI on all three OSes across both
architectures, addon loads, opens a trivial in-memory template file.

## Phase 1 — Low-level binding: primitives + schema introspection

Port the native-addon surface identified in `research/01-python-core-and-lowlevel.md` §3:

- `file` primitives: `create`, `by_id`, `by_guid`, `_by_type`/`_by_type_excl_subtypes`, `_add`,
  `_remove`, `_traverse`/`_traverse_breadth_first`, `_get_inverse`/`_get_inverse_indices`,
  `entity_names`, `get_max_id`, `fresh_id`, `header`, `schema_identifier`, `to_string`,
  `from_string`, `_write`, `file_pointer` (identity key, see Phase 2).
- `entity_instance` primitives: `get_argument`/`get_argument_index`, `attribute_name`,
  `attribute_type`, `get_attribute_category`, `get_attribute_names`/`get_inverse_attribute_names`,
  `id`/`identity`, `is_a`, `set_attribute_value_py`, `unset_attribute_value`,
  `get_info_cpp` (bulk recursive serializer — bind this, don't reimplement the recursive walk in
  TS; see `research/01` §2.3).
- Full schema-introspection class set: `declaration`, `entity`, `attribute`, `inverse_attribute`,
  `parameter_type`/`named_type`/`simple_type`/`aggregation_type`, `type_declaration`,
  `enumeration_type`, `select_type`, `schema_definition`, plus module functions `schema_by_name`,
  `schema_names`, `register_schema`.
- **Resolve the "fresh wrapper per access" question first** (`research/01` §1, flagged as the
  single most architecturally important finding): does N-API hand back a stable JS object per
  C++ pointer (in which case the TS mixins are simpler than `file_mixin`/`entity_instance_mixin`),
  or a new one per access (in which case an identity-keyed registry, as Python uses, is required)?
  This determines the shape of Phase 2 and should be a short, concrete spike before Phase 2 starts.
- The exhaustive `set_attribute_value_py`-equivalent type-dispatch (int/bool/tribool/double/
  string/enum/binary/entity-ref/aggregates up to 2 levels — `research/01` §5) is the largest single
  mechanical task in this phase.
- **Async variants (added by `plan-eng-review` outside-voice pass) for the primitives that can be
  slow: file open/parse (path or buffer), the bulk `get_info_cpp` serializer, and `write`** —
  `napi_create_async_work`-based, alongside their sync counterparts. See `10-architecture.md` §2:
  a synchronous N-API call blocks Node's entire event loop, not one thread, which is a correctness
  gap (not just a perf one) for the confirmed server deployment target.
- **Native memory accounting (added by `plan-eng-review` outside-voice pass)**: every native
  allocation calls `napi_adjust_external_memory` (or the `node-addon-api` equivalent) so V8's GC
  correctly weighs off-heap C++ memory it otherwise can't see — see `10-architecture.md` §1.

**Exit criterion:** every primitive above is callable from TS with correct types; a hand-written
integration test creates an `IfcWall`, sets/gets every attribute-type category once, reads it back
via schema introspection. **Added by `plan-eng-review`, both required before Phase 1 closes** (see
`40-testing-strategy.md` §7 for detail): (a) the native addon test build runs under
AddressSanitizer/UndefinedBehaviorSanitizer in CI — a native memory bug here doesn't throw
catchably like a JS exception, it segfaults the whole Node process, and this is the one bug class
a passing TS test suite structurally cannot catch; (b) the file-open/parse primitives get fuzz
testing (corpus-seeded from `test/fixtures/**/*.ifc`) against malformed input, since this is a
Node-only (server-side) library and a very plausible real deployment is a web service parsing
user-uploaded `.ifc` files — the same untrusted-file-parsing attack surface that routinely produces
CVEs in PDF/image parsers.

## Phase 2 — Core TS layer (`file_mixin` / `entity_instance_mixin` port)

Port `research/01`'s core-file breakdown, near-verbatim to TS per its recommendation:

- `IfcFile` (from `file.py`'s `file_mixin`): `Transaction`/undo-redo (`beginTransaction`,
  `endTransaction`, `undo`, `redo`, history), `createEntity`, `add`, `byType`, `traverse`,
  `getInverse`, `remove`, `batch`/`unbatch`, `write` (Node: return `Buffer`/write to path; keep
  the door open for a future browser variant returning `Blob`), `[Symbol.iterator]`, `schema`/
  `schemaVersion` parsing. **Added by `plan-eng-review` outside-voice pass**: an explicit
  `dispose()`/`Symbol.dispose` method for deterministic early release of the underlying native
  allocation in server code that shouldn't wait for GC — see `10-architecture.md` §1.
- `EntityInstance` (from `entity_instance.py`'s `entity_instance_mixin`): attribute proxying via a
  JS `Proxy` over the primitive get/set surface, **confirmed design, see `10-architecture.md` §6**
  — the Proxy trap logic is a near-verbatim port of `__getattr__`/`__setattr__`'s branching, plus
  explicit `.get()`/`.set()` methods underneath as the primitive escape hatch (needed by Phase 5's
  `selector.py` port for dynamically-computed attribute names). **New sub-task this phase must also
  schedule, not defer**: the schema-driven `.d.ts` generator (per-IFC-class type interfaces per
  schema version) that gives the Proxy its type safety — see `10-architecture.md` §6's exit
  criterion. `getInfo`, equality/comparison semantics, `walk()` tree-transform helper.
- `guid.ts` (compress/expand/split/new) — trivial, pure port.
- `settings.ts` — the two global flags (`unpackNonAggregateInverses`, `compareInstancesByValue`).
- `template.ts` — blank-file bootstrapping (`ifcopenshell.file()`-from-scratch equivalent).
- **Explicitly excluded from this phase** (see `00-overview.md` §6, revisit only if a concrete
  need appears): `rocksdb_file_storage`, `stream.py`'s lazy SPF backend, `sql.py`'s SQLite
  backend. These are alternate backends to the primary in-memory object this phase ports, not
  part of it.

**Exit criterion:** `test/bootstrap.py`-equivalent test fixtures (`createTestFile("IFC4" | "IFC2X3"
| "IFC4X3")`) exist and pass; this becomes the foundation every later phase's tests build on
(per `research/02` §5.4 and `research/05`).

## Phase 2.5 — Alpha checkpoint (added by `plan-eng-review`, 2026-09-03)

**Publish `ifcopenshell@0.x.y-alpha` to npm here, before any `util`/`api` porting starts.** This is
the earliest point the whole binding design — the generated (or hand-written-fallback) N-API layer,
the `file_mixin`/`entity_instance_mixin` port, and the confirmed Proxy + generated `.d.ts` attribute
design (`10-architecture.md` §6) — is exercised end-to-end. Rationale: `plan-eng-review`'s Step 0
scope challenge found the original roadmap had a single finish line at Phase 10, meaning the riskiest
bet in the whole project (the binding layer) would go unvalidated by real usage until 8 phases of
`util`/`api` work were already built on top of it. Publishing here catches binding-design problems
(ergonomics complaints, an N-API edge case the wrappergen spike didn't cover, Proxy/`.d.ts` friction)
while the cost of changing course is still low — before the rest of the port commits to the shape
this phase establishes.

**Exit criterion:** `npm install ifcopenshell@alpha` works from a clean environment; README has a
working "open a file, read/set an attribute, create an entity" example; version tagged `-alpha` per
`50-repo-and-tooling.md` §7's sync-to-root-`VERSION` scheme (root `VERSION` is currently
`0.9.0alpha0` — mirror that pre-release convention). This is a real publish, not a dry run — it's the
first point external feedback can reach the project.

**Performance benchmark suite (added by `plan-eng-review`), also gating this phase's close.** The
plan makes several performance claims with nothing verifying them (bulk `get_info_cpp` serializer,
the attribute-metadata cache from Phase 2, zero-copy buffers planned for Phase G1) — a small CI
benchmark suite (attribute access in a tight loop with/without the cache, bulk `get_info` on a
large fixture model, file open/parse time) with regression thresholds closes that gap, catching a
later phase silently reintroducing per-attribute native-boundary crossings the caching design
exists to avoid. This is the natural point to add it: real performance characteristics first exist
to measure once Phase 2's core layer works, and it belongs alongside the alpha checkpoint's other
verification work rather than being deferred further. **Python-baseline comparison (added by
`plan-eng-review` outside-voice pass)**: self-relative regression thresholds alone would let a
binding that's e.g. 5x slower than `ifcopenshell-python`'s SWIG binding pass cleanly, since it never
regresses against its own prior runs — record a one-time ratio (TS time / Python time) for the same
operations against `ifcopenshell-python` (already available in this monorepo's dev environment),
visible and tracked rather than a hard gate (N-API and SWIG have different overhead profiles, some
variance is expected), so a large regression from the port's intended "full parity" bar
(`00-overview.md` §2 — arguably including performance parity, not just API-surface parity) is
caught, not silently accepted.

## Phase 3 — `util` Tier A (pure-data / graph-traversal)

Per `research/03`'s Tier A: `attribute`, `classification`, `constraint`, `date`, `element`
(largest, most depended-on — do first within this phase), `file`, `pset`, `resource`, `schema`,
`system`, `type`, `unit`, `doc`, `mvd_info`. All stdlib-only + core-file dependencies, no numeric
libraries needed.

**Why before `api`:** `research/02` found 31/34 `api` subpackages depend on `ifcopenshell.util.*`
(mostly `element`/`schema`/`unit`/`placement`) — this is a hard prerequisite, not a parallelizable
nice-to-have (see `research/02`'s Tier 0).

## Phase 4 — `util` Tier B (numeric/geometric, non-kernel)

Per `research/03`'s Tier B: `placement` (4x4 matrix math — **`gl-matrix`, decided**, see
`30-open-questions.md` item 5: the de facto standard, zero-dependency, typed, matches the
"operate on Float32/64Array in place" style `placement.py`'s numpy usage implies), `geolocation`
(Helmert transforms), `representation`, `cost` (embeds a `lark`-based formula parser — **hand-rolled
recursive-descent, decided**, same call as Phase 5's `selector.py` grammars and for the same
reason, see item 7), `shape` (its only `shapely` usage is 3 call sites doing `unary_union` polygon
merging — narrow enough that **`polygon-clipping`, decided**, see item 6, covers it without a
heavier GIS library like `turf.js`), `shape_builder` (confirmed kernel-free, no shapely dependency
at all despite the name — needs only the matrix library above), `alignment.py` (the `util` one, not
the `api` one — lighter weight).

## Phase 5 — `selector.py` query DSL

Called out separately per `research/03` because of its outsized value: three `lark` grammars
(filter/key-path/format) totaling ~1300 lines implementing the `"IfcWall, Name=Wall-01"` query
syntax used throughout Bonsai. **Decided: hand-rolled recursive-descent parser in TS**, no
parser-generator dependency (`30-open-questions.md` item 7) — applies to `cost.py`'s formula
grammar too (Phase 4), since neither grammar's complexity warrants pulling in a parser-combinator
or parser-generator library just for these two call sites.
High leverage: unlocks a familiar, powerful query API early, independent of `api` progress.

## Phase 6 — `api` Tier 1 (foundational, low-complexity, high-value)

Per `research/02`'s Tier 1: `root` (small function count, disproportionately tricky logic —
budget real time), `project`, `spatial`, `aggregate`, `owner` (the `owner.settings` monkeypatch
hook needs a TS-idiomatic replacement — injectable config, not a reassignable export — decided
here since it's on the critical path of every entity creation), `unit`, `context`, `pset`
(mechanically large, algorithmically simple — good candidate for table-driven/generated code
rather than hand-translation), `type`, `classification`, `group`, `layer`, `document`, `library`,
`constraint`.

**Cross-cutting, do early in this phase:** the pre/post-listener hook system
(`add_pre_listener`/`add_post_listener`, `research/02` §1.3–1.4) — small, and every subsequent
phase's functions should be wrapped through it from the start rather than retrofitted; typed as
`Map<string, Set<Listener>>` registries, mirroring Python's dict-of-list shape (using `Set` instead
of a list is an intentional, minor behavior change — idempotent re-registration rather than
Python's allow-duplicates list, worth a one-line note in the port). Dispatch style is **confirmed:
typed calls only** (`import { createEntity } from "ifcopenshell/api/root"`), no string-dispatch
`run()` shim (`00-overview.md` §2) — every usecase in this phase and beyond gets a plain typed
function export, not a registry entry.

## Phase 6.5 — Beta checkpoint (added by `plan-eng-review` outside-voice pass, 2026-09-04)

**Publish `ifcopenshell@0.x.y-beta` to npm here.** Rationale: the outside-voice pass on this review
found that Phase 2.5's alpha checkpoint (which validates the binding-design risk early) still left
Phases 3–10 — the bulk of the actual porting work, ~369 `api` functions + ~490 `util` functions —
as one long stretch with no further publish before the Phase 10 finish line. Phase 6 is the right
point for the next checkpoint: Tier 1 `api` (`root`, `project`, `spatial`, `owner`, `pset`, etc.)
means the library can now author entities, not just read/query them — meaningfully more useful to
real adopters than the alpha, and it surfaces ergonomics feedback on the typed-only dispatch
decision (`00-overview.md` §2) before Phases 7–10 commit further to that call shape.

**Exit criterion:** `npm install ifcopenshell@beta` works; README examples cover both data access
(from the alpha) and basic entity authoring (`root.createEntity`, `pset.addPset`, etc.); the
Phase 2.5 benchmark suite re-run shows no regression from the additional surface.

## Phase 7 — `api` Tier 2 (central, structurally tangled)

Per `research/02`'s Tier 2: `material` (4 parallel sub-shapes behind one `assignMaterial` — get
the TS discriminated-union type right here, every downstream consumer inherits it), `feature`,
`nest`, `style`, `system`, `resource`, `profile`, `cost`.

## Phase 8 — `api` Tier 3 (domain-specific, self-contained)

Per `research/02`'s Tier 3: `sequence` (40 fn, 4D scheduling — large but mechanically simple, no
kernel/numpy dependency), `structural` (23 fn, FEA authoring), `georeference`, `grid`, `boundary`,
`drawing`, `control`, `pset_template`. Candidates for demand-driven reordering if a real consumer
needs one of these before the others.

## Phase 9 — `api` Tier 4, non-kernel parts

Per `research/02`'s Tier 4, split as it recommends: `geometry`'s **relationship-CRUD** functions
(`add_representation`, `assign_representation`, `remove_representation`, `map_representation`,
boolean/clip operations that manipulate the entity graph, `edit_object_placement`, wall-connection
bookkeeping) — port now. Its **parametric shape-builder** functions
(`add_wall_representation`, `add_door_representation`, `add_window_representation`,
`add_railing_representation`, `create_2pt_wall`, `regenerate_wall_representation`) are real
CAD-math ports (numpy → TS vector math) but don't touch the kernel — port in this phase too, using
the vector/matrix library chosen in Phase 4. `add_profile_representation` alone is kernel-blocked
— stub per the carve-out above. `alignment`'s non-kernel functions port now; its kernel-touching
curve/clothoid-evaluation helpers stub. `cogo` rides along with alignment.

## Phase 10 — v1 completeness pass

- Port `validate.py` (schema/attribute-type validation, `research/01` §2.7) — a good forcing
  function for full schema-introspection-surface correctness, since it exercises the
  low-level classes directly rather than through `entity_instance` convenience methods.
- Full parity audit: for every Python test file (`research/05`'s testing-conventions inventory),
  confirm a corresponding TS test exists and passes against the same fixture files.
- Close out any Tier-C/niche `util` modules not yet ported opportunistically in earlier phases
  (`brick`, `fm`, `profiler` — small, low-urgency, but part of "full parity" per `00-overview.md`
  unless explicitly descoped in `plan-eng-review`).
- `express/`-generated **derived-attribute** support (`entity_instance.__getattr__`'s EXPRESS
  derived-attribute fallback, `research/01` §2.3) — the one core-layer piece deferred out of
  Phase 2 because it depends on the Python-only rule-compiler codegen path; needs its own design
  (likely: pre-compile derived-attribute logic per schema into the native addon or a generated TS
  module, rather than porting `subprocess`-based on-demand compilation).

**Exit criterion — this is "v1 done":** every `ifcopenshell.api.*`/`ifcopenshell.util.*` function
identified in `research/02`/`research/03` (minus the ~3 kernel-blocked call sites, minus items
explicitly descoped by `plan-eng-review`) has a TS equivalent with a passing test.

---

## Post-v1 phases (explicitly out of scope for the v1 exit criterion)

## Phase G1 — Geometry kernel binding

Bind `ifcopenshell.geom`'s real (non-GUI) API per `research/01` §4: `settings`, `iterator`,
`create_shape`, `tree` (spatial index/clash detection), the `triangulation` buffer surface
(`verts`/`normals`/`faces`/`material_ids`/... — designed for zero-copy transfer, model the N-API
binding on this: return `ArrayBuffer`/`TypedArray` views, not per-attribute calls). Unblocks the
3 stubbed call sites from Phase 9 plus the parametric-builder tests that were skipped, and enables
`draw.py` (2D drawing generation) as a follow-on. Kernel choice (OpenCASCADE vs CGAL vs manifold —
`GEOMETRY_LIBRARY` is a runtime string in Python; a Node addon likely compiles in one) and
threading strategy (`num_threads` — real OS threads are available in Node, unlike the browser
target's Web Worker constraint) are open questions for this phase, not resolved here.

## Phase B1 — Browser/WASM target

Only after v1 (data layer) and ideally after G1 (geometry) are stable: add a second low-level
binding (Emscripten/embind) implementing the *same* primitive surface as the Node addon (Phase 1),
so the Phase 2–10 TS mixin/API/util layer is reused unchanged — only the binding layer differs.
`research/04-wasm-js-infra.md` covers what `ifcviewer-web`'s existing Emscripten build does and
doesn't provide as a starting point for this. Browser-specific concerns deferred to here rather
than solved speculatively now: file I/O via `File`/`Blob`/`ArrayBuffer` instead of paths,
`.ifcZIP` unzipping via a JS lib instead of `tempfile`, `num_threads` mapped to Web Workers +
SharedArrayBuffer (COOP/COEP headers) or forced to 1, and whether the `sql.py`/large-model
strategy (`research/01` §2.9) maps naturally onto `sql.js`/IndexedDB in-browser.
