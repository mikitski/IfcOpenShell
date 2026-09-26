// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/system/test_assign_system.py` (src/ifcopenshell-python).
// Both `test_assign_system`/`test_exception_on_unassignable_elements` are ported
// verbatim.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addSystem } from "../../../src/api/system/addSystem";
import { assignSystem } from "../../../src/api/system/assignSystem";
import * as systemUtil from "../../../src/util/system";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.system.assignSystem (%s)", (schema) => {
	test("assigning a system", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcFlowSegment" });
		const element2 = createEntity(file, { ifcClass: "IfcFlowSegment" });
		const system = addSystem(file, {});

		assignSystem(file, { products: [element, element2], system });

		expect(file.byType("IfcRelAssignsToGroup").length).toBe(1);
		const systemElements = systemUtil.getSystemElements(system);
		const flowSegments = file.byType("IfcFlowSegment");
		expect(systemElements.length).toBe(flowSegments.length);
		for (const flowSegment of flowSegments) {
			expect(systemElements.some((e) => e.equals(flowSegment))).toBe(true);
		}
	});

	test("exception on unassignable elements", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcFlowSegment" });
		const proj = file.createEntity("IfcProject");
		const system = addSystem(file, {});

		expect(() => assignSystem(file, { products: [element, proj], system })).toThrow();
		expect(() => assignSystem(file, { products: [element], system: proj })).toThrow();
	});
});
