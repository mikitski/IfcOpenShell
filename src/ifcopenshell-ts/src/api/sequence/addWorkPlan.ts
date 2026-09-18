// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/add_work_plan.py` (src/ifcopenshell-python, 82
// lines) -- part of `api.sequence` chunk 1 (see `./index.ts`'s own header comment for
// this chunk's full scope). Creates a new `IfcWorkPlan` (a group of related work
// schedules), stamps its creation date/creator/start time, and declares it against the
// project's `IfcContext` (IFC4+ only).
//
// --- REAL, CONFIRMED PYTHON BUG: the `start_time` parameter is silently ignored ---
//
// Read closely, not assumed: line 62 of the real source computes `start_time = start_time
// or datetime.now()` -- a completely dead local variable. Every later use of "the current
// time" in this function (`work_plan.CreationDate = ...add_date_time(file,
// datetime.now())` at line 69, AND `work_plan.StartTime = ...add_date_time(file,
// datetime.now())` at line 73) calls `datetime.now()` directly, NEVER the `start_time`
// variable computed above. So a caller-supplied `start_time` has ZERO effect on the
// returned `IfcWorkPlan` -- `StartTime` is always "now" regardless.
//
// This is confirmed to be a genuine copy-paste-divergence bug by comparing against the
// very next, near-identical sibling function: `add_work_schedule.py`'s own analogous line
// (`work_schedule.StartTime = ...add_date_time(file, start_time)`) DOES correctly use its
// own `start_time` variable -- see `./addWorkSchedule.ts`'s own header comment. Ported
// verbatim here (not "fixed" to match `add_work_schedule`'s own correct behavior):
// `AddWorkPlanSettings.startTime` is accepted (for signature parity with real Python,
// which likewise accepts but ignores it) and simply never read by this file's own usecase
// body -- there is no dead local variable to reproduce in TS (no observable side effect
// to preserve), just the accepted-but-ignored setting itself.
//
// --- `api.sequence.addDateTime`'s own `dt: Date` narrower contract applies here too ---
//
// Real Python's own type hint for `start_time` (`Optional[Union[str, time]]`) is itself
// already inaccurate for what `add_date_time` actually requires (a `datetime.datetime`) --
// moot here anyway, since the bug above means `start_time` is never actually passed to
// `add_date_time` at all.
//
// `api.root.createEntity`/`api.owner.settings.ownerSettings.getUser`/`api.project.
// assignDeclaration`/`./addDateTime.ts` (all already landed, verified directly against
// their own TS source) are the only real dependencies -- confirmed by reading the whole
// real file.
//
// --- Why the `file.schema != "IFC2X3"` guard is load-bearing, beyond the docstring's own
//     "buildingSMART ambiguity" framing ---
//
// Confirmed empirically (and against `src/generated/ifc2x3.d.ts`, zero matches): IFC2X3
// has no `IfcContext` class AT ALL (superseded by `IfcProject` directly in that schema),
// so `file.by_type("IfcContext")` itself would raise on IFC2X3 even setting the
// buildingSMART-ambiguity question aside entirely -- the guard is doing double duty,
// not just resolving a semantic ambiguity as its own inline `# TODO` comment implies.
// `IfcWorkPlan.PredefinedType` is also IFC4+-only (IFC2X3 has `WorkControlType`/
// `UserDefinedControlType` instead) -- moot for THIS file directly (it never reads/writes
// `PredefinedType` by name, only via `root.createEntity`'s own already-verified
// `ObjectType` fallback), but disclosed here since `test/api/sequence/
// addWorkPlan.test.ts`'s own IFC2X3 assertions depend on knowing this.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { ownerSettings } from "../owner/settings";
import { assignDeclaration } from "../project/assignDeclaration";
import { createEntity } from "../root/createEntity";
import { addDateTime } from "./addDateTime";

export interface AddWorkPlanSettings {
	/** The name of the work plan. Recommended to be "Maintenance" or "Construction" for the two main purposes. */
	name?: string | null;
	/** The type of work plan, used for baselining. Leave as "NOTDEFINED" if unsure. */
	predefinedType?: string;
	/**
	 * The earliest start time when the schedules grouped within the work plan are
	 * relevant. See this file's header comment: a confirmed real Python bug means this
	 * setting has NO effect at all -- `StartTime` is always set to "now", never this
	 * value. Kept here purely for signature parity with real Python's own (equally
	 * ineffective) `start_time` parameter.
	 */
	startTime?: Date;
}

function addWorkPlanUsecase(file: IfcFile, settings: AddWorkPlanSettings = {}): EntityInstance {
	const name = settings.name ?? null;
	const predefinedType = settings.predefinedType ?? "NOTDEFINED";

	const workPlan = createEntity(file, { ifcClass: "IfcWorkPlan", predefinedType, name });
	workPlan.set("CreationDate", addDateTime(file, { dt: new Date() }));
	const user = ownerSettings.getUser(file);
	if (user) {
		workPlan.set("Creators", [user.get("ThePerson")]);
	}
	// See this file's header comment: real Python's own equivalent line reads
	// `datetime.now()` here too, NOT the `start_time` parameter -- `settings.startTime`
	// is intentionally never read in this function body, matching that confirmed bug.
	workPlan.set("StartTime", addDateTime(file, { dt: new Date() }));

	if (file.schema !== "IFC2X3") {
		// TODO: this is an ambiguity by buildingSMART -- see
		// https://forums.buildingsmart.org/t/is-the-ifcworkschedule-project-declaration-mutually-exclusive-to-aggregation-within-a-relating-ifcworkplan/3510
		const context = file.byType("IfcContext")[0];
		assignDeclaration(file, { definitions: [workPlan], relatingContext: context });
	}
	return workPlan;
}

/**
 * Add a new work plan (Python: `ifcopenshell.api.sequence.add_work_plan`).
 *
 * A work plan is a group of work schedules. Since work schedules may have different
 * purposes, such as for maintenance or construction scheduling, baseline comparison, or
 * phasing, work plans can be used to group related work schedules. At a minimum, it is
 * recommended to use work plans to indicate whether the work schedules are for facility
 * management or for construction scheduling.
 *
 * See this file's header comment: `startTime` is accepted but has no effect (a confirmed
 * real Python bug, ported verbatim).
 *
 * @returns The newly created `IfcWorkPlan`.
 *
 * @example
 * ```ts
 * // This will hold all our construction schedules.
 * const workPlan = api.sequence.addWorkPlan(model, { name: "Construction" });
 * ```
 */
export const addWorkPlan = wrapUsecase("sequence.add_work_plan", addWorkPlanUsecase);
