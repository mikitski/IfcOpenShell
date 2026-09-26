// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/system/test_assign_flow_control.py`
// (src/ifcopenshell-python). `test_run` is ported verbatim.

import { describe, expect, test } from "vitest";
import { assignFlowControl } from "../../../src/api/system/assignFlowControl";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.system.assignFlowControl (%s)", (schema) => {
	test("assigning flow control", () => {
		const file = createTestFile(schema);
		const flowElement = file.createEntity("IfcFlowSegment");
		const flowControl = file.createEntity("IfcDistributionControlElement");

		// Simple assignment.
		const relation = assignFlowControl(file, {
			relatedFlowControl: flowControl,
			relatingFlowElement: flowElement,
		});
		expect(file.byType("IfcRelFlowControlElements").length).toBe(1);
		expect((relation?.get("RelatingFlowElement") as EntityInstance).equals(flowElement)).toBe(true);
		const relatedControlElements = relation?.get("RelatedControlElements") as EntityInstance[];
		expect(relatedControlElements.length).toBe(1);
		expect(relatedControlElements[0].equals(flowControl)).toBe(true);

		// Trying to establish an existing relationship.
		const relation0 = assignFlowControl(file, {
			relatedFlowControl: flowControl,
			relatingFlowElement: flowElement,
		});
		expect(relation0?.equals(relation as EntityInstance)).toBe(true);

		// Assigning the same control to another object.
		const flowElement1 = file.createEntity("IfcFlowSegment");
		const relationNone = assignFlowControl(file, {
			relatedFlowControl: flowControl,
			relatingFlowElement: flowElement1,
		});
		expect(relationNone).toBeUndefined();

		// Assigning another control to the same object.
		const flowControl1 = file.createEntity("IfcDistributionControlElement");
		const relation2 = assignFlowControl(file, {
			relatedFlowControl: flowControl1,
			relatingFlowElement: flowElement,
		});
		expect(file.byType("IfcRelFlowControlElements").length).toBe(1);
		expect((relation2?.get("RelatingFlowElement") as EntityInstance).equals(flowElement)).toBe(true);
		const finalControls = relation2?.get("RelatedControlElements") as EntityInstance[];
		expect(finalControls.length).toBe(2);
		expect(finalControls.some((e) => e.equals(flowControl))).toBe(true);
		expect(finalControls.some((e) => e.equals(flowControl1))).toBe(true);
	});
});
