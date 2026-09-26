// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_presentation_style.py` (no
// `test_edit_presentation_style.py` counterpart -- confirmed by directory listing of
// `src/ifcopenshell-python/test/api/style/`). Tests below are new, matching
// `../material/editMaterial.test.ts`'s identical shape for the identically-structured
// Python source (a plain `setattr` loop -- see
// `../../../src/api/style/editPresentationStyle.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { addStyle } from "../../../src/api/style/addStyle";
import { editPresentationStyle } from "../../../src/api/style/editPresentationStyle";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.style.editPresentationStyle (%s)", (schema) => {
	test("editing a style's attributes", () => {
		const file = createTestFile(schema);
		const style = addStyle(file, { name: "Foo" });

		editPresentationStyle(file, { style, attributes: { Name: "Bar" } });

		expect(style.get("Name")).toBe("Bar");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.style.editPresentationStyle Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous Name; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const style = addStyle(file, { name: "Foo" });

		file.beginTransaction();
		editPresentationStyle(file, { style, attributes: { Name: "Bar" } });
		file.endTransaction();

		expect(style.get("Name")).toBe("Bar");

		file.undo();
		expect(style.get("Name")).toBe("Foo");

		file.redo();
		expect(style.get("Name")).toBe("Bar");
	});
});
