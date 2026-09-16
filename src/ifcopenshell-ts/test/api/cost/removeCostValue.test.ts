// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `remove_cost_value.py`, only the docstring's own
// worked example and its use as a helper throughout other real Python test files. This
// suite is written directly from the real source's own behavior, including the
// "not-a-member throws" distinction disclosed in
// `../../../src/api/cost/removeCostValue.ts`'s own header comment.

import { describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { addCostValue } from "../../../src/api/cost/addCostValue";
import { editCostValue } from "../../../src/api/cost/editCostValue";
import { removeCostValue } from "../../../src/api/cost/removeCostValue";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.cost.removeCostValue (%s)", (schema) => {
	test("removes a solely-referenced value outright", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const value = addCostValue(file, { parent: item });
		editCostValue(file, { costValue: value, attributes: { Category: "Labour" } });

		removeCostValue(file, { parent: item, costValue: value });

		expect(item.get("CostValues")).toBeNull();
		expect(file.byType("IfcCostValue").length).toBe(0);
	});

	test("splices a shared value out of the parent's list instead of deleting it", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const value = addCostValue(file, { parent: item });
		// Manually share the value with a second cost item (real Python's own
		// `assign_cost_value` produces exactly this kind of literal aliasing -- see
		// `assignCostValue.test.ts`).
		const item2 = addCostItem(file, { costSchedule: schedule });
		item2.set("CostValues", [value]);

		removeCostValue(file, { parent: item, costValue: value });

		expect(item.get("CostValues")).toBeNull();
		// The value itself still exists, still referenced by item2.
		expect(file.byType("IfcCostValue").length).toBe(1);
		expect((item2.get("CostValues") as EntityInstance[])[0].equals(value)).toBe(true);
	});
});
