// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/spatial/dereference_structure.py` (src/ifcopenshell-python,
// 82 lines) -- removes a list of products from a spatial structure's
// `IfcRelReferencedInSpatialStructure`(s). No geometry/aggregate dependency (see
// `assignContainer.ts`'s header comment for that function's own, different, story).
//
// --- The asymmetric counterpart to `referenceStructure.ts`'s "first rel only" quirk ---
//
// Unlike `referenceStructure.ts` (which only ever reads/merges into the *first* rel in
// `structure.ReferencesElements`, `next(iter(...))`), this function iterates *every*
// rel in `relating_structure.ReferencesElements`, skipping ones that don't intersect
// `products` at all (`if not related_elements.intersection(products_set): continue`)
// and rewriting-or-deleting the ones that do -- see `referenceStructure.ts`'s own
// header comment for why this asymmetry exists in the real Python source and is
// preserved verbatim here rather than "fixed" to match the other function's
// single-rel assumption.

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

export interface DereferenceStructureSettings {
	/** The list of physical `IfcElement`s that exist in the space. */
	products: readonly EntityInstance[];
	/** The `IfcSpatialStructureElement` (e.g. `IfcBuilding`, `IfcBuildingStorey`, `IfcSpace`) to dereference the products from. */
	relatingStructure: EntityInstance;
}

function dereferenceStructureUsecase(file: IfcFile, settings: DereferenceStructureSettings): void {
	const productsSet = new EntityInstanceSet();
	productsSet.update(settings.products);

	const referencesElements = settings.relatingStructure.get("ReferencesElements") as EntityInstance[];
	for (const rel of referencesElements) {
		const relatedElements = new EntityInstanceSet();
		relatedElements.update(rel.get("RelatedElements") as EntityInstance[]);
		const intersects = productsSet.values().some((p) => relatedElements.has(p));
		if (!intersects) {
			continue;
		}

		const remaining = relatedElements.values().filter((e) => !productsSet.has(e));
		if (remaining.length > 0) {
			rel.set("RelatedElements", remaining);
			updateOwnerHistory(file, { element: rel });
		} else {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}
}

/**
 * Dereferences a list of products from a spatial structure (Python:
 * `ifcopenshell.api.spatial.dereference_structure`).
 */
export const dereferenceStructure = wrapUsecase("spatial.dereference_structure", dereferenceStructureUsecase);
