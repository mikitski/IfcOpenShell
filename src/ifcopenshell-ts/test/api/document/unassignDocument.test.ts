// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/document/test_unassign_document.py`
// (src/ifcopenshell-python) -- both real Python test methods ported.

import { describe, expect, test } from "vitest";
import { addReference } from "../../../src/api/document/addReference";
import { assignDocument } from "../../../src/api/document/assignDocument";
import { unassignDocument } from "../../../src/api/document/unassignDocument";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import * as elementUtil from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.document.unassignDocument (%s)", (schema) => {
	test("unassigning a document", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const reference = addReference(file, { information: null });
		assignDocument(file, { products: [element], document: reference });
		unassignDocument(file, { products: [element], document: reference });

		expect((element.get("HasAssociations") as EntityInstance[]).length).toBe(0);
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(0);
	});

	test("unassigning a document used by multiple entities", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const element3 = createEntity(file, { ifcClass: "IfcWall" });
		const reference = addReference(file, { information: null });
		assignDocument(file, { products: [element, element2, element3], document: reference });
		unassignDocument(file, { products: [element, element2], document: reference });

		const referenced = [...elementUtil.getReferencedElements(reference)];
		expect(referenced.length).toBe(1);
		expect(referenced[0].equals(element3)).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.document.unassignDocument Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the fully-removed rel; redo removes it again", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const reference = addReference(file, { information: null });
		assignDocument(file, { products: [element], document: reference });

		file.beginTransaction();
		unassignDocument(file, { products: [element], document: reference });
		file.endTransaction();

		expect(file.byType("IfcRelAssociatesDocument").length).toBe(0);

		file.undo();
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(1);

		file.redo();
		expect(file.byType("IfcRelAssociatesDocument").length).toBe(0);
	});

	test("undo restores a detached (not fully deleted) rel's RelatedObjects", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const reference = addReference(file, { information: null });
		assignDocument(file, { products: [element, element2], document: reference });

		file.beginTransaction();
		unassignDocument(file, { products: [element], document: reference });
		file.endTransaction();

		expect((file.byType("IfcRelAssociatesDocument")[0].get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect((file.byType("IfcRelAssociatesDocument")[0].get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		file.redo();
		expect((file.byType("IfcRelAssociatesDocument")[0].get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});
});
