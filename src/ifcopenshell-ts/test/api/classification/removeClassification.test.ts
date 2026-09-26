// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/classification/test_remove_classification.py`
// (src/ifcopenshell-python) -- all 3 real Python test methods ported, using
// `createTestFile`'s already-populated `IfcProject` directly (see
// `./addClassification.test.ts`'s own header comment for why).

import { describe, expect, test } from "vitest";
import { addClassification } from "../../../src/api/classification/addClassification";
import { addReference } from "../../../src/api/classification/addReference";
import { removeClassification } from "../../../src/api/classification/removeClassification";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.classification.removeClassification (%s)", (schema) => {
	test("removing a classification", () => {
		const file = createTestFile(schema);
		const element = addClassification(file, { classification: "Name" });
		removeClassification(file, { classification: element });
		expect(file.byType("IfcClassification").length).toBe(0);
	});

	test("removing a classification and all of its references", () => {
		const file = createTestFile(schema);
		const result = addClassification(file, { classification: "Name" });
		const element = createEntity(file, { ifcClass: "IfcWall" });
		addReference(file, { products: [element], identification: "X", name: "Foobar", classification: result });

		removeClassification(file, { classification: result });

		expect(file.byType("IfcClassification").length).toBe(0);
		expect(file.byType("IfcClassificationReference").length).toBe(0);
		expect(file.byType("IfcRelAssociatesClassification").length).toBe(0);
	});

	test("removing a classification and all of its references when associated with a resource", () => {
		// Despite its name (real Python's own test name), the fixture here is an
		// `IfcWall` -- `IfcRoot`, hence "rooted", not a non-rooted "resource" object --
		// so this never throws `TypeError` on IFC2X3 (matching real Python's own test,
		// which has no such branch either; unlike `./addReference.test.ts`'s "to a
		// resource and to a root" test, which genuinely does mix in non-rooted
		// products).
		const file = createTestFile(schema);
		const result = addClassification(file, { classification: "Name" });
		const element = file.createEntity("IfcWall", null, null, "Wall");

		addReference(file, { products: [element], identification: "X", name: "Foobar", classification: result });

		removeClassification(file, { classification: result });

		expect(file.byType("IfcClassification").length).toBe(0);
		expect(file.byType("IfcClassificationReference").length).toBe(0);
		if (schema !== "IFC2X3") {
			expect(file.byType("IfcExternalReferenceRelationship").length).toBe(0);
		}
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.classification.removeClassification Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed classification; redo removes it again", () => {
		const file = createTestFile(schema);
		const classification = addClassification(file, { classification: "Name" });
		const id = classification.id();

		file.beginTransaction();
		removeClassification(file, { classification });
		file.endTransaction();

		expect(() => file.byId(id)).toThrow();

		file.undo();
		expect(file.byId(id).get("Name")).toBe("Name");

		file.redo();
		expect(() => file.byId(id)).toThrow();
	});

	test("undo restores the cascaded reference/rel cleanup", () => {
		const file = createTestFile(schema);
		const classification = addClassification(file, { classification: "Name" });
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const reference = addReference(file, {
			products: [element],
			identification: "X",
			name: "Foobar",
			classification,
		});
		const classificationId = classification.id();
		const referenceId = (reference as EntityInstance).id();

		file.beginTransaction();
		removeClassification(file, { classification });
		file.endTransaction();

		expect(() => file.byId(classificationId)).toThrow();
		expect(() => file.byId(referenceId)).toThrow();

		file.undo();
		expect(file.byId(classificationId).isA("IfcClassification")).toBe(true);
		expect(file.byId(referenceId).isA("IfcClassificationReference")).toBe(true);

		file.redo();
		expect(() => file.byId(classificationId)).toThrow();
		expect(() => file.byId(referenceId)).toThrow();
	});
});
