// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `remove_work_time.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python). Written directly from the real
// source/docstring.

import { describe, expect, test } from "vitest";
import { addWorkCalendar } from "../../../src/api/sequence/addWorkCalendar";
import { addWorkTime } from "../../../src/api/sequence/addWorkTime";
import { assignRecurrencePattern } from "../../../src/api/sequence/assignRecurrencePattern";
import { removeWorkTime } from "../../../src/api/sequence/removeWorkTime";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.removeWorkTime (%s)", (schema) => {
	test("removing a work time with no recurrence pattern", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const calendar = addWorkCalendar(file, {});
		const workTime = addWorkTime(file, { workCalendar: calendar, timeType: "WorkingTimes" });
		removeWorkTime(file, { workTime });
		expect(file.byType("IfcWorkTime")).toHaveLength(0);
	});

	test("removing a work time also removes its recurrence pattern", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const calendar = addWorkCalendar(file, {});
		const workTime = addWorkTime(file, { workCalendar: calendar, timeType: "WorkingTimes" });
		assignRecurrencePattern(file, { parent: workTime, recurrenceType: "WEEKLY" });
		removeWorkTime(file, { workTime });
		expect(file.byType("IfcWorkTime")).toHaveLength(0);
		expect(file.byType("IfcRecurrencePattern")).toHaveLength(0);
	});
});
