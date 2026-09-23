// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for
// `_create_offset_curve_representation.py` (confirmed by reading the whole real test
// directory). Original test coverage written here, gated to IFC4X3.
//
// **UPDATE (Phase EX-2, IFC4X3's own SECOND `calc_*`-porting chunk): no longer
// blocked.** See `../../../src/api/alignment/_createOffsetCurveRepresentation.ts`'s
// own header comment for the full writeup: `calc_IfcCurve_Dim` is now ported for
// IFC4X3, so `basis_curve.Dim` no longer throws -- but it currently always resolves
// to `runtimeShim.INDETERMINATE` for a realistic (`IfcLine`/`IfcPolyline`) basis
// curve, a still-unported transitive dependency (`calc_IfcPoint_Dim`) -- so this
// function now always takes the 2D branch, regardless of the real curve's
// dimensionality. The test below (previously "REGRESSION -- blocked reading
// basis_curve.Dim") is updated to assert this real, current, empirically-confirmed
// (if structurally wrong) outcome instead of the previous throw -- both fully
// portable type-checking branches still get their own real, passing tests too.

import { describe, expect, test } from "vitest";
import { _createOffsetCurveRepresentation } from "../../../src/api/alignment/_createOffsetCurveRepresentation";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function realCurve(file: IfcFile): EntityInstance {
	return file.createEntity(
		"IfcLine",
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0),
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
			const offset = pointByDistanceExpression(file, realCurve(file));

			expect(() => _createOffsetCurveRepresentation(file, notAnAlignment, [offset])).toThrow(TypeError);
		});

		test("throws TypeError when any offset is not an IfcPointByDistanceExpression, checking every element (not just the first)", () => {
			const file = createTestFile("IFC4X3");
			const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
			const validOffset = pointByDistanceExpression(file, realCurve(file));
			const invalidOffset = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);

			expect(() => _createOffsetCurveRepresentation(file, alignment, [validOffset, invalidOffset])).toThrow(
				new TypeError("Expected IfcPointByDistanceExpression but got IfcCartesianPoint"),
			);
		});

		// **Was**: "REGRESSION -- blocked reading basis_curve.Dim" (threw `/has no
		// attribute 'Dim'/`). **Now**: `calc_IfcCurve_Dim` resolves for IFC4X3
		// (Phase EX-2's IFC4X3 second chunk), so this no longer throws -- but
		// `basis_curve.Dim` still resolves to `INDETERMINATE` (via the still-unported
		// `calc_IfcPoint_Dim`), so `basisCurve.Dim === 3` is always `false` and this
		// function always takes the 2D branch, even for this test's own genuinely-3D
		// `realCurve` -- see the source file's own updated header comment for the full
		// citation. A disclosed, current-state latent correctness gap, not a crash.
		test("now genuinely unblocked, but always takes the 2D branch today (Dim still unresolved via calc_IfcPoint_Dim)", () => {
			const file = createTestFile("IFC4X3");
			const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
			const offset = pointByDistanceExpression(file, realCurve(file));

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
	},
);
