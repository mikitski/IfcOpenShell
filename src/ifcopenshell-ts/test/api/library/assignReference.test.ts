// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/library/test_assign_reference.py` (src/ifcopenshell-python)
// -- both real Python test methods ported, using `addReference`/`addLibrary` (this
// port's own established, listener-wrapped constructors) rather than real Python's own
// bare `self.file.createIfcLibraryReference()`/`self.file.createIfcWall()` -- equivalent
// end states, matching `../document/assignDocument.test.ts`'s own established
// convention for this exact same real Python test shape.

import { describe, expect, test } from "vitest";
import { addLibrary } from "../../../src/api/library/addLibrary";
import { addReference } from "../../../src/api/library/addReference";
import { assignReference } from "../../../src/api/library/assignReference";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import * as elementUtil from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.library.assignReference (%s)", (schema) => {
	test("assigning a reference", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });
		const reference = addReference(file, { library });
		const product = createEntity(file, { ifcClass: "IfcWall" });
		const product2 = createEntity(file, { ifcClass: "IfcWall" });
		const product3 = createEntity(file, { ifcClass: "IfcWall" });

		assignReference(file, { products: [product], reference });
		const rel = file.byType("IfcRelAssociatesLibrary")[0];
		let relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(1);
		expect(relatedObjects[0].equals(product)).toBe(true);

		assignReference(file, { products: [product2, product3], reference });
		relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(3);
		const referenced = elementUtil.getReferencedElements(reference);
		expect(referenced.size).toBe(3);
	});

	test("not assigning twice", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });
		const reference = addReference(file, { library });
		const product = createEntity(file, { ifcClass: "IfcWall" });

		assignReference(file, { products: [product], reference });
		assignReference(file, { products: [product], reference });

		const rel = file.byType("IfcRelAssociatesLibrary")[0];
		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(1);
		expect(relatedObjects[0].equals(product)).toBe(true);
		expect(file.byType("IfcRelAssociatesLibrary").length).toBe(1);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.library.assignReference Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created rel; redo recreates it", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });
		const reference = addReference(file, { library });
		const product = createEntity(file, { ifcClass: "IfcWall" });

		file.beginTransaction();
		assignReference(file, { products: [product], reference });
		file.endTransaction();

		expect(file.byType("IfcRelAssociatesLibrary").length).toBe(1);

		file.undo();
		expect(file.byType("IfcRelAssociatesLibrary").length).toBe(0);

		file.redo();
		expect(file.byType("IfcRelAssociatesLibrary").length).toBe(1);
	});

	test("undo restores a rel's RelatedObjects/OwnerHistory when assigning a second product", () => {
		const file = createTestFile(schema);
		const library = addLibrary(file, { name: "Name" });
		const reference = addReference(file, { library });
		const product = createEntity(file, { ifcClass: "IfcWall" });
		const product2 = createEntity(file, { ifcClass: "IfcWall" });
		assignReference(file, { products: [product], reference });

		file.beginTransaction();
		assignReference(file, { products: [product2], reference });
		file.endTransaction();

		const rel = file.byType("IfcRelAssociatesLibrary")[0];
		expect((rel.get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		file.undo();
		expect((file.byType("IfcRelAssociatesLibrary")[0].get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		file.redo();
		expect((file.byType("IfcRelAssociatesLibrary")[0].get("RelatedObjects") as EntityInstance[]).length).toBe(2);
	});
});
