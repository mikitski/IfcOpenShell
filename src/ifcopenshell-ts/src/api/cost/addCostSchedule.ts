// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/add_cost_schedule.py` (src/ifcopenshell-python, 63
// lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s own
// header comment). Creates a bare `IfcCostSchedule` (via the already-landed
// `api.root.createEntity`) and stamps its `UpdateDate` with the current time via
// `api.sequence.addDateTime` -- ported ahead of the rest of that otherwise-unported
// module specifically for this real dependency (see `../sequence/addDateTime.ts`'s own
// header comment).
//
// Real Python: `cost_schedule.UpdateDate = ifcopenshell.api.sequence.add_date_time(file,
// datetime.now())` -- ported as `costSchedule.set("UpdateDate", addDateTime(file, { dt:
// new Date() }))`, using a plain JS `Date` as the "current wall clock time" value
// (matching `addDateTime.ts`'s own disclosed `dt: Date` parameter-type decision).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { createEntity } from "../root/createEntity";
import { addDateTime } from "../sequence/addDateTime";

export interface AddCostScheduleSettings {
	/** The name of the cost schedule. */
	name?: string | null;
	/**
	 * The predefined type of the cost schedule, chosen from a valid
	 * `IfcCostScheduleTypeEnum` value. Python default: `"NOTDEFINED"`.
	 */
	predefinedType?: string;
}

function addCostScheduleUsecase(file: IfcFile, settings: AddCostScheduleSettings = {}): EntityInstance {
	const predefinedType = settings.predefinedType ?? "NOTDEFINED";

	const costSchedule = createEntity(file, {
		ifcClass: "IfcCostSchedule",
		predefinedType,
		name: settings.name ?? null,
	});
	costSchedule.set("UpdateDate", addDateTime(file, { dt: new Date() }));
	return costSchedule;
}

/**
 * Add a new cost schedule (Python: `ifcopenshell.api.cost.add_cost_schedule`).
 *
 * A cost schedule is a group of cost items which typically represent a cost plan or
 * breakdown of the project. This may be used as an estimate, bid, or actual cost.
 *
 * Alternatively, a cost schedule may also represent a schedule of rates, which include
 * cost items which capture unit rates for different elements or processes.
 *
 * As such, creating a cost schedule is necessary prior to creating and managing any
 * cost items.
 *
 * @returns The newly created `IfcCostSchedule` entity.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * // Now that we have a cost schedule, we may add cost items to it.
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 * ```
 */
export const addCostSchedule = wrapUsecase("cost.add_cost_schedule", addCostScheduleUsecase);
