// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/remove_cost_item.py` (src/ifcopenshell-python, 63
// lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s own
// header comment). Removes a cost item and its `IfcRelNests`/`IfcRelAssignsToControl`
// relationships (recursively removing nested subitems too), but retains the related
// resources/products/tasks themselves. Real Python's own `# TODO: do a deep purge`
// self-flag is ported verbatim -- `CostValues`/`CostQuantities` on the removed item are
// NOT purged here at all.
//
// Structurally near-identical to `../resource/removeResource.ts`'s own
// `file.getInverse`-walking pattern, including its own self-recursive
// `removeResource(file, {...})` call via its OWN wrapped export -- this file does the
// same for `removeCostItem` on the `IfcRelNests`-where-`costItem`-is-`RelatingObject`
// branch (i.e. `costItem` has nested subitems, each fully removed in turn).
//
// --- Real, disclosed (and unexercised by real Python's own test suite) latent gap: a
//     parent's `IfcRelNests` SHARED by 2+ nested children is never explicitly removed
//     when the PARENT is removed ---
//
// `../nest/assignObject.ts` merges every subsequent `addCostItem({costItem: parent})`
// call into ONE shared `IfcRelNests` (growing its `RelatedObjects`), rather than
// creating a separate rel per child. When `removeCostItem` is called on the PARENT,
// its `RelatingObject == costItem` branch recurses into `removeCostItem` for EACH
// child -- but each child's own recursive call only removes the shared rel via its
// `RelatedObjects.length === 1 && [0] === costItem` check, which only matches when
// that child is the rel's SOLE remaining member. With 2+ children sharing the rel,
// NEITHER child's recursive call ever matches that condition, so the rel is never
// explicitly `file.remove`-d by this function at all -- it's left in the file,
// (assuming `IfcFile.remove`'s own auto-null-stale-references behavior for its two
// now-removed endpoints) orphaned rather than purged. Real Python has the exact same
// gap (traced directly against the source), and its own `test_remove_cost_item.py`
// never exercises a parent with 2+ children either (only 0 or exactly 1) -- ported
// verbatim, not "fixed" beyond what real Python already does.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

function removeConsiderHistory(file: IfcFile, element: EntityInstance): void {
	const history = element.get("OwnerHistory") as EntityInstance | null;
	file.remove(element);
	if (history) elementUtil.removeDeep2(file, history);
}

/** Python's `related_objects == (cost_item,)` -- `related_objects` is exactly the single-element tuple `(cost_item,)`. */
function isSoleMember(list: readonly EntityInstance[], item: EntityInstance): boolean {
	return list.length === 1 && list[0].equals(item);
}

export interface RemoveCostItemSettings {
	/** The `IfcCostItem` entity you want to remove. */
	costItem: EntityInstance;
}

function removeCostItemUsecase(file: IfcFile, settings: RemoveCostItemSettings): void {
	const { costItem } = settings;

	// TODO: do a deep purge (matching real Python's own self-flag).
	for (const inverse of file.getInverse(costItem) as Set<EntityInstance>) {
		if (inverse.isA("IfcRelNests")) {
			if ((inverse.get("RelatingObject") as EntityInstance).equals(costItem)) {
				for (const relatedObject of inverse.get("RelatedObjects") as EntityInstance[]) {
					removeCostItem(file, { costItem: relatedObject });
				}
			} else if (isSoleMember(inverse.get("RelatedObjects") as EntityInstance[], costItem)) {
				removeConsiderHistory(file, inverse);
			}
		} else if (inverse.isA("IfcRelAssignsToControl")) {
			if ((inverse.get("RelatedObjects") as EntityInstance[]).length >= 2) {
				continue;
			}
			removeConsiderHistory(file, inverse);
		}
	}
	removeConsiderHistory(file, costItem);
}

/**
 * Removes a cost item (Python: `ifcopenshell.api.cost.remove_cost_item`).
 *
 * All associated relationships with the cost item are also removed, however the
 * related resources, products, and tasks themselves are retained.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 * api.cost.removeCostItem(model, { costItem: item });
 * ```
 */
export const removeCostItem = wrapUsecase("cost.remove_cost_item", removeCostItemUsecase);
