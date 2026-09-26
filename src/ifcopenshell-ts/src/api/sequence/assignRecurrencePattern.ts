// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/assign_recurrence_pattern.py`
// (src/ifcopenshell-python, 119 lines) -- part of `api.sequence` chunk 3 (see
// `./index.ts`'s own header comment for this chunk's full scope). Creates an
// `IfcRecurrencePattern` and assigns it to a parent (`IfcWorkTime` for a calendar's
// working/exception times, or `IfcTaskTimeRecurring` for a recurring maintenance task's
// own schedule), freeing up any previous recurrence pattern the parent already had (if
// it's not referenced elsewhere). No dependency of any kind on any other sibling file in
// this module -- confirmed by reading the whole real file (its only import beyond the
// bare `ifcopenshell` module is `ifcopenshell.util.sequence`, used only for its
// `RECURRENCE_TYPE` type hint, not called at runtime).
//
// `IfcRecurrencePattern` is constructed with a single positional value
// (`RecurrenceType`) -- confirmed identical attribute order across all 3 schemas (well,
// moot: IFC2X3 doesn't declare `IfcRecurrencePattern` at all, see below) against
// `ifc4.d.ts`/`ifc4x3.d.ts`: `RecurrenceType`(0), `DayComponent`(1), `WeekdayComponent`
// (2), `MonthComponent`(3), `Position`(4), `Interval`(5), `Occurrences`(6),
// `TimePeriods`(7). This is a bare `IfcRecurrencePattern` ENTITY construction (not a
// standalone defined/simple type), so it does NOT hit the `TODOS.md` standalone-valued-
// simple-type-construction gap.
//
// --- `parent.is_a("IfcWorkTime")`/`parent.is_a("IfcTaskTimeRecurring")` -- mutually
//     exclusive branches, ported verbatim (no `else` fallback for any other type) ---
//
// If `parent` is neither, real Python silently does nothing beyond creating and
// returning the (now-orphaned) `IfcRecurrencePattern` -- no error, no assignment. Ported
// verbatim: no `else` throw added.
//
// Schema availability: `IfcRecurrencePattern`/`IfcWorkTime`/`IfcTaskTimeRecurring` do NOT
// exist on IFC2X3 at all (confirmed against `src/generated/ifc2x3.d.ts`, matching this
// module's own chunk 1/2 findings) -- `file.createEntity("IfcRecurrencePattern", ...)`
// itself throws on IFC2X3, before either branch could even be reached.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** Python: `ifcopenshell.util.sequence.RECURRENCE_TYPE` -- not exported from
 * `util/sequence.ts` (that port only needed it as a value-position doc reference, never
 * a type import), so redeclared locally here, matching this project's established
 * per-file "redeclare a small literal union rather than reach across for an unexported
 * type" precedent (e.g. `./addWorkTime.ts`'s own local `SequenceTimeType`). */
export type RecurrenceType =
	| "BY_DAY_COUNT"
	| "BY_WEEKDAY_COUNT"
	| "DAILY"
	| "MONTHLY_BY_DAY_OF_MONTH"
	| "MONTHLY_BY_POSITION"
	| "WEEKLY"
	| "YEARLY_BY_DAY_OF_MONTH"
	| "YEARLY_BY_POSITION";

export interface AssignRecurrencePatternSettings {
	/**
	 * Either an `IfcTaskTimeRecurring` if defining a recurring schedule for a task, or an
	 * `IfcWorkTime` if defining a recurring pattern for working days or holidays in a
	 * calendar.
	 */
	parent: EntityInstance;
	/** One of the types of recurrences. Python default: `"WEEKLY"`. */
	recurrenceType?: RecurrenceType;
}

function assignRecurrencePatternUsecase(file: IfcFile, settings: AssignRecurrencePatternSettings): EntityInstance {
	const recurrenceType = settings.recurrenceType ?? "WEEKLY";
	const recurrence = file.createEntity("IfcRecurrencePattern", recurrenceType);

	if (settings.parent.isA("IfcWorkTime")) {
		const oldRecurrence = settings.parent.get("RecurrencePattern") as EntityInstance | null;
		if (oldRecurrence && file.getTotalInverses(oldRecurrence) === 1) {
			file.remove(oldRecurrence);
		}
		settings.parent.set("RecurrencePattern", recurrence);
	} else if (settings.parent.isA("IfcTaskTimeRecurring")) {
		const oldRecurrence = settings.parent.get("Recurrence") as EntityInstance | null;
		if (oldRecurrence && file.getTotalInverses(oldRecurrence) === 1) {
			file.remove(oldRecurrence);
		}
		settings.parent.set("Recurrence", recurrence);
	}
	return recurrence;
}

/**
 * Defines a time to recur at a particular interval (Python:
 * `ifcopenshell.api.sequence.assign_recurrence_pattern`).
 *
 * There are two scenarios where you might want to define a recurring time pattern.
 *
 * You might want a task to be scheduled at a recurring interval, this is common for
 * maintenance tasks which need to be performed monthly, every 6 months, every year, etc.
 *
 * Alternatively, you might be defining a work calendar, which defines working days or
 * holidays. The working days might be every week from monday to friday ("every" week
 * means it recurs every week), or the holidays might be the same every year.
 *
 * The types of recurrence are:
 * - DAILY: every Nth (interval) day for up to X (Occurrences) occurrences.
 * - WEEKLY: every Nth (interval) MTWTFSS (WeekdayComponent) for up to X (Occurrences) occurrences.
 * - MONTHLY_BY_DAY_OF_MONTH: every Nth (DayComponent) of every Xth (Interval) Month up to Y (Occurrences) occurrences.
 * - MONTHLY_BY_POSITION: every Nth (Position) MTWTFSS (WeekdayComponent) of every Xth (Interval) Month up to Y (Occurrences) occurrences.
 * - YEARLY_BY_DAY_OF_MONTH: every Nth (DayComponent) of every JFMAMJJASOND (MonthComponent) month of every Yth (Interval) Year up to Z (Occurrences) occurrences.
 * - YEARLY_BY_POSITION: every Nth (Position) MTWTFSS (WeekdayComponent) of every JFMAMJJASOND (MonthComponent) month of every Yth (Interval) Year up to Z (Occurrences) occurrences.
 *
 * @returns The newly created `IfcRecurrencePattern`.
 *
 * @example
 * ```ts
 * const calendar = api.sequence.addWorkCalendar(model);
 * const workTime = api.sequence.addWorkTime(model, { workCalendar: calendar, timeType: "WorkingTimes" });
 * const pattern = api.sequence.assignRecurrencePattern(model, { parent: workTime, recurrenceType: "WEEKLY" });
 * api.sequence.editRecurrencePattern(model, { recurrencePattern: pattern, attributes: { WeekdayComponent: [1, 2, 3, 4, 5] } });
 * ```
 */
export const assignRecurrencePattern = wrapUsecase(
	"sequence.assign_recurrence_pattern",
	assignRecurrencePatternUsecase,
);
