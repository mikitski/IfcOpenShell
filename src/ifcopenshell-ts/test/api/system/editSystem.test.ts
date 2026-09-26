// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_system.py` (no `test_edit_system.py`
// counterpart -- confirmed by directory listing of `src/ifcopenshell-python/test/api/
// system/`). Tests below are new, matching `../group/editGroup.test.ts`'s identical
// shape for the identically-structured Python source (a trivial `setattr` loop).

import { describe, expect, test } from "vitest";
import { addSystem } from "../../../src/api/system/addSystem";
import { editSystem } from "../../../src/api/system/editSystem";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.system.editSystem (%s)", (schema) => {
	test("editing a system's attributes", () => {
		const file = createTestFile(schema);
		const system = addSystem(file, {});

		editSystem(file, { system, attributes: { Name: "HW" } });

		expect(system.get("Name")).toBe("HW");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.system.editSystem Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous attribute values; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const system = addSystem(file, {});

		file.beginTransaction();
		editSystem(file, { system, attributes: { Name: "HW", Description: "Hot Water" } });
		file.endTransaction();

		expect(system.get("Name")).toBe("HW");
		expect(system.get("Description")).toBe("Hot Water");

		file.undo();
		expect(system.get("Name")).toBe("Unnamed");
		expect(system.get("Description")).toBeNull();

		file.redo();
		expect(system.get("Name")).toBe("HW");
		expect(system.get("Description")).toBe("Hot Water");
	});
});
