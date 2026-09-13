// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/layer/assign_layer.py` (src/ifcopenshell-python, 62 lines)
// -- assigns representations/representation items to a layer by rewriting the layer's
// own `AssignedItems` attribute (a plain SET-typed attribute on
// `IfcPresentationLayerAssignment`, NOT a separate STEP relationship entity the way
// `api.spatial`/`api.aggregate`'s containment/aggregation rels are) -- so unlike those
// modules' `unassignContainer.ts`/`unassignObject.ts` precedent, there is no rel
// entity to create/rewrite/delete here, just a set-union write directly onto `layer`.
//
// Ported verbatim, including the real Python source's own no-op short-circuit: if
// every item in `items` is already in `layer.AssignedItems`, nothing is written at all
// (no attribute mutation, no owner-history touch -- `assign_layer.py` doesn't call
// `update_owner_history` even on the write path, since `AssignedItems` lives directly
// on the layer itself rather than on a rel with its own `OwnerHistory`).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** Local by-identity set -- see `../aggregate/unassignObject.ts`'s identical helper's own doc comment. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}
	update(instances: Iterable<EntityInstance | null | undefined>): void {
		for (const instance of instances) this.add(instance);
	}
	has(instance: EntityInstance | null | undefined): boolean {
		if (!instance) return false;
		return this.byIdentity.has(instance.identity());
	}
	isSubsetOf(other: EntityInstanceSet): boolean {
		for (const identity of this.byIdentity.keys()) {
			if (!other.byIdentity.has(identity)) return false;
		}
		return true;
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface AssignLayerSettings {
	/**
	 * The list of `IfcRepresentationItem`s / `IfcRepresentation`s to assign to the
	 * layer. This should be the items from the object's `IfcShapeRepresentation`.
	 */
	items: readonly EntityInstance[];
	/** The `IfcPresentationLayerAssignment` layer to assign the items to. */
	layer: EntityInstance;
}

function assignLayerUsecase(_file: IfcFile, settings: AssignLayerSettings): void {
	const { layer } = settings;

	// support AssignedItems == None since layer might just got created
	const assignedItems = new EntityInstanceSet();
	assignedItems.update((layer.get("AssignedItems") as EntityInstance[] | null) ?? []);

	const itemsSet = new EntityInstanceSet();
	itemsSet.update(settings.items);

	if (itemsSet.isSubsetOf(assignedItems)) return;

	assignedItems.update(itemsSet.values());
	layer.set("AssignedItems", assignedItems.values());
}

/**
 * Assigns representation items or representations to a layer (Python:
 * `ifcopenshell.api.layer.assign_layer`).
 *
 * In IFC, instead of objects being assigned to layers, representation items are
 * assigned to layers. Representation items are portions of the object's
 * representation. For example, this allows a single IFC Window element to have
 * portions of its 2D linework (e.g. the cross section of its frame) assigned to one
 * layer, and another portion (e.g. the glazing panels) assigned to another layer.
 *
 * @example
 * ```ts
 * const layer = api.layer.addLayer(model, { name: "AI-WALL" });
 * api.layer.assignLayer(model, { items: [representation.get("Items")[0]], layer });
 * ```
 */
export const assignLayer = wrapUsecase("layer.assign_layer", assignLayerUsecase);
