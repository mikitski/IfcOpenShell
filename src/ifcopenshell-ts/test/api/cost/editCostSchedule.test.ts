// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_cost_schedule.py`, only the docstring's own
// worked example. This suite is written directly from the real source's own trivial
// `setattr`-loop behavior.

import { describe, expect, test } from "vitest";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { editCostSchedule } from "../../../src/api/cost/editCostSchedule";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.cost.editCostSchedule (%s)", (schema) => {
	test("edits attributes on an IfcCostSchedule", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);

		editCostSchedule(file, { costSchedule: schedule, attributes: { Name: "Foo" } });

		expect(schedule.get("Name")).toBe("Foo");
	});
});
