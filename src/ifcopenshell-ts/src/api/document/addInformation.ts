// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/document/add_information.py` (src/ifcopenshell-python, 84
// lines) -- see `./index.ts`'s own header comment for the module's overall scope. Adds
// a new `IfcDocumentInformation` (a drawing, specification, schedule, certificate, etc)
// and relates it either to `IfcProject`/`IfcContext` (via a new
// `IfcRelAssociatesDocument`) or to another `IfcDocumentInformation` as a subdocument
// (via `IfcDocumentInformationRelationship`, reusing an existing relationship's
// `RelatedDocuments` list if `parent` already has one).
//
// --- `IfcDocumentInformation`'s attribute order, verified not assumed ---
//
// `DocumentId`(IFC2X3)|`Identification`(IFC4+)(0)/`Name`(1) sit at the SAME positions in
// all 3 schemas (confirmed against `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`) despite the
// attribute rename -- unlike `IfcDocumentReference` below, no schema branching is needed
// here to fill these two positions. No DERIVE-attribute-interleaving gotcha (verified
// directly): `IfcDocumentInformation` declares no DERIVE attributes in any of the 3
// schemas.
//
// --- `IfcRelAssociatesDocument`'s attribute order, verified not assumed ---
//
// `GlobalId`(0)/`OwnerHistory`(1)/`Name`(2)/`Description`(3)/`RelatedObjects`(4)/
// `RelatingDocument`(5) -- identical and contiguous across all 3 schemas (IFC2X3's
// `OwnerHistory` is non-nullable there, but still the same position). No DERIVE gotcha.
//
// --- Real IFC2X3-vs-IFC4+ schema difference in `IfcDocumentInformationRelationship`,
//     investigated not assumed (a NEW finding, not called out by the task brief) ---
//
// IFC2X3's `IfcDocumentInformationRelationship` has only 3 attributes:
// `RelatingDocument`(0)/`RelatedDocuments`(1)/`RelationshipType`(2) -- no `Name`/
// `Description` at all. IFC4+ has 5: `Name`(0)/`Description`(1)/`RelatingDocument`(2)/
// `RelatedDocuments`(3)/`RelationshipType`(4) -- `Name`/`Description` prepended, shifting
// `RelatingDocument`/`RelatedDocuments` two positions later (confirmed directly against
// all 3 generated `.d.ts`s). Real Python's `file.create_entity(..., RelatingDocument=...,
// RelatedDocuments=...)` uses kwargs, so this shift is invisible there; this port's
// positional `createEntity` must branch on `file.schema` to fill the right positions --
// see the `IsPointer`-vs-not branch below.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";

export interface AddInformationSettings {
	/** The parent document, if this is a subdocument (older revision) of an existing one. */
	parent?: EntityInstance | null;
}

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

function addInformationUsecase(file: IfcFile, settings: AddInformationSettings): EntityInstance {
	// IfcDocumentInformation: DocumentId|Identification(0), Name(1) -- see header comment.
	const information = file.createEntity("IfcDocumentInformation", "X", "Unnamed");

	let parent = settings.parent ?? null;
	if (!parent) {
		parent = file.byType("IfcProject")[0] ?? null;
		if (!parent) {
			throw new Error("IfcProject is not found.");
		}
	}

	if (parent.isA("IfcProject") || parent.isA("IfcContext")) {
		// IfcRelAssociatesDocument: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
		// RelatedObjects(4), RelatingDocument(5) -- see header comment.
		file.createEntity(
			"IfcRelAssociatesDocument",
			guid.new(),
			createOwnerHistory(file, {}),
			null,
			null,
			[parent],
			information,
		);
	} else if (parent.isA("IfcDocumentInformation")) {
		const isPointer = (parent.get("IsPointer") as EntityInstance[] | null) ?? [];
		if (isPointer.length > 0) {
			const rel = isPointer[0];
			const documents = new EntityInstanceSet();
			documents.update(rel.get("RelatedDocuments") as EntityInstance[]);
			documents.add(information);
			rel.set("RelatedDocuments", documents.toArray());
		} else if (file.schema === "IFC2X3") {
			// IfcDocumentInformationRelationship (IFC2X3): RelatingDocument(0),
			// RelatedDocuments(1), RelationshipType(2) -- see header comment.
			file.createEntity("IfcDocumentInformationRelationship", parent, [information]);
		} else {
			// IfcDocumentInformationRelationship (IFC4+): Name(0), Description(1),
			// RelatingDocument(2), RelatedDocuments(3), RelationshipType(4).
			file.createEntity("IfcDocumentInformationRelationship", null, null, parent, [information]);
		}
	}
	return information;
}

/**
 * Adds a new document information to the project (Python:
 * `ifcopenshell.api.document.add_information`).
 *
 * An `IfcDocumentInformation` is a document associated with the project. It may be a
 * drawing, specification, schedule, certificate, warranty guarantee, manual, contract,
 * and so on.
 *
 * A document may also be a subdocument of a larger document, useful for superseding
 * documents or tracking older versions. The parent is considered the latest version and
 * the children are older revisions.
 *
 * @throws {Error} If `parent` is not given and the file has no `IfcProject`.
 *
 * @example
 * ```ts
 * const document = api.document.addInformation(model, {});
 * api.document.editInformation(model, {
 *   information: document,
 *   attributes: { Identification: "A-GA-6100", Name: "Overall Plan", Location: "A-GA-6100 - Overall Plan.pdf" },
 * });
 * ```
 */
export const addInformation = wrapUsecase("document.add_information", addInformationUsecase);
