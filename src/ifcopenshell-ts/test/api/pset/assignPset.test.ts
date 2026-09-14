// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/pset/test_assign_pset.py` (src/ifcopenshell-python) --
// all 3 real Python test methods ported, adapted to construct `IfcWall`/`IfcWallType`
// fixtures directly via `file.createEntity(...)` (matching `../group/assignGroup.test.ts`'s
// own established "unported `root.create_entity` substitution" precedent -- nothing in
// these assertions depends on `root.createEntity`'s own `GlobalId`/`OwnerHistory`
// bookkeeping). Real Python's `TestAssignPsetIFC2X3` is a no-op subclass (`pass`, no
// overrides) so this file just runs every test across `AVAILABLE_SCHEMAS` via
// `describe.each`, matching that same "no schema-specific behavior" shape.

import { describe, expect, test } from "vitest";
import { assignPset } from "../../../src/api/pset/assignPset";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function idSet(instances: readonly EntityInstance[]): Set<number> {
	return new Set(instances.map((i) => i.id()));
}

describe.each(AVAILABLE_SCHEMAS)("api.pset.assignPset (%s)", (schema) => {
	test("assign pset to occurrence", () => {
		const file = createTestFile(schema);
		const elements = [file.createEntity("IfcWall"), file.createEntity("IfcWall"), file.createEntity("IfcWall")];
		const pset = file.createEntity("IfcPropertySet");

		const rel = assignPset(file, { products: elements, pset });
		expect(rel).toBeTruthy();

		expect(file.byType("IfcRelDefinesByProperties").length).toBe(1);
		expect(((rel as EntityInstance).get("RelatingPropertyDefinition") as EntityInstance).equals(pset)).toBe(true);
		expect(idSet((rel as EntityInstance).get("RelatedObjects") as EntityInstance[])).toEqual(idSet(elements));
	});

	test("assign pset to occurrence, preexisting rel", () => {
		const file = createTestFile(schema);
		const elements = [file.createEntity("IfcWall"), file.createEntity("IfcWall"), file.createEntity("IfcWall")];
		const pset = file.createEntity("IfcPropertySet");

		const rel = assignPset(file, { products: elements.slice(0, 1), pset }) as EntityInstance;
		expect(rel).toBeTruthy();

		const relUpdated = assignPset(file, { products: elements.slice(1), pset });
		expect((relUpdated as EntityInstance).equals(rel)).toBe(true);
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(1);
		expect((rel.get("RelatingPropertyDefinition") as EntityInstance).equals(pset)).toBe(true);
		expect(idSet(rel.get("RelatedObjects") as EntityInstance[])).toEqual(idSet(elements));
	});

	test("assign pset to type", () => {
		const file = createTestFile(schema);
		const elements = [
			file.createEntity("IfcWallType"),
			file.createEntity("IfcWallType"),
			file.createEntity("IfcWallType"),
		];
		const pset = file.createEntity("IfcPropertySet");

		const ret = assignPset(file, { products: elements, pset });
		expect(ret).toBeNull();

		expect(file.byType("IfcRelDefinesByProperties").length).toBe(0);
		expect(idSet(pset.get("DefinesType") as EntityInstance[])).toEqual(idSet(elements));
	});

	test("returns null for an empty products list", () => {
		const file = createTestFile(schema);
		const pset = file.createEntity("IfcPropertySet");
		expect(assignPset(file, { products: [], pset })).toBeNull();
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(0);
	});

	test("assigning the same pset to a mix of occurrences and types in one call", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const wallType = file.createEntity("IfcWallType");
		const pset = file.createEntity("IfcPropertySet");

		const rel = assignPset(file, { products: [wall, wallType], pset }) as EntityInstance;
		expect(rel).toBeTruthy();
		expect(idSet(rel.get("RelatedObjects") as EntityInstance[])).toEqual(idSet([wall]));
		expect(idSet(pset.get("DefinesType") as EntityInstance[])).toEqual(idSet([wallType]));
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.pset.assignPset Transaction/undo-redo (%s)", (schema) => {
	test("undo removes a freshly-created rel; redo recreates it", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const pset = file.createEntity("IfcPropertySet");

		file.beginTransaction();
		assignPset(file, { products: [element], pset });
		file.endTransaction();
		const relId = (file.byType("IfcRelDefinesByProperties")[0] as EntityInstance).id();

		expect(file.byType("IfcRelDefinesByProperties").length).toBe(1);

		file.undo();
		expect(() => file.byId(relId)).toThrow();
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(0);

		file.redo();
		expect(file.byId(relId).isA("IfcRelDefinesByProperties")).toBe(true);
	});

	test("undo restores the previous RelatedObjects when merging into an existing rel", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const pset = file.createEntity("IfcPropertySet");
		assignPset(file, { products: [element], pset });
		const relId = (file.byType("IfcRelDefinesByProperties")[0] as EntityInstance).id();

		file.beginTransaction();
		assignPset(file, { products: [element2], pset });
		file.endTransaction();

		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		file.undo();
		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		file.redo();
		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(2);
	});

	test("undo restores HasPropertySets on a type", () => {
		const file = createTestFile(schema);
		const wallType = file.createEntity("IfcWallType");
		const pset = file.createEntity("IfcPropertySet");

		file.beginTransaction();
		assignPset(file, { products: [wallType], pset });
		file.endTransaction();
		expect(idSet(wallType.get("HasPropertySets") as EntityInstance[])).toEqual(idSet([pset]));

		file.undo();
		expect(wallType.get("HasPropertySets")).toBeNull();

		file.redo();
		expect(idSet(wallType.get("HasPropertySets") as EntityInstance[])).toEqual(idSet([pset]));
	});
});
