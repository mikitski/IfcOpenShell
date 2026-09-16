// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/add_cost_item.py` (src/ifcopenshell-python, 66
// lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s own
// header comment for the module's overall scope). Creates a bare `IfcCostItem` (via
// the already-landed `api.root.createEntity`) and either assigns it as a top-level
// item of `costSchedule` (`api.control.assignControl`) or nests it under an existing
// `costItem` (`api.nest.assignObject`) -- mutually exclusive per real Python's own
// docstring, though neither branch is enforced here (matching real Python: if both are
// supplied, only `costSchedule` wins, per the `if`/`elif` shape; if neither is
// supplied, the new item is simply left unattached, no error).
//
// Real Python also imports `ifcopenshell.guid`, but never actually calls it in this
// function's body (`root.create_entity` handles `GlobalId` generation internally) --
// a dead import in the real source, not reproduced here since this port has no
// module-level side-effecting imports to preserve either way.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { assignControl } from "../control/assignControl";
import { wrapUsecase } from "../hooks";
import { assignObject } from "../nest/assignObject";
import { createEntity } from "../root/createEntity";

export interface AddCostItemSettings {
	/**
	 * If the cost item is to be added as a root or top level cost item to a cost
	 * schedule, the `IfcCostSchedule` may be specified. Mutually exclusive with
	 * `costItem`.
	 */
	costSchedule?: EntityInstance | null;
	/**
	 * If the cost item is to be added as a subitem to an existing cost item, the
	 * parent `IfcCostItem` may be specified. Mutually exclusive with `costSchedule`.
	 */
	costItem?: EntityInstance | null;
}

function addCostItemUsecase(file: IfcFile, settings: AddCostItemSettings = {}): EntityInstance {
	const newCostItem = createEntity(file, { ifcClass: "IfcCostItem" });

	if (settings.costSchedule) {
		assignControl(file, { relatingControl: settings.costSchedule, relatedObjects: [newCostItem] });
	} else if (settings.costItem) {
		assignObject(file, { relatedObjects: [newCostItem], relatingObject: settings.costItem });
	}
	return newCostItem;
}

/**
 * Add a new cost item (Python: `ifcopenshell.api.cost.add_cost_item`).
 *
 * A cost item represents a single line item in a cost schedule. Cost items may then be
 * broken down into cost subitems.
 *
 * Either `costSchedule` or `costItem` must be provided.
 *
 * @returns The newly created `IfcCostItem`.
 *
 * @example
 * ```ts
 * // The very first cost item must be in a cost schedule.
 * const schedule = api.cost.addCostSchedule(model);
 *
 * // You may add cost items as top level item in the schedule.
 * const item1 = api.cost.addCostItem(model, { costSchedule: schedule });
 *
 * // Alternatively you may add them as subitems.
 * const item2 = api.cost.addCostItem(model, { costItem: item1 });
 * ```
 */
export const addCostItem = wrapUsecase("cost.add_cost_item", addCostItemUsecase);
