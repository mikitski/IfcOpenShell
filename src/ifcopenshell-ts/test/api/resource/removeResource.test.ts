// This file was generated with the assistance of an AI coding tool.
//
// `test/api/resource/test_remove_resource.py` is just a comment: "remove_resource
// tests is partially covered by test_add_resource_quantity." -- i.e. real Python has
// no dedicated cascade test of its own (only the `BaseQuantity` purge, already
// exercised indirectly by `./addResourceQuantity.test.ts`'s own `removeResource` calls
// in its cleanup loop). This suite covers the rest of `remove_resource.py`'s own
// inverse-cascade behavior directly (nesting parent/child cascade, control-assignment
// splice, resource-assignment cascade), matching this project's established precedent
// for functions Python itself doesn't directly test (see `../../../src/api/resource/
// removeResource.ts`'s own header comment for the full behavior being pinned here).

import { beforeEach, describe, expect, test } from "vitest";
import { assignControl } from "../../../src/api/control/assignControl";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import { assignResource } from "../../../src/api/resource/assignResource";
import { removeResource } from "../../../src/api/resource/removeResource";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.resource.removeResource (%s)", (schema) => {
	test("removing a leaf resource with no relationships", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		const resourceId = resource.id();

		removeResource(file, { resource });

		expect(() => file.byId(resourceId)).toThrow();
	});

	test("removing a parent resource also recursively removes its nested children", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const crew = addResource(file, { ifcClass: "IfcCrewResource" });
		const labour = addResource(file, { parentResource: crew, ifcClass: "IfcLaborResource" });
		const equipment = addResource(file, {
			parentResource: crew,
			ifcClass: "IfcConstructionEquipmentResource",
		});
		const labourId = labour.id();
		const equipmentId = equipment.id();
		const crewId = crew.id();

		removeResource(file, { resource: crew });

		expect(() => file.byId(crewId)).toThrow();
		expect(() => file.byId(labourId)).toThrow();
		expect(() => file.byId(equipmentId)).toThrow();
	});

	test("removing the sole nested child of another resource removes the now-empty nest rel", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const crew = addResource(file, { ifcClass: "IfcCrewResource" });
		const labour = addResource(file, { parentResource: crew, ifcClass: "IfcLaborResource" });

		removeResource(file, { resource: labour });

		expect(file.byType("IfcRelNests").length).toBe(0);
		expect(crew.isA("IfcCrewResource")).toBe(true);
	});

	test("removing one of several nested children leaves the nest rel intact (auto-spliced)", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const crew = addResource(file, { ifcClass: "IfcCrewResource" });
		const labour1 = addResource(file, { parentResource: crew, ifcClass: "IfcLaborResource" });
		const labour2 = addResource(file, { parentResource: crew, ifcClass: "IfcLaborResource" });

		removeResource(file, { resource: labour1 });

		expect(file.byType("IfcRelNests").length).toBe(1);
		expect(labour2.isA("IfcLaborResource")).toBe(true);
	});

	test("removing a resource that is the sole related object of an IfcRelAssignsToControl removes the rel", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		const control = file.createEntity("IfcCostSchedule");
		assignControl(file, { relatingControl: control, relatedObjects: [resource] });

		removeResource(file, { resource });

		expect(file.byType("IfcRelAssignsToControl").length).toBe(0);
	});

	test("removing a resource assigned to a control alongside another object splices it out", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource1 = addResource(file, { ifcClass: "IfcLaborResource" });
		const resource2 = addResource(file, { ifcClass: "IfcLaborResource" });
		const control = file.createEntity("IfcCostSchedule");
		const rel = assignControl(file, { relatingControl: control, relatedObjects: [resource1, resource2] });

		removeResource(file, { resource: resource1 });

		expect(file.byType("IfcRelAssignsToControl").length).toBe(1);
		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(1);
		expect(relatedObjects[0].equals(resource2)).toBe(true);
	});

	test("removing a resource that owns object assignments unassigns each one first", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcConstructionEquipmentResource" });
		const product1 = createEntity(file, { ifcClass: "IfcBuildingElementProxy" });
		const product2 = createEntity(file, { ifcClass: "IfcBuildingElementProxy" });
		assignResource(file, { relatingResource: resource, relatedObject: product1 });
		assignResource(file, { relatingResource: resource, relatedObject: product2 });

		removeResource(file, { resource });

		expect(file.byType("IfcRelAssignsToResource").length).toBe(0);
		expect(product1.isA("IfcBuildingElementProxy")).toBe(true);
		expect(product2.isA("IfcBuildingElementProxy")).toBe(true);
	});

	test("removing a resource that is the sole related object of another resource's assignment rel removes it", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const owner = addResource(file, { ifcClass: "IfcConstructionEquipmentResource" });
		const dependent = addResource(file, { ifcClass: "IfcLaborResource" });
		assignResource(file, { relatingResource: owner, relatedObject: dependent });

		removeResource(file, { resource: dependent });

		expect(file.byType("IfcRelAssignsToResource").length).toBe(0);
		expect(owner.isA("IfcConstructionEquipmentResource")).toBe(true);
	});
});
