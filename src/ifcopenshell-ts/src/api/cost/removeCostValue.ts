// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/remove_cost_value.py` (src/ifcopenshell-python, 62
// lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s own
// header comment). Removes a cost value that is assigned to a cost item, a construction
// resource, or another cost value (i.e. a subcomponent).
//
// If `costValue` has exactly one inverse reference (the common case: only `parent`
// points to it), it's removed outright (`file.remove`) -- no deep purge of ITS OWN
// components, matching real Python's own `# TODO deep purge` self-flag, ported
// verbatim (a cost value with its own nested `Components` would leak those orphaned
// sub-entities). Otherwise (shared, e.g. via `./assignCostValue.ts`'s own literal-
// aliasing of `cost_rate.CostValues` into another cost item -- see that file's header
// comment), it's spliced out of whichever list-valued attribute `parent` owns it from.
//
// --- `values.remove(cost_value)` -- Python's `list.remove` raises `ValueError` if
//     `cost_value` isn't actually a member; ported via `removeOrThrow` below, NOT a
//     silent `.filter()` no-op ---
//
// This distinction is genuinely load-bearing: `./copyCostItemValues.ts`'s own disclosed
// Python bug (passing `source` instead of `destination` as this function's `parent`)
// can reach exactly this "not actually a member" case for a shared cost value, and
// real Python crashes there with `ValueError: list.remove(x): x not in list` -- a
// silently-swallowed `.filter()` would hide that crash instead of reproducing it.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** Python's `list.remove(x)` -- throws if `x` isn't present, unlike a silent `.filter()`. */
function removeOrThrow(list: readonly EntityInstance[], item: EntityInstance): EntityInstance[] {
	const index = list.findIndex((v) => v.equals(item));
	if (index === -1) throw new Error("removeCostValue: cost_value not in parent's value list.");
	return [...list.slice(0, index), ...list.slice(index + 1)];
}

export interface RemoveCostValueSettings {
	/** The `IfcCostItem`, `IfcConstructionResource`, or `IfcCostValue` that `costValue` is assigned to. */
	parent: EntityInstance;
	/** The `IfcCostValue` that you want to remove. */
	costValue: EntityInstance;
}

function removeCostValueUsecase(file: IfcFile, settings: RemoveCostValueSettings): void {
	const { parent, costValue } = settings;

	if (file.getTotalInverses(costValue) === 1) {
		file.remove(costValue);
		// TODO deep purge (matching real Python's own self-flag).
		return;
	}
	if (parent.isA("IfcCostItem")) {
		const values = removeOrThrow(parent.get("CostValues") as EntityInstance[], costValue);
		parent.set("CostValues", values.length > 0 ? values : null);
	} else if (parent.isA("IfcConstructionResource")) {
		const values = removeOrThrow(parent.get("BaseCosts") as EntityInstance[], costValue);
		parent.set("BaseCosts", values.length > 0 ? values : null);
	} else if (parent.isA("IfcCostValue")) {
		const components = removeOrThrow(parent.get("Components") as EntityInstance[], costValue);
		parent.set("Components", components.length > 0 ? components : null);
	}
}

/**
 * Removes a cost value (Python: `ifcopenshell.api.cost.remove_cost_value`).
 *
 * The cost value may be assigned either to a cost item, a construction resource, or
 * another cost value (i.e. it is a subcomponent of a cost).
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 *
 * const value = api.cost.addCostValue(model, { parent: item });
 * api.cost.editCostValue(model, { costValue: value, attributes: { AppliedValue: 5.0 } });
 *
 * api.cost.removeCostValue(model, { parent: item, costValue: value });
 * ```
 */
export const removeCostValue = wrapUsecase("cost.remove_cost_value", removeCostValueUsecase);
