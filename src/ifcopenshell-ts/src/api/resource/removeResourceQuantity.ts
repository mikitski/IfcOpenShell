// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/resource/remove_resource_quantity.py` (src/ifcopenshell-
// python, 50 lines) -- part of this project's brand-new `api.resource` chunk (see
// `./index.ts`'s own header comment). Clears `resource.BaseQuantity` and deep-purges
// the old quantity entity, if one existed. No dependency beyond `util.element`.
//
// --- Another confirmed hit of the already-disclosed native inverse-index bug
//     (`TODOS.md`'s "clearing an entity/aggregate-of-entity attribute to null via
//     .set() leaves a stale inverse-index entry") -- worked around the exact same way
//     `api.root.removeProduct.ts` already does for its structurally-identical
//     `ObjectPlacement`-nulling case, not a new pattern ---
//
// Real Python: `resource.BaseQuantity = None; remove_deep2(file, old_quantity)` --
// nulling the attribute first is real Python's own way of dropping `old_quantity`'s
// inverse count to 0 so `remove_deep2`'s own `total_inverses(element) > 0` guard
// doesn't refuse to remove it.
//
// This port does NOT null the attribute directly: `EntityInstance.set(name, null)`
// for a single-entity-typed attribute has the disclosed native primitive-layer bug
// above -- confirmed empirically against this worktree's own built native addon (a
// real repro during this chunk's own test-writing, not assumed): explicitly nulling
// first, THEN calling `removeDeep2(file, oldQuantity)`, silently no-ops forever
// (`getTotalInverses(oldQuantity)` stays stuck at 1), leaving the old quantity
// permanently orphaned. Instead, `removeDeep2`'s own `alsoConsider` parameter is used
// to reach the exact same correct end state via a different, unaffected code path:
// `oldQuantity` is read but `resource.BaseQuantity` is deliberately left UNTOUCHED
// (still pointing at `oldQuantity`) at the moment `removeDeep2(file, oldQuantity,
// [resource])` is called, so its inverse-containment check sees `resource`'s one real,
// still-live forward reference (reachable within one `traverse` level) and treats it
// as "also being removed", satisfying the guard without ever touching the buggy
// null-assignment path. `IfcFile.remove`'s own documented behavior ("attribute values
// in other entity instances that reference the deleted object will be set to null")
// then automatically nulls `resource.BaseQuantity` as a side effect of deleting
// `oldQuantity` itself -- confirmed empirically to reach the identical final state
// real Python's own working `None`-assignment achieves. See `TODOS.md`'s existing
// entry (updated with this as a further confirmed instance, not a new entry) for the
// full native root-cause writeup.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveResourceQuantitySettings {
	/** The `IfcConstructionResource` to remove the quantity from. */
	resource: EntityInstance;
}

function removeResourceQuantityUsecase(file: IfcFile, settings: RemoveResourceQuantitySettings): void {
	const { resource } = settings;
	const oldQuantity = resource.get("BaseQuantity") as EntityInstance | null;
	// See this file's header comment: `resource.BaseQuantity` is deliberately NOT
	// nulled here -- `removeDeep2`'s own `[resource]` `alsoConsider` argument below,
	// plus `IfcFile.remove`'s own auto-nulling, reaches the same end state without
	// hitting the disclosed native inverse-index bug.
	if (oldQuantity) elementUtil.removeDeep2(file, oldQuantity, [resource]);
}

/**
 * Removes the base quantity of a resource (Python: `ifcopenshell.api.resource.remove_resource_quantity`).
 *
 * @example
 * ```ts
 * const crew = api.resource.addResource(model, { ifcClass: "IfcCrewResource" });
 * const labour = api.resource.addResource(model, { parentResource: crew, ifcClass: "IfcLaborResource" });
 * api.resource.addResourceQuantity(model, { resource: labour, ifcClass: "IfcQuantityTime" });
 * // Let's say we only want to store the resource but no quantities.
 * api.resource.removeResourceQuantity(model, { resource: labour });
 * ```
 */
export const removeResourceQuantity = wrapUsecase("resource.remove_resource_quantity", removeResourceQuantityUsecase);
