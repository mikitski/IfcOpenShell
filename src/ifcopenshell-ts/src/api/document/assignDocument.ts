// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/document/assign_document.py` (src/ifcopenshell-python, 104
// lines) -- see `./index.ts`'s own header comment for the module's overall scope.
// Assigns `document` (typically an `IfcDocumentReference`, though real Python also
// permits an `IfcDocumentInformation` directly) to a list of `products`, reusing an
// existing `IfcRelAssociatesDocument` if one already relates `document` to *some*
// products, or creating a new one otherwise.
//
// --- Real Python quirk, disclosed not "fixed": NO non-`IfcRoot` support, unlike the
//     sibling `api.classification.addReference` ---
//
// Real Python's own inline comment says it outright: `# TODO: do we need to support
// non-ifcroot elements like we do in classification.add_reference?` -- unlike
// `api.classification.addReference`/`removeReference` (this project's own explicit
// structural precedent for this chunk, per the task brief), `assign_document`/
// `unassign_document` (`./unassignDocument.ts`) do NOT branch on `IfcRoot`-vs-not and
// NEVER touch `IfcExternalReferenceRelationship` at all -- every product, rooted or not,
// goes through a single `IfcRelAssociatesDocument`/`RelatedObjects` list regardless of
// schema. This is a real, disclosed asymmetry between the two structurally-similar
// modules (not a gap this port introduces) -- ported verbatim, not "fixed" to add the
// non-rooted branch classification has. In practice, passing a non-`IfcRoot` `product`
// here works anyway (`RelatedObjects` on `IfcRelAssociatesDocument` is untyped/whatever
// the low-level API accepts) but produces a schema-invalid file on IFC4+ (`.d.ts`'s
// `RelatedObjects: (IfcObjectDefinition | IfcPropertyDefinition)[]` type), and outright
// throws when `.HasAssociations`/`.RelatedObjects` is accessed on IFC2X3's stricter
// `RelatedObjects: IfcRoot[]` -- exactly matching real Python's own unguarded behavior.
//
// --- `document.is_a()` dispatch on `IfcDocumentReference`/`IfcDocumentInformation`,
//     ported via `.isA(...)` checks in the same order ---
//
// IFC4+ reads the existing rel via `document.DocumentRefForObjects` (a reference) or
// `document.DocumentInfoForObjects` (an information) -- both inverse attributes not in
// the generated `.d.ts`s (see `util/element.ts`'s `REFERENCE_TYPES` table, which already
// lists `DocumentRefForObjects`/`DocumentInfoForObjects` for exactly this purpose,
// confirmed against the real Python source). IFC2X3 has neither inverse attribute at
// all, so it instead scans every `IfcRelAssociatesDocument` for one whose
// `RelatingDocument` equals `document`, regardless of which of the two classes
// `document` actually is.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
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

	get size(): number {
		return this.byIdentity.size;
	}

	toArray(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

/** Python's `set(a) - b`, by identity. */
function differenceByIdentity(a: Iterable<EntityInstance>, b: Set<EntityInstance>): EntityInstance[] {
	const bIds = new Set([...b].map((i) => i.identity()));
	const result = new EntityInstanceSet();
	for (const item of a) {
		if (!bIds.has(item.identity())) result.add(item);
	}
	return result.toArray();
}

export interface AssignDocumentSettings {
	/** The list of objects to associate the document to. */
	products: readonly EntityInstance[];
	/** The `IfcDocumentReference` to associate to (or, not recommended, an `IfcDocumentInformation`). */
	document: EntityInstance;
}

function assignDocumentUsecase(file: IfcFile, settings: AssignDocumentSettings): EntityInstance | undefined {
	const { document } = settings;

	// NOTE: reuses the same shape as `library.assignReference` -- see header comment.
	const referencedElements = elementUtil.getReferencedElements(document);
	const productsSet = differenceByIdentity(settings.products, referencedElements);

	if (productsSet.length === 0) return undefined;

	let rel: EntityInstance | null;
	if (file.schema === "IFC2X3") {
		rel =
			file
				.byType("IfcRelAssociatesDocument")
				.find((r) => (r.get("RelatingDocument") as EntityInstance | null)?.equals(document)) ?? null;
	} else {
		const ifcClass = document.isA();
		if (ifcClass === "IfcDocumentReference") {
			rel = (document.get("DocumentRefForObjects") as EntityInstance[])[0] ?? null;
		} else if (ifcClass === "IfcDocumentInformation") {
			rel = (document.get("DocumentInfoForObjects") as EntityInstance[])[0] ?? null;
		} else {
			throw new Error(`Unexpected document type: ${ifcClass}`);
		}
	}

	if (!rel) {
		// IfcRelAssociatesDocument: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
		// RelatedObjects(4), RelatingDocument(5) -- see `./addInformation.ts`'s header
		// comment (identical across all 3 schemas).
		return file.createEntity(
			"IfcRelAssociatesDocument",
			guid.new(),
			createOwnerHistory(file, {}),
			null,
			null,
			productsSet,
			document,
		);
	}

	const relatedObjects = new EntityInstanceSet();
	relatedObjects.update(rel.get("RelatedObjects") as EntityInstance[]);
	relatedObjects.update(productsSet);
	rel.set("RelatedObjects", relatedObjects.toArray());
	updateOwnerHistory(file, { element: rel });
	return rel;
}

/**
 * Assigns a document to a list of products (Python:
 * `ifcopenshell.api.document.assign_document`).
 *
 * An object may be assigned to zero, one, or multiple documents. Almost any object or
 * property may be assigned to a document, though typically we'd only use it for spaces,
 * types, physical products and schedules. Adding a new assignment is typically done
 * using a document reference and an object. IFC technically allows association with a
 * document information and an object, but this is not encouraged because it is not
 * consistent with other external relationships (such as classification systems or
 * libraries).
 *
 * @returns The `IfcRelAssociatesDocument` relationship, or `undefined` if `products` was
 *   empty or all products were already assigned to `document`.
 *
 * @example
 * ```ts
 * const document = api.document.addInformation(model, {});
 * api.document.editInformation(model, {
 *   information: document,
 *   attributes: { Identification: "A-GA-6100", Name: "Overall Plan", Location: "A-GA-6100 - Overall Plan.pdf" },
 * });
 * const reference = api.document.addReference(model, { information: document });
 *
 * // Let's imagine `storey` represents an IfcBuildingStorey for the ground floor.
 * api.document.assignDocument(model, { products: [storey], document: reference });
 * ```
 */
export const assignDocument = wrapUsecase("document.assign_document", assignDocumentUsecase);
