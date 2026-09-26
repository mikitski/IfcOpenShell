// This file was generated with the assistance of an AI coding tool.
//
// Original test coverage for `src/api/constraint/addObjective.ts` -- no
// `test/api/constraint/test_add_objective.py` exists in the real Python source to port
// from (confirmed: `src/ifcopenshell-python/test/api/constraint/` only has
// `test_assign_constraint.py`/`test_unassign_constraint.py`), so this file's coverage is
// written directly against `add_objective.py`'s own source / `addObjective.ts`'s port,
// matching `../classification/editClassification.test.ts`'s established shape for
// functions Python itself doesn't directly test.

import { describe, expect, test } from "vitest";
import { addObjective } from "../../../src/api/constraint/addObjective";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.constraint.addObjective (%s)", (schema) => {
	test("creates a new IfcObjective with the documented defaults", () => {
		const file = createTestFile(schema);
		const objective = addObjective(file, {});

		expect(objective.isA("IfcObjective")).toBe(true);
		expect(objective.get("Name")).toBe("Unnamed");
		expect(objective.get("ConstraintGrade")).toBe("NOTDEFINED");
		expect(objective.get("ObjectiveQualifier")).toBe("NOTDEFINED");
	});

	test("each call creates an independent objective", () => {
		const file = createTestFile(schema);
		addObjective(file, {});
		addObjective(file, {});
		expect(file.byType("IfcObjective").length).toBe(2);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.constraint.addObjective Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created objective; redo recreates it", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		addObjective(file, {});
		file.endTransaction();

		expect(file.byType("IfcObjective").length).toBe(1);

		file.undo();
		expect(file.byType("IfcObjective").length).toBe(0);

		file.redo();
		expect(file.byType("IfcObjective").length).toBe(1);
	});
});
