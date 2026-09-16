// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/copy_cost_item_values.py` (src/ifcopenshell-python,
// 58 lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s
// own header comment). Deep-copies every `IfcCostValue` (and nested `Components`) from
// `source` onto `destination`, after first removing any of `destination`'s own
// existing values.
//
// --- REAL, DISCLOSED PYTHON BUG: `remove_cost_value(file, source, cost_value=cost_value)`
//     passes `source`, not `destination`, as the `parent` argument -- ported verbatim ---
//
// Real Python's own removal loop iterates `destination.CostValues` but calls
// `ifcopenshell.api.cost.remove_cost_value(file, source, cost_value=cost_value)` --
// `source` (the SECOND positional parameter of `remove_cost_value`, which is `parent`)
// is passed where `destination` is clearly intended (the loop is removing
// DESTINATION's own values, and `remove_cost_value`'s docstring/signature is
// `(file, parent, cost_value)`). This is harmless in the common case: a not-yet-shared
// `destination` cost value has exactly one inverse reference, so
// `remove_cost_value`'s OWN `file.get_total_inverses(cost_value) == 1` branch fires
// first and removes it outright without ever consulting `parent` at all. But if
// `destination`'s cost value is SHARED (e.g. via `./assignCostValue.ts`'s own literal-
// aliasing of `CostValues` between two cost items -- see that file's header comment),
// `remove_cost_value` falls through to `parent.is_a("IfcCostItem")`'s list-splice
// branch and tries to remove `cost_value` from `source.CostValues` instead of
// `destination.CostValues` -- which will genuinely raise (`ValueError` in Python,
// `Error` here, via `./removeCostValue.ts`'s own `removeOrThrow`) if `cost_value` isn't
// actually a member of `source`'s own value list. Ported byte-for-byte (`source` passed
// as `parent` below, not "fixed" to `destination`), per this project's near-verbatim-
// port mandate for a real, disclosed upstream bug.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { removeCostValue } from "./removeCostValue";

export interface CopyCostItemValuesSettings {
	/** The `IfcCostItem` to copy cost values from. */
	source: EntityInstance;
	/** The `IfcCostItem` to copy cost values to. Any existing values are removed first. */
	destination: EntityInstance;
}

function copyCostItemValuesUsecase(file: IfcFile, settings: CopyCostItemValuesSettings): void {
	const { source, destination } = settings;

	const existingDestinationValues = (destination.get("CostValues") as EntityInstance[] | null) ?? [];
	for (const costValue of existingDestinationValues) {
		// NOTE (disclosed Python bug, see this file's header comment): real Python
		// passes `source`, not `destination`, as `remove_cost_value`'s `parent`
		// argument here -- ported verbatim.
		removeCostValue(file, { parent: source, costValue });
	}

	const copiedCostValues: EntityInstance[] = [];
	for (const costValue of (source.get("CostValues") as EntityInstance[] | null) ?? []) {
		copiedCostValues.push(elementUtil.copyDeep(file, costValue));
	}
	destination.set("CostValues", copiedCostValues);
}

/**
 * Copies all cost values from one cost item to another (Python:
 * `ifcopenshell.api.cost.copy_cost_item_values`).
 *
 * Any previously existing values on `destination` will be removed. The entire value is
 * copied, including all components and formulas. However they are not parametrically
 * linked, so if one value changes, the other will not.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const item1 = api.cost.addCostItem(model, { costSchedule: schedule });
 * const item2 = api.cost.addCostItem(model, { costSchedule: schedule });
 *
 * const value = api.cost.addCostValue(model, { parent: item1 });
 * api.cost.editCostValue(model, { costValue: value, attributes: { AppliedValue: 5000.0 } });
 *
 * api.cost.copyCostItemValues(model, { source: item1, destination: item2 });
 * ```
 */
export const copyCostItemValues = wrapUsecase("cost.copy_cost_item_values", copyCostItemValuesUsecase);
