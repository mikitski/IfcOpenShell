// This file was generated with the assistance of an AI coding tool.
//
// Port of `test/api/cost/test_copy_cost_schedule.py`'s `TestCopyCostSchedule` (real
// Python runs this against IFC4, IFC2X3, and IFC4X3).

import { describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { copyCostSchedule } from "../../../src/api/cost/copyCostSchedule";
import type { EntityInstance } from "../../../src/entityInstance";
import { getRootCostItems, getScheduleCostItems } from "../../../src/util/cost";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.cost.copyCostSchedule (%s)", (schema) => {
	test("duplicates the schedule and its cost items, removing the copies from the original", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file, { name: "Foo" });
		const item = addCostItem(file, { costSchedule: schedule });
		addCostItem(file, { costItem: item }); // Subitem.
		const oldCostItems = new Set(file.byType("IfcCostItem"));

		const newSchedule = copyCostSchedule(file, { costSchedule: schedule });

		expect(newSchedule).toBeDefined();
		expect(newSchedule.equals(schedule)).toBe(false);
		expect(getRootCostItems(newSchedule).length).toBe(1);
		const newCostItems = [...getScheduleCostItems(newSchedule)];
		expect(newCostItems.length).toBe(2);
		expect(newCostItems.some((n: EntityInstance) => [...oldCostItems].some((o) => o.equals(n)))).toBe(false);

		// The copies should be removed from the original schedule.
		const remaining = [...getScheduleCostItems(schedule)];
		expect(remaining.length).toBe(oldCostItems.size);
	});
});
