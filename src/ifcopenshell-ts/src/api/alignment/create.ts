// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/create.py` (src/ifcopenshell-python, ~95 lines) --
// see `./index.ts`'s own header comment for this brand-new module's full scope (chunk 8
// of many, the LAST chunk for this module). PUBLIC (confirmed present in real Python's
// own `__init__.py` `__all__`). Depends on already-landed `_addZeroLengthSegment`
// (chunk 7), `_createGeometricRepresentation` (chunk 6), `api.aggregate.assignObject`/
// `api.nest.assignObject` -- all verified directly against their real exported
// name/signature before use.
//
// --- UPDATE (upstream sync chunk 3 of 4, upstream commit
//     `b5670c4fc5347ec5c2c621f3f53a1a737bd21d2b`): `create()` no longer creates a
//     stationing referent, and the `startStation` parameter is REMOVED ---
//
// See `TODOS.md`'s "Upstream sync, chunk 3 of 4" entry and
// `planning/ifcopenshell-ts/90-upstream-sync-plan.md` §4c for the full context. Real
// upstream's own commit message: "Reverts from automatically adding stationing to
// alignments because of missing initial geometry." -- the automatic
// `add_stationing_referent()` call used to run here BEFORE `create()`'s own trailing
// `_add_zero_length_segment` loop populates the basis curve's `Segments`, so it always
// took the fallback (non-composite-curve) placement branch, even when
// `includeGeometry=true` -- producing a referent placed with a plain `IfcLocalPlacement`
// instead of a real `IfcLinearPlacement` on the alignment's own curve, "because of
// missing initial geometry" (the real upstream commit message's own words). This is now
// the CALLER's responsibility: call `addStationingReferent()` explicitly, once the
// layout segments (and therefore the basis curve geometry) exist, to place the
// starting-station referent correctly the first time -- and again for any station
// equations. Until stationing is defined, `getAlignmentStartStation()` reports `0.0`.
//
// The `startStation` parameter is removed entirely (not defaulted to `null`/optional --
// real upstream's own new signature has no such parameter at all, matching
// `create_as_polyline.py`/`create_by_pi_method.py`/`create_from_csv.py`'s own newly
// OPTIONAL `start_station` params, which this file's siblings -- `./createAsPolyline.ts`/
// `./createByPiMethod.ts`/`./createFromCsv.ts` -- each still expose, calling
// `addStationingReferent()` themselves afterward when given).
//
// This function is otherwise unaffected: entity creation, layout creation, nesting,
// conditional geometric-representation creation, the trailing `_add_zero_length_segment`
// loop over layouts, and project aggregation are all unchanged.
//
// --- Real, disclosed TS-vs-Python divergence: same empty-`IfcProject` quirk as
//     `./createAsPolyline.ts`/`./createAsOffsetCurve.ts` ---
//
// Real Python's own `file.by_type("IfcProject")[0]` raises `IndexError` for an empty
// file, before its own `if project:` check is ever meaningfully reached; this port's
// `file.byType(...)[0]` evaluates to `undefined` instead, so `if (project)` here
// genuinely guards a currently-unreachable-in-real-Python case.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { assignObject as assignAggregateObject } from "../aggregate/assignObject";
import { assignObject as assignNestObject } from "../nest/assignObject";
import { _addZeroLengthSegment } from "./_addZeroLengthSegment";
import { _createGeometricRepresentation } from "./_createGeometricRepresentation";

/**
 * Creates a new alignment with a horizontal layout (Python:
 * `ifcopenshell.api.alignment.create`). Optionally, vertical and cant layouts can be
 * created as well. The geometric representations are created as well, unless they are
 * explicitly excluded. Zero length segments are added at the end of the layouts and
 * geometric representations. The alignment is automatically aggregated to the project
 * if it exists.
 *
 * Use `getHorizontalLayout(alignment)`, `getVerticalLayout(alignment)`, and
 * `getCantLayout(alignment)` to get the corresponding `IfcAlignmentHorizontal`,
 * `IfcAlignmentVertical`, and `IfcAlignmentCant` layout entities.
 *
 * This function does not define the alignment's stationing. Call
 * `addStationingReferent()` once the layout segments (and therefore the basis curve
 * geometry) exist to place the starting-station `IfcReferent`, and again for any
 * station equations. Until stationing is defined, `getAlignmentStartStation()` reports
 * `0.0`.
 *
 * @param file The file.
 * @param name Name assigned to `IfcAlignment.Name`.
 * @param includeVertical If `true`, `IfcAlignmentVertical` is created. `IfcGradientCurve`
 *   is created if `includeGeometry` is `true`.
 * @param includeCant If `true`, `IfcAlignmentCant` is created. `IfcSegmentedReferenceCurve`
 *   is created if `includeGeometry` is `true`.
 * @param includeGeometry If `true`, the geometric representations are added.
 * @returns The new `IfcAlignment`.
 */
export function create(
	file: IfcFile,
	name: string,
	includeVertical = false,
	includeCant = false,
	includeGeometry = true,
): EntityInstance {
	const alignment = file.createEntity(
		"IfcAlignment",
		guid.new(),
		null, // OwnerHistory
		name,
		null, // Description
		null, // ObjectType
		file.createEntity(
			"IfcLocalPlacement",
			null,
			file.createEntity("IfcAxis2Placement2D", file.createEntity("IfcCartesianPoint", [0.0, 0.0])),
		),
	);

	const alignmentLayouts: EntityInstance[] = [];

	alignmentLayouts.push(file.createEntity("IfcAlignmentHorizontal", guid.new()));

	if (includeVertical) {
		alignmentLayouts.push(file.createEntity("IfcAlignmentVertical", guid.new()));
	}

	if (includeCant) {
		const cant = file.createEntity("IfcAlignmentCant", guid.new());
		cant.set("RailHeadDistance", 1.0);
		alignmentLayouts.push(cant);
	}

	assignNestObject(file, { relatedObjects: alignmentLayouts, relatingObject: alignment });

	if (includeGeometry) {
		_createGeometricRepresentation(file, alignment);
	}

	for (const layout of alignmentLayouts) {
		_addZeroLengthSegment(file, layout);
	}

	// IFC 4.1.4.1.1 Alignment Aggregation To Project
	const project = file.byType("IfcProject")[0];
	if (project) {
		assignAggregateObject(file, { products: [alignment], relatingObject: project });
	}

	return alignment;
}
