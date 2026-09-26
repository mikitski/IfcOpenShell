// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/system/test_unassign_port.py` (src/ifcopenshell-python).
// `test_assigning_a_port_once_only` (that Python test file's own, slightly
// misleadingly-named test method -- it actually exercises `unassign_port`, not
// `assign_port` a second time) is ported verbatim.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { assignPort } from "../../../src/api/system/assignPort";
import { unassignPort } from "../../../src/api/system/unassignPort";
import * as systemUtil from "../../../src/util/system";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.system.unassignPort (%s)", (schema) => {
	test("unassigning a port", () => {
		const file = createTestFile(schema);
		const port = file.createEntity("IfcDistributionPort");
		const element = createEntity(file, { ifcClass: "IfcFlowSegment" });
		assignPort(file, { element, port });

		unassignPort(file, { element, port });

		expect(systemUtil.getPorts(element)).toEqual([]);
	});
});
