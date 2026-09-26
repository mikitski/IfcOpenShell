// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/group/assign_group.py` (src/ifcopenshell-python, 69 lines)
// -- assigns products to a group via `IfcRelAssignsToGroup`, structurally close to
// `../layer/assignLayer.ts`'s "reuse-or-create" shape but rel-based (like
// `../spatial/assignContainer.ts`) rather than a plain attribute rewrite, since
// `IfcGroup` has no forward `AssignedObjects`-style attribute of its own.
//
// Real Python only ever looks at `group.IsGroupedBy[0]` -- the *first* rel, if one
// exists -- never merging into or even inspecting any additional pre-existing rels.
// This matters on IFC4+, where (per `update_group_products.py`'s own comment, ported
// verbatim in `./updateGroupProducts.ts`) `IfcGroup` can genuinely have more than one
// `IfcRelAssignsToGroup` pointing at it; `assign_group` doesn't merge across them, it
// just keeps growing whichever rel happens to be first. Ported verbatim, not "fixed" --
// this is real Python's own behavior, not something this port introduces.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
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

export interface AssignGroupSettings {
	/** A list of `IfcProduct` elements to assign to the group. */
	products: readonly EntityInstance[];
	/** The `IfcGroup` to assign the products to. */
	group: EntityInstance;
}

function assignGroupUsecase(file: IfcFile, settings: AssignGroupSettings): EntityInstance | undefined {
	if (!settings.products.length) {
		return undefined;
	}

	const { group } = settings;
	const isGroupedBy = group.get("IsGroupedBy") as EntityInstance[];
	if (isGroupedBy.length === 0) {
		return file.createEntity(
			"IfcRelAssignsToGroup",
			guid.new(),
			createOwnerHistory(file, {}),
			null, // Name
			null, // Description
			settings.products, // RelatedObjects
			null, // RelatedObjectsType
			group, // RelatingGroup
		);
	}
	const rel = isGroupedBy[0];

	const relatedObjects = new EntityInstanceSet();
	relatedObjects.update(rel.get("RelatedObjects") as EntityInstance[]);

	const productsSet = new EntityInstanceSet();
	productsSet.update(settings.products);

	if (productsSet.isSubsetOf(relatedObjects)) {
		return rel;
	}

	const merged = new EntityInstanceSet();
	merged.update(relatedObjects.values());
	merged.update(productsSet.values());
	rel.set("RelatedObjects", merged.values());
	updateOwnerHistory(file, { element: rel });
	return rel;
}

/**
 * Assigns products to a group (Python: `ifcopenshell.api.group.assign_group`).
 *
 * If a product is already assigned to the group, it will not be assigned twice.
 *
 * @returns The `IfcRelAssignsToGroup` relationship, or `undefined` if `products` was an
 * empty list.
 *
 * @example
 * ```ts
 * const group = api.group.addGroup(model, { name: "Furniture" });
 * api.group.assignGroup(model, { products: file.byType("IfcFurniture"), group });
 * ```
 */
export const assignGroup = wrapUsecase("group.assign_group", assignGroupUsecase);
