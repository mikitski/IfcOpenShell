// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/edit_cost_schedule.py` (src/ifcopenshell-python, 44
// lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s own
// header comment). Trivial, unconditional attribute-setter loop, structurally
// identical to `./editCostItem.ts`'s own pattern.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditCostScheduleSettings {
	/** The `IfcCostSchedule` entity you want to edit. */
	costSchedule: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editCostScheduleUsecase(_file: IfcFile, settings: EditCostScheduleSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.costSchedule.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcCostSchedule` (Python: `ifcopenshell.api.cost.edit_cost_schedule`).
 *
 * For more information about the attributes and data types of an `IfcCostSchedule`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * api.cost.editCostSchedule(model, { costSchedule: schedule, attributes: { Name: "Foo" } });
 * ```
 */
export const editCostSchedule = wrapUsecase("cost.edit_cost_schedule", editCostScheduleUsecase);
