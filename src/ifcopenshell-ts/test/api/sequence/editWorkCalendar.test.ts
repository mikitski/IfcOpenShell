// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_work_calendar.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python), so this coverage is written directly
// from the real source/docstring, run against every schema where `IfcWorkCalendar`
// actually exists (absent on IFC2X3 -- see `../../../src/api/sequence/
// addWorkCalendar.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { addWorkCalendar } from "../../../src/api/sequence/addWorkCalendar";
import { editWorkCalendar } from "../../../src/api/sequence/editWorkCalendar";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.editWorkCalendar (%s)", (schema) => {
	test("edits the description", () => {
		const file = createTestFile(schema);
		const calendar = addWorkCalendar(file, { name: "5 Day Week" });
		editWorkCalendar(file, { workCalendar: calendar, attributes: { Description: "Monday to Friday 8 hour days" } });
		expect(calendar.get("Description")).toBe("Monday to Friday 8 hour days");
	});

	test("edits multiple attributes at once", () => {
		const file = createTestFile(schema);
		const calendar = addWorkCalendar(file, {});
		editWorkCalendar(file, { workCalendar: calendar, attributes: { Name: "Custom", PredefinedType: "SECONDSHIFT" } });
		expect(calendar.get("Name")).toBe("Custom");
		expect(calendar.get("PredefinedType")).toBe("SECONDSHIFT");
	});
});
