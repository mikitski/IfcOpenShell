// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/nest/change_nest.py` (src/ifcopenshell-python, 42 lines) --
// part of this project's brand-new `api.nest` chunk (see `./index.ts`'s own header
// comment for the module's overall scope). Small, self-contained "reparent" helper:
// detaches `item` from its current nest (rewriting or purging that rel, matching
// `./unassignObject.ts`'s own rewrite-or-delete shape but inlined rather than reused,
// exactly as real Python does -- it does NOT call `unassign_object` here), then calls
// `./assignObject.ts` to attach it to `newParent`.
//
// --- Real, disclosed Python quirk #1: the module-level docstring is stale/wrong ---
//
// Real Python's docstring reads "Assigns a cost item to a new parent cost item" --
// but the function itself is fully generic over any nested `IfcObjectDefinition`, not
// cost-item-specific in any way (no cost-module import, no cost-specific attribute
// access). This looks like a copy-paste leftover from a sibling module (`api.cost` has
// its own, textually-similar `change_parent`-style helpers). Reproduced verbatim below
// (not "corrected" to a more accurate description) -- see this function's own doc
// comment.
//
// --- Real, disclosed Python quirk #2: `item.Nests[0]` is used unconditionally, even
//     on IFC2X3 (where `Nests` doesn't exist as an inverse attribute at all) ---
//
// Unlike `./assignObject.ts`/`./unassignObject.ts` (which both branch on
// `file.schema == "IFC2X3"` and fall back to `Decomposes` filtered to
// `is_a("IfcRelNests")`), `change_nest.py` reads `item.Nests` directly with NO schema
// branch at all -- confirmed by reading the whole 42-line source: no `ifc2x3`/
// `file.schema` check anywhere. On IFC2X3, `item.Nests` doesn't exist as an attribute,
// so real Python's own `if not item.Nests:` would raise `AttributeError` immediately
// (an `entity_instance` with no such inverse attribute has no `__getattr__` fallback
// for it). This is reproduced verbatim below: `item.get("Nests")` throws on IFC2X3 for
// the same reason (no such attribute name registered for that schema), not "fixed" by
// adding the branch the sibling files have. There is no real Python test for this
// function to confirm/deny this against (see `test/api/nest/` -- no
// `test_change_nest.py` exists), so this is disclosed from reading the source alone.
// A dedicated regression test in `changeNest.test.ts` pins this exact IFC2X3 throw.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";
import { assignObject } from "./assignObject";

export interface ChangeNestSettings {
	/** The `IfcObjectDefinition` to reparent. */
	item: EntityInstance;
	/** The new parent (`relatingObject`) to nest `item` under. */
	newParent: EntityInstance;
}

function changeNestUsecase(file: IfcFile, settings: ChangeNestSettings): void {
	const { item, newParent } = settings;

	// See this file's header comment (quirk #2): `item.get("Nests")` throws on IFC2X3,
	// exactly like real Python's unguarded `item.Nests` does, since no such inverse
	// attribute is registered for that schema.
	const nestsList = item.get("Nests") as EntityInstance[];
	if (nestsList.length === 0) return;
	const nests = nestsList[0];

	const relatedObjects = (nests.get("RelatedObjects") as EntityInstance[]).filter((o) => !o.equals(item));
	if (relatedObjects.length > 0) {
		nests.set("RelatedObjects", relatedObjects);
		updateOwnerHistory(file, { element: nests });
	} else {
		const history = nests.get("OwnerHistory") as EntityInstance | null;
		file.remove(nests);
		if (history) elementUtil.removeDeep2(file, history);
	}
	assignObject(file, { relatedObjects: [item], relatingObject: newParent });
}

/**
 * Reparents a nested object to a new parent (Python: `ifcopenshell.api.nest.change_nest`).
 *
 * See this file's header comment for a disclosed, verbatim-preserved Python docstring
 * quirk (real Python's own docstring says "Assigns a cost item to a new parent cost
 * item", but the function is fully generic) and a disclosed IFC2X3 throw (real Python
 * reads `item.Nests` with no schema branch, unlike `./assignObject.ts`/
 * `./unassignObject.ts`).
 */
export const changeNest = wrapUsecase("nest.change_nest", changeNestUsecase);
