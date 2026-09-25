// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_cost_value_formula.py`, only the docstring's
// own worked example. This suite is written directly from the real source's own
// behavior, including the disclosed "falsy formula is a silent no-op" quirk. See
// `../../../src/api/cost/editCostValueFormula.ts`'s own header comment for the full
// writeup of the (now-resolved) `TODOS.md` primitive-layer gate this file's own
// `AppliedValue`-wrapping construction used to hit.

import { describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { addCostValue } from "../../../src/api/cost/addCostValue";
import { editCostValueFormula } from "../../../src/api/cost/editCostValueFormula";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.cost.editCostValueFormula (%s)", (schema) => {
	// Real Python's own docstring example: `formula="5000 * 1.19"`.
	test("a multi-operand arithmetic formula creates IfcMonetaryMeasure-wrapped components", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const value = addCostValue(file, { parent: item });

		editCostValueFormula(file, { costValue: value, formula: "5000 * 1.19" });

		expect(value.get("ArithmeticOperator")).toBe("MULTIPLY");
		const components = value.get("Components") as EntityInstance[];
		expect(components).toHaveLength(2);
		expect((components[0].get("AppliedValue") as EntityInstance).getByIndex(0)).toBe(5000);
		expect((components[1].get("AppliedValue") as EntityInstance).getByIndex(0)).toBe(1.19);
	});

	test("an empty formula is a silent no-op, NOT blocked by the primitive gap", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const value = addCostValue(file, { parent: item });

		expect(() => editCostValueFormula(file, { costValue: value, formula: "" })).not.toThrow();

		expect(value.get("AppliedValue")).toBeNull();
		expect(value.get("Category")).toBeNull();
	});
});
