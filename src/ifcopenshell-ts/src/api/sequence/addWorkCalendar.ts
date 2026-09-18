// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/add_work_calendar.py` (src/ifcopenshell-python, 92
// lines) -- CHUNK 1 of the real, ongoing port of `api.sequence` (40 real files, ~4257
// lines total; before this chunk only `add_date_time` was ported, a small self-contained
// dependency of `api.cost.addCostSchedule` -- see `./index.ts`'s own header comment for
// this chunk's full scope). Creates a new `IfcWorkCalendar` (a construction-planning
// calendar defining working/holiday times) and declares it against the project's
// `IfcContext`.
//
// --- Schema availability: `IfcWorkCalendar` doesn't exist on IFC2X3 at all ---
//
// Confirmed directly against `src/generated/ifc2x3.d.ts` (zero matches for the interface
// name) vs. `ifc4.d.ts`/`ifc4x3.d.ts` (both present, identical attribute shape). Real
// Python has no guard for this -- `file.create_entity("IfcWorkCalendar", ...)` (via
// `root.create_entity`) simply raises for a class the schema doesn't declare. This port
// does the same: no proactive IFC2X3 guard is added, matching this project's established
// "disclose, don't silently guard" precedent for every other confirmed cross-schema
// class-availability gap.
//
// --- No `file.schema != "IFC2X3"` guard around the final `assignDeclaration` call,
//     unlike its two siblings `add_work_plan`/`add_work_schedule` ---
//
// Real Python's `add_work_calendar.py` calls `ifcopenshell.api.project.assign_declaration`
// UNCONDITIONALLY, with no schema check at all -- unlike `add_work_plan.py`/
// `add_work_schedule.py` (both guard this exact same call with `if file.schema !=
// "IFC2X3":`, citing a buildingSMART forum ambiguity over whether project declaration and
// aggregation are mutually exclusive). In practice this is moot for THIS function
// specifically (IFC2X3 already throws earlier, at the `IfcWorkCalendar` creation step
// itself, per the schema-availability finding above, so the `assignDeclaration` call is
// never actually reached on IFC2X3) -- but it's a genuine, verified inconsistency between
// three near-identical sibling functions, disclosed here rather than silently "corrected"
// to match its siblings.
//
// `api.root.createEntity`/`api.project.assignDeclaration` (both already landed, verified
// directly against their own TS source) are the only two real dependencies -- confirmed
// by reading the whole real file, including its own docstring example.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { assignDeclaration } from "../project/assignDeclaration";
import { createEntity } from "../root/createEntity";

export interface AddWorkCalendarSettings {
	/** The name of the calendar. Typically something like "5 Day Working Week" or "24/7". Python default: `"Unnamed"`. */
	name?: string;
	/**
	 * The type of calendar, typically used to more specifically define shifts, such as
	 * FIRSTSHIFT, SECONDSHIFT, or THIRDSHIFT. Leave as NOTDEFINED for basic calendar
	 * usage.
	 */
	predefinedType?: string;
}

function addWorkCalendarUsecase(file: IfcFile, settings: AddWorkCalendarSettings = {}): EntityInstance {
	const name = settings.name ?? "Unnamed";
	const predefinedType = settings.predefinedType ?? "NOTDEFINED";

	const workCalendar = createEntity(file, { ifcClass: "IfcWorkCalendar", predefinedType, name });
	const context = file.byType("IfcContext")[0];
	assignDeclaration(file, { definitions: [workCalendar], relatingContext: context });
	return workCalendar;
}

/**
 * Add a work calendar (Python: `ifcopenshell.api.sequence.add_work_calendar`).
 *
 * A work calendar defines when work is allowed to occur and when the holidays are. This
 * is a fundamental concept in construction planning. Every task in a work schedule will
 * have an associated calendar. Some tasks and resources work 24/7, whereas others work
 * Monday to Friday, or 5.5 day weeks, etc. This is important, as task durations may only
 * occur during working times in a work calendar.
 *
 * Work calendars can also be used to associate with events, such as indicating that
 * during certain days and times of the year, motion sensors should turn on the lights,
 * and other smart building controls.
 *
 * @returns The newly created `IfcWorkCalendar`.
 *
 * @example
 * ```ts
 * const calendar = api.sequence.addWorkCalendar(model, { name: "5 Day Week" });
 * ```
 */
export const addWorkCalendar = wrapUsecase("sequence.add_work_calendar", addWorkCalendarUsecase);
