// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.alignment` (src/ifcopenshell-python's
// `ifcopenshell/api/alignment/` package) -- a brand-new, LARGE module (~50 real
// files, 6282 lines total, no TS port of any kind before this chunk). Real Python's
// own module docstring: "Manages alignment layout (semantic definition) and
// alignment geometry (geometric definition)" for IFC4X3-era road/rail alignments --
// horizontal/vertical/cant layouts, stationing, segment-by-segment or PI-method
// construction, and their derived `IfcCompositeCurve`/`IfcGradientCurve`/
// `IfcSegmentedReferenceCurve` geometric representations.
//
// **THIS IS CHUNK 2 OF MANY** (matching `api.geometry`'s own 11+-PR precedent for a
// module of this size) -- 22 of ~50 real files (~991 lines) are landed as of this
// chunk. None of these is registered with `ifcopenshell.api.run`/an internal
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
// --- Still pending (future chunks) ---
//
// Every other real file in `ifcopenshell/api/alignment/`: the segment-by-segment and
// PI-method construction functions (`create`, `create_by_pi_method`,
// `create_from_csv`, `create_layout_segment`, `create_as_polyline`,
// `create_as_offset_curve`, `create_representation`,
// `create_segment_representations`, `layout_horizontal_alignment_by_pi_method`,
// `layout_vertical_alignment_by_pi_method`, `add_vertical_layout`,
// `add_zero_length_segment`, `add_positioning_referent`, `add_stationing_referent`,
// `update_alignment_parameter_segment_tags`, `update_end_point`,
// `update_fallback_position`, `update_key_point_referents`,
// `get_curve_segment_transition_code` (the ONE file needing the real geometry kernel,
// see below -- do not attempt), their private `_`-prefixed helper files (`_add_segment_to_curve`,
// `_add_segment_to_layout`, `_add_zero_length_segment`,
// `_create_geometric_representation`, `_create_offset_curve_representation`,
// `_create_polyline_representation`, `_get_cant_segment`, `_get_key_point_tag`,
// `_get_segment_endpoint`, `_get_segment_start_point_label`,
// `_map_alignment_cant_segment`, `_map_alignment_horizontal_segment`,
// `_map_alignment_segment`, `_map_alignment_vertical_segment`, `_sort_nest`,
// `_update_curve_segment_transition_code`,
// `_update_zero_length_segment_placement`) -- and, separately from all of the above,
// **`util.py`, a REAL, CONFIRMED, SEPARATE blocker** (not attempted in any chunk
// until the underlying gap is closed): it genuinely needs the real geometry kernel
// (`ifcopenshell.geom.create_shape`, `ifcopenshell_wrapper.map_shape`,
// `ifcopenshell_wrapper.function_item_evaluator`) -- the same fundamental
// "no OpenCASCADE-class geometry kernel in this Node-addon-based TS port"
// architectural boundary already disclosed for `api.geometry.addProfileRepresentation`'s
// own `getX`/`getY` else-branch (see that file's own header comment and its
// `TODOS.md` entry for the established precedent).
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
export { nameSegments } from "./nameSegments";
