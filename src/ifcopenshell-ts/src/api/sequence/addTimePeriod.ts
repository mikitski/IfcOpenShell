// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/add_time_period.py` (src/ifcopenshell-python, 91
// lines) -- part of `api.sequence` chunk 3 (see `./index.ts`'s own header comment for
// this chunk's full scope). Creates a blank `IfcTimePeriod` with the given start/end
// times and appends it to a recurrence pattern's `TimePeriods` aggregate. No dependency
// of any kind on any other sibling file in this module -- confirmed by reading the whole
// real file (its only imports are `ifcopenshell.util.date`/`ifcopenshell.util.sequence`).
//
// --- `is_working_day`/`is_calendar_applicable` `.cache_clear()` calls: already-tracked
//     no-op, per `util/sequence.ts`'s own header comment finding #9 ---
//
// Real Python calls `ifcopenshell.util.sequence.is_working_day.cache_clear()`/
// `is_calendar_applicable.cache_clear()` at the end, purely to invalidate
// `@functools.cache` memoization after mutating a recurrence pattern's structure. This
// port's own `util/sequence.ts` does NOT implement memoization at all (always
// recomputing is strictly MORE correct, just less optimized) -- `util/sequence.ts`'s own
// header comment already anticipated this exact file and states the `.cache_clear()`
// calls "simply have nothing to do here" once ported. Omitted below, not silently
// dropped -- disclosed here per that pre-existing finding, not a new one.
//
// `IfcTimePeriod` (`StartTime`(0), `EndTime`(1) -- confirmed identical order across all
// 3 schemas against the generated `.d.ts`s) is created via a bare `file.create_entity`
// then populated by name, matching real Python's own `file.create_entity("IfcTimePeriod")`
// + attribute-by-name assignment (not positional construction) -- so this does NOT hit
// the `TODOS.md` standalone-valued-simple-type-construction gap (`IfcTimePeriod` is an
// ENTITY, not a defined/simple type; only its own `StartTime`/`EndTime` scalar
// attributes are plain `IfcTime`/string-typed, set via ordinary `.set()` on an already-
// constructed entity, not constructed as standalone values themselves).
//
// Schema availability: `IfcTimePeriod`/`IfcRecurrencePattern` do NOT exist on IFC2X3 at
// all (confirmed against `src/generated/ifc2x3.d.ts`, matching this module's own chunk
// 1/2 findings) -- unreachable on IFC2X3 in practice.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { datetime2ifc } from "../../util/date";
import { wrapUsecase } from "../hooks";

export interface AddTimePeriodSettings {
	/** The `IfcRecurrencePattern` to add the time period to. See `api.sequence.assignRecurrencePattern`. */
	recurrencePattern: EntityInstance;
	/** The start time of the time period, in a format compatible with `IfcTime` (an ISO format time string). */
	startTime?: string | null;
	/** The end time of the time period, in a format compatible with `IfcTime` (an ISO format time string). */
	endTime?: string | null;
}

function addTimePeriodUsecase(file: IfcFile, settings: AddTimePeriodSettings): EntityInstance {
	const timePeriod = file.createEntity("IfcTimePeriod");
	timePeriod.set("StartTime", datetime2ifc(settings.startTime ?? null, "IfcTime"));
	timePeriod.set("EndTime", datetime2ifc(settings.endTime ?? null, "IfcTime"));
	const timePeriods = [
		...((settings.recurrencePattern.get("TimePeriods") as EntityInstance[] | null) ?? []),
		timePeriod,
	];
	settings.recurrencePattern.set("TimePeriods", timePeriods);

	// See this file's header comment: `is_working_day`/`is_calendar_applicable`
	// `.cache_clear()` -- already-tracked no-op, nothing to do here.

	return timePeriod;
}

/**
 * Adds a time period to a recurrence pattern (Python:
 * `ifcopenshell.api.sequence.add_time_period`).
 *
 * A recurring time may be an all-day event, or only during certain time periods of the
 * day. For example, you might say that every 1st of January recurring is a public
 * holiday, which is an all-day event. Alternatively, you might say that you work every
 * (i.e. recurringly) Monday to Friday, from 9am to 5pm. The 9am to 5pm is the time
 * period.
 *
 * There may also be multiple recurrence patterns, such as from 9am to 12pm, and then
 * another from 1pm to 5pm (to indicate an hour break for lunch).
 *
 * @returns The newly created `IfcTimePeriod`.
 *
 * @example
 * ```ts
 * const calendar = api.sequence.addWorkCalendar(model);
 * const workTime = api.sequence.addWorkTime(model, { workCalendar: calendar, timeType: "WorkingTimes" });
 * const pattern = api.sequence.assignRecurrencePattern(model, { parent: workTime, recurrenceType: "WEEKLY" });
 * api.sequence.editRecurrencePattern(model, { recurrencePattern: pattern, attributes: { WeekdayComponent: [1, 2, 3, 4, 5] } });
 * api.sequence.addTimePeriod(model, { recurrencePattern: pattern, startTime: "09:00", endTime: "12:00" });
 * api.sequence.addTimePeriod(model, { recurrencePattern: pattern, startTime: "13:00", endTime: "17:00" });
 * ```
 */
export const addTimePeriod = wrapUsecase("sequence.add_time_period", addTimePeriodUsecase);
