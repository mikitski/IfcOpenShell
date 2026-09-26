// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_assigned_material.py` (no
// `test_edit_assigned_material.py` counterpart -- confirmed by directory listing of
// `src/ifcopenshell-python/test/api/material/`). Tests below are new, matching
// `./editMaterial.test.ts`'s identical shape -- real Python's own function body is
// byte-for-byte the same `setattr` loop as `edit_material` (see
// `../../../src/api/material/editAssignedMaterial.ts`'s own header comment), so
// coverage here deliberately mirrors that sibling rather than exploring different
// behavior that doesn't exist.

import { describe, expect, test } from "vitest";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { editAssignedMaterial } from "../../../src/api/material/editAssignedMaterial";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.material.editAssignedMaterial (%s)", (schema) => {
	test("editing an assigned material's attributes", () => {
		const file = createTestFile(schema);
		const concrete = addMaterial(file, { name: "CON01" });

		editAssignedMaterial(file, {
			element: concrete,
			attributes: { Name: "CON02" },
		});

		expect(concrete.get("Name")).toBe("CON02");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.material.editAssignedMaterial Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous Name; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const concrete = addMaterial(file, { name: "CON01" });

		file.beginTransaction();
		editAssignedMaterial(file, { element: concrete, attributes: { Name: "CON02" } });
		file.endTransaction();

		expect(concrete.get("Name")).toBe("CON02");

		file.undo();
		expect(concrete.get("Name")).toBe("CON01");

		file.redo();
		expect(concrete.get("Name")).toBe("CON02");
	});
});
