// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/system/test_unassign_flow_control.py`
// (src/ifcopenshell-python). `test_run` is ported verbatim.

import { describe, expect, test } from "vitest";
import { assignFlowControl } from "../../../src/api/system/assignFlowControl";
import { unassignFlowControl } from "../../../src/api/system/unassignFlowControl";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.system.unassignFlowControl (%s)", (schema) => {
	test("assign and unassign", () => {
		const file = createTestFile(schema);
		const flowElement = file.createEntity("IfcFlowSegment");
		const flowControl = file.createEntity("IfcDistributionControlElement");

		assignFlowControl(file, { relatedFlowControl: flowControl, relatingFlowElement: flowElement });
		unassignFlowControl(file, { relatedFlowControl: flowControl, relatingFlowElement: flowElement });

		expect(file.byType("IfcRelFlowControlElements").length).toBe(0);
	});

	test("1 element 2 controls", () => {
		const file = createTestFile(schema);
		const flowElement = file.createEntity("IfcFlowSegment");
		const flowControl = file.createEntity("IfcDistributionControlElement");
		const flowControl1 = file.createEntity("IfcDistributionControlElement");

		const relation = assignFlowControl(file, { relatedFlowControl: flowControl, relatingFlowElement: flowElement });
		assignFlowControl(file, { relatedFlowControl: flowControl1, relatingFlowElement: flowElement });

		unassignFlowControl(file, { relatedFlowControl: flowControl1, relatingFlowElement: flowElement });

		expect(file.byType("IfcRelFlowControlElements").length).toBe(1);
		const relatedControlElements = relation?.get("RelatedControlElements") as EntityInstance[];
		expect(relatedControlElements.length).toBe(1);
		expect(relatedControlElements[0].equals(flowControl)).toBe(true);
	});
});
