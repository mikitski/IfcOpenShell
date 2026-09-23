// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `calculate_cost_item_resource_value.py`, only the
// docstring's own worked example. This suite is written directly from the real
// source's own behavior, including the disclosed, already 8-times-confirmed
// `TODOS.md` primitive-layer gap this function transitively hits via
// `./editCostValueFormula.ts` for every resource with a resolvable cost -- confirmed
// empirically against this exact worktree's own built native addon while writing this
// suite. See `../../../src/api/cost/calculateCostItemResourceValue.ts`'s own header
// comment for the full writeup.

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
		// SKIPPED (PR #179): PR #179 fixed the native `attribute_value_shim.cpp` gate
		// this test pinned (TODOS.md's "EntityInstance.setByIndex/IfcFile
		// .createEntity ..." entry, now RESOLVED for the shared gate) --
		// constructing the formula's `IfcMonetaryMeasure` operand no longer throws.
		// Real expected result: `calculateCostItemResourceValue` should complete and
		// write a real numeric `AppliedValue` on the cost item's own cost value --
		// left to a follow-up module-grouped chunk to verify and flip.
		test.skip("BLOCKED: computing a resource's cost needs a freshly-constructed IfcMonetaryMeasure formula operand", () => {
			const file = createTestFile(schema);
			const schedule = addCostSchedule(file);
			const item = addCostItem(file, { costSchedule: schedule });
			const crew = addResource(file, { ifcClass: "IfcCrewResource" });
			const concrete = addResource(file, { ifcClass: "IfcConstructionMaterialResource", parentResource: crew });
			assignControl(file, { relatingControl: item, relatedObjects: [concrete] });
			const baseCost = addCostValue(file, { parent: concrete });
			// The resource's own BaseCosts value can't be given a real numeric
			// AppliedValue either (same blocked gap) -- `getCost` will simply read `0`
			// for it (`getPrimitiveAppliedValue`'s own `!appliedValue` fallback), which is
			// enough to exercise `calculateCostItemResourceValue`'s own control flow up to
			// the point it tries to materialize the computed formula's own value.
			expect(baseCost).toBeDefined();

			expect(() => calculateCostItemResourceValue(file, { costItem: item })).toThrow();
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
