// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/remove_cost_item_quantity.py` (src/ifcopenshell-
// python, 51 lines) -- part of this project's brand-new `api.cost` chunk (see
// `./index.ts`'s own header comment). Removes a quantity assigned to a cost item -- if
// the quantity is also parametrically shared with a product (i.e. more than one
// inverse reference), only the cost item's own link is spliced out; otherwise the
// quantity entity itself is removed outright.
//
// `quantities.remove(physical_quantity)` -- Python's `list.remove` raises if
// `physicalQuantity` isn't actually a member; ported via `removeOrThrow`, matching
// `../cost/removeCostValue.ts`'s own identical, already-disclosed precedent for this
// exact "don't silently swallow a not-a-member removal" distinction (duplicated here
// per-file, not shared, matching this codebase's established local-helper convention).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** Python's `list.remove(x)` -- throws if `x` isn't present. */
function removeOrThrow(list: readonly EntityInstance[], item: EntityInstance): EntityInstance[] {
	const index = list.findIndex((v) => v.equals(item));
	if (index === -1) throw new Error("removeCostItemQuantity: physicalQuantity not in costItem.CostQuantities.");
	return [...list.slice(0, index), ...list.slice(index + 1)];
}

export interface RemoveCostItemQuantitySettings {
	/** The `IfcCostItem` that the quantity is assigned to. */
	costItem: EntityInstance;
	/** The `IfcPhysicalQuantity` to remove. */
	physicalQuantity: EntityInstance;
}

function removeCostItemQuantityUsecase(file: IfcFile, settings: RemoveCostItemQuantitySettings): void {
	const { costItem, physicalQuantity } = settings;

	if (file.getTotalInverses(physicalQuantity) === 1) {
		file.remove(physicalQuantity);
		return;
	}
	const quantities = removeOrThrow(costItem.get("CostQuantities") as EntityInstance[], physicalQuantity);
	costItem.set("CostQuantities", quantities);
}

/**
 * Removes a quantity assigned to a cost item (Python: `ifcopenshell.api.cost.remove_cost_item_quantity`).
 *
 * If the quantity is part of a product (e.g. wall), then the quantity will still exist
 * and merely the relationship to the cost item will be removed.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 * const quantity = api.cost.addCostItemQuantity(model, { costItem: item, ifcClass: "IfcQuantityVolume" });
 * // Let's change our mind and delete it.
 * api.cost.removeCostItemQuantity(model, { costItem: item, physicalQuantity: quantity });
 * ```
 */
export const removeCostItemQuantity = wrapUsecase("cost.remove_cost_item_quantity", removeCostItemQuantityUsecase);
