// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/edit_cost_item.py` (src/ifcopenshell-python, 44
// lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s own
// header comment). Trivial, unconditional attribute-setter loop, structurally
// identical to `../resource/editResource.ts`'s/`../system/editSystem.ts`'s own
// established pattern for this exact Python shape.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditCostItemSettings {
	/** The `IfcCostItem` entity you want to edit. */
	costItem: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editCostItemUsecase(_file: IfcFile, settings: EditCostItemSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.costItem.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcCostItem` (Python: `ifcopenshell.api.cost.edit_cost_item`).
 *
 * For more information about the attributes and data types of an `IfcCostItem`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 * api.cost.editCostItem(model, { costItem: item, attributes: { Name: "Foo" } });
 * ```
 */
export const editCostItem = wrapUsecase("cost.edit_cost_item", editCostItemUsecase);
