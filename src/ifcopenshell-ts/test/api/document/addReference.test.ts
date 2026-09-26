// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/document/test_add_reference.py` (src/ifcopenshell-python)
// -- both real Python test methods ported, using `createTestFile`'s already-populated
// `IfcProject` directly (see `./addInformation.test.ts`'s own header comment for why).

import { describe, expect, test } from "vitest";
import { addInformation } from "../../../src/api/document/addInformation";
import { addReference } from "../../../src/api/document/addReference";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.document.addReference (%s)", (schema) => {
	test("adding a reference", () => {
		const file = createTestFile(schema);
		const element = addReference(file, { information: null });
		expect(element.isA("IfcDocumentReference")).toBe(true);
		expect(file.byType("IfcDocumentReference").length).toBe(1);
	});

	test("adding a reference to an information", () => {
		const file = createTestFile(schema);
		const information = addInformation(file, {});
		const element = addReference(file, { information });
		expect(element.isA("IfcDocumentReference")).toBe(true);
		expect(file.byType("IfcDocumentReference").length).toBe(1);

		const isIfc2x3 = schema === "IFC2X3";
		const linked = isIfc2x3
			? (element.get("ReferenceToDocument") as EntityInstance[])[0]
			: (element.get("ReferencedDocument") as EntityInstance);
		expect(linked.equals(information)).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.document.addReference Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcDocumentReference; redo recreates it", () => {
		const file = createTestFile(schema);
		const information = addInformation(file, {});

		file.beginTransaction();
		const reference = addReference(file, { information });
		file.endTransaction();
		const referenceId = reference.id();

		expect(file.byType("IfcDocumentReference").length).toBe(1);

		file.undo();
		expect(() => file.byId(referenceId)).toThrow();
		expect(file.byType("IfcDocumentReference").length).toBe(0);

		file.redo();
		expect(file.byId(referenceId).isA("IfcDocumentReference")).toBe(true);
	});
});
