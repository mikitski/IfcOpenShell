// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/classification/edit_reference.py` (src/ifcopenshell-python,
// 45 lines) -- a trivial attribute-setter loop, identical in shape to
// `./editClassification.ts` (this chunk's own sibling) and every other `edit_*`
// function in this project. No `update_owner_history` call -- `IfcClassificationReference`
// isn't an `IfcRoot` subtype either, so it has no `OwnerHistory` to update.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditReferenceSettings {
	/** The `IfcClassificationReference` entity you want to edit. */
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
 * Edits the attributes of an `IfcClassificationReference` (Python:
 * `ifcopenshell.api.classification.edit_reference`).
 *
 * For more information about the attributes and data types of an
 * `IfcClassificationReference`, consult the IFC documentation.
 *
 * @example
 * ```ts
 * const reference = model.byType("IfcClassificationReference")[0];
 * api.classification.editReference(model, { reference, attributes: { Name: "Foo" } });
 * ```
 */
export const editReference = wrapUsecase("classification.edit_reference", editReferenceUsecase);
