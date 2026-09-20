// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/remove_time_period.py` (src/ifcopenshell-python, 56
// lines) -- part of `api.sequence` chunk 2 (see `./index.ts`'s own header comment for
// this chunk's full scope). A one-line `file.remove(time_period)` -- `IfcTimePeriod` is
// not an `IfcRoot` subtype (no `GlobalId`/`OwnerHistory` -- confirmed against the
// generated schemas: `IfcTimePeriod` is just `{StartTime, EndTime}`), so there's no
// `OwnerHistory` cascade-cleanup to perform, unlike most other `remove_*` functions in
// this module. No dependency of any kind -- confirmed by reading the whole real file.
//
// Schema availability: `IfcTimePeriod` does NOT exist on IFC2X3 at all (confirmed
// against `src/generated/ifc2x3.d.ts`, matching `IfcRecurrencePattern`'s own identical
// finding in `./unassignRecurrencePattern.ts`) -- unreachable on IFC2X3 in practice.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface RemoveTimePeriodSettings {
	/** The `IfcTimePeriod` to remove. */
	timePeriod: EntityInstance;
}

function removeTimePeriodUsecase(file: IfcFile, settings: RemoveTimePeriodSettings): void {
	file.remove(settings.timePeriod);
}

/**
 * Removes a time period (Python: `ifcopenshell.api.sequence.remove_time_period`).
 *
 * @example
 * ```ts
 * const calendar = api.sequence.addWorkCalendar(model);
 * const workTime = api.sequence.addWorkTime(model, { workCalendar: calendar, timeType: "WorkingTimes" });
 * const morning = file.createEntity("IfcTimePeriod", "09:00:00", "12:00:00");
 * api.sequence.removeTimePeriod(model, { timePeriod: morning });
 * ```
 */
export const removeTimePeriod = wrapUsecase("sequence.remove_time_period", removeTimePeriodUsecase);
