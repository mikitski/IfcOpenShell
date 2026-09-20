// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/remove_work_calendar.py` (src/ifcopenshell-python,
// 71 lines) -- part of `api.sequence` chunk 3 (see `./index.ts`'s own header comment for
// this chunk's full scope). Un-declares the calendar from the project's `IfcContext`,
// unassigns every object it controls, removes every working/exception time it owns (via
// `./removeWorkTime.ts`, this chunk, ported first per the chunk brief), then removes the
// calendar itself and deep-purges its `OwnerHistory` if it had one.
//
// `api.control.unassignControl`, `api.project.unassignDeclaration`, `util.element.
// removeDeep2` (all already landed) and `./removeWorkTime.ts` (this chunk) are the only
// real dependencies -- confirmed by reading the whole real file.
//
// --- Real docstring comment, ported into this file's own header comment verbatim ---
//
// "Currently in API work times are created already attached to the work calendar, so
// they are never reused." -- i.e. this function always removes every `WorkingTimes`/
// `ExceptionTimes` entry outright via `./removeWorkTime.ts`, with no
// `getTotalInverses`-style reuse check first (contrast `./assignRecurrencePattern.ts`'s
// own such check when REPLACING a recurrence pattern) -- ported verbatim.
//
// --- `work_calendar.WorkingTimes or []` / `work_calendar.ExceptionTimes or []` --
//     ported as `?? []`, a genuinely reachable fallback (unlike some of this module's
//     `IfcObjectDefinition.IsDecomposedBy`-style unguarded direct accesses elsewhere) ---
//
// Both attributes are OPTIONAL (`IfcWorkCalendar.WorkingTimes`/`ExceptionTimes` are
// nullable list attributes, confirmed against the generated schemas), so a calendar with
// no working times at all genuinely reads back `null` here, not an undeclared-attribute
// throw -- the `?? []` fallback is load-bearing, not defensive dead code.
//
// Schema availability: `IfcWorkCalendar`/`IfcWorkTime` do NOT exist on IFC2X3 at all
// (confirmed against `src/generated/ifc2x3.d.ts`, matching this module's own chunk 1/2
// findings) -- `file.createEntity("IfcWorkCalendar", ...)` itself throws on IFC2X3
// before this function could ever be called against a real IFC2X3 instance, so no
// IFC2X3-specific guard is needed or present here (matching real Python's own total
// absence of one), but this function ALSO has NO `file.schema != "IFC2X3"` guard before
// its own first line's `file.by_type("IfcContext")[0]` call -- so calling it directly
// against an IFC2X3 file (with a fabricated, cross-schema `work_calendar` argument, an
// unrealistic but possible test scenario) throws on `IfcContext` first, matching `./
// removeWorkPlan.ts`'s/`./assignWorkPlan.ts`'s own already-disclosed identical finding
// for this exact `IfcContext`-lookup pattern.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { removeDeep2 } from "../../util/element";
import { unassignControl } from "../control/unassignControl";
import { wrapUsecase } from "../hooks";
import { unassignDeclaration } from "../project/unassignDeclaration";
import { removeWorkTime } from "./removeWorkTime";

export interface RemoveWorkCalendarSettings {
	/** The `IfcWorkCalendar` to remove. */
	workCalendar: EntityInstance;
}

function removeWorkCalendarUsecase(file: IfcFile, settings: RemoveWorkCalendarSettings): void {
	const { workCalendar } = settings;

	unassignDeclaration(file, {
		definitions: [workCalendar],
		relatingContext: file.byType("IfcContext")[0],
	});

	const controls = workCalendar.get("Controls") as EntityInstance[] | null;
	if (controls && controls.length > 0) {
		for (const rel of controls) {
			for (const relatedObject of rel.get("RelatedObjects") as EntityInstance[]) {
				unassignControl(file, {
					relatingControl: workCalendar,
					relatedObjects: [relatedObject],
				});
			}
		}
	}

	// Currently in API work times are created already attached to the work calendar, so
	// they are never reused.
	const workingTimes = (workCalendar.get("WorkingTimes") as EntityInstance[] | null) ?? [];
	for (const workingTime of workingTimes) {
		removeWorkTime(file, { workTime: workingTime });
	}

	const exceptionTimes = (workCalendar.get("ExceptionTimes") as EntityInstance[] | null) ?? [];
	for (const exceptionTime of exceptionTimes) {
		removeWorkTime(file, { workTime: exceptionTime });
	}

	const history = workCalendar.get("OwnerHistory") as EntityInstance | null;
	file.remove(workCalendar);
	if (history) removeDeep2(file, history);
}

/**
 * Removes a work calendar (Python: `ifcopenshell.api.sequence.remove_work_calendar`).
 *
 * All relationships are also removed, such as if a task is set to use that calendar.
 *
 * @example
 * ```ts
 * const calendar = api.sequence.addWorkCalendar(model, { name: "5 Day Week" });
 * api.sequence.removeWorkCalendar(model, { workCalendar: calendar });
 * ```
 */
export const removeWorkCalendar = wrapUsecase("sequence.remove_work_calendar", removeWorkCalendarUsecase);
