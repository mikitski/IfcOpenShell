// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/assign_work_plan.py` (src/ifcopenshell-python, 64
// lines) -- part of `api.sequence` chunk 2 (see `./index.ts`'s own header comment for
// this chunk's full scope). Assigns `workSchedule` to `workPlan` via aggregation
// (`api.aggregate.assignObject`), first un-declaring the schedule from the project's
// `IfcContext` (the same buildingSMART-ambiguity workaround `./addWorkSchedule.ts`'s own
// `workPlan`-vs-`IfcContext`-declaration branch already documents).
//
// --- REAL, CONFIRMED PYTHON BUG: no `file.schema != "IFC2X3"` guard at all -- unlike
//     every sibling `add_work_plan`/`add_work_schedule` ---
//
// Read closely: this function's very first line unconditionally calls
// `file.by_type("IfcContext")[0]` as the `relating_context` argument to
// `unassign_declaration` -- with NO schema check beforehand. `./addWorkPlan.ts`/
// `./addWorkSchedule.ts` both guard their own analogous `file.by_type("IfcContext")`
// call behind `if file.schema != "IFC2X3":` (see those files' own header comments) --
// this sibling function has no such guard. Since IFC2X3 has no `IfcContext` class AT
// ALL (confirmed against `src/generated/ifc2x3.d.ts`, zero matches), calling
// `assignWorkPlan` against an IFC2X3 file ALWAYS throws ("Entity with name 'IfcContext'
// not found in schema 'IFC2X3'"), unconditionally, regardless of `workSchedule`/
// `workPlan`'s own state -- a real, confirmed asymmetry vs. its own sibling `add_*`
// functions, ported verbatim (not "fixed" by adding a guard real Python doesn't have).
// `./removeWorkPlan.ts` has the exact same confirmed gap -- see that file's own header
// comment.
//
// --- `api.project.unassignDeclaration`'s own disclosed `relatingContext`-is-unused
//     quirk applies here too, but is moot given the bug above ---
//
// Even setting the IFC2X3 crash aside: `unassignDeclaration`'s own real Python quirk
// (`relatingContext` is accepted but never actually consulted by its own logic -- see
// `../project/unassignDeclaration.ts`'s own header comment) means the `IfcContext`
// looked up here has no effect on which declaration actually gets removed anyway
// (`workSchedule` is un-declared from whatever context it is CURRENTLY declared under,
// not specifically this project's `IfcContext`) -- moot in practice, since a
// newly-created `IfcWorkSchedule` (via `./addWorkSchedule.ts`) is only ever declared
// against the one real `IfcContext` a well-formed model has anyway.
//
// `api.aggregate.assignObject`/`api.project.unassignDeclaration` (both already landed,
// verified directly against their own TS source) are the only real dependencies --
// confirmed by reading the whole real file.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { assignObject } from "../aggregate/assignObject";
import { wrapUsecase } from "../hooks";
import { unassignDeclaration } from "../project/unassignDeclaration";

export interface AssignWorkPlanSettings {
	/** The `IfcWorkSchedule` that will be assigned to the work plan. */
	workSchedule: EntityInstance;
	/** The `IfcWorkPlan` for the schedule to be assigned to. */
	workPlan: EntityInstance;
}

function assignWorkPlanUsecase(file: IfcFile, settings: AssignWorkPlanSettings): EntityInstance | undefined {
	const { workSchedule, workPlan } = settings;

	// See this file's header comment: no IFC2X3 guard here, matching real Python -- this
	// throws unconditionally on IFC2X3 (`file.byType("IfcContext")` itself raises, since
	// IFC2X3 has no `IfcContext` class at all).
	unassignDeclaration(file, {
		definitions: [workSchedule],
		relatingContext: file.byType("IfcContext")[0],
	});
	return assignObject(file, { products: [workSchedule], relatingObject: workPlan });
}

/**
 * Assigns a work schedule to a work plan (Python: `ifcopenshell.api.sequence.assign_work_plan`).
 *
 * Typically, work schedules would be assigned to a work plan at creation. However you
 * may also delay this and do it manually afterwards.
 *
 * See this file's header comment for a real, confirmed Python bug: unlike
 * `api.sequence.addWorkPlan`/`addWorkSchedule`, this function has NO `IFC2X3` guard at
 * all, so it always throws when called against an IFC2X3 file.
 *
 * @returns The `IfcRelAggregates` relationship.
 *
 * @example
 * ```ts
 * // This will hold all our construction schedules.
 * const workPlan = api.sequence.addWorkPlan(model, { name: "Construction" });
 *
 * // Alternatively, if you create a schedule without a work plan ...
 * const schedule = api.sequence.addWorkSchedule(model, { name: "Construction Schedule A" });
 *
 * // ... you can assign the work plan afterwards.
 * api.sequence.assignWorkPlan(model, { workSchedule: schedule, workPlan });
 * ```
 */
export const assignWorkPlan = wrapUsecase("sequence.assign_work_plan", assignWorkPlanUsecase);
