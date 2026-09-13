// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/document/test_add_information.py` (src/ifcopenshell-python)
// -- all 3 real Python test methods ported, adapted to this port's own `createTestFile`
// fixture convention: real Python's bare fixture starts genuinely blank (no pre-existing
// `IfcProject`), so its own test body explicitly calls `self.file.createIfcProject()`
// first. `createTestFile` (this port's own fixture) already pre-populates a default
// `IfcProject` via `template.create`, so that step is simply unnecessary here -- matching
// `../classification/addClassification.test.ts`'s own established precedent.

import { describe, expect, test } from "vitest";
import { addInformation } from "../../../src/api/document/addInformation";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.document.addInformation (%s)", (schema) => {
	test("adding information", () => {
		const file = createTestFile(schema);
		const element = addInformation(file, {});
		expect(element.isA("IfcDocumentInformation")).toBe(true);
		expect(file.byType("IfcDocumentInformation").length).toBe(1);
	});

	test("adding information to the project", () => {
		const file = createTestFile(schema);
		const project = file.byType("IfcProject")[0];
		const element = addInformation(file, {});
		const rel = file.byType("IfcRelAssociatesDocument")[0];
		expect(rel.isA("IfcRelAssociatesDocument")).toBe(true);
		expect((rel.get("RelatingDocument") as EntityInstance).equals(element)).toBe(true);
		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(1);
		expect(relatedObjects[0].equals(project)).toBe(true);
	});

	test("adding a subdocument", () => {
		const file = createTestFile(schema);
		const parent = addInformation(file, {});
		const element = addInformation(file, { parent });
		expect(element.isA("IfcDocumentInformation")).toBe(true);
		expect(file.byType("IfcDocumentInformation").length).toBe(2);

		const isPointedTo = element.get("IsPointedTo") as EntityInstance[];
		expect((isPointedTo[0].get("RelatingDocument") as EntityInstance).equals(parent)).toBe(true);
		const isPointer = parent.get("IsPointer") as EntityInstance[];
		expect((isPointer[0].get("RelatedDocuments") as EntityInstance[])[0].equals(element)).toBe(true);

		const element2 = addInformation(file, { parent });
		const relatedDocuments = (parent.get("IsPointer") as EntityInstance[])[0].get(
			"RelatedDocuments",
		) as EntityInstance[];
		expect(relatedDocuments.some((d) => d.equals(element))).toBe(true);
		expect(relatedDocuments.some((d) => d.equals(element2))).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.document.addInformation Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcDocumentInformation and its project rel; redo recreates them", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		const information = addInformation(file, {});
		file.endTransaction();
		const informationId = information.id();

		expect(file.byType("IfcDocumentInformation").length).toBe(1);
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(1);

		file.undo();
		expect(() => file.byId(informationId)).toThrow();
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(0);

		file.redo();
		expect(file.byId(informationId).isA("IfcDocumentInformation")).toBe(true);
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(1);
	});

	test("undo restores a reused IfcDocumentInformationRelationship's RelatedDocuments when adding a second subdocument", () => {
		const file = createTestFile(schema);
		const parent = addInformation(file, {});
		const element = addInformation(file, { parent });

		file.beginTransaction();
		addInformation(file, { parent });
		file.endTransaction();

		const relAfter = (parent.get("IsPointer") as EntityInstance[])[0];
		expect((relAfter.get("RelatedDocuments") as EntityInstance[]).length).toBe(2);

		file.undo();
		const relAfterUndo = (parent.get("IsPointer") as EntityInstance[])[0];
		const relatedAfterUndo = relAfterUndo.get("RelatedDocuments") as EntityInstance[];
		expect(relatedAfterUndo.length).toBe(1);
		expect(relatedAfterUndo[0].equals(element)).toBe(true);

		file.redo();
		const relAfterRedo = (parent.get("IsPointer") as EntityInstance[])[0];
		expect((relAfterRedo.get("RelatedDocuments") as EntityInstance[]).length).toBe(2);
	});
});
