// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/add_task_time.py` (src/ifcopenshell-python, 66
// lines) -- part of `api.sequence` chunk 1 (see `./index.ts`'s own header comment for
// this chunk's full scope). Adds a blank `IfcTaskTime` (or `IfcTaskTimeRecurring`, for a
// recurring maintenance task) to `task`. No dependency of any kind -- confirmed by
// reading the whole real file, a 6-line function body with no imports beyond the bare
// `ifcopenshell` module.
//
// --- Schema availability: neither `IfcTaskTime` nor `IfcTaskTimeRecurring` exist on
//     IFC2X3 at all ---
//
// Confirmed directly against `src/generated/ifc2x3.d.ts` (zero matches for either
// interface name) vs. `ifc4.d.ts`/`ifc4x3.d.ts` (both present). Separately, IFC2X3's
// `IfcTask` has no `TaskTime` attribute at all either (confirmed against the same file --
// see `./addTask.ts`'s own header comment for the full `IfcTask` IFC2X3-vs-IFC4+
// attribute-shape comparison). Real Python has no guard for either gap -- `file.
// create_entity("IfcTaskTime"/"IfcTaskTimeRecurring")` simply raises for a class the
// schema doesn't declare, before `task.TaskTime = task_time` is ever reached. This port
// does the same: no proactive IFC2X3 guard, matching this project's established
// "disclose, don't silently guard" precedent.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddTaskTimeSettings {
	/** The task to add time data to. */
	task: EntityInstance;
	/** Whether or not the time should recur. */
	isRecurring?: boolean;
}

function addTaskTimeUsecase(file: IfcFile, settings: AddTaskTimeSettings): EntityInstance {
	const taskTime = file.createEntity(settings.isRecurring ? "IfcTaskTimeRecurring" : "IfcTaskTime");
	settings.task.set("TaskTime", taskTime);
	return taskTime;
}

/**
 * Adds a task time to a task (Python: `ifcopenshell.api.sequence.add_task_time`).
 *
 * Some tasks, such as activities within a work breakdown structure or overall
 * maintenance tasks will have time related information. This includes start dates,
 * durations, end dates, and possible recurring times (especially for maintenance tasks).
 *
 * Time data is blank by default -- use `api.sequence.editTaskTime` (not yet ported) to
 * populate it.
 *
 * @returns The newly created `IfcTaskTime` (or `IfcTaskTimeRecurring`).
 *
 * @example
 * ```ts
 * const task = api.sequence.addTask(model, { workSchedule: schedule, name: "Ground Floor FRP" });
 * const time = api.sequence.addTaskTime(model, { task });
 * ```
 */
export const addTaskTime = wrapUsecase("sequence.add_task_time", addTaskTimeUsecase);
