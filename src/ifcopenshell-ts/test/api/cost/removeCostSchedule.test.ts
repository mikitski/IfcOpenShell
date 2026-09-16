// This file was generated with the assistance of an AI coding tool.
//
// Port of `test/api/cost/test_remove_cost_schedule.py`'s `TestRemoveCostSchedule`
// (real Python runs this against IFC4 and IFC2X3).

import { describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { removeCostSchedule } from "../../../src/api/cost/removeCostSchedule";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.cost.removeCostSchedule (%s)", (schema) => {
	test("removes a cost schedule with no items", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file, { name: "Foo", predefinedType: "BUDGET" });

		removeCostSchedule(file, { costSchedule: schedule });

		expect(file.byType("IfcCostSchedule").length).toBe(0);
	});

	test("removes a schedule with items, including nested subitems", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file, { name: "Foo", predefinedType: "BUDGET" });
		const item1 = addCostItem(file, { costSchedule: schedule });
		addCostItem(file, { costItem: item1 });

		removeCostSchedule(file, { costSchedule: schedule });

		expect(file.byType("IfcCostSchedule").length).toBe(0);
		expect(file.byType("IfcCostItem").length).toBe(0);
		expect(file.byType("IfcRelNests").length).toBe(0);
		expect(file.byType("IfcRelAssignsToControl").length).toBe(0);
	});
});
