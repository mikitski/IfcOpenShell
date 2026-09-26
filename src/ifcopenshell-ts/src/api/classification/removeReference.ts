// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/classification/remove_reference.py` (src/ifcopenshell-
// python, 118 lines) -- the "detach vs. fully delete" structural counterpart to
// `../group/removeGroup.ts`/`../pset/removePset.ts` (this chunk's own explicit
// precedent per the task brief): detaches `products` from `reference`'s
// `IfcRelAssociatesClassification`/`IfcExternalReferenceRelationship` (deleting the rel
// entirely if `products` was its only member), then deletes `reference` itself ONLY if
// no product anywhere is left referencing it (`get_referenced_elements` re-checked
// AFTER detaching, matching real Python's own "TODO: we only handle lightweight
// classifications here" comment, ported verbatim below).
//
// --- Real Python quirk, disclosed not "fixed": the early-return doesn't scope the rest ---
//
// `products_set = set(products); products_set -= products_set.difference(referenced)`
// computes the INTERSECTION of `products` with what's actually referenced, and the
// function returns early only if that intersection is EMPTY (no product in `products`
// is actually assigned this reference at all -- a genuine no-op). But the
// `rooted_products`/`non_rooted_products` partition just below it iterates the
// ORIGINAL `products` parameter, not the filtered `products_set` -- so once at least
// ONE product is confirmed referenced, every originally-passed product (including ones
// that were never actually referenced by `reference` at all) gets processed by the
// detach logic below. This is harmless in practice (subtracting a non-member from a
// rel's `RelatedObjects` is a no-op), but it IS a real asymmetry in the real Python
// source -- ported verbatim via `settings.products`, not narrowed to the
// already-computed intersection.
//
// --- `getattr(product, "HasExternalReferences", None) or getattr(product,
//     "HasExternalReference", [])`, ported via the same idiom `util/classification.ts`'s
//     `getReferences` already established for this exact schema-naming inconsistency ---
//
// (Real Python: `rels = getattr(product, "HasExternalReferences", None); if rels is
// None: rels = getattr(product, "HasExternalReference", [])` -- two differently-named
// inverse attributes across different resource-object classes; see this port's local
// `getExternalReferenceRels` helper below, mirroring `util/classification.ts`'s
// `attrOrMissing`-based pattern for the identical shape.)

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/**
 * Python's `set()`/dedup-by-identity idiom -- see `./addReference.ts`'s identical,
 * independently re-declared local helper (not exported from either file, matching this
 * project's established per-file re-declaration convention) for the full rationale.
 */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();

	add(instance: EntityInstance): void {
		this.byIdentity.set(instance.identity(), instance);
	}

	update(instances: Iterable<EntityInstance>): void {
		for (const instance of instances) this.add(instance);
	}

	get size(): number {
		return this.byIdentity.size;
	}

	toArray(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

/** Python's `set(a) - b`, by identity. */
function differenceByIdentity(a: Iterable<EntityInstance>, b: EntityInstanceSet): EntityInstance[] {
	const bIds = new Set(b.toArray().map((i) => i.identity()));
	const result = new EntityInstanceSet();
	for (const item of a) {
		if (!bIds.has(item.identity())) result.add(item);
	}
	return result.toArray();
}

/** Python's `intersection` test used for the early-return check -- see this file's header comment. */
function intersectsByIdentity(a: readonly EntityInstance[], b: Set<EntityInstance>): boolean {
	const bIds = new Set([...b].map((i) => i.identity()));
	return a.some((item) => bIds.has(item.identity()));
}

const MISSING: unique symbol = Symbol("ifcopenshell.api.classification.removeReference: attribute not declared");

/** Python: `getattr(product, "HasExternalReferences", None) or getattr(product, "HasExternalReference", [])`. */
function getExternalReferenceRels(product: EntityInstance): EntityInstance[] {
	let primary: unknown;
	try {
		primary = product.get("HasExternalReferences");
	} catch {
		primary = MISSING;
	}
	if (primary !== MISSING && primary !== null) return primary as EntityInstance[];

	let fallback: unknown;
	try {
		fallback = product.get("HasExternalReference");
	} catch {
		fallback = MISSING;
	}
	return fallback === MISSING || fallback === null ? [] : (fallback as EntityInstance[]);
}

export interface RemoveReferenceSettings {
	/** The `IfcClassificationReference` entity of the relationship you want to remove. */
	reference: EntityInstance;
	/** The list of object entities of the relationship you want to remove. */
	products: readonly EntityInstance[];
}

function removeReferenceUsecase(file: IfcFile, settings: RemoveReferenceSettings): void {
	const { reference, products } = settings;
	const isIfc2x3 = file.schema === "IFC2X3";

	const referenced = elementUtil.getReferencedElements(reference);
	if (!intersectsByIdentity(products, referenced)) {
		// All products are already unassigned from this reference.
		return;
	}

	// Real Python partitions the ORIGINAL `products` here, not the referenced-only
	// subset computed above -- see this file's header comment.
	const rootedProducts = new EntityInstanceSet();
	const nonRootedProducts = new EntityInstanceSet();
	for (const product of products) {
		if (product.isA("IfcRoot")) {
			rootedProducts.add(product);
		} else {
			nonRootedProducts.add(product);
		}
	}

	// Real Python's own error message says "Cannot ADD reference..." here too -- a
	// verbatim copy-paste from `add_reference.py`'s identical guard, never corrected for
	// `remove_reference.py`'s own context. Reproduced as-is, not "fixed" to say "remove".
	if (nonRootedProducts.size > 0 && isIfc2x3) {
		throw new TypeError(`Cannot add reference to non-IfcRoot element in IFC2X3: ${nonRootedProducts.toArray()}.`);
	}

	if (rootedProducts.size > 0) {
		const referenceRels = new EntityInstanceSet();
		for (const product of rootedProducts.toArray()) {
			referenceRels.update(product.get("HasAssociations") as EntityInstance[]);
		}

		const matchingRels = referenceRels
			.toArray()
			.filter(
				(rel) =>
					rel.isA("IfcRelAssociatesClassification") &&
					(rel.get("RelatingClassification") as EntityInstance | null)?.equals(reference),
			);

		for (const rel of matchingRels) {
			const relatedObjects = differenceByIdentity(rel.get("RelatedObjects") as EntityInstance[], rootedProducts);
			if (relatedObjects.length > 0) {
				rel.set("RelatedObjects", relatedObjects);
				updateOwnerHistory(file, { element: rel });
			} else {
				const history = rel.get("OwnerHistory") as EntityInstance | null;
				file.remove(rel);
				if (history) elementUtil.removeDeep2(file, history);
			}
		}
	}

	if (nonRootedProducts.size > 0) {
		const referenceRels = new EntityInstanceSet();
		for (const product of nonRootedProducts.toArray()) {
			referenceRels.update(getExternalReferenceRels(product));
		}

		const matchingRels = referenceRels
			.toArray()
			.filter((rel) => (rel.get("RelatingReference") as EntityInstance | null)?.equals(reference));

		for (const rel of matchingRels) {
			const relatedObjects = differenceByIdentity(
				rel.get("RelatedResourceObjects") as EntityInstance[],
				nonRootedProducts,
			);
			if (relatedObjects.length > 0) {
				rel.set("RelatedResourceObjects", relatedObjects);
			} else {
				file.remove(rel);
			}
		}
	}

	// TODO: we only handle lightweight classifications here (ported verbatim from the
	// real Python source's own inline comment).
	const referencedElements = elementUtil.getReferencedElements(reference);
	if (referencedElements.size === 0) {
		file.remove(reference);
	}
}

/**
 * Removes a classification reference from the list of products (Python:
 * `ifcopenshell.api.classification.remove_reference`).
 *
 * If the classification reference is no longer associated to any products, the
 * classification reference itself is also removed.
 *
 * @throws {TypeError} If `file` is IFC2X3 and `products` has non-`IfcRoot` elements.
 *
 * @example
 * ```ts
 * api.classification.removeReference(model, { reference, products: [wallType] });
 * ```
 */
export const removeReference = wrapUsecase("classification.remove_reference", removeReferenceUsecase);
