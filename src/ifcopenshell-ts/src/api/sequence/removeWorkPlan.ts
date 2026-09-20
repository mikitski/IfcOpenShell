// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/remove_work_plan.py` (src/ifcopenshell-python, 57
// lines) -- part of `api.sequence` chunk 2 (see `./index.ts`'s own header comment for
// this chunk's full scope). Un-declares the work plan from the project's `IfcContext`,
// unassigns any work schedules aggregated under it (WITHOUT removing them -- only the
// aggregation relationship is dropped, matching the real docstring's own "schedules that
// are grouped under the work plan are not removed" note), then removes `work_plan`
// itself and deep-purges its `OwnerHistory` if it had one.
//
// --- REAL, CONFIRMED PYTHON BUG: no `file.schema != "IFC2X3"` guard at all -- identical
//     finding to `./assignWorkPlan.ts` ---
//
// Read closely: this function's very first line unconditionally calls
// `file.by_type("IfcContext")[0]` as the `relating_context` argument to
// `unassign_declaration` -- with NO schema check beforehand, exactly like
// `./assignWorkPlan.ts`'s own identical confirmed bug (see that file's own header
// comment for the full writeup, not repeated here). Since IFC2X3 has no `IfcContext`
// class AT ALL, calling `removeWorkPlan` against an IFC2X3 file ALWAYS throws
// ("Entity with name 'IfcContext' not found in schema 'IFC2X3'"), unconditionally,
// regardless of `workPlan`'s own state -- ported verbatim, not "fixed" by adding a guard
// real Python doesn't have.
//
// `api.aggregate.unassignObject`/`api.project.unassignDeclaration`/`util.element.
// removeDeep2` (all already landed, verified directly against their own TS source) are
// the only real dependencies -- confirmed by reading the whole real file.
//
// --- `work_plan.IsDecomposedBy` accessed directly, no default -- matches real Python ---
//
// `IfcObjectDefinition.IsDecomposedBy` is declared on every schema (`IfcWorkPlan`'s own
// ancestor), so a direct `.get("IsDecomposedBy")` (no `attrOrMissing`/`?? []` guard) is
// safe here -- matching real Python's own unguarded `work_plan.IsDecomposedBy` access
// (never wrapped in a `getattr(..., default)` the way some other `util.element`
// functions are, since this attribute is unconditionally present on the class).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { unassignObject } from "../aggregate/unassignObject";
import { wrapUsecase } from "../hooks";
import { unassignDeclaration } from "../project/unassignDeclaration";

export interface RemoveWorkPlanSettings {
	/** The `IfcWorkPlan` to remove. */
	workPlan: EntityInstance;
}

function removeWorkPlanUsecase(file: IfcFile, settings: RemoveWorkPlanSettings): void {
	const { workPlan } = settings;

	// See this file's header comment: no IFC2X3 guard here, matching real Python -- this
	// throws unconditionally on IFC2X3.
	unassignDeclaration(file, {
		definitions: [workPlan],
		relatingContext: file.byType("IfcContext")[0],
	});

	const isDecomposedBy = workPlan.get("IsDecomposedBy") as EntityInstance[];
	const relatedObjects = isDecomposedBy.flatMap((rel) => rel.get("RelatedObjects") as EntityInstance[]);
	if (relatedObjects.length > 0) {
		unassignObject(file, { products: relatedObjects });
	}

	const history = workPlan.get("OwnerHistory") as EntityInstance | null;
	file.remove(workPlan);
	if (history) elementUtil.removeDeep2(file, history);
}

/**
 * Removes a work plan (Python: `ifcopenshell.api.sequence.remove_work_plan`).
 *
 * Note that schedules that are grouped under the work plan are not removed.
 *
 * See this file's header comment for a real, confirmed Python bug: unlike
 * `api.sequence.addWorkPlan`, this function has NO `IFC2X3` guard at all, so it always
 * throws when called against an IFC2X3 file.
 *
 * @example
 * ```ts
 * const workPlan = api.sequence.addWorkPlan(model, { name: "Construction" });
 * // And remove it immediately.
 * api.sequence.removeWorkPlan(model, { workPlan });
 * ```
 */
export const removeWorkPlan = wrapUsecase("sequence.remove_work_plan", removeWorkPlanUsecase);
