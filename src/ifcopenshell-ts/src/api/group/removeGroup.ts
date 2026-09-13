// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/group/remove_group.py` (src/ifcopenshell-python, 66 lines)
// -- read especially carefully per this chunk's own task brief, since it does more
// than a plain `file.remove(group)`: it first walks every inverse reference to `group`
// and cleans up the two kinds that would otherwise be left dangling --
// `IfcRelDefinesByProperties` (any property set assigned directly to the group itself,
// via `../pset/removePset.ts`, ported alongside this chunk as a minimal dependency --
// see that file's own header comment) and `IfcRelAssignsToGroup` (both the group's own
// "products in this group" rel, AND any rel that nests this group inside another,
// parent group).
//
// Real Python collects every inverse's `.id()` first (`[i.id() for i in
// file.get_inverse(group)]`), THEN loops by id, re-resolving each via `file.by_id(...)`
// wrapped in a bare `try`/`except: continue` -- because entities are being deleted
// *during* the loop (both by this function's own `removePset`/`file.remove` calls and,
// via `removeDeep2`'s cascade, potentially entities beyond the one just removed), an
// id collected up front may no longer resolve to anything by the time its turn comes
// up; Python tolerates that by simply skipping it. Ported verbatim via `file.byId`
// wrapped in `try`/`catch { continue }`.
//
// --- Why the `IfcRelAssignsToGroup` branch only explicitly handles 2 of 3 shapes ---
//
// Investigated directly, not assumed: `IfcFile.remove`'s own doc comment (`file.ts`,
// mirroring real Python's `file.py`: "Attribute values in other entity instances that
// reference the deleted object will be set to null. In the case of a list or set of
// references, the reference to the deleted [object] will be removed from the
// aggregate.") means the underlying native `remove_entity` primitive ALREADY strips a
// deleted entity out of any other entity's list/set attribute that referenced it --
// confirmed empirically against this exact port's own built native addon (`removeGroup
// .test.ts`'s "purges a rel that nests this group as the sole member" vs. the
// multi-member case below). So when `group` is nested inside another group's rel
// ALONGSIDE other members (`inverse.RelatingGroup != group` and
// `len(inverse.RelatedObjects) > 1`), this function needs no explicit branch at all:
// the final `file.remove(group)` call at the bottom of this function already leaves
// that other rel's `RelatedObjects` correctly spliced down to its remaining members,
// with no dangling reference. The one case that DOES need an explicit branch is when
// `group` is the SOLE member (`len(inverse.RelatedObjects) == 1`): letting the
// automatic aggregate-splice run would leave that rel with an EMPTY `RelatedObjects`
// (a mandatory 1+ SET per the EXPRESS schema), so `remove_group` proactively deletes
// the whole rel instead, matching the "keep IFC valid" intent already established by
// `../layer/unassignLayer.ts`'s own empty-`AssignedItems` handling. Not a bug or a
// dangling-reference gap -- a deliberate asymmetry that only looks incomplete read in
// isolation from `IfcFile.remove`'s own aggregate-cleanup behavior.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { removePset } from "../pset/removePset";

function removeWithOwnerHistory(file: IfcFile, instance: EntityInstance): void {
	const history = instance.get("OwnerHistory") as EntityInstance | null;
	file.remove(instance);
	if (history) elementUtil.removeDeep2(file, history);
}

export interface RemoveGroupSettings {
	/** The `IfcGroup` entity you want to remove. */
	group: EntityInstance;
}

function removeGroupUsecase(file: IfcFile, settings: RemoveGroupSettings): void {
	const { group } = settings;

	// Collect ids up front -- see this file's header comment for why re-resolving by id
	// (tolerating a since-deleted id) is load-bearing here, not merely a style choice.
	const inverseIds = [...(file.getInverse(group) as Set<EntityInstance>)].map((i) => i.id());

	for (const inverseId of inverseIds) {
		let inverse: EntityInstance;
		try {
			inverse = file.byId(inverseId);
		} catch {
			continue;
		}

		if (inverse.isA("IfcRelDefinesByProperties")) {
			removePset(file, { product: group, pset: inverse.get("RelatingPropertyDefinition") as EntityInstance });
		} else if (inverse.isA("IfcRelAssignsToGroup")) {
			const relatingGroup = inverse.get("RelatingGroup") as EntityInstance;
			if (relatingGroup.equals(group)) {
				removeWithOwnerHistory(file, inverse);
			} else if ((inverse.get("RelatedObjects") as EntityInstance[]).length === 1) {
				removeWithOwnerHistory(file, inverse);
			}
			// else: `group` is nested alongside other members in another group's rel --
			// no explicit cleanup needed here; the final `file.remove(group)` call below
			// already splices `group` out of that rel's `RelatedObjects` automatically.
			// See this file's header comment.
		}
	}

	removeWithOwnerHistory(file, group);
}

/**
 * Removes a group (Python: `ifcopenshell.api.group.remove_group`).
 *
 * All products assigned to the group will remain, but the relationship to the group
 * will be removed.
 *
 * @example
 * ```ts
 * const group = api.group.addGroup(model, { name: "Unit 1A" });
 * api.group.removeGroup(model, { group });
 * ```
 */
export const removeGroup = wrapUsecase("group.remove_group", removeGroupUsecase);
