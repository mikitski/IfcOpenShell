// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/feature/test_add_filling.py` (src/ifcopenshell-python,
// `TestAddFilling`/`TestAddFillingIFC2X3` -- the IFC2X3 subclass adds no override, so
// both real classes run the exact same 3 test bodies). Ported below via
// `describe.each(AVAILABLE_SCHEMAS)`, matching this project's established "same body,
// every locally-available schema" precedent for a schema-agnostic fixture (real
// Python only exercises IFC4/IFC2X3 -- nothing here is schema-specific, so also
// running it against IFC4X3 is strictly more coverage, not a divergence).

import { describe, expect, test } from "vitest";
import { addFilling } from "../../../src/api/feature/addFilling";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.feature.addFilling (%s)", (schema) => {
	test("adding a filling", () => {
		const file = createTestFile(schema);
		const opening = file.createEntity("IfcOpeningElement");
		const door = file.createEntity("IfcDoor");
		addFilling(file, { opening, element: door });
		const fillsVoids = door.get("FillsVoids") as EntityInstance[];
		expect(fillsVoids.length).toBe(1);
		expect((fillsVoids[0].get("RelatingOpeningElement") as EntityInstance).equals(opening)).toBe(true);
	});

	test("adding a filling twice", () => {
		const file = createTestFile(schema);
		const opening = file.createEntity("IfcOpeningElement");
		const door = file.createEntity("IfcDoor");
		addFilling(file, { opening, element: door });
		addFilling(file, { opening, element: door });
		const fillsVoids = door.get("FillsVoids") as EntityInstance[];
		expect(fillsVoids.length).toBe(1);
		expect((fillsVoids[0].get("RelatingOpeningElement") as EntityInstance).equals(opening)).toBe(true);
		expect((opening.get("HasFillings") as EntityInstance[]).length).toBe(1);
	});

	test("adding a filling which is already filling another opening", () => {
		const file = createTestFile(schema);
		const door = file.createEntity("IfcDoor");
		const opening1 = file.createEntity("IfcOpeningElement");
		const opening2 = file.createEntity("IfcOpeningElement");
		addFilling(file, { opening: opening1, element: door });
		addFilling(file, { opening: opening2, element: door });
		expect((opening1.get("HasFillings") as EntityInstance[]).length).toBe(0);
		const opening2Fillings = opening2.get("HasFillings") as EntityInstance[];
		expect(opening2Fillings.length).toBe(1);
		expect((opening2Fillings[0].get("RelatedBuildingElement") as EntityInstance).equals(door)).toBe(true);
	});
});

// --- Disclosed quirk regression coverage (no Python counterpart): the created rel
// never gets an `IfcOwnerHistory` -- see `addFilling.ts`'s own header comment. ---

describe.each(AVAILABLE_SCHEMAS)("api.feature.addFilling -- no owner history quirk (%s)", (schema) => {
	test("the created IfcRelFillsElement has no OwnerHistory", () => {
		const file = createTestFile(schema);
		const opening = file.createEntity("IfcOpeningElement");
		const door = file.createEntity("IfcDoor");
		const rel = addFilling(file, { opening, element: door });
		expect(rel.get("OwnerHistory")).toBeNull();
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.feature.addFilling Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcRelFillsElement; redo recreates it", () => {
		const file = createTestFile(schema);
		const opening = file.createEntity("IfcOpeningElement");
		const door = file.createEntity("IfcDoor");

		file.beginTransaction();
		const rel = addFilling(file, { opening, element: door });
		file.endTransaction();
		const relId = rel.id();

		expect(file.byType("IfcRelFillsElement").length).toBe(1);

		file.undo();
		expect(() => file.byId(relId)).toThrow();
		expect((door.get("FillsVoids") as EntityInstance[]).length).toBe(0);

		file.redo();
		expect(file.byId(relId).isA("IfcRelFillsElement")).toBe(true);
		expect((door.get("FillsVoids") as EntityInstance[]).length).toBe(1);
	});
});
