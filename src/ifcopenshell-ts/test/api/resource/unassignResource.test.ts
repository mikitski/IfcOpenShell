// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `unassign_resource.py` (see `test/api/resource/` --
// no `test_unassign_resource.py`), only the docstring's own worked example. This suite
// is written directly from the real source's own behavior.

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import { assignResource } from "../../../src/api/resource/assignResource";
import { unassignResource } from "../../../src/api/resource/unassignResource";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.resource.unassignResource (%s)", (schema) => {
	test("unassigning the sole related object removes the rel entirely", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcCrewResource" });
		const product = createEntity(file, { ifcClass: "IfcBuildingElementProxy" });
		assignResource(file, { relatingResource: resource, relatedObject: product });

		unassignResource(file, { relatingResource: resource, relatedObject: product });

		expect(file.byType("IfcRelAssignsToResource").length).toBe(0);
	});

	test("unassigning one of several related objects keeps the rel, splicing it out", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcCrewResource" });
		const product1 = createEntity(file, { ifcClass: "IfcBuildingElementProxy" });
		const product2 = createEntity(file, { ifcClass: "IfcBuildingElementProxy" });
		assignResource(file, { relatingResource: resource, relatedObject: product1 });
		const rel = assignResource(file, { relatingResource: resource, relatedObject: product2 });

		unassignResource(file, { relatingResource: resource, relatedObject: product1 });

		expect(file.byType("IfcRelAssignsToResource").length).toBe(1);
		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(1);
		expect(relatedObjects[0].equals(product2)).toBe(true);
	});

	test("does nothing if the object isn't assigned to this resource", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcCrewResource" });
		const product = createEntity(file, { ifcClass: "IfcBuildingElementProxy" });

		// Should not throw.
		unassignResource(file, { relatingResource: resource, relatedObject: product });

		expect(file.byType("IfcRelAssignsToResource").length).toBe(0);
	});
});
