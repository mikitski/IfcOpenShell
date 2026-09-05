# IfcOpenShell-TS — Architecture

Status: draft, pre-`plan-eng-review`. §3 reflects `research/04-wasm-js-infra.md`'s finding.

## 1. The core structural fact this design is built around

Per `research/01-python-core-and-lowlevel.md` §1: in `ifcopenshell-python`, there is no clean
seam between "the C++ binding" and "the Python logic" as two separate objects. SWIG grafts
`file_mixin`/`entity_instance_mixin` (pure Python, defined in `file.py`/`entity_instance.py`)
directly onto the generated C++ binding classes via multiple inheritance
(`%feature("python:abc", "file_mixin") ifcopenshell::file;`), so `ifcopenshell.file` *is* the SWIG
class with the mixin folded in — not a wrapper around it.

**IfcOpenShell-TS reproduces this same two-layer split, deliberately, rather than flattening it:**

```
┌─────────────────────────────────────────────────────────────┐
│  TS "mixin" layer  (src/ifcopenshell-ts/src/*.ts)             │
│  — file.ts, entityInstance.ts, api/*, util/*                  │
│  — ported ~verbatim from the Python mixins/api/util            │
│  — zero native calls except through the primitive surface      │
│    below; all transaction/undo-redo/query/mutation logic        │
│    lives here, in TypeScript, not in C++                        │
└─────────────────────────────────────────────────────────────┘
                              │  primitive calls only
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  N-API native addon  (src/ifcopenshell-ts/native/)             │
│  — the TS-facing equivalent of ifcopenshell_wrapper (SWIG)      │
│  — exposes the ~15 file/entity_instance primitives + full       │
│    schema-introspection classes (research/01 §3), nothing more  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Existing C++ core  (src/ifcparse, src/ifcgeom, ...)            │
│  — unmodified by this project                                   │
└─────────────────────────────────────────────────────────────┘
```

Rationale (from `research/01`'s recommendation, adopted here): `file_mixin`/
`entity_instance_mixin` contain substantial, non-trivial, **engine-independent** logic —
transactions/undo-redo, `get_info` fallback, attribute-index resolution, schema-string parsing,
comparison semantics. None of it needs C++. Porting it near-verbatim to TS, and keeping the native
addon to only the primitive methods the mixins actually call, means:

- The addon surface is small, stable, and easy to keep in sync with the C++ core (important given
  §3's confirmed generated-binding approach, gated on its validation spike).
- Nearly all of the actual porting effort (`20-roadmap.md` Phases 2–10 — the bulk of "full parity")
  is ordinary TypeScript, testable without touching native code, and reviewable by anyone who knows
  the Python source, not just people comfortable with N-API internals.
- The same addon-primitive surface is reusable, unchanged, if Phase B1 (browser/WASM, post-v1)
  swaps in an embind binding instead of an N-API one — only the bottom layer changes, per
  `20-roadmap.md`'s Phase B1 description.

## 2. The primitive surface (what the native addon must expose)

Enumerated in full in `research/01-python-core-and-lowlevel.md` §3 and restated as the Phase 1
task list in `20-roadmap.md`. Two groups:

1. **`file`/`entity_instance` primitives** — the underscore-prefixed "raw" methods
   (`_by_type`, `_add`, `_remove`, `_traverse`, `_get_inverse`, ...) that SWIG's `%rename` convention
   already separates from the friendly mixin-provided names (`research/01` §5, point 1: "The
   underscore-prefixed names are the 'raw primitive, Python-mixin wraps it' convention" — an N-API
   addon should keep this exact split, using the same naming convention, so the mapping from
   Python source to TS source stays mechanical).
2. **Schema-introspection classes** — `declaration`, `entity`, `attribute`, `inverse_attribute`,
   the `parameter_type` hierarchy, `type_declaration`, `enumeration_type`, `select_type`,
   `schema_definition`. Exposed in full because `validate.py` (Phase 10) and large parts of
   `ifcopenshell.util` (Phase 3/4) consult these directly, not just through `entity_instance`
   convenience methods.

Two implementation details called out in `research/01` §5 as needing an explicit decision at this
layer, not deferred to the TS mixin layer:

- **The `get_attribute_category`/attribute-type-dispatch contract.** `set_attribute_value_py`'s
  ~15-way type dispatch (int/bool/tribool/double/string/enum/binary/entity-ref/aggregates up to 2
  levels deep) is the exhaustive contract the addon's get/set boundary must reproduce in both
  directions — this is the single largest mechanical task in Phase 1.
- **`get_info_cpp`, the bulk recursive serializer.** Python's `entity_instance.get_info()` uses this
  C++-side fast path for the common case (`recursive=True`) instead of walking attributes one at a
  time from Python — cross-language-boundary cost matters here the same way it matters crossing
  JS↔native, so the addon should offer an equivalent single-call bulk serializer rather than making
  the TS mixin loop attribute-by-attribute across the N-API boundary per instance.

**Native object lifetime (added by `plan-eng-review` outside-voice pass).** V8's GC triggers on
JS-heap pressure and has zero visibility into off-heap native (C++) allocation size unless the
addon explicitly tells it. Without that, a long-running server processing many files over the
process's lifetime can accumulate large native `IfcFile`/entity allocations that V8 never feels
pressured to collect, since from V8's perspective the JS wrapper objects are tiny — the classic
"memory usage keeps climbing, nobody knows why" failure mode in native-addon servers. **Decided:
every native allocation calls `napi_adjust_external_memory` (or `node-addon-api`'s equivalent
memory-management call) so V8's GC accounts for it correctly, and `IfcFile` gets an explicit
`dispose()`/`Symbol.dispose` method for deterministic early release in server code that shouldn't
wait for GC.** Phase 1 scope, alongside the async work above — standard, well-documented practice
for this exact problem class in the Node native-addon ecosystem, not exploratory work.

**Async story (added by `plan-eng-review` outside-voice pass).** Node has no GIL-style
preemption — a synchronous N-API call blocks the *entire* event loop, not one thread. This
matters specifically because of the confirmed Node-only server deployment target and the
malformed-input/fuzz-testing rationale already adopted above (a plausible real deployment parses
user-uploaded `.ifc` files): a large real-world IFC file (hundreds of MB is common) parsed
synchronously stalls every concurrent request on the server for the duration of that parse, not
just the request that triggered it. **Decided: the primitives that can be slow — file open/parse
(from path or buffer), the bulk `get_info_cpp` serializer, and `write` — get
`napi_create_async_work`-based async variants alongside their synchronous counterparts.** The TS
mixin layer (Phase 2) exposes both: sync for convenience/small files and REPL-style use, async for
server-safe handling of large or untrusted files. This is Phase 1 scope, alongside the primitives
already listed in §2 — real, well-trodden N-API work, not exploratory.

**Implemented** (async-primitives PR, `20-roadmap.md`'s Phase 1 tracker): `file_new_with_path`,
`file_new_with_data_data_size`, `get_all_attribute_values`, and the newly-shimmed `write` each got
an `_async` N-API sibling returning a JS `Promise`. One load-bearing implementation detail for
whoever builds on this: a handle-typed "self" argument (e.g. the `file`/`entity_instance` a method
runs against) can't be deep-copied into an independently-owned C-ABI wrapper struct from the N-API
translation unit — `emit_c_api_header` only forward-declares those structs, their full definition
lives only in the separately-compiled implementation file. Each async variant instead takes a
`napi_ref` on the original JS wrapper object for the duration of the worker-thread call (pinning it,
and therefore the native object it owns, alive even if the JS wrapper itself becomes unreachable and
a GC pass runs mid-flight), and uses the already-unwrapped raw pointer directly. Verified end-to-end
under real Node (manually built, this sandbox lacked `cmake`): correct results, a real rejected
`Promise` on error, the event loop staying responsive during a slow call, and no crash/corruption
under repeated forced-GC pressure while a call was in flight.

**Error-propagation contract (added by `plan-eng-review`, was previously undecided between two
incompatible patterns described in the research).** SWIG's Python binding translates C++
exceptions 1:1 into Python exceptions per call (`research/01` §5: `attribute_out_of_range_exception`
→ `IndexError`, etc.); `wrappergen`'s C API instead uses a thread-local last-error-string checked
after each call (`research/04` §1.1: `ifcopenshell_last_error_message()`/`_clear()`). **Decided:
adopt the last-error-string pattern already implemented in `wrappergen`'s C API (what the Phase 1
spike is testing), translated into a thrown JS `Error` (subclassed per error kind where the C API
distinguishes them — e.g. a `RangeError` for `attribute_out_of_range_exception`) at the N-API
boundary itself.** This means every generated N-API wrapper function checks the C API's return
sentinel + last-error-string once, mechanically, and throws — so the TS mixin layer (Phase 2 and
beyond) sees ordinary throwing functions, matching Python's exception-based ergonomics exactly and
keeping the near-verbatim port mandate (`00-overview.md` §1) intact, rather than restructuring
every ported line around explicit Result-checking.

## 3. Low-level binding technology — generated, gated on a validation spike (confirmed)

Fixed by the project owner (`00-overview.md` §2): **Node.js, N-API native addon**, not WASM/embind,
for v1, via a **timeboxed spike extending `wrappergen`, with hand-written `node-addon-api` as the
explicit fallback** — confirmed 2026-09-03, not just a recommendation any more.
`research/04-wasm-js-infra.md` resolves *how* that addon gets built:

- **Option A — hand-written.** `node-addon-api` (C++ wrapper over N-API) + CMake integration
  alongside the existing `cmake/` build. Direct, well-understood, but every primitive in §2 is
  hand-maintained glue code, analogous to how `src/ifcwrap/*.i` is hand-maintained today for SWIG.
- **Option B — generated (recommended).** `src/wrappergen/` already does clang-based C++-header
  parsing → a genuinely language-agnostic C ABI (`research/04` §1.1: opaque handles, `extern "C"`,
  thread-local error strings — verified by full read of the emitter, no Python type leaks into it)
  → a Python-specific extension/facade as two thin sibling emitter functions on top of that same
  ABI. An N-API extension emitter + TS facade emitter are structurally identical siblings to the
  two that already exist, walking the same model. The full schema-introspection surface (
  `declaration`/`entity`/`attribute`/`inverse_attribute`/`schema_definition`/etc.) is already
  generated correctly today. **The real gap** is a missing "variant" type adapter for polymorphic
  attribute-value get/set (`research/01` §5's ~15-way dispatch — the single largest primitive task
  either option has to solve, and SWIG's `.i`-file typemaps solve it today only by hand, so this
  isn't extra cost unique to Option B), plus buffer-based file open and the `get_info_cpp` bulk
  serializer.

**Decision (confirmed by project owner, 2026-09-03): pursue Option B, gated on a timeboxed
validation spike before Phase 1's schedule depends on it.** `research/04` §1.3/§2 is explicit that `wrappergen` is a 5-commit, ~5-month-old,
opt-in, zero-other-references *experimental* prototype — sound design, unproven past the small
`file.h`+`express.h` header subset it's currently pointed at. Recommended spike (1-2 weeks): add
the variant adapter and emit a minimal N-API binding for `file`+`entity_instance`+`declaration`
only — enough to open a file, create/read/write one entity's attributes, and query its declaration.
If the generator's assumptions (its single-parent `class_owner_types` ownership model; the clang
frontend's behavior across the *full* `ifcparse` header set, not just the two headers it's
currently wired to) hold up, Phase 1 becomes substantially cheaper and stays in sync with the C++
core automatically. If the spike surfaces a fundamental mismatch, fall back to hand-written
`node-addon-api` glue for Phase 1's primitives without re-litigating this section — `plan-eng-review`
should treat the spike's outcome, not this document, as final.

## 4. What does NOT change in the C++ core

This project adds a new consumer of the existing C++ core (`src/ifcparse`, `src/ifcgeom` once
Phase G1 starts) — it does not modify `IfcParse::IfcFile`, `express::Base`, or any schema
definition. Where `ifcwrap`'s SWIG `.i` files needed C++-side accommodations (per
`research/01` §5's renaming/typemap findings), those accommodations already exist and are reusable
as reference for what an N-API layer needs to replicate — they are not evidence that new C++
changes are needed for this project, only that the *binding* layer (SWIG today, N-API here) has to
do real work translating between C++'s type system and the target language's.

## 5. Geometry (post-v1, Phase G1) — architectural placement, not detailed design

Per `00-overview.md` §2/§6, geometry access (`ifcopenshell.geom`'s `settings`/`iterator`/
`create_shape`/`tree` surface, `research/01` §4) is out of scope for v1. Architecturally, it slots
into the same primitive-surface pattern as §2 — a second batch of native-addon primitives (kernel
settings, iterator protocol, triangulation buffer access) — rather than requiring a different
binding technology. The `triangulation` class's `*_buffer` properties (`research/01` §4, "the
`*_buffer` properties are exactly the shape a WASM→JS `Float32Array`/`Int32Array`/`Uint8Array` view
should target") apply equally to an N-API `ArrayBuffer`/`TypedArray` return — same design principle,
zero-copy bulk transfer instead of per-vertex calls, regardless of which native-binding technology
is in play. Full design deferred to Phase G1 per `20-roadmap.md`.

## 6. Attribute access design (confirmed choice, identity question now resolved): Proxy over
primitives + generated per-schema `.d.ts`, backed by an identity-keyed registry

Resolved by the project owner, 2026-09-03 (`00-overview.md` §2), from the three options
`30-open-questions.md` item 4 originally posed. **Update, Phase 1 primitive-binding chunk**: the
"fresh wrapper per access vs. stable identity per pointer" question this section originally flagged
as blocking is now empirically resolved — **fresh wrapper per access, confirmed** (real `.node`
addon, real Node process, `!==` on two calls to the same accessor on the same handle; see
`research/07-fresh-wrapper-per-access.md` for the test and the code-level explanation of why). This
is the same shape Python's own SWIG binding already has, which is exactly why `file_mixin`/
`entity_instance_mixin` already carry an identity-keyed registry (`research/01` §1) — Phase 2 needs
to port that pattern close to verbatim, not simplify it away. Concretely: `EntityInstance`'s
equality (`__eq__`) must compare via `identity()` (a stable native-side value), never via `===` on
two JS wrapper objects; any per-instance mutable state Phase 2's mixin layer wants to attach
(`Transaction`/undo-redo history, etc.) needs a `Map<nativeIdentity, State>`-shaped registry, not a
`WeakMap` keyed on the wrapper object (which would silently fragment two wrappers of the same
instance into two unrelated entries). Two independent halves, deliberately decoupled:

**Runtime half — a `Proxy`, not per-class generated code.** `EntityInstance` (the TS port of
`entity_instance_mixin`, `20-roadmap.md` Phase 2) wraps every native handle in a JS `Proxy` whose
`get`/`set` traps call the exact same primitives Python's `__getattr__`/`__setattr__` call
(`research/01` §5: `get_attribute_category` → `get_argument`/`get_argument_index` or
`set_attribute_value_py`, falling through to `_get_inverse` for inverse attributes). This is a
direct, mechanical port of `entity_instance_mixin.__getattr__`/`__setattr__`'s branching logic —
the Proxy trap *is* the TS translation of that method, not a new design. No per-IFC-class runtime
object is generated or instantiated; one `Proxy` handler implementation serves every entity, in
every schema version, identically to how one Python `__getattr__` implementation does today.

**Attribute-metadata caching (added by `plan-eng-review`, resolves `research/01` §2.7's flagged
open question).** Unlike Python's SWIG binding, where `get_attribute_category`'s linear scan over
schema metadata is an in-process C++ call, an N-API call pays real marshaling overhead per
crossing. Since `__getattr__`/`__setattr__`'s equivalent runs on **every single attribute access**,
and IFC-processing code routinely loops over thousands of entities (`util/element.py`-style
traversal), the Proxy must NOT call the native `get_attribute_category`/`get_argument_index`
primitives on every access. Instead: populate a `Map<schemaVersion, Map<className,
AttributeMeta[]>>` cache once per schema version — a single bulk call into the existing
schema-introspection primitives (§2, already exposes `declaration`/`entity`/`attribute` etc., no
new native surface needed) — and have the Proxy trap consult that TS-side cache for the
name→index/category lookup, falling to a native call only for the actual value get/set
(`get_argument`/`set_attribute_value_py`). This mirrors the `get_info_cpp` bulk-serializer
precedent already in this design: push repeated cross-boundary metadata lookups to a one-time bulk
fetch, cross the boundary only for the per-instance value itself.

**Type half — generated, source-static `.d.ts`, independent of the runtime.** A codegen step
(schema-driven, likely a `wrappergen`-adjacent tool per `research/04` — the schema-introspection
C API surface it already generates, `declaration`/`entity`/`attribute`/`type_declaration`/etc., is
exactly what this codegen needs to walk) emits one interface per IFC entity class per schema
version:

```ts
// generated/ifc4.d.ts (illustrative — exact shape is a codegen-design detail, not fixed here)
interface IfcWall extends IfcBuildingElement {
  readonly PredefinedType: IfcWallTypeEnum | null;
  // ...
}
```

A typed accessor helper (`entity.as<IfcWall>()`, or a generic `EntityInstance<"IfcWall">` return
type from `file.byId`/`byType` when the class is statically known) intersects the `Proxy` with the
generated interface for the type checker, while the *runtime* object underneath is the same
class-agnostic `Proxy` for every entity. TypeScript's structural typing means this costs nothing at
runtime — the interface is erased at compile time, same as any other TS type annotation.

**Why this over the other two options** (full reasoning already in `30-open-questions.md` item 4,
kept here as the resolved rationale): generated typed *classes* (option (a)) would need real
generated code — getter/setter method bodies, not just type declarations — multiplied across 3
schema versions × ~800 classes each, a maintenance surface with no equivalent on the Python side to
keep it honest against. Explicit `.get()`/`.set()` (option (c)) is always available as an escape
hatch (worth keeping as the underlying primitive regardless — dynamically-computed attribute names,
e.g. from `selector.py`'s query DSL port in Phase 5, need it) but loses the `wall.Name = "x"`
ergonomics that are the whole point of the "translate exactly" mandate (`00-overview.md` §1). The
chosen design gets both: Python-equivalent runtime ergonomics from one shared Proxy implementation,
and Python-type-stub-equivalent (`ifcopenshell_wrapper.pyi`'s role, `research/01` §1) static typing
from a generated, source-static `.d.ts` layer that never has to be kept in sync by hand.

**Follow-on work this creates, tracked for `20-roadmap.md` Phase 2 / a new sub-phase**: the `.d.ts`
generator itself is new scope not previously called out as its own task — it needs a home (most
likely as another `wrappergen`-adjacent emitter, per §3's reasoning that schema-introspection
codegen is already that tool's proven strength) and its own exit criterion (generated types compile
cleanly against a hand-written test asserting `wall.Name` type-checks as `string | null` for a
known `IfcWall` instance, across all three schema versions). This should be scheduled early in
Phase 2, not treated as a nice-to-have polish pass at the end — the Proxy alone (without generated
types) is usable but doesn't deliver the type-safety half of this decision.

**Spike-and-fallback (added by `plan-eng-review` outside-voice pass) — this generator is a second,
separate bet on `wrappergen` beyond the N-API layer §3 already bets on, and was originally missing
the same risk treatment.** Bundle validating `.d.ts` emission into the §3 spike (or a short
follow-on once that spike's outcome is known) rather than assuming it works. **Explicit fallback if
generation doesn't pan out: hand-write `.d.ts` files for the highest-traffic entity classes**
(`IfcWall`, `IfcProject`, `IfcBuildingElement`, and other frequently-used classes identified from
`research/02`'s usage patterns) rather than blocking Phase 2 on tooling with no plan B. This mirrors
§3's already-established pattern for exactly this class of risk — an unproven, ~5-month-old
experimental tool getting a second load-bearing responsibility deserves the same bounded-downside
treatment as its first.
