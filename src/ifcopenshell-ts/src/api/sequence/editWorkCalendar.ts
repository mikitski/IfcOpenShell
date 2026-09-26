// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/edit_work_calendar.py` (src/ifcopenshell-python, 47
// lines) -- part of `api.sequence` chunk 2 (see `./index.ts`'s own header comment for
// this chunk's full scope). Trivial, unconditional attribute-setter loop over
// `attributes`, structurally identical to `./editTask.ts`/`../cost/editCostSchedule.ts`.
// No dependency of any kind -- confirmed by reading the whole real file.
//
// Schema availability: `IfcWorkCalendar` does NOT exist on IFC2X3 at all (confirmed
// against `src/generated/ifc2x3.d.ts`, zero matches -- matching this module's own chunk
// 1 header-comment finding). This function is unreachable on IFC2X3 in practice (there's
// no `IfcWorkCalendar` to construct in the first place), not something this file itself
// needs to guard.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditWorkCalendarSettings {
	/** The `IfcWorkCalendar` entity you want to edit. */
	workCalendar: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editWorkCalendarUsecase(_file: IfcFile, settings: EditWorkCalendarSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.workCalendar.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcWorkCalendar` (Python:
 * `ifcopenshell.api.sequence.edit_work_calendar`).
 *
 * For more information about the attributes and data types of an `IfcWorkCalendar`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const calendar = api.sequence.addWorkCalendar(model, { name: "5 Day Week" });
 * api.sequence.editWorkCalendar(model, { workCalendar: calendar, attributes: { Description: "Monday to Friday 8 hour days" } });
 * ```
 */
export const editWorkCalendar = wrapUsecase("sequence.edit_work_calendar", editWorkCalendarUsecase);
