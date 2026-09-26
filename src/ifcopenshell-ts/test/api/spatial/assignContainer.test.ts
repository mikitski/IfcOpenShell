// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/spatial/test_assign_container.py` (src/ifcopenshell-
// python). 6 of the real 7 Python test methods are ported:
// `test_assigning_a_container`, `test_doing_nothing_if_the_container_is_already_assigned`,
// `test_that_old_containment_relationships_are_updated_if_they_still_contain_elements`,
// `test_that_old_containment_relationships_are_purged_if_no_more_elements_are_contained`,
// `test_not_updating_placement_if_placement_is_not_relative` (this last one is
// unaffected either way by the `geometry.edit_object_placement` gap this file used to
// disclose -- see `assignContainer.ts`'s own header comment), and, now that
// `api.geometry.editObjectPlacement` has landed for real,
// `test_assigning_a_container_does_not_shift_object_placements` (previously NOT
// ported -- see below).
//
// `test_removing_aggregation_if_it_exists` is ported with one disclosed adaptation:
// real Python's setup calls `ifcopenshell.api.aggregate.assign_object` (not ported in
// this chunk -- see `../aggregate/unassignObject.test.ts`'s identical adaptation for
// why); this test creates the precondition `IfcRelAggregates` directly via
// `file.createEntity(...)` instead. `ifcopenshell.api.unit.assign_unit`, also called
// in real Python's setup (an entirely unrelated, also-unported `api.unit` module) is
// dropped -- nothing in this test's own assertion (`get_aggregate` returns null)
// depends on a unit assignment existing.
//
// `test_assigning_a_container_does_not_shift_object_placements` -- RESOLVED, now
// ported for real: real Python's own setup calls `ifcopenshell.api.geometry
// .edit_object_placement` directly (now landed, see `../geometry
// /editObjectPlacement.test.ts`) and its assertion exercises `assignContainer`'s own
// placement-relocalization step (also now landed, see `assignContainer.ts`'s own
// header comment).

import { mat4 } from "gl-matrix";
import { beforeEach, describe, expect, test } from "vitest";
import { editObjectPlacement } from "../../../src/api/geometry/editObjectPlacement";
import { ownerSettings } from "../../../src/api/owner/settings";
import { assignContainer } from "../../../src/api/spatial/assignContainer";
import { assignUnit } from "../../../src/api/unit/assignUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import * as guid from "../../../src/guid";
import { getAggregate, getContainer } from "../../../src/util/element";
import { getLocalPlacement } from "../../../src/util/placement";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

/** See this file's header comment: replaces the unported `aggregate.assign_object` in one test's setup. */
function createAggregatesRel(
	file: ReturnType<typeof createTestFile>,
	relatingObject: EntityInstance,
	relatedObjects: readonly EntityInstance[],
): EntityInstance {
	return file.createEntity("IfcRelAggregates", guid.new(), null, null, null, relatingObject, [...relatedObjects]);
}

describe.each(AVAILABLE_SCHEMAS)("api.spatial.assignContainer (%s)", (schema) => {
	test("assigning a container", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		const subelement2 = file.createEntity("IfcWall");

		const rel = assignContainer(file, { products: [subelement, subelement2], relatingStructure: element });

		expect(getContainer(subelement)?.equals(element)).toBe(true);
		expect(getContainer(subelement2)?.equals(element)).toBe(true);
		expect(rel?.isA("IfcRelContainedInSpatialStructure")).toBe(true);
	});

	test("doing nothing if the container is already assigned", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element });
		const totalElements = [...file].length;

		assignContainer(file, { products: [subelement], relatingStructure: element });

		expect([...file].length).toBe(totalElements);
	});

	test("old containment relationships are updated if they still contain elements", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcBuilding");
		const element2 = file.createEntity("IfcBuilding");
		const subelement1 = file.createEntity("IfcWall");
		const subelement2 = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement1], relatingStructure: element1 });
		assignContainer(file, { products: [subelement2], relatingStructure: element1 });
		const rel = (subelement1.get("ContainedInStructure") as EntityInstance[])[0];
		expect((rel.get("RelatedElements") as EntityInstance[]).length).toBe(2);

		assignContainer(file, { products: [subelement1], relatingStructure: element2 });

		expect((rel.get("RelatedElements") as EntityInstance[]).length).toBe(1);
	});

	test("old containment relationships are purged if no more elements are contained", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcBuilding");
		const element2 = file.createEntity("IfcBuilding");
		const subelement1 = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement1], relatingStructure: element1 });
		const relId = (subelement1.get("ContainedInStructure") as EntityInstance[])[0].id();

		assignContainer(file, { products: [subelement1], relatingStructure: element2 });

		expect(() => file.byId(relId)).toThrow();
	});

	test("assigning a container does not shift object placements", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element1 = file.createEntity("IfcBuilding");
		const element2 = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element1 });

		const matrix1 = mat4.fromTranslation(mat4.create(), [1, 1, 1]);
		const matrix2 = mat4.fromTranslation(mat4.create(), [2, 2, 2]);
		editObjectPlacement(file, { product: element1, matrix: mat4.clone(matrix1), isSi: false });
		editObjectPlacement(file, { product: element2, matrix: mat4.clone(matrix2), isSi: false });
		editObjectPlacement(file, { product: subelement, matrix: mat4.clone(matrix1), isSi: false });

		assignContainer(file, { products: [subelement], relatingStructure: element2 });

		const relTo = (subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance;
		const placesObject = relTo.get("PlacesObject") as EntityInstance[];
		expect(placesObject[0]?.equals(element2)).toBe(true);
		const actual = getLocalPlacement(subelement.get("ObjectPlacement") as EntityInstance);
		for (let i = 0; i < 16; i++) {
			expect(actual[i]).toBeCloseTo(matrix1[i], 9);
		}
	});

	test("not updating placement if placement is not relative", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		const placement = file.createEntity("IfcGridPlacement");
		subelement.set("ObjectPlacement", placement);

		assignContainer(file, { products: [subelement], relatingStructure: element });

		expect((subelement.get("ObjectPlacement") as EntityInstance).equals(placement)).toBe(true);
	});

	test("removing aggregation if it exists", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const aggregate = file.createEntity("IfcElementAssembly");
		const subelement = file.createEntity("IfcWall");
		createAggregatesRel(file, aggregate, [subelement]);

		assignContainer(file, { products: [subelement], relatingStructure: element });

		expect(getAggregate(subelement)).toBeNull();
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---
//
// The "replace an existing containment" surgery case gets the most scrutiny here, per
// this project's own established discipline for a "surgery" function that both deletes
// an old relationship and creates/edits a new one in the same call -- undo must restore
// the OLD relationship exactly (not merely delete the new one), and redo must reproduce
// the same surgery again.

describe.each(AVAILABLE_SCHEMAS)("api.spatial.assignContainer Transaction/undo-redo (%s)", (schema) => {
	test("undo removes a freshly-created containment rel; redo recreates it", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");

		file.beginTransaction();
		assignContainer(file, { products: [subelement], relatingStructure: element });
		file.endTransaction();

		const relId = (subelement.get("ContainedInStructure") as EntityInstance[])[0].id();
		expect(getContainer(subelement)?.equals(element)).toBe(true);

		file.undo();
		expect(() => file.byId(relId)).toThrow();
		expect(getContainer(subelement)).toBeNull();

		file.redo();
		expect(file.byId(relId).isA("IfcRelContainedInSpatialStructure")).toBe(true);
		expect(getContainer(subelement)?.equals(element)).toBe(true);
	});

	test("replacing an existing containment: undo restores the OLD rel (with its OLD membership), not just deletes the new one", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcBuilding");
		const element2 = file.createEntity("IfcBuilding");
		const subelement1 = file.createEntity("IfcWall");
		const subelement2 = file.createEntity("IfcWall");

		// subelement1 and subelement2 both start in element1's containment rel.
		assignContainer(file, { products: [subelement1, subelement2], relatingStructure: element1 });
		const oldRel = (subelement1.get("ContainedInStructure") as EntityInstance[])[0];
		const oldRelId = oldRel.id();

		// Reassign subelement1 to element2 -- this is the "surgery": oldRel gets
		// rewritten (subelement1 dropped, subelement2 remains) and a new rel is created
		// linking subelement1 to element2.
		file.beginTransaction();
		const newRel = assignContainer(file, { products: [subelement1], relatingStructure: element2 });
		file.endTransaction();

		const newRelId = (newRel as EntityInstance).id();
		expect(getContainer(subelement1)?.equals(element2)).toBe(true);
		expect(getContainer(subelement2)?.equals(element1)).toBe(true);
		expect((file.byId(oldRelId).get("RelatedElements") as EntityInstance[]).length).toBe(1);

		file.undo();

		// The new rel must be gone...
		expect(() => file.byId(newRelId)).toThrow();
		// ...and the OLD rel must be restored with BOTH original members, not just
		// have subelement1 vanish into thin air.
		const restoredOldRel = file.byId(oldRelId);
		expect(restoredOldRel.isA("IfcRelContainedInSpatialStructure")).toBe(true);
		const restoredRelated = restoredOldRel.get("RelatedElements") as EntityInstance[];
		expect(restoredRelated.length).toBe(2);
		expect(restoredRelated.some((e) => e.equals(subelement1))).toBe(true);
		expect(restoredRelated.some((e) => e.equals(subelement2))).toBe(true);
		expect(getContainer(subelement1)?.equals(element1)).toBe(true);
		expect(getContainer(subelement2)?.equals(element1)).toBe(true);

		file.redo();

		// Redo reproduces the same surgery: subelement1 back in element2, subelement2
		// still solely in element1's (rewritten) old rel.
		expect(getContainer(subelement1)?.equals(element2)).toBe(true);
		expect(getContainer(subelement2)?.equals(element1)).toBe(true);
		expect((file.byId(oldRelId).get("RelatedElements") as EntityInstance[]).length).toBe(1);
		expect(file.byId(newRelId).isA("IfcRelContainedInSpatialStructure")).toBe(true);
	});

	test("replacing an existing containment down to zero members: undo restores the PURGED old rel", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcBuilding");
		const element2 = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");

		assignContainer(file, { products: [subelement], relatingStructure: element1 });
		const oldRelId = (subelement.get("ContainedInStructure") as EntityInstance[])[0].id();

		file.beginTransaction();
		assignContainer(file, { products: [subelement], relatingStructure: element2 });
		file.endTransaction();

		expect(() => file.byId(oldRelId)).toThrow();
		expect(getContainer(subelement)?.equals(element2)).toBe(true);

		file.undo();

		expect(file.byId(oldRelId).isA("IfcRelContainedInSpatialStructure")).toBe(true);
		expect(getContainer(subelement)?.equals(element1)).toBe(true);

		file.redo();

		expect(() => file.byId(oldRelId)).toThrow();
		expect(getContainer(subelement)?.equals(element2)).toBe(true);
	});
});
