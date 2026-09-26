// This file was generated with the assistance of an AI coding tool.
//
// Port of `test/api/cost/test_add_cost_item.py`'s `TestAddCostItem` (real Python runs
// this against IFC4 and IFC2X3) -- run against every `AVAILABLE_SCHEMAS` entry here
// since neither `addCostItem` nor `addCostSchedule` touches anything IFC4X3-specific.

import { describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import type { EntityInstance } from "../../../src/entityInstance";
import { getNest } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.cost.addCostItem (%s)", (schema) => {
	test("adds a top-level cost item, assigned to the cost schedule as a control", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file, { name: "Foo" });

		const item1 = addCostItem(file, { costSchedule: schedule });

		expect(item1.isA("IfcCostItem")).toBe(true);
		const hasAssignments = item1.get("HasAssignments") as EntityInstance[];
		expect(hasAssignments[0].isA("IfcRelAssignsToControl")).toBe(true);
		expect((hasAssignments[0].get("RelatingControl") as EntityInstance).equals(schedule)).toBe(true);
	});

	test("adds a sub cost item, nested under the parent cost item", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file, { name: "Foo" });
		const item1 = addCostItem(file, { costSchedule: schedule });

		const item2 = addCostItem(file, { costItem: item1 });

		expect(item2.isA("IfcCostItem")).toBe(true);
		expect(getNest(item2)?.equals(item1)).toBe(true);
	});
});
