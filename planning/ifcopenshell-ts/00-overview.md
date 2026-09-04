# IfcOpenShell-TS — Project Charter

Status: draft, pre-`plan-eng-review`. Written 2026-09-03 against `v0.9.0` (commit `2c1d445d5`).

## 1. What we're building

**IfcOpenShell-TS**: a TypeScript package that translates `ifcopenshell-python`
(`src/ifcopenshell-python/ifcopenshell/`) to TypeScript as closely as the two languages allow —
same module boundaries, same class/function names (camelCased), same behavior, same test coverage
shape — running against a low-level binding onto the existing C++ core (`src/ifcparse`,
`src/ifcgeom`, ...), the same way `ifcopenshell-python` runs against the SWIG-generated
`ifcopenshell_wrapper` extension.

This is **not** a from-scratch reimplementation of IFC parsing/authoring logic, and **not** a
rewrite of the C++ core. It is a new binding layer (native Node addon, see §3) plus a new
"mixin" layer of TypeScript that mirrors `file.py` / `entity_instance.py` / `api/*` / `util/*`
line-of-reasoning for line-of-reasoning, adapted to TS idiom.

## 2. Decisions already made

These were decided by the project owner on 2026-09-03 and are treated as fixed constraints for
all documents in this `planning/ifcopenshell-ts/` tree, not open questions:

| Decision | Answer | Rationale given |
|---|---|---|
| Target runtime for v1 | **Node.js, native addon** (not WASM/browser) | Faster and simpler than a WASM/embind path; browser support is an explicit later phase, not a v1 constraint. |
| v1 completeness bar | **Full parity** of the non-geometry Python API surface (`ifcopenshell` core + all of `ifcopenshell.api` + all of `ifcopenshell.util`) is the only acceptable "v1 done" | No partial-parity release; phases within v1 are about sequencing the work, not shipping a permanently-partial product. |
| Geometry (triangulated mesh) access | **Deferred to a post-v1 phase**, decoupled from the data-layer port | Compiling/binding a geometry kernel is a large, largely independent effort (kernel choice, binary size, threading) that would otherwise block or distort the data-layer work. |
| Dynamic attribute access (`wall.Name`) | **Proxy over the primitive get/set surface, plus a generated per-schema `.d.ts` type overlay** — see `10-architecture.md` §6 | Reproduces Python's zero-per-class-code ergonomics without a generated-class explosion (3 schema versions × ~800 classes); types come free from a codegen step, not hand-maintained. |
| N-API binding approach | **Timeboxed spike (1-2 weeks) extending `src/wrappergen/`** before committing; hand-written `node-addon-api` glue is the explicit fallback if the spike fails | De-risks betting Phase 1's schedule on a 5-month-old experimental tool, while capturing the upside (auto-synced binding surface) if it holds up — see `research/04-wasm-js-infra.md` and `10-architecture.md` §3. |
| `ifcopenshell.api` call style | **Typed function calls only** (no string-dispatch `run()` compatibility shim) | Matches the modern, recommended Python pattern — the string-dispatch `run()` is itself deprecated in Python. Best TS type safety/tree-shaking; no extra dispatch-table surface to build or maintain. |
| npm package name | **`ifcopenshell`** (bare, unscoped) | Matches the PyPI package name exactly; most discoverable. Availability confirmed against the npm registry on 2026-09-03 (name unclaimed as of this writing — re-verify immediately before Phase 0 publishing setup, since availability can change). |
| Error-propagation contract (`plan-eng-review`, 2026-09-03) | **`wrappergen`'s last-error-string pattern, translated to a thrown JS `Error` at the N-API boundary** | Reuses the error convention already implemented in the C API the Phase 1 spike is testing, rather than inventing a second one; keeps the TS mixin layer's ported code exception-based like Python, not restructured around explicit Result-checking. See `10-architecture.md` §2. |
| Attribute-access hot path (`plan-eng-review`, 2026-09-03) | **Cache attribute name→index/category metadata TS-side per schema version**, not a native call per access | N-API call overhead is real and `__getattr__`/`__setattr__`'s equivalent runs on every single attribute access — a common hot loop (`util/element.py`-style traversal over thousands of entities). See `10-architecture.md` §6. |
| Native-layer robustness (`plan-eng-review`, 2026-09-03) | **ASAN/UBSan CI builds + fuzz testing of the file-open/parse primitives**, both gating Phase 1's close | A native memory bug segfaults the whole Node process rather than throwing catchably; this is a Node-only (server-side) library plausibly parsing user-uploaded `.ifc` files, an untrusted-input attack surface. See `40-testing-strategy.md` §7. |
| Delivery sequencing (`plan-eng-review`, 2026-09-03) | **Alpha checkpoint (`ifcopenshell@0.x.y-alpha` published to npm) inserted after Phase 2**, before `util`/`api` porting starts | Validates the riskiest bet (the binding layer) against real usage as early as possible, instead of the original single Phase-10 finish line. See `20-roadmap.md` Phase 2.5. |

Everything else in this document tree is either a research finding or a recommendation still
open for `plan-eng-review` / `plan-design-review` / `plan-devex-review` to challenge.

## 3. The single biggest architectural consequence of "Node-first, native addon"

`ifcopenshell-python`'s low-level binding is SWIG (C++ → CPython extension). IfcOpenShell-TS's
low-level binding will be a **Node native addon** (N-API, via `node-addon-api` or generated glue —
see `10-architecture.md` for the candidate approaches, including reusing/extending
`src/wrappergen/`, the repo's existing clang-based C++→C-API generator).

This is a *different* low-level technology from the WASM/Emscripten build that already exists for
`src/ifcviewer-web/` — that build targets the browser and is not reusable as-is for a Node addon.
Its CMake/toolchain patterns and its "what subset of the C++ core gets exposed" precedent are
still useful reference points; see `research/04-wasm-js-infra.md` for the full assessment, and
`10-architecture.md` for how it informs (without dictating) the Node addon design, plus what
changes when browser support becomes a later-phase goal.

## 4. Where this lives in the monorepo

Proposed: `src/ifcopenshell-ts/`, sibling to `src/ifcopenshell-python/`, following the same
license (LGPL-3.0-or-later per `AGENTS.md`) and the same "one package per language binding"
convention already used for `ifcblender`, `ifcmax`, `ifcmcp`, etc. See `50-repo-and-tooling.md`
for the proposed internal package layout, native-addon build wiring, and CI integration.

## 5. Document index

- `research/01-python-core-and-lowlevel.md` — core `ifcopenshell` module + SWIG binding surface.
- `research/02-python-api-inventory.md` — full `ifcopenshell.api` inventory (369 functions / 34 subpackages).
- `research/03-python-util-inventory.md` — full `ifcopenshell.util` inventory (28 modules) + the `selector.py` query DSL.
- `research/04-wasm-js-infra.md` — existing WASM/JS/codegen infrastructure in-repo and its reusability.
- `research/05-testing-docs-packaging-conventions.md` — testing, docs, and CI/packaging conventions to mirror.
- `10-architecture.md` — low-level binding design, layering, and the `file_mixin`/`entity_instance_mixin` port strategy.
- `20-roadmap.md` — phased work breakdown to full v1 parity.
- `30-open-questions.md` — decisions still needed before/through `plan-eng-review`.
- `40-testing-strategy.md` — TS test suite design mirroring `research/05`.
- `50-repo-and-tooling.md` — package layout, build, lint, CI, versioning, publishing.

## 6. Non-goals for v1 (explicitly out of scope, revisit later)

- Geometry/mesh extraction (`ifcopenshell.geom`) — post-v1 phase (§2).
- Browser/WASM target — post-v1 phase (§2); `ifcviewer-web`'s Emscripten build is unaffected by
  and unblocked by this project.
- `ifcopenshell.geom.app`/`code_editor_pane.py` (desktop Qt GUI) — no GUI to port, ever.
- RocksDB-backed `file` storage (`rocksdb_file_storage`, `RocksDbSerializer`) — native-filesystem-
  and native-database-specific, no clear Node-addon value over just using the primary in-memory
  binding; revisit only if a specific large-model use case demands it.
- `ifcopenshell.express` schema/rule codegen tooling — this generates the *Python* schema classes
  and EXPRESS rule modules at build time; the TS binding consumes the C++ core's compiled-in
  schemas directly through the native addon's schema-introspection surface (see
  `research/01-python-core-and-lowlevel.md` §3.2), so this tooling itself is not a porting target.
- `ifcopenshell.draw` (SVG/2D drawing generation) — downstream of the geometry kernel; deferred
  alongside geometry.
- `ifcopenshell.stream` / `ifcopenshell.sql` alternate backends — see `10-architecture.md` for
  whether/when these get a TS equivalent; not required for v1 parity of the *primary* in-memory
  `file` object, which is the thing "full parity" is measured against.
