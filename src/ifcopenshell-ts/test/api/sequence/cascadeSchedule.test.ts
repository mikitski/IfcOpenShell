// This file was generated with the assistance of an AI coding tool.
//
// Port of `test_cascade_schedule.py` (src/ifcopenshell-python) -- real Python's own test
// class only runs against IFC4 ("sequence module features relies on entities introduced
// in IFC4 therefore no IFC2X3 tests"). This port widens coverage to IFC4X3 too, but
// excludes IFC2X3 -- see `../../../src/api/sequence/cascadeSchedule.ts`'s own header
// comment for why (`IfcTaskTime` doesn't exist there).
//
// --- Every real Python test case that uses a `lag=` third task is adapted to DROP that
//     third task entirely -- `assignLagTime` (chunk 1) is FULLY BLOCKED on every schema
//     by the already-tracked `TODOS.md` primitive-layer gap, so there is currently no way
//     to build a real, populated `IfcLagTime` fixture at all (confirmed: the gap blocks
//     ANY write to a standalone simple/defined-type instance, not just at construction
//     time, so there is no workaround -- see `assignLagTime.ts`'s own header comment) ---
//
// Dropping the third (lagged) task does NOT change the surviving assertions' own
// expected values: each direction test's `task`/`task2` pair is unaffected by whether a
// third, unrelated `task3` exists or not (`task2`'s own cascade only ever looks at its
// own predecessor relationship from `task`). This still exercises the real, un-lagged
// branch of all 4 sequence types (FINISH_START/FINISH_FINISH/START_START/START_FINISH)
// plus both milestone variants -- the majority of `cascadeSchedule.ts`'s own branching
// complexity. The `TimeLag`-bearing branches themselves remain ported and disclosed (see
// `cascadeSchedule.ts`'s own header comment) but are currently untestable end-to-end.

import { describe, expect, test } from "vitest";
import { addTask } from "../../../src/api/sequence/addTask";
import { addTaskTime } from "../../../src/api/sequence/addTaskTime";
import { assignSequence } from "../../../src/api/sequence/assignSequence";
import { cascadeSchedule } from "../../../src/api/sequence/cascadeSchedule";
import { editSequence } from "../../../src/api/sequence/editSequence";
import { editTaskTime } from "../../../src/api/sequence/editTaskTime";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.cascadeSchedule (%s)", (schema) => {
	function createTask(file: ReturnType<typeof createTestFile>, duration: string): EntityInstance {
		const task = addTask(file, {});
		if (duration === "P0D") task.set("IsMilestone", true);
		const taskTime = addTaskTime(file, { task });
		editTaskTime(file, { taskTime, attributes: { ScheduleStart: "2000-01-01T09:00:00", ScheduleDuration: duration } });
		return task;
	}

	function createSequence(
		file: ReturnType<typeof createTestFile>,
		predecessor: EntityInstance,
		successor: EntityInstance,
		relationship: string,
	): void {
		const rel = assignSequence(file, { relatingProcess: predecessor, relatedProcess: successor });
		editSequence(file, { relSequence: rel, attributes: { SequenceType: relationship } });
	}

	test("doing nothing if the task has no successors", () => {
		const file = createTestFile(schema);
		const task = addTask(file, {});
		cascadeSchedule(file, { task });
		expect(task.get("TaskTime")).toBe(null);
	});

	test("not affecting tasks that are not related", () => {
		const file = createTestFile(schema);
		const task = createTask(file, "P1D");
		const task2 = createTask(file, "P1D");

		cascadeSchedule(file, { task });
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
	});

	test("only cascading to successors, not predecessors", () => {
		const file = createTestFile(schema);
		const task = createTask(file, "P1D");
		const task2 = createTask(file, "P2D");
		createSequence(file, task, task2, "FINISH_START");

		cascadeSchedule(file, { task: task2 });
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-02T09:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-03T17:00:00");
	});

	test("catching cyclic relationships", () => {
		const file = createTestFile(schema);
		const task = createTask(file, "P1D");
		const task2 = createTask(file, "P2D");
		createSequence(file, task, task2, "FINISH_START");
		// Real Python's own test wraps BOTH the second `assign_sequence` call (whose own
		// tail already calls `cascade_schedule`) and the explicit `cascade_schedule` call
		// in a single `pytest.raises` block -- it doesn't matter which of the two actually
		// raises first, only that a recursive-sequence error is raised somewhere in here.
		// Confirmed empirically: `createSequence`'s own `assignSequence` call is what
		// actually throws first (its own cascade already detects the cycle), matching
		// real Python's identical eager-cascade-on-assign behavior.
		expect(() => {
			createSequence(file, task2, task, "FINISH_START");
			cascadeSchedule(file, { task });
		}).toThrow("Recursive tasks found. Could not cascade schedule.");
	});

	test("cascading finish to start", () => {
		const file = createTestFile(schema);
		const task = createTask(file, "P1D");
		const task2 = createTask(file, "P2D");
		createSequence(file, task, task2, "FINISH_START");

		cascadeSchedule(file, { task });
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-02T09:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-03T17:00:00");
	});

	test("cascading finish to start for milestones", () => {
		const file = createTestFile(schema);
		const task = createTask(file, "P0D");
		const task2 = createTask(file, "P2D");
		createSequence(file, task, task2, "FINISH_START");

		cascadeSchedule(file, { task });
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-01T09:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-02T17:00:00");
	});

	test("cascading finish to finish", () => {
		const file = createTestFile(schema);
		const task = createTask(file, "P1D");
		const task2 = createTask(file, "P2D");
		createSequence(file, task, task2, "FINISH_FINISH");

		cascadeSchedule(file, { task });
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("1999-12-31T09:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
	});

	test("cascading start to start", () => {
		const file = createTestFile(schema);
		const task = createTask(file, "P1D");
		const task2 = createTask(file, "P2D");
		createSequence(file, task, task2, "START_START");

		cascadeSchedule(file, { task });
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-02T17:00:00");
	});

	test("cascading start to finish", () => {
		const file = createTestFile(schema);
		const task = createTask(file, "P1D");
		const task2 = createTask(file, "P2D");
		createSequence(file, task, task2, "START_FINISH");

		cascadeSchedule(file, { task });
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("1999-12-30T09:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("1999-12-31T17:00:00");
	});

	test("cascading start to finish for milestones", () => {
		const file = createTestFile(schema);
		const task = createTask(file, "P0D");
		const task2 = createTask(file, "P2D");
		createSequence(file, task, task2, "START_FINISH");

		cascadeSchedule(file, { task });
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("2000-01-01T09:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("1999-12-30T09:00:00");
		expect((task2.get("TaskTime") as EntityInstance).get("ScheduleFinish")).toBe("1999-12-31T17:00:00");
	});
});
