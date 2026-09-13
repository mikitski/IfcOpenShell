// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/group/update_group_products.py` (src/ifcopenshell-python,
// 70 lines) -- sets a group's products to an explicit list, replacing any previous
// assignment, EXCEPT nested groups: real Python explicitly preserves any existing
// `RelatedObjects` member that is itself an `IfcGroup` (`[g for g in rel.RelatedObjects
// if g.is_a("IfcGroup")]`), across every pre-existing rel, not just the first -- so
// unlike `assignGroup.ts`/`unassignGroup.ts` (which only ever look at `IsGroupedBy[0]`),
// this function DOES walk every rel in `IsGroupedBy`, both to collect nested-group
// members to keep and to purge every rel past the first (real Python's own comment on
// the IFC4 test class: "in ifc4 IfcGroup can have multiple rels" -- ported verbatim,
// see `test/api/group/test_update_group_products.py`'s own `TestUpdateGroupProductsIFC4`
// override for the case this purge step exists to handle).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";

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
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface UpdateGroupProductsSettings {
	/** The `IfcGroup` to assign the products to. */
	group: EntityInstance;
	/** A list of `IfcProduct` elements to assign to the group. */
	products: readonly EntityInstance[];
}

function updateGroupProductsUsecase(file: IfcFile, settings: UpdateGroupProductsSettings): EntityInstance {
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

	const rels = isGroupedBy;
	const objects = new EntityInstanceSet();
	objects.update(settings.products);
	for (const rel of rels) {
		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		objects.update(relatedObjects.filter((g) => g.isA("IfcGroup")));
	}
	const toPurge = rels.slice(1);

	for (const rel of toPurge) {
		const history = rel.get("OwnerHistory") as EntityInstance | null;
		file.remove(rel);
		if (history) elementUtil.removeDeep2(file, history);
	}

	rels[0].set("RelatedObjects", objects.values());
	return rels[0];
}

/**
 * Sets a group's products to be an explicit list of products (Python:
 * `ifcopenshell.api.group.update_group_products`).
 *
 * Any previous products assigned to that group will have their assignment removed --
 * except other `IfcGroup`s already nested in this group, which are preserved.
 *
 * @returns The `IfcRelAssignsToGroup` relationship.
 *
 * @example
 * ```ts
 * const group = api.group.addGroup(model, { name: "Furniture" });
 * api.group.updateGroupProducts(model, { products: file.byType("IfcFurniture"), group });
 * ```
 */
export const updateGroupProducts = wrapUsecase("group.update_group_products", updateGroupProductsUsecase);
