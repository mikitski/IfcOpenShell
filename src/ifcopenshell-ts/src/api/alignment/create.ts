// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/create.py` (src/ifcopenshell-python, 105 lines) --
// see `./index.ts`'s own header comment for this brand-new module's full scope (chunk 8
// of many, the LAST chunk for this module). PUBLIC (confirmed present in real Python's
// own `__init__.py` `__all__`). Depends on already-landed `_addZeroLengthSegment`
// (chunk 7), `_createGeometricRepresentation` (chunk 6), `addStationingReferent`
// (chunk 4), `api.aggregate.assignObject`/`api.nest.assignObject`,
// `util.alignment.stationAsString` -- all verified directly against their real exported
// name/signature before use.
//
// --- CONFIRMED: `addStationingReferent` is called UNCONDITIONALLY, not inside the
//     `if include_geometry:` block -- a common point of confusion, verified precisely ---
//
// Reading the real source's own indentation directly: `_create_geometric_representation`
// is inside `if include_geometry:` (indented one level deeper), but
// `referent_name = ...` / `referent = ifcopenshell.api.alignment.add_stationing_referent
// (...)` sit at the SAME indentation level as that `if` statement itself -- i.e. OUTSIDE
// and AFTER it, always executed regardless of `include_geometry`'s value. Since
// `addStationingReferent` is already confirmed (chunk 4) to be blocked on BOTH of its
// own 2 disclosed gaps (the `IfcPointByDistanceExpression.DistanceAlong`/
// `IfcLengthMeasure` standalone-construction gap for a real, non-empty composite curve;
// `editPset`'s own new-property gap for the non-composite-curve fallback placement) for
// EVERY real invocation, `create()` is **unconditionally blocked** at this exact call,
// for every real invocation, regardless of `includeVertical`/`includeCant`/
// `includeGeometry`/`startStation` -- not a NEW gap, just this function's own real,
// unavoidable dependency on an already-fully-blocked one.
//
// Ported the ENTIRE function faithfully regardless (entity creation, layout creation,
// nesting, conditional geometric-representation creation, the stationing referent call,
// the final `_add_zero_length_segment` loop over layouts, project aggregation) -- no
// proactive guard added anywhere. `create.test.ts` pins the real, portable prefix that
// runs before the throw (the `IfcAlignment`/layout entities and their nesting are all
// real, for real, by the time the throw happens), for both `include_geometry=true` and
// `include_geometry=false` (both reach the identical unconditional
// `addStationingReferent` throw, confirming the indentation finding above precisely).
//
// --- Real, disclosed TS-vs-Python divergence: same empty-`IfcProject` quirk as
//     `./createAsPolyline.ts`/`./createAsOffsetCurve.ts` (never actually reached here,
//     since the function always throws earlier, but disclosed for completeness) ---
//
// Real Python's own `file.by_type("IfcProject")[0]` raises `IndexError` for an empty
// file, before its own `if project:` check is ever meaningfully reached; this port's
// `file.byType(...)[0]` evaluates to `undefined` instead, so `if (project)` here
// genuinely guards a currently-unreachable-in-real-Python case.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { stationAsString } from "../../util/alignment";
import { assignObject as assignAggregateObject } from "../aggregate/assignObject";
import { assignObject as assignNestObject } from "../nest/assignObject";
import { _addZeroLengthSegment } from "./_addZeroLengthSegment";
import { _createGeometricRepresentation } from "./_createGeometricRepresentation";
import { addStationingReferent } from "./addStationingReferent";

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
 * If geometric representations are created, the alignment stationing referent is also
 * created using `startStation`. `IfcReferent.ObjectPlacement` is required for linear
 * position elements and `IfcLinearPlacement` is defined relative to alignment curve
 * geometry. This referent's `Name` follows the same "<alignment name> <station>"
 * convention `updateKeyPointReferents` uses for its own key-point referents (e.g.
 * "MyAlignment 49+00.00").
 *
 * **CONFIRMED unconditionally blocked** by the already-disclosed `addStationingReferent`
 * gap, called unconditionally regardless of `includeGeometry` -- see this file's own
 * header comment for the precise indentation-level verification.
 *
 * @param file The file.
 * @param name Name assigned to `IfcAlignment.Name`.
 * @param includeVertical If `true`, `IfcAlignmentVertical` is created. `IfcGradientCurve`
 *   is created if `includeGeometry` is `true`.
 * @param includeCant If `true`, `IfcAlignmentCant` is created. `IfcSegmentedReferenceCurve`
 *   is created if `includeGeometry` is `true`.
 * @param includeGeometry If `true`, the geometric representations are added.
 * @param startStation Station value at the start of the alignment.
 * @returns The new `IfcAlignment`.
 * @throws {Error} Always, from the already-unconditionally-blocked `addStationingReferent`
 *   -- see this file's own header comment.
 */
export function create(
	file: IfcFile,
	name: string,
	includeVertical = false,
	includeCant = false,
	includeGeometry = true,
	startStation = 0.0,
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

	const referentName = `${name} ${stationAsString(file, startStation)}`;
	// *** BLOCKED HERE, unconditionally, regardless of `includeGeometry` -- see this
	// file's own header comment. ***
	addStationingReferent(file, referentName, alignment, 0.0, startStation);

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
