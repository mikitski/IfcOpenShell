// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/classification/edit_classification.py` (src/ifcopenshell-
// python, 45 lines) -- a trivial attribute-setter loop, matching `../group/editGroup.ts`
// /`../layer/editLayer.ts`/`../context/editContext.ts`'s identical shape verbatim (same
// underlying Python pattern: `for name, value in attributes.items(): setattr(
// classification, name, value)`). No `update_owner_history` call -- `IfcClassification`
// isn't even an `IfcRoot` subtype, so it has no `OwnerHistory` to update in the first
// place.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditClassificationSettings {
	/** The `IfcClassification` entity you want to edit. */
	classification: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editClassificationUsecase(_file: IfcFile, settings: EditClassificationSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.classification.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcClassification` (Python:
 * `ifcopenshell.api.classification.edit_classification`).
 *
 * For more information about the attributes and data types of an `IfcClassification`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const classification = model.byType("IfcClassification")[0];
 * api.classification.editClassification(model, { classification, attributes: { Name: "Foo" } });
 * ```
 */
export const editClassification = wrapUsecase("classification.edit_classification", editClassificationUsecase);
