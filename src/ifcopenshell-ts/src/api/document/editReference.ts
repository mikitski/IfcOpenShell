// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/document/edit_reference.py` (src/ifcopenshell-python, 51
// lines) -- a trivial attribute-setter loop, identical in shape to
// `./editInformation.ts` (this module's own sibling) and every other `edit_*` function
// in this project. No `updateOwnerHistory` call -- `IfcDocumentReference` isn't an
// `IfcRoot` subtype either, so it has no `OwnerHistory` to update.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditReferenceSettings {
	/** The `IfcDocumentReference` entity you want to edit. */
	reference: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editReferenceUsecase(_file: IfcFile, settings: EditReferenceSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.reference.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcDocumentReference` (Python:
 * `ifcopenshell.api.document.edit_reference`).
 *
 * For more information about the attributes and data types of an `IfcDocumentReference`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const document = api.document.addInformation(model, {});
 * const reference = api.document.addReference(model, { information: document });
 * api.document.editReference(model, { reference, attributes: { Identification: "2.1.15" } });
 * ```
 */
export const editReference = wrapUsecase("document.edit_reference", editReferenceUsecase);
