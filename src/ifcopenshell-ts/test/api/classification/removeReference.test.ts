// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/classification/test_remove_reference.py`
// (src/ifcopenshell-python) -- all 3 real Python test methods ported, using
// `createTestFile`'s already-populated `IfcProject` directly (see
// `./addClassification.test.ts`'s own header comment for why) and this port's own
// `getReferences` (`util/classification.ts`) in place of Python's
// `ifcopenshell.util.classification.get_references`.

import { describe, expect, test } from "vitest";
import { addClassification } from "../../../src/api/classification/addClassification";
import { addReference } from "../../../src/api/classification/addReference";
import { removeReference } from "../../../src/api/classification/removeReference";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import * as classificationUtil from "../../../src/util/classification";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.classification.removeReference (%s)", (schema) => {
	test("removing a reference", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const result = addClassification(file, { classification: "Name" });
		const reference = addReference(file, {
			products: [element, element2],
			identification: "X",
			name: "Foobar",
			classification: result,
		}) as EntityInstance;

		removeReference(file, { products: [element, element2], reference });

		expect(classificationUtil.getReferences(element).size).toBe(0);
		expect(classificationUtil.getReferences(element2).size).toBe(0);
		expect(file.byType("IfcClassificationReference").length).toBe(0);
	});

	test("removing a reference from a resource and from a root", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcMaterial");
		const element2 = file.createEntity("IfcCostValue");
		const element3 = createEntity(file, { ifcClass: "IfcWall" });
		const result = addClassification(file, { classification: "Name" });

		if (schema === "IFC2X3") {
			expect(() =>
				addReference(file, {
					products: [element, element2, element3],
					identification: "X",
					name: "Foobar",
					classification: result,
				}),
			).toThrow(TypeError);
			return;
		}

		const reference = addReference(file, {
			products: [element, element2, element3],
			identification: "X",
			name: "Foobar",
			classification: result,
		}) as EntityInstance;

		removeReference(file, { products: [element, element2, element3], reference });

		expect(classificationUtil.getReferences(element).size).toBe(0);
		expect(classificationUtil.getReferences(element2).size).toBe(0);
		expect(classificationUtil.getReferences(element3).size).toBe(0);
		expect(file.byType("IfcClassificationReference").length).toBe(0);
	});

	test("retaining the reference if still in use", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const element3 = createEntity(file, { ifcClass: "IfcWall" });
		const result = addClassification(file, { classification: "Name" });
		const reference = addReference(file, {
			products: [element, element2, element3],
			identification: "X",
			name: "Foobar",
			classification: result,
		}) as EntityInstance;

		expect(file.byType("IfcClassificationReference").length).toBe(1);
		removeReference(file, { products: [element, element2], reference });
		expect(file.byType("IfcClassificationReference").length).toBe(1);
		removeReference(file, { products: [element3], reference });
		expect(file.byType("IfcClassificationReference").length).toBe(0);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.classification.removeReference Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the fully-removed reference and its rel; redo removes them again", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const result = addClassification(file, { classification: "Name" });
		const reference = addReference(file, {
			products: [element],
			identification: "X",
			name: "Foobar",
			classification: result,
		}) as EntityInstance;
		const referenceId = reference.id();

		file.beginTransaction();
		removeReference(file, { products: [element], reference });
		file.endTransaction();

		expect(() => file.byId(referenceId)).toThrow();

		file.undo();
		expect(file.byId(referenceId).get("Name")).toBe("Foobar");

		file.redo();
		expect(() => file.byId(referenceId)).toThrow();
	});

	test("undo restores a detached (not fully deleted) rel's RelatedObjects", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const result = addClassification(file, { classification: "Name" });
		const reference = addReference(file, {
			products: [element, element2],
			identification: "X",
			name: "Foobar",
			classification: result,
		}) as EntityInstance;

		file.beginTransaction();
		removeReference(file, { products: [element], reference });
		file.endTransaction();

		expect(file.byType("IfcClassificationReference").length).toBe(1);
		const relAfter = file
			.byType("IfcRelAssociatesClassification")
			.find((r) => (r.get("RelatingClassification") as EntityInstance | null)?.equals(reference)) as EntityInstance;
		expect((relAfter.get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		file.undo();
		const relBeforeRemoval = file
			.byType("IfcRelAssociatesClassification")
			.find((r) => (r.get("RelatingClassification") as EntityInstance | null)?.equals(reference)) as EntityInstance;
		expect((relBeforeRemoval.get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		file.redo();
		const relAfterRedo = file
			.byType("IfcRelAssociatesClassification")
			.find((r) => (r.get("RelatingClassification") as EntityInstance | null)?.equals(reference)) as EntityInstance;
		expect((relAfterRedo.get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});
});
