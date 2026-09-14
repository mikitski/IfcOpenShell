// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/pset/test_unassign_pset.py` (src/ifcopenshell-python) --
// all 4 real Python test methods ported, adapted to construct `IfcWall`/`IfcWallType`
// fixtures directly via `file.createEntity(...)` and to build the pre-shared pset via
// `./assignPset.ts` directly rather than the unported `root.create_entity` (matching
// `../group/assignGroup.test.ts`'s own established substitution precedent). Real
// Python's `TestUnassignPsetIFC2X3` is a no-op subclass (`pass`), so this file just
// runs every test across `AVAILABLE_SCHEMAS`.
//
// Original coverage added beyond the real Python file: a case where a pset has TWO
// independent `IfcRelDefinesByProperties` rels (one per occurrence, an unusual but
// real IFC4+-legal shape) and only the products overlapping ONE of them are
// unassigned -- pinning `unassign_pset.py`'s own "iterate every rel, skip ones with no
// overlap" behavior (see `./unassignPset.ts`'s own header comment for why this is a
// genuine divergence from `./assignPset.ts`'s "first rel only" shape, not assumed).

import { describe, expect, test } from "vitest";
import { assignPset } from "../../../src/api/pset/assignPset";
import { unassignPset } from "../../../src/api/pset/unassignPset";
import type { EntityInstance } from "../../../src/entityInstance";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function idSet(instances: readonly EntityInstance[]): Set<number> {
	return new Set(instances.map((i) => i.id()));
}

describe.each(AVAILABLE_SCHEMAS)("api.pset.unassignPset (%s)", (schema) => {
	test("unassign pset from last occurrence and remove rel", () => {
		const file = createTestFile(schema);
		const elements = [file.createEntity("IfcWall"), file.createEntity("IfcWall"), file.createEntity("IfcWall")];
		const pset = file.createEntity("IfcPropertySet");
		assignPset(file, { products: elements, pset });

		unassignPset(file, { products: elements, pset });
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(0);
	});

	test("unassign pset from non-last occurrence and reuse rel", () => {
		const file = createTestFile(schema);
		const elements = [file.createEntity("IfcWall"), file.createEntity("IfcWall"), file.createEntity("IfcWall")];
		const pset = file.createEntity("IfcPropertySet");
		const rel = assignPset(file, { products: elements, pset }) as EntityInstance;
		expect(rel).toBeTruthy();

		unassignPset(file, { products: elements.slice(1), pset });
		expect(idSet(rel.get("RelatedObjects") as EntityInstance[])).toEqual(idSet([elements[0]]));
	});

	test("unassign non-last pset from type", () => {
		const file = createTestFile(schema);
		const elements = [
			file.createEntity("IfcWallType"),
			file.createEntity("IfcWallType"),
			file.createEntity("IfcWallType"),
		];
		const pset = file.createEntity("IfcPropertySet");
		const pset2 = file.createEntity("IfcPropertySet");
		assignPset(file, { products: elements, pset });
		assignPset(file, { products: elements, pset: pset2 });

		unassignPset(file, { products: elements, pset });
		expect((pset.get("DefinesType") as EntityInstance[]).length).toBe(0);
		expect(idSet(pset2.get("DefinesType") as EntityInstance[])).toEqual(idSet(elements));
		for (const element of elements) {
			expect(idSet(element.get("HasPropertySets") as EntityInstance[])).toEqual(idSet([pset2]));
		}
	});

	test("unassign last pset from type and set prop to null", () => {
		const file = createTestFile(schema);
		const elements = [
			file.createEntity("IfcWallType"),
			file.createEntity("IfcWallType"),
			file.createEntity("IfcWallType"),
		];
		const pset = file.createEntity("IfcPropertySet");
		assignPset(file, { products: elements, pset });
		unassignPset(file, { products: elements, pset });
		expect((pset.get("DefinesType") as EntityInstance[]).length).toBe(0);
		for (const element of elements) {
			expect(element.get("HasPropertySets")).toBeNull();
		}
	});

	test("a rel with no overlap with the given products is left untouched (original coverage)", () => {
		const file = createTestFile(schema);
		const elementA = file.createEntity("IfcWall");
		const elementB = file.createEntity("IfcWall");
		const pset = file.createEntity("IfcPropertySet");

		// Two independent rels pointing at the same pset -- assignPset only ever reuses
		// the FIRST one it finds, so a second direct `IfcRelDefinesByProperties` must be
		// created manually to set up this scenario.
		const relA = assignPset(file, { products: [elementA], pset }) as EntityInstance;
		file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [elementB], pset);
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(2);

		unassignPset(file, { products: [elementB], pset });

		// relA (no overlap with [elementB]) must be untouched; the other rel (fully
		// emptied) must be removed.
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(1);
		expect(idSet(relA.get("RelatedObjects") as EntityInstance[])).toEqual(idSet([elementA]));
	});

	test("throws when the pset isn't actually assigned to the given type", () => {
		const file = createTestFile(schema);
		const wallType = file.createEntity("IfcWallType");
		const pset = file.createEntity("IfcPropertySet");
		expect(() => unassignPset(file, { products: [wallType], pset })).toThrow();
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.pset.unassignPset Transaction/undo-redo (%s)", (schema) => {
	test("undo restores a fully-removed rel and its OwnerHistory; redo removes it again", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const pset = file.createEntity("IfcPropertySet");
		const rel = assignPset(file, { products: [element], pset }) as EntityInstance;
		const relId = rel.id();
		const historyId = (rel.get("OwnerHistory") as EntityInstance | null)?.id();

		file.beginTransaction();
		unassignPset(file, { products: [element], pset });
		file.endTransaction();
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(0);

		file.undo();
		expect(file.byId(relId).isA("IfcRelDefinesByProperties")).toBe(true);
		if (historyId !== undefined) expect(() => file.byId(historyId)).not.toThrow();

		file.redo();
		expect(() => file.byId(relId)).toThrow();
	});

	test("undo restores RelatedObjects when only shrinking the rel", () => {
		const file = createTestFile(schema);
		const elements = [file.createEntity("IfcWall"), file.createEntity("IfcWall")];
		const pset = file.createEntity("IfcPropertySet");
		const rel = assignPset(file, { products: elements, pset }) as EntityInstance;
		const relId = rel.id();

		file.beginTransaction();
		unassignPset(file, { products: [elements[0]], pset });
		file.endTransaction();
		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		file.redo();
		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});

	test("undo restores HasPropertySets on a type", () => {
		const file = createTestFile(schema);
		const wallType = file.createEntity("IfcWallType");
		const pset = file.createEntity("IfcPropertySet");
		assignPset(file, { products: [wallType], pset });

		file.beginTransaction();
		unassignPset(file, { products: [wallType], pset });
		file.endTransaction();
		expect(wallType.get("HasPropertySets")).toBeNull();

		file.undo();
		expect(idSet(wallType.get("HasPropertySets") as EntityInstance[])).toEqual(idSet([pset]));

		file.redo();
		expect(wallType.get("HasPropertySets")).toBeNull();
	});
});
