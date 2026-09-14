// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/unassign_material.py` (src/ifcopenshell-python,
// 135 lines) -- chunk 1 of `api.material` (see `./index.ts`'s own header comment).
// Reverses `./assignMaterial.ts` (which calls this internally as its own first step,
// unconditionally, on any product being reassigned). Also, independently, the exact
// function `../root/removeProduct.ts`'s `IfcRelAssociatesMaterial` branch used to throw
// for (see `index.ts`'s header comment) -- now wired up for real.
//
// A product can only have one material assigned to it, which is why it's not
// necessary to specify the material to unassign -- the material entity itself is
// never removed, only the association relationship.
//
// Unassigning a LayerSet/ProfileSet from a TYPE also removes all "Usage" wrappers of
// that set on the type's own occurrences (`removeMaterialUsagesFromTypes` below) --
// this is a real, deliberate cascade, not a side effect this port introduces.
//
// No sibling `api.material` dependency of any kind (only bare `ifcopenshell.util
// .element` and `ifcopenshell.api.owner` imports in the real source) -- fully
// self-contained, confirmed by reading the full 135-line source directly.
//
// --- IFC2X3-vs-IFC4+ schema branch in `removeMaterialUsagesFromTypes`, verified ---
//
// IFC2X3 has no `IfcMaterialUsageDefinition` abstract supertype and no
// `IfcMaterialProfileSetUsage`/`.AssociatedTo` inverse attribute at all (only
// `IfcMaterialLayerSetUsage` exists on IFC2X3, and it must be reached back to its
// owning `IfcRelAssociatesMaterial` via a second `get_inverse` hop, not a direct
// `.AssociatedTo`) -- real Python's own comment ("in IFC2X3 there is no
// .AssociatedTo") is reproduced verbatim in the branch below. On IFC4+, every
// `IfcMaterialUsageDefinition` (both `IfcMaterialLayerSetUsage`/
// `IfcMaterialProfileSetUsage`) has a direct `.AssociatedTo` inverse.
//
// --- `unassign_materials`' `while associations:` loop -- ported with a mutable,
// by-identity set, not a plain array, since Python relies on real set semantics
// (arbitrary-order removal, `issubset`) ---
//
// One real, easy-to-miss ordering dependency: `material_inverses.issubset(associations)`
// is evaluated BEFORE `associations.remove(rel)` runs for the current `rel` -- i.e.
// `rel` itself (which is always one of `material`'s own inverses, since
// `rel.RelatingMaterial == material`) is still counted as present in `associations` at
// check time. Ported with the same ordering (the "delete `rel` from the working set"
// step happens strictly after the `issubset`-guarded conditional removal of `material`
// itself), not reordered for readability -- reordering would make the subset check
// spuriously fail whenever `material` has exactly one inverse (`rel` itself), wrongly
// refusing to clean up an orphaned Usage entity that should be removed.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getMaterial, removeDeep2 } from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/** Local by-identity set, with removal support (unlike `../type/unassignType.ts`'s read-only sibling) -- needed here for `unassignMaterials`' `while associations:` loop. */
class MutableEntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}
	update(instances: Iterable<EntityInstance | null | undefined>): void {
		for (const instance of instances) this.add(instance);
	}
	delete(instance: EntityInstance): void {
		this.byIdentity.delete(instance.identity());
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

function removeMaterialUsagesFromTypes(file: IfcFile, products: readonly EntityInstance[]): void {
	for (const product of products) {
		if (!product.isA("IfcTypeObject")) continue;
		const material = getMaterial(product);
		if (!material) continue;
		if (material.isA() !== "IfcMaterialLayerSet" && material.isA() !== "IfcMaterialProfileSet") continue;

		// Remove set usages. TODO (real Python's own TODO, ported verbatim): be more
		// considerate and remove only usages associated with the set + product type,
		// not all usages?
		for (const inverse of file.getInverse(material) as Set<EntityInstance>) {
			if (file.schema === "IFC2X3") {
				if (!inverse.isA("IfcMaterialLayerSetUsage")) continue;
				// In IFC2X3 there is no .AssociatedTo.
				for (const inverse2 of file.getInverse(inverse) as Set<EntityInstance>) {
					if (inverse2.isA("IfcRelAssociatesMaterial")) {
						const history = inverse2.get("OwnerHistory") as EntityInstance | null;
						file.remove(inverse2);
						if (history) removeDeep2(file, history);
					}
				}
			} else {
				if (!inverse.isA("IfcMaterialUsageDefinition")) continue;
				const associatedTo = (inverse.get("AssociatedTo") as EntityInstance[] | null) ?? [];
				for (const rel of associatedTo) {
					const history = rel.get("OwnerHistory") as EntityInstance | null;
					file.remove(rel);
					if (history) removeDeep2(file, history);
				}
			}
			file.remove(inverse);
		}
	}
}

function unassignMaterials(file: IfcFile, products: MutableEntityInstanceSet): void {
	const associations = new MutableEntityInstanceSet();
	for (const product of products.values()) {
		associations.update(product.get("HasAssociations") as EntityInstance[]);
	}

	// we ensure that `associations` won't have removed elements to avoid crash during
	// `material_inverses.issubset(associations)`.
	while (associations.size > 0) {
		const rel = associations.values()[0];

		if (!rel.isA("IfcRelAssociatesMaterial")) {
			associations.delete(rel);
			continue;
		}

		const material = rel.get("RelatingMaterial") as EntityInstance;
		const relatedObjects = (rel.get("RelatedObjects") as EntityInstance[]).filter((o) => !products.has(o));

		if (material.isA("IfcMaterialLayerSetUsage") || material.isA("IfcMaterialProfileSetUsage")) {
			// Warning (real Python's own comment, ported verbatim): this may leave the
			// model in a non-compliant state.
			const materialInverses = file.getInverse(material) as Set<EntityInstance>;
			const allContained = [...materialInverses].every((inv) => associations.has(inv));
			if (allContained && relatedObjects.length === 0) {
				file.remove(material);
			}
		}
		associations.delete(rel);

		if (relatedObjects.length === 0) {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) removeDeep2(file, history);
			continue;
		}
		rel.set("RelatedObjects", relatedObjects);
		updateOwnerHistory(file, { element: rel });
	}
}

export interface UnassignMaterialSettings {
	/** The list of `IfcProduct`s that may or may not have a material. */
	products: readonly EntityInstance[];
}

function unassignMaterialUsecase(file: IfcFile, settings: UnassignMaterialSettings): void {
	if (settings.products.length === 0) return;
	const products = new MutableEntityInstanceSet();
	products.update(settings.products);

	removeMaterialUsagesFromTypes(file, products.values());
	unassignMaterials(file, products);
}

/**
 * Removes any material relationship with the list of products (Python:
 * `ifcopenshell.api.material.unassign_material`).
 *
 * A product can only have one material assigned to it, which is why it's not
 * necessary to specify the material to unassign. The material itself is not removed,
 * only the relationship is removed.
 *
 * If the product does not have a material, nothing happens.
 *
 * Unassigning a LayerSet or ProfileSet from a product type also removes all "Usage"
 * wrappers of that set on the type's own occurrences.
 */
export const unassignMaterial = wrapUsecase("material.unassign_material", unassignMaterialUsecase);
