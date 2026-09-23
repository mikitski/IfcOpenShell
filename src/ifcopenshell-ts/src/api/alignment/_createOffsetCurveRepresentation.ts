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
// --- WAS independently blocked by the pre-existing `entityInstance.ts` EXPRESS
// DERIVED-attribute gap (`.get()` had no DERIVED-category fallback at all); NOW FULLY
// GENUINELY UNBLOCKED for IFC4X3 (the only schema `IfcOffsetCurveByDistances`/
// `IfcPointByDistanceExpression`/`IfcAlignment` even exist on), including the branch
// selection itself ---
//
// Line 49, `basis_curve.Dim == 3` (`basis_curve` is `offsets[0].BasisCurve`, schema-
// typed `IfcCurve`). `IfcCurve.Dim` was the SAME real EXPRESS DERIVED attribute
// (`DERIVE Dim := IfcCurveDim(SELF)`) `TODOS.md`'s very first entry in this family
// (`util.representation.guessType`'s `Curve2D`/`Curve3D`/`Surface2D`/`Surface3D`
// branches) already tracked as unconditionally throwing "has no attribute 'Dim'".
//
// **UPDATE (Phase EX-2, IFC4X3's own SECOND `calc_*`-porting chunk,
// `src/express/rules/ifc4x3.ts`): `calc_IfcCurve_Dim` is now ported for IFC4X3, so
// `basisCurve.get("Dim")` no longer throws at all.** At that point, this module's own
// realistic `basisCurve` values (a plain `IfcLine`/`IfcPolyline`) bottomed out on
// `IfcCurveDim`'s `Pnt.Dim`/`Points[0].Dim` branches, which read a plain
// `IfcCartesianPoint`'s own `.Dim` -- STILL genuinely unported at that time (ADD2
// consolidated it into an abstract-supertype `calc_IfcPoint_Dim`) -- so
// `basisCurve.get("Dim")` resolved to `runtimeShim.INDETERMINATE`, and this function
// ALWAYS took the 2D (`else`) branch below, REGARDLESS of the real curve's actual
// dimensionality -- a disclosed, then-current-state latent correctness gap.
//
// **UPDATE AGAIN (Phase EX-2, IFC4X3's own THIRD chunk, `src/express/rules/
// ifc4x3.ts`): that gap is now closed for real.** `calc_IfcPoint_Dim` is now ported
// -- `basisCurve.get("Dim")` now resolves to the REAL dimensionality of the basis
// curve, so this function now correctly takes the 3D branch for a 3D basis curve and
// the 2D branch for a 2D one -- re-verified directly against the real built addon
// (a 3D `IfcLine` basis curve now correctly produces a `"Curve3D"` representation),
// not assumed. `_createOffsetCurveRepresentation.test.ts`'s own former "always 2D"
// regression test is replaced with 2 real, passing tests (one 2D, one 3D basis
// curve) proving correct branch selection.
//
// Ported everything faithfully either way -- both type checks (the
// `alignment`/`offsets` loop) and the branch below are real, fully portable,
// verbatim-translated control flow.
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
