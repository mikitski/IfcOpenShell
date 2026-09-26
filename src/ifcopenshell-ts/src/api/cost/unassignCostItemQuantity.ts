// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/unassign_cost_item_quantity.py` (src/ifcopenshell-
// python, 106 lines) -- part of this project's brand-new `api.cost` chunk (see
// `./index.ts`'s own header comment). The inverse of `./assignCostItemQuantity.ts`'s
// `propName`-based parametric-quantity path: for each product, finds any of
// `costItem.CostQuantities` that is itself one of an `IfcElementQuantity` qto's own
// `Quantities` where that qto is assigned (`DefinesOccurrence`) to `product`, and
// drops it from `costItem.CostQuantities` -- then unassigns the `api.control` link and
// recalculates the auto-count (same `update_cost_item_count` logic
// `./addCostItemQuantity.ts`'s own module-level function has, NOT
// `./assignCostItemQuantity.ts`'s own internal `Usecase.update_cost_item_count`, which
// (per that file's header comment) has a real, disclosed asymmetry: it excludes
// `IfcConstructionResource` related objects from the count, while THIS function's own
// `update_cost_item_count` does not -- ported verbatim, not reconciled).
//
// --- `quantities.remove(quantity)` inside a `for quantity in cost_item.CostQuantities`
//     loop -- mutating a SEPARATE `set()` copy, not the list being iterated ---
//
// Real Python builds `quantities = set(cost_item.CostQuantities or [])` up front, then
// iterates the ORIGINAL `cost_item.CostQuantities or []` (a fresh read, not the `quantities`
// set) while removing matches from `quantities` -- so mutating `quantities` mid-loop
// never affects the loop's own iteration source. Ported the same way: `quantities`
// starts as a fresh, mutable copy of `costItem.CostQuantities`, while the outer loop
// iterates a separately-captured array snapshot.
//
// --- Auto-count quirk (real Python's own comment, ported verbatim): "This is a bold
//     assumption" -- if the count reaches zero, the quantity is REMOVED entirely, not
//     merely set to `0` ---

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { unassignControl } from "../control/unassignControl";
import { wrapUsecase } from "../hooks";

/** Local by-identity set, matching `../control/assignControl.ts`'s own established per-file precedent. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}
	update(instances: Iterable<EntityInstance | null | undefined>): void {
		for (const instance of instances) this.add(instance);
	}
	delete(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.delete(instance.identity());
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface UnassignCostItemQuantitySettings {
	/** The `IfcCostItem` to remove quantities from. */
	costItem: EntityInstance;
	/** A list of `IfcProduct`s that may have parametrically connected quantities to the cost item. */
	products: readonly EntityInstance[];
}

function unassignCostItemQuantityUsecase(file: IfcFile, settings: UnassignCostItemQuantitySettings): void {
	const { costItem, products } = settings;

	const quantities = new EntityInstanceSet();
	quantities.update((costItem.get("CostQuantities") as EntityInstance[] | null) ?? []);

	for (const quantity of (costItem.get("CostQuantities") as EntityInstance[] | null) ?? []) {
		for (const inverse of file.getInverse(quantity) as Set<EntityInstance>) {
			if (!inverse.isA("IfcElementQuantity")) continue;
			for (const rel of (inverse.get("DefinesOccurrence") as EntityInstance[] | null) ?? []) {
				for (const relatedObject of rel.get("RelatedObjects") as EntityInstance[]) {
					if (products.some((p) => p.equals(relatedObject))) {
						quantities.delete(quantity);
					}
				}
			}
		}
	}
	costItem.set("CostQuantities", quantities.values());

	for (const product of products) {
		unassignControl(file, { relatingControl: costItem, relatedObjects: [product] });
	}
	updateCostItemCount(file, costItem);
}

/**
 * Python's `Usecase.update_cost_item_count` -- NOT `./assignCostItemQuantity.ts`'s own
 * internal `update_cost_item_count` (see this file's header comment for the disclosed
 * asymmetry between the two).
 */
function updateCostItemCount(file: IfcFile, costItem: EntityInstance): void {
	// This is a bold assumption -- real Python's own comment, ported verbatim.
	// https://forums.buildingsmart.org/t/how-does-a-cost-item-know-that-it-is-counting-a-controlled-product/3564
	const costQuantities = costItem.get("CostQuantities") as EntityInstance[];
	if (costQuantities.length === 1) {
		const quantity = costQuantities[0];
		if (quantity.isA("IfcQuantityCount")) {
			let count = 0;
			for (const rel of costItem.get("Controls") as EntityInstance[]) {
				count += (rel.get("RelatedObjects") as EntityInstance[]).length;
			}
			if (count) {
				quantity.setByIndex(3, count);
			} else {
				file.remove(quantity);
			}
		}
	}
}

/**
 * Removes quantities of a cost item that are calculated on products (Python:
 * `ifcopenshell.api.cost.unassign_cost_item_quantity`).
 *
 * A cost item may have quantities that are parametrically calculated on physical
 * products. This lets you remove those quantities. This means that any future changes
 * in the physical product's dimensions will not have any impact on the cost item.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 *
 * const value = api.cost.addCostValue(model, { parent: item });
 * api.cost.editCostValue(model, { costValue: value, attributes: { AppliedValue: 5.0 } });
 *
 * const slab = api.root.createEntity(model, { ifcClass: "IfcSlab" });
 * const qto = api.pset.addQto(model, { product: slab, name: "Qto_SlabBaseQuantities" });
 * api.pset.editQto(model, { qto, properties: { NetVolume: 42.0 } });
 *
 * api.cost.assignCostItemQuantity(model, { costItem: item, products: [slab], propName: "NetVolume" });
 *
 * // Let's change our mind and remove the parametric connection.
 * api.cost.unassignCostItemQuantity(model, { costItem: item, products: [slab] });
 * ```
 */
export const unassignCostItemQuantity = wrapUsecase(
	"cost.unassign_cost_item_quantity",
	unassignCostItemQuantityUsecase,
);
