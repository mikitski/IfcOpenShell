// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/system/test_connect_port.py` (src/ifcopenshell-python).
// All 7 test methods are ported verbatim.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addPort } from "../../../src/api/system/addPort";
import { connectPort } from "../../../src/api/system/connectPort";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.system.connectPort (%s)", (schema) => {
	test("connecting a port", () => {
		const file = createTestFile(schema);
		const port = addPort(file, {});
		const port2 = addPort(file, {});

		connectPort(file, { port1: port, port2: port2 });

		expect(((port.get("ConnectedTo") as EntityInstance[])[0].get("RelatedPort") as EntityInstance).equals(port2)).toBe(
			true,
		);
		expect(
			((port2.get("ConnectedFrom") as EntityInstance[])[0].get("RelatingPort") as EntityInstance).equals(port),
		).toBe(true);
		expect(((port2.get("ConnectedTo") as EntityInstance[])[0].get("RelatedPort") as EntityInstance).equals(port)).toBe(
			true,
		);
		expect(
			((port.get("ConnectedFrom") as EntityInstance[])[0].get("RelatingPort") as EntityInstance).equals(port2),
		).toBe(true);
		expect(port.get("FlowDirection")).toBe("NOTDEFINED");
		expect(port2.get("FlowDirection")).toBe("NOTDEFINED");
		expect(file.byType("IfcRelConnectsPorts").length).toBe(2);
	});

	test("not connecting a port twice", () => {
		const file = createTestFile(schema);
		const port = addPort(file, {});
		const port2 = addPort(file, {});

		connectPort(file, { port1: port, port2: port2 });
		connectPort(file, { port1: port, port2: port2 });
		connectPort(file, { port1: port2, port2: port });

		expect(((port.get("ConnectedTo") as EntityInstance[])[0].get("RelatedPort") as EntityInstance).equals(port2)).toBe(
			true,
		);
		expect(
			((port2.get("ConnectedFrom") as EntityInstance[])[0].get("RelatingPort") as EntityInstance).equals(port),
		).toBe(true);
		expect(((port2.get("ConnectedTo") as EntityInstance[])[0].get("RelatedPort") as EntityInstance).equals(port)).toBe(
			true,
		);
		expect(
			((port.get("ConnectedFrom") as EntityInstance[])[0].get("RelatingPort") as EntityInstance).equals(port2),
		).toBe(true);
		expect(port.get("FlowDirection")).toBe("NOTDEFINED");
		expect(port2.get("FlowDirection")).toBe("NOTDEFINED");
		expect(file.byType("IfcRelConnectsPorts").length).toBe(2);
	});

	test("connecting a port from source to sink", () => {
		const file = createTestFile(schema);
		const port = addPort(file, {});
		const port2 = addPort(file, {});

		connectPort(file, { port1: port, port2: port2, direction: "SOURCE" });

		expect(((port.get("ConnectedTo") as EntityInstance[])[0].get("RelatedPort") as EntityInstance).equals(port2)).toBe(
			true,
		);
		expect(
			((port2.get("ConnectedFrom") as EntityInstance[])[0].get("RelatingPort") as EntityInstance).equals(port),
		).toBe(true);
		expect(port.get("FlowDirection")).toBe("SOURCE");
		expect(port2.get("FlowDirection")).toBe("SINK");
		expect(file.byType("IfcRelConnectsPorts").length).toBe(1);
	});

	test("connecting a port from sink to source", () => {
		const file = createTestFile(schema);
		const port = addPort(file, {});
		const port2 = addPort(file, {});

		connectPort(file, { port1: port, port2: port2, direction: "SINK" });

		expect(((port2.get("ConnectedTo") as EntityInstance[])[0].get("RelatedPort") as EntityInstance).equals(port)).toBe(
			true,
		);
		expect(
			((port.get("ConnectedFrom") as EntityInstance[])[0].get("RelatingPort") as EntityInstance).equals(port2),
		).toBe(true);
		expect(port.get("FlowDirection")).toBe("SINK");
		expect(port2.get("FlowDirection")).toBe("SOURCE");
		expect(file.byType("IfcRelConnectsPorts").length).toBe(1);
	});

	test("connecting a port as both source and sink", () => {
		const file = createTestFile(schema);
		const port = addPort(file, {});
		const port2 = addPort(file, {});

		connectPort(file, { port1: port, port2: port2, direction: "SOURCEANDSINK" });

		expect(((port.get("ConnectedTo") as EntityInstance[])[0].get("RelatedPort") as EntityInstance).equals(port2)).toBe(
			true,
		);
		expect(
			((port2.get("ConnectedFrom") as EntityInstance[])[0].get("RelatingPort") as EntityInstance).equals(port),
		).toBe(true);
		expect(((port2.get("ConnectedTo") as EntityInstance[])[0].get("RelatedPort") as EntityInstance).equals(port)).toBe(
			true,
		);
		expect(
			((port.get("ConnectedFrom") as EntityInstance[])[0].get("RelatingPort") as EntityInstance).equals(port2),
		).toBe(true);
		expect(port.get("FlowDirection")).toBe("SOURCEANDSINK");
		expect(port2.get("FlowDirection")).toBe("SOURCEANDSINK");
		expect(file.byType("IfcRelConnectsPorts").length).toBe(2);
	});

	test("ports can only connect to one port at a time", () => {
		const file = createTestFile(schema);
		const port = addPort(file, {});
		const port2 = addPort(file, {});
		const port3 = addPort(file, {});
		connectPort(file, { port1: port, port2: port3, direction: "SOURCEANDSINK" });

		connectPort(file, { port1: port, port2: port2, direction: "SOURCE" });

		expect(((port.get("ConnectedTo") as EntityInstance[])[0].get("RelatedPort") as EntityInstance).equals(port2)).toBe(
			true,
		);
		expect(
			((port2.get("ConnectedFrom") as EntityInstance[])[0].get("RelatingPort") as EntityInstance).equals(port),
		).toBe(true);
		expect(port.get("FlowDirection")).toBe("SOURCE");
		expect(port2.get("FlowDirection")).toBe("SINK");
		expect(file.byType("IfcRelConnectsPorts").length).toBe(1);
		expect(port3.get("ConnectedTo")).toEqual([]);
		expect(port3.get("ConnectedFrom")).toEqual([]);
	});

	test("changing a port from source and sink to only source", () => {
		const file = createTestFile(schema);
		const port = addPort(file, {});
		const port2 = addPort(file, {});
		connectPort(file, { port1: port, port2: port2, direction: "SOURCEANDSINK" });

		connectPort(file, { port1: port, port2: port2, direction: "SOURCE" });

		expect(((port.get("ConnectedTo") as EntityInstance[])[0].get("RelatedPort") as EntityInstance).equals(port2)).toBe(
			true,
		);
		expect(
			((port2.get("ConnectedFrom") as EntityInstance[])[0].get("RelatingPort") as EntityInstance).equals(port),
		).toBe(true);
		expect(port.get("FlowDirection")).toBe("SOURCE");
		expect(port2.get("FlowDirection")).toBe("SINK");
		expect(file.byType("IfcRelConnectsPorts").length).toBe(1);
	});

	test("connecting ports with a realising element", () => {
		const file = createTestFile(schema);
		const port = addPort(file, {});
		const port2 = addPort(file, {});
		const element = createEntity(file, { ifcClass: "IfcFlowFitting" });

		connectPort(file, { port1: port, port2: port2, element });
		expect((file.byType("IfcRelConnectsPorts")[0].get("RealizingElement") as EntityInstance).equals(element)).toBe(
			true,
		);

		connectPort(file, { port1: port, port2: port2 });
		expect(file.byType("IfcRelConnectsPorts")[0].get("RealizingElement")).toBeNull();
	});
});
