// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/document/test_remove_information.py`
// (src/ifcopenshell-python) -- all 3 real Python test methods ported verbatim, using
// `createTestFile`'s already-populated `IfcProject` directly (see
// `./addInformation.test.ts`'s own header comment for why). The second test in
// particular pins the order-dependent `IsPointer`/`IsPointedTo` deletion behavior
// documented in `../../../src/api/document/removeInformation.ts`'s own header comment.

import { describe, expect, test } from "vitest";
import { addInformation } from "../../../src/api/document/addInformation";
import { addReference } from "../../../src/api/document/addReference";
import { removeInformation } from "../../../src/api/document/removeInformation";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.document.removeInformation (%s)", (schema) => {
	test("remove information", () => {
		const file = createTestFile(schema);
		const element = addInformation(file, {});
		removeInformation(file, { information: element });
		expect(file.byType("IfcDocumentInformation").length).toBe(0);
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(0);
	});

	test("removing all references of an information", () => {
		const file = createTestFile(schema);
		let information = addInformation(file, {});
		addReference(file, { information });
		removeInformation(file, { information });
		expect(file.byType("IfcDocumentInformation").length).toBe(0);
		expect(file.byType("IfcDocumentReference").length).toBe(0);
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(0);

		// Test removing the relationship to another information if it was the only
		// relating element.
		information = addInformation(file, {});
		const information1 = addInformation(file, { parent: information });
		const information2 = addInformation(file, { parent: information });

		removeInformation(file, { information: information1 });
		expect(file.byType("IfcDocumentInformation").length).toBe(2);
		expect(file.byType("IfcDocumentInformationRelationship").length).toBe(1);

		removeInformation(file, { information: information2 });
		expect(file.byType("IfcDocumentInformation").length).toBe(1);
		expect(file.byType("IfcDocumentInformationRelationship").length).toBe(0);
	});

	test("removing all subdocuments and their references too", () => {
		const file = createTestFile(schema);
		const information = addInformation(file, {});
		const information2 = addInformation(file, { parent: information });
		addReference(file, { information: information2 });
		removeInformation(file, { information });
		expect(file.byType("IfcDocumentInformation").length).toBe(0);
		expect(file.byType("IfcDocumentReference").length).toBe(0);
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(0);
		expect(file.byType("IfcDocumentInformationRelationship").length).toBe(0);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.document.removeInformation Transaction/undo-redo (%s)", (schema) => {
	test("undo restores a fully-removed information and its project rel; redo removes them again", () => {
		const file = createTestFile(schema);
		const information = addInformation(file, {});
		const informationId = information.id();

		file.beginTransaction();
		removeInformation(file, { information });
		file.endTransaction();

		expect(() => file.byId(informationId)).toThrow();
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(0);

		file.undo();
		expect(file.byId(informationId).isA("IfcDocumentInformation")).toBe(true);
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(1);

		file.redo();
		expect(() => file.byId(informationId)).toThrow();
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(0);
	});

	test("undo restores a cascaded subdocument removal", () => {
		const file = createTestFile(schema);
		const information = addInformation(file, {});
		const information2 = addInformation(file, { parent: information });
		const information2Id = information2.id();

		file.beginTransaction();
		removeInformation(file, { information });
		file.endTransaction();

		expect(file.byType("IfcDocumentInformation").length).toBe(0);
		expect(file.byType("IfcDocumentInformationRelationship").length).toBe(0);

		file.undo();
		expect(file.byType("IfcDocumentInformation").length).toBe(2);
		expect(file.byId(information2Id).isA("IfcDocumentInformation")).toBe(true);
		expect(file.byType("IfcDocumentInformationRelationship").length).toBe(1);

		file.redo();
		expect(file.byType("IfcDocumentInformation").length).toBe(0);
		expect(file.byType("IfcDocumentInformationRelationship").length).toBe(0);
	});
});
