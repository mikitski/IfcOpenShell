// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/document/unassign_document.py` (src/ifcopenshell-python, 77
// lines) -- see `./index.ts`'s own header comment for the module's overall scope. Removes
// `products` from any `IfcRelAssociatesDocument` associating them with `document`,
// deleting the relationship entirely once it has no `RelatedObjects` left.
//
// --- Real Python quirk, disclosed not "fixed": same NO non-`IfcRoot` support as
//     `./assignDocument.ts` ---
//
// Same asymmetry as `assignDocument` (see that file's header comment for the full
// writeup, including real Python's own `# TODO: do we need to support non-ifcroot
// elements like we do in classification.add_reference?` comment) -- `unassign_document`
// reads `product.HasAssociations` unconditionally for every product, with no
// `IfcExternalReferenceRelationship`/non-rooted branch at all, unlike
// `api.classification.removeReference`. Ported verbatim.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/** Python's `set()`/dedup-by-identity idiom -- see `../classification/addReference.ts`'s identical, independently re-declared local helper for the full rationale. */
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

export interface UnassignDocumentSettings {
	/** The list of objects that the document reference/information is related to. */
	products: readonly EntityInstance[];
	/** The `IfcDocumentReference` (typically) or `IfcDocumentInformation` associated with `products`. */
	document: EntityInstance;
}

function unassignDocumentUsecase(file: IfcFile, settings: UnassignDocumentSettings): void {
	const { document } = settings;

	// NOTE: reuses the same shape as `library.unassignReference` -- see header comment.
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
				rel.isA("IfcRelAssociatesDocument") && (rel.get("RelatingDocument") as EntityInstance | null)?.equals(document),
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
 * Unassigns a document and an association to the list of products (Python:
 * `ifcopenshell.api.document.unassign_document`).
 *
 * @example
 * ```ts
 * const document = api.document.addInformation(model, {});
 * const reference = api.document.addReference(model, { information: document });
 * api.document.assignDocument(model, { products: [storey], document: reference });
 *
 * // Now let's change our mind and remove the association.
 * api.document.unassignDocument(model, { products: [storey], document: reference });
 * ```
 */
export const unassignDocument = wrapUsecase("document.unassign_document", unassignDocumentUsecase);
