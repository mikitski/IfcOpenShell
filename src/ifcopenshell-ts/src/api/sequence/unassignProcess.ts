// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/unassign_process.py` (src/ifcopenshell-python, 72
// lines) -- part of `api.sequence` chunk 2 (see `./index.ts`'s own header comment for
// this chunk's full scope). The inverse of `./assignProcess.ts`: removes `relatedObject`
// from whichever `IfcRelAssignsToProcess` currently links it to `relatingProcess` --
// shrinking the relationship's `RelatedObjects` if other objects remain assigned via the
// same rel, or deleting the rel entirely (deep-purging its `OwnerHistory` too) if
// `relatedObject` was the only one. Structurally near-identical to `./unassignProduct.ts`
// (both search the RELATED object's own `HasAssignments` for a matching rel, then
// shrink-or-delete it) -- the two real Python source files are themselves near-identical
// for the same reason (`IfcRelAssignsToProcess`/`IfcRelAssignsToProduct` are sibling
// `IfcRelAssigns` subtypes with the same shape), not a coincidence introduced by this
// port.
//
// `api.owner.updateOwnerHistory`/`util.element.removeDeep2` (both already landed) are
// the only real dependencies -- confirmed by reading the whole real file.
//
// --- `for rel in ... : ... return` -- only the FIRST matching rel is ever touched ---
//
// Real Python's own loop returns immediately (either a bare `return`, or `return rel`)
// as soon as it finds ONE matching `IfcRelAssignsToProcess` whose `RelatingProcess`
// equals `relating_process` -- it never continues scanning for a second match. In
// practice `relatedObject.HasAssignments` should never contain two DIFFERENT
// `IfcRelAssignsToProcess` rels both pointing at the SAME `relatingProcess` (that would
// mean the same input/control/resource relationship was somehow created twice for the
// same pair, which `./assignProcess.ts`'s own dedup check prevents), so this is a
// faithful, not-lossy port of a realistic single-match scenario, not a corner-cutting
// shortcut.
//
// No return value on the "rel deleted entirely" branch (Python: bare `return`, i.e.
// `None`/`undefined`) vs. the "rel shrunk" branch (Python: `return rel`, the still-alive,
// now-smaller relationship) -- both ported verbatim below, this asymmetry is intentional
// in real Python (there's nothing meaningful to return once the rel itself no longer
// exists).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

export interface UnassignProcessSettings {
	/** The `IfcTask` in the relationship. */
	relatingProcess: EntityInstance;
	/** The related object. */
	relatedObject: EntityInstance;
}

function unassignProcessUsecase(file: IfcFile, settings: UnassignProcessSettings): EntityInstance | undefined {
	const { relatingProcess, relatedObject } = settings;

	const hasAssignments = relatedObject.get("HasAssignments") as EntityInstance[];
	for (const rel of hasAssignments) {
		if (!rel.isA("IfcRelAssignsToProcess") || !(rel.get("RelatingProcess") as EntityInstance).equals(relatingProcess)) {
			continue;
		}
		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		if (relatedObjects.length === 1) {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
			return undefined;
		}
		const newRelatedObjects = relatedObjects.filter((o) => !o.equals(relatedObject));
		rel.set("RelatedObjects", newRelatedObjects);
		updateOwnerHistory(file, { element: rel });
		return rel;
	}
	return undefined;
}

/**
 * Unassigns a process and object relationship (Python:
 * `ifcopenshell.api.sequence.unassign_process`).
 *
 * See `api.sequence.assignProcess` for details.
 *
 * @returns The still-alive, shrunk `IfcRelAssignsToProcess` if other objects remain
 * assigned via the same relationship, or `undefined` if the relationship was removed
 * entirely (or no matching relationship was found at all).
 *
 * @example
 * ```ts
 * const task = api.sequence.addTask(model, {
 *   workSchedule: schedule, name: "Demolish existing", identification: "A", predefinedType: "DEMOLITION",
 * });
 * const wall = api.root.createEntity(model, { ifcClass: "IfcWall" });
 * api.sequence.assignProcess(model, { relatingProcess: task, relatedObject: wall });
 * // Change our mind.
 * api.sequence.unassignProcess(model, { relatingProcess: task, relatedObject: wall });
 * ```
 */
export const unassignProcess = wrapUsecase("sequence.unassign_process", unassignProcessUsecase);
