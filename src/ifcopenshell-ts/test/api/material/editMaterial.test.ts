// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_material.py` (no `test_edit_material.py`
// counterpart -- confirmed by directory listing of
// `src/ifcopenshell-python/test/api/material/`). Tests below are new, matching
// `../group/editGroup.test.ts`'s identical shape for the identically-structured
// Python source (a plain `setattr` loop -- see
// `../../../src/api/material/editMaterial.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { editMaterial } from "../../../src/api/material/editMaterial";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.material.editMaterial (%s)", (schema) => {
	test("editing a material's attributes", () => {
		const file = createTestFile(schema);
		const material = addMaterial(file, { name: "CON01" });

		editMaterial(file, { material, attributes: { Name: "CON02" } });

		expect(material.get("Name")).toBe("CON02");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.material.editMaterial Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous Name; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const material = addMaterial(file, { name: "CON01" });

		file.beginTransaction();
		editMaterial(file, { material, attributes: { Name: "CON02" } });
		file.endTransaction();

		expect(material.get("Name")).toBe("CON02");

		file.undo();
		expect(material.get("Name")).toBe("CON01");

		file.redo();
		expect(material.get("Name")).toBe("CON02");
	});
});
