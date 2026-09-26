// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/document/remove_information.py` (src/ifcopenshell-python, 70
// lines) -- see `./index.ts`'s own header comment for the module's overall scope.
// Removes `information` (an `IfcDocumentInformation`) along with: every reference
// belonging to it (`./removeReference.ts`, called for its side effects on any associated
// products too), every subdocument nested under it (recursively, via `IsPointer`, the
// forward `IfcDocumentInformationRelationship` this document owns as `RelatingDocument`),
// the now-single-member `IfcDocumentInformationRelationship` that pointed AT it (via
// `IsPointedTo`), and every `IfcRelAssociatesDocument` directly associating it with a
// product.
//
// --- The `IsPointer`/`IsPointedTo` recursive-deletion dance, ported carefully ---
//
// `IfcDocumentInformation` forms a tree via `IfcDocumentInformationRelationship`:
// `IsPointer` (this document as `RelatingDocument`, i.e. "I am the newer version, these
// are my older-revision children") and `IsPointedTo` (this document as one of
// `RelatedDocuments`, i.e. "I am an older revision, this rel points at me"). Both are
// inverse attributes, not in the generated `.d.ts` (accessed dynamically via `.get(...)`,
// matching this port's established convention for every other undeclared inverse
// attribute in this chunk -- see `./addInformation.ts`'s header comment).
//
// Removing `information` recursively removes every child under it FIRST (self-recursion
// through the wrapped, exported `removeInformation` below, not this plain
// `removeInformationUsecase` -- matching `../context/removeContext.ts`'s established
// self-recursion pattern and real Python's own recursive `ifcopenshell.api.document.
// remove_information(file, information=info)` call, which fires this usecase's own
// pre/post-listeners again for each child). The `IsPointedTo` check below
// (`rel.RelatedDocuments == (information,)`, ported as `.length === 1 &&
// [0].equals(information)`) only removes the now-emptied `IfcDocumentInformationRelationship`
// itself once `information` is its LAST remaining child -- relying on `IfcFile.remove`'s
// own automatic "splice a just-removed entity out of every list attribute referencing
// it" cascade (see `../classification/removeClassification.ts`'s own header comment for
// the identical mechanism, confirmed there against `IfcFile.remove`'s doc comment) to
// have already shrunk a multi-child relationship's `RelatedDocuments` down to just this
// one document by the time an EARLIER sibling's own `remove_information` call ran. This
// is a genuinely order-dependent real-Python behavior (verified directly against
// `test/api/document/test_remove_information.py`'s own
// `test_removing_all_references_of_an_information`, which asserts the
// `IfcDocumentInformationRelationship` survives removing one of two children and is only
// deleted once the SECOND child is also removed) -- ported verbatim, not "fixed" to
// eagerly prune the relationship's list itself.
//
// --- IFC2X3-vs-IFC4+ dispatch for both "find my references" and "find my rels", ported
//     verbatim ---
//
// `HasDocumentReferences` (IFC4+ inverse) vs. the IFC2X3-only forward `DocumentReferences`
// attribute (see `./addReference.ts`'s header comment for why IFC2X3 needs a forward
// attribute here at all). `DocumentInfoForObjects` (IFC4+ inverse) vs. a whole-file scan
// over `IfcRelAssociatesDocument` on IFC2X3 (no such inverse attribute exists there) --
// matching `util/element.ts`'s `REFERENCE_TYPES`/`getReferencedElements`'s own identical
// IFC2X3 fallback shape for this exact class.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { removeReference } from "./removeReference";

export interface RemoveInformationSettings {
	/** The `IfcDocumentInformation` to remove. */
	information: EntityInstance;
}

function removeInformationUsecase(file: IfcFile, settings: RemoveInformationSettings): void {
	const { information } = settings;
	const isIfc2x3 = file.schema === "IFC2X3";

	const references = isIfc2x3
		? ((information.get("DocumentReferences") as EntityInstance[] | null) ?? [])
		: (information.get("HasDocumentReferences") as EntityInstance[]);

	for (const reference of references) {
		removeReference(file, { reference });
	}

	const isPointer = (information.get("IsPointer") as EntityInstance[] | null) ?? [];
	for (const rel of isPointer) {
		for (const info of rel.get("RelatedDocuments") as EntityInstance[]) {
			// Recurses through the wrapped, exported `removeInformation` below -- see
			// header comment.
			removeInformation(file, { information: info });
		}
	}

	const isPointedTo = (information.get("IsPointedTo") as EntityInstance[] | null) ?? [];
	for (const rel of isPointedTo) {
		const relatedDocuments = rel.get("RelatedDocuments") as EntityInstance[];
		if (relatedDocuments.length === 1 && relatedDocuments[0].equals(information)) {
			// This relationship is non-rooted.
			file.remove(rel);
		}
	}

	const rels = isIfc2x3
		? file
				.byType("IfcRelAssociatesDocument")
				.filter((r) => (r.get("RelatingDocument") as EntityInstance | null)?.equals(information))
		: (information.get("DocumentInfoForObjects") as EntityInstance[]);

	for (const rel of rels) {
		const history = rel.get("OwnerHistory") as EntityInstance | null;
		file.remove(rel);
		if (history) elementUtil.removeDeep2(file, history);
	}
	file.remove(information);
}

/**
 * Removes a document information (Python: `ifcopenshell.api.document.remove_information`).
 *
 * All references and associations are also removed.
 *
 * @example
 * ```ts
 * const document = api.document.addInformation(model, {});
 * api.document.removeInformation(model, { information: document });
 * ```
 */
export const removeInformation = wrapUsecase("document.remove_information", removeInformationUsecase);
