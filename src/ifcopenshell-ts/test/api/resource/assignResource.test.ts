// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/resource/test_assign_resource.py` (src/ifcopenshell-
// python). Both real Python test methods are ported. Real Python only runs this
// against IFC4 (`IfcConstructionResource`/`IfcRelAssignsToResource` are IFC4+-only
// classes) -- extended to IFC4/IFC4X3 here (IFC2X3 excluded, matching real Python's
// own class hierarchy and `test_calculate_resource_work.py`'s own comment: "resource
// module features relies on entities introduced in IFC4").

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import { assignResource } from "../../../src/api/resource/assignResource";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.resource.assignResource (%s)", (schema) => {
	test("assigning a new object to a resource", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcCrewResource" });
		const actor = createEntity(file, { ifcClass: "IfcActor" });

		const rel = assignResource(file, { relatingResource: resource, relatedObject: actor });

		expect(rel.isA("IfcRelAssignsToResource")).toBe(true);
		expect((rel.get("RelatingResource") as EntityInstance).equals(resource)).toBe(true);
		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(1);
		expect(relatedObjects[0].equals(actor)).toBe(true);
	});

	test("assigning the same object twice does not duplicate related objects", () => {
		// Regression test for the real upstream #8203 bug -- see `../../../src/api/
		// resource/assignResource.ts`'s own header comment: the duplicate guard is
		// correctly spelled in the source version this port reads from.
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcCrewResource" });
		const actor = createEntity(file, { ifcClass: "IfcActor" });

		const rel1 = assignResource(file, { relatingResource: resource, relatedObject: actor });
		const rel2 = assignResource(file, { relatingResource: resource, relatedObject: actor });

		expect(rel1.equals(rel2)).toBe(true);
		expect(file.byType("IfcRelAssignsToResource").length).toBe(1);
		const relatedObjects = rel2.get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(1);
		expect(relatedObjects[0].equals(actor)).toBe(true);
	});
});
