// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/edit_recurrence_pattern.py` (src/ifcopenshell-python,
// 61 lines) -- part of `api.sequence` chunk 3 (see `./index.ts`'s own header comment for
// this chunk's full scope). Trivial, unconditional attribute-setter loop over
// `attributes`, structurally identical to `./editTask.ts`'s own pattern. No dependency
// of any kind -- confirmed by reading the whole real file (its only imports are the bare
// `ifcopenshell` module and `ifcopenshell.util.sequence`, the latter only for the
// `.cache_clear()` calls at the end).
//
// --- `is_working_day`/`is_calendar_applicable` `.cache_clear()` calls: already-tracked
//     no-op, per `util/sequence.ts`'s own header comment finding #9 (the SECOND of the 2
//     files that comment specifically anticipated -- see `./addTimePeriod.ts`'s own
//     identical finding for the first) ---
//
// Omitted below, not silently dropped -- this port's own `util/sequence.ts` does not
// implement memoization at all, so there is nothing for these calls to invalidate.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditRecurrencePatternSettings {
	/** The `IfcRecurrencePattern` entity you want to edit. */
	recurrencePattern: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editRecurrencePatternUsecase(_file: IfcFile, settings: EditRecurrencePatternSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.recurrencePattern.set(name, value);
	}
	// See this file's header comment: `is_working_day`/`is_calendar_applicable`
	// `.cache_clear()` -- already-tracked no-op, nothing to do here.
}

/**
 * Edits the attributes of an `IfcRecurrencePattern` (Python:
 * `ifcopenshell.api.sequence.edit_recurrence_pattern`).
 *
 * For more information about the attributes and data types of an `IfcRecurrencePattern`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const calendar = api.sequence.addWorkCalendar(model);
 * const workTime = api.sequence.addWorkTime(model, { workCalendar: calendar, timeType: "WorkingTimes" });
 * const pattern = api.sequence.assignRecurrencePattern(model, { parent: workTime, recurrenceType: "WEEKLY" });
 * api.sequence.editRecurrencePattern(model, { recurrencePattern: pattern, attributes: { WeekdayComponent: [1, 2, 3, 4, 5] } });
 * ```
 */
export const editRecurrencePattern = wrapUsecase("sequence.edit_recurrence_pattern", editRecurrencePatternUsecase);
