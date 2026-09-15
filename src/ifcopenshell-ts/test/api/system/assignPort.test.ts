// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/system/test_assign_port.py` (src/ifcopenshell-python).
// `test_assigning_a_port_once_only` is ported verbatim (a bare
// `file.createEntity("IfcDistributionPort")` port has no `ObjectPlacement`, so
// `updatePortPlacement` no-ops -- see `../../../src/api/system/assignPort.ts`'s own
// header comment). `test_updating_the_placement_to_be_relative_if_it_exists` needs
// `ifcopenshell.api.geometry.edit_object_placement` (not ported anywhere in this
// project) both to set up its own fixture AND to exercise the real assertion --
// replaced with a dedicated disclosed-throw regression test instead, matching this
// project's established pattern (see e.g. `../root/copyClass.test.ts`'s own
// "throws the disclosed blocked error" tests). See `TODOS.md`.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { assignPort } from "../../../src/api/system/assignPort";
import type { EntityInstance } from "../../../src/entityInstance";
import * as systemUtil from "../../../src/util/system";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.system.assignPort (%s)", (schema) => {
	test("assigning a port once only", () => {
		const file = createTestFile(schema);
		const port = file.createEntity("IfcDistributionPort");
		const element = createEntity(file, { ifcClass: "IfcFlowSegment" });

		assignPort(file, { element, port });

		if (file.schema === "IFC2X3") {
			const hasPorts = element.get("HasPorts") as EntityInstance[];
			expect((hasPorts[0].get("RelatingPort") as EntityInstance).equals(port)).toBe(true);
		} else {
			const isNestedBy = element.get("IsNestedBy") as EntityInstance[];
			const relatedObjects = isNestedBy[0].get("RelatedObjects") as EntityInstance[];
			expect(relatedObjects.length).toBe(1);
			expect(relatedObjects[0].equals(port)).toBe(true);
		}
		expect(systemUtil.getPorts(element).length).toBe(1);
		expect(systemUtil.getPorts(element)[0].equals(port)).toBe(true);

		assignPort(file, { element, port });
		expect(systemUtil.getPorts(element).length).toBe(1);
		expect(systemUtil.getPorts(element)[0].equals(port)).toBe(true);
	});

	test("throws the disclosed blocked error when the port already has an IfcLocalPlacement (needs api.geometry.editObjectPlacement)", () => {
		const file = createTestFile(schema);
		const port = file.createEntity("IfcDistributionPort");
		const axis = file.createEntity("IfcAxis2Placement3D");
		const placement = file.createEntity("IfcLocalPlacement", null, axis);
		port.set("ObjectPlacement", placement);
		const element = createEntity(file, { ifcClass: "IfcFlowSegment" });

		expect(() => assignPort(file, { element, port })).toThrow(/editObjectPlacement/);
	});
});
