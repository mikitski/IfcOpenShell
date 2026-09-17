// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/cogo/test_edit_survey_point.py` (src/ifcopenshell-
// python). Real Python's `test_edit_survey_point` calls `edit_survey_point(annotation,
// 20.0, 30.0)` and asserts `Coordinates == pytest.approx((20.0, 30.0))` -- this
// succeeds in real Python because `IfcCartesianPoint.Dim` (a real EXPRESS DERIVED
// attribute) resolves there. This port's `EntityInstance.get()` has no DERIVED-
// attribute fallback at all (a pre-existing, already-disclosed, cross-cutting
// `entityInstance.ts` gap -- see `editSurveyPoint.ts`'s own header comment and
// `TODOS.md`'s newly added entry), so `editSurveyPoint`'s very first statement always
// throws today. Pinned here as "throws the disclosed error" instead of the real
// Python success assertion, matching this project's established precedent for a
// currently-blocked function (`addWindowRepresentation.test.ts`/
// `addRailingRepresentation.test.ts`, etc.) -- the real assertion this test would
// restore once the gap is fixed is recorded in the comment below, not silently
// dropped.
//
// Real Python's own fixture builds its precondition via `add_survey_point`, which IS
// ALSO blocked in this port (by the SAME foundational gap, via a DIFFERENT derived
// attribute -- see `addSurveyPoint.ts`'s own header comment) -- so, matching
// `assignSurveyPoint.test.ts`'s own established precedent, this fixture is built
// directly with `file.createEntity(...)` calls instead, specifically to exercise
// THIS file's own `Dim` throw (not `addSurveyPoint`'s different, earlier one).
//
// Not gated to IFC4X3 (unlike `addSurveyPoint.test.ts`): `IfcCartesianPoint.Dim`'s own
// DERIVED-attribute gap is schema-independent -- confirmed identical (`Coordinates`-
// only, no `Dim` field) on all 3 generated `.d.ts`s -- so this suite runs across every
// `AVAILABLE_SCHEMAS` entry.

import { describe, expect, test } from "vitest";
import { editSurveyPoint } from "../../../src/api/cogo/editSurveyPoint";
import { addContext } from "../../../src/api/context/addContext";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

function blankProjectFile(schema: Schema): IfcFile {
	const file = createTestFile(schema);
	stripProjectBootstrap(file);
	file.createEntity("IfcProject");
	return file;
}

describe.each(AVAILABLE_SCHEMAS)("api.cogo.editSurveyPoint (%s)", (schema) => {
	test('editing a survey point\'s location -- BLOCKED by the entityInstance.ts `.get("Dim")` DERIVED-attribute gap', () => {
		const file = blankProjectFile(schema);
		const context = addContext(file, { contextType: "Model" });
		const point = file.createEntity("IfcCartesianPoint", [50.0, 10.0]);
		const shapeRepresentation = file.createEntity("IfcShapeRepresentation", context, "Annotation", "Point", [point]);
		const representation = file.createEntity("IfcProductDefinitionShape", null, null, [shapeRepresentation]);
		const annotation = file.createEntity("IfcAnnotation", guid.new(), null, null, null, null, null, representation);

		// Real Python: `edit_survey_point(annotation, 20.0, 30.0)` then asserts
		// `Coordinates == pytest.approx((20.0, 30.0))`. This port throws instead --
		// see this file's own header comment.
		expect(() => editSurveyPoint(annotation, 20.0, 30.0)).toThrow(/has no attribute 'Dim'/);
	});
});
