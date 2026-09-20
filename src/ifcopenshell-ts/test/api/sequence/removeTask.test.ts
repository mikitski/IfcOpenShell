// This file was generated with the assistance of an AI coding tool.
//
// Port of `test_remove_task.py` (src/ifcopenshell-python) -- real Python's own test class
// runs against IFC4 and IFC4X3 ("sequence module features relies on entities introduced
// in IFC4 therefore no IFC2X3 tests"), matched here via `AVAILABLE_SCHEMAS.filter(...)`.

import { describe, expect, test } from "vitest";
import { assignObject } from "../../../src/api/nest/assignObject";
import { addTask } from "../../../src/api/sequence/addTask";
import { addTaskTime } from "../../../src/api/sequence/addTaskTime";
import { addWorkSchedule } from "../../../src/api/sequence/addWorkSchedule";
import { assignRecurrencePattern } from "../../../src/api/sequence/assignRecurrencePattern";
import { removeTask } from "../../../src/api/sequence/removeTask";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.removeTask (%s)", (schema) => {
	test("removing a task", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const workSchedule = addWorkSchedule(file, {});
		const task = addTask(file, { workSchedule });
		removeTask(file, { task });
		expect(file.byType("IfcTask")).toHaveLength(0);
	});

	test("removing a task's task time (including a recurring one's recurrence pattern)", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");

		const task = addTask(file, {});
		const taskTime = addTaskTime(file, { task, isRecurring: true });
		assignRecurrencePattern(file, { parent: taskTime, recurrenceType: "DAILY" });

		const task2 = addTask(file, {});
		addTaskTime(file, { task: task2, isRecurring: false });

		removeTask(file, { task });
		removeTask(file, { task: task2 });

		expect(file.byType("IfcTask")).toHaveLength(0);
		expect(file.byType("IfcTaskTime")).toHaveLength(0);
		expect(file.byType("IfcRecurrencePattern")).toHaveLength(0);
	});

	test("removing a task with subtasks removes them recursively", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const workSchedule = addWorkSchedule(file, {});
		const task = addTask(file, { workSchedule });
		const subtask1 = addTask(file, { workSchedule });
		const subtask2 = addTask(file, { workSchedule });
		assignObject(file, { relatedObjects: [subtask1, subtask2], relatingObject: task });
		removeTask(file, { task });
		expect(file.byType("IfcTask")).toHaveLength(0);
		expect(file.byType("IfcRelNests")).toHaveLength(0);
	});

	test("removing a subtask leaves its parent alone", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const workSchedule = addWorkSchedule(file, {});
		const task = addTask(file, { workSchedule });
		const subtask1 = addTask(file, { workSchedule });
		assignObject(file, { relatedObjects: [subtask1], relatingObject: task });
		removeTask(file, { task: subtask1 });
		expect(file.byType("IfcTask")).toHaveLength(1);
		expect(file.byType("IfcRelNests")).toHaveLength(0);
	});
});
