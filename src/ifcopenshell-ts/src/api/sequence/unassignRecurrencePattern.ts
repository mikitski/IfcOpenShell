// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/unassign_recurrence_pattern.py`
// (src/ifcopenshell-python, 53 lines) -- part of `api.sequence` chunk 2 (see
// `./index.ts`'s own header comment for this chunk's full scope). Removes every
// `IfcTimePeriod` the recurrence pattern owns, then removes the `IfcRecurrencePattern`
// itself. No dependency of any kind -- confirmed by reading the whole real file (its
// only import is the bare `ifcopenshell` module).
//
// Neither `IfcTimePeriod` nor `IfcRecurrencePattern` is an `IfcRoot` subtype (no
// `GlobalId`/`OwnerHistory` on either -- confirmed against the generated schemas), so
// there's no `OwnerHistory` cascade-cleanup to perform here, matching `./
// removeTimePeriod.ts`'s own identical finding.
//
// --- Real docstring warning, ported into this file's own JSDoc verbatim ---
//
// A recurring task time (`IfcTaskTimeRecurring`) REQUIRES a recurrence pattern -- this
// function does not clean up the now-dangling reference on its caller's behalf (real
// Python's own docstring: "be sure to clean up after this API call"). Left as the
// caller's own responsibility, matching real Python exactly.
//
// Schema availability: `IfcRecurrencePattern`/`IfcTimePeriod` do NOT exist on IFC2X3 at
// all (confirmed against `src/generated/ifc2x3.d.ts`, zero matches for either) --
// unreachable on IFC2X3 in practice, matching this module's own chunk 1 finding for
// `IfcWorkCalendar`/`IfcTaskTime`/`IfcTaskTimeRecurring`/`IfcWorkTime`/`IfcLagTime`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface UnassignRecurrencePatternSettings {
	/** The `IfcRecurrencePattern` to remove. */
	recurrencePattern: EntityInstance;
}

function unassignRecurrencePatternUsecase(file: IfcFile, settings: UnassignRecurrencePatternSettings): void {
	const { recurrencePattern } = settings;
	const timePeriods = (recurrencePattern.get("TimePeriods") as EntityInstance[] | null) ?? [];
	for (const timePeriod of timePeriods) {
		file.remove(timePeriod);
	}
	file.remove(recurrencePattern);
}

/**
 * Unassigns a recurrence pattern (Python:
 * `ifcopenshell.api.sequence.unassign_recurrence_pattern`).
 *
 * Note that a recurring task time must have a recurrence pattern, so if you remove it,
 * be sure to clean up after this API call (e.g. remove the `IfcTaskTimeRecurring`
 * entity, or assign a different recurrence pattern to it, or replace
 * `IfcTaskTimeRecurring` with `IfcTaskTime`).
 *
 * @example
 * ```ts
 * const calendar = api.sequence.addWorkCalendar(model);
 * const workTime = api.sequence.addWorkTime(model, { workCalendar: calendar, timeType: "WorkingTimes" });
 * const pattern = file.createEntity("IfcRecurrencePattern", "WEEKLY", null, null, null, null, null, null);
 * // Change our mind -- let's just maintain it whenever we feel like it.
 * api.sequence.unassignRecurrencePattern(model, { recurrencePattern: pattern });
 * ```
 */
export const unassignRecurrencePattern = wrapUsecase(
	"sequence.unassign_recurrence_pattern",
	unassignRecurrencePatternUsecase,
);
