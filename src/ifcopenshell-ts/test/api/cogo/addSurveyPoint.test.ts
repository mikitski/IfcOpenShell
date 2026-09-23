// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/cogo/test_add_survey_point.py` (src/ifcopenshell-python).
// Real Python's `test_add_survey_point` calls `add_survey_point(file, ...)` and
// asserts a fully-built `IfcAnnotation` (`PredefinedType`, `RepresentationIdentifier`/
// `RepresentationType`/`Coordinates`) -- this succeeds in real Python because
// `IfcGeometricRepresentationSubContext.WorldCoordinateSystem` (a real EXPRESS
// DERIVED attribute, derived from `ParentContext.WorldCoordinateSystem`) resolves
// there.
//
// **UPDATE (Phase EX-2, IFC4X3's own SECOND chunk,
// planning/ifcopenshell-ts/70-express-rules-plan.md §4): this gap is now closed.**
// `calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem` is one of that
// chunk's own 15 ported functions (`src/express/rules/ifc4x3.ts`) -- `context
// .get("WorldCoordinateSystem")` now resolves instead of throwing, for the ONLY
// schema this function is ever exercised on (`IfcAnnotation.PredefinedType` is
// IFC4X3-only, see below), so `addSurveyPoint` now succeeds end to end, restoring
// real Python's own success assertion verbatim -- re-verified directly against a
// locally-built multi-schema native addon (not assumed from the dependency chain
// alone): `PredefinedType === "SURVEY"`, `RepresentationIdentifier === "Annotation"`,
// `RepresentationType === "Point"`, `Items[0].Coordinates === [50, 10]`. The
// previously-disclosed-blocked `ObjectPlacement=context.WorldCoordinateSystem`
// "wrong type" quirk (`addSurveyPoint.ts`'s own header comment, still there) is real
// but harmless here since neither real Python's own test nor this one inspects
// `ObjectPlacement` -- confirmed it resolves to a real `IfcAxis2Placement3D` (the
// context's own `WorldCoordinateSystem`), not an actual `IfcLocalPlacement`, matching
// the disclosed quirk exactly, not silently worked around.
//
// Real Python's fixture is a bare `ifcopenshell.file(schema="IFC4X3")` (NOT
// `test.bootstrap`'s richer template fixture) -- this port matches that exactly via
// `api.project.createFile` (the TS port of `ifcopenshell.api.project.create_file`,
// itself a thin wrapper over a bare schema-only file, per `bootstrap.ts`'s own
// `stripProjectBootstrap` doc comment), not `createTestFile`.
//
// Gated to IFC4X3 only, matching real Python's own `@pytest.mark.skipif(not
// IFC4X3_AVAILABLE, ...)` -- `IfcAnnotation.PredefinedType` doesn't exist on
// IFC2X3/IFC4 at all (a separate, additional, genuine schema constraint on top of the
// DERIVED-attribute gap above -- see `addSurveyPoint.ts`'s own header comment). Uses
// `describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))` (this project's established
// convention for a single-schema-gated file, e.g. `test/util/schema.test.ts`), NOT
// `describe.each(AVAILABLE_SCHEMAS.filter(...))` -- the latter registers ZERO blocks
// (not one, skipped) when the filtered array is empty, which is exactly what happens
// on CI's own IFC4-only native build (`AVAILABLE_SCHEMAS = ["IFC4"]`), and vitest
// treats a file with no registered test suite at all as a collection-time error
// ("No test suite found in file"), not a graceful 0-tests/skip result. `skipIf`
// always registers this file's one `describe` block -- just marked skipped when the
// condition fails -- so the file is never empty.

import { describe, expect, test } from "vitest";
import { assignObject } from "../../../src/api/aggregate/assignObject";
import { addSurveyPoint } from "../../../src/api/cogo/addSurveyPoint";
import { addContext } from "../../../src/api/context/addContext";
import { createFile } from "../../../src/api/project/createFile";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.cogo.addSurveyPoint (IFC4X3)", () => {
	test("adding a survey point (now genuinely unblocked: WorldCoordinateSystem resolves via Phase EX-2's IFC4X3 second chunk)", () => {
		const file = createFile(undefined, { version: "IFC4X3" });
		const project = file.createEntity("IfcProject", null, null, "Test");
		const site = file.createEntity("IfcSite", guid.new(), null, "MySite");
		assignObject(file, { relatingObject: project, products: [site] });
		const geometricRepresentationContext = addContext(file, { contextType: "Model" });
		addContext(file, {
			contextType: "Model",
			contextIdentifier: "Annotation",
			targetView: "MODEL_VIEW",
			parent: geometricRepresentationContext,
		});

		// Real Python: `annotation = add_survey_point(file, file.createIfcCartesianPoint((50.0,
		// 10.0)))`, then asserts `annotation.PredefinedType == "SURVEY"`,
		// `Representation.Representations[0].RepresentationIdentifier == "Annotation"`,
		// `.RepresentationType == "Point"`, `.Items[0].Coordinates == pytest.approx((50.0,
		// 10.0))` -- restored verbatim, see this file's own header comment.
		const annotation = addSurveyPoint(file, file.createEntity("IfcCartesianPoint", [50.0, 10.0]));
		expect(annotation).toBeTruthy();
		expect(annotation.get("PredefinedType")).toBe("SURVEY");
		const representation = annotation.get("Representation").get("Representations")[0];
		expect(representation.get("RepresentationIdentifier")).toBe("Annotation");
		expect(representation.get("RepresentationType")).toBe("Point");
		expect(representation.get("Items")[0].get("Coordinates")).toEqual([50.0, 10.0]);
	});
});
