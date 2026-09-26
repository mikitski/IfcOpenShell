// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for
// `_create_offset_curve_representation.py` (confirmed by reading the whole real test
// directory). Original test coverage written here, gated to IFC4X3.
//
// **UPDATE (Phase EX-2, IFC4X3's own SECOND `calc_*`-porting chunk): no longer
// blocked.** See `../../../src/api/alignment/_createOffsetCurveRepresentation.ts`'s
// own header comment for the full writeup: `calc_IfcCurve_Dim` is now ported for
// IFC4X3, so `basis_curve.Dim` no longer throws -- but at that point it always
// resolved to `runtimeShim.INDETERMINATE` for a realistic (`IfcLine`/`IfcPolyline`)
// basis curve, a still-unported transitive dependency (`calc_IfcPoint_Dim`) -- so this
// function always took the 2D branch, regardless of the real curve's dimensionality.
//
// **UPDATE AGAIN (Phase EX-2, IFC4X3's own THIRD chunk, `src/express/rules/
// ifc4x3.ts`): that latent correctness gap is now closed for real.** `calc_IfcPoint_Dim`
// is now ported -- `basisCurve.get("Dim")` now resolves to the REAL dimensionality
// instead of `INDETERMINATE`, so this function now takes the CORRECT branch for both
// 2D and 3D basis curves -- re-verified directly against the real built addon, not
// assumed. The 2D-basis-curve test below (previously demonstrating the "always 2D"
// bug) now demonstrates CORRECT branch selection for a genuinely 2D curve instead, and
// a NEW dedicated 3D-basis-curve test is added to prove the fix (previously
// impossible to write a passing 3D test at all, since the function always took the 2D
// branch regardless of input).

import { describe, expect, test } from "vitest";
import { _createOffsetCurveRepresentation } from "../../../src/api/alignment/_createOffsetCurveRepresentation";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function realCurve2D(file: IfcFile): EntityInstance {
	return file.createEntity(
		"IfcLine",
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0),
	);
}

function realCurve3D(file: IfcFile): EntityInstance {
	return file.createEntity(
		"IfcLine",
		file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]),
		file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0, 0.0]), 1.0),
	);
}

function pointByDistanceExpression(file: IfcFile, basisCurve: EntityInstance): EntityInstance {
	// DistanceAlong, OffsetLateral, OffsetVertical, OffsetLongitudinal, BasisCurve.
	return file.createEntity("IfcPointByDistanceExpression", 0.0, null, null, null, basisCurve);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))(
	"api.alignment._createOffsetCurveRepresentation (IFC4X3)",
	() => {
		test("throws TypeError for a non-IfcAlignment", () => {
			const file = createTestFile("IFC4X3");
			const notAnAlignment = file.createEntity("IfcSite", guid.new());
			const offset = pointByDistanceExpression(file, realCurve2D(file));

			expect(() => _createOffsetCurveRepresentation(file, notAnAlignment, [offset])).toThrow(TypeError);
		});

		test("throws TypeError when any offset is not an IfcPointByDistanceExpression, checking every element (not just the first)", () => {
			const file = createTestFile("IFC4X3");
			const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
			const validOffset = pointByDistanceExpression(file, realCurve2D(file));
			const invalidOffset = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);

			expect(() => _createOffsetCurveRepresentation(file, alignment, [validOffset, invalidOffset])).toThrow(
				new TypeError("Expected IfcPointByDistanceExpression but got IfcCartesianPoint"),
			);
		});

		// **Was**: "REGRESSION -- blocked reading basis_curve.Dim" (threw `/has no
		// attribute 'Dim'/`), then "always takes the 2D branch today, even for a
		// genuinely-3D basis curve" (a latent correctness bug, `basisCurve.Dim`
		// resolving to `INDETERMINATE`). **UPDATE (Phase EX-2, IFC4X3's own THIRD
		// chunk):** `calc_IfcPoint_Dim` is now ported -- `basisCurve.Dim` now resolves
		// to the REAL dimensionality, so this function now takes the CORRECT branch.
		// This test uses a genuinely 2D basis curve, so "Curve2D" is now the CORRECT
		// answer (not the previous bug's coincidentally-identical-looking wrong
		// answer) -- disambiguated from the correctness bug by the NEW dedicated 3D
		// test right below, which would have failed under the old bug.
		test("2D basis curve -> Curve2D representation (correct branch selection, calc_IfcPoint_Dim ported)", () => {
			const file = createTestFile("IFC4X3");
			const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
			const offset = pointByDistanceExpression(file, realCurve2D(file));

			_createOffsetCurveRepresentation(file, alignment, [offset]);

			const representation = (alignment.get("Representation") as EntityInstance).get(
				"Representations",
			) as EntityInstance[];
			expect(representation).toHaveLength(1);
			expect(representation[0].get("RepresentationType")).toBe("Curve2D");
			const items = representation[0].get("Items") as EntityInstance[];
			expect(items).toHaveLength(1);
			expect(items[0].isA("IfcOffsetCurveByDistances")).toBe(true);
		});

		// NEW (Phase EX-2, IFC4X3's own THIRD chunk): previously impossible to write a
		// passing 3D test at all, since the function always took the 2D branch
		// regardless of input (see the test right above's own updated comment). Proves
		// the latent correctness gap is genuinely fixed, not just coincidentally
		// unchanged.
		test("3D basis curve -> Curve3D representation (correct branch selection, calc_IfcPoint_Dim ported)", () => {
			const file = createTestFile("IFC4X3");
			const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
			const offset = pointByDistanceExpression(file, realCurve3D(file));

			_createOffsetCurveRepresentation(file, alignment, [offset]);

			const representation = (alignment.get("Representation") as EntityInstance).get(
				"Representations",
			) as EntityInstance[];
			expect(representation).toHaveLength(1);
			expect(representation[0].get("RepresentationType")).toBe("Curve3D");
		});
	},
);
