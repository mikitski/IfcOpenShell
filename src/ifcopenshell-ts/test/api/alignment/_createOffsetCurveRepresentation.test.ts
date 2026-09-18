// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for
// `_create_offset_curve_representation.py` (confirmed by reading the whole real test
// directory). Original test coverage written here, gated to IFC4X3. This file is
// independently BLOCKED (see `../../../src/api/alignment/_createOffsetCurveRepresentation
// .ts`'s own header comment) by the pre-existing `entityInstance.ts` EXPRESS
// DERIVED-attribute gap (`basis_curve.Dim` is never a stored attribute) -- both fully
// portable type-checking branches get real, passing tests, and the disclosed throw
// gets a dedicated regression test.

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

		test("REGRESSION -- blocked reading basis_curve.Dim (IfcCurve.Dim is a real EXPRESS DERIVED attribute, not a stored one -- see TODOS.md)", () => {
			const file = createTestFile("IFC4X3");
			const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
			const offset = pointByDistanceExpression(file, realCurve(file));

			expect(() => _createOffsetCurveRepresentation(file, alignment, [offset])).toThrow(/has no attribute 'Dim'/);
		});
	},
);
