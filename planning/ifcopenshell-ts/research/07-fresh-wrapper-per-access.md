# Research 07 — "Fresh wrapper per access": empirical answer

Status: resolves `research/01-python-core-and-lowlevel.md` §1's flagged open question and
`30-open-questions.md` §C's "Fresh wrapper per access" item, both explicitly gating Phase 2 in
earnest. Written against the real Phase 1 primitive binding (`ts/phase-1-primitive-binding`), not
the spike — the spike's own exit criteria didn't require answering this, and didn't.

## The question

Does the generated N-API binding hand back a **stable JS object per underlying C++ pointer**
(matching what Python's SWIG binding structurally *could* do but doesn't), or does it **mint a new
JS wrapper object on every accessor call**, even when the same underlying native data is being
observed twice? `10-architecture.md` §6's whole Proxy/attribute-cache design for Phase 2 is written
assuming stable identity; `research/01` §1 and §5 point 3 both flag that Python's own answer is
"fresh wrapper" (SWIG mints a new Python object per attribute access, which is exactly why
`file_mixin`/`entity_instance_mixin` need the `registry: dict[int(pointer), state]` identity-keyed
side-table trick — a Python object's own identity can't be used as the state key, since it isn't
stable).

## Method

Not settled by reading the generator's source alone (though that already gives a strong hypothesis
— see below) — verified by actually compiling the real, full Phase 1 primitive binding (the same
generated code and shim this PR ships, not a throwaway reproduction) into a real `.node` addon,
linking it against a real, statically-schema-registered build of the C++ core, and running it under
Node. Two concrete checks, both exercised via the checked-in integration test
(`src/ifcopenshell-ts/test/native/primitives.test.ts`, "fresh wrapper per access" test case) and,
before that test existed, via an ad hoc verification script during development:

1. Call `file.schema()` **twice** on the same `file` handle. Compare the two results with `!==`
   (JS reference identity) and also compare their *observed data* (`schema_definition.name()`).
2. Call `wall.declaration()` **twice** on the same `entity_instance` handle (a `"borrowed"`
   handle-kind class, per `06-wrappergen-spike-results.md` §3.5 — the class family most likely to
   have been special-cased for stable identity, since its wrapper struct already stores nothing but
   a raw, shared pointer). Same comparison.

## Result

**Fresh wrapper per access, confirmed empirically, in both cases.** `schemaA !== schemaB` and
`declA !== declB` — two calls to the same accessor, on the same underlying handle, each return a
**distinct** JS object (a distinct `napi_value` backed by a distinct heap-allocated wrapper struct).
Both pairs nonetheless observe identical underlying data (`schemaA.name() === schemaB.name() ===
"IFC4"`, `declA.name() === declB.name() === "IfcWall"`) — confirming this is "two JS objects
aliasing the same native pointer," not "two independent native objects that happen to agree," i.e.
exactly Python's own SWIG-binding shape, not a difference the choice of binding technology
incidentally fixed.

## Why (code-level explanation, confirming the empirical result)

`emit_napi_extension`'s `_napi_wrap_name`-generated wrapper function is:

```cpp
napi_value wrap_ifcopenshell_declaration_t(napi_env env, ifcopenshell_declaration_t* handle) {
    ...
    napi_value result;
    napi_create_external(env, handle, ifcopenshell_declaration_t_finalize, nullptr, &result);
    return result;
}
```

Called unconditionally on **every** handle-returning primitive call
(`emit_c_api_implementation`'s per-callable emission always does `new {c_type}{...}` to build a
fresh C-ABI wrapper struct first — see `_emit_handle_return_lines`, unchanged by this PR — and
`emit_napi_extension` then wraps *that* fresh struct in a fresh `napi_create_external`). There is no
per-pointer cache anywhere in the generated code or the C API layer checking "have I already
minted a JS external for this exact `ifcopenshell::declaration*` before, and if so, hand back the
same one" — every call allocates a new C-ABI wrapper struct (even for `"borrowed"` handle_kind,
where the struct is *just* a raw pointer plus no other state) and a new `napi_external`. This holds
for every handle-kind (`"value"`, `"shared_ptr"`, `"borrowed"`) equally — `"borrowed"`'s cheaper,
copy-free wrapper still gets a **new wrapper struct instance** per call, it just doesn't copy the
*pointee*.

## Implication for Phase 2

**`10-architecture.md` §6's Proxy design needs the identity-keyed shared-state registry it was
written assuming it might not need** (per that section's own explicit caveat, added by
`plan-eng-review`'s outside-voice pass, flagging this as pending exactly this spike/test). Concretely:

- **Equality semantics**: `entity_instance_mixin.__eq__`'s Python behavior (`self.identity() ==
  other.identity()`, i.e. compare via the *native* identity — a stable `uint32_t` the C++ core
  itself hands out per in-memory instance, see `express::base::identity()`, already exposed as a
  primitive) is the correct, and now confirmed *necessary* (not just a style choice), pattern for
  Phase 2's `EntityInstance` port. **`===` on two JS wrapper objects must never be used as an
  entity-identity check** — confirmed above to be reliably `false` even for two wrappers of the
  literal same underlying instance.
- **Shared mutable state** (Phase 2's `Transaction`/undo-redo history, and any other per-instance
  state the TS mixin layer wants to attach that isn't itself stored in the C++ object) needs
  exactly Python's `file_mixin.registry: Map<nativeIdentity, State>` pattern — keyed by a stable
  native identity value, not by JS object identity or a `WeakMap` keyed on the wrapper object (a
  `WeakMap` would silently fragment: two wrappers of the same instance would get two independent
  entries instead of sharing one). `express::base::identity()` is already exposed as a primitive
  and is exactly this key for `entity_instance`. **`file::file_pointer()`** (Python's own
  `int(self.this)`-registry key for `file_mixin.post_init`, per `research/01` §5 point 3) is **not
  yet exposed as a primitive by this PR** — like `to_string()`/`from_string()`/`_write()`, it only
  exists as SWIG `%extend` glue today (confirmed: no real `ifcopenshell::file` method backs any of
  these), and implementing it is real, disclosed, bounded follow-up work for whoever picks up
  Phase 1's remaining `file`-level serialization primitives (a one-line `reinterpret_cast<size_t>`
  shim function, exactly like `express::base`'s `identity()`/`id()` case) — see this PR's own
  report for the full list of what's deferred.
- **The attribute-metadata cache** `10-architecture.md` §6 already designs (`Map<schemaVersion,
  Map<className, AttributeMeta[]>>`) is unaffected — it's keyed by schema/class name, not by
  instance identity, so this finding doesn't change that part of the design.
- **A cheap mitigation Phase 2 should consider, not a substitute for the registry above**: since
  every wrapper is fresh, wrapping a handle at the JS boundary is not free (a heap allocation plus a
  finalizer registration per call) — Phase 2's Proxy could still opt to *cache the wrapper object
  itself* per native identity (a `Map<nativeIdentity, WeakRef<EntityInstance>>`-shaped cache) purely
  as a performance optimization (fewer redundant `narrow`/wrap round-trips for hot-path code that
  repeatedly re-fetches the "same" related entity), but this is optional ergonomics, not something
  the *correctness* of equality/shared-state depends on once the identity-keyed registry above is in
  place.

This is not a regression relative to Python's own binding — Python's SWIG layer has exactly the
same "fresh wrapper per access" shape today, which is *why* `file_mixin`/`entity_instance_mixin`
already carry the registry-by-native-pointer pattern `research/01` §1 describes. The practical
upshot for Phase 2 is: **port that part of `file_mixin`/`entity_instance_mixin` close to verbatim**,
substituting `identity()`/`file_pointer()`'s TS-side equivalents for Python's `int(self.this)`, and
build `10-architecture.md` §6's Proxy on top of that registry rather than on any assumption of
stable per-pointer JS object identity.
