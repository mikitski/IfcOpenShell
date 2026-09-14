// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/library/test_unassign_reference.py`
// (src/ifcopenshell-python) -- the sole real Python test method ported.

import { describe, expect, test } from "vitest";
import { addLibrary } from "../../../src/api/library/addLibrary";
import { addReference } from "../../../src/api/library/addReference";
import { assignReference } from "../../../src/api/library/assignReference";
import { unassignReference } from "../../../src/api/library/unassignReference";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import * as elementUtil from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.library.unassignReference (%s)", (schema) => {
	test("unassigning a reference", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });
		const reference = addReference(file, { library });
		const products = [
			createEntity(file, { ifcClass: "IfcWall" }),
			createEntity(file, { ifcClass: "IfcWall" }),
			createEntity(file, { ifcClass: "IfcWall" }),
		];
		assignReference(file, { products, reference });

		unassignReference(file, { products: products.slice(0, 1), reference });
		let referenced = [...elementUtil.getReferencedElements(reference)];
		expect(referenced.length).toBe(2);
		expect(referenced.some((p) => p.equals(products[0]))).toBe(false);

		unassignReference(file, { products: products.slice(1), reference });
		referenced = [...elementUtil.getReferencedElements(reference)];
		expect(referenced.length).toBe(0);
		expect(file.byType("IfcRelAssociatesLibrary").length).toBe(0);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.library.unassignReference Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the fully-removed rel; redo removes it again", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });
		const reference = addReference(file, { library });
		const product = createEntity(file, { ifcClass: "IfcWall" });
		assignReference(file, { products: [product], reference });

		file.beginTransaction();
		unassignReference(file, { products: [product], reference });
		file.endTransaction();

		expect(file.byType("IfcRelAssociatesLibrary").length).toBe(0);

		file.undo();
		expect(file.byType("IfcRelAssociatesLibrary").length).toBe(1);

		file.redo();
		expect(file.byType("IfcRelAssociatesLibrary").length).toBe(0);
	});

	test("undo restores a detached (not fully deleted) rel's RelatedObjects", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });
		const reference = addReference(file, { library });
		const product = createEntity(file, { ifcClass: "IfcWall" });
		const product2 = createEntity(file, { ifcClass: "IfcWall" });
		assignReference(file, { products: [product, product2], reference });

		file.beginTransaction();
		unassignReference(file, { products: [product], reference });
		file.endTransaction();

		expect((file.byType("IfcRelAssociatesLibrary")[0].get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect((file.byType("IfcRelAssociatesLibrary")[0].get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		file.redo();
		expect((file.byType("IfcRelAssociatesLibrary")[0].get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});
});
