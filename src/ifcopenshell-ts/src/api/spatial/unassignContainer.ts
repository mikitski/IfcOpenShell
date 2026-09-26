// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/spatial/unassign_container.py` (src/ifcopenshell-python, 67
// lines) -- removes a list of products from whatever `IfcRelContainedInSpatialStructure`
// each currently belongs to. No geometry/aggregate dependency (unlike
// `assignContainer.ts` -- see that file's header comment); this function is a
// straightforward relationship rewrite-or-delete, ported verbatim.
//
// For each distinct containment rel touched by any of `products`: if other elements
// remain in `RelatedElements` after removing `products`, the rel is rewritten in place
// (`update_owner_history` called); if `products` were the only elements left in it, the
// rel itself is deleted (`removeDeep2`'d, cascading to its now-orphaned `OwnerHistory`)
// -- exactly `assignContainer.ts`'s own "unassign elements from previous containers"
// loop, since it's the same underlying relationship class (both files' Python sources
// share this same shape, not a coincidence of this port).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

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
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface UnassignContainerSettings {
	/** A list of `IfcProduct`s to remove the containment from. */
	products: readonly EntityInstance[];
}

function unassignContainerUsecase(file: IfcFile, settings: UnassignContainerSettings): void {
	const productsSet = new EntityInstanceSet();
	productsSet.update(settings.products);

	const rels = new EntityInstanceSet();
	for (const product of productsSet.values()) {
		const containedInStructure = product.get("ContainedInStructure") as EntityInstance[];
		const rel = containedInStructure[0] ?? null;
		if (rel) rels.add(rel);
	}

	for (const rel of rels.values()) {
		const relatedElements = (rel.get("RelatedElements") as EntityInstance[]).filter((e) => !productsSet.has(e));
		if (relatedElements.length > 0) {
			rel.set("RelatedElements", relatedElements);
			updateOwnerHistory(file, { element: rel });
		} else {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}
}

/**
 * Unassigns a container from products (Python: `ifcopenshell.api.spatial.unassign_container`).
 */
export const unassignContainer = wrapUsecase("spatial.unassign_container", unassignContainerUsecase);
