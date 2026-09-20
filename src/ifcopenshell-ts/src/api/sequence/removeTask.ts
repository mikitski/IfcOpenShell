// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/remove_task.py` (src/ifcopenshell-python, 136
// lines) -- part of `api.sequence` chunk 3 (see `./index.ts`'s own header comment for
// this chunk's full scope). Removes a task, recursively removing every subtask
// (`IsNestedBy`), and cleans up every relationship that referenced it: sequences,
// controls (work schedules/cost items), psets, and ICOM Input/Output/generic object
// assignments.
//
// Self-recursive (line 74 of the real file: `remove_task` calls itself for every
// subtask) -- ported through the real, exported, listener-wrapped `removeTask` on the
// recursive call, matching `../root/removeProduct.ts`'s own established precedent for a
// self-recursive real Python `Usecase`.
//
// `api.project.unassignDeclaration`, `api.nest.unassignObject`, `api.pset.removePset`,
// `util.element.removeDeep2` (all already landed) and `./unassignRecurrencePattern.ts`
// (already landed, chunk 2) are the only real dependencies -- confirmed by reading the
// whole real file.
//
// --- REAL, CONFIRMED PYTHON BUG: a duplicated, UNREACHABLE `elif inverse.is_a
//     ("IfcRelAssignsToProcess")` branch -- ported verbatim, not deduplicated ---
//
// Read closely: the real `if`/`elif` chain over `file.get_inverse(task)` has TWO
// separate `elif inverse.is_a("IfcRelAssignsToProcess"):` branches -- one partway
// through the chain (shrink-or-delete, matching the `IfcRelAssignsToProduct`/
// `IfcRelAssignsToObject` branches' own shape) and a SECOND one as the very last `elif`
// (unconditional delete, no shrink option at all). Since Python's `elif` chain checks
// top to bottom and `is_a("IfcRelAssignsToProcess")` can never be true for the first
// branch's check but false for the second's, the second branch is PROVABLY DEAD CODE --
// it can never execute for any `inverse`, ever. This is a genuine, confirmed real
// Python source bug (almost certainly a copy-paste leftover), not a hypothetical --
// ported verbatim below as a structurally identical dead `else if`, not removed or
// "fixed" by merging/deleting it, matching this project's "preserve real bugs verbatim,
// disclose rather than silently fix" discipline.
//
// --- The shrink-vs-delete asymmetry across the 4 `IfcRelAssigns*` branches, ported
//     verbatim ---
//
// `IfcRelAssignsToControl`/`IfcRelAssignsToProduct`/`IfcRelAssignsToObject` all shrink
// `RelatedObjects` (dropping just `task`) when other objects remain assigned via the
// same rel, deleting the rel entirely only when `task` was the sole related object (OR,
// for `IfcRelAssignsToControl` specifically, when `task` is itself the RELATING
// control -- a genuinely different condition from its 2 siblings, which check
// `RelatingProduct`/`RelatingObject` instead). `IfcRelAssignsToProcess` (the FIRST,
// reachable branch) instead ALWAYS deletes the rel outright once its own condition
// matches (`RelatingProcess == task or len(RelatedObjects) == 1`) -- it never shrinks
// `RelatedObjects`, even when other objects remain assigned and `task` isn't the
// relating process. Ported verbatim: no shrink branch added for
// `IfcRelAssignsToProcess`, matching real Python's own asymmetric structure exactly.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { removeDeep2 } from "../../util/element";
import { wrapUsecase } from "../hooks";
import { unassignObject } from "../nest/unassignObject";
import { unassignDeclaration } from "../project/unassignDeclaration";
import { removePset } from "../pset/removePset";
import { unassignRecurrencePattern } from "./unassignRecurrencePattern";

export interface RemoveTaskSettings {
	/** The `IfcTask` to remove. */
	task: EntityInstance;
}

function removeTaskUsecase(file: IfcFile, settings: RemoveTaskSettings): void {
	const { task } = settings;

	// TODO: do a deep purge (Python's own inline TODO, ported verbatim).
	unassignDeclaration(file, {
		definitions: [task],
		relatingContext: file.byType("IfcContext")[0],
	});

	const taskTime = task.get("TaskTime") as EntityInstance | null;
	if (taskTime) {
		if (taskTime.isA("IfcTaskTimeRecurring")) {
			unassignRecurrencePattern(file, {
				recurrencePattern: taskTime.get("Recurrence") as EntityInstance,
			});
		}
		file.remove(taskTime);
	}

	// Handle IfcRelNests.
	const isNestedBy = task.get("IsNestedBy") as EntityInstance[] | null;
	if (isNestedBy && isNestedBy.length > 0) {
		const subtasks = isNestedBy[0].get("RelatedObjects") as EntityInstance[];
		// Use batching for optimization.
		unassignObject(file, { relatedObjects: subtasks });
		for (const subtask of subtasks) {
			removeTask(file, { task: subtask });
		}
	}
	if (task.get("Nests")) {
		unassignObject(file, { relatedObjects: [task] });
	}

	for (const inverse of file.getInverse(task) as Set<EntityInstance>) {
		if (inverse.isA("IfcRelSequence")) {
			const history = inverse.get("OwnerHistory") as EntityInstance | null;
			file.remove(inverse);
			if (history) removeDeep2(file, history);
		} else if (inverse.isA("IfcRelAssignsToControl")) {
			const relatedObjects = inverse.get("RelatedObjects") as EntityInstance[];
			if ((inverse.get("RelatingControl") as EntityInstance).equals(task) || relatedObjects.length === 1) {
				const history = inverse.get("OwnerHistory") as EntityInstance | null;
				file.remove(inverse);
				if (history) removeDeep2(file, history);
			} else {
				inverse.set(
					"RelatedObjects",
					relatedObjects.filter((o) => !o.equals(task)),
				);
			}
		} else if (inverse.isA("IfcRelDefinesByProperties")) {
			removePset(file, {
				product: task,
				pset: inverse.get("RelatingPropertyDefinition") as EntityInstance,
			});
		} else if (inverse.isA("IfcRelAssignsToProcess")) {
			const relatedObjects = inverse.get("RelatedObjects") as EntityInstance[];
			if ((inverse.get("RelatingProcess") as EntityInstance).equals(task) || relatedObjects.length === 1) {
				const history = inverse.get("OwnerHistory") as EntityInstance | null;
				file.remove(inverse);
				if (history) removeDeep2(file, history);
			}
		} else if (inverse.isA("IfcRelAssignsToProduct")) {
			const relatedObjects = inverse.get("RelatedObjects") as EntityInstance[];
			if ((inverse.get("RelatingProduct") as EntityInstance).equals(task) || relatedObjects.length === 1) {
				const history = inverse.get("OwnerHistory") as EntityInstance | null;
				file.remove(inverse);
				if (history) removeDeep2(file, history);
			} else {
				inverse.set(
					"RelatedObjects",
					relatedObjects.filter((o) => !o.equals(task)),
				);
			}
		} else if (inverse.isA("IfcRelAssignsToObject")) {
			const relatedObjects = inverse.get("RelatedObjects") as EntityInstance[];
			if ((inverse.get("RelatingObject") as EntityInstance).equals(task) || relatedObjects.length === 1) {
				const history = inverse.get("OwnerHistory") as EntityInstance | null;
				file.remove(inverse);
				if (history) removeDeep2(file, history);
			} else {
				inverse.set(
					"RelatedObjects",
					relatedObjects.filter((o) => !o.equals(task)),
				);
			}
			// NOTE: the next branch's condition (`IfcRelAssignsToProcess`) duplicates an
			// earlier branch's own condition in this same `if`/`else if` chain -- see this
			// file's header comment: a genuine, confirmed real Python source bug (a
			// duplicated, PROVABLY UNREACHABLE branch, since `IfcRelAssignsToProcess` was
			// already handled above), preserved verbatim rather than silently deduplicated.
		} else if (inverse.isA("IfcRelAssignsToProcess")) {
			const history = inverse.get("OwnerHistory") as EntityInstance | null;
			file.remove(inverse);
			if (history) removeDeep2(file, history);
		}
	}

	const history = task.get("OwnerHistory") as EntityInstance | null;
	file.remove(task);
	if (history) removeDeep2(file, history);
}

/**
 * Removes a task (Python: `ifcopenshell.api.sequence.remove_task`).
 *
 * All subtasks are also removed recursively. Any relationships such as sequences or
 * controls are also removed.
 *
 * See this file's header comment for a real, confirmed Python source bug: a duplicated,
 * provably unreachable `IfcRelAssignsToProcess` branch, preserved verbatim.
 *
 * @example
 * ```ts
 * const schedule = api.sequence.addWorkSchedule(model, { name: "Construction Schedule A" });
 * api.sequence.addTask(model, { workSchedule: schedule, name: "Milestones", identification: "A" });
 * const design = api.sequence.addTask(model, { workSchedule: schedule, name: "Design", identification: "B" });
 * api.sequence.addTask(model, { workSchedule: schedule, name: "Construction", identification: "C" });
 * api.sequence.removeTask(model, { task: design });
 * ```
 */
export const removeTask = wrapUsecase("sequence.remove_task", removeTaskUsecase);
