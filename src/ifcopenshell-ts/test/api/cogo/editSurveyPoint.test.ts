// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/cogo/test_edit_survey_point.py` (src/ifcopenshell-
// python). Real Python's `test_edit_survey_point` calls `edit_survey_point(annotation,
// 20.0, 30.0)` and asserts `Coordinates == pytest.approx((20.0, 30.0))` -- this
// succeeds in real Python because `IfcCartesianPoint.Dim` (a real EXPRESS DERIVED
// attribute) resolves there.
//
// **Updated by Phase EX-2's IFC2X3 first chunk** (planning/ifcopenshell-ts/
// 70-express-rules-plan.md): `calc_IfcCartesianPoint_Dim` is one of that chunk's own
// 15 ported functions, now wired into `EntityInstance.get()`'s DERIVE-dispatch path
// (`src/express/rules/ifc2x3.ts`/`src/express/dispatch.ts`) -- `IfcCartesianPoint.Dim`
// now resolves correctly, so `editSurveyPoint`'s previously-always-throwing first
// statement (`item.get("Dim")`) now succeeds, and this test is restored to the real
// Python assertion it always documented as the eventual target (see the previous
// version of this comment, in version control, for the full "BLOCKED" writeup this
// replaces). `editSurveyPoint.ts`'s own header comment is updated the same way.
//
// **Updated again by Phase EX-2's IFC4 first chunk** (`src/express/rules/ifc4.ts`):
// that chunk independently ported the exact same 15 function names for IFC4 (confirmed
// byte-identical real Python source for `calc_IfcCartesianPoint_Dim` specifically), so
// `Dim` now resolves for IFC4 too -- the "still BLOCKED" branch below applied to IFC4X3
// only (genuinely still unported) until the update below.
//
// **Updated AGAIN by Phase EX-2's IFC4X3 THIRD chunk** (`src/express/rules/ifc4x3.ts`):
// that chunk ports `calc_IfcPoint_Dim` -- ADD2's own consolidated supertype formula
// `IfcCartesianPoint.Dim` now dispatches through -- so `Dim` now resolves for IFC4X3
// too. The former schema-conditional "still BLOCKED for IFC4X3" test is removed; a
// single, unconditional test now covers all 3 schemas.
//
// Real Python's own fixture builds its precondition via `add_survey_point`, which is
// STILL blocked in this port by the SAME foundational kind of gap, via a DIFFERENT
// derived attribute no chunk has ported yet (`IfcGeometricRepresentationSubContext
// .WorldCoordinateSystem` -- see `addSurveyPoint.ts`'s own header comment, unchanged) --
// so, matching `assignSurveyPoint.test.ts`'s own established precedent, this fixture is
// still built directly with `file.createEntity(...)` calls instead of via
// `addSurveyPoint`.
//
// Not gated to IFC4X3 (unlike `addSurveyPoint.test.ts`): `IfcCartesianPoint.Dim`'s
// formula is schema-independent (`Coordinates`/`Dim`'s shape is identical across all 3
// schemas) -- runs across every `AVAILABLE_SCHEMAS` entry; all 3 schemas now resolve
// `Dim` via their own real ported DERIVE dispatch (`calc_IfcCartesianPoint_Dim` for
// IFC2X3/IFC4, `calc_IfcPoint_Dim` for IFC4X3 -- see this file's own updated header
// comment above).

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

	// **UPDATE (Phase EX-2, IFC4X3's own THIRD chunk, `src/express/rules/ifc4x3.ts`):**
	// `calc_IfcPoint_Dim` is now ported for IFC4X3 too (ADD2's own consolidated
	// supertype formula `IfcCartesianPoint.Dim` dispatches through) -- `Dim` now
	// resolves on IFC4X3 as well, matching IFC2X3's/IFC4's own already-working
	// behavior, so this test now runs unconditionally across every `AVAILABLE_SCHEMAS`
	// entry -- re-verified directly against the real built addon, not assumed. The
	// former schema-conditional "still BLOCKED for IFC4X3" branch is removed.
	test("editing a survey point's location", () => {
		const { annotation, point } = buildFixture();
		editSurveyPoint(annotation, 20.0, 30.0);
		expect((point as unknown as { Coordinates: number[] }).Coordinates).toEqual([20.0, 30.0]);
	});
});
