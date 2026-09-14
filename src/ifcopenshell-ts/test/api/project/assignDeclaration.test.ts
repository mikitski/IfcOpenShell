// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/project/test_assign_declaration.py` (src/ifcopenshell-
// python) -- all 3 real Python test methods ported below, unchanged in shape.
// `IfcRelDeclares` is IFC4+-only (confirmed absent from `src/generated/ifc2x3.d.ts`
// entirely -- see `assignDeclaration.ts`'s own header comment), so the ported suite
// runs only against `NON_IFC2X3_SCHEMAS`, matching
// `test/api/constraint/addMetricReference.test.ts`'s established pattern for the same
// situation, plus a dedicated IFC2X3-throws regression test gated with
// `describe.skipIf` per this chunk's CI schema-availability requirement (CI's native
// build only registers IFC4).

import { beforeEach, describe, expect, test } from "vitest";
import { assignDeclaration } from "../../../src/api/project/assignDeclaration";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const NON_IFC2X3_SCHEMAS = AVAILABLE_SCHEMAS.filter((schema) => schema !== "IFC2X3");

beforeEach(() => {
	// No owner-tracking config to reset for this module (unlike `api.owner`'s own
	// `ownerSettings`), kept for symmetry with sibling test files -- no-op here.
});

/** Python: `get_declared_definitions` test helper. */
function getDeclaredDefinitions(project: EntityInstance): Set<EntityInstance> {
	const definitions = new Set<EntityInstance>();
	for (const declares of project.get("Declares") as EntityInstance[]) {
		for (const definition of declares.get("RelatedDefinitions") as EntityInstance[]) {
			definitions.add(definition);
		}
	}
	return definitions;
}

function definitionSetEquals(actual: Set<EntityInstance>, expected: readonly EntityInstance[]): boolean {
	if (actual.size !== expected.length) return false;
	return expected.every((e) => [...actual].some((a) => a.equals(e)));
}

describe.each(NON_IFC2X3_SCHEMAS)("api.project.assignDeclaration (%s)", (schema) => {
	test("assign a declaration", () => {
		const file = createTestFile(schema);
		const elementType = createEntity(file, { ifcClass: "IfcWallType" });
		const elementType2 = createEntity(file, { ifcClass: "IfcWallType" });
		const library = createEntity(file, { ifcClass: "IfcProjectLibrary" });

		assignDeclaration(file, { definitions: [elementType, elementType2], relatingContext: library });

		expect(definitionSetEquals(getDeclaredDefinitions(library), [elementType, elementType2])).toBe(true);
		expect(file.byType("IfcRelDeclares").length).toBe(1);
	});

	test("doing nothing if the library is already assigned", () => {
		const file = createTestFile(schema);
		const elementType = createEntity(file, { ifcClass: "IfcWallType" });
		const elementType2 = createEntity(file, { ifcClass: "IfcWallType" });
		const library = createEntity(file, { ifcClass: "IfcProjectLibrary" });
		assignDeclaration(file, { definitions: [elementType, elementType2], relatingContext: library });

		const totalElements = [...file].length;
		const result = assignDeclaration(file, { definitions: [elementType, elementType2], relatingContext: library });

		expect([...file].length).toBe(totalElements);
		expect(result).toBeNull();
	});

	test("old relationships are updated if they still contain elements", () => {
		const file = createTestFile(schema);
		const elementType = createEntity(file, { ifcClass: "IfcWallType" });
		const library = createEntity(file, { ifcClass: "IfcProjectLibrary" });
		assignDeclaration(file, { definitions: [elementType], relatingContext: library });
		const rel = file.byType("IfcRelDeclares")[0];

		const elementType2 = createEntity(file, { ifcClass: "IfcWallType" });
		const elementType3 = createEntity(file, { ifcClass: "IfcWallType" });
		assignDeclaration(file, { definitions: [elementType2, elementType3], relatingContext: library });

		expect((rel.get("RelatedDefinitions") as EntityInstance[]).length).toBe(3);
	});
});

// --- Real, disclosed IFC2X3 schema limitation: `IfcRelDeclares`/`IfcProjectLibrary`
// don't exist on IFC2X3 at all (confirmed against `ifc2x3.d.ts`), and real Python adds
// no runtime guard for it -- this throws, matching real Python's own unguarded
// behavior. ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.project.assignDeclaration (IFC2X3)", () => {
	test("IfcProjectLibrary doesn't exist on IFC2X3", () => {
		const file = createTestFile("IFC2X3");
		expect(() => createEntity(file, { ifcClass: "IfcProjectLibrary" })).toThrow();
	});

	test("throws because the Declares/IfcRelDeclares machinery doesn't exist on IFC2X3", () => {
		const file = createTestFile("IFC2X3");
		const elementType = createEntity(file, { ifcClass: "IfcWallType" });
		const project = file.byType("IfcProject")[0] ?? createEntity(file, { ifcClass: "IfcProject" });
		expect(() => assignDeclaration(file, { definitions: [elementType], relatingContext: project })).toThrow();
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(NON_IFC2X3_SCHEMAS)("api.project.assignDeclaration Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcRelDeclares and restores HasContext; redo reapplies it", () => {
		const file = createTestFile(schema);
		const elementType = createEntity(file, { ifcClass: "IfcWallType" });
		const library = createEntity(file, { ifcClass: "IfcProjectLibrary" });

		file.beginTransaction();
		const rel = assignDeclaration(file, { definitions: [elementType], relatingContext: library });
		file.endTransaction();
		const relId = (rel as EntityInstance).id();

		expect(file.byType("IfcRelDeclares").length).toBe(1);
		expect((elementType.get("HasContext") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect(() => file.byId(relId)).toThrow();
		expect((elementType.get("HasContext") as EntityInstance[]).length).toBe(0);

		file.redo();
		expect(file.byId(relId).isA("IfcRelDeclares")).toBe(true);
		expect((elementType.get("HasContext") as EntityInstance[]).length).toBe(1);
	});

	test("undo restores a merged-into RelatedDefinitions list", () => {
		const file = createTestFile(schema);
		const elementType = createEntity(file, { ifcClass: "IfcWallType" });
		const library = createEntity(file, { ifcClass: "IfcProjectLibrary" });
		const rel = assignDeclaration(file, { definitions: [elementType], relatingContext: library }) as EntityInstance;

		const elementType2 = createEntity(file, { ifcClass: "IfcWallType" });

		file.beginTransaction();
		assignDeclaration(file, { definitions: [elementType2], relatingContext: library });
		file.endTransaction();

		expect((rel.get("RelatedDefinitions") as EntityInstance[]).length).toBe(2);

		file.undo();
		expect((rel.get("RelatedDefinitions") as EntityInstance[]).length).toBe(1);

		file.redo();
		expect((rel.get("RelatedDefinitions") as EntityInstance[]).length).toBe(2);
	});
});
