// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/structural/test_remove_structural_analysis_model.py`
// (src/ifcopenshell-python) -- `test_removing_a_structural_analysis_model` ported
// verbatim, extended from real Python's own IFC4/IFC2X3-only coverage to all of
// `AVAILABLE_SCHEMAS` including IFC4X3.

import { describe, expect, test } from "vitest";
import { addStructuralAnalysisModel } from "../../../src/api/structural/addStructuralAnalysisModel";
import { removeStructuralAnalysisModel } from "../../../src/api/structural/removeStructuralAnalysisModel";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.removeStructuralAnalysisModel (%s)", (schema) => {
	test("removing a structural analysis model", () => {
		const file = createTestFile(schema);
		const subject = addStructuralAnalysisModel(file, {});

		removeStructuralAnalysisModel(file, { structuralAnalysisModel: subject });

		const models = file.byType("IfcStructuralAnalysisModel");
		expect(models.length).toBe(0);
	});
});
