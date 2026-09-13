// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_reference.py` (no `test_edit_reference.py`
// counterpart -- confirmed by directory listing). Tests below are new, matching
// `../classification/editReference.test.ts`'s identical shape for the identically-
// structured Python source.

import { describe, expect, test } from "vitest";
import { addReference } from "../../../src/api/document/addReference";
import { editReference } from "../../../src/api/document/editReference";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.document.editReference (%s)", (schema) => {
	test("editing a reference's attributes", () => {
		const file = createTestFile(schema);
		const reference = addReference(file, { information: null });
		const idAttribute = schema === "IFC2X3" ? "ItemReference" : "Identification";

		editReference(file, { reference, attributes: { [idAttribute]: "2.1.15" } });

		expect(reference.get(idAttribute)).toBe("2.1.15");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.document.editReference Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous attribute values; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const reference = addReference(file, { information: null });

		file.beginTransaction();
		editReference(file, { reference, attributes: { Name: "New" } });
		file.endTransaction();

		expect(reference.get("Name")).toBe("New");

		file.undo();
		expect(reference.get("Name")).toBeNull();

		file.redo();
		expect(reference.get("Name")).toBe("New");
	});
});
