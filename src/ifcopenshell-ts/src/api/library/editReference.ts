// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/library/edit_reference.py` (src/ifcopenshell-python, 46
// lines) -- a trivial attribute-setter loop, identical in shape to `./editLibrary.ts`'s
// own plain fallback branch and every other `edit_*` function in this project (e.g.
// `../document/editReference.ts`/`../classification/editReference.ts`). No
// `updateOwnerHistory` call -- `IfcLibraryReference` isn't an `IfcRoot` subtype either,
// so it has no `OwnerHistory` to update.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditReferenceSettings {
	/** The `IfcLibraryReference` entity you want to edit. */
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
 * Edits the attributes of an `IfcLibraryReference` (Python:
 * `ifcopenshell.api.library.edit_reference`).
 *
 * For more information about the attributes and data types of an `IfcLibraryReference`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const library = api.library.addLibrary(model, { name: "Brickschema" });
 * const reference = api.library.addReference(model, { library });
 * api.library.editReference(model, {
 *   reference,
 *   attributes: { Identification: "http://example.org/digitaltwin#AHU01" },
 * });
 * ```
 */
export const editReference = wrapUsecase("library.edit_reference", editReferenceUsecase);
