// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/structural/test_add_structural_analysis_model.py`
// (src/ifcopenshell-python) -- `test_adding_a_structural_analysis_model` ported
// verbatim, extended from real Python's own IFC4/IFC2X3-only coverage
// (`TestAddStructuralAnalysisModel`/`TestAddStructuralAnalysisModelIFC2X3`) to all of
// `AVAILABLE_SCHEMAS` including IFC4X3.

import { describe, expect, test } from "vitest";
import { addStructuralAnalysisModel } from "../../../src/api/structural/addStructuralAnalysisModel";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.addStructuralAnalysisModel (%s)", (schema) => {
	test("adding a structural analysis model", () => {
		const file = createTestFile(schema);

		const subject = addStructuralAnalysisModel(file, {});

		const models = file.byType("IfcStructuralAnalysisModel");
		expect(subject.equals(models[0])).toBe(true);
		expect(subject.isA("IfcStructuralAnalysisModel")).toBe(true);
		expect(subject.get("PredefinedType")).toBe("LOADING_3D");
	});
});
