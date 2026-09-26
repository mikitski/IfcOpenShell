// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/system/test_unassign_system.py` (src/ifcopenshell-python).
// `test_unassign_system` is ported verbatim.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addSystem } from "../../../src/api/system/addSystem";
import { assignSystem } from "../../../src/api/system/assignSystem";
import { unassignSystem } from "../../../src/api/system/unassignSystem";
import * as systemUtil from "../../../src/util/system";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.system.unassignSystem (%s)", (schema) => {
	test("unassigning a system", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcFlowSegment" });
		const element2 = createEntity(file, { ifcClass: "IfcFlowSegment" });
		const element3 = createEntity(file, { ifcClass: "IfcFlowSegment" });
		const system = addSystem(file, {});
		assignSystem(file, { products: [element, element2, element3], system });

		unassignSystem(file, { products: [element2, element3], system });
		expect(systemUtil.getSystemElements(system).length).toBe(1);
		expect(systemUtil.getSystemElements(system)[0].equals(element)).toBe(true);

		unassignSystem(file, { products: [element], system });
		expect(systemUtil.getSystemElements(system)).toEqual([]);
	});
});
