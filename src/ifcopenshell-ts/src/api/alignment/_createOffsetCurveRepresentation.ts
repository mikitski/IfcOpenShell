// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_create_offset_curve_representation.py`
// (src/ifcopenshell-python, 76 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 6 of many). Depends on this module's own
// already-landed `getAxisSubcontext` (chunk 1) and already-landed
// `api.geometry.assignRepresentation` (`../geometry/assignRepresentation.ts`) -- both
// reused directly.
//
// Real Python's leading underscore marks this as module-private (absent from
// `__init__.py`'s own `__all__`) -- NOT re-exported from `./index.ts`'s public barrel.
//
// --- INDEPENDENTLY BLOCKED by the pre-existing, already-disclosed `entityInstance.ts`
// EXPRESS DERIVED-attribute gap (`.get()` has no DERIVED-category fallback at all) --
// a genuinely NEW occurrence, for THIS module, of an ALREADY-tracked gap ---
//
// Line 49, `basis_curve.Dim == 3` (`basis_curve` is `offsets[0].BasisCurve`, schema-
// typed `IfcCurve`). `IfcCurve.Dim` is the SAME real EXPRESS DERIVED attribute
// (`DERIVE Dim := IfcCurveDim(SELF)`) already tracked by `TODOS.md`'s very first entry
// in this family (`util.representation.guessType`'s `Curve2D`/`Curve3D`/`Surface2D`/
// `Surface3D` branches, confirmed absent from `IfcCurve`'s own generated interface --
// `ifc4x3.d.ts`'s `IfcCurve` is an empty marker interface, no attributes of its own on
// any subtype either) -- NOT a new, separately-tracked entry (already generically
// covered by that entry's own title, which names `IfcCurve.Dim` explicitly).
//
// Ported everything BEFORE this line completely and faithfully -- both type checks
// (the `alignment`/`offsets` loop), matching real Python's own `EntityInstance.get()`
// natural throw at the exact point `.Dim` would actually be read (no proactive guard,
// matching `../cogo/editSurveyPoint.ts`'s own established "just write the real
// attribute read, let the pre-existing gap throw naturally" precedent). The
// `offsets[i].isA()` type-checking loop and everything up to (and not including) the
// `.Dim` read are real, fully portable, and independently tested.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { assignRepresentation } from "../geometry/assignRepresentation";
import { getAxisSubcontext } from "./getAxisSubcontext";

/**
 * Create geometric representation for the alignment based on an
 * `IfcOffsetCurveByDistances` curve (Python:
 * `ifcopenshell.api.alignment._create_offset_curve_representation`).
 *
 * @param file The model.
 * @param alignment The alignment for which the representation is being created.
 * @param offsets The `IfcPointByDistanceExpression`s defining the offset curve.
 * @throws {TypeError} If `alignment` is not an `IfcAlignment`, or any `offsets`
 *   element is not an `IfcPointByDistanceExpression`.
 * @throws {Error} At the exact point real Python's own `basis_curve.Dim` read would
 *   need the (not-yet-implemented) EXPRESS DERIVED-attribute machinery -- see this
 *   file's own header comment.
 */
export function _createOffsetCurveRepresentation(
	file: IfcFile,
	alignment: EntityInstance,
	offsets: readonly EntityInstance[],
): void {
	const expectedAlignmentType = "IfcAlignment";
	if (!alignment.isA(expectedAlignmentType)) {
		throw new TypeError(`Expected ${expectedAlignmentType} but got ${alignment.isA()}`);
	}

	const expectedOffsetType = "IfcPointByDistanceExpression";
	for (const offset of offsets) {
		if (!offset.isA(expectedOffsetType)) {
			throw new TypeError(`Expected ${expectedOffsetType} but got ${offset.isA()}`);
		}
	}

	const axisGeomSubcontext = getAxisSubcontext(file);

	const basisCurve = offsets[0].get("BasisCurve") as EntityInstance; // IfcPointByDistanceExpression.BasisCurve

	let placement: EntityInstance;
	let representationType: string;
	// *** BLOCKED HERE -- see this file's own header comment. `basisCurve.get("Dim")`
	// throws the pre-existing `entityInstance.ts` DERIVED-attribute error
	// unconditionally (`IfcCurve.Dim` is never a stored attribute on any schema). ***
	if ((basisCurve.get("Dim") as number) === 3) {
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

	const curve = file.createEntity("IfcOffsetCurveByDistances", basisCurve, [...offsets]);

	const representation = file.createEntity("IfcShapeRepresentation", axisGeomSubcontext, "Axis", representationType, [
		curve,
	]);

	alignment.set("ObjectPlacement", placement);
	assignRepresentation(file, { product: alignment, representation });
}
