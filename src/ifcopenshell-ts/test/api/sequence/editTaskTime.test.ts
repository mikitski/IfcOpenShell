// This file was generated with the assistance of an AI coding tool.
//
// Port of `test_edit_task_time.py` (src/ifcopenshell-python) -- real Python's own test
// class only runs against IFC4 ("IfcTaskTime was introduced in IFC4"). This port widens
// coverage to IFC4X3 too (`IfcTaskTime` exists there identically), but excludes IFC2X3 --
// see `../../../src/api/sequence/editTaskTime.ts`'s own header comment for why
// (`IfcTaskTime` doesn't exist on IFC2X3 at all).
//
// Real Python's `self.file.createIfcTask()` (the dynamic `createIfcXxx` shortcut) is
// replaced below with the direct equivalent `file.createEntity("IfcTask")` -- a bare,
// unattached entity construction, NOT the blocked standalone-valued-simple-type
// construction (`IfcTask` is an entity, not a defined/simple type, and this creates it
// with zero initial attribute values). `datetime.datetime(...)`/`datetime.timedelta(...)`
// object arguments are replaced with the equivalent `IsoDateTime`/`Duration` object
// literals this port's own `util/date.ts` types use.

import { describe, expect, test } from "vitest";
import { assignControl } from "../../../src/api/control/assignControl";
import { createEntity } from "../../../src/api/root/createEntity";
import { addTaskTime } from "../../../src/api/sequence/addTaskTime";
import { addTimePeriod } from "../../../src/api/sequence/addTimePeriod";
import { addWorkCalendar } from "../../../src/api/sequence/addWorkCalendar";
import { addWorkTime } from "../../../src/api/sequence/addWorkTime";
import { assignRecurrencePattern } from "../../../src/api/sequence/assignRecurrencePattern";
import { editRecurrencePattern } from "../../../src/api/sequence/editRecurrencePattern";
import { editTaskTime } from "../../../src/api/sequence/editTaskTime";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.editTaskTime (%s)", (schema) => {
	test("editing all attributes", () => {
		const file = createTestFile(schema);
		const taskTime = addTaskTime(file, { task: file.createEntity("IfcTask") });
		editTaskTime(file, {
			taskTime,
			attributes: {
				Name: "Name",
				DataOrigin: "NOTDEFINED",
				UserDefinedDataOrigin: "UserDefinedDataOrigin",
				DurationType: "ELAPSEDTIME",
				ScheduleDuration: "P1D",
				ScheduleStart: "2000-01-01T09:00:00",
				ScheduleFinish: "2000-01-01T17:00:00",
				EarlyStart: "2000-01-01T00:00:00",
				EarlyFinish: "2000-01-01T00:00:00",
				LateStart: "2000-01-01T00:00:00",
				LateFinish: "2000-01-01T00:00:00",
				FreeFloat: "P0D",
				TotalFloat: "P0D",
				IsCritical: true,
				StatusTime: "2000-01-01T00:00:00",
				ActualDuration: "P1D",
				ActualStart: "2000-01-01T09:00:00",
				ActualFinish: "2000-01-01T17:00:00",
				RemainingTime: "P1D",
				Completion: 0.5,
			},
		});
		expect(taskTime.get("Name")).toBe("Name");
		expect(taskTime.get("DataOrigin")).toBe("NOTDEFINED");
		expect(taskTime.get("UserDefinedDataOrigin")).toBe("UserDefinedDataOrigin");
		expect(taskTime.get("DurationType")).toBe("ELAPSEDTIME");
		expect(taskTime.get("ScheduleDuration")).toBe("P1D");
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("EarlyStart")).toBe("2000-01-01T00:00:00");
		expect(taskTime.get("EarlyFinish")).toBe("2000-01-01T00:00:00");
		expect(taskTime.get("LateStart")).toBe("2000-01-01T00:00:00");
		expect(taskTime.get("LateFinish")).toBe("2000-01-01T00:00:00");
		expect(taskTime.get("FreeFloat")).toBe("P0D");
		expect(taskTime.get("TotalFloat")).toBe("P0D");
		expect(taskTime.get("IsCritical")).toBe(true);
		expect(taskTime.get("StatusTime")).toBe("2000-01-01T00:00:00");
		expect(taskTime.get("ActualDuration")).toBe("P1D");
		expect(taskTime.get("ActualStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ActualFinish")).toBe("2000-01-01T17:00:00");
		expect(taskTime.get("RemainingTime")).toBe("P1D");
		expect(taskTime.get("Completion")).toBe(0.5);
	});

	test("editing just a start date with no duration or finish", () => {
		const file = createTestFile(schema);
		const taskTime = addTaskTime(file, { task: file.createEntity("IfcTask") });
		editTaskTime(file, {
			taskTime,
			attributes: { ScheduleDuration: null, ScheduleStart: "2000-01-01T09:00:00", ScheduleFinish: null },
		});
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe(null);
		expect(taskTime.get("ScheduleDuration")).toBe(null);
	});

	test("editing just a start date with no duration or finish but with a calendar", () => {
		const file = createTestFile(schema);
		createEntity(file, { ifcClass: "IfcProject" });
		const calendar = addWorkCalendar(file, {});
		const task = file.createEntity("IfcTask");
		assignControl(file, { relatingControl: calendar, relatedObjects: [task] });
		const taskTime = addTaskTime(file, { task });
		editTaskTime(file, {
			taskTime,
			attributes: {
				ScheduleDuration: null,
				ScheduleStart: {
					kind: "datetime",
					year: 2000,
					month: 1,
					day: 1,
					hour: 0,
					minute: 0,
					second: 0,
					microsecond: 0,
				},
				ScheduleFinish: null,
			},
		});
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe(null);
		expect(taskTime.get("ScheduleDuration")).toBe(null);
	});

	test("schedule finish dates are auto calculated if possible", () => {
		const file = createTestFile(schema);
		const taskTime = addTaskTime(file, { task: file.createEntity("IfcTask") });
		editTaskTime(file, {
			taskTime,
			attributes: { DurationType: "ELAPSEDTIME", ScheduleDuration: "P1D", ScheduleStart: "2000-01-01T09:00:00" },
		});
		expect(taskTime.get("DurationType")).toBe("ELAPSEDTIME");
		expect(taskTime.get("ScheduleDuration")).toBe("P1D");
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
	});

	test("schedule durations are auto calculated if possible", () => {
		const file = createTestFile(schema);
		const taskTime = addTaskTime(file, { task: file.createEntity("IfcTask") });
		editTaskTime(file, {
			taskTime,
			attributes: {
				DurationType: "ELAPSEDTIME",
				ScheduleStart: "2000-01-01T09:00:00",
				ScheduleFinish: "2000-01-01T17:00:00",
			},
		});
		expect(taskTime.get("DurationType")).toBe("ELAPSEDTIME");
		expect(taskTime.get("ScheduleDuration")).toBe("P1D");
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
	});

	test("a duration takes priority over start and finish dates", () => {
		const file = createTestFile(schema);
		const taskTime = addTaskTime(file, { task: file.createEntity("IfcTask") });
		editTaskTime(file, {
			taskTime,
			attributes: {
				DurationType: "ELAPSEDTIME",
				ScheduleDuration: "P1D",
				ScheduleStart: "2000-01-01T09:00:00",
				ScheduleFinish: "2000-01-03T17:00:00",
			},
		});
		expect(taskTime.get("DurationType")).toBe("ELAPSEDTIME");
		expect(taskTime.get("ScheduleDuration")).toBe("P1D");
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
	});

	test("durations can be specified in Duration objects", () => {
		const file = createTestFile(schema);
		const taskTime = addTaskTime(file, { task: file.createEntity("IfcTask") });
		editTaskTime(file, {
			taskTime,
			attributes: {
				DurationType: "ELAPSEDTIME",
				ScheduleDuration: { years: 0, months: 0, days: 1, hours: 0, minutes: 0, seconds: 0 },
				ScheduleStart: "2000-01-01T09:00:00",
			},
		});
		expect(taskTime.get("DurationType")).toBe("ELAPSEDTIME");
		expect(taskTime.get("ScheduleDuration")).toBe("P1D");
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2000-01-01T17:00:00");
	});

	test("zero durations are allowed", () => {
		const file = createTestFile(schema);
		const taskTime = addTaskTime(file, { task: file.createEntity("IfcTask") });
		editTaskTime(file, {
			taskTime,
			attributes: {
				DurationType: "ELAPSEDTIME",
				ScheduleDuration: { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 },
				ScheduleStart: "2000-01-01T09:00:00",
			},
		});
		expect(taskTime.get("DurationType")).toBe("ELAPSEDTIME");
		expect(taskTime.get("ScheduleDuration")).toBe("P0D");
		expect(taskTime.get("ScheduleStart")).toBe("2000-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2000-01-01T09:00:00");
	});

	test("editing a start date and duration with a calendar", () => {
		const file = createTestFile(schema);
		createEntity(file, { ifcClass: "IfcProject" });
		const calendar = addWorkCalendar(file, {});
		const task = file.createEntity("IfcTask");
		assignControl(file, { relatingControl: calendar, relatedObjects: [task] });
		const taskTime = addTaskTime(file, { task });
		editTaskTime(file, {
			taskTime,
			attributes: {
				DurationType: "WORKTIME",
				ScheduleDuration: "P7D",
				ScheduleStart: {
					kind: "datetime",
					year: 2020,
					month: 1,
					day: 1,
					hour: 0,
					minute: 0,
					second: 0,
					microsecond: 0,
				},
			},
		});
		expect(taskTime.get("ScheduleStart")).toBe("2020-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2020-01-07T17:00:00");
		expect(taskTime.get("ScheduleDuration")).toBe("P7D");

		const workTime = addWorkTime(file, { workCalendar: calendar, timeType: "WorkingTimes" });
		const pattern = assignRecurrencePattern(file, { parent: workTime, recurrenceType: "WEEKLY" });
		editRecurrencePattern(file, { recurrencePattern: pattern, attributes: { WeekdayComponent: [1, 2, 3, 4, 5] } });
		addTimePeriod(file, { recurrencePattern: pattern, startTime: "09:00", endTime: "17:00" });
		editTaskTime(file, {
			taskTime,
			attributes: {
				DurationType: "WORKTIME",
				ScheduleDuration: "P7D",
				ScheduleStart: {
					kind: "datetime",
					year: 2020,
					month: 1,
					day: 1,
					hour: 0,
					minute: 0,
					second: 0,
					microsecond: 0,
				},
			},
		});
		expect(taskTime.get("ScheduleStart")).toBe("2020-01-01T09:00:00");
		expect(taskTime.get("ScheduleFinish")).toBe("2020-01-09T17:00:00");
		expect(taskTime.get("ScheduleDuration")).toBe("P7D");
	});
});
