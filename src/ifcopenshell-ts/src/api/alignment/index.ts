// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.alignment` (src/ifcopenshell-python's
// `ifcopenshell/api/alignment/` package) -- a brand-new, LARGE module (59 real files,
// confirmed by `ls ifcopenshell/api/alignment/*.py | grep -v __init__ | wc -l` --
// correcting this header's own earlier "~50 real files" approximation from chunks
// 1-6, no TS port of any kind before chunk 1). Real Python's own module docstring:
// "Manages alignment layout (semantic definition) and alignment geometry (geometric
// definition)" for IFC4X3-era road/rail alignments -- horizontal/vertical/cant
// layouts, stationing, segment-by-segment or PI-method construction, and their
// derived `IfcCompositeCurve`/`IfcGradientCurve`/`IfcSegmentedReferenceCurve`
// geometric representations.
//
// **THIS WAS CHUNK 8 OF 8, THE FINAL CHUNK** (matching `api.geometry`'s own 11+-PR
// precedent for a module of this size) -- this module is now FUNCTIONALLY COMPLETE FOR
// THIS PORT'S SCOPE: 56 of 59 real files (~5522 lines) are landed, with the remaining 3
// permanently excluded (see the dedicated section near the end of this comment). None of
// these is registered with `ifcopenshell.api.run`/an internal
// `Usecase` class (confirmed: real Python's own `__init__.py` imports every one of
// them as a plain function, no `Usecase`/`api.run` wiring anywhere in this module at
// all) -- all exported here as plain functions, matching real Python's own
// plain-function shape exactly.
//
// --- Landed in chunk 1 (17 files, ~680 lines) ---
//
// `getHorizontalLayout`/`getVerticalLayout`/`getCantLayout` (layout-by-class lookup),
// `getLayout` (segment -> its layout), `getChildAlignments`/`getParentAlignment`
// (alignment aggregation tree), `getAlignment` (layout -> its alignment),
// `getAlignmentLayouts`/`getLayoutSegments` (nested-children collection),
// `getStationingNest` (the stationing-referent `IfcRelNests`),
// `hasZeroLengthSegment`/`nameSegments` (segment-nest queries/mutations),
// `getAlignmentLayoutNest`/`getAlignmentSegmentNest` (nest-relationship lookup),
// `getAxisSubcontext` (Model/Axis/MODEL_VIEW subcontext, reusing already-landed
// `util.representation.getContext`/`api.context.addContext`), `getCurve`/
// `getBasisCurve` (geometric-representation lookup, reusing already-landed
// `util.representation.getRepresentationsIter`). No unported DEPENDENCY of any kind
// for any of these 17 -- confirmed by reading every real file's own imports AND its
// full body (not just the top-level import list) -- and none of the 17 calls into any
// OTHER, still-unported sibling file in this same module.
//
// Several real, verbatim-preserved Python-source quirks were found and disclosed in
// the relevant files' own header comments rather than silently "fixed": a genuine
// unmatched-quote bug in `has_zero_length_segment`'s/`name_segments`'s shared
// `TypeError` message format (`./hasZeroLengthSegment.ts`, `./nameSegments.ts`);
// `has_zero_length_segment`'s horizontal/vertical/cant branch never `break`s its
// `IsNestedBy` loop, so the LAST matching rel silently wins and a non-matching later
// rel never resets an earlier match (`./hasZeroLengthSegment.ts`); `get_basis_curve`'s
// recursive parent-alignment fallback reads `Decomposes[0].RelatingObject`
// unconditionally, with no `is_a("IfcAlignment")` filter (`./getBasisCurve.ts`);
// `get_stationing_nest`'s own `file` parameter is entirely unused by its body
// (`./getStationingNest.ts`).
//
// --- Landed in chunk 2 (5 more files, ~311 lines) ---
//
// `getLayoutCurve` (layout -> its representation curve, unwrapping
// `IfcGradientCurve`/`IfcSegmentedReferenceCurve`), `getMappedSegments`/
// `getCurveSegment` (`IfcAlignmentSegment` -> its `IfcCurveSegment`(s), sharing the
// module-private `_getCurveSegmentCount` helper, exported from `./getMappedSegments.ts`
// and imported directly by `./getCurveSegment.ts` -- matching real Python's own
// single-source-of-truth `_get_curve_segment_count` import), `getAlignmentStartStation`
// (mutually recursive with chunk 1's `getParentAlignment`), `distanceAlongFromStation`
// (station-equation-aware distance-along computation). Dependency order ported:
// `getLayoutCurve` (depends only on chunk 1's `getAlignment`/`getCurve`) first, then
// `getMappedSegments` (depends on `getLayoutCurve`), then `getCurveSegment` (depends on
// chunk 1's `getAlignmentSegmentNest`, `getLayoutCurve`, and `getMappedSegments`'s own
// `_getCurveSegmentCount`), then `getAlignmentStartStation` (chunk 1's
// `getParentAlignment` plus already-landed `util.element.getComponents`/`getPset`),
// then `distanceAlongFromStation` (chunk 1's `getStationingNest`, this chunk's own
// `getAlignmentStartStation`, and `util.element.getPset`). No unported DEPENDENCY of
// any kind for any of these 5, beyond mutual/recursive self-calls -- confirmed by
// reading every real file's own imports AND its full body.
//
// 3 more real, verbatim-preserved quirks disclosed in this chunk's own files: a
// genuine OFF-BY-ONE bug in `get_mapped_segments`'s own Helmert-curve (2-curve-segment)
// return path -- the second returned `IfcCurveSegment` is really the FIRST curve
// segment of the NEXT `IfcAlignmentSegment`, or an out-of-range access for a trailing
// Helmert segment (`./getMappedSegments.ts`); `get_alignment_start_station`'s own
// docstring ("otherwise returns 0.0") is CONTRADICTED by its own loop body, which
// unconditionally overwrites the `0.0` default with `None` for any `IfcReferent`
// component lacking a `Pset_Stationing.Station` value, even when a LATER referent
// never supplies one either (`./getAlignmentStartStation.ts`); `distance_along_from
// _station`'s own `station - start_station` would crash on that same `None` in real
// Python, but this port's `-` operator silently coerces it to `station` instead, a
// real, disclosed TS-vs-Python divergence reachable via a parent alignment's own
// stationless referent (`./distanceAlongFromStation.ts`).
//
// A useful, EMPIRICALLY-confirmed technique this chunk's own tests establish (see
// `./getAlignmentStartStation.test.ts`'s own header comment for the full writeup):
// assigning a raw JS `number` directly to an already-real entity's OWN SELECT-typed
// attribute (e.g. `IfcPointByDistanceExpression.DistanceAlong`,
// `IfcPropertySingleValue.NominalValue`) at construction time or via `.set()` works
// fine end to end -- a DIFFERENT code path from, and NOT blocked by,
// `TODOS.md`'s `EntityInstance.setByIndex`/`IfcFile.createEntity` entry (which is
// specifically about constructing a STANDALONE simple/defined-type instance BY NAME,
// e.g. `file.createEntity("IfcLengthMeasure", 100)`). This let this chunk's own
// `getAlignmentStartStation.test.ts`/`distanceAlongFromStation.test.ts` port real
// Python's own numeric test assertions (including the full IFC Alignment Geometry
// Implementation Guide 9.2.6 worked example) with real, populated fixtures, unlike
// chunk 1's own `hasZeroLengthSegment.test.ts` (which hits the actually-blocked
// standalone-instance path and stayed disclosed-uncoverable for that one branch).
//
// --- Schema-availability constraint: this whole module is effectively IFC4X3-only ---
//
// `IfcAlignment`/`IfcAlignmentHorizontal`/`IfcAlignmentVertical`/`IfcAlignmentCant`/
// `IfcAlignmentSegment`/`IfcReferent` are all confirmed, by reading all 3 generated
// `.d.ts`s directly, to exist ONLY on `ifc4x3.d.ts` -- none of these interfaces exist
// on `ifc2x3.d.ts`/`ifc4.d.ts` at all (alignment is a genuine IFC4X3-era schema
// addition, not a TS-port gap). This matches the real Python test suite's own
// `IFC4X3_AVAILABLE`-gated tests for this whole module. Every test ported for this
// chunk is gated with `describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))`
// (this project's established convention for a single-schema-gated file -- NOT
// `describe.each(AVAILABLE_SCHEMAS.filter(...))`, which registers ZERO test blocks
// -- a vitest collection ERROR, not a graceful skip -- when the filtered array is
// empty on CI's own IFC4-only native build, per PR #125's own real regression).
//
// --- Real Python test fixtures could NOT be reused as-is ---
//
// Every real Python test file for these getters (`test_get_alignment.py`,
// `test_get_basis_curve.py`, `test_get_curve.py`, `test_has_zero_length_segment.py`,
// `test_name_segments.py`) builds its fixture via `ifcopenshell.api.alignment.create`/
// `.create_by_pi_method` -- neither of which is in THIS chunk's scope (both are
// larger, later chunks with their own geometry-generation dependencies). This chunk's
// own tests therefore build minimal, hand-rolled fixtures directly via
// `file.createEntity(...)`/`IfcRelNests`/`IfcRelAggregates`, reproducing just enough
// of each real shape to exercise each ported function's real assertions -- matching
// this project's established "can't reuse the real fixture, build an equivalent one
// instead" precedent (e.g. `api.cogo`'s own `assignSurveyPoint.test.ts`). 12 of the 17
// files (`getHorizontalLayout`/`getVerticalLayout`/`getCantLayout`/`getLayout`/
// `getChildAlignments`/`getParentAlignment`/`getAlignmentLayouts`/`getLayoutSegments`/
// `getStationingNest`/`getAlignmentLayoutNest`/`getAlignmentSegmentNest`/
// `getAxisSubcontext`) have no dedicated real Python test file at all -- original
// test coverage was written for these, following the same fixture pattern.
//
// --- Real Python test fixtures for chunk 2 also could NOT be reused as-is ---
//
// Real Python has a dedicated test file for only 1 of this chunk's 5
// (`test_get_layout_curve.py`; `test_distance_along_from_station.py` covers
// `distance_along_from_station` only) -- both build their fixture via
// `ifcopenshell.api.alignment.create`/`.create_by_pi_method`/`.add_stationing_referent`,
// none of which are in this chunk's scope. `getLayoutCurve.test.ts` substitutes a
// hand-built `IfcProductDefinitionShape` shape (matching `getCurve.test.ts`'s own
// chunk 1 precedent); `distanceAlongFromStation.test.ts` substitutes hand-built
// `IfcReferent`s (see this file's own header comment above for the raw-SELECT-value
// technique that makes this possible with REAL, non-placeholder numeric values) --
// both port every one of their respective real test's own numeric assertions
// verbatim. `getMappedSegments`/`getCurveSegment`/`getAlignmentStartStation` have no
// dedicated real Python test file at all (`getAlignmentStartStation` is only
// exercised indirectly by tests outside this chunk's scope) -- original test coverage
// was written for these, following the same fixture pattern.
//
// --- Landed in chunk 3 (5 more files, ~281 lines) ---
//
// 3 module-private (`_`-prefixed, not re-exported from this barrel -- see
// `./_sortNest.ts`'s own header comment for the convention) helpers: `_sortNest`
// (in-place `RelatedObjects` sort by an arbitrary key function, generic over a
// `number`/`string` key type), `_getKeyPointTag` (station-and-label text builder,
// reusing already-landed `util.alignment.stationAsString`), `_getCantSegment`
// (horizontal-segment -> corresponding cant-layout segment, reusing this module's own
// already-landed `getAlignment`) -- none has any unported dependency. Plus 2 public
// functions: `updateFallbackPosition` (`IfcLinearPlacement.CartesianPosition`
// fallback-position computation, reusing already-landed `util.placement
// .getLocalPlacement`) and `updateEndPoint` (`IfcGradientCurve`/
// `IfcSegmentedReferenceCurve.EndPoint` computation, reusing this module's own
// already-landed `hasZeroLengthSegment` and already-landed `util.placement
// .getAxis2placement`).
//
// **One genuinely NEW blocker found by reading `update_end_point.py`'s own full body
// (not just its top-level imports), disclosed with its own dedicated `TODOS.md`
// entry**: it calls `ifcopenshell.api.alignment.add_zero_length_segment` whenever
// `has_zero_length_segment(curve)` is `false` -- `add_zero_length_segment` is NOT
// ported in this chunk (still in the "still pending" list below), and is itself
// transitively blocked on the unported `_get_segment_endpoint` (the SAME real
// geometry-kernel gap this file's own header comment already discloses) for every
// realistic, non-empty case. Ported every other real behavior of `update_end_point`
// correctly and completely, and throws a clear, disclosed error ONLY at the exact
// point, and only when, the real `add_zero_length_segment` call would actually be
// needed -- never proactively (`updateEndPoint.ts`'s own header comment has the full
// writeup). `updateFallbackPosition` has NO new blocker of its own, but its real-world
// usage almost always reaches the SAME, already-tracked (chunk 1's own `util
// /placement.ts` header comment / `TODOS.md`'s very first entry)
// `getAxis2placement`-needs-`ifcopenshell.geom` gap, since a real alignment
// `IfcLinearPlacement.RelativePlacement.Location` is normally an
// `IfcPointByDistanceExpression`, not a plain `IfcCartesianPoint` --
// `updateFallbackPosition.ts`'s own header comment discloses this without adding a
// new, redundant `TODOS.md` entry for what is the identical, already-tracked gap.
//
// Real Python has no dedicated test file for any of this chunk's 5 files (confirmed
// by reading the whole real test directory) except `test_update_fallback_position.py`,
// whose own fixture builds via the unported `create_by_pi_method`/`get_basis_curve`
// and ends up exercising the disclosed-blocked `IfcPointByDistanceExpression` path
// above -- not reusable. `updateFallbackPosition.test.ts` instead builds an
// `IfcAxis2PlacementLinear` whose `Location` is a real, schema-valid
// `IfcCartesianPoint` (exercising the exact same `a2p` logic with real, hand-verified
// rotation/translation values); `updateEndPoint.test.ts` builds a real zero-length
// `IfcCurveSegment` directly (`SegmentStart`/`SegmentLength` set to a raw `0.0` at
// construction time, reusing chunk 2's own empirically-confirmed
// raw-SELECT-value-assignment technique) rather than going through the blocked
// `addZeroLengthSegment` path; `_sortNest`/`_getKeyPointTag`/`_getCantSegment` all get
// original coverage following this module's established fixture pattern. All 5 files
// use `describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))`, matching chunks 1/2's
// own established convention.
//
// --- Landed in chunk 4 (5 more files, ~897 lines) ---
//
// `_getSegmentStartPointLabel` (module-private -- see its own header comment for why
// it's NOT re-exported here, unlike its sibling public function below) plus the
// genuinely PUBLIC `registerReferentNameCallback` (real Python's own
// `register_referent_name_callback`, confirmed present in real Python's own
// `__init__.py` `__all__` -- unlike every other `_`-prefixed helper landed so far,
// this one IS re-exported from this barrel); `addPositioningReferent`/
// `addStationingReferent` (create an `IfcReferent` marking a product's/a stationing
// point's position along an alignment); `updateKeyPointReferents` (creates
// `IfcReferent` key-point markers, e.g. "P.C."/"P.T.", for every real segment
// transition in a layout); `updateAlignmentParameterSegmentTags` (the referent-free
// sibling of `updateKeyPointReferents` -- sets `StartTag`/`EndTag` string attributes
// directly on each segment's own `DesignParameters`, no `IfcReferent`/`IfcRelNests`
// created at all). Dependency order ported: `_getSegmentStartPointLabel` first (zero
// dependencies of its own), then `addPositioningReferent` (chunk 1's `getCurve`,
// chunk 3's `updateFallbackPosition`), then `addStationingReferent` (chunk 1's
// `getBasisCurve`/`getCurve`/`getStationingNest`, chunk 3's `_sortNest`/
// `updateFallbackPosition`), then `updateKeyPointReferents` (chunk 1/2's
// `getAlignment`/`getLayoutSegments`/`hasZeroLengthSegment`/
// `getAlignmentStartStation`/`getLayoutCurve`, chunk 3's `_getKeyPointTag`/
// `_sortNest`/`updateFallbackPosition`, this chunk's own
// `_getSegmentStartPointLabel`), then `updateAlignmentParameterSegmentTags` (chunk
// 1/2's `getAlignment`/`getLayoutSegments`/`hasZeroLengthSegment`/
// `getAlignmentStartStation`, this chunk's own `_getKeyPointTag`/
// `_getSegmentStartPointLabel`). Confirmed by reading every real file's own imports
// AND full body: `update_key_point_referents.py` does NOT use
// `get_horizontal_layout` at all (only reads FROM the `layout` its own caller passes
// in); `file.get_inverse`/`file.get_total_inverses` (needed by
// `update_key_point_referents.py`'s own private `_remove_referent` helper, the
// `clear=true` code path) were verified to already exist on this port's own
// `IfcFile` (`../../file.ts`'s `getInverse`/`getTotalInverses`) -- genuinely NOT a
// new blocker, confirmed by reading `file.ts` directly rather than assumed either way.
//
// **TWO INDEPENDENT, ALREADY-DISCLOSED primitive-layer gaps -- not one -- block every
// real referent-creating code path across 3 of this chunk's 5 files**
// (`addPositioningReferent`/`addStationingReferent`/`updateKeyPointReferents`), each
// re-confirmed EMPIRICALLY against this chunk's own freshly-built native addon before
// writing any of the 3 files (see `./addPositioningReferent.ts`'s own header comment
// for the full writeup of both, and `TODOS.md`'s dedicated entry for its own
// "fourteenth consequence" update recording this chunk's specific finding):
// 1. The SAME `EntityInstance.setByIndex`/`IfcFile.createEntity`
//    standalone-simple/defined-type-instance gap tracked since PR #124, hit by
//    `IfcPointByDistanceExpression.DistanceAlong`'s own `IfcLengthMeasure`
//    construction whenever `curve` is a real, non-empty `IfcCompositeCurve`.
// 2. `api.pset.editPset`'s own SEPARATE, already-disclosed "cannot create a
//    brand-new plain-scalar property" consequence of that SAME root gate (`TODOS.md`'s
//    same entry, "fourth consequence" update, `api.pset` `edit_pset` chunk) -- hit by
//    every one of these 3 files' own `editPset(file, {pset, properties: {Station:
//    station}})` call, REGARDLESS of which placement branch was taken. This is the
//    finding that makes this chunk's situation narrower than either gap's own
//    existing write-up alone would suggest: the "fully portable, non-composite-curve
//    fallback placement" branch each of these 3 files also has is NOT independently
//    end-to-end functional in this port today either -- it reaches further (a real,
//    addressable `IfcReferent` with a real placement and an empty `Pset_Stationing`
//    already exist in the file) before throwing at gap 2 instead of gap 1. Ported all
//    3 files completely and faithfully regardless -- every line, every branch,
//    including each file's own portable `else` construction -- with no proactive
//    guard anywhere; each throws naturally at whichever of the two gaps its own
//    `curve` shape reaches first. `updateAlignmentParameterSegmentTags` has NEITHER
//    gap (confirmed: `IfcAlignmentParameterSegment.StartTag`/`EndTag` are plain
//    `string | null` attributes on an already-real entity, not SELECT-typed) and is
//    fully portable and fully tested; `updateKeyPointReferents`'s own validation,
//    zero-real-segments early return, and `clear=true` referent-REMOVAL cleanup (a
//    pure deletion path, touching no standalone-value construction at all) are ALSO
//    fully portable and fully tested, independent of the 2 gaps above.
//
// Real Python has a dedicated test file for every one of this chunk's 5 files
// (`test_referent_names.py`, `test_add_positioning_referent.py`,
// `test_add_stationing_referent.py`, `test_update_key_point_referents.py`,
// `test_update_alignment_parameter_segment_tags.py`) -- but every one of the latter
// 4's own fixtures builds via the unported `create`/`create_by_pi_method`, and (for
// `add_positioning_referent`/`add_stationing_referent`/`update_key_point_referents`)
// exercises exactly the composite-curve/`editPset` code paths this chunk's own 2 gaps
// above block, so none is reusable as-is for those 3 files -- this chunk's own tests
// for them are original, hand-rolled fixtures (matching this module's established
// precedent) with dedicated regression tests pinning the CURRENT disclosed throw at
// each gap. `updateAlignmentParameterSegmentTags.test.ts` (fully portable) DOES port
// every one of `test_update_alignment_parameter_segment_tags.py`'s own real
// assertions faithfully, including its exact numeric/string station-tag format
// (`test_exact_tag_format`) and its documented "xx" unfilled-lookup-table-entry
// regression (`test_cant_layout_boundary_tags`). `_getSegmentStartPointLabel
// .test.ts` ports every real lookup-table entry and boundary case from
// `test_referent_names.py`'s own `_hcallback`/`_vcallback` callback-override
// scenario, plus an `afterEach` resetting the module-level callback state between
// tests (see `_getSegmentStartPointLabel.ts`'s own header comment for why real
// Python's own test suite does NOT reliably do this, and why this port's test suite
// deliberately improves on that rather than copying the same order-dependent
// fragility). All 5 files use `describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))`,
// matching chunks 1-3's own established convention.
//
// --- Landed in chunk 5 (5 more files, ~1366 lines) ---
//
// `_updateZeroLengthSegmentPlacement` (mutates an already-real
// `IfcAlignmentSegment`/`IfcCurveSegment`'s plain attributes from a 4x4 placement
// matrix; reuses chunk 1's own `getLayout` and already-landed `util.unit
// .calculateUnitScale`), `_mapAlignmentVerticalSegment` (pure closed-form parabolic-
// segment math, 4 `PredefinedType`s), `_mapAlignmentCantSegment` (pure closed-form
// math for 7 cant-transition-curve types), `_mapAlignmentHorizontalSegment` (pure
// closed-form math for 9 horizontal-transition-curve types; reuses chunk 3's own
// `_getCantSegment` and `util.unit.calculateUnitScale`), `_mapAlignmentSegment` (a
// pure 3-way dispatcher over the previous 3, ported last per this chunk's own
// dependency order). None of these 5 is in real Python's own `__init__.py`
// `__all__` (every one's own leading underscore is genuine module-privacy, not just a
// naming convention) -- none is re-exported from this barrel, matching this module's
// established convention.
//
// **`_updateZeroLengthSegmentPlacement` is, like chunk 3's own
// `updateFallbackPosition`/`updateEndPoint` before their own later-landed callers
// arrived, confirmed UNREACHABLE end to end from any currently-ported public entry
// point today**: its only real caller in the whole module, `_add_segment_to_curve`,
// is itself still blocked on the unported, geometry-kernel-needing
// `_get_segment_endpoint` (below). Ported completely and tested directly with
// hand-built fixtures regardless, matching that same precedent.
//
// **`ifcopenshell.ifcopenshell_wrapper.helmert_curve_point` (used by
// `_map_alignment_horizontal_segment`'s own `HELMERTCURVE` branch) is NOT a
// geometry-kernel call, despite living in the `ifcopenshell_wrapper` module** --
// read directly from `src/ifcgeom/function_item_evaluator.cpp` (lines 8-22,
// `ifcopenshell::geom::helmert_curve_point`), it is a pure numerical integration
// (trapezoidal-rule quadrature of `cos(theta(t))`/`sin(theta(t))`, `theta(t)` built
// from the `A0`/`A1`/`A2` coefficients, each term dropped if its own coefficient is
// `0`) with no OpenCASCADE/kernel dependency at all. Reimplemented as a small, local,
// pure TS helper (`helmertTheta`/`trapezoidal`/`helmertCurvePoint`) in
// `_mapAlignmentHorizontalSegment.ts` itself, after reading the real C++ source
// directly -- see that file's own header comment for the full formula transcription,
// including the deliberate `fabs`-only-on-the-`a1`-term asymmetry (ported verbatim,
// not "symmetrized").
//
// A cross-cutting, disclosed TS-vs-Python arithmetic divergence shared by
// `_mapAlignmentVerticalSegment`/`_mapAlignmentCantSegment`/
// `_mapAlignmentHorizontalSegment`: several of these closed-form formulas divide by a
// quantity that is legitimately zero only for a genuinely DEGENERATE input (e.g. a
// "circular arc" segment with equal start/end gradient, or a cant transition with a
// rail-head distance smaller than its own cant differential). Real Python's own float
// division by `0.0` raises `ZeroDivisionError` for these; this port's `/`/`Math.sqrt`
// instead silently produce `Infinity`/`NaN`/`NaN` -- the SAME category of divergence
// `distanceAlongFromStation.ts`'s own header comment already discloses for an
// unrelated expression (chunk 2), not specially guarded against here either, since no
// real caller is expected to pass such a degenerate input.
//
// Real Python has no dedicated test file for any of this chunk's 5 files (confirmed
// by reading the whole real test directory) -- original test coverage was written
// for all 5, following this module's established fixture pattern.
// `_updateZeroLengthSegmentPlacement.test.ts` builds hand-rolled
// `IfcAlignmentSegment`/`IfcCurveSegment` fixtures per branch (matching chunk 3's
// `updateEndPoint.test.ts` precedent for an unreachable-in-production function); the
// 3 `_mapAlignment*Segment.test.ts` files compute their own expected numeric values
// independently, following the real Python source's own formulas line-by-line (a
// genuine transcription-fidelity cross-check, not a tautological re-assertion of this
// port's own arithmetic) -- `_mapAlignmentHorizontalSegment.test.ts` additionally
// cross-checks `_mapAlignmentVerticalSegment.test.ts`'s own `PARABOLICARC` closed-form
// arc length against an independent Simpson's-rule numeric integration.
// `_mapAlignmentSegment.test.ts` verifies dispatch correctness via REAL behavioral
// differences between the 3 `DesignParameters` shapes (no mocking convention exists
// in this module) and pins the disclosed unguarded `layout.RailHeadDistance` read for
// a non-cant `layout`. All 5 files use
// `describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))`, matching chunks 1-4's own
// established convention.
//
// --- Landed in chunk 6 (4 more files, ~373 lines) ---
//
// `_createGeometricRepresentation` (creates the alignment's own `IfcCompositeCurve`/
// `IfcGradientCurve`/`IfcSegmentedReferenceCurve` geometric representation and assigns
// it via already-landed `api.geometry.assignRepresentation`, reusing chunk 1's own
// `getAxisSubcontext`/`getAlignmentLayouts`/`getChildAlignments`/`getBasisCurve`),
// `createSegmentRepresentations` (PUBLIC -- confirmed present in real Python's own
// `__init__.py` `__all__`, unlike every other file in this chunk -- creates a
// per-segment "Axis"/"Segment" `IfcShapeRepresentation` for each real
// `IfcAlignmentSegment`, reusing chunk 1's `getAxisSubcontext`/`getBasisCurve`/
// `getCurve` plus already-landed `util.representation.getRepresentationsIter`/
// `util.element.getComponents`), `_createOffsetCurveRepresentation`/
// `_createPolylineRepresentation` (both create an alternate, non-segmented alignment
// representation directly from raw points/offsets, reusing `getAxisSubcontext`/
// `assignRepresentation`). Dependency order ported: `_createGeometricRepresentation`
// first (no dependency on any other file in this chunk), then the other 3 (mutually
// independent of each other). Confirmed by reading every real file's own imports AND
// full body: none of this chunk's 4 files depends on any OTHER, still-unported
// sibling file in this module.
//
// **A real, CONFIRMED Python typo bug, preserved verbatim**: `_create_geometric
// _representation.py`'s own line 145 (the `len(child_layouts) == 2` branch -- a child
// alignment with both a Vertical and a Cant layout) reads
// `file.creatIfcShapeRepresentation(...)` -- missing the "e" in "create" (every OTHER
// `IfcShapeRepresentation`-creating call site in the SAME real file spells it
// correctly, including its own `file.create_entity(type="IfcShapeRepresentation", ...)`
// alternate spelling a few lines earlier). Real Python raises a real `AttributeError`
// the moment this branch is exercised. This port has no per-class `createIfcXxx`
// dynamic-dispatch sugar at all (every other real `createIfcXxx` call in this module
// is ported as a uniform `createEntity("IfcXxx", ...)`), so the identical bug is
// reproduced by calling the SAME misspelled property name directly on the `file`
// object itself (via an index-signature cast, not `any`) -- since no such property
// exists, this throws the natural TS equivalent (`TypeError: file
// .creatIfcShapeRepresentation is not a function`) at the exact same point, after the
// same 2 curves have already been created. See `_createGeometricRepresentation.ts`'s
// own header comment for the full writeup; pinned by a dedicated regression test.
//
// **A real, CONFIRMED, genuinely REACHABLE bug in `create_segment_representations.py`,
// also preserved verbatim**: `curve`/`nested_alignment` are initialized to `None`
// before the `if`/`elif` chain, but there is no `else`/`continue` -- a representation
// matching NEITHER expected shape (e.g. an alignment with an extra "Body"
// representation) falls through to `curve.Segments` with `curve` still `None`, a real
// Python `AttributeError`. Ported the same way (an unguarded `.get("Segments")` call
// on what may be `null`); pinned by a dedicated regression test using exactly that
// "Body"-representation shape. See `createSegmentRepresentations.ts`'s own header
// comment for the full writeup.
//
// **2 genuinely NEW occurrences (for this module) of the pre-existing, already-tracked
// `entityInstance.ts` EXPRESS DERIVED-attribute gap** (`.get()` has no DERIVED-category
// fallback at all): `_createOffsetCurveRepresentation`'s own `basis_curve.Dim` read
// (`IfcCurve.Dim` -- already generically covered by `TODOS.md`'s very first entry in
// this family, `util.representation.guessType`'s own `Curve2D`/etc. branches, which
// names `IfcCurve.Dim` explicitly) and `_createPolylineRepresentation`'s own
// `points[0].Dim` read (`IfcCartesianPoint.Dim` -- already generically covered by
// `TODOS.md`'s `api.cogo.editSurveyPoint` entry, which reads the identical attribute
// on the identical class). Neither needed a NEW `TODOS.md` entry (both already
// specifically named by an existing entry, not just the same general category) --
// ported everything before each blocked line completely and faithfully (the full
// type-checking, the `offsets[i].isA()` loop for the offset-curve file), throwing only
// at the exact point each `.Dim` read would actually happen, matching
// `../cogo/editSurveyPoint.ts`'s own established "just write the real read, let the
// pre-existing gap throw naturally" precedent. Both pinned by dedicated regression
// tests, alongside real, passing tests for every fully-portable branch (the
// type-checking loops).
//
// Real Python has no dedicated test file for `_create_geometric_representation.py`/
// `_create_offset_curve_representation.py`/`_create_polyline_representation.py`
// (confirmed by reading the whole real test directory) -- original coverage written
// for all 3, following this module's established hand-rolled-fixture pattern.
// `create_segment_representations.py` similarly has no dedicated real Python test file
// (its own real callers, `create`/`create_by_pi_method`, are both out of scope) --
// original coverage written here too. All 4 files use
// `describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))`, matching chunks 1-5's own
// established convention.
//
// --- Landed in chunk 7 (7 more files, ~745 lines) ---
//
// `_updateCurveSegmentTransitionCode` (module-private -- real Python's ENTIRE body is
// one line calling the OTHER permanently-excluded, kernel-needing file,
// `get_curve_segment_transition_code`; ported as an unconditional, descriptive throw,
// keeping the real 2-argument `(prevSegment, segment)` signature so its own real
// callers below can keep calling it uniformly), `createAsOffsetCurve`/`createAsPolyline`
// (both PUBLIC -- confirmed in real Python's own `__init__.py` `__all__` -- create a
// new `IfcAlignment` and aggregate it to `IfcProject`, reusing already-landed
// `_createOffsetCurveRepresentation`/`_createPolylineRepresentation` (chunk 6) and
// `api.aggregate.assignObject`; `createAsPolyline` additionally reuses `addStationingReferent`
// (chunk 4) and `util.alignment.stationAsString`), `_addSegmentToCurve` (module-private
// -- 2 functions, only the outer one exported even at the file level, matching real
// Python's own file-vs-module privacy distinction for `_add_curve_segment_to_composite_curve`),
// `addZeroLengthSegment` (PUBLIC -- see below for this chunk's own standout finding),
// `_addZeroLengthSegment`/`_addSegmentToLayout` (both module-private thin wrappers).
// Dependency order ported exactly as listed above; confirmed by reading every real
// file's own imports AND full body.
//
// **CONFIRMED (empirically, against a real installed `ifcopenshell`): `IfcGradientCurve`/
// `IfcSegmentedReferenceCurve` genuinely ARE schema subtypes of `IfcCompositeCurve`** --
// so `_add_segment_to_curve.py`'s own blanket, redundant-looking
// `curve.is_a("IfcCompositeCurve")` check (after 3 earlier, more specific checks) is a
// real, if defensive-looking, check, NOT a bug -- ported verbatim, not removed.
//
// **5 of this chunk's 7 files are unconditionally blocked on the real geometry
// kernel for every real invocation** (`_updateCurveSegmentTransitionCode`,
// `_addSegmentToCurve`, `_addSegmentToLayout`, and transitively `createAsOffsetCurve`/
// `createAsPolyline` via their already-landed, already-disclosed `.Dim`-gap
// dependencies) -- every real branch up to the exact blocked call is ported completely
// and faithfully (see each file's own header comment for exactly which real logic runs
// first, and -- for `_addSegmentToCurve` specifically -- a genuinely nuanced finding
// about WHICH of 2 disclosed blockers throws first, depending on the target curve's
// current shape).
//
// **THE STANDOUT FINDING OF THIS CHUNK: `addZeroLengthSegment` is only CONDITIONALLY
// blocked, not unconditionally like every other file here.** It calls the kernel-needing
// `_get_segment_endpoint` ONLY when the layout/curve it's given ALREADY HAS at least one
// real segment -- for a genuinely EMPTY layout/curve (e.g. one freshly, hand-built by a
// test fixture, bypassing the also-unported `create()`), it is FULLY PORTABLE, using the
// same raw-number-at-construction-time `IfcCurveSegment` technique established since
// chunk 3, and even correctly RECURSES into a `IfcGradientCurve`/`IfcSegmentedReferenceCurve`'s
// own `BaseCurve`. Refining this chunk's own original task brief: `IfcAlignmentCant`'s
// own branch calls the kernel-needing dependency ZERO TIMES, period (confirmed by
// grepping the whole real 206-line file) -- it is ALWAYS fully portable, regardless of
// whether it already has real segments, unlike `IfcAlignmentHorizontal`/`Vertical`/the
// composite-curve family (all 3 conditionally blocked only when non-empty). See
// `addZeroLengthSegment.ts`'s own header comment for the full, nuanced writeup, and
// `addZeroLengthSegment.test.ts` for real, passing end-to-end coverage of the portable
// path (not just a disclosed-throw stub) -- genuinely valuable, testable functionality.
// `addZeroLengthSegment` also preserves a real, confirmed Python quirk verbatim: its
// 3-type early-return branch (`IfcOffsetCurveByDistances`/`IfcPolyline`/
// `IfcIndexedPolyCurve`) is a bare `return` (`None`), not `return False`, despite the
// function's own `-> bool` type hint and its own docstring's "True if segment is
// added" claim -- ported as `return undefined`, not silently "fixed".
//
// **`updateEndPoint.ts` (chunk 3) is RETROACTIVELY RESOLVED by this chunk** -- its own
// previously-disclosed blocker (the unported `addZeroLengthSegment`) is now wired in
// for real, matching this project's own `api.geometry.editObjectPlacement`/
// `api.root.removeProduct` precedent for retroactively resolving an earlier chunk's
// disclosed dependency gap once it lands. See `updateEndPoint.ts`'s own header comment
// and `TODOS.md`'s own dedicated entry's "UPDATE" for the full writeup: a genuinely
// empty `IfcGradientCurve`/`IfcSegmentedReferenceCurve` now computes a real, correct
// `EndPoint` end to end.
//
// Real Python has no dedicated test file for any of this chunk's 7 files (confirmed by
// reading the whole real test directory) -- original test coverage was written for all
// 7, following this module's established hand-rolled-fixture pattern. All 7 files (and
// `updateEndPoint.test.ts`'s own updated tests) use
// `describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))`, matching chunks 1-6's own
// established convention.
//
// --- Landed in chunk 8 (8 more files, ~869 lines) -- THIS MODULE IS NOW FUNCTIONALLY
//     COMPLETE FOR THIS PORT'S SCOPE ---
//
// `addVerticalLayout` (adds a vertical layout to a previously created alignment, handling
// the IFC CT 4.1.4.4.1.1 -> 4.1.4.4.1.2 transition when a second vertical is added),
// `createLayoutSegment` (thin `IfcAlignmentSegment`-construction wrapper over chunk 7's
// `_addSegmentToLayout`), `createRepresentation` (creates an alignment's geometric
// representation from a purely-semantic definition), `create` (the alignment "front
// door" -- horizontal/vertical/cant layouts, geometry, stationing referent, project
// aggregation), `createByPiMethod`/`createFromCsv` (both thin wrappers over `create`),
// `layoutHorizontalAlignmentByPiMethod`/`layoutVerticalAlignmentByPiMethod` (PI-method
// segment-by-segment construction math). All 8 are PUBLIC (confirmed present in real
// Python's own `__init__.py` `__all__`). Dependency order ported exactly as listed
// above (files 7-8 ported LAST since `createByPiMethod`/`createFromCsv` both call them).
//
// **THE STANDOUT FINDING OF THIS CHUNK, CAREFULLY VERIFIED (correcting, then refining,
// this chunk's own task brief's hypothesis): `addVerticalLayout` is GENUINELY FULLY
// FUNCTIONAL END TO END**, for both the first-vertical-layout branch (IFC CT
// 4.1.4.4.1.1) and the second/subsequent-vertical child-alignment-reuse branch (IFC CT
// 4.1.4.4.1.2) -- but ONLY under one precise precondition this chunk's own task brief did
// not spell out: `parentAlignment` must already have a real horizontal geometric
// representation (any basis curve `getBasisCurve` recognizes). This is also,
// separately, the ONLY state this port's own currently-portable API surface can ever
// produce (nothing that could add real segments to a horizontal composite curve is
// portable yet), so every realistic fixture reachable through this port today
// satisfies it automatically. Without that precondition (a parent alignment with NO
// representation at all), the function throws a real, natural
// `TypeError: Cannot read properties of null` -- the direct TS equivalent of a genuine
// real-Python `AttributeError` this port faithfully reproduces, not a new port-specific
// gap. See `addVerticalLayout.ts`'s own header comment for the full, line-by-line trace
// confirming every dependency resolves the way the hypothesis required, and
// `addVerticalLayout.test.ts` for full, real, PASSING end-to-end coverage of both
// branches plus the disclosed throw case.
//
// **A SECOND CAREFULLY-VERIFIED FINDING THAT CORRECTS this chunk's own task brief's
// OTHER hypothesis: `createRepresentation` is NOT reachable end-to-end for any realistic
// alignment either, though via a more specific path than a naive kernel-gap throw.**
// The task brief reasoned that a fresh alignment with zero real segments would make its
// `for segment in layout_nest.RelatedObjects` loop body simply "not execute". Tracing
// precisely: `get_alignment_segment_nest` returns `null` PRECISELY when a layout has zero
// real segments (by its own construction, see `getAlignmentSegmentNest.ts`) -- and real
// Python's own `for segment in layout_nest.RelatedObjects` has NO guard on
// `layout_nest` itself being `None`, so it crashes evaluating the loop's own iterable
// expression (`None.RelatedObjects`), before the loop body ever gets the chance to "not
// execute". Since a non-null `layout_nest` necessarily contains at least 1 real segment
// (by the same construction), the loop -- whenever actually reached -- always calls the
// now-unconditionally-blocked `_addSegmentToCurve` (chunk 7) at least once. So: for ANY
// alignment with at least one real layout, `createRepresentation` always throws, either
// at the null-nest crash (zero-segment layout) or inside `_addSegmentToCurve`
// (non-empty layout) -- there is no reachable "genuinely fresh, empty alignment with a
// real layout" input for which this function completes. The trailing
// stationing-referent-placement-update branch (reachable only for a fully degenerate
// zero-LAYOUT alignment) independently hits the SAME already-disclosed `IfcLengthMeasure`
// standalone-construction gap `addStationingReferent.ts`'s own "gap 1" already tracks --
// not a new gap. See `createRepresentation.ts`'s own header comment for the full writeup.
//
// **`create`/`createByPiMethod`/`createFromCsv` are all CONFIRMED unconditionally
// blocked** on `create`'s own unconditional (not `include_geometry`-guarded -- verified
// directly against the real source's own indentation, a common point of confusion)
// `addStationingReferent` call, itself already confirmed (chunk 4) blocked on 2
// independent primitive-layer gaps for every real invocation. `createLayoutSegment` is
// similarly unconditionally blocked on chunk 7's own already-unconditionally-blocked
// `_addSegmentToLayout`. `layoutHorizontalAlignmentByPiMethod`/
// `layoutVerticalAlignmentByPiMethod` both have substantial real, portable PI-method
// geometric math (tangent-run/circular-curve and parabolic-arc/constant-gradient
// respectively) ported completely and faithfully, throwing only at their own first
// reached `createLayoutSegment` call -- but since `_addSegmentToLayout`'s own real
// `nest.assignObject`/`nest.reorderNesting` side effects run BEFORE its own throw, the
// one real segment that gets created and nested before each function throws lets their
// own test files verify the real, hand-computed intermediate math (angles, tangent
// lengths, PC/PT coordinates, gradient/parabolic-arc parameters) against the actual
// entity in the file, not just assert-throws stubs -- matching this module's own
// established "port real math even in a function currently blocked on its very last
// step" precedent. `createFromCsv`'s own real CSV-parsing logic (hand-rolled, no new npm
// dependency -- no CSV-reading precedent existed anywhere in this port before this
// chunk) is ported completely and faithfully up to the exact point its first row's
// `create()` call throws.
//
// Real Python has no dedicated test file for any of this chunk's 8 files (confirmed by
// reading the whole real test directory) -- original test coverage was written for all
// 8, following this module's established hand-rolled-fixture pattern, with FULL real
// end-to-end coverage (not disclosed-throw stubs) for `addVerticalLayout`. All 8 files
// use `describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))`, matching chunks 1-7's own
// established convention.
//
// --- THIS MODULE IS NOW FUNCTIONALLY COMPLETE FOR THIS PORT'S SCOPE ---
//
// 56 of the 59 real files are landed (chunks 1-8). The remaining 3 are PERMANENTLY
// excluded (not scheduled for any future chunk, until a real geometry-kernel binding
// effort exists), matching `api.geometry`'s own established "module complete, N files
// permanently out of scope" precedent:
// - `_get_segment_endpoint`/`get_curve_segment_transition_code`: both need
//   `ifcopenshell.geom.settings`/`ifcopenshell_wrapper.map_shape`/
//   `function_item_evaluator`.
// - `util.py`: genuinely needs the real geometry kernel (`ifcopenshell.geom.create_shape`,
//   `ifcopenshell_wrapper.map_shape`, `ifcopenshell_wrapper.function_item_evaluator`) --
//   the same fundamental "no OpenCASCADE-class geometry kernel in this Node-addon-based
//   TS port" architectural boundary already disclosed for
//   `api.geometry.addProfileRepresentation`'s own `getX`/`getY` else-branch (see that
//   file's own header comment and its `TODOS.md` entry for the established precedent).
//
// 56 (landed) + 3 (permanently excluded) = 59, the full real file count.
//
// --- UPSTREAM SYNC, CHUNK 3 OF 4 (2026-09-26): stationing rework ported from real
//     upstream commit `b5670c4fc5347ec5c2c621f3f53a1a737bd21d2b` ---
//
// See `TODOS.md`'s "Upstream sync, chunk 3 of 4" entry and
// `planning/ifcopenshell-ts/90-upstream-sync-plan.md` §4c for the full context. Real
// upstream reverted `create()`'s own automatic stationing-referent creation (and that of
// its own callers `create_as_polyline`/`create_by_pi_method`/`create_from_csv`, all of
// which now take an OPTIONAL `start_station` and create the referent themselves, AFTER
// their own real geometry exists) and added reverse (decreasing) stationing support to
// `add_stationing_referent`/`distance_along_from_station`, plus a new shared
// `_referent_distance_along` helper (this port: `./_referentDistanceAlong.ts`, a new,
// module-private, NOT-re-exported file, matching this module's own established
// `_`-prefixed-helper convention) used by both to sort/interpret referents by
// `DistanceAlong` rather than `Pset_Stationing.Station` directly. `create.ts`,
// `createAsPolyline.ts`, `createByPiMethod.ts`, `createFromCsv.ts`,
// `addStationingReferent.ts`, and `distanceAlongFromStation.ts` were all updated -- see
// each file's own "UPDATE (upstream sync chunk 3 of 4, ...)" header-comment section for
// the precise per-file diff. No other file in this module was touched by this chunk.
export { addPositioningReferent } from "./addPositioningReferent";
export { addStationingReferent } from "./addStationingReferent";
export { addVerticalLayout } from "./addVerticalLayout";
export { addZeroLengthSegment } from "./addZeroLengthSegment";
export { create } from "./create";
export { createAsOffsetCurve } from "./createAsOffsetCurve";
export { createAsPolyline } from "./createAsPolyline";
export { createByPiMethod } from "./createByPiMethod";
export { createFromCsv } from "./createFromCsv";
export { createLayoutSegment } from "./createLayoutSegment";
export { createRepresentation } from "./createRepresentation";
export { createSegmentRepresentations } from "./createSegmentRepresentations";
export { distanceAlongFromStation } from "./distanceAlongFromStation";
export { getAlignment } from "./getAlignment";
export { getAlignmentLayoutNest } from "./getAlignmentLayoutNest";
export { getAlignmentLayouts } from "./getAlignmentLayouts";
export { getAlignmentSegmentNest } from "./getAlignmentSegmentNest";
export { getAlignmentStartStation } from "./getAlignmentStartStation";
export { getAxisSubcontext } from "./getAxisSubcontext";
export { getBasisCurve } from "./getBasisCurve";
export { getCantLayout } from "./getCantLayout";
export { getChildAlignments } from "./getChildAlignments";
export { getCurve } from "./getCurve";
export { getCurveSegment } from "./getCurveSegment";
export { getHorizontalLayout } from "./getHorizontalLayout";
export { getLayout } from "./getLayout";
export { getLayoutCurve } from "./getLayoutCurve";
export { getLayoutSegments } from "./getLayoutSegments";
export { getMappedSegments } from "./getMappedSegments";
export { getParentAlignment } from "./getParentAlignment";
export { getStationingNest } from "./getStationingNest";
export { getVerticalLayout } from "./getVerticalLayout";
export { hasZeroLengthSegment } from "./hasZeroLengthSegment";
export { layoutHorizontalAlignmentByPiMethod } from "./layoutHorizontalAlignmentByPiMethod";
export { layoutVerticalAlignmentByPiMethod } from "./layoutVerticalAlignmentByPiMethod";
export { nameSegments } from "./nameSegments";
export { registerReferentNameCallback } from "./_getSegmentStartPointLabel";
export type { ReferentNameCallback } from "./_getSegmentStartPointLabel";
export { updateAlignmentParameterSegmentTags } from "./updateAlignmentParameterSegmentTags";
export { updateEndPoint } from "./updateEndPoint";
export { updateFallbackPosition } from "./updateFallbackPosition";
export { updateKeyPointReferents } from "./updateKeyPointReferents";
