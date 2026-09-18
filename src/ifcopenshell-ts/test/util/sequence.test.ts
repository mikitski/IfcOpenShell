// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_sequence.py` (src/ifcopenshell-python) -- **that
// file does not exist** (confirmed: `src/ifcopenshell-python/test/util/` has no
// `test_sequence.py` at all). Every test below is therefore original coverage written
// directly against `sequence.py`'s own source / `sequence.ts`'s port, matching
// `util.resource`/`util.constraint`/`util.representation`'s own established precedent
// for a module with zero pre-existing Python test coverage.
//
// `sequence.py` has no `api.*` fixture-building callers of its own to draw from yet
// (`api.sequence` is entirely unported -- see `sequence.ts`'s own header comment) --
// fixtures below build the underlying `IfcWorkCalendar`/`IfcWorkTime`/
// `IfcRecurrencePattern`/`IfcTask`/`IfcWorkSchedule`/`IfcRelNests`/
// `IfcRelAssignsToControl`/`IfcRelAssignsToProduct`/`IfcRelAssignsToProcess`/
// `IfcRelSequence` entity graphs directly via `file.createEntity(...)` + `.set(...)`,
// matching `test/util/resource.test.ts`/`test/util/system.test.ts`'s own established
// pattern for this exact same "no `api` layer yet" gap.
//
// `IfcWorkCalendar`/`IfcWorkTime`/`IfcRecurrencePattern`/`IfcTimePeriod`/`IfcTaskTime`
// don't exist at all in IFC2X3 (confirmed empirically, see `sequence.ts`'s header
// comment finding #2) -- every calendar-arithmetic test below is gated to
// `CALENDAR_SCHEMAS` (`AVAILABLE_SCHEMAS` minus `"IFC2X3"`), never a hardcoded schema
// list. Task-tree tests that don't touch `Nests`/calendars run against the full
// `AVAILABLE_SCHEMAS`; the few that DO touch `Nests` (`getParentTask`/`deriveCalendar`/
// `getSequenceAssignment`'s nested-fallback path) are dedicated per-schema tests that
// assert the genuine IFC2X3 throw (finding #2) rather than being silently skipped there.
//
// This module has no mutating functions (confirmed by reading the whole source: no
// `.set(...)` anywhere) -- no Transaction/undo-redo test is included, matching
// `util.resource.test.ts`'s own precedent for the same reason.

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import type { IsoDate, IsoDateTime } from "../../src/util/date";
import * as subject from "../../src/util/sequence";
import { AVAILABLE_SCHEMAS, type Schema, createTestFile } from "../bootstrap";

const CALENDAR_SCHEMAS: readonly Schema[] = AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3");

// --- local fixture helpers (no Python/api counterpart -- see this file's header comment) ---

function isoDate(year: number, month: number, day: number): IsoDate {
	return { kind: "date", year, month, day };
}

function isoDateTime(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): IsoDateTime {
	return { kind: "datetime", year, month, day, hour, minute, second, microsecond: 0 };
}

function nest(file: IfcFile, parent: EntityInstance, children: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelNests");
	rel.set("RelatingObject", parent);
	rel.set("RelatedObjects", children);
	return rel;
}

function assignControl(file: IfcFile, control: EntityInstance, relatedObjects: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelAssignsToControl");
	rel.set("RelatingControl", control);
	rel.set("RelatedObjects", relatedObjects);
	return rel;
}

function assignProduct(file: IfcFile, product: EntityInstance, relatedObjects: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelAssignsToProduct");
	rel.set("RelatingProduct", product);
	rel.set("RelatedObjects", relatedObjects);
	return rel;
}

function assignProcess(file: IfcFile, process: EntityInstance, relatedObjects: EntityInstance[]): EntityInstance {
	const rel = file.createEntity("IfcRelAssignsToProcess");
	rel.set("RelatingProcess", process);
	rel.set("RelatedObjects", relatedObjects);
	return rel;
}

function sequenceRel(file: IfcFile, predecessor: EntityInstance, successor: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelSequence");
	rel.set("RelatingProcess", predecessor);
	rel.set("RelatedProcess", successor);
	return rel;
}

/** Builds an `IfcWorkTime` with an optional `RecurrencePattern` and/or Start/Finish
 * bound -- Start/Finish are written positionally (`setByIndex(4/5, ...)`), matching
 * `sequence.ts`'s own read side and sidestepping the real IFC4-vs-IFC4X3 attribute
 * rename (`Start`/`Finish` vs `StartDate`/`FinishDate`, see `sequence.ts`'s header
 * comment finding #1). */
function createWorkTime(
	file: IfcFile,
	options: { recurrencePattern?: EntityInstance; start?: string; finish?: string } = {},
): EntityInstance {
	const workTime = file.createEntity("IfcWorkTime");
	if (options.recurrencePattern) workTime.set("RecurrencePattern", options.recurrencePattern);
	if (options.start !== undefined) workTime.setByIndex(4, options.start);
	if (options.finish !== undefined) workTime.setByIndex(5, options.finish);
	return workTime;
}

function createCalendar(
	file: IfcFile,
	workingTimes: EntityInstance[],
	exceptionTimes: EntityInstance[] = [],
): EntityInstance {
	const calendar = file.createEntity("IfcWorkCalendar");
	calendar.set("WorkingTimes", workingTimes);
	if (exceptionTimes.length > 0) calendar.set("ExceptionTimes", exceptionTimes);
	return calendar;
}

function createRecurrencePattern(
	file: IfcFile,
	recurrenceType: subject.RecurrenceType,
	fields: {
		dayComponent?: number[];
		weekdayComponent?: number[];
		monthComponent?: number[];
		position?: number;
		interval?: number;
		occurrences?: number;
	} = {},
): EntityInstance {
	const pattern = file.createEntity("IfcRecurrencePattern");
	pattern.set("RecurrenceType", recurrenceType);
	if (fields.dayComponent) pattern.set("DayComponent", fields.dayComponent);
	if (fields.weekdayComponent) pattern.set("WeekdayComponent", fields.weekdayComponent);
	if (fields.monthComponent) pattern.set("MonthComponent", fields.monthComponent);
	if (fields.position !== undefined) pattern.set("Position", fields.position);
	if (fields.interval !== undefined) pattern.set("Interval", fields.interval);
	if (fields.occurrences !== undefined) pattern.set("Occurrences", fields.occurrences);
	return pattern;
}

// --- isDayInWorkTime / isWorkTimeApplicableToDay / isCalendarApplicable / isWorkingDay ---

describe.each(CALENDAR_SCHEMAS)("util.sequence calendar arithmetic (%s)", (schemaName) => {
	test("isDayInWorkTime is true with no Start/Finish bound at all", () => {
		const file = createTestFile(schemaName);
		const workTime = createWorkTime(file);
		expect(subject.isDayInWorkTime(isoDate(2020, 6, 15), workTime)).toBe(true);
	});

	test("isDayInWorkTime with only Start set: true strictly after Start", () => {
		const file = createTestFile(schemaName);
		const workTime = createWorkTime(file, { start: "2020-01-01" });
		expect(subject.isDayInWorkTime(isoDate(2019, 12, 31), workTime)).toBe(false);
		expect(subject.isDayInWorkTime(isoDate(2020, 6, 15), workTime)).toBe(true);
	});

	test("isDayInWorkTime with only Finish set: true strictly before Finish", () => {
		const file = createTestFile(schemaName);
		const workTime = createWorkTime(file, { finish: "2020-12-31" });
		expect(subject.isDayInWorkTime(isoDate(2020, 6, 15), workTime)).toBe(true);
		expect(subject.isDayInWorkTime(isoDate(2021, 1, 1), workTime)).toBe(false);
	});

	// *** Pins a further, previously-undocumented extension of finding #3, found while
	// writing this very test: when BOTH Start and Finish are set, real Python's Finish
	// check runs SECOND and unconditionally OVERWRITES the Start check's result (a plain
	// reassignment, not `and`-combined) -- so the Start bound is silently ignored
	// whenever Finish is also set. Confirmed empirically against a real Python
	// interpreter: `is_day_in_work_time(date(2019,1,1), work_time)` with
	// `Start="2020-01-01"`/`Finish="2020-12-31"` returns `True` (the day is BEFORE
	// Start, yet still reported "in work time"), purely because it's also before
	// Finish. Ported verbatim (`isDayInWorkTime`'s own sequential, not `&&`-combined,
	// `result = ...` reassignments already reproduce this correctly). ***
	test("isDayInWorkTime with BOTH Start and Finish set: Finish alone wins (real Python quirk)", () => {
		const file = createTestFile(schemaName);
		const workTime = createWorkTime(file, { start: "2020-01-01", finish: "2020-12-31" });
		// Before Start, but also before Finish -- Finish's check runs last and wins: `true`.
		expect(subject.isDayInWorkTime(isoDate(2019, 1, 1), workTime)).toBe(true);
		// Within both bounds.
		expect(subject.isDayInWorkTime(isoDate(2020, 6, 15), workTime)).toBe(true);
		// After Finish -- Finish's check (the one that wins) correctly reports `false`.
		expect(subject.isDayInWorkTime(isoDate(2021, 1, 1), workTime)).toBe(false);
	});

	// *** Pins finding #3: a real, confirmed upstream TypeError crash. ***
	test("isDayInWorkTime THROWS when Start carries a real datetime (finding #3)", () => {
		const file = createTestFile(schemaName);
		const workTime = createWorkTime(file, { start: "2020-01-01T00:00:00" });
		expect(() => subject.isDayInWorkTime(isoDate(2020, 6, 15), workTime)).toThrow(
			"can't compare datetime.datetime to datetime.date",
		);
	});

	test("isDayInWorkTime THROWS when Finish carries a real datetime (finding #3)", () => {
		const file = createTestFile(schemaName);
		const workTime = createWorkTime(file, { finish: "2020-12-31T23:59:59" });
		expect(() => subject.isDayInWorkTime(isoDate(2020, 6, 15), workTime)).toThrow(
			"can't compare datetime.datetime to datetime.date",
		);
	});

	test("isDayInWorkTime accepts an IsoDateTime day, truncating it first", () => {
		const file = createTestFile(schemaName);
		const workTime = createWorkTime(file, { start: "2020-01-01", finish: "2020-12-31" });
		expect(subject.isDayInWorkTime(isoDateTime(2020, 6, 15, 9, 0, 0), workTime)).toBe(true);
	});

	test("isWorkTimeApplicableToDay: no RecurrencePattern -> always true within range", () => {
		const file = createTestFile(schemaName);
		const workTime = createWorkTime(file);
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 15))).toBe(true);
	});

	test("isWorkTimeApplicableToDay: false when isDayInWorkTime is false", () => {
		const file = createTestFile(schemaName);
		const workTime = createWorkTime(file, { start: "2025-01-01" });
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 15))).toBe(false);
	});

	test("WEEKLY recurrence matches only the given weekdays (Mon/Wed/Fri)", () => {
		const file = createTestFile(schemaName);
		const pattern = createRecurrencePattern(file, "WEEKLY", { weekdayComponent: [1, 3, 5] });
		const workTime = createWorkTime(file, { recurrencePattern: pattern });
		// 2020-06-15 is a Monday.
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 15))).toBe(true);
		// 2020-06-16 is a Tuesday.
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 16))).toBe(false);
	});

	// *** Pins finding #5: DAILY/WEEKLY dead code -- an Interval always forces `false`. ***
	test("DAILY with an Interval set always returns false (finding #5, dead code)", () => {
		const file = createTestFile(schemaName);
		const pattern = createRecurrencePattern(file, "DAILY", { interval: 2 });
		const workTime = createWorkTime(file, { recurrencePattern: pattern, start: "2020-01-01" });
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 15))).toBe(false);
	});

	test("WEEKLY with an Interval set always returns false (finding #5, dead code)", () => {
		const file = createTestFile(schemaName);
		const pattern = createRecurrencePattern(file, "WEEKLY", { interval: 2, weekdayComponent: [1] });
		const workTime = createWorkTime(file, { recurrencePattern: pattern });
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 15))).toBe(false);
	});

	test("DAILY with no Interval/Occurrences always matches", () => {
		const file = createTestFile(schemaName);
		const pattern = createRecurrencePattern(file, "DAILY");
		const workTime = createWorkTime(file, { recurrencePattern: pattern });
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 15))).toBe(true);
	});

	test("MONTHLY_BY_DAY_OF_MONTH matches only the given days of month", () => {
		const file = createTestFile(schemaName);
		const pattern = createRecurrencePattern(file, "MONTHLY_BY_DAY_OF_MONTH", { dayComponent: [1, 15] });
		const workTime = createWorkTime(file, { recurrencePattern: pattern });
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 15))).toBe(true);
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 16))).toBe(false);
	});

	test("YEARLY_BY_DAY_OF_MONTH matches only the given month+day", () => {
		const file = createTestFile(schemaName);
		const pattern = createRecurrencePattern(file, "YEARLY_BY_DAY_OF_MONTH", {
			monthComponent: [12],
			dayComponent: [25],
		});
		const workTime = createWorkTime(file, { recurrencePattern: pattern });
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 12, 25))).toBe(true);
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 12, 24))).toBe(false);
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2021, 12, 25))).toBe(true);
	});

	test("YEARLY_BY_POSITION matches month + weekday + week-of-month position", () => {
		const file = createTestFile(schemaName);
		// 2020-06-15 is a Monday (ISO weekday 1), floor(15/7)+1 == 3 (3rd occurrence).
		const pattern = createRecurrencePattern(file, "YEARLY_BY_POSITION", {
			monthComponent: [6],
			weekdayComponent: [1],
			position: 3,
		});
		const workTime = createWorkTime(file, { recurrencePattern: pattern });
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 15))).toBe(true);
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 22))).toBe(false);
	});

	// *** Pins finding #4: a real, confirmed upstream bug -- `recurrence["Position"]`
	// (bracket/string-key form) always crashes in real Python since
	// `entity_instance.__getitem__` only accepts an integer index. ***
	test("MONTHLY_BY_POSITION THROWS once the WeekdayComponent check passes (finding #4)", () => {
		const file = createTestFile(schemaName);
		// 2020-06-15 is a Monday (ISO weekday 1) -- WeekdayComponent check passes, so
		// Python's `and` proceeds to evaluate `recurrence["Position"]`, which crashes.
		const pattern = createRecurrencePattern(file, "MONTHLY_BY_POSITION", { weekdayComponent: [1], position: 3 });
		const workTime = createWorkTime(file, { recurrencePattern: pattern });
		expect(() => subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 15))).toThrow(
			"'<' not supported between instances of 'str' and 'int'",
		);
	});

	test("MONTHLY_BY_POSITION does NOT crash when the WeekdayComponent check already fails", () => {
		const file = createTestFile(schemaName);
		// 2020-06-16 is a Tuesday (ISO weekday 2) -- doesn't match [1], so Python's `and`
		// short-circuits before ever reaching `recurrence["Position"]`.
		const pattern = createRecurrencePattern(file, "MONTHLY_BY_POSITION", { weekdayComponent: [1], position: 3 });
		const workTime = createWorkTime(file, { recurrencePattern: pattern });
		expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 16))).toBe(false);
	});

	// *** Pins finding #6: real Python falls off the end of the function for these 2
	// recurrence types, implicitly returning None despite the `-> bool` type hint. ***
	test("BY_DAY_COUNT / BY_WEEKDAY_COUNT have no branch at all -- returns undefined (finding #6)", () => {
		const file = createTestFile(schemaName);
		for (const recurrenceType of ["BY_DAY_COUNT", "BY_WEEKDAY_COUNT"] as const) {
			const pattern = createRecurrencePattern(file, recurrenceType);
			const workTime = createWorkTime(file, { recurrencePattern: pattern });
			expect(subject.isWorkTimeApplicableToDay(workTime, isoDate(2020, 6, 15))).toBeUndefined();
		}
	});

	test("isCalendarApplicable is false for a null/undefined calendar, or one with no WorkingTimes", () => {
		const file = createTestFile(schemaName);
		expect(subject.isCalendarApplicable(isoDate(2020, 6, 15), null)).toBe(false);
		const calendar = file.createEntity("IfcWorkCalendar");
		expect(subject.isCalendarApplicable(isoDate(2020, 6, 15), calendar)).toBe(false);
	});

	test("isCalendarApplicable is true when the day falls within any WorkingTimes bound", () => {
		const file = createTestFile(schemaName);
		const workTime = createWorkTime(file, { start: "2020-01-01", finish: "2020-12-31" });
		const calendar = createCalendar(file, [workTime]);
		expect(subject.isCalendarApplicable(isoDate(2020, 6, 15), calendar)).toBe(true);
		expect(subject.isCalendarApplicable(isoDate(2021, 1, 1), calendar)).toBe(false);
	});

	test("isWorkingDay: true when a WorkingTimes entry applies and no ExceptionTimes override it", () => {
		const file = createTestFile(schemaName);
		const weekdayPattern = createRecurrencePattern(file, "WEEKLY", { weekdayComponent: [1, 2, 3, 4, 5] });
		const workTime = createWorkTime(file, { recurrencePattern: weekdayPattern });
		const calendar = createCalendar(file, [workTime]);
		// 2020-06-15 is a Monday.
		expect(subject.isWorkingDay(isoDate(2020, 6, 15), calendar)).toBe(true);
		// 2020-06-13 is a Saturday.
		expect(subject.isWorkingDay(isoDate(2020, 6, 13), calendar)).toBe(false);
	});

	test("isWorkingDay: an ExceptionTimes match overrides an otherwise-working day", () => {
		const file = createTestFile(schemaName);
		const weekdayPattern = createRecurrencePattern(file, "WEEKLY", { weekdayComponent: [1, 2, 3, 4, 5] });
		const workTime = createWorkTime(file, { recurrencePattern: weekdayPattern });
		const holidayPattern = createRecurrencePattern(file, "YEARLY_BY_DAY_OF_MONTH", {
			monthComponent: [6],
			dayComponent: [15],
		});
		const exceptionTime = createWorkTime(file, { recurrencePattern: holidayPattern });
		const calendar = createCalendar(file, [workTime], [exceptionTime]);
		// 2020-06-15 is a Monday, but also the exception day.
		expect(subject.isWorkingDay(isoDate(2020, 6, 15), calendar)).toBe(false);
		// 2020-06-16 is a Tuesday, not excepted.
		expect(subject.isWorkingDay(isoDate(2020, 6, 16), calendar)).toBe(true);
	});

	test("countWorkingDays: 0 for identical start/finish, counts working days inclusive otherwise", () => {
		const file = createTestFile(schemaName);
		const same = isoDate(2020, 6, 15);
		expect(subject.countWorkingDays(same, same, null)).toBe(0);

		const weekdayPattern = createRecurrencePattern(file, "WEEKLY", { weekdayComponent: [1, 2, 3, 4, 5] });
		const workTime = createWorkTime(file, { recurrencePattern: weekdayPattern });
		const calendar = createCalendar(file, [workTime]);
		// Monday 2020-06-15 through Friday 2020-06-19 -- 5 working days.
		expect(subject.countWorkingDays(isoDate(2020, 6, 15), isoDate(2020, 6, 19), calendar)).toBe(5);
		// Monday 2020-06-15 through Sunday 2020-06-21 -- still 5 working days (weekend excluded).
		expect(subject.countWorkingDays(isoDate(2020, 6, 15), isoDate(2020, 6, 21), calendar)).toBe(5);
	});

	test("countWorkingDays: null calendar counts every day (no calendar constraint)", () => {
		expect(subject.countWorkingDays(isoDate(2020, 6, 15), isoDate(2020, 6, 19), null)).toBe(5);
	});

	test("getSoonestWorkingDay / getRecentWorkingDay skip non-working days", () => {
		const file = createTestFile(schemaName);
		const weekdayPattern = createRecurrencePattern(file, "WEEKLY", { weekdayComponent: [1, 2, 3, 4, 5] });
		const workTime = createWorkTime(file, { recurrencePattern: weekdayPattern });
		const calendar = createCalendar(file, [workTime]);
		// 2020-06-13 is a Saturday, 2020-06-14 a Sunday.
		expect(subject.getSoonestWorkingDay(isoDate(2020, 6, 13), "WORKTIME", calendar)).toEqual(isoDate(2020, 6, 15));
		expect(subject.getRecentWorkingDay(isoDate(2020, 6, 14), "WORKTIME", calendar)).toEqual(isoDate(2020, 6, 12));
	});

	test("getSoonestWorkingDay / getRecentWorkingDay are no-ops for ELAPSEDTIME or an inapplicable calendar", () => {
		const file = createTestFile(schemaName);
		const weekdayPattern = createRecurrencePattern(file, "WEEKLY", { weekdayComponent: [1, 2, 3, 4, 5] });
		const workTime = createWorkTime(file, { recurrencePattern: weekdayPattern, start: "2025-01-01" });
		const calendar = createCalendar(file, [workTime]);
		const saturday = isoDate(2020, 6, 13);
		expect(subject.getSoonestWorkingDay(saturday, "ELAPSEDTIME", calendar)).toEqual(saturday);
		// The calendar's WorkingTimes only applies from 2025 onward -- inapplicable in 2020.
		expect(subject.getSoonestWorkingDay(saturday, "WORKTIME", calendar)).toEqual(saturday);
	});

	test("offsetDate steps forward/backward by working days, preserving the input's kind", () => {
		const file = createTestFile(schemaName);
		const weekdayPattern = createRecurrencePattern(file, "WEEKLY", { weekdayComponent: [1, 2, 3, 4, 5] });
		const workTime = createWorkTime(file, { recurrencePattern: weekdayPattern });
		const calendar = createCalendar(file, [workTime]);
		// Monday 2020-06-15 + 3 working days -> Thursday 2020-06-18.
		const forward = subject.offsetDate(
			isoDate(2020, 6, 15),
			{ years: 0, months: 0, days: 3, hours: 0, minutes: 0, seconds: 0 },
			"WORKTIME",
			calendar,
		);
		expect(forward).toEqual(isoDate(2020, 6, 18));

		// Preserves "datetime" kind (and its time-of-day) end to end.
		const forwardDatetime = subject.offsetDate(
			isoDateTime(2020, 6, 15, 9, 30, 0),
			{ years: 0, months: 0, days: 3, hours: 0, minutes: 0, seconds: 0 },
			"WORKTIME",
			calendar,
		);
		expect(forwardDatetime).toEqual(isoDateTime(2020, 6, 18, 9, 30, 0));
	});

	test("offsetDate with ELAPSEDTIME ignores the calendar entirely (plain calendar-day arithmetic)", () => {
		const result = subject.offsetDate(
			isoDate(2020, 6, 13),
			{ years: 0, months: 0, days: 2, hours: 0, minutes: 0, seconds: 0 },
			"ELAPSEDTIME",
			null,
		);
		expect(result).toEqual(isoDate(2020, 6, 15));
	});

	test("getStartOrFinishDate: zero-duration returns the start unchanged (milestone)", () => {
		const start = isoDate(2020, 6, 15);
		const result = subject.getStartOrFinishDate(
			start,
			{ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 },
			"WORKTIME",
			null,
		);
		expect(result).toBe(start);
	});

	test("getStartOrFinishDate: FINISH combines the offset result with 17:00", () => {
		const file = createTestFile(schemaName);
		const weekdayPattern = createRecurrencePattern(file, "WEEKLY", { weekdayComponent: [1, 2, 3, 4, 5] });
		const workTime = createWorkTime(file, { recurrencePattern: weekdayPattern });
		const calendar = createCalendar(file, [workTime]);
		// Monday 2020-06-15, 3-day duration -> spans Mon/Tue/Wed, finishes Wed 2020-06-17 17:00.
		const result = subject.getStartOrFinishDate(
			isoDate(2020, 6, 15),
			{ years: 0, months: 0, days: 3, hours: 0, minutes: 0, seconds: 0 },
			"WORKTIME",
			calendar,
			"FINISH",
		);
		expect(result).toEqual(isoDateTime(2020, 6, 17, 17, 0, 0));
	});

	test("getStartOrFinishDate: START combines the offset result with 09:00", () => {
		const file = createTestFile(schemaName);
		const weekdayPattern = createRecurrencePattern(file, "WEEKLY", { weekdayComponent: [1, 2, 3, 4, 5] });
		const workTime = createWorkTime(file, { recurrencePattern: weekdayPattern });
		const calendar = createCalendar(file, [workTime]);
		// Finishing Wed 2020-06-17, 3-day duration -> starts Mon 2020-06-15 09:00.
		const result = subject.getStartOrFinishDate(
			isoDate(2020, 6, 17),
			{ years: 0, months: 0, days: 3, hours: 0, minutes: 0, seconds: 0 },
			"WORKTIME",
			calendar,
			"START",
		);
		expect(result).toEqual(isoDateTime(2020, 6, 15, 9, 0, 0));
	});
});

// --- Task-tree / schedule traversal ---

describe.each(AVAILABLE_SCHEMAS)("util.sequence task-tree traversal (%s)", (schemaName) => {
	test("getNestedTasks / getAllNestedTasks / getWorkScheduleTasks / getRootTasks", () => {
		const file = createTestFile(schemaName);
		const schedule = file.createEntity("IfcWorkSchedule");
		const root = file.createEntity("IfcTask");
		const child = file.createEntity("IfcTask");
		const grandchild = file.createEntity("IfcTask");
		const nonTaskChild = file.createEntity("IfcWall"); // Should never be treated as a task.
		assignControl(file, schedule, [root]);
		nest(file, root, [child, nonTaskChild]);
		nest(file, child, [grandchild]);

		expect(subject.getRootTasks(schedule).map((t) => t.id())).toEqual([root.id()]);
		expect(subject.getNestedTasks(root).map((t) => t.id())).toEqual([child.id()]);
		expect([...subject.getAllNestedTasks(root)].map((t) => t.id())).toEqual([child.id(), grandchild.id()]);
		expect([...subject.getWorkScheduleTasks(schedule)].map((t) => t.id())).toEqual([
			root.id(),
			child.id(),
			grandchild.id(),
		]);
	});

	test("getTaskOutputs / getTaskInputs / getTaskResources, non-recursive and recursive", () => {
		const file = createTestFile(schemaName);
		const task = file.createEntity("IfcTask");
		const subtask = file.createEntity("IfcTask");
		nest(file, task, [subtask]);

		const wall = file.createEntity("IfcWall");
		assignProduct(file, wall, [task]);
		const subWall = file.createEntity("IfcWall");
		assignProduct(file, subWall, [subtask]);

		const input = file.createEntity("IfcWall");
		assignProcess(file, task, [input]);
		const resource = file.createEntity("IfcConstructionEquipmentResource");
		assignProcess(file, task, [resource]);

		expect([...subject.getTaskOutputs(task)].map((o) => o.id())).toEqual([wall.id()]);
		expect([...subject.getTaskOutputs(task, true)].map((o) => o.id()).sort()).toEqual([wall.id(), subWall.id()].sort());
		expect([...subject.getTaskInputs(task)].map((o) => o.id())).toEqual([input.id()]);
		expect([...subject.getTaskResources(task)].map((o) => o.id())).toEqual([resource.id()]);

		expect(subject.hasTaskOutputs(task)).toBe(true);
		expect(subject.hasTaskInputs(task)).toBe(true);
		expect(subject.hasTaskOutputs(subtask)).toBe(true);
		expect(subject.hasTaskInputs(file.createEntity("IfcTask"))).toBe(false);
	});

	test("getTasksForProduct returns inputs (HasAssignments) and outputs (ReferencedBy) separately", () => {
		const file = createTestFile(schemaName);
		const product = file.createEntity("IfcWall");
		const inputTask = file.createEntity("IfcTask");
		assignProcess(file, inputTask, [product]);
		const outputTask = file.createEntity("IfcTask");
		assignProduct(file, product, [outputTask]);

		const [inputs, outputs] = subject.getTasksForProduct(product);
		expect(inputs.map((t) => t.id())).toEqual([inputTask.id()]);
		expect(outputs.map((t) => t.id())).toEqual([outputTask.id()]);
	});

	test("getTasksForProduct filters by schedule when given", () => {
		if (schemaName === "IFC2X3") return; // getTaskWorkSchedule throws on IFC2X3 (finding #2).
		const file = createTestFile(schemaName);
		const product = file.createEntity("IfcWall");
		const scheduleA = file.createEntity("IfcWorkSchedule");
		const scheduleB = file.createEntity("IfcWorkSchedule");
		const taskA = file.createEntity("IfcTask");
		const taskB = file.createEntity("IfcTask");
		assignControl(file, scheduleA, [taskA]);
		assignControl(file, scheduleB, [taskB]);
		assignProcess(file, taskA, [product]);
		assignProcess(file, taskB, [product]);

		const [inputsA] = subject.getTasksForProduct(product, scheduleA);
		expect(inputsA.map((t) => t.id())).toEqual([taskA.id()]);
		const [inputsB] = subject.getTasksForProduct(product, scheduleB);
		expect(inputsB.map((t) => t.id())).toEqual([taskB.id()]);
	});

	test("getCalendar returns the IfcWorkCalendar directly assigned to a task, if any", () => {
		if (schemaName === "IFC2X3") return; // IfcWorkCalendar doesn't exist in IFC2X3.
		const file = createTestFile(schemaName);
		const task = file.createEntity("IfcTask");
		expect(subject.getCalendar(task)).toBeNull();
		const calendar = file.createEntity("IfcWorkCalendar");
		assignControl(file, calendar, [task]);
		expect(subject.getCalendar(task)?.equals(calendar)).toBe(true);
	});

	test("getTaskWorkSchedule resolves through a Nests chain to the root's own IfcWorkSchedule", () => {
		if (schemaName === "IFC2X3") return; // `Nests`/`getParentTask` throws on IFC2X3 (finding #2).
		const file = createTestFile(schemaName);
		const schedule = file.createEntity("IfcWorkSchedule");
		const root = file.createEntity("IfcTask");
		const child = file.createEntity("IfcTask");
		assignControl(file, schedule, [root]);
		nest(file, root, [child]);
		expect(subject.getTaskWorkSchedule(child)?.equals(schedule)).toBe(true);
		expect(subject.getTaskWorkSchedule(root)?.equals(schedule)).toBe(true);
	});

	// *** Pins finding #7: a genuine self-recursion risk in real Python -- preserved
	// verbatim, not defensively guarded. ***
	test("getTaskWorkSchedule THROWS (stack overflow) for an orphan task with no root IfcWorkSchedule (finding #7)", () => {
		if (schemaName === "IFC2X3") return;
		const file = createTestFile(schemaName);
		const root = file.createEntity("IfcTask"); // No IfcRelAssignsToControl/IfcWorkSchedule at all.
		const child = file.createEntity("IfcTask");
		nest(file, root, [child]);
		expect(() => subject.getTaskWorkSchedule(child)).toThrow(/call stack|recursion/i);
	});

	test("getSequenceAssignment resolves IsPredecessorTo/IsSuccessorFrom directly", () => {
		if (schemaName === "IFC2X3") return; // IfcRelSequence exists, but exercising the Nests fallback below does not apply here.
		const file = createTestFile(schemaName);
		const predecessor = file.createEntity("IfcTask");
		const successor = file.createEntity("IfcTask");
		const rel = sequenceRel(file, predecessor, successor);
		expect(subject.getSequenceAssignment(predecessor, "successor").map((r) => r.id())).toEqual([rel.id()]);
		expect(subject.getSequenceAssignment(successor, "predecessor").map((r) => r.id())).toEqual([rel.id()]);
		expect(subject.getSequenceAssignment(predecessor, "predecessor")).toEqual([]);
		expect(subject.getSequenceAssignment(predecessor, "not-a-real-option")).toEqual([]);
	});

	test("getSequenceAssignment falls back to the parent task's own sequence via Nests", () => {
		if (schemaName === "IFC2X3") return; // `Nests` throws on IFC2X3 (finding #2).
		const file = createTestFile(schemaName);
		const parentPredecessor = file.createEntity("IfcTask");
		const parentSuccessor = file.createEntity("IfcTask");
		const rel = sequenceRel(file, parentPredecessor, parentSuccessor);
		const childOfPredecessor = file.createEntity("IfcTask");
		nest(file, parentPredecessor, [childOfPredecessor]);
		expect(subject.getSequenceAssignment(childOfPredecessor, "successor").map((r) => r.id())).toEqual([rel.id()]);
	});

	test("getRelatedProducts throws when neither argument is given (real Python assert)", () => {
		expect(() => subject.getRelatedProducts()).toThrow("Either relating_product or related_object must be provided.");
	});

	// *** Pins finding #8: real Python's own docstring/type hint claims a
	// `set[entity_instance]` return, but the actual implementation returns numeric ids. ***
	test("getRelatedProducts returns a Set of numeric ids, not entities (finding #8)", () => {
		const file = createTestFile(schemaName);
		const task = file.createEntity("IfcTask");
		const wall = file.createEntity("IfcWall");
		assignProduct(file, wall, [task]);

		const byRelatedObject = subject.getRelatedProducts(null, task);
		expect(byRelatedObject).toEqual(new Set([wall.id()]));
		for (const value of byRelatedObject) expect(typeof value).toBe("number");
	});

	test("getRelatedProducts resolves related_object from relating_product.ReferencedBy when only relating_product is given", () => {
		const file = createTestFile(schemaName);
		const wall = file.createEntity("IfcWall");
		const task = file.createEntity("IfcTask");
		assignProduct(file, wall, [task]); // wall.ReferencedBy -> this rel -> RelatedObjects[0] == task
		const otherWall = file.createEntity("IfcWall");
		assignProduct(file, otherWall, [task]);

		const result = subject.getRelatedProducts(wall);
		expect(result).toEqual(new Set([wall.id(), otherWall.id()]));
	});

	test("deriveDate returns the task's own directly-set attribute value first", () => {
		if (schemaName === "IFC2X3") return; // IfcTaskTime doesn't exist in IFC2X3.
		const file = createTestFile(schemaName);
		const task = file.createEntity("IfcTask");
		const taskTime = file.createEntity("IfcTaskTime");
		taskTime.set("ScheduleStart", "2020-06-15T09:00:00");
		task.set("TaskTime", taskTime);
		const result = subject.deriveDate(task, "ScheduleStart") as IsoDateTime;
		expect(result.kind).toBe("datetime");
		expect([result.year, result.month, result.day]).toEqual([2020, 6, 15]);
	});

	test("deriveDate finds the earliest/latest ScheduleStart/Finish among nested tasks", () => {
		if (schemaName === "IFC2X3") return;
		const file = createTestFile(schemaName);
		const parent = file.createEntity("IfcTask"); // No TaskTime of its own.

		const early = file.createEntity("IfcTask");
		const earlyTime = file.createEntity("IfcTaskTime");
		earlyTime.set("ScheduleStart", "2020-01-01T09:00:00");
		early.set("TaskTime", earlyTime);

		const late = file.createEntity("IfcTask");
		const lateTime = file.createEntity("IfcTaskTime");
		lateTime.set("ScheduleStart", "2020-12-31T09:00:00");
		late.set("TaskTime", lateTime);

		nest(file, parent, [early, late]);

		const result = subject.deriveDate(parent, "ScheduleStart", undefined, true, false) as IsoDateTime;
		expect([result.year, result.month, result.day]).toEqual([2020, 1, 1]);

		const latest = subject.deriveDate(parent, "ScheduleStart", undefined, false, true) as IsoDateTime;
		expect([latest.year, latest.month, latest.day]).toEqual([2020, 12, 31]);
	});

	test("deriveDate returns undefined when no task in the tree has the attribute set", () => {
		if (schemaName === "IFC2X3") return;
		const file = createTestFile(schemaName);
		const parent = file.createEntity("IfcTask");
		const child = file.createEntity("IfcTask");
		nest(file, parent, [child]);
		expect(subject.deriveDate(parent, "ScheduleStart", undefined, true, false)).toBeUndefined();
	});

	test("guessDateRange derives the overall earliest/latest schedule dates from tasks with assignments", () => {
		if (schemaName === "IFC2X3") return;
		const file = createTestFile(schemaName);
		const schedule = file.createEntity("IfcWorkSchedule");
		const task = file.createEntity("IfcTask");
		assignControl(file, schedule, [task]);
		const taskTime = file.createEntity("IfcTaskTime");
		taskTime.set("ScheduleStart", "2020-01-01T09:00:00");
		taskTime.set("ScheduleFinish", "2020-01-05T17:00:00");
		task.set("TaskTime", taskTime);
		const wall = file.createEntity("IfcWall");
		assignProduct(file, wall, [task]);

		const [earliest, latest] = subject.guessDateRange(schedule);
		expect(earliest).toBeDefined();
		expect(latest).toBeDefined();
		const earliestDt = earliest as IsoDateTime;
		const latestDt = latest as IsoDateTime;
		expect([earliestDt.year, earliestDt.month, earliestDt.day]).toEqual([2020, 1, 1]);
		expect([latestDt.year, latestDt.month, latestDt.day]).toEqual([2020, 1, 5]);
	});

	test("guessDateRange returns [undefined, undefined] when no root task has any product assignment", () => {
		const file = createTestFile(schemaName);
		const schedule = file.createEntity("IfcWorkSchedule");
		const task = file.createEntity("IfcTask");
		assignControl(file, schedule, [task]);
		expect(subject.guessDateRange(schedule)).toEqual([undefined, undefined]);
	});
});

// --- Dedicated IFC2X3-only regression tests for finding #2 (the real, disclosed
// `Nests`-undeclared-on-IFC2X3 crash asymmetry within this module). ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))(
	"util.sequence IFC2X3 Nests-throw asymmetry (finding #2)",
	() => {
		test("getParentTask throws on IFC2X3 (Nests is genuinely undeclared there)", () => {
			const file = createTestFile("IFC2X3");
			const task = file.createEntity("IfcTask");
			expect(() => subject.getParentTask(task)).toThrow(/Nests/);
		});

		test("deriveCalendar throws on IFC2X3 once getCalendar has returned falsy", () => {
			const file = createTestFile("IFC2X3");
			const task = file.createEntity("IfcTask");
			expect(() => subject.deriveCalendar(task)).toThrow(/Nests/);
		});

		test("getSequenceAssignment throws on IFC2X3 once the Nests fallback is reached", () => {
			const file = createTestFile("IFC2X3");
			const task = file.createEntity("IfcTask");
			expect(() => subject.getSequenceAssignment(task, "successor")).toThrow(/Nests/);
		});

		test("getNestedTasks (via util.element.getComponents) IS IFC2X3-safe, unlike its 3 siblings above", () => {
			const file = createTestFile("IFC2X3");
			const task = file.createEntity("IfcTask");
			expect(subject.getNestedTasks(task)).toEqual([]);
		});
	},
);
