// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `copy_cost_item_values.py`, only the docstring's own
// worked example. This suite is written directly from the real source's own behavior,
// including a regression test for the disclosed `source`-vs-`destination` bug (see
// `../../../src/api/cost/copyCostItemValues.ts`'s own header comment).
//
// Fixture values are given content via `Category` (a plain string attribute, no
// wrapping needed), NOT `AppliedValue` -- `AppliedValue` needs `./editCostValue.ts`'s
// own already-disclosed, blocked `IfcMonetaryMeasure` construction (see that file's
// own header comment and `TODOS.md`), which would make these tests about the disclosed
// gap rather than about `copyCostItemValues`'s own deep-copy behavior.

import { describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { addCostValue } from "../../../src/api/cost/addCostValue";
import { copyCostItemValues } from "../../../src/api/cost/copyCostItemValues";
import { editCostValue } from "../../../src/api/cost/editCostValue";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.cost.copyCostItemValues (%s)", (schema) => {
	test("deep-copies the source's values onto the destination", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item1 = addCostItem(file, { costSchedule: schedule });
		const item2 = addCostItem(file, { costSchedule: schedule });
		const value = addCostValue(file, { parent: item1 });
		editCostValue(file, { costValue: value, attributes: { Category: "Labour" } });

		copyCostItemValues(file, { source: item1, destination: item2 });

		const destinationValues = item2.get("CostValues") as EntityInstance[];
		expect(destinationValues.length).toBe(1);
		expect(destinationValues[0].equals(value)).toBe(false);
		expect(destinationValues[0].get("Category")).toBe("Labour");
		// Not parametrically linked -- editing the source's value later doesn't affect
		// the copy.
		editCostValue(file, { costValue: value, attributes: { Category: "Material" } });
		expect(destinationValues[0].get("Category")).toBe("Labour");
	});

	test("removes the destination's own pre-existing values first", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item1 = addCostItem(file, { costSchedule: schedule });
		const item2 = addCostItem(file, { costSchedule: schedule });
		const oldValue = addCostValue(file, { parent: item2 });
		editCostValue(file, { costValue: oldValue, attributes: { Category: "Old" } });

		copyCostItemValues(file, { source: item1, destination: item2 });

		const destinationValues = item2.get("CostValues") as EntityInstance[];
		expect(destinationValues.length).toBe(0);
		expect(file.byType("IfcCostValue").some((v) => v.equals(oldValue))).toBe(false);
	});

	test("disclosed bug: removing a destination value SHARED with another cost item throws (real Python passes `source` instead of `destination` as the parent)", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item1 = addCostItem(file, { costSchedule: schedule });
		const item2 = addCostItem(file, { costSchedule: schedule });
		const item3 = addCostItem(file, { costSchedule: schedule });
		// item2's existing value is shared with item3 (2 inverses -> total_inverses > 1
		// -> remove_cost_value falls into its list-splice branch, using the wrong
		// `parent`).
		const sharedValue = addCostValue(file, { parent: item2 });
		item3.set("CostValues", [sharedValue]);

		expect(() => copyCostItemValues(file, { source: item1, destination: item2 })).toThrow();
	});
});
