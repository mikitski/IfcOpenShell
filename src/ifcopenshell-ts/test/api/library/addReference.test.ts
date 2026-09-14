// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/library/test_add_reference.py` (src/ifcopenshell-python)
// -- the sole real Python test method ported.

import { describe, expect, test } from "vitest";
import { addLibrary } from "../../../src/api/library/addLibrary";
import { addReference } from "../../../src/api/library/addReference";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.library.addReference (%s)", (schema) => {
	test("adding a reference", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });
		const reference = addReference(file, { library });
		expect(reference.isA("IfcLibraryReference")).toBe(true);

		if (schema === "IFC2X3") {
			const references = library.get("LibraryReference") as EntityInstance[];
			expect(references.length).toBe(1);
			expect(references[0].equals(reference)).toBe(true);
		} else {
			expect((reference.get("ReferencedLibrary") as EntityInstance).equals(library)).toBe(true);
		}
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.library.addReference Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcLibraryReference; redo recreates it", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });

		file.beginTransaction();
		const reference = addReference(file, { library });
		file.endTransaction();
		const referenceId = reference.id();

		expect(file.byType("IfcLibraryReference").length).toBe(1);

		file.undo();
		expect(() => file.byId(referenceId)).toThrow();
		expect(file.byType("IfcLibraryReference").length).toBe(0);

		file.redo();
		expect(file.byId(referenceId).isA("IfcLibraryReference")).toBe(true);
	});
});
