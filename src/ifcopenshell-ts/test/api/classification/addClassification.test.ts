// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/classification/test_add_classification.py`
// (src/ifcopenshell-python) -- both real Python test methods ported verbatim, adapted
// to this port's own `createTestFile` fixture convention: real Python's `test.bootstrap
// .IFC4`/`IFC2X3` fixture starts genuinely blank (no pre-existing `IfcProject`), so its
// own test body explicitly calls `ifcopenshell.api.root.create_entity(self.file,
// ifc_class="IfcProject")` first. `createTestFile` (this port's own fixture) already
// pre-populates a default `IfcProject` via `template.create`, so that step is simply
// unnecessary here -- `addClassification`'s own `relateToProject` step picks up
// `createTestFile`'s pre-existing project directly, matching `../group/*.test.ts`'s
// own established "don't strip/rebuild the bootstrap project, just use what
// `createTestFile` already provides" precedent (as opposed to `../context/*.test.ts`'s
// different `stripProjectBootstrap` convention, which exists for that chunk's own
// need to test a genuinely from-scratch `IfcProject`/`RepresentationContexts` -- not
// applicable here). The library-based test uses `createTestFile("IFC4")` as the
// "library" file (a second, independent `IfcFile`) -- real Python uses a bare
// `ifcopenshell.file()`, but that constructor isn't ported; `createTestFile` stands in
// fine here since `Migrator.migrate` only cares about the one `IfcClassification`
// entity being migrated, not the rest of the source file.

import { describe, expect, test } from "vitest";
import { addClassification } from "../../../src/api/classification/addClassification";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.classification.addClassification (%s)", (schema) => {
	test("adding a classification", () => {
		const file = createTestFile(schema);
		addClassification(file, { classification: "Name" });
		expect(file.byType("IfcClassification")[0].get("Name")).toBe("Name");
	});

	test("adding a classification from a library", () => {
		const library = createTestFile("IFC4");
		const classification = library.createEntity("IfcClassification", null, null, null, "Name");

		const file = createTestFile(schema);
		addClassification(file, { classification });
		expect(file.byType("IfcClassification")[0].get("Name")).toBe("Name");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.classification.addClassification Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcClassification and its project rel; redo recreates them", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		const classification = addClassification(file, { classification: "Name" });
		file.endTransaction();
		const classificationId = classification.id();

		expect(file.byType("IfcClassification").length).toBe(1);
		expect(file.byType("IfcRelAssociatesClassification").length).toBe(1);

		file.undo();
		expect(() => file.byId(classificationId)).toThrow();
		expect(file.byType("IfcRelAssociatesClassification").length).toBe(0);

		file.redo();
		expect(file.byId(classificationId).get("Name")).toBe("Name");
		expect(file.byType("IfcRelAssociatesClassification").length).toBe(1);
	});

	test("undo/redo across a library-migrated classification", () => {
		const library = createTestFile("IFC4");
		const classification = library.createEntity("IfcClassification", null, null, null, "Name");

		const file = createTestFile(schema);

		file.beginTransaction();
		const result = addClassification(file, { classification });
		file.endTransaction();
		const resultId = result.id();

		file.undo();
		expect(() => file.byId(resultId)).toThrow();

		file.redo();
		expect(file.byId(resultId).get("Name")).toBe("Name");
	});
});
