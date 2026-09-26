// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/edit_work_schedule.py` (src/ifcopenshell-python, 57
// lines) -- part of `api.sequence` chunk 2 (see `./index.ts`'s own header comment for
// this chunk's full scope). Structurally identical to `./editWorkPlan.ts` -- see that
// file's own header comment for the shared date/duration-conversion logic, the real,
// confirmed IFC2X3 schema-mismatch in real Python on `Duration`/`TotalFloat` (which
// applies here too -- `IfcWorkSchedule.Duration`/`.TotalFloat` have the exact same
// `number`-on-IFC2X3-vs-`string`-on-IFC4+ split, confirmed against the generated
// schemas), and -- importantly -- why this port does NOT reproduce real Python's own
// resulting throw (`EntityInstance.set()` performs no declared-attribute-type
// validation at all, a general, previously-undocumented primitive-layer gap, also
// written up in `TODOS.md`). `util.date.datetime2ifc` (already landed) is the only
// real dependency.
//
// `IfcWorkSchedule` itself exists on all 3 schemas -- see `./index.ts`'s own chunk 1
// header-comment finding.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type Datetime2IfcInput, datetime2ifc } from "../../util/date";
import { wrapUsecase } from "../hooks";

export interface EditWorkScheduleSettings {
	/** The `IfcWorkSchedule` entity you want to edit. */
	workSchedule: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editWorkScheduleUsecase(_file: IfcFile, settings: EditWorkScheduleSettings): void {
	for (const [name, rawValue] of Object.entries(settings.attributes)) {
		let value = rawValue;
		if (value) {
			if (name.includes("Date") || name.includes("Time")) {
				value = datetime2ifc(value as Datetime2IfcInput, "IfcDateTime");
			} else if (name === "Duration" || name === "TotalFloat") {
				// See `./editWorkPlan.ts`'s own header comment: no IFC2X3 guard here,
				// matching real Python's own missing branching -- but this port's
				// `.set()` doesn't validate the declared type, so this silently writes
				// a string into IFC2X3's numeric `Duration`/`TotalFloat` rather than
				// throwing (unlike real Python).
				value = datetime2ifc(value as Datetime2IfcInput, "IfcDuration");
			}
		}
		settings.workSchedule.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcWorkSchedule` (Python:
 * `ifcopenshell.api.sequence.edit_work_schedule`).
 *
 * For more information about the attributes and data types of an `IfcWorkSchedule`,
 * consult the IFC documentation.
 *
 * See `./editWorkPlan.ts`'s own header comment for a real, confirmed Python bug shared
 * by this sibling function -- editing `Duration`/`TotalFloat` with a truthy value always
 * throws on IFC2X3 in real Python (a schema type mismatch) -- and for why this port's
 * own `.set()` does NOT reproduce that throw (no declared-attribute-type validation).
 *
 * @example
 * ```ts
 * const workPlan = api.sequence.addWorkPlan(model, { name: "Construction" });
 * const workSchedule = api.sequence.addWorkSchedule(model, { name: "Construction Schedule A", workPlan });
 * api.sequence.editWorkSchedule(model, { workSchedule, attributes: { Description: "3 crane design option" } });
 * ```
 */
export const editWorkSchedule = wrapUsecase("sequence.edit_work_schedule", editWorkScheduleUsecase);
