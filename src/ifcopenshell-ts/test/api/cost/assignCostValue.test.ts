// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `assign_cost_value.py`, only the docstring's own
// worked example. This suite is written directly from the real source's own behavior,
// including the disclosed literal-aliasing quirk (see
// `../../../src/api/cost/assignCostValue.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { addCostValue } from "../../../src/api/cost/addCostValue";
import { assignCostValue } from "../../../src/api/cost/assignCostValue";
import { editCostValue } from "../../../src/api/cost/editCostValue";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.cost.assignCostValue (%s)", (schema) => {
	test("copies (aliases) the rate's cost values onto the target cost item", () => {
		const file = createTestFile(schema);
		const rateTables = addCostSchedule(file, { predefinedType: "SCHEDULEOFRATES" });
		const rate = addCostItem(file, { costSchedule: rateTables });
		const rateValue = addCostValue(file, { parent: rate });
		editCostValue(file, { costValue: rateValue, attributes: { Category: "Rate" } });

		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });

		assignCostValue(file, { costItem: item, costRate: rate });

		const itemValues = item.get("CostValues") as EntityInstance[];
		expect(itemValues.length).toBe(1);
		// Literal aliasing (see header comment): the SAME entity, not a copy.
		expect(itemValues[0].equals(rateValue)).toBe(true);
	});

	test("removes any existing values on the cost item first", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const existingValue = addCostValue(file, { parent: item });
		editCostValue(file, { costValue: existingValue, attributes: { Category: "Old" } });

		const rateTables = addCostSchedule(file, { predefinedType: "SCHEDULEOFRATES" });
		const rate = addCostItem(file, { costSchedule: rateTables });
		const rateValue = addCostValue(file, { parent: rate });
		editCostValue(file, { costValue: rateValue, attributes: { Category: "Rate" } });

		assignCostValue(file, { costItem: item, costRate: rate });

		const itemValues = item.get("CostValues") as EntityInstance[];
		expect(itemValues.length).toBe(1);
		expect(itemValues[0].equals(rateValue)).toBe(true);
		expect(itemValues.some((v) => v.equals(existingValue))).toBe(false);
	});
});
