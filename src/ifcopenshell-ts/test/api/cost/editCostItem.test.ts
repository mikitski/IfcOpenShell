// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_cost_item.py`, only the docstring's own worked
// example. This suite is written directly from the real source's own trivial
// `setattr`-loop behavior.

import { describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { editCostItem } from "../../../src/api/cost/editCostItem";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.cost.editCostItem (%s)", (schema) => {
	test("edits attributes on an IfcCostItem", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });

		editCostItem(file, { costItem: item, attributes: { Name: "Foo" } });

		expect(item.get("Name")).toBe("Foo");
	});
});
