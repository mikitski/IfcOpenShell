// This file was generated with the assistance of an AI coding tool.
//
// Original test coverage for `src/api/constraint/editMetric.ts` -- no real Python
// `test_edit_metric.py` exists (confirmed by directory listing -- see
// `./editObjective.test.ts`'s header comment for the same gap), so this file's coverage
// is written directly against `edit_metric.py`'s own source / `editMetric.ts`'s port.

import { describe, expect, test } from "vitest";
import { addMetric } from "../../../src/api/constraint/addMetric";
import { editMetric } from "../../../src/api/constraint/editMetric";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.constraint.editMetric (%s)", (schema) => {
	test("sets each given attribute", () => {
		const file = createTestFile(schema);
		const metric = addMetric(file, { objective: null });

		editMetric(file, { metric, attributes: { Name: "Fire Rating Check", ConstraintGrade: "HARD" } });

		expect(metric.get("Name")).toBe("Fire Rating Check");
		expect(metric.get("ConstraintGrade")).toBe("HARD");
	});

	test("an empty attributes object leaves the metric untouched", () => {
		const file = createTestFile(schema);
		const metric = addMetric(file, { objective: null });
		editMetric(file, { metric, attributes: {} });
		expect(metric.get("Name")).toBe("Unnamed");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.constraint.editMetric Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous attribute value; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const metric = addMetric(file, { objective: null });

		file.beginTransaction();
		editMetric(file, { metric, attributes: { ConstraintGrade: "HARD" } });
		file.endTransaction();

		expect(metric.get("ConstraintGrade")).toBe("HARD");

		file.undo();
		expect(metric.get("ConstraintGrade")).toBe("NOTDEFINED");

		file.redo();
		expect(metric.get("ConstraintGrade")).toBe("HARD");
	});
});
