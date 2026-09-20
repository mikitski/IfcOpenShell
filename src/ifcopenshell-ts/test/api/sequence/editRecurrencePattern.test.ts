// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_recurrence_pattern.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python). Written directly from the real
// source/docstring.

import { describe, expect, test } from "vitest";
import { addWorkCalendar } from "../../../src/api/sequence/addWorkCalendar";
import { addWorkTime } from "../../../src/api/sequence/addWorkTime";
import { assignRecurrencePattern } from "../../../src/api/sequence/assignRecurrencePattern";
import { editRecurrencePattern } from "../../../src/api/sequence/editRecurrencePattern";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.editRecurrencePattern (%s)", (schema) => {
	test("editing the weekday component of a weekly recurrence pattern", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const calendar = addWorkCalendar(file, {});
		const workTime = addWorkTime(file, { workCalendar: calendar, timeType: "WorkingTimes" });
		const pattern = assignRecurrencePattern(file, { parent: workTime, recurrenceType: "WEEKLY" });

		editRecurrencePattern(file, { recurrencePattern: pattern, attributes: { WeekdayComponent: [1, 2, 3, 4, 5] } });
		expect(pattern.get("WeekdayComponent")).toEqual([1, 2, 3, 4, 5]);
	});

	test("editing multiple attributes for a monthly recurrence pattern", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const calendar = addWorkCalendar(file, {});
		const workTime = addWorkTime(file, { workCalendar: calendar, timeType: "WorkingTimes" });
		const pattern = assignRecurrencePattern(file, { parent: workTime, recurrenceType: "MONTHLY_BY_DAY_OF_MONTH" });

		editRecurrencePattern(file, { recurrencePattern: pattern, attributes: { DayComponent: [1], Interval: 6 } });
		expect(pattern.get("DayComponent")).toEqual([1]);
		expect(pattern.get("Interval")).toBe(6);
	});
});
