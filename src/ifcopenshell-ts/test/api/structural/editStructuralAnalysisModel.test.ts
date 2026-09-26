// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/structural/test_edit_structural_analysis_model.py`
// (src/ifcopenshell-python) -- `test_editing_a_structural_analysis_model` ported
// verbatim, extended from real Python's own IFC4/IFC2X3-only coverage to all of
// `AVAILABLE_SCHEMAS` including IFC4X3.

import { describe, expect, test } from "vitest";
import { addStructuralAnalysisModel } from "../../../src/api/structural/addStructuralAnalysisModel";
import { editStructuralAnalysisModel } from "../../../src/api/structural/editStructuralAnalysisModel";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.editStructuralAnalysisModel (%s)", (schema) => {
	test("editing a structural analysis model", () => {
		const file = createTestFile(schema);
		const subject = addStructuralAnalysisModel(file, {});

		editStructuralAnalysisModel(file, {
			structuralAnalysisModel: subject,
			attributes: { Name: "My edited model", Description: "Description of my model" },
		});

		const models = file.byType("IfcStructuralAnalysisModel");
		expect(subject.equals(models[0])).toBe(true);
		expect(subject.isA("IfcStructuralAnalysisModel")).toBe(true);
		expect(subject.get("Name")).toBe("My edited model");
		expect(subject.get("Description")).toBe("Description of my model");
	});
});
