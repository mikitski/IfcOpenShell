// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_task_time.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python), so this coverage is written directly
// from the real source/docstring, including a dedicated pin for the disclosed IFC2X3
// schema-absence gap (`../../../src/api/sequence/addTaskTime.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { addTask } from "../../../src/api/sequence/addTask";
import { addTaskTime } from "../../../src/api/sequence/addTaskTime";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.addTaskTime (%s)", (schema) => {
	test("adds a blank IfcTaskTime to a task", () => {
		const file = createTestFile(schema);
		const task = addTask(file, {});
		const taskTime = addTaskTime(file, { task });
		expect(taskTime.isA("IfcTaskTime")).toBe(true);
		expect(taskTime.isA("IfcTaskTimeRecurring")).toBe(false);
		expect((task.get("TaskTime") as EntityInstance).equals(taskTime)).toBe(true);
	});

	test("adds a blank IfcTaskTimeRecurring when isRecurring is true", () => {
		const file = createTestFile(schema);
		const task = addTask(file, {});
		const taskTime = addTaskTime(file, { task, isRecurring: true });
		expect(taskTime.isA("IfcTaskTimeRecurring")).toBe(true);
		expect(taskTime.isA("IfcTaskTime")).toBe(true);
	});
});

// --- IFC2X3: neither IfcTaskTime nor IfcTaskTimeRecurring exist -- see this file's header comment ---
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.sequence.addTaskTime (IFC2X3)", () => {
	test("throws -- IfcTaskTime doesn't exist on IFC2X3", () => {
		const file = createTestFile("IFC2X3");
		const task = addTask(file, {});
		expect(() => addTaskTime(file, { task })).toThrow();
	});
});
