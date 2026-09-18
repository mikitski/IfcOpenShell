// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/add_task.py` (src/ifcopenshell-python, 152 lines) --
// part of `api.sequence` chunk 1 (see `./index.ts`'s own header comment for this chunk's
// full scope). Creates a new `IfcTask`, nesting it under a `workSchedule` (as a root/
// top-level task, via `api.control.assignControl`) OR a `parentTask` (as a subtask, via
// `api.nest.assignObject`) -- mutually exclusive, matching real Python exactly (`if
// work_schedule: ... elif parent_task: ...`, `work_schedule` always wins if both are
// given).
//
// --- REAL, CONFIRMED PYTHON BUG: `identification` is set with NO IFC2X3 guard, but
//     `IfcTask` has no `Identification` attribute on IFC2X3 at all ---
//
// Confirmed directly against the generated `.d.ts`s: IFC2X3's `IfcTask` has `TaskId`
// (mandatory, non-nullable) where IFC4+'s has `Identification` (nullable) instead -- two
// different attributes, not a rename. Real Python's `if identification: task.Identification
// = identification` (line 138-139) has NO `file.schema != "IFC2X3"` guard at all, unlike
// the auto-numbering step further down (which DOES guard with exactly that check, see
// below) -- so calling this function with a truthy `identification` on an IFC2X3 file
// raises (a Python `AttributeError`-shaped exception from `entity_instance.__setattr__`;
// this port's own `EntityInstance.set()` throws the equivalent `"...has no attribute
// 'Identification'"` error). Ported verbatim: `task.set("Identification", ...)` below is
// NOT guarded by a schema check, exactly matching real Python's own unguarded call.
//
// --- The auto-identification-numbering step IS correctly schema-guarded ---
//
// `if file.schema != "IFC2X3" and parent_task.Identification:` -- Python's `and` short-
// circuits before ever reading `parent_task.Identification` when the schema check already
// failed, so this branch never touches the IFC2X3-absent attribute at all. Ported as two
// separate `if`s below (TS has no single-expression short-circuit-into-a-guard-clause
// idiom as clean as Python's `and`-as-guard here), preserving the same short-circuit
// order and therefore the same "never reads `Identification` on IFC2X3" safety.
//
// --- `predefinedType`'s IFC2X3 fallback: NOT a new bug, `root.createEntity`'s own
//     already-verified `PredefinedType`-absent fallback applies ---
//
// IFC2X3's `IfcTask` also has no `PredefinedType` attribute at all (confirmed against the
// generated `.d.ts`, alongside no `TaskTime` either). `root.create_entity`'s own already-
// landed `hasAttribute`-gated fallback (`../root/createEntity.ts`'s own header comment)
// means the default `predefinedType: "NOTDEFINED"` ends up written to `IfcTask.ObjectType`
// instead on IFC2X3 -- this is `createEntity`'s own pre-existing, already-disclosed
// behavior, not something new introduced by this file.
//
// --- The bare `assert rel`, ported as a thrown `Error` ---
//
// Real Python's `assert rel` (line 150, right before reading `rel.RelatedObjects`) can
// never actually fail via this function's own call shape (`nest.assign_object`'s
// `relatedObjects` is always the freshly-created, non-empty `[task]`, so it always
// returns a real relationship, never `undefined`) -- ported as a descriptive thrown
// `Error`, the direct TS equivalent of an uncaught Python `AssertionError`, matching this
// project's established "thrown Error, direct equivalent of an uncaught AssertionError"
// precedent (e.g. `api.alignment._createGeometricRepresentation.ts`'s own header comment).
//
// `api.control.assignControl`/`api.nest.assignObject`/`api.root.createEntity` (all
// already landed, verified directly against their own TS source) are the only real
// dependencies -- confirmed by reading the whole real file, including its own docstring
// example.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { assignControl } from "../control/assignControl";
import { wrapUsecase } from "../hooks";
import { assignObject } from "../nest/assignObject";
import { createEntity } from "../root/createEntity";

export interface AddTaskSettings {
	/**
	 * The work schedule to group the task in, if the task is to be a top-level or root
	 * task. This is mutually exclusive with `parentTask` -- if both are given,
	 * `workSchedule` wins, matching real Python's own `if`/`elif` exactly.
	 */
	workSchedule?: EntityInstance | null;
	/** The parent task, if the task is to be a subtask or child task. Mutually exclusive with `workSchedule` (see above). */
	parentTask?: EntityInstance | null;
	/** The name of the task. */
	name?: string | null;
	/** The description of the task. */
	description?: string | null;
	/**
	 * The identification code of the task. See this file's header comment: setting this
	 * on an IFC2X3 file throws (a confirmed, unguarded real Python bug, ported verbatim).
	 */
	identification?: string | null;
	/**
	 * The predefined type of the task. Common ones include CONSTRUCTION, DEMOLITION, or
	 * MAINTENANCE.
	 */
	predefinedType?: string;
}

function addTaskUsecase(file: IfcFile, settings: AddTaskSettings = {}): EntityInstance {
	const predefinedType = settings.predefinedType ?? "NOTDEFINED";
	const task = createEntity(file, { ifcClass: "IfcTask", name: settings.name ?? null, predefinedType });

	if (settings.description) {
		task.set("Description", settings.description);
	}
	if (settings.identification) {
		// See this file's header comment: unguarded on IFC2X3 -- `IfcTask` has no
		// `Identification` attribute there (it has `TaskId` instead), so this throws on
		// IFC2X3 whenever a caller passes `identification`, exactly matching real
		// Python's own unguarded `task.Identification = identification`.
		task.set("Identification", settings.identification);
	}
	task.set("IsMilestone", false);

	if (settings.workSchedule) {
		assignControl(file, { relatingControl: settings.workSchedule, relatedObjects: [task] });
	} else if (settings.parentTask) {
		const rel = assignObject(file, { relatedObjects: [task], relatingObject: settings.parentTask });
		// Python: `if file.schema != "IFC2X3" and parent_task.Identification:` -- see this
		// file's header comment for why this two-step form preserves the same short-
		// circuit (never reading the IFC2X3-absent `Identification` attribute on IFC2X3).
		if (file.schema !== "IFC2X3") {
			const parentIdentification = settings.parentTask.get("Identification");
			if (parentIdentification) {
				if (!rel) {
					// Python: `assert rel` -- see this file's header comment for why this can
					// never actually happen via this function's own call shape.
					throw new Error(
						"assert failed: nest.assignObject should have returned a relationship for a non-empty relatedObjects list",
					);
				}
				const relatedObjectsCount = (rel.get("RelatedObjects") as EntityInstance[]).length;
				task.set("Identification", `${parentIdentification}.${relatedObjectsCount}`);
			}
		}
	}
	return task;
}

/**
 * Adds a new task (Python: `ifcopenshell.api.sequence.add_task`).
 *
 * Tasks are typically used for two purposes: construction scheduling and facility
 * management.
 *
 * In construction scheduling, a task represents a job to be done in a work schedule.
 * Tasks are organised in a hierarchical manner known as a work breakdown structure (WBS)
 * and have lots of sequential relationships (e.g. this task must finish before the next
 * task can start) and date information (e.g. durations, start dates).
 *
 * In facility management, a task represents a maintenance task to maintain a piece of
 * equipment. Tasks are broken down into a punch list of tasks to be performed in order to
 * maintain the equipment.
 *
 * All tasks must be grouped in a work schedule, either directly as a root or top-level
 * task, or indirectly as a child or subtask of a parent task.
 *
 * @returns The newly created `IfcTask`.
 *
 * @example
 * ```ts
 * const schedule = api.sequence.addWorkSchedule(model, { name: "Construction Schedule A" });
 * const construction = api.sequence.addTask(model, {
 *   workSchedule: schedule, name: "Construction", identification: "C",
 * });
 * api.sequence.addTask(model, { parentTask: construction, name: "Early Works", identification: "C1" });
 * ```
 */
export const addTask = wrapUsecase("sequence.add_task", addTaskUsecase);
