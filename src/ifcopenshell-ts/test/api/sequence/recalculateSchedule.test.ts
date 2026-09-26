// This file was generated with the assistance of an AI coding tool.
//
// Port of `test_recalculate_schedule.py` (src/ifcopenshell-python) -- real Python's own
// test class only runs against IFC4 ("sequence module features relies on entities
// introduced in IFC4 therefore no IFC2X3 tests"). This port widens coverage to IFC4X3
// too, but excludes IFC2X3 -- see `../../../src/api/sequence/recalculateSchedule.ts`'s
// own header comment for why (`IfcTaskTime` doesn't exist there).
//
// This CORRECTS the chunk brief's own claim that no real Python test exists for this
// file -- `test_recalculate_schedule.py` was found by listing the real `test/api/
// sequence/` directory directly, with 9 real test cases.
//
// --- 2 of the 9 real test cases use a `lag=` third task -- adapted to DROP the lag
//     (not the task), since `assignLagTime`/`editLagTime` remain fully blocked (see
//     `duplicateTask.ts`'s/`recalculateSchedule.ts`'s own header comments: nothing in
//     this port can construct a populated `IfcLagTime`) ---
//
// Unlike `cascadeSchedule.test.ts`'s own precedent (which drops the whole lagged task,
// since removing it doesn't change the surviving tasks' own expected values there),
// dropping the THIRD task here would also drop real, otherwise-untested coverage of a
// multi-successor critical-path branch (one successor becomes non-critical with a real
// float, the other stays critical) -- so instead, only the `lag="P1D"` argument itself
// is dropped, keeping the third task and its own sequence relationship. This shifts
// every one of that task's own expected dates by exactly 1 day earlier (the lag's own
// contribution) compared to real Python's own literal expected values -- confirmed by
// tracing the algorithm by hand from the SURVIVING (unmodified) test cases' own
// hand-verified values, then cross-checked against this port's own implementation
// output (already validated correct via the 7 unmodified test cases immediately
// below, which exercise the same forward/backward-pass logic end-to-end against real
// Python's own literal expected values) -- not a bare "whatever the code produces"
// assertion.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addTask } from "../../../src/api/sequence/addTask";
import { addTaskTime } from "../../../src/api/sequence/addTaskTime";
import { addWorkSchedule } from "../../../src/api/sequence/addWorkSchedule";
import { assignSequence } from "../../../src/api/sequence/assignSequence";
import { cascadeSchedule } from "../../../src/api/sequence/cascadeSchedule";
import { editSequence } from "../../../src/api/sequence/editSequence";
import { editTaskTime } from "../../../src/api/sequence/editTaskTime";
import { recalculateSchedule } from "../../../src/api/sequence/recalculateSchedule";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.recalculateSchedule (%s)", (schema) => {
	function addWorkScheduleFixture(file: IfcFile): EntityInstance {
		createEntity(file, { ifcClass: "IfcProject" });
		return addWorkSchedule(file, {});
	}

	function createTask(file: IfcFile, workSchedule: EntityInstance, duration: string): EntityInstance {
		const task = addTask(file, { workSchedule });
		if (duration === "P0D") task.set("IsMilestone", true);
		const taskTime = addTaskTime(file, { task });
		editTaskTime(file, { taskTime, attributes: { ScheduleStart: "2000-01-01T09:00:00", ScheduleDuration: duration } });
		return task;
	}

	function createSequence(
		file: IfcFile,
		predecessor: EntityInstance,
		successor: EntityInstance,
		relationship: string,
	): void {
		const rel = assignSequence(file, { relatingProcess: predecessor, relatedProcess: successor });
		editSequence(file, { relSequence: rel, attributes: { SequenceType: relationship } });
	}

	test("doing nothing if the task has no time", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkScheduleFixture(file);
		const task = addTask(file, { workSchedule });
		recalculateSchedule(file, { workSchedule });
		expect(task.get("TaskTime")).toBeNull();
	});

	test("catching cyclic relationships", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkScheduleFixture(file);
		const task = createTask(file, workSchedule, "P1D");
		const task2 = createTask(file, workSchedule, "P2D");
		const task3 = createTask(file, workSchedule, "P2D");
		const task4 = createTask(file, workSchedule, "P2D");
		createSequence(file, task, task2, "FINISH_START");
		createSequence(file, task, task4, "FINISH_START");
		createSequence(file, task2, task3, "FINISH_START");
		expect(() => createSequence(file, task3, task2, "FINISH_START")).toThrow();
		expect(() => recalculateSchedule(file, { workSchedule })).toThrow(
			"Task graph is cyclic and so critical path method cannot be performed.",
		);
	});

	test("recalculating for a single task", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkScheduleFixture(file);
		const task = createTask(file, workSchedule, "P1D");
		recalculateSchedule(file, { workSchedule });
		const taskTime = task.get("TaskTime") as EntityInstance;
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("EarlyStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("EarlyFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("LateStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("LateFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("TotalFloat")).toBe("P0D");
		expect(taskTime.get("FreeFloat")).toBe("P0D");
		expect(taskTime.get("IsCritical")).toBe(true);
	});

	test("recalculating finish to start", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkScheduleFixture(file);
		const task = createTask(file, workSchedule, "P1D");
		const task2 = createTask(file, workSchedule, "P2D");
		createSequence(file, task, task2, "FINISH_START");
		recalculateSchedule(file, { workSchedule });
		const taskTime = task.get("TaskTime") as EntityInstance;
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("EarlyStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("EarlyFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("LateStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("LateFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("TotalFloat")).toBe("P0D");
		expect(taskTime.get("FreeFloat")).toBe("P0D");
		expect(taskTime.get("IsCritical")).toBe(true);
		const taskTime2 = task2.get("TaskTime") as EntityInstance;
		expect(taskTime2.get("ScheduleStart")).toBe("2000-01-02T09:00:00");
		expect(taskTime2.get("ScheduleFinish")).toBe("2000-01-03T17:00:00");
		expect(taskTime2.get("EarlyStart")).toBe("2000-01-02T09:00:00");
		expect(taskTime2.get("EarlyFinish")).toBe("2000-01-03T17:00:00");
		expect(taskTime2.get("LateStart")).toBe("2000-01-02T09:00:00");
		expect(taskTime2.get("LateFinish")).toBe("2000-01-03T17:00:00");
		expect(taskTime2.get("TotalFloat")).toBe("P0D");
		expect(taskTime2.get("FreeFloat")).toBe("P0D");
		expect(taskTime2.get("IsCritical")).toBe(true);
	});

	// See this file's header comment: adapted -- `lag="P1D"` DROPPED (not the task),
	// shifting task3's own dates 1 day earlier than real Python's own literal values
	// (which were "2000-01-03T09:00:00"/"2000-01-05T17:00:00").
	test("recalculating multiple finish to start (adapted: lag dropped, not the task)", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkScheduleFixture(file);
		const task = createTask(file, workSchedule, "P1D");
		const task2 = createTask(file, workSchedule, "P2D");
		const task3 = createTask(file, workSchedule, "P3D");
		createSequence(file, task, task2, "FINISH_START");
		createSequence(file, task, task3, "FINISH_START");
		cascadeSchedule(file, { task });
		recalculateSchedule(file, { workSchedule });
		const taskTime = task.get("TaskTime") as EntityInstance;
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("TotalFloat")).toBe("P0D");
		expect(taskTime.get("IsCritical")).toBe(true);
		const taskTime2 = task2.get("TaskTime") as EntityInstance;
		expect(taskTime2.get("EarlyStart")).toBe("2000-01-02T09:00:00");
		expect(taskTime2.get("EarlyFinish")).toBe("2000-01-03T17:00:00");
		// task2 has real float against the now-longer task3 (no more lag inflating it).
		expect(taskTime2.get("IsCritical")).toBe(false);
		const taskTime3 = task3.get("TaskTime") as EntityInstance;
		expect(taskTime3.get("EarlyStart")).toBe("2000-01-02T09:00:00");
		expect(taskTime3.get("EarlyFinish")).toBe("2000-01-04T17:00:00");
		expect(taskTime3.get("LateStart")).toBe("2000-01-02T09:00:00");
		expect(taskTime3.get("LateFinish")).toBe("2000-01-04T17:00:00");
		expect(taskTime3.get("TotalFloat")).toBe("P0D");
		expect(taskTime3.get("IsCritical")).toBe(true);
	});

	// See this file's header comment: adapted -- `lag="P1D"` DROPPED (not the milestone
	// task), shifting task3's own dates 1 day earlier than real Python's own literal
	// values (which were "2000-01-03T09:00:00" for both Schedule/Early/LateStart/Finish).
	test("recalculating finish to start with a milestone (adapted: lag dropped, not the task)", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkScheduleFixture(file);
		const task = createTask(file, workSchedule, "P1D");
		const task2 = createTask(file, workSchedule, "P2D");
		const task3 = createTask(file, workSchedule, "P0D");
		createSequence(file, task, task2, "FINISH_START");
		createSequence(file, task, task3, "FINISH_START");
		cascadeSchedule(file, { task });
		recalculateSchedule(file, { workSchedule });
		const taskTime3 = task3.get("TaskTime") as EntityInstance;
		expect(taskTime3.get("ScheduleStart")).toBe("2000-01-02T09:00:00");
		expect(taskTime3.get("ScheduleFinish")).toBe("2000-01-02T09:00:00");
		expect(taskTime3.get("EarlyStart")).toBe("2000-01-02T09:00:00");
		expect(taskTime3.get("EarlyFinish")).toBe("2000-01-02T09:00:00");
	});

	test("recalculating finish to start with a milestone as the last task", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkScheduleFixture(file);
		const task = createTask(file, workSchedule, "P1D");
		const task2 = createTask(file, workSchedule, "P2D");
		const task3 = createTask(file, workSchedule, "P0D");
		createSequence(file, task, task2, "FINISH_START");
		createSequence(file, task2, task3, "FINISH_START");
		cascadeSchedule(file, { task });
		recalculateSchedule(file, { workSchedule });
		const taskTime = task.get("TaskTime") as EntityInstance;
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("EarlyStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("EarlyFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("LateStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("LateFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("TotalFloat")).toBe("P0D");
		expect(taskTime.get("FreeFloat")).toBe("P0D");
		expect(taskTime.get("IsCritical")).toBe(true);
		const taskTime2 = task2.get("TaskTime") as EntityInstance;
		expect(taskTime2.get("ScheduleStart")).toBe("2000-01-02T09:00:00");
		expect(taskTime2.get("ScheduleFinish")).toBe("2000-01-03T17:00:00");
		expect(taskTime2.get("EarlyStart")).toBe("2000-01-02T09:00:00");
		expect(taskTime2.get("EarlyFinish")).toBe("2000-01-03T17:00:00");
		expect(taskTime2.get("LateStart")).toBe("2000-01-02T09:00:00");
		expect(taskTime2.get("LateFinish")).toBe("2000-01-03T17:00:00");
		expect(taskTime2.get("TotalFloat")).toBe("P0D");
		expect(taskTime2.get("FreeFloat")).toBe("P0D");
		expect(taskTime2.get("IsCritical")).toBe(true);
		const taskTime3 = task3.get("TaskTime") as EntityInstance;
		expect(taskTime3.get("ScheduleStart")).toBe("2000-01-04T09:00:00");
		expect(taskTime3.get("ScheduleFinish")).toBe("2000-01-04T09:00:00");
		expect(taskTime3.get("EarlyStart")).toBe("2000-01-04T09:00:00");
		expect(taskTime3.get("EarlyFinish")).toBe("2000-01-04T09:00:00");
		expect(taskTime3.get("LateStart")).toBe("2000-01-04T09:00:00");
		expect(taskTime3.get("LateFinish")).toBe("2000-01-04T09:00:00");
		expect(taskTime3.get("TotalFloat")).toBe("P0D");
		expect(taskTime3.get("FreeFloat")).toBe("P0D");
		expect(taskTime3.get("IsCritical")).toBe(true);
	});

	test("recalculating finish to finish", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkScheduleFixture(file);
		const task = createTask(file, workSchedule, "P1D");
		const task2 = createTask(file, workSchedule, "P2D");
		createSequence(file, task, task2, "FINISH_FINISH");
		recalculateSchedule(file, { workSchedule });
		const taskTime = task.get("TaskTime") as EntityInstance;
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("EarlyStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("EarlyFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("LateStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("LateFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("TotalFloat")).toBe("P0D");
		expect(taskTime.get("FreeFloat")).toBe("P0D");
		expect(taskTime.get("IsCritical")).toBe(true);
		const taskTime2 = task2.get("TaskTime") as EntityInstance;
		expect(taskTime2.get("ScheduleStart")).toBe("1999-12-31T09:00:00");
		expect(taskTime2.get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime2.get("EarlyStart")).toBe("1999-12-31T09:00:00");
		expect(taskTime2.get("EarlyFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime2.get("LateStart")).toBe("1999-12-31T09:00:00");
		expect(taskTime2.get("LateFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime2.get("TotalFloat")).toBe("P0D");
		expect(taskTime2.get("FreeFloat")).toBe("P0D");
		expect(taskTime2.get("IsCritical")).toBe(true);
	});

	test("recalculating start to start", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkScheduleFixture(file);
		const task = createTask(file, workSchedule, "P1D");
		const task2 = createTask(file, workSchedule, "P2D");
		createSequence(file, task, task2, "START_START");
		recalculateSchedule(file, { workSchedule });
		const taskTime = task.get("TaskTime") as EntityInstance;
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("EarlyStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("EarlyFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("LateStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("LateFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("TotalFloat")).toBe("P0D");
		expect(taskTime.get("FreeFloat")).toBe("P0D");
		expect(taskTime.get("IsCritical")).toBe(true);
		const taskTime2 = task2.get("TaskTime") as EntityInstance;
		expect(taskTime2.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime2.get("ScheduleFinish")).toBe("2000-01-02T17:00:00");
		expect(taskTime2.get("EarlyStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime2.get("EarlyFinish")).toBe("2000-01-02T17:00:00");
		expect(taskTime2.get("LateStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime2.get("LateFinish")).toBe("2000-01-02T17:00:00");
		expect(taskTime2.get("TotalFloat")).toBe("P0D");
		expect(taskTime2.get("FreeFloat")).toBe("P0D");
		expect(taskTime2.get("IsCritical")).toBe(true);
	});

	test("recalculating start to finish", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkScheduleFixture(file);
		const task = createTask(file, workSchedule, "P1D");
		const task2 = createTask(file, workSchedule, "P2D");
		createSequence(file, task, task2, "START_FINISH");
		recalculateSchedule(file, { workSchedule });
		const taskTime = task.get("TaskTime") as EntityInstance;
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("EarlyStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("EarlyFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("LateStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("LateFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("TotalFloat")).toBe("P0D");
		expect(taskTime.get("FreeFloat")).toBe("P0D");
		expect(taskTime.get("IsCritical")).toBe(true);
		const taskTime2 = task2.get("TaskTime") as EntityInstance;
		expect(taskTime2.get("ScheduleStart")).toBe("1999-12-30T09:00:00");
		expect(taskTime2.get("ScheduleFinish")).toBe("1999-12-31T17:00:00");
		expect(taskTime2.get("EarlyStart")).toBe("1999-12-30T09:00:00");
		expect(taskTime2.get("EarlyFinish")).toBe("1999-12-31T17:00:00");
		expect(taskTime2.get("LateStart")).toBe("1999-12-30T09:00:00");
		expect(taskTime2.get("LateFinish")).toBe("1999-12-31T17:00:00");
		expect(taskTime2.get("TotalFloat")).toBe("P0D");
		expect(taskTime2.get("FreeFloat")).toBe("P0D");
		expect(taskTime2.get("IsCritical")).toBe(true);
	});
});
