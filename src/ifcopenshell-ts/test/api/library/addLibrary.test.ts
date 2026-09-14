// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/library/test_add_library.py` (src/ifcopenshell-python) --
// the sole real Python test method ported.

import { describe, expect, test } from "vitest";
import { addLibrary } from "../../../src/api/library/addLibrary";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.library.addLibrary (%s)", (schema) => {
	test("adding a library", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });
		expect(library.isA("IfcLibraryInformation")).toBe(true);
		expect(library.get("Name")).toBe("Name");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.library.addLibrary Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcLibraryInformation; redo recreates it", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		const library = addLibrary(file, { name: "Brickschema" });
		file.endTransaction();
		const libraryId = library.id();

		expect(file.byType("IfcLibraryInformation").length).toBe(1);

		file.undo();
		expect(() => file.byId(libraryId)).toThrow();
		expect(file.byType("IfcLibraryInformation").length).toBe(0);

		file.redo();
		expect(file.byId(libraryId).isA("IfcLibraryInformation")).toBe(true);
		expect(file.byId(libraryId).get("Name")).toBe("Brickschema");
	});
});
