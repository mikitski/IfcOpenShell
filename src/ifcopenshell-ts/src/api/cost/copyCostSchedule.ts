// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/copy_cost_schedule.py` (src/ifcopenshell-python, 50
// lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s own
// header comment). Real Python's own comment: "Shared code logic with
// copy_work_schedule" (an unported `api.sequence` function -- not relevant here since
// only `add_date_time` is in scope from that module, see `../sequence/index.ts`).
//
// Shallow-copies the schedule itself (`util.element.copy`), then, for each top-level
// `IfcCostItem` under the ORIGINAL schedule (via its `Controls` inverse), duplicates it
// with `./copyCostItem.ts` and re-parents the duplicate onto the NEW schedule --
// unassigning it from the original schedule's control relationship first (real
// Python's own comment: "The copies should be removed from the original schedule").

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { assignControl } from "../control/assignControl";
import { unassignControl } from "../control/unassignControl";
import { wrapUsecase } from "../hooks";
import { copyCostItem } from "./copyCostItem";

export interface CopyCostScheduleSettings {
	/** The `IfcCostSchedule` to copy. */
	costSchedule: EntityInstance;
}

function copyCostScheduleUsecase(file: IfcFile, settings: CopyCostScheduleSettings): EntityInstance {
	const { costSchedule } = settings;
	const newSchedule = elementUtil.copy(file, costSchedule);

	for (const rel of costSchedule.get("Controls") as EntityInstance[]) {
		for (const costItem of rel.get("RelatedObjects") as EntityInstance[]) {
			let duplicatedCostItem = copyCostItem(file, { costItem });
			if (Array.isArray(duplicatedCostItem)) {
				// All other nested items are not connected to the cost schedule explicitly.
				duplicatedCostItem = duplicatedCostItem[0];
			}
			unassignControl(file, { relatingControl: costSchedule, relatedObjects: [duplicatedCostItem] });
			assignControl(file, { relatingControl: newSchedule, relatedObjects: [duplicatedCostItem] });
		}
	}
	return newSchedule;
}

/**
 * Copy a cost schedule (Python: `ifcopenshell.api.cost.copy_cost_schedule`).
 *
 * @returns The duplicated `IfcCostSchedule` entity.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const newSchedule = api.cost.copyCostSchedule(model, { costSchedule: schedule });
 * ```
 */
export const copyCostSchedule = wrapUsecase("cost.copy_cost_schedule", copyCostScheduleUsecase);
