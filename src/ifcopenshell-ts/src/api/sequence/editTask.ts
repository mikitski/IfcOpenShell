// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/edit_task.py` (src/ifcopenshell-python, 50 lines)
// -- part of `api.sequence` chunk 2 (see `./index.ts`'s own header comment for this
// chunk's full scope). Trivial, unconditional attribute-setter loop over `attributes`,
// structurally identical to `../cost/editCostSchedule.ts`'s own pattern. No dependency
// of any kind -- confirmed by reading the whole real file (its only import is the bare
// `ifcopenshell` module).
//
// `IfcTask`'s attribute shape differs across schemas (IFC2X3: `TaskId`, no
// `Identification`/`PredefinedType`/`TaskTime`; IFC4+: `Identification`/
// `PredefinedType`/`TaskTime` instead of `TaskId` -- see `./addTask.ts`'s own header
// comment for the full comparison), but this function itself is fully generic
// (`setattr(task, name, value)` for whatever `attributes` the caller passes) -- no
// schema-specific behavior to disclose here beyond what `./addTask.ts` already covers;
// setting an attribute the current schema's `IfcTask` doesn't declare simply throws
// naturally, matching real Python's own unguarded `setattr`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditTaskSettings {
	/** The `IfcTask` entity you want to edit. */
	task: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editTaskUsecase(_file: IfcFile, settings: EditTaskSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.task.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcTask` (Python: `ifcopenshell.api.sequence.edit_task`).
 *
 * For more information about the attributes and data types of an `IfcTask`, consult the
 * IFC documentation.
 *
 * @example
 * ```ts
 * const schedule = api.sequence.addWorkSchedule(model, { name: "Construction Schedule A" });
 * const task = api.sequence.addTask(model, { workSchedule: schedule, name: "Milestones", identification: "A" });
 * api.sequence.editTask(model, { task, attributes: { Identification: "M" } });
 * ```
 */
export const editTask = wrapUsecase("sequence.edit_task", editTaskUsecase);
