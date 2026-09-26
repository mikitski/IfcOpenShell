// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/resource/test_remove_resource_quantity.py` (src/
// ifcopenshell-python). Both real Python test methods are ported. Real Python runs
// this against IFC4 and IFC2X3 -- extended to all of `AVAILABLE_SCHEMAS` here.

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import { addResourceQuantity } from "../../../src/api/resource/addResourceQuantity";
import { removeResourceQuantity } from "../../../src/api/resource/removeResourceQuantity";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS)("api.resource.removeResourceQuantity (%s)", (schema) => {
	test("removing a resource quantity", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		addResourceQuantity(file, { resource, ifcClass: "IfcQuantityTime" });
		expect(resource.get("BaseQuantity")).not.toBeNull();

		removeResourceQuantity(file, { resource });

		expect(resource.get("BaseQuantity")).toBeNull();
		expect(file.byType("IfcPhysicalSimpleQuantity").length).toBe(0);
	});

	test("removing a resource quantity when none exists", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });

		// Should not raise.
		removeResourceQuantity(file, { resource });

		expect(resource.get("BaseQuantity")).toBeNull();
	});
});
