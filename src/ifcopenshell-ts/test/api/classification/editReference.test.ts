// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_reference.py` (no `test_edit_reference.py`
// counterpart -- confirmed by directory listing). Tests below are new, matching
// `./editClassification.test.ts`'s identical shape for the identically-structured
// Python source.

import { describe, expect, test } from "vitest";
import { editReference } from "../../../src/api/classification/editReference";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.classification.editReference (%s)", (schema) => {
	test("editing a reference's attributes", () => {
		const file = createTestFile(schema);
		const reference = file.createEntity("IfcClassificationReference", null, null, "Name");

		editReference(file, { reference, attributes: { Location: "https://example.com" } });

		expect(reference.get("Location")).toBe("https://example.com");
		expect(reference.get("Name")).toBe("Name");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.classification.editReference Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous attribute values; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const reference = file.createEntity("IfcClassificationReference", null, null, "Old");

		file.beginTransaction();
		editReference(file, { reference, attributes: { Name: "New", Location: "https://example.com" } });
		file.endTransaction();

		expect(reference.get("Name")).toBe("New");
		expect(reference.get("Location")).toBe("https://example.com");

		file.undo();
		expect(reference.get("Name")).toBe("Old");
		expect(reference.get("Location")).toBeNull();

		file.redo();
		expect(reference.get("Name")).toBe("New");
		expect(reference.get("Location")).toBe("https://example.com");
	});
});
