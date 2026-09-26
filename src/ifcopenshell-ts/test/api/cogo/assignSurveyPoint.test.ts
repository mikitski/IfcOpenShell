// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/cogo/test_assign_survey_point.py` (src/ifcopenshell-
// python). `assignSurveyPoint` itself is fully unblocked (see `assignSurveyPoint.ts`'s
// own header comment) -- but real Python's own fixture builds its precondition via
// `add_survey_point`, which IS blocked in this port (throws reading a real EXPRESS
// DERIVED attribute -- see `addSurveyPoint.ts`'s own header comment). This test
// therefore builds the SAME `IfcAnnotation`/`IfcProductDefinitionShape`/
// `IfcShapeRepresentation` shape `addSurveyPoint` itself would produce directly with
// `file.createEntity(...)` calls instead of calling it, omitting only the 2 fields
// `assignSurveyPoint` never reads (`ObjectPlacement`, `PredefinedType`) -- giving this
// function's own real behavior a genuine passing test, not a "throws" pin.
//
// Not gated to IFC4X3 (unlike `addSurveyPoint.test.ts`/`editSurveyPoint.test.ts`):
// `assignSurveyPoint` has no schema dependency of its own at all -- the real IFC4X3-
// only constraint (`IfcAnnotation.PredefinedType`) is specific to `addSurveyPoint`'s
// own `createEntity` call, which this fixture deliberately doesn't reproduce (since
// `assignSurveyPoint` never reads that field) -- so this suite runs across every
// `AVAILABLE_SCHEMAS` entry, broader coverage than the real Python test file's own
// `IFC4X3_AVAILABLE`-only gate (which exists there only because of ITS OWN
// `add_survey_point`-based fixture, not because `assign_survey_point` needs IFC4X3).

import { describe, expect, test } from "vitest";
import { assignSurveyPoint } from "../../../src/api/cogo/assignSurveyPoint";
import { addContext } from "../../../src/api/context/addContext";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

/** Reproduces the exact `IfcAnnotation`/`IfcProductDefinitionShape`/
 * `IfcShapeRepresentation` shape real `add_survey_point`/`addSurveyPoint` would
 * produce, minus the 2 fields `assignSurveyPoint` never reads (`ObjectPlacement`,
 * `PredefinedType`) -- see this file's own header comment for why. */
function buildSurveyPointAnnotation(
	file: IfcFile,
	point: EntityInstance,
): { annotation: EntityInstance; shapeRepresentation: EntityInstance } {
	const context = addContext(file, { contextType: "Model" });
	const shapeRepresentation = file.createEntity("IfcShapeRepresentation", context, "Annotation", "Point", [point]);
	const representation = file.createEntity("IfcProductDefinitionShape", null, null, [shapeRepresentation]);
	const annotation = file.createEntity("IfcAnnotation", guid.new(), null, null, null, null, null, representation);
	return { annotation, shapeRepresentation };
}

function blankProjectFile(schema: Schema): IfcFile {
	const file = createTestFile(schema);
	stripProjectBootstrap(file);
	file.createEntity("IfcProject");
	return file;
}

describe.each(AVAILABLE_SCHEMAS)("api.cogo.assignSurveyPoint (%s)", (schema) => {
	test("assigning a new coordinate point to a survey point annotation", () => {
		const file = blankProjectFile(schema);
		const { annotation, shapeRepresentation } = buildSurveyPointAnnotation(
			file,
			file.createEntity("IfcCartesianPoint", [50.0, 10.0]),
		);
		expect((shapeRepresentation.get("Items") as EntityInstance[])[0].get("Coordinates")).toEqual([50.0, 10.0]);

		assignSurveyPoint(annotation, file.createEntity("IfcCartesianPoint", [20.0, 30.0, 40.0]));
		expect((shapeRepresentation.get("Items") as EntityInstance[])[0].get("Coordinates")).toEqual([20.0, 30.0, 40.0]);
	});
});
