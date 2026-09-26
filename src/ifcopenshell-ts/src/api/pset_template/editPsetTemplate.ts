// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset_template/edit_pset_template.py` (src/ifcopenshell-
// python, 47 lines) -- part of this project's `api.pset_template` chunk (see
// `./index.ts`'s own header comment). A trivial attribute-setter loop, matching
// `../classification/editClassification.ts`'s identical shape verbatim (same
// underlying Python pattern: `for name, value in attributes.items(): setattr(
// pset_template, name, value)`). No `update_owner_history` call -- real Python's own
// `edit_pset_template.py` never touches `OwnerHistory` (and per `./addPsetTemplate.ts`'s
// own header comment, this whole module never sets `OwnerHistory` on a pset template
// in the first place).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditPsetTemplateSettings {
	/** The `IfcPropertySetTemplate` entity you want to edit. */
	psetTemplate: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editPsetTemplateUsecase(_file: IfcFile, settings: EditPsetTemplateSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.psetTemplate.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcPropertySetTemplate` (Python:
 * `ifcopenshell.api.pset_template.edit_pset_template`).
 *
 * For more information about the attributes and data types of an
 * `IfcPropertySetTemplate`, consult the IFC documentation.
 *
 * @example
 * ```ts
 * // Whoops! We named it with a buildingSMART reserved "Pset_" prefix!
 * const template = api.psetTemplate.addPsetTemplate(model, { name: "Pset_RiskFactors" });
 *
 * // Let's fix it to prefix with our company code instead.
 * api.psetTemplate.editPsetTemplate(model, { psetTemplate: template, attributes: { Name: "ABC_RiskFactors" } });
 * ```
 */
export const editPsetTemplate = wrapUsecase("pset_template.edit_pset_template", editPsetTemplateUsecase);
