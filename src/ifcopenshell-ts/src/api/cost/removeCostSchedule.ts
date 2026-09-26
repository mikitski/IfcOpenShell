// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/remove_cost_schedule.py` (src/ifcopenshell-python, 52
// lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s own
// header comment). Removes a cost schedule and, for every `IfcRelAssignsToControl`
// inverse of it, recursively removes each `IfcCostItem` among that rel's
// `RelatedObjects` via `./removeCostItem.ts` (which itself already handles nested
// subitems and the rel's own cleanup -- see that file's own header comment). Real
// Python's own `# TODO: do a deep purge` self-flag is ported verbatim.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { removeCostItem } from "./removeCostItem";

export interface RemoveCostScheduleSettings {
	/** The `IfcCostSchedule` entity you want to remove. */
	costSchedule: EntityInstance;
}

function removeCostScheduleUsecase(file: IfcFile, settings: RemoveCostScheduleSettings): void {
	const { costSchedule } = settings;

	// TODO: do a deep purge (matching real Python's own self-flag).
	for (const inverse of file.getInverse(costSchedule) as Set<EntityInstance>) {
		if (inverse.isA("IfcRelAssignsToControl")) {
			for (const relatedObject of inverse.get("RelatedObjects") as EntityInstance[]) {
				if (relatedObject.isA("IfcCostItem")) {
					removeCostItem(file, { costItem: relatedObject });
				}
			}
		}
	}
	const history = costSchedule.get("OwnerHistory") as EntityInstance | null;
	file.remove(costSchedule);
	if (history) elementUtil.removeDeep2(file, history);
}

/**
 * Removes a cost schedule (Python: `ifcopenshell.api.cost.remove_cost_schedule`).
 *
 * All associated relationships with the cost schedule are also removed, including all
 * cost items.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 * api.cost.removeCostSchedule(model, { costSchedule: schedule });
 * ```
 */
export const removeCostSchedule = wrapUsecase("cost.remove_cost_schedule", removeCostScheduleUsecase);
