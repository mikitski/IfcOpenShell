// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/structural/test_unassign_structural_analysis_model.py`
// (src/ifcopenshell-python) -- `test_unassigning_a_structural_analysis_model` ported
// verbatim, extended from real Python's own IFC4/IFC2X3-only coverage to all of
// `AVAILABLE_SCHEMAS` including IFC4X3.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addStructuralAnalysisModel } from "../../../src/api/structural/addStructuralAnalysisModel";
import { assignStructuralAnalysisModel } from "../../../src/api/structural/assignStructuralAnalysisModel";
import { unassignStructuralAnalysisModel } from "../../../src/api/structural/unassignStructuralAnalysisModel";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.unassignStructuralAnalysisModel (%s)", (schema) => {
	test("unassigning a structural analysis model", () => {
		const file = createTestFile(schema);
		const subject = addStructuralAnalysisModel(file, {});
		const product = createEntity(file, { ifcClass: "IfcStructuralMember", predefinedType: null, name: null });
		assignStructuralAnalysisModel(file, { products: [product], structuralAnalysisModel: subject });

		unassignStructuralAnalysisModel(file, { products: [product], structuralAnalysisModel: subject });

		const models = file.byType("IfcStructuralAnalysisModel");
		const rels = file.byType("IfcRelAssignsToGroup");
		expect((models[0].get("IsGroupedBy") as unknown[]).length).toBe(0);
		expect(rels.length).toBe(0);
	});
});
