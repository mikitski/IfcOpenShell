// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_classification.py` (no `test_edit_classification.
// py` counterpart -- confirmed by directory listing). Tests below are new, matching
// `../group/editGroup.test.ts`'s identical shape for the identically-structured Python
// source.

import { describe, expect, test } from "vitest";
import { editClassification } from "../../../src/api/classification/editClassification";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.classification.editClassification (%s)", (schema) => {
	test("editing a classification's attributes", () => {
		const file = createTestFile(schema);
		const classification = file.createEntity("IfcClassification", null, null, null, "Name");

		editClassification(file, { classification, attributes: { Source: "https://example.com" } });

		expect(classification.get("Source")).toBe("https://example.com");
		expect(classification.get("Name")).toBe("Name");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.classification.editClassification Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous attribute values; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const classification = file.createEntity("IfcClassification", null, null, null, "Old");

		file.beginTransaction();
		editClassification(file, { classification, attributes: { Name: "New", Source: "https://example.com" } });
		file.endTransaction();

		expect(classification.get("Name")).toBe("New");
		expect(classification.get("Source")).toBe("https://example.com");

		file.undo();
		expect(classification.get("Name")).toBe("Old");
		expect(classification.get("Source")).toBeNull();

		file.redo();
		expect(classification.get("Name")).toBe("New");
		expect(classification.get("Source")).toBe("https://example.com");
	});
});
