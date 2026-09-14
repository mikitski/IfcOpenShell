// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset/assign_pset.py` (src/ifcopenshell-python, 94 lines).
// Assigns an EXISTING property/quantity set to a list of products, making it shared by
// all of them -- the counterpart of `./unassignPset.ts`.
//
// --- The "occurrence vs type" distinction, read closely rather than assumed ---
//
// Real Python splits `products` into two disjoint groups by `product.is_a("IfcTypeProduct")`
// and handles each with a COMPLETELY DIFFERENT mechanism -- not a stylistic choice, a
// structural one, since `IfcTypeObject` and `IfcObject` relate to property sets via two
// unrelated EXPRESS relationships:
//
//   - Occurrences (`IfcObject`/`IfcContext`, e.g. a wall instance): linked via a
//     separate relationship ENTITY, `IfcRelDefinesByProperties`, whose
//     `RelatingPropertyDefinition` points at the pset and whose `RelatedObjects` LIST
//     holds every occurrence sharing it. `pset`'s own inverse of that rel
//     (`PropertyDefinitionOf` on IFC2X3, renamed `DefinesOccurrence` on IFC4+ -- a real
//     schema rename, not this port's choice) is used to find an EXISTING rel to grow
//     rather than always creating a new one -- real Python only ever looks at the
//     FIRST such rel (`next(iter(rels), None)`), same "don't merge across multiple
//     pre-existing rels" asymmetry `../group/assignGroup.ts`'s own header comment
//     already disclosed for `IfcRelAssignsToGroup` (confirmed here to be the same
//     shape, not copied blindly -- `assign_pset.py`'s own source, read directly, has
//     the identical `next(iter(rel_source), None)` idiom).
//   - Types (`IfcTypeObject`, e.g. a wall type): linked via a plain forward LIST
//     attribute on the type itself, `HasPropertySets` -- no relationship entity
//     involved at all, just `product.HasPropertySets = [...existing, pset]`. No
//     reuse-or-create question even arises here since there's no separate rel to find;
//     every call just appends.
//
// This asymmetry is also why this function's return type is `EntityInstance | null`,
// not always the created/reused rel: `null` when `products` was empty, OR when
// `products` contained ONLY type elements (no rel is ever created/touched in that
// case) -- matching real Python's own docstring ("None if `products` is empty or has
// only type elements").
//
// No `OwnerHistory` update on the reused-rel path -- real Python's own source has none
// (unlike `../group/assignGroup.ts`'s own `updateOwnerHistory` call on its analogous
// reused-rel path); this is a genuine asymmetry between the two real Python source
// files, not an omission introduced by this port. Confirmed by reading `assign_pset.py`
// directly, not assumed from `assign_group.py`'s shape.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";

/** Local by-identity set -- see `../group/assignGroup.ts`'s identical helper's own doc comment. */
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
	get size(): number {
		return this.byIdentity.size;
	}
}

export interface AssignPsetSettings {
	/** Elements (or element types) to assign the pset to. */
	products: readonly EntityInstance[];
	/** The property set (or quantity set) to assign. */
	pset: EntityInstance;
}

function assignPsetUsecase(file: IfcFile, settings: AssignPsetSettings): EntityInstance | null {
	const { pset } = settings;
	const isIfc2x3 = file.schema === "IFC2X3";

	const productsOccurrences = new EntityInstanceSet();
	const productsTypes = new EntityInstanceSet();
	for (const product of settings.products) {
		if (product.isA("IfcTypeProduct")) {
			productsTypes.add(product);
		} else {
			productsOccurrences.add(product);
		}
	}

	let rel: EntityInstance | null = null;
	// Check occurrences using pset.
	if (productsOccurrences.size) {
		const rels = pset.get(isIfc2x3 ? "PropertyDefinitionOf" : "DefinesOccurrence") as EntityInstance[];
		rel = rels.length ? rels[0] : null;
		if (rel) {
			const objs = new EntityInstanceSet();
			objs.update(rel.get("RelatedObjects") as EntityInstance[]);
			objs.update(productsOccurrences.values());
			rel.set("RelatedObjects", objs.values());
		} else {
			rel = file.createEntity(
				"IfcRelDefinesByProperties",
				guid.new(),
				createOwnerHistory(file, {}),
				null, // Name
				null, // Description
				productsOccurrences.values(), // RelatedObjects
				pset, // RelatingPropertyDefinition
			);
		}
	}

	for (const product of productsTypes.values()) {
		const psets = (product.get("HasPropertySets") as EntityInstance[] | null) ?? [];
		product.set("HasPropertySets", [...psets, pset]);
	}

	return rel;
}

/**
 * Assigns a property set to the provided elements (Python: `ifcopenshell.api.pset.assign_pset`).
 *
 * This method can be used to make psets shared by multiple elements.
 *
 * @returns `null` if `products` is empty or has only type elements. The
 * `IfcRelDefinesByProperties` if `products` contains occurrences.
 *
 * @example
 * ```ts
 * const element = api.root.createEntity(model, { ifcClass: "IfcWall" });
 * api.pset.assignPset(model, { products: [element], pset });
 * // Pset is now assigned.
 * ```
 */
export const assignPset = wrapUsecase("pset.assign_pset", assignPsetUsecase);
