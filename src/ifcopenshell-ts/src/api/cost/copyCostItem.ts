// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/copy_cost_item.py` (src/ifcopenshell-python, 115
// lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s own
// header comment). Deep-copies a cost item's own forward attributes/property sets
// (`util.element.copyDeep`) and recursively duplicates every nested subitem, returning
// either the single new `IfcCostItem` or an array of them (when `costItem` itself has
// nested children -- an odd, disclosed return-type quirk, ported verbatim below).
//
// --- `new_cost_items[0] if len(new_cost_items) == 1 else new_cost_items` -- a genuinely
//     confusing return-type quirk, ported verbatim ---
//
// `self.new_cost_items` collects EVERY duplicated cost item across the WHOLE recursive
// tree (the root plus every nested descendant), in the order each was created (root
// first, depth-first). If `costItem` has no descendants, exactly one entry exists and
// the single `IfcCostItem` is returned. Otherwise, the ENTIRE flat list (root +
// descendants) is returned as an array -- not just the descendants, and not a nested
// tree shape. Callers that only care about the root copy must special-case this (see
// `./copyCostSchedule.ts`'s own `Array.isArray(...)` check, itself lifted straight
// from real Python's `if isinstance(duplicated_cost_item, list): duplicated_cost_item
// = duplicated_cost_item[0]`).
//
// --- REAL, DISCLOSED PYTHON QUIRK/INEFFICIENCY: a throwaway `IfcRelNests` shallow copy
//     is created, mutated, then immediately unassigned-and-deleted by the very next two
//     lines -- ported verbatim, not "optimized away" ---
//
// For each `IfcRelNests` inverse where `fromElement` is the `RelatingObject` (i.e.
// `fromElement` has nested children), real Python:
//   1. Recursively duplicates every nested child (`duplicate_cost_item`), building
//      `new_cost_items` in the same order as `nested_cost_items`.
//   2. `inverse = ifcopenshell.util.element.copy(self.file, inverse)` -- a SHALLOW copy
//      of the ORIGINAL rel (same `Name`/`Description`/`RelatingObject`/`RelatedObjects`
//      as `fromElement`'s own rel, but a fresh `GlobalId`/entity id).
//   3. `inverse.RelatingObject = to_element; inverse.RelatedObjects = new_cost_items`
//      -- mutates THIS NEW COPY's own forward attributes. Since `RelatingObject` is now
//      `toElement`, this newly-created rel immediately becomes `toElement`'s own
//      `IsNestedBy[0]`/`Nests[0]` (IFC4+) purely as a side effect of this forward-
//      attribute write (no `assign_object` call yet).
//   4. `nest.unassign_object(related_objects=new_cost_items)` -- unassigns the new cost
//      items from whatever nest they're CURRENTLY in, which is exactly the rel just
//      created in step 2-3 (since its own `RelatedObjects` was just set to
//      `new_cost_items`). Since ALL of `new_cost_items` are removed from that rel's
//      `RelatedObjects` at once, `unassign_object`'s own "if nothing remains, delete
//      the rel" branch fires -- the rel created in steps 2-3 is deleted here, its
//      `OwnerHistory` deep-purged too. The freshly-allocated GlobalId/entity from step
//      2 is thus discarded almost immediately after creation.
//   5. `nest.assign_object(related_objects=new_cost_items, relating_object=to_element)`
//      -- since `toElement.IsNestedBy`/`.Nests` is now empty again (step 4 just deleted
//      the only rel there), this creates a BRAND NEW `IfcRelNests`, the one that
//      actually persists as the real, final parent-child link.
// Net effect: functionally correct (the final state has exactly one `IfcRelNests`
// linking `toElement` to `newCostItems`), but with genuinely wasted work -- an extra
// `IfcRelNests` entity (and `IfcOwnerHistory`) is allocated, mutated, and deleted
// within the span of 3 lines. Ported byte-for-byte (steps 2-3 are NOT skipped as
// "obviously pointless"), per this project's near-verbatim-port mandate for a real,
// disclosed upstream inefficiency.
//
// --- The generic catch-all `else` branch: EVERY OTHER inverse relationship ---
//
// For any inverse that's neither `IfcRelDefinesByProperties` nor a `fromElement`-as-
// parent `IfcRelNests`, real Python walks every attribute INDEX of that inverse
// (`for i, value in enumerate(inverse)`):
// - A single-entity-valued attribute exactly equal to `fromElement`: a NEW shallow
//   copy of the whole inverse is made, with just that one index set to `toElement` --
//   the ORIGINAL inverse is left completely untouched (still pointing at
//   `fromElement`). In practice, no inverse relevant to a cost item actually has
//   `fromElement` as a single-entity attribute value (a cost item is only ever a LIST
//   member of `RelatedObjects`, e.g. `IfcRelAssignsToControl`/`IfcRelNests`-as-child --
//   this branch is real, faithfully ported dead code for this particular entity type,
//   not invented).
// - A list/tuple-valued attribute CONTAINING `fromElement` (e.g. `RelatedObjects` on
//   `IfcRelAssignsToControl` or an `IfcRelNests` where `fromElement` is a nested
//   CHILD): the ORIGINAL inverse's own attribute is mutated in place, appending
//   `toElement` alongside the existing members (NOT replacing `fromElement`, NOT
//   deduping -- `toElement` is simply appended once, every time this runs, matching
//   real Python's own unconditional `new_value.append(to_element)`).

import { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { assignObject } from "../nest/assignObject";
import { unassignObject } from "../nest/unassignObject";

class CopyCostItemContext {
	newCostItems: EntityInstance[] = [];

	constructor(private readonly file: IfcFile) {}

	duplicateCostItem(costItem: EntityInstance): EntityInstance {
		const newCostItem = elementUtil.copyDeep(this.file, costItem);
		this.newCostItems.push(newCostItem);
		this.copyIndirectAttributes(costItem, newCostItem);
		return newCostItem;
	}

	private copyIndirectAttributes(fromElement: EntityInstance, toElement: EntityInstance): void {
		for (const inverse of this.file.getInverse(fromElement) as Set<EntityInstance>) {
			if (inverse.isA("IfcRelDefinesByProperties")) {
				const newInverse = elementUtil.copy(this.file, inverse);
				newInverse.set("RelatedObjects", [toElement]);
				const pset = elementUtil.copyDeep(this.file, newInverse.get("RelatingPropertyDefinition") as EntityInstance);
				newInverse.set("RelatingPropertyDefinition", pset);
			} else if (inverse.isA("IfcRelNests") && (inverse.get("RelatingObject") as EntityInstance).equals(fromElement)) {
				const nestedCostItems = [...(inverse.get("RelatedObjects") as EntityInstance[])];
				if (nestedCostItems.length > 0) {
					const newCostItems = nestedCostItems.map((child) => this.duplicateCostItem(child));

					// See this file's header comment: a throwaway shallow copy that's
					// immediately unassigned-and-deleted by `unassignObject`/`assignObject`
					// below -- ported verbatim, not skipped.
					const throwawayNest = elementUtil.copy(this.file, inverse);
					throwawayNest.set("RelatingObject", toElement);
					throwawayNest.set("RelatedObjects", newCostItems);

					unassignObject(this.file, { relatedObjects: newCostItems });
					assignObject(this.file, { relatedObjects: newCostItems, relatingObject: toElement });
				}
			} else {
				const count = inverse.attributeCount();
				for (let i = 0; i < count; i++) {
					const value = inverse.getByIndex(i);
					if (value instanceof EntityInstance && value.equals(fromElement)) {
						const newInverse = elementUtil.copy(this.file, inverse);
						newInverse.setByIndex(i, toElement);
					} else if (Array.isArray(value) && value.some((v) => v instanceof EntityInstance && v.equals(fromElement))) {
						const newValue = [...(value as unknown[]), toElement];
						inverse.setByIndex(i, newValue);
					}
				}
			}
		}
	}
}

export interface CopyCostItemSettings {
	/** The cost item to be duplicated. */
	costItem: EntityInstance;
}

function copyCostItemUsecase(file: IfcFile, settings: CopyCostItemSettings): EntityInstance | EntityInstance[] {
	const context = new CopyCostItemContext(file);
	context.duplicateCostItem(settings.costItem);
	return context.newCostItems.length === 1 ? context.newCostItems[0] : context.newCostItems;
}

/**
 * Copies all cost items and related relationships (Python: `ifcopenshell.api.cost.copy_cost_item`).
 *
 * The following relationships are also duplicated:
 * - The copy will have the same attributes and property sets as the original cost item.
 * - The copy will be assigned to the parent cost schedule.
 * - The copy will have duplicated nested cost items.
 *
 * @returns The duplicated cost item, or an array of every duplicated cost item (root
 * plus descendants, in creation order) if the source cost item has nested subitems --
 * see this file's header comment for the exact, disclosed shape of that array.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 * const duplicated = api.cost.copyCostItem(model, { costItem: item });
 * ```
 */
export const copyCostItem = wrapUsecase("cost.copy_cost_item", copyCostItemUsecase);
