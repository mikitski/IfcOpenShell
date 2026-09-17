// This file was generated with the assistance of an AI coding tool.
//
// `remove_filling.py` has no real Python test file at all (confirmed by directory
// listing: `src/ifcopenshell-python/test/api/feature/` only contains
// `test_add_feature.py`/`test_add_filling.py`/`test_remove_feature.py`, matching this
// project's own established precedent for an untested real Python module -- e.g.
// `owner/remove_application.py` in the `api.owner` chunk -- of adding original
// coverage instead of leaving the function untested.

import { describe, expect, test } from "vitest";
import { addFilling } from "../../../src/api/feature/addFilling";
import { removeFilling } from "../../../src/api/feature/removeFilling";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.feature.removeFilling (%s)", (schema) => {
	test("removing a filling", () => {
		const file = createTestFile(schema);
		const opening = file.createEntity("IfcOpeningElement");
		const door = file.createEntity("IfcDoor");
		addFilling(file, { opening, element: door });

		removeFilling(file, { element: door });

		expect((door.get("FillsVoids") as EntityInstance[]).length).toBe(0);
		expect((opening.get("HasFillings") as EntityInstance[]).length).toBe(0);
		expect(file.byType("IfcRelFillsElement").length).toBe(0);
		// The opening and the door themselves are untouched.
		expect(file.byType("IfcOpeningElement").length).toBe(1);
		expect(file.byType("IfcDoor").length).toBe(1);
	});

	test("removing a filling from an element that isn't filling anything is a no-op", () => {
		const file = createTestFile(schema);
		const door = file.createEntity("IfcDoor");
		expect(() => removeFilling(file, { element: door })).not.toThrow();
		expect(file.byType("IfcRelFillsElement").length).toBe(0);
	});

	test("only removes the rel matching the given element, leaving other fillings intact", () => {
		const file = createTestFile(schema);
		const opening1 = file.createEntity("IfcOpeningElement");
		const opening2 = file.createEntity("IfcOpeningElement");
		const door1 = file.createEntity("IfcDoor");
		const door2 = file.createEntity("IfcDoor");
		addFilling(file, { opening: opening1, element: door1 });
		addFilling(file, { opening: opening2, element: door2 });

		removeFilling(file, { element: door1 });

		expect(file.byType("IfcRelFillsElement").length).toBe(1);
		const remaining = file.byType("IfcRelFillsElement")[0];
		expect((remaining.get("RelatedBuildingElement") as EntityInstance).equals(door2)).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage ---

describe.each(AVAILABLE_SCHEMAS)("api.feature.removeFilling Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed IfcRelFillsElement; redo removes it again", () => {
		const file = createTestFile(schema);
		const opening = file.createEntity("IfcOpeningElement");
		const door = file.createEntity("IfcDoor");
		const rel = addFilling(file, { opening, element: door });
		const relId = rel.id();

		file.beginTransaction();
		removeFilling(file, { element: door });
		file.endTransaction();

		expect(file.byType("IfcRelFillsElement").length).toBe(0);

		file.undo();
		expect(file.byId(relId).isA("IfcRelFillsElement")).toBe(true);
		expect((door.get("FillsVoids") as EntityInstance[]).length).toBe(1);

		file.redo();
		expect(() => file.byId(relId)).toThrow();
		expect((door.get("FillsVoids") as EntityInstance[]).length).toBe(0);
	});
});
