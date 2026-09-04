# IfcOpenShell-TS — Open Questions & Decisions Needed

Status: draft, pre-`plan-eng-review`. Originally the consolidated list of every decision flagged
across `10-architecture.md`, `20-roadmap.md`, `40-testing-strategy.md`, and
`50-repo-and-tooling.md` as "not decided here." On 2026-09-03 the project owner resolved the
highest-leverage items (§A) and this document's author resolved the remaining low-stakes library/
pattern choices (§B), each with rationale recorded in place. §C is what's still genuinely open —
mostly technical unknowns that need a spike or code, not a desk decision, plus post-v1 items
flagged so they aren't forgotten. Distinct from `00-overview.md` §2, which is the authoritative
list of fixed constraints — this document is the reasoning trail behind those and behind §B/§C.

Nothing here should be treated as unchallengeable — `plan-eng-review` (and, where relevant,
`plan-design-review`/`plan-devex-review`) can still revisit any of it, including §A. But §A and §B
are the project's working assumptions going in, not blanks to fill.

## A. Resolved by the project owner, 2026-09-03

1. **N-API binding approach.** Extend `src/wrappergen/` (`research/04-wasm-js-infra.md`'s finding:
   its C-API emitter is already a clean, language-agnostic ABI; an N-API extension emitter + TS
   facade emitter would be structurally identical siblings to the Python emitters it already has),
   gated on a timeboxed (1-2 week) validation spike before Phase 1's schedule depends on it;
   hand-written `node-addon-api` glue is the explicit, pre-agreed fallback if the spike finds a
   fundamental mismatch. See `10-architecture.md` §3, `50-repo-and-tooling.md` §3.
4. **Dynamic attribute access idiom.** A `Proxy` over the primitive get/set surface (near-verbatim
   port of `entity_instance_mixin.__getattr__`/`__setattr__`'s branching) plus a schema-driven
   generated per-schema `.d.ts` type overlay, decoupled from the runtime. Full design in
   `10-architecture.md` §6, with the reasoning against the other two options (generated typed
   classes; explicit-methods-only) recorded there.
8. **API dispatch style.** Typed function calls only — `import { createEntity } from
   "ifcopenshell/api/root"` — no string-dispatch `run()` compatibility shim. Matches the modern,
   already-recommended Python pattern (the string-dispatch form is itself deprecated in Python).
   See `20-roadmap.md` Phase 6.
12. **npm package name.** Bare `ifcopenshell`, matching the PyPI name. Confirmed unclaimed on the
    npm registry 2026-09-03 — **re-check immediately before Phase 0's publishing setup**, since
    availability can change between now and then. See `50-repo-and-tooling.md` §8.

## B. Resolved this session (low-stakes, documented for the record, not re-litigated)

5. **Matrix/vector library: `gl-matrix`.** De facto standard, zero-dependency, typed, small
   (~30kb), and its functional/in-place-`Float32Array` API style matches what `placement.py`'s
   numpy usage is actually doing. See `20-roadmap.md` Phase 4.
6. **2D polygon library: `polygon-clipping`.** Checked the actual `shapely` usage first rather than
   guessing: `util/shape.py` has exactly 3 call sites, all `shapely.ops.unary_union` (polygon
   merging) — `util/shape_builder.py` has **zero** shapely usage despite the name (confirmed
   kernel-free and shapely-free in `research/03`). This is narrow enough that a focused polygon
   union/boolean library covers it; no need for a heavier GIS-oriented library like `turf.js`. See
   `20-roadmap.md` Phase 4.
7. **Parser strategy for `selector.py`'s three grammars and `cost.py`'s formula language:
   hand-rolled recursive-descent**, no parser-generator dependency, for both — neither grammar's
   complexity (per `research/03`) warrants pulling in a parser-combinator/generator library for two
   call sites. See `20-roadmap.md` Phase 4/5.
9. **`owner.settings` monkeypatch replacement: a mutable singleton config object**
   (`ownerSettings.getUser = (ifc) => ...`), swappable per-test the same way `bootstrap.py` does
   today — TS/ESM doesn't allow rebinding an `export function`, so this is the closest equivalent.
   Established as the **general pattern** for every Python global-mutable-config module this
   project ports (also covers `settings.py`'s two booleans), not just `owner.settings`. See
   `40-testing-strategy.md` §5.
10. **Pre/post-listener hook typing: `Map<string, Set<Listener>>`**, mirroring Python's
    dict-of-list registries with `Set` replacing `list` — an intentional, minor behavior change
    (idempotent re-registration vs. Python's allow-duplicates list), noted rather than silently
    diverging. See `20-roadmap.md` Phase 6.
11. **Version sync vs. independent semver: sync to root `VERSION` for the 0.x line**, with the
    option to break out to independent semver at a stable 1.0. See `50-repo-and-tooling.md` §7.

## C. Still genuinely open — needs a spike/code, or is post-v1

These aren't desk decisions — they need a short technical spike, real code, or don't block anything
yet. Grouped by what they block.

### Blocking Phase 0/1 (native-addon build)

- **"Fresh wrapper per access" question** (`research/01` §1): does the chosen N-API approach hand
  back a stable JS object per C++ pointer, or a new one per property access? Determines whether the
  TS core layer needs `file_mixin`'s identity-keyed shared-state registry trick or can be simpler.
  Resolve via a short spike at the start of Phase 1, not by assumption — this is exactly the kind
  of thing the item-1 validation spike should answer as a side effect. **Higher-stakes than
  originally scoped** (flagged by `plan-eng-review`'s outside-voice pass): `10-architecture.md` §6's
  entire attribute-access design (the Proxy, its equality semantics, the differential
  cache-correctness test) assumes stable per-pointer identity and needs rework if the spike finds
  otherwise — this blocks starting Phase 2 in earnest, not just an implementation detail to settle
  along the way.
- Prebuilt-binary distribution mechanism for the addon (`prebuildify`/`node-gyp-build` vs. a
  postinstall fetch script mirroring the Python side's S3-zip download) — `50-repo-and-tooling.md`
  §3. Low-stakes, can decide during Phase 0 itself rather than needing a pre-decision.

### Post-v1 (Phase G1/B1), flagged now so they aren't forgotten, not blocking anything today

- Geometry kernel choice for the Node addon (OpenCASCADE vs. CGAL vs. manifold) and whether it's a
  compile-time choice (unlike Python's runtime `geometry_library` string parameter, since a Node
  addon likely ships one kernel per build) — `20-roadmap.md` Phase G1.
- Threading strategy for `iterator`'s `num_threads` — real OS threads are straightforwardly
  available in Node (unlike the eventual browser target's Web Worker/SharedArrayBuffer/COOP-COEP
  constraints) — likely low-friction for the Node addon, but confirm during Phase G1 rather than
  assuming.
- Whether `stream.py`/`sql.py`'s alternate-backend designs (lazy SPF line-indexing; pre-baked-SQLite
  querying) are worth a TS equivalent at all, given the Node addon's primary in-memory binding may
  make their original motivation (conserving memory / avoiding a full parse) less pressing
  server-side than it was for `stream.py`'s original desktop-tool use case — or whether `sql.py`'s
  pattern becomes more relevant again once Phase B1 (browser) needs a large-model strategy
  (`sql.js`/IndexedDB, per `20-roadmap.md` Phase B1's note). Not a v1 concern either way
  (`00-overview.md` §6).
- Whether the WASM/browser binding (Phase B1) reuses `ifcviewer-web`'s existing Emscripten
  build/toolchain setup at all. **Resolved to "narrowly, not substantively"**:
  `research/04-wasm-js-infra.md` §3 found `ifcviewer-web` doesn't link `ifcparse`/`ifcgeom` at all
  (it's a pure WebGPU viewer over a pre-baked sidecar format, plain `ccall`-exported C functions,
  not embind) — only its CMake pattern of a separate `EMSCRIPTEN`-gated root, isolated from the
  Qt/OCC/CGAL desktop build, is worth copying for Phase B1's actual data-access binding. No further
  action needed on this item before Phase B1 starts.
- Phase B1's browser/WASM npm package naming (a `browser`/`wasm` export condition on the same
  `ifcopenshell` package vs. a genuinely separate package name) — noted in
  `50-repo-and-tooling.md` §8, deferred to Phase B1 planning.
