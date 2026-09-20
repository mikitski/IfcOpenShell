// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/remove_work_schedule.py` (src/ifcopenshell-python,
// 84 lines) -- part of `api.sequence` chunk 3 (see `./index.ts`'s own header comment for
// this chunk's full scope). Removes a work schedule, recursively removing every nested
// work schedule it `Declares`, unassigning it from any aggregate it `Decomposes`
// (without removing the parent), removing every task it controls via `./removeTask.ts`
// (this chunk), and cleaning up `IfcRelDefinesByObject`.
//
// Self-recursive (line 56 of the real file: `remove_work_schedule` calls itself for
// every declared child schedule) -- ported through the real, exported, listener-wrapped
// `removeWorkSchedule` on the recursive call, matching `./removeTask.ts`'s own identical
// precedent. Also has a real (non-docstring) dependency on `./removeTask.ts`'s own
// function (line 75 of the real file) -- ported before this file within the chunk, per
// the chunk brief.
//
// `api.aggregate.unassignObject`, `api.project.unassignDeclaration`, `util.element.
// removeDeep2` (all already landed) and `./removeTask.ts` (this chunk) are the only real
// dependencies -- confirmed by reading the whole real file.
//
// --- "schedules that are grouped under the work plan are not removed", but a NESTED
//     work schedule's own `Declares` children ARE removed recursively -- two genuinely
//     different real behaviors for two different relationship kinds, ported verbatim ---
//
// `work_schedule.Decomposes` (the `IfcRelAggregates` linking this schedule to its own
// PARENT work plan, if any) is only ever UNASSIGNED, never removed or recursed into --
// matching `./removeWorkPlan.ts`'s own docstring ("schedules that are grouped under the
// work plan are not removed"). `work_schedule.Declares` (the `IfcRelDeclares` linking
// this schedule to any work schedules it itself declares as CHILDREN, a distinct,
// nestable relationship from the aggregation above) is instead recursively REMOVED in
// full via a self-call. These are two different relationship kinds serving two
// different real purposes -- ported verbatim, not conflated.
//
// --- `IfcRelAssignsToControl` cleanup calls `./removeTask.ts` for every controlled
//     `IfcTask`, with NO `OwnerHistory` deep-purge or rel-removal of its own -- ported
//     verbatim ---
//
// Unlike the `IfcRelDefinesByObject` branch (which explicitly removes the rel itself and
// deep-purges its `OwnerHistory`), this branch does neither for the `IfcRelAssignsToControl`
// rel itself -- it only calls `./removeTask.ts` for each controlled `IfcTask`, relying
// entirely on `removeTask`'s OWN cleanup of its inverse relationships (including this
// very `IfcRelAssignsToControl`, via `removeTask`'s own `IfcRelAssignsToControl` branch)
// to eventually remove the rel. Ported verbatim: no separate `file.remove(inverse)` call
// added here for this branch.
//
// Schema availability: `IfcWorkSchedule` exists on all 3 schemas (confirmed against all
// 3 generated `.d.ts`s, matching this module's own chunk 1/2 findings), but this
// function has NO `file.schema != "IFC2X3"` guard before its own first line's `file.
// by_type("IfcContext")[0]` call -- matching `./removeWorkPlan.ts`'s/`./
// removeWorkCalendar.ts`'s own already-disclosed identical finding for this exact
// `IfcContext`-lookup pattern, so this throws unconditionally on IFC2X3.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { removeDeep2 } from "../../util/element";
import { unassignObject } from "../aggregate/unassignObject";
import { wrapUsecase } from "../hooks";
import { unassignDeclaration } from "../project/unassignDeclaration";
import { removeTask } from "./removeTask";

export interface RemoveWorkScheduleSettings {
	/** The `IfcWorkSchedule` to remove. */
	workSchedule: EntityInstance;
}

function removeWorkScheduleUsecase(file: IfcFile, settings: RemoveWorkScheduleSettings): void {
	const { workSchedule } = settings;

	// See this file's header comment: no IFC2X3 guard here, matching real Python -- this
	// throws unconditionally on IFC2X3.
	unassignDeclaration(file, {
		definitions: [workSchedule],
		relatingContext: file.byType("IfcContext")[0],
	});

	const declares = workSchedule.get("Declares") as EntityInstance[] | null;
	if (declares && declares.length > 0) {
		for (const rel of declares) {
			for (const childSchedule of rel.get("RelatedObjects") as EntityInstance[]) {
				removeWorkSchedule(file, { workSchedule: childSchedule });
			}
		}
	}

	// Unassign from work plans.
	if (workSchedule.get("Decomposes")) {
		unassignObject(file, { products: [workSchedule] });
	}

	for (const inverse of file.getInverse(workSchedule) as Set<EntityInstance>) {
		if (inverse.isA("IfcRelDefinesByObject")) {
			const relatedObjects = inverse.get("RelatedObjects") as EntityInstance[];
			if ((inverse.get("RelatingObject") as EntityInstance).equals(workSchedule) || relatedObjects.length === 1) {
				const history = inverse.get("OwnerHistory") as EntityInstance | null;
				file.remove(inverse);
				if (history) removeDeep2(file, history);
			} else {
				inverse.set(
					"RelatedObjects",
					relatedObjects.filter((o) => !o.equals(workSchedule)),
				);
			}
		} else if (inverse.isA("IfcRelAssignsToControl")) {
			const relatedObjects = inverse.get("RelatedObjects") as EntityInstance[];
			for (const relatedObject of relatedObjects) {
				if (relatedObject.isA("IfcTask")) {
					removeTask(file, { task: relatedObject });
				}
			}
		}
	}

	const history = workSchedule.get("OwnerHistory") as EntityInstance | null;
	file.remove(workSchedule);
	if (history) removeDeep2(file, history);
}

/**
 * Removes a work schedule (Python: `ifcopenshell.api.sequence.remove_work_schedule`).
 *
 * All tasks in the work schedule are also removed recursively.
 *
 * @example
 * ```ts
 * const workPlan = api.sequence.addWorkPlan(model, { name: "Construction" });
 * const schedule = api.sequence.addWorkSchedule(model, { name: "Construction Schedule A", workPlan });
 * api.sequence.removeWorkSchedule(model, { workSchedule: schedule });
 * ```
 */
export const removeWorkSchedule = wrapUsecase("sequence.remove_work_schedule", removeWorkScheduleUsecase);
