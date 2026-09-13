// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/classification/test_add_reference.py`
// (src/ifcopenshell-python) -- all 3 real Python test methods ported, using this port's
// own `getReferences` (`util/classification.ts`, already landed) in place of Python's
// `ifcopenshell.util.classification.get_references`, and `createTestFile`'s
// already-populated `IfcProject` directly (see `./addClassification.test.ts`'s own
// header comment for why `createTestFile` needs no extra bootstrapping here, unlike
// real Python's genuinely-blank fixture).

import { describe, expect, test } from "vitest";
import { addClassification } from "../../../src/api/classification/addClassification";
import { addReference } from "../../../src/api/classification/addReference";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import * as classificationUtil from "../../../src/util/classification";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.classification.addReference (%s)", (schema) => {
	test("adding a reference", () => {
		const isIfc2x3 = schema === "IFC2X3";
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const result = addClassification(file, { classification: "Name" });
		addReference(file, {
			products: [element, element2],
			identification: "X",
			name: "Foobar",
			classification: result,
		});

		const references = [...classificationUtil.getReferences(element)];
		expect(references.length).toBe(1);
		expect(references[0].get(isIfc2x3 ? "ItemReference" : "Identification")).toBe("X");
		expect(references[0].get("Name")).toBe("Foobar");
		expect((references[0].get("ReferencedSource") as EntityInstance).equals(file.byType("IfcClassification")[0])).toBe(
			true,
		);

		const references2 = [...classificationUtil.getReferences(element2)];
		expect(references2.length).toBe(1);
		expect(references2[0].get(isIfc2x3 ? "ItemReference" : "Identification")).toBe("X");
		expect(references2[0].get("Name")).toBe("Foobar");
		expect(references2[0].equals(references[0])).toBe(true);

		const rel = file
			.byType("IfcRelAssociatesClassification")
			.find((r) => (r.get("RelatingClassification") as EntityInstance).equals(references[0]));
		expect((rel?.get("RelatedObjects") as EntityInstance[]).length).toBe(2);
	});

	test("adding a library-based reference", () => {
		const isIfc2x3 = schema === "IFC2X3";
		const library = createTestFile("IFC4");
		const classification = library.createEntity("IfcClassification", null, null, null, "Name");
		const reference = library.createEntity("IfcClassificationReference", null, "1", null, classification);

		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const result = addClassification(file, { classification });
		addReference(file, { products: [element, element2], reference, classification: result });

		const references = [...classificationUtil.getReferences(element)];
		expect(references.length).toBe(1);
		expect(references[0].get(isIfc2x3 ? "ItemReference" : "Identification")).toBe("1");
		expect((references[0].get("ReferencedSource") as EntityInstance).equals(file.byType("IfcClassification")[0])).toBe(
			true,
		);

		const references2 = [...classificationUtil.getReferences(element2)];
		expect(references2.length).toBe(1);
		expect(references2[0].get(isIfc2x3 ? "ItemReference" : "Identification")).toBe("1");
		expect((references2[0].get("ReferencedSource") as EntityInstance).equals(file.byType("IfcClassification")[0])).toBe(
			true,
		);
		expect(references[0].equals(references2[0])).toBe(true);

		const rel = file
			.byType("IfcRelAssociatesClassification")
			.find((r) => (r.get("RelatingClassification") as EntityInstance).equals(references[0]));
		expect((rel?.get("RelatedObjects") as EntityInstance[]).length).toBe(2);
	});

	test("adding a reference to a resource and to a root", () => {
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

		addReference(file, {
			products: [element, element2, element3],
			identification: "X",
			name: "Foobar",
			classification: result,
		});

		const references = [...classificationUtil.getReferences(element)];
		expect(references.length).toBe(1);
		expect(references[0].get("Identification")).toBe("X");
		expect(references[0].get("Name")).toBe("Foobar");
		expect((references[0].get("ReferencedSource") as EntityInstance).equals(file.byType("IfcClassification")[0])).toBe(
			true,
		);

		const references2 = [...classificationUtil.getReferences(element2)];
		expect(references2[0].get("Identification")).toBe("X");
		expect(references2[0].get("Name")).toBe("Foobar");
		expect(references2[0].equals(references[0])).toBe(true);

		const references3 = [...classificationUtil.getReferences(element3)];
		expect(references3[0].get("Identification")).toBe("X");
		expect(references3[0].get("Name")).toBe("Foobar");
		expect(references3[0].equals(references[0])).toBe(true);

		expect(
			(file.byType("IfcExternalReferenceRelationship")[0].get("RelatedResourceObjects") as EntityInstance[]).length,
		).toBe(2);
		const rel = file
			.byType("IfcRelAssociatesClassification")
			.find((r) => (r.get("RelatingClassification") as EntityInstance).equals(references[0]));
		expect((rel?.get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});

	// --- Original coverage: `is_lightweight`/existing-reference-reuse branches, not
	// exercised anywhere in real Python's own `test_add_reference.py` (confirmed by
	// reading it directly -- no test sets `is_lightweight=False`, nor calls
	// `add_reference` twice with the same `identification` against the same
	// classification). ---

	test("reuses an existing reference by identification instead of creating a duplicate", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const classification = addClassification(file, { classification: "Name" });

		const first = addReference(file, {
			products: [element],
			identification: "X",
			name: "Foobar",
			classification,
		});
		const second = addReference(file, {
			products: [element2],
			identification: "X",
			name: "Foobar",
			classification,
		});

		expect(file.byType("IfcClassificationReference").length).toBe(1);
		expect((first as EntityInstance).equals(second as EntityInstance)).toBe(true);
	});

	test("adding the same reference to already-assigned products is a no-op", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const classification = addClassification(file, { classification: "Name" });
		addReference(file, { products: [element], identification: "X", name: "Foobar", classification });

		const relCountBefore = file.byType("IfcRelAssociatesClassification").length;
		addReference(file, { products: [element], identification: "X", name: "Foobar", classification });

		expect(file.byType("IfcRelAssociatesClassification").length).toBe(relCountBefore);
		expect(file.byType("IfcClassificationReference").length).toBe(1);
	});

	test("non-lightweight library reference merges into an existing classification with the same name", () => {
		const library = createTestFile("IFC4");
		const libraryClassification = library.createEntity("IfcClassification", null, null, null, "Name");
		const reference = library.createEntity("IfcClassificationReference", null, "1", null, libraryClassification);

		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		// A pre-existing `IfcClassification` with the SAME name as the library's --
		// `isLightweight: false` should merge onto this one instead of creating a
		// second, duplicate `IfcClassification`.
		const existingClassification = addClassification(file, { classification: "Name" });

		addReference(file, {
			products: [element],
			reference,
			classification: existingClassification,
			isLightweight: false,
		});

		expect(file.byType("IfcClassification").length).toBe(1);
		const [migratedReference] = file.byType("IfcClassificationReference");
		expect((migratedReference.get("ReferencedSource") as EntityInstance).equals(existingClassification)).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.classification.addReference Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created reference and its rel; redo recreates them", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const classification = addClassification(file, { classification: "Name" });

		file.beginTransaction();
		const reference = addReference(file, {
			products: [element],
			identification: "X",
			name: "Foobar",
			classification,
		}) as EntityInstance;
		file.endTransaction();
		const referenceId = reference.id();

		expect(file.byType("IfcClassificationReference").length).toBe(1);
		expect(file.byType("IfcRelAssociatesClassification").length).toBe(2);

		file.undo();
		expect(() => file.byId(referenceId)).toThrow();
		expect(file.byType("IfcRelAssociatesClassification").length).toBe(1);

		file.redo();
		expect(file.byId(referenceId).get("Name")).toBe("Foobar");
		expect(file.byType("IfcRelAssociatesClassification").length).toBe(2);
	});

	test("undo restores a rel's RelatedObjects/OwnerHistory when adding a second product to an existing reference", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const classification = addClassification(file, { classification: "Name" });
		const reference = addReference(file, {
			products: [element],
			identification: "X",
			name: "Foobar",
			classification,
		}) as EntityInstance;

		file.beginTransaction();
		addReference(file, { products: [element2], identification: "X", name: "Foobar", classification });
		file.endTransaction();

		const rel = file
			.byType("IfcRelAssociatesClassification")
			.find((r) => (r.get("RelatingClassification") as EntityInstance).equals(reference)) as EntityInstance;
		expect((rel.get("RelatedObjects") as EntityInstance[]).length).toBe(2);

		file.undo();
		const relAfterUndo = file
			.byType("IfcRelAssociatesClassification")
			.find((r) => (r.get("RelatingClassification") as EntityInstance).equals(reference)) as EntityInstance;
		expect((relAfterUndo.get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		file.redo();
		const relAfterRedo = file
			.byType("IfcRelAssociatesClassification")
			.find((r) => (r.get("RelatingClassification") as EntityInstance).equals(reference)) as EntityInstance;
		expect((relAfterRedo.get("RelatedObjects") as EntityInstance[]).length).toBe(2);
	});
});
