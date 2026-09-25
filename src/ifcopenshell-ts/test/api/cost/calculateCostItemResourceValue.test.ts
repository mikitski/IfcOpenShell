// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `calculate_cost_item_resource_value.py`, only the
// docstring's own worked example. This suite is written directly from the real
// source's own behavior. See
// `../../../src/api/cost/calculateCostItemResourceValue.ts`'s own header comment for
// the full writeup of the (now-resolved) `TODOS.md` primitive-layer gate this
// function's own transitive `editCostValueFormula` call used to hit.

import { beforeEach, describe, expect, test } from "vitest";
import { assignControl } from "../../../src/api/control/assignControl";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { addCostValue } from "../../../src/api/cost/addCostValue";
import { calculateCostItemResourceValue } from "../../../src/api/cost/calculateCostItemResourceValue";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.cost.calculateCostItemResourceValue (%s)",
	(schema) => {
		// The resource's own `BaseCosts` value has no `AppliedValue` set, so `getCost`
		// reads it as `0` (`getPrimitiveAppliedValue`'s own `!appliedValue` fallback);
		// `getQuantity` falls back to `1` with no quantity added either. The resulting
		// `"0*1"` formula parses as a `MULTIPLY` of 2 leaves (not a single scalar
		// `AppliedValue` on the root -- only a true single-operand formula gets that),
		// the first leaf's `AppliedValue` staying `null` (a falsy `0` operand, per
		// `editCostValueFormula.ts`'s own `if (data.AppliedValue)` guard), the second
		// wrapped as a real `IfcMonetaryMeasure(1)`.
		test("computing a resource's cost writes a real 0*1 MULTIPLY formula", () => {
			const file = createTestFile(schema);
			const schedule = addCostSchedule(file);
			const item = addCostItem(file, { costSchedule: schedule });
			const crew = addResource(file, { ifcClass: "IfcCrewResource" });
			const concrete = addResource(file, { ifcClass: "IfcConstructionMaterialResource", parentResource: crew });
			assignControl(file, { relatingControl: item, relatedObjects: [concrete] });
			const baseCost = addCostValue(file, { parent: concrete });
			expect(baseCost).toBeDefined();

			calculateCostItemResourceValue(file, { costItem: item });

			const costValues = item.get("CostValues") as EntityInstance[];
			expect(costValues).toHaveLength(1);
			const costValue = costValues[0];
			expect(costValue.get("Name")).toBe("Unnamed");
			expect(costValue.get("ArithmeticOperator")).toBe("MULTIPLY");
			const components = costValue.get("Components") as EntityInstance[];
			expect(components).toHaveLength(2);
			expect(components[0].get("AppliedValue")).toBeNull();
			expect((components[1].get("AppliedValue") as EntityInstance).getByIndex(0)).toBe(1);
		});

		test("no resources controlled: clears existing values and does nothing else, NOT blocked", () => {
			const file = createTestFile(schema);
			const schedule = addCostSchedule(file);
			const item = addCostItem(file, { costSchedule: schedule });
			const existing = addCostValue(file, { parent: item });
			expect(existing).toBeDefined();

			expect(() => calculateCostItemResourceValue(file, { costItem: item })).not.toThrow();

			expect((item.get("CostValues") as EntityInstance[] | null) ?? []).toEqual([]);
		});
	},
);
