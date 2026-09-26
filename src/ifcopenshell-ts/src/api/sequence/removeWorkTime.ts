// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/remove_work_time.py` (src/ifcopenshell-python, 49
// lines) -- part of `api.sequence` chunk 3 (see `./index.ts`'s own header comment for
// this chunk's full scope). Removes a work time, unassigning (and thereby deleting, see
// `./unassignRecurrencePattern.ts`) its `RecurrencePattern` first if it has one.
//
// Ported before `./removeWorkCalendar.ts` within this chunk, per the chunk brief: it has
// a real (non-docstring) dependency on this function (both `WorkingTimes`/
// `ExceptionTimes` cleanup loops).
//
// `./unassignRecurrencePattern.ts` (already landed, chunk 2) is the only real dependency
// -- confirmed by reading the whole real file.
//
// --- Real docstring note, disclosed verbatim: recurrence patterns are never reused ---
//
// "Currently in API recurrence patterns are created during assignment and removed during
// unassignment, so they are never reused." -- i.e. this function always removes
// `RecurrencePattern` outright rather than checking `file.get_total_inverses` first
// (contrast `./assignRecurrencePattern.ts`'s own already-landed `getTotalInverses(...) ===
// 1` check when REPLACING a recurrence pattern) -- ported verbatim, no such check here.
//
// Schema availability: `IfcWorkTime`/`IfcRecurrencePattern` do NOT exist on IFC2X3 at all
// (confirmed against `src/generated/ifc2x3.d.ts`, matching this module's own chunk 1/2
// findings) -- unreachable on IFC2X3 in practice.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { unassignRecurrencePattern } from "./unassignRecurrencePattern";

export interface RemoveWorkTimeSettings {
	/** The `IfcWorkTime` to remove. */
	workTime: EntityInstance;
}

function removeWorkTimeUsecase(file: IfcFile, settings: RemoveWorkTimeSettings): void {
	const { workTime } = settings;
	const recurrencePattern = workTime.get("RecurrencePattern") as EntityInstance | null;
	if (recurrencePattern) {
		unassignRecurrencePattern(file, { recurrencePattern });
	}
	file.remove(workTime);
}

/**
 * Removes a work time (Python: `ifcopenshell.api.sequence.remove_work_time`).
 *
 * @example
 * ```ts
 * const calendar = api.sequence.addWorkCalendar(model);
 * const workTime = api.sequence.addWorkTime(model, { workCalendar: calendar, timeType: "WorkingTimes" });
 * api.sequence.removeWorkTime(model, { workTime });
 * ```
 */
export const removeWorkTime = wrapUsecase("sequence.remove_work_time", removeWorkTimeUsecase);
