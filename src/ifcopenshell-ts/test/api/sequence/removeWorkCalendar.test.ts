// This file was generated with the assistance of an AI coding tool.
//
// Port of `test_remove_work_calendar.py` (src/ifcopenshell-python) -- real Python's own
// test class runs against IFC4 and IFC4X3 ("sequence module features relies on entities
// introduced in IFC4 therefore no IFC2X3 tests"), matched here via
// `AVAILABLE_SCHEMAS.filter(...)`.

import { describe, expect, test } from "vitest";
import { assignControl } from "../../../src/api/control/assignControl";
import { addTask } from "../../../src/api/sequence/addTask";
import { addWorkCalendar } from "../../../src/api/sequence/addWorkCalendar";
import { addWorkTime } from "../../../src/api/sequence/addWorkTime";
import { removeWorkCalendar } from "../../../src/api/sequence/removeWorkCalendar";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.removeWorkCalendar (%s)", (schema) => {
	test("removing a work calendar cleans up its work times, controls, and itself", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const workCalendar = addWorkCalendar(file, {});

		addWorkTime(file, { workCalendar, timeType: "WorkingTimes" });
		addWorkTime(file, { workCalendar, timeType: "WorkingTimes" });
		addWorkTime(file, { workCalendar, timeType: "ExceptionTimes" });
		addWorkTime(file, { workCalendar, timeType: "ExceptionTimes" });

		const task = addTask(file, {});
		assignControl(file, { relatingControl: workCalendar, relatedObjects: [task] });

		removeWorkCalendar(file, { workCalendar });

		expect(file.byType("IfcWorkCalendar")).toHaveLength(0);
		expect(file.byType("IfcWorkTime")).toHaveLength(0);
		expect(file.byType("IfcTask")).toHaveLength(1);
		expect(file.byType("IfcRelAssignsToControl")).toHaveLength(0);
	});
});
