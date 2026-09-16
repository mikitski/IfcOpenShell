// This file was generated with the assistance of an AI coding tool.
//
// Port of `test/api/cost/test_remove_cost_item.py`'s `TestRemoveCostItem` (real Python
// runs this against IFC4 and IFC2X3).

import { describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { removeCostItem } from "../../../src/api/cost/removeCostItem";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.cost.removeCostItem (%s)", (schema) => {
	test("removes a cost item and its assignment to the schedule", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file, { name: "Foo", predefinedType: "BUDGET" });
		const item1 = addCostItem(file, { costSchedule: schedule });

		removeCostItem(file, { costItem: item1 });

		expect(file.byType("IfcCostItem").length).toBe(0);
		expect(file.byType("IfcRelAssignsToControl").length).toBe(0);
	});

	test("removes a sub cost item, keeping the parent and the nest rel", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file, { name: "Foo", predefinedType: "BUDGET" });
		const item1 = addCostItem(file, { costSchedule: schedule });
		const item2 = addCostItem(file, { costItem: item1 });

		removeCostItem(file, { costItem: item2 });

		const remainingItems = file.byType("IfcCostItem");
		expect(remainingItems.length).toBe(1);
		expect(remainingItems[0].equals(item1)).toBe(true);
		expect(file.byType("IfcRelAssignsToControl").length).toBeGreaterThan(0);
		expect(file.byType("IfcRelNests").length).toBe(0);
	});

	test("removes a parent cost item along with its nested subitem", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file, { name: "Foo", predefinedType: "BUDGET" });
		const item1 = addCostItem(file, { costSchedule: schedule });
		addCostItem(file, { costItem: item1 });

		removeCostItem(file, { costItem: item1 });

		expect(file.byType("IfcCostItem").length).toBe(0);
		expect(file.byType("IfcRelAssignsToControl").length).toBe(0);
		expect(file.byType("IfcRelNests").length).toBe(0);
	});

	test("keeps the control rel for other cost items in the same schedule", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file, { name: "Foo", predefinedType: "BUDGET" });
		const item1 = addCostItem(file, { costSchedule: schedule });
		const item2 = addCostItem(file, { costSchedule: schedule });

		removeCostItem(file, { costItem: item1 });

		const remainingItems = file.byType("IfcCostItem");
		expect(remainingItems.length).toBe(1);
		expect(remainingItems[0].equals(item2)).toBe(true);
		const rel = file.byType("IfcRelAssignsToControl")[0];
		expect(rel).toBeDefined();
		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(1);
		expect(relatedObjects[0].equals(item2)).toBe(true);
	});
});
