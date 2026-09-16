// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_cost_value_formula.py`, only the docstring's
// own worked example. This suite is written directly from the real source's own
// behavior, including the disclosed "falsy formula is a silent no-op" quirk, and the
// disclosed, already 8-times-confirmed `TODOS.md` primitive-layer gap that blocks
// every real (non-empty, numeric) formula from actually writing its computed
// `AppliedValue` -- confirmed empirically against this exact worktree's own built
// native addon while writing this suite. See
// `../../../src/api/cost/editCostValueFormula.ts`'s own header comment for the full
// writeup.

import { describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { addCostValue } from "../../../src/api/cost/addCostValue";
import { editCostValueFormula } from "../../../src/api/cost/editCostValueFormula";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.cost.editCostValueFormula (%s)", (schema) => {
	// Real Python's own docstring example: `formula="5000 * 1.19"`. Once the
	// `TODOS.md` gap closes, this should set `value.ArithmeticOperator` to
	// `"MULTIPLY"` and create 2 `Components` (5000 and 1.19), each wrapped as an
	// `IfcMonetaryMeasure`.
	test("BLOCKED: a multi-operand arithmetic formula needs freshly-constructed IfcMonetaryMeasure components", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const value = addCostValue(file, { parent: item });

		expect(() => editCostValueFormula(file, { costValue: value, formula: "5000 * 1.19" })).toThrow();

		// The root's own bookkeeping (set BEFORE recursing into components, matching
		// real Python's own statement order) is already committed at the point of the
		// throw.
		expect(value.get("ArithmeticOperator")).toBe("MULTIPLY");
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
