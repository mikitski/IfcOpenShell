// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `remove_time_period.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python), so this coverage is written directly
// from the real source/docstring, run against every schema `IfcTimePeriod` actually
// exists on (absent on IFC2X3 -- see `../../../src/api/sequence/
// removeTimePeriod.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { removeTimePeriod } from "../../../src/api/sequence/removeTimePeriod";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.removeTimePeriod (%s)", (schema) => {
	test("removes only the targeted time period", () => {
		const file = createTestFile(schema);
		const morning = file.createEntity("IfcTimePeriod", "09:00:00", "12:00:00");
		const afternoon = file.createEntity("IfcTimePeriod", "13:00:00", "17:00:00");
		expect(file.byType("IfcTimePeriod").length).toBe(2);

		removeTimePeriod(file, { timePeriod: afternoon });
		const remaining = file.byType("IfcTimePeriod");
		expect(remaining.length).toBe(1);
		expect(remaining[0].identity()).toBe(morning.identity());
	});
});
