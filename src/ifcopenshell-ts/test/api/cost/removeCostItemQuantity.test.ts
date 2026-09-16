// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `remove_cost_item_quantity.py`, only the docstring's
// own worked example. This suite is written directly from the real source's own
// behavior. `CostQuantities` is IFC4+ only (see `./addCostItemQuantity.test.ts`'s own
// header comment), so this suite is gated to non-IFC2X3 schemas.

import { describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostItemQuantity } from "../../../src/api/cost/addCostItemQuantity";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { removeCostItemQuantity } from "../../../src/api/cost/removeCostItemQuantity";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.cost.removeCostItemQuantity (%s)", (schema) => {
	test("removes a solely-referenced quantity outright", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const quantity = addCostItemQuantity(file, { costItem: item, ifcClass: "IfcQuantityVolume" });

		removeCostItemQuantity(file, { costItem: item, physicalQuantity: quantity });

		expect(item.get("CostQuantities")).toBeNull();
		expect(file.byType("IfcQuantityVolume").length).toBe(0);
	});
});
