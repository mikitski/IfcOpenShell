// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/structural/test_assign_structural_analysis_model.py`
// (src/ifcopenshell-python) -- `test_assigning_a_structural_analysis_model` ported
// verbatim, extended from real Python's own IFC4/IFC2X3-only coverage to all of
// `AVAILABLE_SCHEMAS` including IFC4X3.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addStructuralAnalysisModel } from "../../../src/api/structural/addStructuralAnalysisModel";
import { assignStructuralAnalysisModel } from "../../../src/api/structural/assignStructuralAnalysisModel";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.assignStructuralAnalysisModel (%s)", (schema) => {
	test("assigning a structural analysis model", () => {
		const file = createTestFile(schema);
		const subject = addStructuralAnalysisModel(file, {});
		const product = createEntity(file, { ifcClass: "IfcStructuralMember", predefinedType: null, name: null });

		const rel = assignStructuralAnalysisModel(file, {
			products: [product],
			structuralAnalysisModel: subject,
		});

		expect(rel).toBeDefined();
		expect(rel?.isA("IfcRelAssignsToGroup")).toBe(true);
		expect((rel?.get("RelatingGroup") as typeof subject).equals(subject)).toBe(true);
		expect((rel?.get("RelatedObjects") as unknown[]).length).toBe(1);
		expect((rel?.get("RelatedObjects") as (typeof product)[])[0].equals(product)).toBe(true);
	});
});
