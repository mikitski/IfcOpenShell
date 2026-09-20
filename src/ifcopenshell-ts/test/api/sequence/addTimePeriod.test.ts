// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_time_period.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python). Written directly from the real
// source/docstring.

import { describe, expect, test } from "vitest";
import { addTimePeriod } from "../../../src/api/sequence/addTimePeriod";
import { addWorkCalendar } from "../../../src/api/sequence/addWorkCalendar";
import { addWorkTime } from "../../../src/api/sequence/addWorkTime";
import { assignRecurrencePattern } from "../../../src/api/sequence/assignRecurrencePattern";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.addTimePeriod (%s)", (schema) => {
	test("adding a time period to a recurrence pattern", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const calendar = addWorkCalendar(file, {});
		const workTime = addWorkTime(file, { workCalendar: calendar, timeType: "WorkingTimes" });
		const pattern = assignRecurrencePattern(file, { parent: workTime, recurrenceType: "WEEKLY" });

		const morning = addTimePeriod(file, { recurrencePattern: pattern, startTime: "09:00", endTime: "12:00" });
		const afternoon = addTimePeriod(file, { recurrencePattern: pattern, startTime: "13:00", endTime: "17:00" });

		expect(morning.isA("IfcTimePeriod")).toBe(true);
		expect(morning.get("StartTime")).toBe("09:00:00");
		expect(morning.get("EndTime")).toBe("12:00:00");

		const timePeriods = pattern.get("TimePeriods") as EntityInstance[];
		expect(timePeriods.map((tp) => tp.identity())).toEqual([morning.identity(), afternoon.identity()]);
	});

	test("adding a time period with no start/end time", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const calendar = addWorkCalendar(file, {});
		const workTime = addWorkTime(file, { workCalendar: calendar, timeType: "WorkingTimes" });
		const pattern = assignRecurrencePattern(file, { parent: workTime, recurrenceType: "DAILY" });

		const timePeriod = addTimePeriod(file, { recurrencePattern: pattern });
		expect(timePeriod.get("StartTime")).toBe(null);
		expect(timePeriod.get("EndTime")).toBe(null);
	});
});
