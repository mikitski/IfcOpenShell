// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/edit_work_time.py` (src/ifcopenshell-python, 65
// lines) -- part of `api.sequence` chunk 2 (see `./index.ts`'s own header comment for
// this chunk's full scope). Per-attribute setter loop with special-cased handling for
// the start/finish date, written by INDEX (not by name) to paper over a real cross-schema
// attribute-name rename -- `util.date.datetime2ifc` (already landed) is the only real
// dependency.
//
// --- `IfcWorkTime.Start`/`.Finish` (IFC4) vs. `.StartDate`/`.FinishDate` (IFC4X3) --
//     same index, different name, hence the index-based write ---
//
// Confirmed directly against the generated schemas: `IfcWorkTime`'s 5th/6th attributes
// (index 4/5, after `Name`/`DataOrigin`/`UserDefinedDataOrigin`/`RecurrencePattern`) are
// named `Start`/`Finish` on IFC4, but `StartDate`/`FinishDate` on IFC4X3 -- same
// POSITION, different NAME, across schema versions. Real Python's own `attributes.items()`
// loop accepts EITHER name (`name in ("Start", "StartDate")` / `name in ("Finish",
// "FinishDate")`) and always writes by POSITIONAL index (`work_time[4]`/`work_time[5]`),
// sidestepping the schema-specific name entirely -- ported verbatim via
// `setByIndex(4, ...)`/`setByIndex(5, ...)` below. `IfcWorkTime` does not exist on
// IFC2X3 at all (confirmed against `ifc2x3.d.ts`, matching `./index.ts`'s own chunk 1
// finding), so only IFC4/IFC4X3 are exercised in practice.
//
// --- REAL, DISCLOSED ASYMMETRY vs. `./editWorkPlan.ts`/`./editWorkSchedule.ts`: NO
//     `if value:` truthy guard before the `datetime2ifc` call ---
//
// Unlike its two siblings (both of which only convert a TRUTHY value, per their own
// header comments), this function calls `ifcopenshell.util.date.datetime2ifc(value,
// "IfcDate")` for the Start/Finish branches UNCONDITIONALLY, even for a falsy
// (`None`/empty-string) `value`. This is harmless in practice -- `datetime2ifc(None,
// ...)` returns `None` directly (an explicit early-return in real Python, matching this
// port's own `datetime2ifc` overload for `null`/`undefined`), so passing `null` for
// `Start`/`StartDate` still correctly writes `null` at index 4 -- but it IS a genuine,
// disclosed structural difference from its two siblings' own gating logic, not an
// oversight in this port.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type Datetime2IfcInput, datetime2ifc } from "../../util/date";
import { wrapUsecase } from "../hooks";

// `IfcWorkTime.Start`/`StartDate` and `.Finish`/`FinishDate` -- same index across IFC4/
// IFC4X3 despite the attribute-name rename, see this file's header comment.
const START_INDEX = 4;
const FINISH_INDEX = 5;

export interface EditWorkTimeSettings {
	/** The `IfcWorkTime` entity you want to edit. */
	workTime: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editWorkTimeUsecase(_file: IfcFile, settings: EditWorkTimeSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		if (name === "Start" || name === "StartDate") {
			settings.workTime.setByIndex(START_INDEX, datetime2ifc(value as Datetime2IfcInput, "IfcDate"));
		} else if (name === "Finish" || name === "FinishDate") {
			settings.workTime.setByIndex(FINISH_INDEX, datetime2ifc(value as Datetime2IfcInput, "IfcDate"));
		} else {
			settings.workTime.set(name, value);
		}
	}
}

/**
 * Edits the attributes of an `IfcWorkTime` (Python:
 * `ifcopenshell.api.sequence.edit_work_time`).
 *
 * For more information about the attributes and data types of an `IfcWorkTime`, consult
 * the IFC documentation.
 *
 * Accepts either `Start`/`Finish` (IFC4's attribute names) or `StartDate`/`FinishDate`
 * (IFC4X3's renamed equivalents) -- both write to the same underlying attribute
 * position, see this file's header comment.
 *
 * @example
 * ```ts
 * const calendar = api.sequence.addWorkCalendar(model);
 * const workTime = api.sequence.addWorkTime(model, { workCalendar: calendar, timeType: "WorkingTimes" });
 * // If we don't specify any recurring time periods in our work time, we need to specify
 * // a start and end date of the work time. It starts at 0:00 on the start date and
 * // 24:00 at the end date.
 * api.sequence.editWorkTime(model, { workTime, attributes: { StartDate: new Date(2000, 0, 1), FinishDate: new Date(2000, 0, 2) } });
 * ```
 */
export const editWorkTime = wrapUsecase("sequence.edit_work_time", editWorkTimeUsecase);
