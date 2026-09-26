// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/group/test_assign_group.py` (src/ifcopenshell-python) --
// both real Python test methods ported, adapted to construct `IfcWall` fixtures
// directly via `file.createEntity("IfcWall")` rather than the unported
// `ifcopenshell.api.root.create_entity` (matching `../spatial/assignContainer.test.ts`'s
// own established precedent for the same substitution -- nothing in either test's own
// assertions depends on `root.createEntity`'s `GlobalId`/`OwnerHistory` bookkeeping).

import { describe, expect, test } from "vitest";
import { assignGroup } from "../../../src/api/group/assignGroup";
import type { EntityInstance } from "../../../src/entityInstance";
import { getGroupedBy } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function idSet(instances: readonly EntityInstance[]): Set<number> {
	return new Set(instances.map((i) => i.id()));
}

describe.each(AVAILABLE_SCHEMAS)("api.group.assignGroup (%s)", (schema) => {
	test("assigning a group for multiple elements", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");

		assignGroup(file, { products: [element, element2], group });

		expect(file.byType("IfcRelAssignsToGroup").length).toBe(1);
		expect(idSet(getGroupedBy(group))).toEqual(idSet(file.byType("IfcWall")));
	});

	test("reusing an existing relationship", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");
		assignGroup(file, { products: [element, element2], group });

		const element3 = file.createEntity("IfcWall");
		assignGroup(file, { products: [element3], group });

		expect(file.byType("IfcRelAssignsToGroup").length).toBe(1);
		expect(idSet(getGroupedBy(group))).toEqual(idSet(file.byType("IfcWall")));
	});

	test("returns undefined for an empty products list", () => {
		const file = createTestFile(schema);
		const group = file.createEntity("IfcGroup");

		expect(assignGroup(file, { products: [], group })).toBeUndefined();
		expect(file.byType("IfcRelAssignsToGroup").length).toBe(0);
	});

	test("assigning an already-assigned product is a no-op", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");
		const rel = assignGroup(file, { products: [element], group });
		const totalElements = [...file].length;

		const rel2 = assignGroup(file, { products: [element], group });

		expect(rel2?.id()).toBe(rel?.id());
		expect([...file].length).toBe(totalElements);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.group.assignGroup Transaction/undo-redo (%s)", (schema) => {
	test("undo removes a freshly-created rel; redo recreates it", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");

		file.beginTransaction();
		assignGroup(file, { products: [element], group });
		file.endTransaction();
		const relId = (group.get("IsGroupedBy") as EntityInstance[])[0].id();

		expect(getGroupedBy(group).some((e) => e.equals(element))).toBe(true);

		file.undo();
		expect(() => file.byId(relId)).toThrow();
		expect(getGroupedBy(group).length).toBe(0);

		file.redo();
		expect(file.byId(relId).isA("IfcRelAssignsToGroup")).toBe(true);
		expect(getGroupedBy(group).some((e) => e.equals(element))).toBe(true);
	});

	test("undo restores the previous RelatedObjects when merging into an existing rel", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");
		assignGroup(file, { products: [element], group });
		const relId = (group.get("IsGroupedBy") as EntityInstance[])[0].id();

		file.beginTransaction();
		assignGroup(file, { products: [element2], group });
		file.endTransaction();

		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		file.undo();
		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		file.redo();
		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(2);
	});
});
