// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/constraint/test_unassign_constraint.py`
// (src/ifcopenshell-python) -- all 3 real Python test methods ported (see
// `./assignConstraint.test.ts`'s own header comment for why this runs across every
// `AVAILABLE_SCHEMAS` entry instead of a separate IFC2X3 subclass).

import { describe, expect, test } from "vitest";
import { addObjective } from "../../../src/api/constraint/addObjective";
import { assignConstraint } from "../../../src/api/constraint/assignConstraint";
import { unassignConstraint } from "../../../src/api/constraint/unassignConstraint";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import * as constraintUtil from "../../../src/util/constraint";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.constraint.unassignConstraint (%s)", (schema) => {
	test("unassigning a constraint", () => {
		const file = createTestFile(schema);
		const constraint = addObjective(file, {});
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		assignConstraint(file, { products: [element, element2], constraint });

		unassignConstraint(file, { products: [element, element2], constraint });

		expect(constraintUtil.getConstrainedElements(element).size).toBe(0);
		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(0);
	});

	test("doing nothing if no constraint", () => {
		const file = createTestFile(schema);
		const constraint = addObjective(file, {});
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });

		unassignConstraint(file, { products: [element, element2], constraint });

		expect(constraintUtil.getConstrainedElements(element).size).toBe(0);
		expect(constraintUtil.getConstrainedElements(element2).size).toBe(0);
	});

	test("updating the rel when a reference is removed with multiple elements", () => {
		const file = createTestFile(schema);
		const constraint = addObjective(file, {});
		const element1 = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const element3 = createEntity(file, { ifcClass: "IfcWall" });
		assignConstraint(file, { products: [element1], constraint });
		const rel = file.byType("IfcRelAssociatesConstraint")[0];

		assignConstraint(file, { products: [element2, element3], constraint });
		unassignConstraint(file, { products: [element1, element2], constraint });

		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects).toHaveLength(1);
		expect(relatedObjects[0].equals(element3)).toBe(true);
	});

	// --- Original coverage: the "no products" early-return, not exercised anywhere in
	// real Python's own `test_unassign_constraint.py`. ---

	test("does nothing when products is empty", () => {
		const file = createTestFile(schema);
		const constraint = addObjective(file, {});
		const element = createEntity(file, { ifcClass: "IfcWall" });
		assignConstraint(file, { products: [element], constraint });

		unassignConstraint(file, { products: [], constraint });

		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(1);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.constraint.unassignConstraint Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed rel; redo removes it again", () => {
		const file = createTestFile(schema);
		const constraint = addObjective(file, {});
		const element = createEntity(file, { ifcClass: "IfcWall" });
		assignConstraint(file, { products: [element], constraint });

		file.beginTransaction();
		unassignConstraint(file, { products: [element], constraint });
		file.endTransaction();

		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(0);

		file.undo();
		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(1);

		file.redo();
		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(0);
	});

	test("undo restores a rel's RelatedObjects when unassigning one of multiple products", () => {
		const file = createTestFile(schema);
		const constraint = addObjective(file, {});
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		assignConstraint(file, { products: [element, element2], constraint });

		file.beginTransaction();
		unassignConstraint(file, { products: [element], constraint });
		file.endTransaction();

		const rel = file.byType("IfcRelAssociatesConstraint")[0];
		expect(rel.get("RelatedObjects")).toHaveLength(1);

		file.undo();
		expect(file.byType("IfcRelAssociatesConstraint")[0].get("RelatedObjects")).toHaveLength(2);

		file.redo();
		expect(file.byType("IfcRelAssociatesConstraint")[0].get("RelatedObjects")).toHaveLength(1);
	});
});
