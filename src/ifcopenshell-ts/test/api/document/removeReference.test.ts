// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/document/test_remove_reference.py` (src/ifcopenshell-python)
// -- both real Python test methods ported, using `createTestFile`'s already-populated
// `IfcProject` directly (see `./addInformation.test.ts`'s own header comment for why).

import { describe, expect, test } from "vitest";
import { addInformation } from "../../../src/api/document/addInformation";
import { addReference } from "../../../src/api/document/addReference";
import { assignDocument } from "../../../src/api/document/assignDocument";
import { removeReference } from "../../../src/api/document/removeReference";
import { createEntity } from "../../../src/api/root/createEntity";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.document.removeReference (%s)", (schema) => {
	test("removing a reference", () => {
		const file = createTestFile(schema);
		const information = addInformation(file, {});
		const reference = addReference(file, { information });

		removeReference(file, { reference });

		expect(file.byType("IfcDocumentReference").length).toBe(0);
		expect(file.byType("IfcDocumentInformation").length).toBe(1);
		// The project's own `IfcRelAssociatesDocument` (from `addInformation`) survives --
		// `removeReference` never touches it.
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(1);
	});

	test("removing a reference assigned to an object", () => {
		const file = createTestFile(schema);
		const wall = createEntity(file, { ifcClass: "IfcWall" });
		const information = addInformation(file, {});
		const reference = addReference(file, { information });
		assignDocument(file, { products: [wall], document: reference });

		expect(file.byType("IfcRelAssociatesDocument").length).toBe(2);
		removeReference(file, { reference });

		expect(file.byType("IfcDocumentReference").length).toBe(0);
		expect(file.byType("IfcDocumentInformation").length).toBe(1);
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(1);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.document.removeReference Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the fully-removed reference and its rel; redo removes them again", () => {
		const file = createTestFile(schema);
		const wall = createEntity(file, { ifcClass: "IfcWall" });
		const information = addInformation(file, {});
		const reference = addReference(file, { information });
		assignDocument(file, { products: [wall], document: reference });
		const referenceId = reference.id();

		file.beginTransaction();
		removeReference(file, { reference });
		file.endTransaction();

		expect(() => file.byId(referenceId)).toThrow();
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(1);

		file.undo();
		expect(file.byId(referenceId).isA("IfcDocumentReference")).toBe(true);
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(2);

		file.redo();
		expect(() => file.byId(referenceId)).toThrow();
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(1);
	});
});
