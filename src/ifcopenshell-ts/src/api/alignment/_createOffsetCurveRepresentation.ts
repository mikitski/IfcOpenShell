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
// DERIVED-attribute gap (`.get()` had no DERIVED-category fallback at all); NOW
// GENUINELY UNBLOCKED for IFC4X3 (the only schema `IfcOffsetCurveByDistances`/
// `IfcPointByDistanceExpression`/`IfcAlignment` even exist on), but with a real,
// disclosed LATENT CORRECTNESS gap in its place, not a crash ---
//
// Line 49, `basis_curve.Dim == 3` (`basis_curve` is `offsets[0].BasisCurve`, schema-
// typed `IfcCurve`). `IfcCurve.Dim` was the SAME real EXPRESS DERIVED attribute
// (`DERIVE Dim := IfcCurveDim(SELF)`) `TODOS.md`'s very first entry in this family
// (`util.representation.guessType`'s `Curve2D`/`Curve3D`/`Surface2D`/`Surface3D`
// branches) already tracked as unconditionally throwing "has no attribute 'Dim'".
//
// **UPDATE (Phase EX-2, IFC4X3's own SECOND `calc_*`-porting chunk,
// `src/express/rules/ifc4x3.ts`): `calc_IfcCurve_Dim` is now ported for IFC4X3, so
// `basisCurve.get("Dim")` no longer throws at all.** But this module's own realistic
// `basisCurve` values (a plain `IfcLine`/`IfcPolyline`, per this file's own test
// fixtures and every real caller) bottom out on `IfcCurveDim`'s `Pnt.Dim`/
// `Points[0].Dim` branches, which read a plain `IfcCartesianPoint`'s own `.Dim` --
// STILL genuinely unported for IFC4X3 (ADD2 consolidated it into an abstract-
// supertype `calc_IfcPoint_Dim`, not one of either of this port's own 2 IFC4X3
// chunks so far -- `rules/ifc4x3.ts`'s own header comment has the full writeup).
// `expressGetAttr`'s own try/catch (`runtimeShim.ts`) silently swallows that
// still-missing dependency's own throw and substitutes `runtimeShim.INDETERMINATE`
// -- so `basisCurve.get("Dim")` resolves to that sentinel, `INDETERMINATE === 3` is
// `false` (a `Symbol` is never `===` a number), and this function now ALWAYS takes
// the 2D (`else`) branch below, REGARDLESS of the real curve's actual
// dimensionality -- confirmed empirically against the real built addon (a 3D
// `IfcLine` basis curve still produces a `"Curve2D"` representation). This is a
// real, disclosed, CURRENT-STATE latent correctness gap (silently wrong branch, not
// a crash) -- not fixed here (fixing it means porting `calc_IfcPoint_Dim` for
// IFC4X3, a separate, future `calc_*`-porting chunk's own scope, not this file's)
// -- pinned by a dedicated regression test asserting today's real, empirically-
// confirmed (if structurally wrong) `"Curve2D"` outcome, matching this project's
// "assert what this port actually does today, not what it will do once more chunks
// land" precedent.
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
 * @remarks See this file's own header comment: `basisCurve.get("Dim")` currently
 *   always resolves to `runtimeShim.INDETERMINATE` for a realistic basis curve on
 *   IFC4X3 (a still-unported transitive dependency), so this function currently
 *   ALWAYS takes the 2D branch below, regardless of the real curve's dimensionality
 *   -- a disclosed, current-state latent correctness gap, not a crash.
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
	// *** See this file's own header comment: `basisCurve.get("Dim")` no longer
	// throws (Phase EX-2, IFC4X3's own second chunk), but for every realistic basis
	// curve today it resolves to `runtimeShim.INDETERMINATE`, not a real number, so
	// this always takes the 2D (`else`) branch below regardless of the real curve's
	// dimensionality -- a disclosed latent correctness gap, not a crash. ***
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
