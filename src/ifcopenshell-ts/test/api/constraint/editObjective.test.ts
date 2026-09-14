// This file was generated with the assistance of an AI coding tool.
//
// Original test coverage for `src/api/constraint/editObjective.ts` -- no real Python
// `test_edit_objective.py` exists (confirmed by directory listing, matching
// `edit_classification.py`/`edit_reference.py`'s own established gap in sibling
// modules), so this file's coverage is written directly against `edit_objective.py`'s
// own source / `editObjective.ts`'s port, matching
// `../classification/editClassification.test.ts`'s established shape.

import { describe, expect, test } from "vitest";
import { addObjective } from "../../../src/api/constraint/addObjective";
import { editObjective } from "../../../src/api/constraint/editObjective";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.constraint.editObjective (%s)", (schema) => {
	test("sets each given attribute", () => {
		const file = createTestFile(schema);
		const objective = addObjective(file, {});

		editObjective(file, {
			objective,
			attributes: { Name: "Code Compliance", ConstraintGrade: "ADVISORY", ObjectiveQualifier: "CODECOMPLIANCE" },
		});

		expect(objective.get("Name")).toBe("Code Compliance");
		expect(objective.get("ConstraintGrade")).toBe("ADVISORY");
		expect(objective.get("ObjectiveQualifier")).toBe("CODECOMPLIANCE");
	});

	test("an empty attributes object leaves the objective untouched", () => {
		const file = createTestFile(schema);
		const objective = addObjective(file, {});
		editObjective(file, { objective, attributes: {} });
		expect(objective.get("Name")).toBe("Unnamed");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.constraint.editObjective Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous attribute value; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const objective = addObjective(file, {});

		file.beginTransaction();
		editObjective(file, { objective, attributes: { Name: "Renamed" } });
		file.endTransaction();

		expect(objective.get("Name")).toBe("Renamed");

		file.undo();
		expect(objective.get("Name")).toBe("Unnamed");

		file.redo();
		expect(objective.get("Name")).toBe("Renamed");
	});
});
