// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/group/unassign_group.py` (src/ifcopenshell-python, 59
// lines) -- the mirror image of `./assignGroup.ts`: removes products from the group's
// `IsGroupedBy[0]` rel (again, only ever the *first* pre-existing rel, matching
// `assignGroup.ts`'s own disclosed "never looks past index 0" behavior), rewriting
// `RelatedObjects` if members remain, or deleting the rel entirely (with a
// `removeDeep2` cascade on its `OwnerHistory`) if not. Structurally near-identical to
// `../spatial/unassignContainer.ts`/`../aggregate/unassignObject.ts`'s own
// rewrite-or-delete shape.

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
	delete(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.delete(instance.identity());
	}
	get size(): number {
		return this.byIdentity.size;
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface UnassignGroupSettings {
	/** A list of `IfcProduct` elements to unassign from the group. */
	products: readonly EntityInstance[];
	/** The `IfcGroup` to unassign from. */
	group: EntityInstance;
}

function unassignGroupUsecase(file: IfcFile, settings: UnassignGroupSettings): void {
	const { group } = settings;
	const isGroupedBy = group.get("IsGroupedBy") as EntityInstance[];
	if (isGroupedBy.length === 0) {
		return;
	}
	const rel = isGroupedBy[0];

	const relatedObjects = new EntityInstanceSet();
	relatedObjects.update(rel.get("RelatedObjects") as EntityInstance[]);

	for (const product of settings.products) {
		relatedObjects.delete(product);
	}

	if (relatedObjects.size > 0) {
		rel.set("RelatedObjects", relatedObjects.values());
		updateOwnerHistory(file, { element: rel });
	} else {
		const history = rel.get("OwnerHistory") as EntityInstance | null;
		file.remove(rel);
		if (history) elementUtil.removeDeep2(file, history);
	}
}

/**
 * Unassigns products from a group (Python: `ifcopenshell.api.group.unassign_group`).
 *
 * If the product isn't assigned to the group, nothing will happen.
 *
 * @example
 * ```ts
 * const group = api.group.addGroup(model, { name: "Furniture" });
 * const furniture = file.byType("IfcFurniture");
 * api.group.assignGroup(model, { products: furniture, group });
 *
 * const badFurniture = furniture[0];
 * api.group.unassignGroup(model, { products: [badFurniture], group });
 * ```
 */
export const unassignGroup = wrapUsecase("group.unassign_group", unassignGroupUsecase);
