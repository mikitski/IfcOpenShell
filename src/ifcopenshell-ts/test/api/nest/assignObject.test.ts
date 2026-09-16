// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/nest/test_assign_object.py` (src/ifcopenshell-python).
// All 7 real Python test methods are ported. Real Python only runs this suite against
// IFC4 (`TestAssignObject`) and IFC2X3 (`TestAssignObjectIFC2X3`, via multiple
// inheritance) -- this port extends coverage to all of `AVAILABLE_SCHEMAS` (IFC4X3
// included), matching `../aggregate/assignObject.test.ts`'s own established precedent
// for the structurally-identical sibling function.

import { beforeEach, describe, expect, test } from "vitest";
import { assignObject as assignAggregateObject } from "../../../src/api/aggregate/assignObject";
import { assignObject } from "../../../src/api/nest/assignObject";
import { ownerSettings } from "../../../src/api/owner/settings";
import { assignContainer } from "../../../src/api/spatial/assignContainer";
import type { EntityInstance } from "../../../src/entityInstance";
import { getAggregate, getContainer, getNest } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS)("api.nest.assignObject (%s)", (schema) => {
	test("assigning a nesting", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcTask");
		const subelement1 = file.createEntity("IfcTask");
		const subelement2 = file.createEntity("IfcTask");

		const rel = assignObject(file, { relatedObjects: [subelement1, subelement2], relatingObject: element });

		expect(getNest(subelement1)?.equals(element)).toBe(true);
		expect(getNest(subelement2)?.equals(element)).toBe(true);
		expect(rel?.isA("IfcRelNests")).toBe(true);
	});

	test("doing nothing if the nesting is already assigned", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcTask");
		const subelement = file.createEntity("IfcTask");
		assignObject(file, { relatedObjects: [subelement], relatingObject: element });
		const totalElements = [...file].length;

		assignObject(file, { relatedObjects: [subelement], relatingObject: element });

		expect([...file].length).toBe(totalElements);
	});

	test("old nesting relationships are updated if they still have elements", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcTask");
		const element2 = file.createEntity("IfcTask");
		const subelement1 = file.createEntity("IfcTask");
		const subelement2 = file.createEntity("IfcTask");
		assignObject(file, { relatedObjects: [subelement1, subelement2], relatingObject: element1 });
		const rel =
			schema === "IFC2X3"
				? (subelement1.get("Decomposes") as EntityInstance[])[0]
				: (subelement1.get("Nests") as EntityInstance[])[0];
		expect((rel.get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		assignObject(file, { relatedObjects: [subelement1], relatingObject: element2 });

		expect((rel.get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});

	test("old nesting relationships are purged if no more elements are nested", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcTask");
		const element2 = file.createEntity("IfcTask");
		const subelement1 = file.createEntity("IfcTask");
		assignObject(file, { relatedObjects: [subelement1], relatingObject: element1 });
		const relId = (
			schema === "IFC2X3"
				? (subelement1.get("Decomposes") as EntityInstance[])[0]
				: (subelement1.get("Nests") as EntityInstance[])[0]
		).id();

		assignObject(file, { relatedObjects: [subelement1], relatingObject: element2 });

		expect(() => file.byId(relId)).toThrow();
	});

	test("maintain assignment order in related objects", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcTask");
		const subelements = Array.from({ length: 5 }, () => file.createEntity("IfcTask"));
		let rel: EntityInstance | undefined;
		for (let i = 0; i < 5; i++) {
			assignObject(file, { relatedObjects: subelements.slice(0, i + 1), relatingObject: element });
			rel = file.byType("IfcRelNests")[0];
			const related = rel.get("RelatedObjects") as EntityInstance[];
			expect(related.map((o) => o.id())).toEqual(subelements.slice(0, i + 1).map((o) => o.id()));
		}

		// Maintain the order in the affected relationships too.
		const element2 = file.createEntity("IfcTask");
		assignObject(file, { relatedObjects: subelements.slice(2, 3), relatingObject: element2 });
		const expectedOrder = [...subelements.slice(0, 2), ...subelements.slice(3)];
		const relatedAfter = (rel as EntityInstance).get("RelatedObjects") as EntityInstance[];
		expect(relatedAfter.map((o) => o.id())).toEqual(expectedOrder.map((o) => o.id()));
	});

	test("nesting removes spatial containment", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const subelement = file.createEntity("IfcWall");
		const storey = file.createEntity("IfcBuildingStorey");
		assignContainer(file, { products: [subelement], relatingStructure: storey });
		expect(getContainer(subelement)?.equals(storey)).toBe(true);

		assignObject(file, { relatedObjects: [subelement], relatingObject: element });

		expect(getContainer(subelement)).toBeNull();
	});

	test("nesting removes aggregate", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const subelement = file.createEntity("IfcWall");
		const assembly = file.createEntity("IfcElementAssembly");
		assignAggregateObject(file, { products: [subelement], relatingObject: assembly });
		expect(getAggregate(subelement)?.equals(assembly)).toBe(true);

		assignObject(file, { relatedObjects: [subelement], relatingObject: element });

		expect(getAggregate(subelement)).toBeNull();
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---
//
// Mirrors `../aggregate/assignObject.test.ts`'s own established precedent for the
// structurally-identical "surgery" shape (detach from an old rel, attach to a new
// one): undo must restore the OLD relationship exactly, and redo must reproduce the
// same surgery again.

describe.each(AVAILABLE_SCHEMAS)("api.nest.assignObject Transaction/undo-redo (%s)", (schema) => {
	test("undo removes a freshly-created nest rel; redo recreates it", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcTask");
		const subelement = file.createEntity("IfcTask");

		file.beginTransaction();
		assignObject(file, { relatedObjects: [subelement], relatingObject: element });
		file.endTransaction();

		const relId = (
			schema === "IFC2X3"
				? (subelement.get("Decomposes") as EntityInstance[])[0]
				: (subelement.get("Nests") as EntityInstance[])[0]
		).id();
		expect(getNest(subelement)?.equals(element)).toBe(true);

		file.undo();
		expect(() => file.byId(relId)).toThrow();
		expect(getNest(subelement)).toBeNull();

		file.redo();
		expect(file.byId(relId).isA("IfcRelNests")).toBe(true);
		expect(getNest(subelement)?.equals(element)).toBe(true);
	});

	test("replacing an existing nest: undo restores the OLD rel (with its OLD membership)", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcTask");
		const element2 = file.createEntity("IfcTask");
		const subelement1 = file.createEntity("IfcTask");
		const subelement2 = file.createEntity("IfcTask");

		assignObject(file, { relatedObjects: [subelement1, subelement2], relatingObject: element1 });
		const oldRel =
			schema === "IFC2X3"
				? (subelement1.get("Decomposes") as EntityInstance[])[0]
				: (subelement1.get("Nests") as EntityInstance[])[0];
		const oldRelId = oldRel.id();

		file.beginTransaction();
		const newRel = assignObject(file, { relatedObjects: [subelement1], relatingObject: element2 });
		file.endTransaction();

		const newRelId = (newRel as EntityInstance).id();
		expect(getNest(subelement1)?.equals(element2)).toBe(true);
		expect(getNest(subelement2)?.equals(element1)).toBe(true);
		expect((file.byId(oldRelId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		file.undo();

		expect(() => file.byId(newRelId)).toThrow();
		const restoredOldRel = file.byId(oldRelId);
		expect(restoredOldRel.isA("IfcRelNests")).toBe(true);
		const restoredRelated = restoredOldRel.get("RelatedObjects") as EntityInstance[];
		expect(restoredRelated.length).toBe(2);
		expect(getNest(subelement1)?.equals(element1)).toBe(true);
		expect(getNest(subelement2)?.equals(element1)).toBe(true);

		file.redo();

		expect(getNest(subelement1)?.equals(element2)).toBe(true);
		expect(getNest(subelement2)?.equals(element1)).toBe(true);
		expect(file.byId(newRelId).isA("IfcRelNests")).toBe(true);
	});
});
