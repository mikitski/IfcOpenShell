// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `_create_polyline_representation.py`
// (confirmed by reading the whole real test directory). Original test coverage
// written here, gated to IFC4X3. This file is independently BLOCKED (see
// `../../../src/api/alignment/_createPolylineRepresentation.ts`'s own header comment)
// by the SAME pre-existing `entityInstance.ts` EXPRESS DERIVED-attribute gap as
// `_createOffsetCurveRepresentation.test.ts`, via a different attribute/class
// (`IfcCartesianPoint.Dim`) -- the fully portable alignment-type-check branch gets a
// real, passing test, and the disclosed throw gets a dedicated regression test.

import { describe, expect, test } from "vitest";
import { _createPolylineRepresentation } from "../../../src/api/alignment/_createPolylineRepresentation";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._createPolylineRepresentation (IFC4X3)", () => {
	test("throws TypeError for a non-IfcAlignment", () => {
		const file: IfcFile = createTestFile("IFC4X3");
		const notAnAlignment = file.createEntity("IfcSite", guid.new());
		const point = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);

		expect(() => _createPolylineRepresentation(file, notAnAlignment, [point])).toThrow(TypeError);
	});

	test("REGRESSION -- blocked reading points[0].Dim (IfcCartesianPoint.Dim is a real EXPRESS DERIVED attribute, not a stored one -- see TODOS.md's api.cogo.editSurveyPoint entry)", () => {
		const file: IfcFile = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const points = [
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcCartesianPoint", [1.0, 1.0]),
		];

		expect(() => _createPolylineRepresentation(file, alignment, points)).toThrow(/has no attribute 'Dim'/);
	});
});
