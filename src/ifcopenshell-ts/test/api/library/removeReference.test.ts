// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/library/test_remove_reference.py` (src/ifcopenshell-python)
// -- the sole real Python test method ported.

import { describe, expect, test } from "vitest";
import { addLibrary } from "../../../src/api/library/addLibrary";
import { addReference } from "../../../src/api/library/addReference";
import { assignReference } from "../../../src/api/library/assignReference";
import { removeReference } from "../../../src/api/library/removeReference";
import { createEntity } from "../../../src/api/root/createEntity";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.library.removeReference (%s)", (schema) => {
	test("removing a reference", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });
		const reference = addReference(file, { library });
		const product = createEntity(file, { ifcClass: "IfcWall" });
		assignReference(file, { products: [product], reference });

		removeReference(file, { reference });

		expect(file.byType("IfcLibraryReference").length).toBe(0);
		expect(file.byType("IfcRelAssociatesLibrary").length).toBe(0);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.library.removeReference Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the fully-removed reference and its rel; redo removes them again", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });
		const reference = addReference(file, { library });
		const product = createEntity(file, { ifcClass: "IfcWall" });
		assignReference(file, { products: [product], reference });
		const referenceId = reference.id();

		file.beginTransaction();
		removeReference(file, { reference });
		file.endTransaction();

		expect(() => file.byId(referenceId)).toThrow();
		expect(file.byType("IfcRelAssociatesLibrary").length).toBe(0);

		file.undo();
		expect(file.byId(referenceId).isA("IfcLibraryReference")).toBe(true);
		expect(file.byType("IfcRelAssociatesLibrary").length).toBe(1);

		file.redo();
		expect(() => file.byId(referenceId)).toThrow();
		expect(file.byType("IfcRelAssociatesLibrary").length).toBe(0);
	});
});
