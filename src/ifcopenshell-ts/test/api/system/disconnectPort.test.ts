// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/system/test_disconnect_port.py` (src/ifcopenshell-python).
// `test_disconnecting_a_port` is ported verbatim.

import { describe, expect, test } from "vitest";
import { addPort } from "../../../src/api/system/addPort";
import { connectPort } from "../../../src/api/system/connectPort";
import { disconnectPort } from "../../../src/api/system/disconnectPort";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.system.disconnectPort (%s)", (schema) => {
	test("disconnecting a port", () => {
		const file = createTestFile(schema);
		const port = addPort(file, {});
		const port2 = addPort(file, {});
		connectPort(file, { port1: port, port2: port2, direction: "NOTDEFINED" });

		disconnectPort(file, { port });

		expect(port.get("FlowDirection")).toBeNull();
		expect(port2.get("FlowDirection")).toBeNull();
		expect(file.byType("IfcRelConnectsPorts").length).toBe(0);
	});
});
