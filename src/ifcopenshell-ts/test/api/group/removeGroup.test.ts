// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/group/test_remove_group.py` (src/ifcopenshell-python).
// `test_removing_a_group`/`test_removing_orphaned_group_relationships` are ported
// verbatim (adapted to build the `IfcWall` fixture directly via `file.createEntity`,
// matching `./assignGroup.test.ts`'s own established substitution).
// `test_removing_orphaned_property_relationships` is ported with one disclosed
// adaptation: real Python's setup calls `ifcopenshell.api.pset.add_pset`/`edit_pset`
// (not ported -- `api.pset` remains a future, larger chunk; see `../../../src/api/pset
// /removePset.ts`'s own header comment); this test builds the equivalent
// `IfcPropertySet`/`IfcPropertySingleValue`/`IfcRelDefinesByProperties` fixture directly
// via `file.createEntity(...)` instead.
//
// Also adds a dedicated regression test for the "nested alongside another member" case
// described in `../../../src/api/group/removeGroup.ts`'s own header comment: removing a
// group that is nested ALONGSIDE another member in a different group's own rel relies
// entirely on `IfcFile.remove`'s own automatic aggregate-reference cleanup (no explicit
// branch in `remove_group` handles this case) -- confirmed empirically here, not just
// reasoned about.

import { describe, expect, test } from "vitest";
import { assignGroup } from "../../../src/api/group/assignGroup";
import { removeGroup } from "../../../src/api/group/removeGroup";
import type { EntityInstance } from "../../../src/entityInstance";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.group.removeGroup (%s)", (schema) => {
	test("removing a group", () => {
		const file = createTestFile(schema);
		const group = file.createEntity("IfcGroup");

		removeGroup(file, { group });

		expect(file.byType("IfcGroup").length).toBe(0);
	});

	test("removing orphaned group relationships", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");
		assignGroup(file, { products: [element], group });

		removeGroup(file, { group });

		expect(file.byType("IfcRelAssignsToGroup").length).toBe(0);
		expect(file.byType("IfcWall").length).toBe(1);
	});

	test("removing orphaned property relationships", () => {
		const file = createTestFile(schema);
		const group = file.createEntity("IfcGroup");
		const prop = file.createEntity("IfcPropertySingleValue", "Foo", null, "Bar", null);
		const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Foo_Bar", null, [prop]);
		file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [group], pset);

		removeGroup(file, { group });

		expect(file.byType("IfcRelDefinesByProperties").length).toBe(0);
		expect(file.byType("IfcPropertySet").length).toBe(0);
		expect(file.byType("IfcPropertySingleValue").length).toBe(0);
	});

	test("purges a rel that nests this group as the sole member of another group", () => {
		const file = createTestFile(schema);
		const parentGroup = file.createEntity("IfcGroup");
		const nestedGroup = file.createEntity("IfcGroup");
		assignGroup(file, { products: [nestedGroup], group: parentGroup });
		const relId = (parentGroup.get("IsGroupedBy") as EntityInstance[])[0].id();

		removeGroup(file, { group: nestedGroup });

		expect(() => file.byId(relId)).toThrow();
	});

	test("a group nested alongside another member is spliced out of the rel automatically, without an explicit branch", () => {
		const file = createTestFile(schema);
		const parentGroup = file.createEntity("IfcGroup");
		const nestedGroup = file.createEntity("IfcGroup");
		const otherMember = file.createEntity("IfcWall");
		assignGroup(file, { products: [nestedGroup, otherMember], group: parentGroup });
		const relId = (parentGroup.get("IsGroupedBy") as EntityInstance[])[0].id();
		const nestedGroupId = nestedGroup.id();

		removeGroup(file, { group: nestedGroup });

		expect(() => file.byId(nestedGroupId)).toThrow();
		// The rel survives, no longer referencing the deleted `nestedGroup` --
		// `IfcFile.remove`'s own automatic aggregate-reference cleanup, not anything
		// `remove_group` does explicitly. See `removeGroup.ts`'s header comment.
		const rel = file.byId(relId);
		expect(rel.isA("IfcRelAssignsToGroup")).toBe(true);
		const remaining = rel.get("RelatedObjects") as EntityInstance[];
		expect(remaining.length).toBe(1);
		expect(remaining[0].equals(otherMember)).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.group.removeGroup Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed group; redo removes it again", () => {
		const file = createTestFile(schema);
		const group = file.createEntity("IfcGroup", null, null, "Unit 1A");
		const id = group.id();

		file.beginTransaction();
		removeGroup(file, { group });
		file.endTransaction();

		expect(() => file.byId(id)).toThrow();

		file.undo();
		expect(file.byId(id).get("Name")).toBe("Unit 1A");

		file.redo();
		expect(() => file.byId(id)).toThrow();
	});

	test("undo restores the cascaded rel and pset cleanup", () => {
		const file = createTestFile(schema);
		const group = file.createEntity("IfcGroup");
		const prop = file.createEntity("IfcPropertySingleValue", "Foo", null, "Bar", null);
		const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Foo_Bar", null, [prop]);
		const rel = file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [group], pset);
		const groupId = group.id();
		const propId = prop.id();
		const psetId = pset.id();
		const relId = rel.id();

		file.beginTransaction();
		removeGroup(file, { group });
		file.endTransaction();

		expect(() => file.byId(groupId)).toThrow();
		expect(() => file.byId(propId)).toThrow();
		expect(() => file.byId(psetId)).toThrow();
		expect(() => file.byId(relId)).toThrow();

		file.undo();
		expect(file.byId(groupId).isA("IfcGroup")).toBe(true);
		expect(file.byId(propId).isA("IfcPropertySingleValue")).toBe(true);
		expect(file.byId(psetId).isA("IfcPropertySet")).toBe(true);
		expect(file.byId(relId).isA("IfcRelDefinesByProperties")).toBe(true);

		file.redo();
		expect(() => file.byId(groupId)).toThrow();
		expect(() => file.byId(propId)).toThrow();
		expect(() => file.byId(psetId)).toThrow();
		expect(() => file.byId(relId)).toThrow();
	});
});
