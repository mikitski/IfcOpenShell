// This file was generated with the assistance of an AI coding tool.
//
// Port of `test_copy_work_schedule.py` (src/ifcopenshell-python) -- real Python's own
// test class runs against IFC4/IFC2X3/IFC4X3 (via `TestCopyWorkScheduleIFC2X3`/
// `TestCopyWorkScheduleIFC4X3` subclasses), matching `AVAILABLE_SCHEMAS` (unfiltered):
// `copyWorkSchedule.ts` has no schema-specific branching of its own.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addTask } from "../../../src/api/sequence/addTask";
import { addWorkPlan } from "../../../src/api/sequence/addWorkPlan";
import { addWorkSchedule } from "../../../src/api/sequence/addWorkSchedule";
import { copyWorkSchedule } from "../../../src/api/sequence/copyWorkSchedule";
import { getRootTasks, getWorkScheduleTasks } from "../../../src/util/sequence";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.sequence.copyWorkSchedule (%s)", (schema) => {
	test("copies a work schedule and its tasks, without duplicating the originals' identities", () => {
		const file = createTestFile(schema);
		createEntity(file, { ifcClass: "IfcProject" });
		// Shared code logic with test_copy_cost_schedule.
		const workPlan = addWorkPlan(file, {});
		const schedule = addWorkSchedule(file, { workPlan });
		const task = addTask(file, { workSchedule: schedule });
		addTask(file, { parentTask: task }); // Subtask.
		// `EntityInstance`s are fresh wrappers per access (`10-architecture.md` SS6) --
		// compare by STEP id, not by reference/`Set` membership on the wrapper itself.
		const oldTaskIds = new Set(file.byType("IfcTask").map((t) => t.id()));

		const newSchedule = copyWorkSchedule(file, { workSchedule: schedule });

		// We don't check how well IfcTasks are copied, it should be tested separately
		// in duplicateTask.test.ts.
		expect(newSchedule.equals(schedule)).toBe(false);
		expect(getRootTasks(newSchedule)).toHaveLength(1);
		const newTasks = [...getWorkScheduleTasks(newSchedule)];
		expect(newTasks).toHaveLength(2);
		expect(newTasks.some((t) => oldTaskIds.has(t.id()))).toBe(false);
	});
});
