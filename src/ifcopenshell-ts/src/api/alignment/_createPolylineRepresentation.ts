// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_create_polyline_representation.py`
// (src/ifcopenshell-python, 69 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 6 of many). Depends on this module's own
// already-landed `getAxisSubcontext` (chunk 1) and already-landed
// `api.geometry.assignRepresentation` (`../geometry/assignRepresentation.ts`) -- both
// reused directly.
//
// Real Python's leading underscore marks this as module-private (absent from
// `__init__.py`'s own `__all__`) -- NOT re-exported from `./index.ts`'s public barrel.
//
// --- INDEPENDENTLY BLOCKED by the SAME pre-existing, already-disclosed
// `entityInstance.ts` EXPRESS DERIVED-attribute gap as `./_createOffsetCurveRepresentation
// .ts` -- a genuinely NEW occurrence, for THIS module, of an ALREADY-tracked gap, this
// time via a DIFFERENT attribute/entity class ---
//
// Line 42, `points[0].Dim == 3` (`points[0]` is schema-typed `IfcCartesianPoint`).
// `IfcCartesianPoint.Dim` (`DERIVE Dim := HIINDEX(Coordinates)`) is the SAME real
// EXPRESS DERIVED attribute already tracked by `TODOS.md`'s `api.cogo.editSurveyPoint`
// entry (which reads the identical `Items[0].Dim` on an `IfcCartesianPoint`) -- NOT a
// new, separately-tracked entry (already generically covered by that entry's own
// title/body, which names `IfcCartesianPoint.Dim` explicitly).
//
// Ported everything BEFORE this line completely and faithfully; the read itself is a
// plain, unguarded `points[0].get("Dim")` call, matching `../cogo/editSurveyPoint.ts`'s
// own established "just write the real attribute read, let the pre-existing gap throw
// naturally" precedent -- no proactive guard, no narrow `Coordinates.length`
// shortcut.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { assignRepresentation } from "../geometry/assignRepresentation";
import { getAxisSubcontext } from "./getAxisSubcontext";

/**
 * Create geometric representation for the alignment based on an `IfcPolyline`
 * (Python: `ifcopenshell.api.alignment._create_polyline_representation`).
 *
 * @param file The model.
 * @param alignment The alignment for which the representation is being created.
 * @param points The `IfcCartesianPoint`s defining the polyline.
 * @throws {TypeError} If `alignment` is not an `IfcAlignment`.
 * @throws {Error} At the exact point real Python's own `points[0].Dim` read would need
 *   the (not-yet-implemented) EXPRESS DERIVED-attribute machinery -- see this file's
 *   own header comment.
 */
export function _createPolylineRepresentation(
	file: IfcFile,
	alignment: EntityInstance,
	points: readonly EntityInstance[],
): void {
	const expectedType = "IfcAlignment";
	if (!alignment.isA(expectedType)) {
		throw new TypeError(`Expected ${expectedType} but got ${alignment.isA()}`);
	}

	const axisGeomSubcontext = getAxisSubcontext(file);

	let placement: EntityInstance;
	let representationType: string;
	// *** BLOCKED HERE -- see this file's own header comment. `points[0].get("Dim")`
	// throws the pre-existing `entityInstance.ts` DERIVED-attribute error
	// unconditionally (`IfcCartesianPoint.Dim` is never a stored attribute). ***
	if ((points[0].get("Dim") as number) === 3) {
		placement = file.createEntity(
			"IfcLocalPlacement",
			null,
			file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0])),
		);
		representationType = "Curve3D";
	} else {
		placement = file.createEntity(
			"IfcLocalPlacement",
			null,
			file.createEntity("IfcAxis2Placement2D", file.createEntity("IfcCartesianPoint", [0.0, 0.0])),
		);
		representationType = "Curve2D";
	}

	const curve = file.createEntity("IfcPolyline", [...points]);

	const representation = file.createEntity("IfcShapeRepresentation", axisGeomSubcontext, "Axis", representationType, [
		curve,
	]);

	alignment.set("ObjectPlacement", placement);
	assignRepresentation(file, { product: alignment, representation });
}
