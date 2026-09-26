// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/add_work_schedule.py` (src/ifcopenshell-python, 106
// lines) -- part of `api.sequence` chunk 1 (see `./index.ts`'s own header comment for
// this chunk's full scope). Creates a new `IfcWorkSchedule` (a group of tasks), stamps
// its creation date/creator/start time, optionally aggregates it under a `workPlan`, and
// otherwise (IFC4+ only) declares it against the project's `IfcContext`.
//
// --- `startTime` IS correctly used here, unlike `add_work_plan`'s own dead parameter ---
//
// Unlike `./addWorkPlan.ts`'s own confirmed dead-parameter bug (see that file's header
// comment), THIS sibling function's analogous line (`work_schedule.StartTime =
// ...add_date_time(file, start_time)`) correctly reads its own `start_time` variable --
// confirmed by reading both real files side by side. `CreationDate` still always uses
// `datetime.now()` directly (never `start_time`), matching real Python exactly -- that
// part is intentional and correct in both sibling functions (a work schedule's creation
// date and its planned start time are two different, independently meaningful concepts).
//
// This port's own `startTime` setting is typed `Date` (not `string`), matching
// `./addDateTime.ts`'s own already-established narrower contract (that file's header
// comment: it takes a plain JS `Date`, the natural "current wall clock time" type, not a
// round-tripped ISO string) -- real Python's own type hint (`Optional[Union[str, time]]`)
// is itself already inaccurate for what `add_date_time` actually requires (a
// `datetime.datetime`), so there is no fidelity loss for the realistic, documented usage
// (passing a `datetime`/`Date` object); passing a raw ISO string, which real Python's own
// duck-typed `datetime2ifc` would incidentally still accept, is simply not supported here
// -- callers should construct a `Date` instead.
//
// `api.aggregate.assignObject`/`api.owner.settings.ownerSettings.getUser`/`api.project.
// assignDeclaration`/`api.root.createEntity`/`./addDateTime.ts` (all already landed,
// verified directly against their own TS source) are the only real dependencies --
// confirmed by reading the whole real file.
//
// --- Why the `file.schema != "IFC2X3"` guard is load-bearing, beyond the docstring's own
//     "buildingSMART ambiguity" framing (confirmed empirically, see `./addWorkPlan.ts`'s
//     own identical finding) ---
//
// IFC2X3 has no `IfcContext` class AT ALL (confirmed against `src/generated/ifc2x3.d.ts`,
// zero matches) -- `file.by_type("IfcContext")` itself would raise on IFC2X3 even setting
// the buildingSMART-ambiguity question aside entirely. `IfcWorkSchedule.PredefinedType`
// is likewise IFC4+-only (IFC2X3 has `WorkControlType`/`UserDefinedControlType` instead,
// same shape as `IfcWorkPlan`) -- moot for this file directly, but disclosed here since
// `test/api/sequence/addWorkSchedule.test.ts`'s own IFC2X3 assertions depend on it.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { assignObject } from "../aggregate/assignObject";
import { wrapUsecase } from "../hooks";
import { ownerSettings } from "../owner/settings";
import { assignDeclaration } from "../project/assignDeclaration";
import { createEntity } from "../root/createEntity";
import { addDateTime } from "./addDateTime";

export interface AddWorkScheduleSettings {
	/** The name of the work schedule. Python default: `"Unnamed"`. */
	name?: string;
	/**
	 * The type of schedule, chosen from ACTUAL, BASELINE, and PLANNED. Typically you
	 * would start with PLANNED, then convert to a BASELINE when changes are made with
	 * separate schedules, then have a parallel ACTUAL schedule.
	 */
	predefinedType?: string;
	/** Work schedule Object Type. Should be provided in case `predefinedType` is USERDEFINED. */
	objectType?: string | null;
	/**
	 * The earliest start time when the schedule is relevant. See this file's header
	 * comment for why this is typed `Date`, not `string`, matching `addDateTime`'s own
	 * established contract.
	 */
	startTime?: Date;
	/**
	 * The `IfcWorkPlan` the schedule will be part of. If not provided, the schedule will
	 * not be grouped in a work plan and would exist as a top level schedule in the
	 * project. This is not recommended.
	 */
	workPlan?: EntityInstance | null;
}

function addWorkScheduleUsecase(file: IfcFile, settings: AddWorkScheduleSettings = {}): EntityInstance {
	const name = settings.name ?? "Unnamed";
	const predefinedType = settings.predefinedType ?? "NOTDEFINED";
	const startTime = settings.startTime ?? new Date();

	const workSchedule = createEntity(file, { ifcClass: "IfcWorkSchedule", predefinedType, name });
	workSchedule.set("CreationDate", addDateTime(file, { dt: new Date() }));
	const user = ownerSettings.getUser(file);
	if (user) {
		workSchedule.set("Creators", [user.get("ThePerson")]);
	}
	workSchedule.set("StartTime", addDateTime(file, { dt: startTime }));
	if (settings.objectType) {
		workSchedule.set("ObjectType", settings.objectType);
	}

	if (settings.workPlan) {
		assignObject(file, { products: [workSchedule], relatingObject: settings.workPlan });
	} else if (file.schema !== "IFC2X3") {
		// TODO: this is an ambiguity by buildingSMART -- see
		// https://forums.buildingsmart.org/t/is-the-ifcworkschedule-project-declaration-mutually-exclusive-to-aggregation-within-a-relating-ifcworkplan/3510
		const context = file.byType("IfcContext")[0];
		assignDeclaration(file, { definitions: [workSchedule], relatingContext: context });
	}
	return workSchedule;
}

/**
 * Add a new work schedule (Python: `ifcopenshell.api.sequence.add_work_schedule`).
 *
 * A work schedule is a group of tasks, where the tasks are typically either for
 * maintenance or for construction scheduling.
 *
 * @returns The newly created `IfcWorkSchedule`.
 *
 * @example
 * ```ts
 * // This will hold all our construction schedules.
 * const workPlan = api.sequence.addWorkPlan(model, { name: "Construction" });
 *
 * // Let's imagine this is one of our schedules in our work plan.
 * const schedule = api.sequence.addWorkSchedule(model, { name: "Construction Schedule A", workPlan });
 * ```
 */
export const addWorkSchedule = wrapUsecase("sequence.add_work_schedule", addWorkScheduleUsecase);
