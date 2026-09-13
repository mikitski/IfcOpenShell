// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/group/test_update_group_products.py` (src/ifcopenshell-
// python). Real Python has two test classes: `TestUpdateGroupProductsIFC2X3` (base,
// also runs against IFC2X3) defines `test_update_group_without_products` and
// `test_update_group_products`; `TestUpdateGroupProductsIFC4` inherits the former
// unchanged but OVERRIDES the latter, since (per that override's own comment) "in ifc4
// IfcGroup can have multiple rels" -- IFC4's version manually creates two separate
// pre-existing `IfcRelAssignsToGroup` rels (via direct `file.create_entity`, not
// `assign_group`) to exercise `update_group_products`' own multi-rel purge step, which
// the IFC2X3 version (a single rel, built via `assign_group`) never exercises. Real
// Python has no dedicated IFC4X3 test class for this file at all; ported here against
// IFC4X3 using the same multi-rel setup as IFC4 (nothing in `update_group_products.ts`
// is schema-specific -- `IsGroupedBy`'s cardinality restriction to a single rel is an
// IFC2X3-only EXPRESS `WHERE` rule this port doesn't runtime-validate either way, so
// IFC4X3 behaves identically to IFC4 here).
//
// `elements`, `element`/`element2` fixtures are built directly via
// `file.createEntity("IfcWall")` rather than the unported `ifcopenshell.api.root.
// create_entity`, matching `./assignGroup.test.ts`'s/`./unassignGroup.test.ts`'s own
// established substitution.

import { describe, expect, test } from "vitest";
import { assignGroup } from "../../../src/api/group/assignGroup";
import { updateGroupProducts } from "../../../src/api/group/updateGroupProducts";
import type { EntityInstance } from "../../../src/entityInstance";
import * as guid from "../../../src/guid";
import { getGroupedBy, getGroups } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function idSet(instances: readonly EntityInstance[]): Set<number> {
	return new Set(instances.map((i) => i.id()));
}

describe.each(AVAILABLE_SCHEMAS)("api.group.updateGroupProducts (%s)", (schema) => {
	test("updating a group with no pre-existing products", () => {
		const file = createTestFile(schema);
		const elements = Array.from({ length: 4 }, () => file.createEntity("IfcWall"));
		const group = file.createEntity("IfcGroup");

		updateGroupProducts(file, { products: elements, group });

		expect(idSet(getGroupedBy(group))).toEqual(idSet(elements));
	});

	test("replacing existing products, preserving nested groups", () => {
		const file = createTestFile(schema);
		const elements = Array.from({ length: 4 }, () => file.createEntity("IfcWall"));
		const group = file.createEntity("IfcGroup");

		if (schema === "IFC2X3") {
			// IFC2X3: a single rel, built via `assignGroup` -- matches
			// `TestUpdateGroupProductsIFC2X3.test_update_group_products`.
			assignGroup(file, { products: elements.slice(0, 2), group });
		} else {
			// IFC4/IFC4X3: two separate pre-existing rels, built directly (not via
			// `assignGroup`, which only ever populates/reuses a single rel) -- matches
			// `TestUpdateGroupProductsIFC4.test_update_group_products`'s own override.
			file.createEntity("IfcRelAssignsToGroup", guid.new(), null, null, null, [elements[0]], null, group);
			file.createEntity("IfcRelAssignsToGroup", guid.new(), null, null, null, [elements[1]], null, group);
		}

		updateGroupProducts(file, { products: elements.slice(2), group });

		if (schema !== "IFC2X3") {
			expect(file.byType("IfcRelAssignsToGroup").length).toBe(1);
		}
		expect(idSet(getGroupedBy(group))).toEqual(idSet(elements.slice(2)));
		expect(getGroups(elements[0]).length).toBe(0);
		expect(getGroups(elements[1]).length).toBe(0);
	});

	test("nested groups are preserved even though they aren't in the new products list", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");
		const nestedGroup = file.createEntity("IfcGroup");
		assignGroup(file, { products: [nestedGroup], group });

		updateGroupProducts(file, { products: [element], group });

		const grouped = idSet(getGroupedBy(group, false));
		expect(grouped.has(element.id())).toBe(true);
		expect(grouped.has(nestedGroup.id())).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.group.updateGroupProducts Transaction/undo-redo (%s)", (schema) => {
	test("undo removes a freshly-created rel; redo recreates it", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");

		file.beginTransaction();
		updateGroupProducts(file, { products: [element], group });
		file.endTransaction();
		const relId = (group.get("IsGroupedBy") as EntityInstance[])[0].id();

		file.undo();
		expect(() => file.byId(relId)).toThrow();

		file.redo();
		expect(file.byId(relId).isA("IfcRelAssignsToGroup")).toBe(true);
	});

	test("undo restores the purged second rel and the original RelatedObjects", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const element3 = file.createEntity("IfcWall");
		const group = file.createEntity("IfcGroup");
		const rel1 = file.createEntity("IfcRelAssignsToGroup", guid.new(), null, null, null, [element], null, group);
		const rel2 = file.createEntity("IfcRelAssignsToGroup", guid.new(), null, null, null, [element2], null, group);
		const rel1Id = rel1.id();
		const rel2Id = rel2.id();

		file.beginTransaction();
		updateGroupProducts(file, { products: [element3], group });
		file.endTransaction();

		expect(file.byType("IfcRelAssignsToGroup").length).toBe(1);
		expect(() => file.byId(rel2Id)).toThrow();

		file.undo();
		expect(file.byId(rel2Id).isA("IfcRelAssignsToGroup")).toBe(true);
		expect((file.byId(rel1Id).get("RelatedObjects") as EntityInstance[]).length).toBe(1);
		expect((file.byId(rel1Id).get("RelatedObjects") as EntityInstance[])[0].equals(element)).toBe(true);

		file.redo();
		expect(() => file.byId(rel2Id)).toThrow();
		expect(idSet(file.byId(rel1Id).get("RelatedObjects") as EntityInstance[])).toEqual(idSet([element3]));
	});
});
