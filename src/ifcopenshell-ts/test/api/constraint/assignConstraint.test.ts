// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/constraint/test_assign_constraint.py`
// (src/ifcopenshell-python) -- all 3 real Python test methods ported (the real Python
// suite tests IFC4 and IFC2X3 via a shared base class + subclass; this port runs the
// same 3 cases across every `AVAILABLE_SCHEMAS` entry instead, per this project's own
// established `describe.each` convention).

import { describe, expect, test } from "vitest";
import { addObjective } from "../../../src/api/constraint/addObjective";
import { assignConstraint } from "../../../src/api/constraint/assignConstraint";
import { createEntity } from "../../../src/api/root/createEntity";
import * as constraintUtil from "../../../src/util/constraint";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.constraint.assignConstraint (%s)", (schema) => {
	test("assigning a constraint", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const constraint = addObjective(file, {});

		assignConstraint(file, { products: [element, element2], constraint });

		const constrained = constraintUtil.getConstrainedElements(constraint);
		expect(constrained.size).toBe(2);
		expect([...constrained].some((e) => e.equals(element))).toBe(true);
		expect([...constrained].some((e) => e.equals(element2))).toBe(true);
		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(1);
	});

	test("doing nothing if the constraint is already assigned", () => {
		const file = createTestFile(schema);
		const constraint = addObjective(file, {});
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		assignConstraint(file, { products: [element, element2], constraint });

		const totalBefore = [...file].length;
		assignConstraint(file, { products: [element, element2], constraint });

		expect([...file].length).toBe(totalBefore);
	});

	test("that old relationships are updated if they still contain elements", () => {
		const file = createTestFile(schema);
		const constraint = addObjective(file, {});
		const element1 = createEntity(file, { ifcClass: "IfcWall" });
		assignConstraint(file, { products: [element1], constraint });
		const rel = file.byType("IfcRelAssociatesConstraint")[0];

		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const element3 = createEntity(file, { ifcClass: "IfcWall" });
		assignConstraint(file, { products: [element2, element3], constraint });

		expect(rel.get("RelatedObjects")).toHaveLength(3);
	});

	// --- Original coverage: the "no products" early-return, not exercised anywhere in
	// real Python's own `test_assign_constraint.py`. ---

	test("returns undefined and does nothing when products is empty", () => {
		const file = createTestFile(schema);
		const constraint = addObjective(file, {});
		const result = assignConstraint(file, { products: [], constraint });
		expect(result).toBeUndefined();
		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(0);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.constraint.assignConstraint Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created rel; redo recreates it", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const constraint = addObjective(file, {});

		file.beginTransaction();
		assignConstraint(file, { products: [element], constraint });
		file.endTransaction();

		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(1);

		file.undo();
		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(0);

		file.redo();
		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(1);
	});

	test("undo restores a rel's RelatedObjects/OwnerHistory when assigning a second product", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		const constraint = addObjective(file, {});
		assignConstraint(file, { products: [element], constraint });

		file.beginTransaction();
		assignConstraint(file, { products: [element2], constraint });
		file.endTransaction();

		const rel = file.byType("IfcRelAssociatesConstraint")[0];
		expect(rel.get("RelatedObjects")).toHaveLength(2);

		file.undo();
		expect(file.byType("IfcRelAssociatesConstraint")[0].get("RelatedObjects")).toHaveLength(1);

		file.redo();
		expect(file.byType("IfcRelAssociatesConstraint")[0].get("RelatedObjects")).toHaveLength(2);
	});
});
