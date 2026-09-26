// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `unassign_recurrence_pattern.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python), so this coverage is written directly
// from the real source/docstring, run against every schema `IfcRecurrencePattern`
// actually exists on (absent on IFC2X3 -- see `../../../src/api/sequence/
// unassignRecurrencePattern.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { unassignRecurrencePattern } from "../../../src/api/sequence/unassignRecurrencePattern";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.sequence.unassignRecurrencePattern (%s)",
	(schema) => {
		test("removes the pattern and every one of its own time periods", () => {
			const file = createTestFile(schema);
			const pattern = file.createEntity("IfcRecurrencePattern", "WEEKLY");
			const morning = file.createEntity("IfcTimePeriod", "09:00:00", "12:00:00");
			const afternoon = file.createEntity("IfcTimePeriod", "13:00:00", "17:00:00");
			pattern.set("TimePeriods", [morning, afternoon]);

			unassignRecurrencePattern(file, { recurrencePattern: pattern });
			expect(file.byType("IfcRecurrencePattern").length).toBe(0);
			expect(file.byType("IfcTimePeriod").length).toBe(0);
		});

		test("removes a pattern with no time periods at all", () => {
			const file = createTestFile(schema);
			const pattern = file.createEntity("IfcRecurrencePattern", "WEEKLY");
			unassignRecurrencePattern(file, { recurrencePattern: pattern });
			expect(file.byType("IfcRecurrencePattern").length).toBe(0);
		});
	},
);
