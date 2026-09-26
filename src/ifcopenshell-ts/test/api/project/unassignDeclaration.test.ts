// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/project/test_unassign_declaration.py`
// (src/ifcopenshell-python) -- all 3 real Python test methods ported below, unchanged
// in shape. Same IFC4+-only schema gating as `assignDeclaration.test.ts` (see that
// file's own header comment) plus a dedicated regression test for the real, disclosed
// Python quirk found in `unassign_declaration.py` itself: `relatingContext` is a
// required parameter but never actually consulted by the function's own logic (see
// `unassignDeclaration.ts`'s own header comment for the full writeup) -- an
// unrelated/wrong `relatingContext` argument still un-declares `definitions` from
// whatever context they actually currently belong to.

import { describe, expect, test } from "vitest";
import { assignDeclaration } from "../../../src/api/project/assignDeclaration";
import { unassignDeclaration } from "../../../src/api/project/unassignDeclaration";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const NON_IFC2X3_SCHEMAS = AVAILABLE_SCHEMAS.filter((schema) => schema !== "IFC2X3");

/** Python: `get_context` test helper. */
function getContext(definition: EntityInstance): EntityInstance | null {
	const rel = (definition.get("HasContext") as EntityInstance[])[0] ?? null;
	return rel ? (rel.get("RelatingContext") as EntityInstance) : null;
}

describe.each(NON_IFC2X3_SCHEMAS)("api.project.unassignDeclaration (%s)", (schema) => {
	test("unassigning a definition", () => {
		const file = createTestFile(schema);
		const library = createEntity(file, { ifcClass: "IfcProjectLibrary" });
		const elementType = createEntity(file, { ifcClass: "IfcWallType" });
		const elementType2 = createEntity(file, { ifcClass: "IfcWallType" });
		assignDeclaration(file, { definitions: [elementType, elementType2], relatingContext: library });

		unassignDeclaration(file, { definitions: [elementType, elementType2], relatingContext: library });

		expect(getContext(elementType)).toBeNull();
		expect(file.byType("IfcRelDeclares").length).toBe(0);
	});

	test("doing nothing if there was no declaration", () => {
		const file = createTestFile(schema);
		const library = createEntity(file, { ifcClass: "IfcProjectLibrary" });
		const elementType = createEntity(file, { ifcClass: "IfcWallType" });
		const elementType2 = createEntity(file, { ifcClass: "IfcWallType" });

		unassignDeclaration(file, { definitions: [elementType, elementType2], relatingContext: library });

		expect(getContext(elementType)).toBeNull();
		expect(getContext(elementType2)).toBeNull();
	});

	test("updating the rel when a reference is removed with multiple elements", () => {
		const file = createTestFile(schema);
		const library = createEntity(file, { ifcClass: "IfcProjectLibrary" });
		const elementType1 = createEntity(file, { ifcClass: "IfcWallType" });
		const elementType2 = createEntity(file, { ifcClass: "IfcWallType" });
		const elementType3 = createEntity(file, { ifcClass: "IfcWallType" });
		assignDeclaration(file, { definitions: [elementType1], relatingContext: library });
		const rel = file.byType("IfcRelDeclares")[0];

		assignDeclaration(file, { definitions: [elementType2, elementType3], relatingContext: library });
		unassignDeclaration(file, { definitions: [elementType1, elementType2], relatingContext: library });

		const relatedDefinitions = rel.get("RelatedDefinitions") as EntityInstance[];
		expect(relatedDefinitions).toHaveLength(1);
		expect(relatedDefinitions[0].equals(elementType3)).toBe(true);
	});
});

// --- Real, disclosed Python quirk: `relatingContext` is accepted but never
// consulted -- see this file's and `unassignDeclaration.ts`'s own header comments. ---

describe.each(NON_IFC2X3_SCHEMAS)(
	"api.project.unassignDeclaration ignores relatingContext (disclosed quirk) (%s)",
	(schema) => {
		test("un-declares from whatever context the definition actually belongs to, even a mismatched relatingContext", () => {
			const file = createTestFile(schema);
			const library = createEntity(file, { ifcClass: "IfcProjectLibrary" });
			const unrelatedLibrary = createEntity(file, { ifcClass: "IfcProjectLibrary" });
			const elementType = createEntity(file, { ifcClass: "IfcWallType" });
			assignDeclaration(file, { definitions: [elementType], relatingContext: library });

			// `relatingContext` here is `unrelatedLibrary`, not the real `library` this
			// definition is actually declared under -- real Python's own logic never
			// checks this, so it still un-declares successfully.
			unassignDeclaration(file, { definitions: [elementType], relatingContext: unrelatedLibrary });

			expect(getContext(elementType)).toBeNull();
			expect(file.byType("IfcRelDeclares").length).toBe(0);
		});
	},
);

// --- Real, disclosed IFC2X3 schema limitation -- see `assignDeclaration.test.ts`'s
// identical section for the full rationale. ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.project.unassignDeclaration (IFC2X3)", () => {
	test("throws because the HasContext/IfcRelDeclares machinery doesn't exist on IFC2X3", () => {
		const file = createTestFile("IFC2X3");
		const elementType = createEntity(file, { ifcClass: "IfcWallType" });
		const project = file.byType("IfcProject")[0] ?? createEntity(file, { ifcClass: "IfcProject" });
		expect(() => unassignDeclaration(file, { definitions: [elementType], relatingContext: project })).toThrow();
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(NON_IFC2X3_SCHEMAS)("api.project.unassignDeclaration Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the deleted IfcRelDeclares and HasContext; redo removes it again", () => {
		const file = createTestFile(schema);
		const library = createEntity(file, { ifcClass: "IfcProjectLibrary" });
		const elementType = createEntity(file, { ifcClass: "IfcWallType" });
		const rel = assignDeclaration(file, { definitions: [elementType], relatingContext: library }) as EntityInstance;
		const relId = rel.id();

		file.beginTransaction();
		unassignDeclaration(file, { definitions: [elementType], relatingContext: library });
		file.endTransaction();

		expect(() => file.byId(relId)).toThrow();
		expect(getContext(elementType)).toBeNull();

		file.undo();
		expect(file.byId(relId).isA("IfcRelDeclares")).toBe(true);
		expect(getContext(elementType)?.equals(library)).toBe(true);

		file.redo();
		expect(() => file.byId(relId)).toThrow();
		expect(getContext(elementType)).toBeNull();
	});

	test("undo restores a rewritten RelatedDefinitions list (rel kept, not deleted)", () => {
		const file = createTestFile(schema);
		const library = createEntity(file, { ifcClass: "IfcProjectLibrary" });
		const elementType1 = createEntity(file, { ifcClass: "IfcWallType" });
		const elementType2 = createEntity(file, { ifcClass: "IfcWallType" });
		const rel = assignDeclaration(file, {
			definitions: [elementType1, elementType2],
			relatingContext: library,
		}) as EntityInstance;

		file.beginTransaction();
		unassignDeclaration(file, { definitions: [elementType1], relatingContext: library });
		file.endTransaction();

		expect(rel.get("RelatedDefinitions") as EntityInstance[]).toHaveLength(1);

		file.undo();
		expect(rel.get("RelatedDefinitions") as EntityInstance[]).toHaveLength(2);

		file.redo();
		expect(rel.get("RelatedDefinitions") as EntityInstance[]).toHaveLength(1);
	});
});
