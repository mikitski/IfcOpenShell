// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/document/add_reference.py` (src/ifcopenshell-python, 71
// lines) -- see `./index.ts`'s own header comment for the module's overall scope.
// Creates a new `IfcDocumentReference` for `information` (or a standalone one, if
// `information` is `null`) -- a reference to the entire document, or (via a follow-up
// `editReference` call) to a particular page or chapter.
//
// --- Real IFC2X3-vs-IFC4+ schema difference, investigated not assumed (matches the
//     task brief's own prediction, confirmed directly) ---
//
// IFC2X3's `IfcDocumentReference` has only 3 attributes: `Location`(0)/`ItemReference`(1)/
// `Name`(2) -- no `Description`, and critically no `ReferencedDocument` forward link to
// the owning `IfcDocumentInformation` at all (confirmed against `ifc2x3.d.ts`). IFC4+ has
// 5: `Location`(0)/`Identification`(1)/`Name`(2)/`Description`(3)/`ReferencedDocument`(4)
// (confirmed against `ifc4.d.ts`/`ifc4x3.d.ts`). So on IFC2X3, real Python instead links
// the two entities the OTHER way around: appending the new reference onto
// `information.DocumentReferences` (a genuine forward, IFC2X3-only attribute on
// `IfcDocumentInformation` itself -- see `./addInformation.ts`'s header comment; not to
// be confused with IFC4+'s `HasDocumentReferences` INVERSE attribute, which doesn't
// exist as a settable list on IFC2X3). Ported verbatim via the same schema branch.
//
// No DERIVE-attribute-interleaving gotcha (verified directly): `IfcDocumentReference`
// declares no DERIVE attributes in any of the 3 schemas.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddReferenceSettings {
	/** The `IfcDocumentInformation` that the reference will be created for, or `null`/`undefined` for a standalone reference. */
	information?: EntityInstance | null;
}

function addReferenceUsecase(file: IfcFile, settings: AddReferenceSettings): EntityInstance {
	const { information } = settings;

	if (file.schema === "IFC2X3") {
		// IfcDocumentReference (IFC2X3): Location(0), ItemReference(1), Name(2) -- see
		// header comment.
		const reference = file.createEntity("IfcDocumentReference", null, "X");
		if (information) {
			const references = [...((information.get("DocumentReferences") as EntityInstance[] | null) ?? [])];
			references.push(reference);
			information.set("DocumentReferences", references);
		}
		return reference;
	}
	// IfcDocumentReference (IFC4+): Location(0), Identification(1), Name(2),
	// Description(3), ReferencedDocument(4).
	return file.createEntity("IfcDocumentReference", null, "X", null, null, information ?? null);
}

/**
 * Creates a new reference to a document to assign to products (Python:
 * `ifcopenshell.api.document.add_reference`).
 *
 * A document may be associated with physical products, tasks, cost items, and so on. In
 * order to associate a document with an object, a reference to that document needs to be
 * created -- either to the entire document, or (via a follow-up `editReference` call) to
 * a particular page or chapter. See {@link import("./assignDocument").assignDocument}
 * for more information.
 *
 * @example
 * ```ts
 * const document = api.document.addInformation(model, {});
 * api.document.editInformation(model, {
 *   information: document,
 *   attributes: { Identification: "A-GA-6100", Name: "Overall Plan", Location: "A-GA-6100 - Overall Plan.pdf" },
 * });
 *
 * // This reference is for the entire document, as opposed to a single page/chapter.
 * const reference = api.document.addReference(model, { information: document });
 *
 * // Alternatively, specify a single section, such as a subheading code.
 * const reference2 = api.document.addReference(model, { information: document });
 * api.document.editReference(model, { reference: reference2, attributes: { Identification: "2.1.15" } });
 * ```
 */
export const addReference = wrapUsecase("document.add_reference", addReferenceUsecase);
