// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/aggregate/test_assign_object.py` (src/ifcopenshell-
// python). 6 of the real 7 Python test methods are ported:
// `test_assigning_an_aggregate`, `test_doing_nothing_if_the_aggregate_is_already_assigned`,
// `test_that_old_aggregate_relationships_are_updated_if_they_still_have_elements`,
// `test_that_old_aggregate_relationships_are_purged_if_no_more_elements_are_contained`,
// `test_not_updating_placement_if_placement_is_not_relative` (unaffected by the disclosed
// `geometry.edit_object_placement` gap -- see `assignObject.ts`'s own header comment and
// `TODOS.md`), and `test_removing_containment_if_it_exists` (exercises the "aggregation
// and containment are mutually exclusive" invariant from the aggregate side, reusing the
// already-landed `spatial.assignContainer` for real, exactly as real Python's own setup
// does -- no adaptation needed, unlike `assignContainer.test.ts`'s own
// `test_removing_aggregation_if_it_exists`, which had to work around the *then*-unported
// `aggregate.assign_object`).
//
// `test_assigning_a_container_does_not_shift_object_placements` is NOT ported: its own
// setup calls `ifcopenshell.api.geometry.edit_object_placement` directly, and its
// assertion specifically exercises `assignObject`'s own (disclosed, unported)
// placement-relocalization step -- see `assignObject.ts`'s header comment and `TODOS.md`
// for the full disclosure.
//
// `ifcopenshell.api.unit.assign_unit` (called in several of real Python's test setups,
// an entirely unrelated, also-unported `api.unit` module) is dropped throughout --
// nothing in any ported test's own assertions depends on a unit assignment existing.

import { beforeEach, describe, expect, test } from "vitest";
import { assignObject } from "../../../src/api/aggregate/assignObject";
import { ownerSettings } from "../../../src/api/owner/settings";
import { assignContainer } from "../../../src/api/spatial/assignContainer";
import type { EntityInstance } from "../../../src/entityInstance";
import { getAggregate, getContainer } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS)("api.aggregate.assignObject (%s)", (schema) => {
	test("assigning an aggregate", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcSite");
		const subelement1 = file.createEntity("IfcBuilding");
		const subelement2 = file.createEntity("IfcBuilding");

		const rel = assignObject(file, { products: [subelement1, subelement2], relatingObject: element });

		expect(getAggregate(subelement1)?.equals(element)).toBe(true);
		expect(getAggregate(subelement2)?.equals(element)).toBe(true);
		expect(rel?.isA("IfcRelAggregates")).toBe(true);
	});

	test("doing nothing if the aggregate is already assigned", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcSite");
		const subelement = file.createEntity("IfcBuilding");
		assignObject(file, { products: [subelement], relatingObject: element });
		const totalElements = [...file].length;

		assignObject(file, { products: [subelement], relatingObject: element });

		expect([...file].length).toBe(totalElements);
	});

	test("old aggregate relationships are updated if they still have elements", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcSite");
		const element2 = file.createEntity("IfcSite");
		const subelement1 = file.createEntity("IfcBuilding");
		const subelement2 = file.createEntity("IfcBuilding");
		assignObject(file, { products: [subelement1], relatingObject: element1 });
		assignObject(file, { products: [subelement2], relatingObject: element1 });
		const rel = (subelement1.get("Decomposes") as EntityInstance[])[0];
		expect((rel.get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		assignObject(file, { products: [subelement1], relatingObject: element2 });

		expect((rel.get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});

	test("old aggregate relationships are purged if no more elements are contained", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcSite");
		const element2 = file.createEntity("IfcSite");
		const subelement1 = file.createEntity("IfcBuilding");
		assignObject(file, { products: [subelement1], relatingObject: element1 });
		const relId = (subelement1.get("Decomposes") as EntityInstance[])[0].id();

		assignObject(file, { products: [subelement1], relatingObject: element2 });

		expect(() => file.byId(relId)).toThrow();
	});

	test("not updating placement if placement is not relative", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcSite");
		const subelement = file.createEntity("IfcBuilding");
		const placement = file.createEntity("IfcGridPlacement");
		subelement.set("ObjectPlacement", placement);

		assignObject(file, { products: [subelement], relatingObject: element });

		expect((subelement.get("ObjectPlacement") as EntityInstance).equals(placement)).toBe(true);
	});

	test("removing containment if it exists", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcElementAssembly");
		const container = file.createEntity("IfcBuildingStorey");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: container });

		assignObject(file, { products: [subelement], relatingObject: element });

		expect(getContainer(subelement, true)).toBeNull();
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---
//
// The "replace an existing aggregate" surgery case gets the most scrutiny here, per this
// project's own established discipline for a "surgery" function that both deletes an old
// relationship and creates/edits a new one in the same call -- undo must restore the OLD
// relationship exactly (not merely delete the new one), and redo must reproduce the same
// surgery again. Mirrors `assignContainer.test.ts`'s own Transaction/undo-redo suite for
// the structurally-identical containment case.

describe.each(AVAILABLE_SCHEMAS)("api.aggregate.assignObject Transaction/undo-redo (%s)", (schema) => {
	test("undo removes a freshly-created aggregate rel; redo recreates it", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcSite");
		const subelement = file.createEntity("IfcBuilding");

		file.beginTransaction();
		assignObject(file, { products: [subelement], relatingObject: element });
		file.endTransaction();

		const relId = (subelement.get("Decomposes") as EntityInstance[])[0].id();
		expect(getAggregate(subelement)?.equals(element)).toBe(true);

		file.undo();
		expect(() => file.byId(relId)).toThrow();
		expect(getAggregate(subelement)).toBeNull();

		file.redo();
		expect(file.byId(relId).isA("IfcRelAggregates")).toBe(true);
		expect(getAggregate(subelement)?.equals(element)).toBe(true);
	});

	test("replacing an existing aggregate: undo restores the OLD rel (with its OLD membership), not just deletes the new one", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcSite");
		const element2 = file.createEntity("IfcSite");
		const subelement1 = file.createEntity("IfcBuilding");
		const subelement2 = file.createEntity("IfcBuilding");

		// subelement1 and subelement2 both start aggregated under element1.
		assignObject(file, { products: [subelement1, subelement2], relatingObject: element1 });
		const oldRel = (subelement1.get("Decomposes") as EntityInstance[])[0];
		const oldRelId = oldRel.id();

		// Reassign subelement1 to element2 -- this is the "surgery": oldRel gets
		// rewritten (subelement1 dropped, subelement2 remains) and a new rel is created
		// linking subelement1 to element2.
		file.beginTransaction();
		const newRel = assignObject(file, { products: [subelement1], relatingObject: element2 });
		file.endTransaction();

		const newRelId = (newRel as EntityInstance).id();
		expect(getAggregate(subelement1)?.equals(element2)).toBe(true);
		expect(getAggregate(subelement2)?.equals(element1)).toBe(true);
		expect((file.byId(oldRelId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		file.undo();

		// The new rel must be gone...
		expect(() => file.byId(newRelId)).toThrow();
		// ...and the OLD rel must be restored with BOTH original members, not just have
		// subelement1 vanish into thin air.
		const restoredOldRel = file.byId(oldRelId);
		expect(restoredOldRel.isA("IfcRelAggregates")).toBe(true);
		const restoredRelated = restoredOldRel.get("RelatedObjects") as EntityInstance[];
		expect(restoredRelated.length).toBe(2);
		expect(restoredRelated.some((e) => e.equals(subelement1))).toBe(true);
		expect(restoredRelated.some((e) => e.equals(subelement2))).toBe(true);
		expect(getAggregate(subelement1)?.equals(element1)).toBe(true);
		expect(getAggregate(subelement2)?.equals(element1)).toBe(true);

		file.redo();

		// Redo reproduces the same surgery: subelement1 back in element2, subelement2
		// still solely in element1's (rewritten) old rel.
		expect(getAggregate(subelement1)?.equals(element2)).toBe(true);
		expect(getAggregate(subelement2)?.equals(element1)).toBe(true);
		expect((file.byId(oldRelId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);
		expect(file.byId(newRelId).isA("IfcRelAggregates")).toBe(true);
	});

	test("replacing an existing aggregate down to zero members: undo restores the PURGED old rel", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcSite");
		const element2 = file.createEntity("IfcSite");
		const subelement = file.createEntity("IfcBuilding");

		assignObject(file, { products: [subelement], relatingObject: element1 });
		const oldRelId = (subelement.get("Decomposes") as EntityInstance[])[0].id();

		file.beginTransaction();
		assignObject(file, { products: [subelement], relatingObject: element2 });
		file.endTransaction();

		expect(() => file.byId(oldRelId)).toThrow();
		expect(getAggregate(subelement)?.equals(element2)).toBe(true);

		file.undo();

		expect(file.byId(oldRelId).isA("IfcRelAggregates")).toBe(true);
		expect(getAggregate(subelement)?.equals(element1)).toBe(true);

		file.redo();

		expect(() => file.byId(oldRelId)).toThrow();
		expect(getAggregate(subelement)?.equals(element2)).toBe(true);
	});

	test("undo restores containment (and removes the aggregate) when unassign_container's surgery is undone", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcElementAssembly");
		const container = file.createEntity("IfcBuildingStorey");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: container });
		const containerRelId = (subelement.get("ContainedInStructure") as EntityInstance[])[0].id();

		file.beginTransaction();
		assignObject(file, { products: [subelement], relatingObject: element });
		file.endTransaction();

		expect(() => file.byId(containerRelId)).toThrow();
		expect(getContainer(subelement, true)).toBeNull();
		expect(getAggregate(subelement)?.equals(element)).toBe(true);

		file.undo();

		expect(file.byId(containerRelId).isA("IfcRelContainedInSpatialStructure")).toBe(true);
		expect(getContainer(subelement, true)?.equals(container)).toBe(true);
		expect(getAggregate(subelement)).toBeNull();

		file.redo();

		expect(() => file.byId(containerRelId)).toThrow();
		expect(getContainer(subelement, true)).toBeNull();
		expect(getAggregate(subelement)?.equals(element)).toBe(true);
	});
});
