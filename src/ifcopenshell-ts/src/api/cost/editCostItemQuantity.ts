// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/edit_cost_item_quantity.py` (src/ifcopenshell-python,
// 52 lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s
// own header comment). Trivial, unconditional attribute-setter loop on an
// `IfcPhysicalQuantity`, structurally identical to `./editCostItem.ts`'s own pattern.
// No `OwnerHistory` touch of any kind -- real Python never calls `update_owner_history`
// here either (`IfcPhysicalQuantity` isn't an `IfcRoot` subtype and has none).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditCostItemQuantitySettings {
	/** The `IfcPhysicalQuantity` entity you want to edit. */
	physicalQuantity: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editCostItemQuantityUsecase(_file: IfcFile, settings: EditCostItemQuantitySettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.physicalQuantity.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcPhysicalQuantity` (Python: `ifcopenshell.api.cost.edit_cost_item_quantity`).
 *
 * For more information about the attributes and data types of an `IfcPhysicalQuantity`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 * const quantity = api.cost.addCostItemQuantity(model, { costItem: item, ifcClass: "IfcQuantityVolume" });
 * api.cost.editCostItemQuantity(model, { physicalQuantity: quantity, attributes: { VolumeValue: 3.0 } });
 * ```
 */
export const editCostItemQuantity = wrapUsecase("cost.edit_cost_item_quantity", editCostItemQuantityUsecase);
