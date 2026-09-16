// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/assign_cost_value.py` (src/ifcopenshell-python, 71
// lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s own
// header comment). Assigns a cost value to a cost item "from a schedule of rates" --
// removes any of `costItem`'s existing values, then aliases `costItem.CostValues`
// directly onto `costRate.CostValues`.
//
// --- Literal aliasing, not a deep copy -- intentional, per real Python's own docstring
//     ("When the schedule of rates value is updated, then your cost item values will
//     also be updated") ---
//
// `cost_item.CostValues = cost_rate.CostValues` assigns the exact SAME underlying
// `IfcCostValue` array/entities to `costItem` -- both `costItem.CostValues` and
// `costRate.CostValues` end up referencing the IDENTICAL `IfcCostValue` instances
// afterward (not copies). This is deliberate ("This is an assumption, and not part of
// the official IFC documentation" -- real Python's own comment, ported as this file's
// own disclosure too), but it has a real, non-obvious consequence for
// `./removeCostValue.ts`: since the same `IfcCostValue` is now referenced by BOTH
// `costItem.CostValues` AND `costRate.CostValues`, `file.getTotalInverses(costValue)`
// will be >= 2 for it afterward, so removing it from EITHER cost item takes
// `removeCostValue`'s list-splice branch (never its single-inverse `file.remove`
// branch) unless the other cost item's reference is cleared first.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { removeCostValue } from "./removeCostValue";

export interface AssignCostValueSettings {
	/** The `IfcCostItem` that you want to copy the values to. */
	costItem: EntityInstance;
	/** The `IfcCostItem` that you want to copy the values from. */
	costRate: EntityInstance;
}

function assignCostValueUsecase(file: IfcFile, settings: AssignCostValueSettings): void {
	const { costItem, costRate } = settings;

	const existingCostValues = costItem.get("CostValues") as EntityInstance[] | null;
	if (existingCostValues) {
		for (const costValue of existingCostValues) {
			removeCostValue(file, { parent: costItem, costValue });
		}
	}
	// See this file's header comment: an intentional literal alias, not a deep copy.
	costItem.set("CostValues", costRate.get("CostValues"));
}

/**
 * Assigns a cost value to a cost item from a schedule of rates (Python:
 * `ifcopenshell.api.cost.assign_cost_value`).
 *
 * Instead of assigning cost values from scratch for each cost item in a cost schedule,
 * the cost values may instead be assigned from a schedule of rates.
 *
 * A schedule of rates is just another cost schedule which has cost values but no
 * quantities. This API will allow you to "copy" the values from a cost item in the
 * schedule of rates into another cost item in your own cost schedule. When the
 * schedule of rates value is updated, then your cost item values will also be updated.
 *
 * @example
 * ```ts
 * // A schedule of rates with a single rate in it of 5.0.
 * const rateTables = api.cost.addCostSchedule(model, { predefinedType: "SCHEDULEOFRATES" });
 * const rate = api.cost.addCostItem(model, { costSchedule: rateTables });
 * const rateValue = api.cost.addCostValue(model, { parent: rate });
 * api.cost.editCostValue(model, { costValue: rateValue, attributes: { AppliedValue: 5.0 } });
 *
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 *
 * // Now the cost item has the same rate as the schedule of rate's item.
 * api.cost.assignCostValue(model, { costItem: item, costRate: rate });
 * ```
 */
export const assignCostValue = wrapUsecase("cost.assign_cost_value", assignCostValueUsecase);
