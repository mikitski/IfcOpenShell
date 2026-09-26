// This file was generated with the assistance of an AI coding tool.
//
// Original test coverage for `src/api/constraint/addMetric.ts` -- no
// `test/api/constraint/test_add_metric.py` exists in the real Python source to port
// from (confirmed by directory listing -- see `./addObjective.test.ts`'s header
// comment for the same gap), so this file's coverage is written directly against
// `add_metric.py`'s own source / `addMetric.ts`'s port.

import { describe, expect, test } from "vitest";
import { addMetric } from "../../../src/api/constraint/addMetric";
import { addObjective } from "../../../src/api/constraint/addObjective";
import type { EntityInstance } from "../../../src/entityInstance";
import * as constraintUtil from "../../../src/util/constraint";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.constraint.addMetric (%s)", (schema) => {
	test("creates a new IfcMetric with the documented defaults", () => {
		const file = createTestFile(schema);
		const metric = addMetric(file, { objective: null });

		expect(metric.isA("IfcMetric")).toBe(true);
		expect(metric.get("Name")).toBe("Unnamed");
		expect(metric.get("ConstraintGrade")).toBe("NOTDEFINED");
		expect(metric.get("Benchmark")).toBe("EQUALTO");
	});

	test("objective=null does not touch any objective's BenchmarkValues (Python's `if objective:` guard)", () => {
		const file = createTestFile(schema);
		expect(() => addMetric(file, { objective: null })).not.toThrow();
	});

	test("appends the new metric to the objective's BenchmarkValues", () => {
		const file = createTestFile(schema);
		const objective = addObjective(file, {});
		const metric = addMetric(file, { objective });

		const metrics = constraintUtil.getMetrics(objective);
		expect(metrics).toHaveLength(1);
		expect(metrics[0].equals(metric)).toBe(true);
	});

	test("a second metric is appended, not replacing the first (Python's `list(... or [])` idiom)", () => {
		const file = createTestFile(schema);
		const objective = addObjective(file, {});
		const metric1 = addMetric(file, { objective });
		const metric2 = addMetric(file, { objective });

		const metrics = constraintUtil.getMetrics(objective);
		expect(metrics).toHaveLength(2);
		expect(metrics.some((m: EntityInstance) => m.equals(metric1))).toBe(true);
		expect(metrics.some((m: EntityInstance) => m.equals(metric2))).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.constraint.addMetric Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created metric and restores the objective's BenchmarkValues; redo reapplies both", () => {
		const file = createTestFile(schema);
		const objective = addObjective(file, {});

		file.beginTransaction();
		addMetric(file, { objective });
		file.endTransaction();

		expect(file.byType("IfcMetric").length).toBe(1);
		expect(constraintUtil.getMetrics(objective)).toHaveLength(1);

		file.undo();
		expect(file.byType("IfcMetric").length).toBe(0);
		expect(constraintUtil.getMetrics(objective)).toHaveLength(0);

		file.redo();
		expect(file.byType("IfcMetric").length).toBe(1);
		expect(constraintUtil.getMetrics(objective)).toHaveLength(1);
	});
});
