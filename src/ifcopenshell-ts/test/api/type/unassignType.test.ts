// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/type/test_unassign_type.py` (src/ifcopenshell-python) --
// all 3 real Python test methods ported, adapted in one disclosed way: real Python's
// setup calls `ifcopenshell.api.type.assign_type` to create the `IfcRelDefinesByType`
// precondition, but `assign_type` is NOT ported in this chunk (see
// `../../../src/api/type/unassignType.ts`'s own header comment for why -- it's the
// largest, most independently-complex file in `api.type` and genuinely out of scope
// for this small, well-scoped `unassign_type` chunk). Test setup here instead creates
// the `IfcRelDefinesByType` directly via `file.createEntity(...)`, faithfully
// reproducing the exact relationship shape `assign_type` itself would produce (a
// single `IfcRelDefinesByType` with the given `RelatedObjects`/`RelatingType` --
// confirmed identical attribute order across all 3 schemas' generated `.d.ts`:
// GlobalId(0)/OwnerHistory(1)/Name(2)/Description(3)/RelatedObjects(4)/
// RelatingType(5)). Real Python's own test class runs against both `IFC4` (base) and
// `IFC2X3` (via multiple inheritance, `TestUnassignTypeIFC2X3`); `describe.each
// AVAILABLE_SCHEMAS` reproduces the same dual-schema coverage (plus IFC4X3), and since
// `unassignType`'s own IFC2X3-vs-IFC4+ branch (`IsDefinedBy`-filtered vs. dedicated
// `IsTypedBy`) is read through `util/element.ts`'s `getType` in these assertions too,
// both real code paths are genuinely exercised, not just one.

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { unassignType } from "../../../src/api/type/unassignType";
import type { EntityInstance } from "../../../src/entityInstance";
import * as guid from "../../../src/guid";
import { getType } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

/** IfcRelDefinesByType: GlobalId(0), OwnerHistory(1), Name(2), Description(3), RelatedObjects(4), RelatingType(5). See this file's header comment for why this replaces the unported `type.assign_type` in test setup. */
function createTypeRel(
	file: ReturnType<typeof createTestFile>,
	relatedObjects: readonly EntityInstance[],
	relatingType: EntityInstance,
): EntityInstance {
	return file.createEntity("IfcRelDefinesByType", guid.new(), null, null, null, [...relatedObjects], relatingType);
}

describe.each(AVAILABLE_SCHEMAS)("api.type.unassignType (%s)", (schema) => {
	test("unassigning a type", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		createTypeRel(file, [element1, element2], elementType);

		unassignType(file, { relatedObjects: [element1, element2] });

		expect(getType(element1)).toBeNull();
		expect(getType(element2)).toBeNull();
	});

	test("the rel is kept if there are more typed elements", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		createTypeRel(file, [element1], elementType);
		createTypeRel(file, [element2], elementType);

		unassignType(file, { relatedObjects: [element1] });

		expect(file.byType("IfcRelDefinesByType").length).toBe(1);
		expect(getType(element2)?.equals(elementType)).toBe(true);
	});

	test("the rel is purged if there are no more typed elements", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element = file.createEntity("IfcWall");
		createTypeRel(file, [element], elementType);

		unassignType(file, { relatedObjects: [element] });

		expect(file.byType("IfcRelDefinesByType").length).toBe(0);
	});
});

// --- Real, disclosed upstream bug regression coverage (no Python counterpart) ---
//
// Pins `unassignType.ts`'s own header comment finding: real Python's
// `unassign_type.py` shadows a single `related_objects_set` variable across its
// `for rel in rels` loop, so when the caller's `related_objects` spans elements typed
// by *different* rels, every rel after the first is filtered against the previous
// rel's already-shrunk leftover set instead of the original target set -- silently
// leaving a later object's type assignment untouched. Ported verbatim, not silently
// fixed; this test locks in the exact (buggy) real-Python-matching outcome so a future
// change can't "fix" it without the fix being a deliberate, visible decision.

describe.each(AVAILABLE_SCHEMAS)("api.type.unassignType real-Python shadowing bug (%s)", (schema) => {
	test("an object typed by a later-processed rel is NOT actually unassigned", () => {
		const file = createTestFile(schema);
		const typeA = file.createEntity("IfcWallType");
		const typeB = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		const element3 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const element4 = file.createEntity("IfcWall");
		// rel1 processed first (element1 is first in `relatedObjects` below): correctly
		// loses element1.
		createTypeRel(file, [element1, element3], typeA);
		// rel2 processed second: filtered against rel1's leftover ({element3}), not the
		// original {element1, element2} -- element2 is never actually removed.
		createTypeRel(file, [element2, element4], typeB);

		unassignType(file, { relatedObjects: [element1, element2] });

		// Correct: element1 (first-processed rel) really is detached.
		expect(getType(element1)).toBeNull();
		// Bug, matching real Python: element2 (second-processed rel) is still typed.
		expect(getType(element2)?.equals(typeB)).toBe(true);
		expect(file.byType("IfcRelDefinesByType").length).toBe(2);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.type.unassignType Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the deleted IfcRelDefinesByType; redo removes it again", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element = file.createEntity("IfcWall");
		const rel = createTypeRel(file, [element], elementType);
		const relId = rel.id();

		file.beginTransaction();
		unassignType(file, { relatedObjects: [element] });
		file.endTransaction();

		expect(() => file.byId(relId)).toThrow();
		expect(getType(element)).toBeNull();

		file.undo();
		expect(file.byId(relId).isA("IfcRelDefinesByType")).toBe(true);
		expect(getType(element)?.equals(elementType)).toBe(true);

		file.redo();
		expect(() => file.byId(relId)).toThrow();
		expect(getType(element)).toBeNull();
	});

	test("undo restores a rewritten rel's RelatedObjects (multi-element case)", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const rel = createTypeRel(file, [element1, element2], elementType);
		const relId = rel.id();

		file.beginTransaction();
		unassignType(file, { relatedObjects: [element1] });
		file.endTransaction();

		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);
		expect(getType(element2)?.equals(elementType)).toBe(true);

		file.undo();
		const restoredRelated = file.byId(relId).get("RelatedObjects") as EntityInstance[];
		expect(restoredRelated.length).toBe(2);
		expect(getType(element1)?.equals(elementType)).toBe(true);

		file.redo();
		expect((file.byId(relId).get("RelatedObjects") as EntityInstance[]).length).toBe(1);
		expect(getType(element1)).toBeNull();
	});
});
