// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/feature/test_remove_feature.py`
// (src/ifcopenshell-python, `TestRemoveFeature`/`TestRemoveFeatureIFC2X3` -- the
// IFC2X3 subclass adds no override, so both real classes run the exact same 3 test
// bodies). Ported below via `describe.each(AVAILABLE_SCHEMAS)`, additionally running
// against IFC4X3 too (nothing here is schema-specific), matching this project's
// established precedent.
//
// `test_removing_a_simple_feature` asserts `len(list(self.file)) == 0`, which only
// holds against a genuinely blank starting file -- real Python's own
// `test.bootstrap.IFC4`/`IFC2X3` fixture is a bare `api.project.create_file(...)`, not
// `template.create()`'s pre-populated project. This port uses `api.project.createFile`
// directly for that one test, matching `test/api/style/removeSurfaceStyle.test.ts`'s
// own established `blankFile` precedent; every other test here uses `createTestFile`
// (only specific entity-type counts are asserted, not the whole file's population).

import { describe, expect, test } from "vitest";
import { addFeature } from "../../../src/api/feature/addFeature";
import { addFilling } from "../../../src/api/feature/addFilling";
import { removeFeature } from "../../../src/api/feature/removeFeature";
import { createFile } from "../../../src/api/project/createFile";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

function blankFile(schema: Schema): IfcFile {
	return createFile(undefined, { version: schema });
}

describe.each(AVAILABLE_SCHEMAS)("api.feature.removeFeature (%s)", (schema) => {
	test("removing a simple feature", () => {
		const file = blankFile(schema);
		const feature = file.createEntity("IfcOpeningElement");
		removeFeature(file, { feature });
		expect([...file].length).toBe(0);
	});

	test("removing an opening voiding a wall", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		addFeature(file, { feature: opening, element: wall });
		removeFeature(file, { feature: opening });
		expect(file.byType("IfcOpeningElement").length).toBe(0);
		expect(file.byType("IfcRelVoidsElement").length).toBe(0);
		expect(file.byType("IfcWall").length).toBe(1);
	});

	test("removing an opening voiding a wall with a filling", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		const door = file.createEntity("IfcDoor");
		addFeature(file, { feature: opening, element: wall });
		addFilling(file, { opening, element: door });
		removeFeature(file, { feature: opening });
		expect(file.byType("IfcOpeningElement").length).toBe(0);
		expect(file.byType("IfcRelVoidsElement").length).toBe(0);
		expect(file.byType("IfcRelFillsElement").length).toBe(0);
		expect(file.byType("IfcWall").length).toBe(1);
		expect(file.byType("IfcDoor").length).toBe(1);
	});
});

// --- Genuinely new coverage (no real Python counterpart): the IFC4 `IfcSurfaceFeature`
// aggregation path (`api.aggregate.unassignObject`) removes cleanly. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC4"))(
	"api.feature.removeFeature -- surface feature aggregation path (%s, new coverage)",
	(schema) => {
		test("removing a surface feature added via aggregation", () => {
			const file = createTestFile(schema);
			const wall = file.createEntity("IfcWall");
			const feature = file.createEntity("IfcSurfaceFeature");
			addFeature(file, { feature, element: wall });
			removeFeature(file, { feature });
			expect(file.byType("IfcSurfaceFeature").length).toBe(0);
			expect(file.byType("IfcRelAggregates").length).toBe(0);
			expect(file.byType("IfcWall").length).toBe(1);
		});
	},
);

// --- Disclosed, real upstream Python BUG regression coverage (no real Python
// counterpart -- see `removeFeature.ts`'s own header comment: this path is never
// actually exercised by real Python's own test suite either, due to a *different*,
// unrelated class-shadowing bug in `test_add_feature.py`). Removing a genuine IFC4X3
// `IfcSurfaceFeature` (added via the real `IfcRelAdheresToElement` path) throws,
// because `remove_feature`'s own non-IFC4 branch reads `ProjectsElements` instead of
// `AdheresToElement`. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC4X3"))(
	"api.feature.removeFeature -- disclosed upstream bug (%s)",
	(schema) => {
		test("removing an IFC4X3 surface feature throws (real Python bug, preserved verbatim)", () => {
			const file = createTestFile(schema);
			const wall = file.createEntity("IfcWall");
			const feature = file.createEntity("IfcSurfaceFeature");
			addFeature(file, { feature, element: wall });
			expect(() => removeFeature(file, { feature })).toThrow(/has no attribute 'ProjectsElements'/);
		});
	},
);

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.feature.removeFeature Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed opening and its void rel; redo removes them again", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		addFeature(file, { feature: opening, element: wall });
		const openingId = opening.id();

		file.beginTransaction();
		removeFeature(file, { feature: opening });
		file.endTransaction();

		expect(file.byType("IfcOpeningElement").length).toBe(0);
		expect(file.byType("IfcRelVoidsElement").length).toBe(0);

		file.undo();
		expect(file.byId(openingId).isA("IfcOpeningElement")).toBe(true);
		expect(file.byType("IfcRelVoidsElement").length).toBe(1);

		file.redo();
		expect(() => file.byId(openingId)).toThrow();
		expect(file.byType("IfcRelVoidsElement").length).toBe(0);
	});
});
