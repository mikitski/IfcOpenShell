// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `assign_recurrence_pattern.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python). Written directly from the real
// source/docstring.

import { describe, expect, test } from "vitest";
import { addTask } from "../../../src/api/sequence/addTask";
import { addTaskTime } from "../../../src/api/sequence/addTaskTime";
import { addWorkCalendar } from "../../../src/api/sequence/addWorkCalendar";
import { addWorkTime } from "../../../src/api/sequence/addWorkTime";
import { assignRecurrencePattern } from "../../../src/api/sequence/assignRecurrencePattern";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.sequence.assignRecurrencePattern (%s)",
	(schema) => {
		test("assigning a recurrence pattern to an IfcWorkTime", () => {
			const file = createTestFile(schema);
			file.createEntity("IfcProject");
			const calendar = addWorkCalendar(file, {});
			const workTime = addWorkTime(file, { workCalendar: calendar, timeType: "WorkingTimes" });
			const pattern = assignRecurrencePattern(file, { parent: workTime, recurrenceType: "WEEKLY" });
			expect(pattern.isA("IfcRecurrencePattern")).toBe(true);
			expect(pattern.get("RecurrenceType")).toBe("WEEKLY");
			expect((workTime.get("RecurrencePattern") as EntityInstance).equals(pattern)).toBe(true);
		});

		test("assigning a recurrence pattern to an IfcTaskTimeRecurring", () => {
			const file = createTestFile(schema);
			const task = addTask(file, {});
			const taskTime = addTaskTime(file, { task, isRecurring: true });
			const pattern = assignRecurrencePattern(file, { parent: taskTime, recurrenceType: "MONTHLY_BY_DAY_OF_MONTH" });
			expect((taskTime.get("Recurrence") as EntityInstance).equals(pattern)).toBe(true);
		});

		test("defaults to WEEKLY", () => {
			const file = createTestFile(schema);
			file.createEntity("IfcProject");
			const calendar = addWorkCalendar(file, {});
			const workTime = addWorkTime(file, { workCalendar: calendar, timeType: "WorkingTimes" });
			const pattern = assignRecurrencePattern(file, { parent: workTime });
			expect(pattern.get("RecurrenceType")).toBe("WEEKLY");
		});

		test("replacing an existing recurrence pattern frees up the old one when it's the sole reference", () => {
			const file = createTestFile(schema);
			file.createEntity("IfcProject");
			const calendar = addWorkCalendar(file, {});
			const workTime = addWorkTime(file, { workCalendar: calendar, timeType: "WorkingTimes" });
			const first = assignRecurrencePattern(file, { parent: workTime, recurrenceType: "WEEKLY" });
			const second = assignRecurrencePattern(file, { parent: workTime, recurrenceType: "DAILY" });
			expect(first.equals(second)).toBe(false);
			expect(file.byType("IfcRecurrencePattern")).toHaveLength(1);
			expect((workTime.get("RecurrencePattern") as EntityInstance).equals(second)).toBe(true);
		});
	},
);
