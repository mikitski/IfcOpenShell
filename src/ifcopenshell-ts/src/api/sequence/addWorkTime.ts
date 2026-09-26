// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/add_work_time.py` (src/ifcopenshell-python, 84
// lines) -- part of `api.sequence` chunk 1 (see `./index.ts`'s own header comment for
// this chunk's full scope). Adds a blank `IfcWorkTime` to `workCalendar`'s `WorkingTimes`
// or `ExceptionTimes` set, depending on `timeType`. No dependency of any kind -- confirmed
// by reading the whole real file.
//
// --- Schema availability: `IfcWorkTime` doesn't exist on IFC2X3 at all ---
//
// Confirmed directly against `src/generated/ifc2x3.d.ts` (zero matches) vs. `ifc4.d.ts`/
// `ifc4x3.d.ts` (both present, identical attribute shape, including `WorkingTimes`/
// `ExceptionTimes` on `IfcWorkCalendar` itself). Real Python has no guard for this --
// `file.create_entity("IfcWorkTime")` simply raises for a class the schema doesn't
// declare, before `workCalendar` is ever touched. This port does the same: no proactive
// IFC2X3 guard, matching this project's established "disclose, don't silently guard"
// precedent. (In practice this is moot for a real `IfcWorkCalendar`, since that class
// itself doesn't exist on IFC2X3 either -- see `./addWorkCalendar.ts`'s own header
// comment -- so a caller would already be unable to construct a valid `workCalendar`
// argument on IFC2X3 in the first place; this function's own IFC2X3 failure mode is
// documented independently anyway, since nothing stops a caller from passing an
// unrelated/synthetic entity here.)
//
// --- `timeType` outside the two documented literal values: the created `IfcWorkTime` is
//     silently orphaned (never attached to `workCalendar`), but still returned ---
//
// Real Python's own `TIME_TYPE = Literal["WorkingTimes", "ExceptionTimes"]` type hint
// restricts the *documented* API surface, but is not enforced at runtime -- `time_type`
// is a plain string parameter. If a caller passes anything else, `work_time =
// file.create_entity("IfcWorkTime")` still runs (a real entity is created and returned),
// but NEITHER `if` branch matches, so it's never appended to `work_calendar.WorkingTimes`
// or `.ExceptionTimes` -- a real, minor, ported-verbatim quirk (an orphaned `IfcWorkTime`
// with zero inverse references), not specifically guarded against by real Python either.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** Python: `TIME_TYPE = Literal["WorkingTimes", "ExceptionTimes"]`. */
export type SequenceTimeType = "WorkingTimes" | "ExceptionTimes";

export interface AddWorkTimeSettings {
	/** The `IfcWorkCalendar` to add the work or holiday time definition to. */
	workCalendar: EntityInstance;
	/** Either `"WorkingTimes"` or `"ExceptionTimes"`, depending on what you want to define. Python default: `"WorkingTimes"`. */
	timeType?: SequenceTimeType;
}

function addWorkTimeUsecase(file: IfcFile, settings: AddWorkTimeSettings): EntityInstance {
	const timeType = settings.timeType ?? "WorkingTimes";
	const workTime = file.createEntity("IfcWorkTime");

	if (timeType === "WorkingTimes") {
		const workingTimes = [...((settings.workCalendar.get("WorkingTimes") as EntityInstance[] | null) ?? []), workTime];
		settings.workCalendar.set("WorkingTimes", workingTimes);
	} else if (timeType === "ExceptionTimes") {
		const exceptionTimes = [
			...((settings.workCalendar.get("ExceptionTimes") as EntityInstance[] | null) ?? []),
			workTime,
		];
		settings.workCalendar.set("ExceptionTimes", exceptionTimes);
	}
	return workTime;
}

/**
 * Add either working times or holiday times to a calendar (Python:
 * `ifcopenshell.api.sequence.add_work_time`).
 *
 * A calendar defines when work occurs by defining working times and holiday times.
 * First, the working times are defined, then the holidays may override the working
 * times. For this reason, holidays are also known as exception times.
 *
 * @returns The newly created `IfcWorkTime`.
 *
 * @example
 * ```ts
 * const calendar = api.sequence.addWorkCalendar(model);
 * const workTime = api.sequence.addWorkTime(model, { workCalendar: calendar, timeType: "WorkingTimes" });
 * ```
 */
export const addWorkTime = wrapUsecase("sequence.add_work_time", addWorkTimeUsecase);
