// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/edit_work_plan.py` (src/ifcopenshell-python, 53
// lines) -- part of `api.sequence` chunk 2 (see `./index.ts`'s own header comment for
// this chunk's full scope). Per-attribute setter loop that additionally converts a
// truthy value through `util.date.datetime2ifc` for date/time-like ("Date"/"Time"
// substring in the attribute name) or duration-like (exact `"Duration"`/`"TotalFloat"`
// name) attributes before writing it -- structurally identical to `./editWorkSchedule.ts`
// (the two real Python source files are themselves near-identical for the same reason:
// `IfcWorkPlan`/`IfcWorkSchedule` are sibling `IfcWorkControl` subtypes with the same
// date/duration-typed attribute shape). `util.date.datetime2ifc` (already landed) is the
// only real dependency -- confirmed by reading the whole real file.
//
// --- REAL, CONFIRMED SCHEMA-MISMATCH in real Python on IFC2X3: `Duration`/`TotalFloat`
//     are typed `IfcTimeMeasure` (a real NUMBER) on IFC2X3, not `IfcDuration` (a
//     STRING) -- but this port does NOT reproduce Python's own resulting throw ---
//
// Confirmed directly against the generated schemas: `IfcWorkPlan.Duration`/`.TotalFloat`
// are `string | null` (`IfcDuration`) on IFC4/IFC4X3, but plain `number | null`
// (`IfcTimeMeasure`) on IFC2X3 (`src/generated/ifc2x3.d.ts`). This function's own
// `elif name == "Duration" or name == "TotalFloat": value = datetime2ifc(value,
// "IfcDuration")` branch has NO schema check at all -- it always converts to an ISO 8601
// duration STRING (e.g. `"P1D"`), then writes that string into what is, on IFC2X3, a
// numeric-typed attribute. Real Python's own SWIG binding rejects this type mismatch at
// the point of assignment (a real, confirmed upstream bug: missing schema-aware
// branching for these two attributes specifically).
//
// **This port's own `EntityInstance.set` does NOT do the same** -- verified empirically
// (a disposable trace script against this worktree's own built native addon, not
// assumed by symmetry with real Python): `.set()` performs NO declared-attribute-type
// validation at all, for ANY attribute kind (entity-select-typed or plain-measure-typed
// alike -- also independently reconfirmed via `IfcWorkPlan.CreationDate` on IFC2X3,
// which is a real union-of-entities attribute there, yet silently accepts a plain
// string too). So calling `editWorkPlan(file, { workPlan, attributes: { Duration:
// someTruthyValue } })` against an IFC2X3 file does NOT throw in this port -- it
// silently writes the wrongly-typed ISO-8601 duration STRING into the numeric-declared
// attribute instead, a DIFFERENT (and arguably worse) divergence from real Python than
// "the same bug reproduced". See `TODOS.md`'s own dedicated entry ("This port's
// `EntityInstance.set()` performs no declared-attribute-type validation, unlike real
// Python's SWIG binding") for the full, general writeup -- this is one confirmed
// instance of that broader, previously-undocumented primitive-layer gap, not a
// self-contained bug in this file. Ported/tested as the real, verified silent-write
// behavior, not the Python-parity throw an earlier, unverified pass of this file
// assumed. `Name`/`Description`/`Purpose`/etc. (plain string attributes, no date/
// duration conversion) are unaffected either way and work identically across all 3
// schemas.
//
// `IfcWorkPlan` itself (unlike `IfcWorkCalendar`/`IfcTaskTime`/`IfcWorkTime`) exists on
// all 3 schemas -- see `./index.ts`'s own chunk 1 header-comment finding.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type Datetime2IfcInput, datetime2ifc } from "../../util/date";
import { wrapUsecase } from "../hooks";

export interface EditWorkPlanSettings {
	/** The `IfcWorkPlan` entity you want to edit. */
	workPlan: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editWorkPlanUsecase(_file: IfcFile, settings: EditWorkPlanSettings): void {
	for (const [name, rawValue] of Object.entries(settings.attributes)) {
		let value = rawValue;
		if (value) {
			if (name.includes("Date") || name.includes("Time")) {
				value = datetime2ifc(value as Datetime2IfcInput, "IfcDateTime");
			} else if (name === "Duration" || name === "TotalFloat") {
				// See this file's header comment: no IFC2X3 guard here, matching real
				// Python's own missing branching -- but unlike real Python, this port's
				// `.set()` doesn't validate the declared type, so this silently writes a
				// string into IFC2X3's numeric `Duration`/`TotalFloat` rather than
				// throwing.
				value = datetime2ifc(value as Datetime2IfcInput, "IfcDuration");
			}
		}
		settings.workPlan.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcWorkPlan` (Python:
 * `ifcopenshell.api.sequence.edit_work_plan`).
 *
 * For more information about the attributes and data types of an `IfcWorkPlan`, consult
 * the IFC documentation.
 *
 * See this file's header comment for a real, confirmed Python bug: editing `Duration`/
 * `TotalFloat` with a truthy value always throws on IFC2X3 (a schema type mismatch --
 * `IfcTimeMeasure`/number there, vs. `IfcDuration`/string on IFC4+).
 *
 * @example
 * ```ts
 * const workPlan = api.sequence.addWorkPlan(model, { name: "Construction" });
 * api.sequence.editWorkPlan(model, { workPlan, attributes: { Description: "Construction of phase 1" } });
 * ```
 */
export const editWorkPlan = wrapUsecase("sequence.edit_work_plan", editWorkPlanUsecase);
