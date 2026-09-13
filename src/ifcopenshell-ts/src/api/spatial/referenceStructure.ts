// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/spatial/reference_structure.py` (src/ifcopenshell-python,
// 119 lines) -- adds products to a spatial structure's weaker, multi-valued
// `IfcRelReferencedInSpatialStructure`, unlike `assignContainer.ts`'s single-valued
// `IfcRelContainedInSpatialStructure`. A product CAN reference multiple spatial
// structures simultaneously (e.g. a multistorey column contained in its lowermost
// storey but *referenced* in every storey it also passes through) -- so, unlike
// `assignContainer.ts`, there is no "remove the old relationship first" surgery here:
// new products are simply appended (list-union, `EntityInstanceSet`-deduplicated) into
// the target structure's existing rel, or a new rel is created if none exists yet. No
// geometry/aggregate dependency (unlike `assignContainer.ts`).
//
// --- A real, faithfully-preserved Python-source quirk: only the *first* rel is ever touched ---
//
// `rel = next(iter(structure.ReferencesElements), None)` looks at (and, if it exists,
// exclusively merges into) only the *first* `IfcRelReferencedInSpatialStructure` whose
// `RelatingStructure` is this `structure` -- not all of them. In practice a given
// structure should only ever have at most one such rel (this function itself is the
// only thing that ever creates one, and always merges into the existing one rather
// than creating a second), so this is normally a non-issue. But `util/element.ts`'s
// `getStructureReferencedElements` (this function's own read-side counterpart) unions
// `RelatedElements` across *every* rel in `structure.ReferencesElements`, not just the
// first -- an asymmetry that would only actually diverge if some other code path ever
// created a second `IfcRelReferencedInSpatialStructure` for the same structure (this
// module's own `dereferenceStructure.ts`, by contrast, iterates *all* of them -- see
// that file's own header comment for the same asymmetry from the other direction).
// Ported verbatim (both the `next(iter(...))`-first-only behavior here and
// `getStructureReferencedElements`'s all-rels union), not "fixed" to be
// internally consistent, since the real Python source itself is exactly this
// asymmetric and there's no indication it's an accidental bug rather than a
// (harmless, given the "this function is the only writer" invariant) simplification.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { getStructureReferencedElements } from "../../util/element";
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
	has(instance: EntityInstance | null | undefined): boolean {
		if (!instance) return false;
		return this.byIdentity.has(instance.identity());
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
	get size(): number {
		return this.byIdentity.size;
	}
}

export interface ReferenceStructureSettings {
	/** The list of physical `IfcElement`s that exist in the space. */
	products: readonly EntityInstance[];
	/** The `IfcSpatialStructureElement` (e.g. `IfcBuilding`, `IfcBuildingStorey`, `IfcSpace`) the products reference. */
	relatingStructure: EntityInstance;
}

function referenceStructureUsecase(file: IfcFile, settings: ReferenceStructureSettings): EntityInstance | undefined {
	const structure = settings.relatingStructure;

	const productsSet = new EntityInstanceSet();
	productsSet.update(settings.products);
	if (productsSet.size === 0) {
		return undefined;
	}

	const referenced = new EntityInstanceSet();
	referenced.update(getStructureReferencedElements(structure));
	const productsToAssign = productsSet.values().filter((p) => !referenced.has(p));

	const referencesElements = structure.get("ReferencesElements") as EntityInstance[];
	let rel: EntityInstance | null = referencesElements[0] ?? null;

	if (productsToAssign.length === 0) {
		return rel ?? undefined;
	}

	if (!rel) {
		rel = file.createEntity(
			"IfcRelReferencedInSpatialStructure",
			guid.new(),
			createOwnerHistory(file, {}),
			null, // Name
			null, // Description
			productsToAssign, // RelatedElements
			structure, // RelatingStructure
		);
	} else {
		const relatedElements = new EntityInstanceSet();
		relatedElements.update(rel.get("RelatedElements") as EntityInstance[]);
		relatedElements.update(productsToAssign);
		rel.set("RelatedElements", relatedElements.values());
		updateOwnerHistory(file, { element: rel });
	}

	return rel;
}

/**
 * Denotes that a list of products is related to a spatial structure (Python:
 * `ifcopenshell.api.spatial.reference_structure`).
 *
 * This is similar to `assignContainer`, except that containment can only occur
 * between a product and a single spatial structure element. This is fine if a wall is
 * on level 1, but not appropriate if you have a multistorey column on multiple
 * levels, or a door with a to and from space, or a stair going from one floor to
 * another floor. This is where spatial referencing is used.
 *
 * Typically, the product will be contained in the lowermost, constructed first, or
 * primarily accessible space. For a multistorey column or stair, the column or stair
 * will therefore be contained in the lowermost storey. Then, any other storeys will
 * be referenced.
 *
 * Referencing is non-hierarchical, so a door may be referenced in multiple spaces
 * simultaneously.
 *
 * @returns The `IfcRelReferencedInSpatialStructure` relationship instance, or
 * `undefined` if `products` was an empty list.
 */
export const referenceStructure = wrapUsecase("spatial.reference_structure", referenceStructureUsecase);
