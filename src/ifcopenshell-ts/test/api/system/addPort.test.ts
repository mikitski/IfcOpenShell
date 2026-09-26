// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/system/test_add_port.py` (src/ifcopenshell-python). Both
// `test_run`/`test_assigning_a_port_as_well_if_an_element_is_specified` are ported
// verbatim.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addPort } from "../../../src/api/system/addPort";
import * as systemUtil from "../../../src/util/system";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.system.addPort (%s)", (schema) => {
	test("adding a port", () => {
		const file = createTestFile(schema);

		const port = addPort(file, {});

		expect(port.isA("IfcDistributionPort")).toBe(true);
	});

	test("assigning a port as well if an element is specified", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcFlowTerminal" });

		const port = addPort(file, { element });

		const ports = systemUtil.getPorts(element);
		expect(ports.length).toBe(1);
		expect(ports[0].equals(port)).toBe(true);
	});
});
