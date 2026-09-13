// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/group/test_unassign_group.py` (src/ifcopenshell-python)
// -- both real Python test methods ported, adapted (like `./assignGroup.test.ts`) to
// construct `IfcWall` fixtures directly via `file.createEntity` rather than the
// unported `ifcopenshell.api.root.create_entity`.

import { describe, expect, test } from "vitest";
import { assignGroup } from "../../../src/api/group/assignGroup";
import { unassignGroup } from "../../../src/api/group/unassignGroup";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.group.unassignGroup (%s)", (schema) => {
	test("group unassignment", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const element3 = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");
		assignGroup(file, { products: [element, element2, element3], group });

		unassignGroup(file, { products: [element2, element3], group });

		const rels = file.byType("IfcRelAssignsToGroup");
		expect(rels.length).toBe(1);
		const rel = rels[0];
		expect((rel.get("RelatingGroup") as EntityInstance).equals(group)).toBe(true);
		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(1);
		expect(relatedObjects[0].equals(element)).toBe(true);
	});

	test("removing the relationship when unassigning the last element", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");
		assignGroup(file, { products: [element, element2], group });

		unassignGroup(file, { products: [element, element2], group });

		expect(file.byType("IfcRelAssignsToGroup").length).toBe(0);
	});

	test("unassigning from a never-assigned group is a no-op", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");

		expect(() => unassignGroup(file, { products: [element], group })).not.toThrow();
		expect(file.byType("IfcRelAssignsToGroup").length).toBe(0);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.group.unassignGroup Transaction/undo-redo (%s)", (schema) => {
	test("undo restores RelatedObjects when a rewrite happened; redo reapplies it", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");
		assignGroup(file, { products: [element, element2], group });
		const relId = (group.get("IsGroupedBy") as EntityInstance[])[0].id();

		file.beginTransaction();
		unassignGroup(file, { products: [element2], group });
		file.endTransaction();

		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		file.redo();
		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});

	test("undo restores the deleted rel when unassigning down to zero members; redo removes it again", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");
		assignGroup(file, { products: [element], group });
		const relId = (group.get("IsGroupedBy") as EntityInstance[])[0].id();

		file.beginTransaction();
		unassignGroup(file, { products: [element], group });
		file.endTransaction();

		expect(() => file.byId(relId)).toThrow();

		file.undo();
		expect(file.byId(relId).isA("IfcRelAssignsToGroup")).toBe(true);
		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		file.redo();
		expect(() => file.byId(relId)).toThrow();
	});
});
