// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/cogo/test_edit_survey_point.py` (src/ifcopenshell-
// python). Real Python's `test_edit_survey_point` calls `edit_survey_point(annotation,
// 20.0, 30.0)` and asserts `Coordinates == pytest.approx((20.0, 30.0))` -- this
// succeeds in real Python because `IfcCartesianPoint.Dim` (a real EXPRESS DERIVED
// attribute) resolves there.
//
// **Updated by Phase EX-2's first chunk** (planning/ifcopenshell-ts/
// 70-express-rules-plan.md): `calc_IfcCartesianPoint_Dim` is one of that chunk's own
// 15 ported functions, now wired into `EntityInstance.get()`'s DERIVE-dispatch path
// (`src/express/rules/ifc2x3.ts`/`src/express/dispatch.ts`) -- `IfcCartesianPoint.Dim`
// now resolves correctly, so `editSurveyPoint`'s previously-always-throwing first
// statement (`item.get("Dim")`) now succeeds, and this test is restored to the real
// Python assertion it always documented as the eventual target (see the previous
// version of this comment, in version control, for the full "BLOCKED" writeup this
// replaces). `editSurveyPoint.ts`'s own header comment is updated the same way.
//
// Real Python's own fixture builds its precondition via `add_survey_point`, which is
// STILL blocked in this port by the SAME foundational kind of gap, via a DIFFERENT
// derived attribute this chunk does NOT port (`IfcGeometricRepresentationSubContext
// .WorldCoordinateSystem` -- see `addSurveyPoint.ts`'s own header comment, unchanged) --
// so, matching `assignSurveyPoint.test.ts`'s own established precedent, this fixture is
// still built directly with `file.createEntity(...)` calls instead of via
// `addSurveyPoint`.
//
// Not gated to IFC4X3 (unlike `addSurveyPoint.test.ts`): `IfcCartesianPoint.Dim`'s
// formula is schema-independent (this chunk's own scope is IFC2X3 only, but
// `Coordinates`/`Dim`'s shape is identical across all 3 schemas) -- runs across every
// `AVAILABLE_SCHEMAS` entry, though only IFC2X3 actually resolves `Dim` via a real
// ported function today; IFC4/IFC4X3 pick up the identical `calc_IfcCartesianPoint_Dim`
// formula once a future chunk ports it for those schemas too.

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
	function buildFixture() {
		const file = blankProjectFile(schema);
		const context = addContext(file, { contextType: "Model" });
		const point = file.createEntity("IfcCartesianPoint", [50.0, 10.0]);
		const shapeRepresentation = file.createEntity("IfcShapeRepresentation", context, "Annotation", "Point", [point]);
		const representation = file.createEntity("IfcProductDefinitionShape", null, null, [shapeRepresentation]);
		const annotation = file.createEntity("IfcAnnotation", guid.new(), null, null, null, null, null, representation);
		return { file, annotation, point };
	}

	if (schema === "IFC2X3") {
		// `calc_IfcCartesianPoint_Dim` is ported for IFC2X3 only so far (Phase EX-2's
		// first chunk) -- `Dim` resolves, restoring real Python's own assertion.
		test("editing a survey point's location", () => {
			const { annotation, point } = buildFixture();
			editSurveyPoint(annotation, 20.0, 30.0);
			expect((point as unknown as { Coordinates: number[] }).Coordinates).toEqual([20.0, 30.0]);
		});
	} else {
		// IFC4/IFC4X3's own `calc_IfcCartesianPoint_Dim` (byte-for-byte the same formula
		// in real Python) is NOT ported yet (future Phase EX-2 chunks, per
		// `70-express-rules-plan.md`'s own IFC2X3-first sequencing) -- `Dim` still
		// throws exactly as it did before this chunk, for these two schemas only.
		test("editing a survey point's location -- still BLOCKED for this schema (Dim not yet ported for IFC4/IFC4X3)", () => {
			const { annotation } = buildFixture();
			expect(() => editSurveyPoint(annotation, 20.0, 30.0)).toThrow(/has no attribute 'Dim'/);
		});
	}
});
