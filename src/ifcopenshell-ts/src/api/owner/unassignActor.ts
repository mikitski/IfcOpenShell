// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/unassign_actor.py` (src/ifcopenshell-python, 67
// lines) -- reverses `./assignActor.ts`. Real Python:
//
// ```python
// def unassign_actor(file, relating_actor, related_object):
//     for rel in related_object.HasAssignments or []:
//         if not rel.is_a("IfcRelAssignsToActor") or rel.RelatingActor != relating_actor:
//             continue
//         if len(rel.RelatedObjects) == 1:
//             history = rel.OwnerHistory
//             file.remove(rel)
//             if history:
//                 ifcopenshell.util.element.remove_deep2(file, history)
//             return
//         related_objects = list(rel.RelatedObjects)
//         related_objects.remove(related_object)
//         rel.RelatedObjects = related_objects
//         ifcopenshell.api.owner.update_owner_history(file, element=rel)
// ```
//
// --- A real, non-obvious quirk: no `break` after editing (only after removing) ---
//
// Unlike `../group/unassignGroup.ts` (which only ever has a single candidate rel to
// consider, `group.IsGroupedBy[0]`), this loops over EVERY rel in
// `related_object.HasAssignments`, and only `return`s early in the "removed the whole
// rel" branch -- the "shrunk `RelatedObjects`" branch has NO `return`/`break`, so the
// loop keeps going and can shrink or remove MULTIPLE matching
// `IfcRelAssignsToActor` rels in one call, if more than one happens to reference both
// `relating_actor` and `related_object` (unusual given `./assignActor.ts`'s own dedup
// check, which normally prevents more than one such rel from existing for a given
// (actor, object) pair -- but not impossible, e.g. if a caller constructs a second rel
// by hand rather than via `assignActor`). Ported verbatim: the loop below has no
// early exit after the "shrink" branch either, matching this real behavior exactly
// rather than assuming (like `unassignGroup.ts`'s single-rel shape would suggest) that
// only one rel could ever match.
//
// `list.remove(x)` removes only the FIRST matching element (by `==`, i.e. `entity_instance`
// identity-or-equality) -- reproduced below via `findIndex`+`splice` on a copy (removing
// exactly the first matching occurrence), not a `.filter()` (which would remove EVERY
// occurrence and silently diverge from Python's single-removal semantics if
// `RelatedObjects` ever somehow contained the same object twice).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "./updateOwnerHistory";

export interface UnassignActorSettings {
	/** The `IfcActor` who is responsible for the object. */
	relatingActor: EntityInstance;
	/** The object the actor is responsible for. */
	relatedObject: EntityInstance;
}

function unassignActorUsecase(file: IfcFile, settings: UnassignActorSettings): void {
	const { relatingActor, relatedObject } = settings;

	const hasAssignments = relatedObject.get("HasAssignments") as EntityInstance[];
	for (const rel of hasAssignments) {
		if (!rel.isA("IfcRelAssignsToActor") || !(rel.get("RelatingActor") as EntityInstance).equals(relatingActor)) {
			continue;
		}

		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		if (relatedObjects.length === 1) {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
			return;
		}

		// Python's `list.remove(related_object)` -- first matching occurrence only, see
		// header comment.
		const newRelatedObjects = [...relatedObjects];
		const index = newRelatedObjects.findIndex((o) => o.equals(relatedObject));
		if (index !== -1) newRelatedObjects.splice(index, 1);
		rel.set("RelatedObjects", newRelatedObjects);
		updateOwnerHistory(file, { element: rel });
	}
}

/**
 * Unassigns an actor from an object (Python: `ifcopenshell.api.owner.unassign_actor`).
 *
 * This means that the actor is no longer responsible for the object.
 *
 * @example
 * ```ts
 * const pumpType = api.root.createEntity(model, { ifcClass: "IfcPumpType" });
 * const manufacturer = api.owner.addOrganisation(model, { identification: "PWP", name: "Pumps With Power" });
 * const actor = api.owner.addActor(model, { actor: manufacturer });
 * api.owner.assignActor(model, { relatingActor: actor, relatedObject: pumpType });
 * api.owner.unassignActor(model, { relatingActor: actor, relatedObject: pumpType });
 * ```
 */
export const unassignActor = wrapUsecase("owner.unassign_actor", unassignActorUsecase);
