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
// --- UPDATE (Phase EX-2, IFC4X3's own THIRD chunk, `src/express/rules/ifc4x3.ts`):
// the DERIVED-attribute gap below is now closed for real ---
//
// Line 42 (now below), `points[0].Dim == 3` (`points[0]` is schema-typed
// `IfcCartesianPoint`), previously threw via the SAME pre-existing
// `entityInstance.ts` EXPRESS DERIVED-attribute gap already tracked by `TODOS.md`'s
// `api.cogo.editSurveyPoint` entry (`IfcCartesianPoint.Dim`) -- IFC4X3's own THIRD
// `calc_*`-porting chunk ports `calc_IfcPoint_Dim` (ADD2's own consolidated
// supertype formula `IfcCartesianPoint.Dim` now dispatches through), so this read now
// resolves to a real number instead of throwing, and this function runs to
// completion end-to-end for both 2D and 3D point lists -- re-verified directly
// against the real built addon, not assumed. `TODOS.md`'s corresponding entry and
// this file's own test are updated accordingly.
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
