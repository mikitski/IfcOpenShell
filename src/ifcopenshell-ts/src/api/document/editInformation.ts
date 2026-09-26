// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/document/edit_information.py` (src/ifcopenshell-python, 48
// lines) -- a trivial attribute-setter loop, identical in shape to `./editReference.ts`
// (this module's own sibling) and every other `edit_*` function in this project. No
// `updateOwnerHistory` call -- `IfcDocumentInformation` isn't an `IfcRoot` subtype
// either, so it has no `OwnerHistory` to update.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditInformationSettings {
	/** The `IfcDocumentInformation` entity you want to edit. */
	information: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editInformationUsecase(_file: IfcFile, settings: EditInformationSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.information.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcDocumentInformation` (Python:
 * `ifcopenshell.api.document.edit_information`).
 *
 * For more information about the attributes and data types of an
 * `IfcDocumentInformation`, consult the IFC documentation.
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
export const editInformation = wrapUsecase("document.edit_information", editInformationUsecase);
