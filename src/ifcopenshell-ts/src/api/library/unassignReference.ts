// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/library/unassign_reference.py` (src/ifcopenshell-python, 76
// lines) -- see `./index.ts`'s own header comment for the module's overall scope.
// Removes `products` from any `IfcRelAssociatesLibrary` associating them with
// `reference`, deleting the relationship entirely once it has no `RelatedObjects` left.
//
// --- `../document/unassignDocument.ts`, not `../classification`, is this function's
//     real structural sibling -- see `./assignReference.ts`'s own header comment for the
//     full writeup (the identical, real Python `# TODO: do we need to support
//     non-ifcroot elements like we do in classification.add_reference?` comment appears
//     verbatim on this function too, confirmed directly against the real Python source).
//     `product.HasAssociations` is read unconditionally for every product, with no
//     `IfcExternalReferenceRelationship`/non-rooted branch at all, matching
//     `unassign_document.py` exactly. Ported verbatim.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/** Python's `set()`/dedup-by-identity idiom -- see `./assignReference.ts`'s identical, independently re-declared local helper for the full rationale. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();

	add(instance: EntityInstance): void {
		this.byIdentity.set(instance.identity(), instance);
	}

	update(instances: Iterable<EntityInstance>): void {
		for (const instance of instances) this.add(instance);
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

export interface UnassignReferenceSettings {
	/** The `IfcLibraryReference` to unassign from. */
	reference: EntityInstance;
	/** A list of `IfcProduct` elements to unassign from the reference. */
	products: readonly EntityInstance[];
}

function unassignReferenceUsecase(file: IfcFile, settings: UnassignReferenceSettings): void {
	const { reference } = settings;

	const productsSet = new EntityInstanceSet();
	productsSet.update(settings.products);

	const referenceRels = new EntityInstanceSet();
	for (const product of productsSet.toArray()) {
		referenceRels.update(product.get("HasAssociations") as EntityInstance[]);
	}

	const matchingRels = referenceRels
		.toArray()
		.filter(
			(rel) =>
				rel.isA("IfcRelAssociatesLibrary") && (rel.get("RelatingLibrary") as EntityInstance | null)?.equals(reference),
		);

	for (const rel of matchingRels) {
		const relatedObjects = differenceByIdentity(rel.get("RelatedObjects") as EntityInstance[], productsSet);
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

/**
 * Unassigns a product or products from a reference (Python:
 * `ifcopenshell.api.library.unassign_reference`).
 *
 * If the product isn't assigned to the reference, nothing will happen.
 *
 * @example
 * ```ts
 * const library = api.library.addLibrary(model, { name: "Brickschema" });
 * const reference = api.library.addReference(model, { library });
 * api.library.editReference(model, {
 *   reference,
 *   attributes: { Identification: "http://example.org/digitaltwin#AHU01" },
 * });
 *
 * const ahu = api.root.createEntity(model, { ifcClass: "IfcUnitaryEquipment", predefinedType: "AIRHANDLER" });
 * api.library.assignReference(model, { reference, products: [ahu] });
 *
 * // Let's change our mind and unassign it.
 * api.library.unassignReference(model, { reference, products: [ahu] });
 * ```
 */
export const unassignReference = wrapUsecase("library.unassign_reference", unassignReferenceUsecase);
