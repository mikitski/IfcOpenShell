// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/copy_work_schedule.py` (src/ifcopenshell-python, 51
// lines). Third of this module's FINAL chunk (see `./index.ts`'s own header comment for
// the full module history) -- ported after `duplicateTask` (a real dependency, this
// chunk's own line 47).
//
// Real dependencies (confirmed by reading the whole real file): `util.element.copy`
// (already landed), this SAME module's own `./duplicateTask.ts` (this chunk), and
// already-landed `api.control.assignControl`.
//
// --- Only the FIRST element of `duplicateTask`'s own returned `duplicate` array is
//     used -- ported verbatim, not a bug ---
//
// `duplicate_tasks = ifcopenshell.api.sequence.duplicate_task(file, task)[1]` then
// `duplicated_task = duplicated_tasks[0]` -- only the direct duplicate of the top-level
// controlled `task` itself is re-connected to `new_schedule` via `assign_control` below.
// Real Python's own comment explains why: "All other nested items are not connected to
// the work schedule explicitly" -- `duplicateTask`'s own internal nest-reassignment
// (`copyIndirectAttributes`'s `IfcRelNests` branch) already re-parents every nested
// subtask's duplicate under its own parent duplicate, so only the ROOT of each
// controlled subtree needs an explicit `IfcRelAssignsToControl` back to the new
// schedule -- not a bug, ported exactly.
//
// Schema availability: `Controls`/`IfcRelAssignsToControl`/`IfcTask` all exist on IFC2X3
// (confirmed against `ifc2x3.d.ts`), and this file itself has no schema-specific
// branching -- exercised across all 3 schemas by the real Python test (ported below),
// matching that test's own `TestCopyWorkScheduleIFC2X3`/`TestCopyWorkScheduleIFC4X3`
// subclasses.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { assignControl } from "../control/assignControl";
import { wrapUsecase } from "../hooks";
import { duplicateTask } from "./duplicateTask";

export interface CopyWorkScheduleSettings {
	/** The `IfcWorkSchedule` to copy. */
	workSchedule: EntityInstance;
}

function copyWorkScheduleUsecase(file: IfcFile, settings: CopyWorkScheduleSettings): EntityInstance {
	// Shared code logic with copyCostSchedule.
	const newSchedule = elementUtil.copy(file, settings.workSchedule);

	for (const rel of settings.workSchedule.get("Controls") as EntityInstance[]) {
		for (const task of rel.get("RelatedObjects") as EntityInstance[]) {
			const duplicatedTasks = duplicateTask(file, { task })[1];
			// All other nested items are not connected to the work schedule explicitly.
			const duplicatedTask = duplicatedTasks[0];
			assignControl(file, { relatingControl: newSchedule, relatedObjects: [duplicatedTask] });
		}
	}
	return newSchedule;
}

/**
 * Copies a work schedule (Python: `ifcopenshell.api.sequence.copy_work_schedule`).
 *
 * @returns The duplicated `IfcWorkSchedule` entity.
 *
 * @example
 * ```ts
 * const workPlan = api.sequence.addWorkPlan(model, { name: "Construction" });
 * const schedule = api.sequence.addWorkSchedule(model, { name: "Construction Schedule A", workPlan });
 * const newSchedule = api.sequence.copyWorkSchedule(model, { workSchedule: schedule });
 * ```
 */
export const copyWorkSchedule = wrapUsecase("sequence.copy_work_schedule", copyWorkScheduleUsecase);
