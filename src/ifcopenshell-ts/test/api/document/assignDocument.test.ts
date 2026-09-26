// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/document/test_assign_document.py` (src/ifcopenshell-python)
// -- both real Python test methods ported.

import { describe, expect, test } from "vitest";
import { addReference } from "../../../src/api/document/addReference";
import { assignDocument } from "../../../src/api/document/assignDocument";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import * as elementUtil from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.document.assignDocument (%s)", (schema) => {
	test("assigning a document", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const reference = addReference(file, { information: null });
		assignDocument(file, { products: [element], document: reference });

		const associations = element.get("HasAssociations") as EntityInstance[];
		expect((associations[0].get("RelatingDocument") as EntityInstance).equals(reference)).toBe(true);
		const referenced = [...elementUtil.getReferencedElements(reference)];
		expect(referenced.length).toBe(1);
		expect(referenced[0].equals(element)).toBe(true);
	});

	test("assigning multiple documents", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const reference = addReference(file, { information: null });
		assignDocument(file, { products: [element, element2], document: reference });

		expect(file.byType("IfcRelAssociatesDocument").length).toBe(1);
		const referenced = elementUtil.getReferencedElements(reference);
		expect(referenced.size).toBe(2);
	});

	// --- Original coverage: the "no products left to assign" early-return, not
	// exercised anywhere in real Python's own `test_assign_document.py`. ---

	test("assigning the same document to already-assigned products is a no-op", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const reference = addReference(file, { information: null });
		assignDocument(file, { products: [element], document: reference });

		const relCountBefore = file.byType("IfcRelAssociatesDocument").length;
		const result = assignDocument(file, { products: [element], document: reference });

		expect(result).toBeUndefined();
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(relCountBefore);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.document.assignDocument Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created rel; redo recreates it", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const reference = addReference(file, { information: null });

		file.beginTransaction();
		assignDocument(file, { products: [element], document: reference });
		file.endTransaction();

		expect(file.byType("IfcRelAssociatesDocument").length).toBe(1);

		file.undo();
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(0);

		file.redo();
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(1);
	});

	test("undo restores a rel's RelatedObjects/OwnerHistory when assigning a second product", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const reference = addReference(file, { information: null });
		assignDocument(file, { products: [element], document: reference });

		file.beginTransaction();
		assignDocument(file, { products: [element2], document: reference });
		file.endTransaction();

		const rel = file.byType("IfcRelAssociatesDocument")[0];
		expect((rel.get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		file.undo();
		expect((file.byType("IfcRelAssociatesDocument")[0].get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		file.redo();
		expect((file.byType("IfcRelAssociatesDocument")[0].get("RelatedObjects") as EntityInstance[]).length).toBe(2);
	});
});
