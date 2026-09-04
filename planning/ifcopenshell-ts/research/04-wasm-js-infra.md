# Research 04 — Existing WASM/JS/Codegen Infrastructure & Reuse Assessment

Status: research finding, feeds `10-architecture.md` §3 and `30-open-questions.md` item 1.
Written against `v0.9.0` (commit `2c1d445d5`), after `00-overview.md`/`10-architecture.md`/etc. were
already drafted by a sibling agent — this file fills the gap those documents were written pending.

## 1. `src/wrappergen/` — the clang-based C++→C-API generator

### 1.1 What it actually does, end to end

`generate.py` builds a `WrapperConfig` (`config.py`) pointed at every `*.h` in `src/ifcparse/`
(excluding `schemas/`), restricted to `allowed_namespaces=["ifcopenshell", "express"]`, and
compiles them with clang (`clang_frontend.py`, via libclang, `-std=c++17`) into a `ModuleModel`
(`model.py`): a flat list of `ClassModel`s (each with `CallableModel`s — constructors/methods) and
`EnumModel`s. `emit.py` then walks that model four times to produce four *separate* output files
(`write_module_outputs`, `emit.py:894-899`):

1. `ifcopenshell_experimental_c_api.h`/`.cpp` — a **plain C ABI**: opaque `typedef struct
   ifcopenshell_<class>_t` handles, `extern "C"` functions, `ifcopenshell_last_error_message()` /
   `_clear()` for thread-local error propagation instead of exceptions crossing the C boundary,
   `ifcopenshell_string_free()` for returned `char*` ownership. **No Python type anywhere in this
   layer** — confirmed by reading `emit_c_api_header`/`emit_c_api_implementation` in full
   (`emit.py:279-552`): every type is `char*`/`int`/`bool`/opaque handle pointer/list handle
   pointer, and errors are `try { ... } catch (const std::exception&) { set_last_error(...); return
   <sentinel>; }` around every call.
2. `_ifcopenshell_experimental.cpp` — the CPython C-extension (`#include <Python.h>`,
   `PyArg_ParseTuple`, `PyCapsule_New`/`PyCapsule_GetPointer` for handle lifetime, a
   `PyMethodDef`/`PyModuleDef` table). **This is a real CPython extension module, not ctypes** —
   correcting the framing in my task brief. It's a thin, mechanical adapter from the C ABI to
   Python's C-API (`emit_python_extension`, `emit.py:555-762`).
3. `ifcopenshell_experimental.py` — a Python **facade** (`emit_python_facade`, `emit.py:848-891`)
   that `import _ifcopenshell_experimental as _native` and wraps each capsule in a
   `__slots__ = ("_handle",)` class with typed methods delegating to the native calls — this is the
   *only* Python-specific artifact in the whole pipeline, and it exists purely because step 2
   targeted CPython specifically.

**The critical structural fact**: steps 1 and 2-3 are cleanly separated. `emit_c_api_header`/
`emit_c_api_implementation` consume nothing Python-specific — they're pure `ModuleModel` →
language-agnostic-C-ABI-text functions. Steps 2 and 3 are two more emit functions
(`emit_python_extension`, `emit_python_facade`) that consume the *same* `ModuleModel` and the
*already-generated* C API, doing nothing steps 1 didn't already finish. This means **an N-API
binding + a TS facade are two new sibling emit functions of the same shape**
(`emit_napi_extension`, `emit_typescript_facade`), not a redesign of the generator. Concretely:
`emit_napi_extension` would replace `PyArg_ParseTuple`/`PyCapsule_*` with N-API's
`napi_get_cb_info`/`napi_wrap`/`napi_unwrap` equivalents, walking the exact same
`_all_variants(model)` loop that `emit_python_extension` already walks type-adapter-by-type-adapter
(`emit.py:592-731`); `emit_typescript_facade` would replace `emit_python_facade`'s Python
class-with-`__slots__` generation with a TS class-with-a-private-handle-field generation, same
per-`ClassModel`/`CallableModel` walk, emitting `.d.ts`-friendly signatures directly instead of
Python type hints (`_python_type_for_parameter`/`_python_type_for_return`, `emit.py:765-796`, have
a straightforward TS analogue).

### 1.2 What's NOT yet solved — the real gap

The type-adapter system (`conventions.py`, referenced via `is_handle_adapter`/`is_enum_adapter`/
`is_sequence_adapter` in `emit.py`) currently covers exactly: `string`, `integer`, `bool`, `void`,
`enum`, `handle` (opaque class pointer), and one level of `sequence` (`std::vector<T>` of handles).
Verified against the actual generated output
(`src/wrappergen/generated/ifcopenshell_experimental_c_api.h`, 241 lines / 73 declared
types-and-functions): the **full schema-introspection surface is already there** —
`declaration`/`entity`/`attribute`/`inverse_attribute`/`type_declaration`/`enumeration_type`/
`select_type`/`schema_definition`/`parameter_type` hierarchy, plus `file` lifecycle
(`ifcopenshell_file_new_with_path*`, `instance_by_id`/`instance_by_guid`,
`instances_by_type[_excl_subtypes]`, `batch`/`unbatch`, `fresh_id`, `header`, `schema`) and
`global_id`. This is close to a 1:1 match for `research/01-python-core-and-lowlevel.md` §3's
schema-introspection primitive list.

**What's conspicuously missing**: the polymorphic attribute-*value* get/set that
`research/01` §5 flags as "the single largest mechanical task" — Python's
`set_attribute_value_py`'s ~15-way dispatch (int/bool/tribool/double/string/enum/binary/entity-ref/
aggregates up to 2 levels deep) and its `get_argument` read-side equivalent. I grepped the full
generated header for every `attribute`/`argument`-related symbol
(`ifcopenshell_base_unset_attribute_value` is the *only* value-mutation function present) — there
is no generic value get/set yet, because the adapter system has no "tagged union / variant" case.
Neither does it yet support: opening a file from an in-memory buffer (`file.h` only exposes
`new_with_path*` variants in the current output — no buffer/string constructor is generated, though
`research/01` notes the underlying C++ `FileReader<FullBufferImpl>` supports this, per
`findings.md`'s recent buffer-constructor fix — the C++ capability exists, wrappergen just hasn't
been pointed at it/given it an adapter), and `entity_instance.get_info()`'s bulk recursive
serializer (`get_info_cpp`) has no generated equivalent either — both are `express::Base`-family
methods that likely aren't in the currently-compiled header set or hit an unsupported parameter/
return shape.

None of this is a sign the tool is unsound — it's a sign the **adapter/type-conversion layer is the
part that needs extending**, not the class/method-discovery pipeline (clang parsing) or the
per-language emission pipeline (the C-API/extension/facade split). Adding a "variant" adapter
(most likely: emit a small tagged-union C struct — `{ ifcopenshell_value_kind_t kind; union {...}; }`
— and one shared conversion helper on both the C++ and N-API sides) is bounded, scoped work,
not a rearchitecture.

### 1.3 Maturity

`git log --oneline -- src/wrappergen` returns **5 commits total**, spanning 2026-03-31 ("Add
Codex-generated wrappergen" — explicitly AI-authored per its own commit message) through 2026-08-08
("Last minute refactoring"), roughly one month before this planning work. It is:

- **Opt-in, not built by default**: gated behind `BUILD_IFCPARSE_EXPERIMENTAL_WRAPPER` in
  `cmake/CMakeLists.txt:592-594` (off unless explicitly enabled), and its own
  `IFCPARSE_WRAPPERGEN_REGENERATE` CMake option (default `OFF`) controls whether it even
  regenerates from the checked-in `generated/` snapshot or just builds that snapshot as-is.
- **Not referenced anywhere else in the codebase** — no other `CMakeLists.txt`, CI workflow, or
  doc references it beyond its own directory and one example script
  (`src/wrappergen/examples/print_walls.py`).
- Already WASM-aware in one respect: its CMakeLists sets a `wasm32-emscripten` Python extension
  suffix when `WASM_BUILD` is set (`src/wrappergen/CMakeLists.txt`, near the bottom) — suggesting
  whoever built it at least considered it might also target Pyodide/WASM Python builds, though
  there's no evidence it's actually wired into the `pyodide/` build path today.

**Read plainly: this is a small, recent, unreviewed, explicitly-labeled "experimental" prototype —
not a mature, load-bearing part of the codebase.** It has no track record of surviving schema
changes, no test suite of its own found, and 5 commits of history. Treat its *design* (the
C-ABI/language-emitter split) as sound and worth building on; do not treat it as a finished tool
you can point at `ifcparse` and get a working addon out of unmodified.

## 2. Reuse assessment — concrete recommendation

**Recommendation: extend `wrappergen`, do not hand-write the N-API layer from scratch — but budget
this as real, scoped engineering work with a fallback, not a free lunch.**

Reasoning:

- The hardest, most error-prone part of any C++→other-language binding is exactly what
  `wrappergen` already has working: clang-driven method/class discovery so the binding surface
  can't silently drift from the C++ header (`research/01`'s SWIG comparison flags several `.i`-file
  drift bugs in `findings.md` as the kind of thing hand-maintained bindings are prone to), a clean
  opaque-handle-plus-ownership model (`shared_ptr`-vs-owned-value handle kinds,
  `class_owner_types` for lifetime-tied-to-parent objects like `express::base` living inside a
  `file`), and a working error-propagation convention (thread-local last-error string, checked at
  every call site). Reimplementing that from scratch by hand for N-API would be redoing real,
  already-solved design work.
- The part that's missing (the attribute-value variant adapter, buffer-based file open,
  `get_info_cpp`) is genuinely new work *regardless* of which path is chosen — it doesn't exist in
  the SWIG binding's generation *tooling* either (SWIG's typemaps for this are hand-written `.i`
  code, per `research/01` §5). So "hand-write N-API instead" doesn't avoid this work, it just does
  it once (for N-API only) instead of once in a way that's reusable.
- Extending `emit.py` with `emit_napi_extension`/`emit_typescript_facade` reuses the exact
  `ModuleModel`/`_all_variants` walk the Python emitters already prove out — this is incremental,
  same-shaped work by the person/agent who does it, not a new subsystem.

**Fallback condition, stated plainly for `plan-eng-review`**: if a short, timeboxed spike (recommend:
1-2 weeks, scoped to "add the variant adapter + emit a minimal N-API binding for `file` +
`entity_instance` + `declaration` only, enough to open a file, create/read/write one entity's
attributes, and query its declaration") finds the generator's assumptions (e.g. `class_owner_types`'
single-parent-owner model, or the clang frontend's handling of the actual `ifcparse` overload set at
full scale — it was only ever pointed at `file.h`+`express.h` per the CMake `DEPENDS` list, not the
full header set `_discover_headers` would find) don't hold up past this small header subset, fall
back to hand-written `node-addon-api` glue for the primitives Phase 1 needs and revisit generation
later once the shape is well-understood. **Do not commit Phase 1's schedule to the generated path
before that spike returns a result** — this is a real open question with a strong lean, not a
settled fact.

## 3. `src/ifcviewer-web/` — NOT a reusable data-access binding (correcting the task brief's framing)

Read `CMakeLists.txt` in full: this target **does not link `ifcparse`, `ifcgeom`, OpenCASCADE, or
CGAL at all**. It builds `IfcViewerCore` (from `src/ifcviewer/`, added `EXCLUDE_FROM_ALL` and
explicitly documented as "the Qt-free, OpenCASCADE-free static lib carved out of `src/ifcviewer`")
plus WebGPU (`wgpu_native`, no-op under Emscripten per a comment) rendering code
(`WebViewportHost`/`WebFederation`). It consumes a **pre-processed binary "sidecar" format**
(`.ifcview`, produced offline by `make_sample.py`) via `emscripten_fetch`/`Blob.slice` byte-range
streaming — it never parses raw IFC/STEP text in the browser at all. Its JS surface
(`-sEXPORTED_FUNCTIONS=[...]` in `CMakeLists.txt`, ~45 functions) is plain Emscripten `ccall`-style
exported C functions (`_ifcv_get_camera_c`, `_ifcv_set_selection_outline_c`, etc.) — **not embind**,
contrary to my task brief's assumption; there is no `EMSCRIPTEN_BINDINGS` block anywhere in this
target. Every exported function is camera/selection/visibility/federation-bookkeeping —
viewer-application-specific, not IFC-data-access-general.

**Verdict**: not reusable as a foundation for a general "load an IFC file, query its entity graph"
binding, Node or browser. What IS reusable, narrowly, when Phase B1 (browser) eventually happens:
the CMake pattern of a **separate root CMakeLists gated on `EMSCRIPTEN`**, deliberately isolated
from the Qt/OCC/CGAL-heavy desktop build (`ifcviewer-web/CMakeLists.txt`'s own header comment
explains this choice) — that isolation principle is worth copying for a future embind-based data
binding, but none of the actual exported-function surface or the sidecar-format approach transfers.

## 4. `pyodide/` — Python-in-browser via Pyodide, unaffected by and irrelevant to the Node N-API decision

`pyodide/README.md` describes building the **actual `ifcopenshell-python` wheel** (same SWIG-based
codebase, same `ifcopenshell_wrapper` extension) for `pyodide build`, i.e. an entire CPython
interpreter plus the existing Python bindings compiled to WASM and run inside the Pyodide runtime in
a browser tab. This ships the real Python API surface unchanged — no TypeScript translation
involved, no relevance to designing IfcOpenShell-TS's binding. It's useful only as a data point that
a **browser data-access path already exists today**, just via "run Python in the browser," not via
a native JS API — meaning IfcOpenShell-TS's eventual browser phase (B1) is additive (a faster,
more JS-idiomatic option), not filling a total gap. Three existing CI workflows
(`build_pyodide.yml`, `ci-pyodide-wasm-release.yml`, `publish-pyodide-demo-app.yml`) show
established Emscripten/WASM build automation patterns worth referencing structurally for a
future Phase B1 CI job, though none of their content is reusable for Node N-API packaging.

## 5. Other prior art / references

Grepped the full repo for `embind`, `wasm-bindgen`, `napi`, `node-addon`, `N-API`, `web-ifc`:
**zero hits** outside this planning tree itself. This project (`web-ifc`, a well-known third-party
WASM IFC engine) is not referenced, discussed, or compared against anywhere in-repo — there's no
prior internal position on it to reconcile with.

## 6. Summary for `10-architecture.md` §3 / `30-open-questions.md` item 1

| Question | Finding |
|---|---|
| Is `wrappergen`'s C API already a clean, language-agnostic ABI? | **Yes** — verified by full read of `emit_c_api_header`/`emit_c_api_implementation`. No Python types leak into it. |
| Is the Python-specific part cleanly separable? | **Yes** — confined to two emitter functions (`emit_python_extension`, `emit_python_facade`) that are structurally clones of what N-API/TS equivalents would need to be. |
| Does it already cover the primitives Phase 1 needs? | **Partially.** Full schema-introspection surface: yes. Polymorphic attribute value get/set (the single largest primitive task per `research/01`): no — needs a new "variant" adapter, real but scoped work. Buffer-based file open, `get_info_cpp` bulk serializer: no, not yet exposed. |
| Is it mature/battle-tested? | **No** — 5 commits, ~5 months old, explicitly "experimental," opt-in CMake flag, zero other in-repo references, no test suite found. |
| Recommendation | **Extend it** (add the variant adapter + `emit_napi_extension`/`emit_typescript_facade`), gated on a short timeboxed spike proving the generator holds up past its current `file.h`+`express.h` scope; fall back to hand-written `node-addon-api` glue if the spike says otherwise. Do not treat generation as guaranteed before that spike returns. |
| Is `ifcviewer-web`'s Emscripten build reusable for the binding surface? | **No** — it doesn't link `ifcparse`/`ifcgeom` at all, is viewer-specific (camera/selection/sidecar-format), and uses plain exported C functions, not embind. Only its CMake isolation pattern (separate `EMSCRIPTEN`-gated root) is worth reusing, and only later, for Phase B1. |
