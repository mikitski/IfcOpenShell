// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/edit_person.py` (src/ifcopenshell-python, 41 lines) --
// a trivial attribute-setter loop, matching `../classification/editClassification.ts`'s
// identical shape verbatim (same underlying Python pattern: `for name, value in
// attributes.items(): setattr(person, name, value)`). No `update_owner_history` call --
// `IfcPerson` isn't an `IfcRoot` subtype, so it has no `OwnerHistory` to update.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditPersonSettings {
	/** The `IfcPerson` entity you want to edit. */
	person: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editPersonUsecase(_file: IfcFile, settings: EditPersonSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.person.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcPerson` (Python: `ifcopenshell.api.owner.edit_person`).
 *
 * For more information about the attributes and data types of an `IfcPerson`, consult
 * the IFC documentation.
 *
 * @example
 * ```ts
 * const person = api.owner.addPerson(model, {
 *   identification: "bobthebuilder", familyName: "Thebuilder", givenName: "Bob",
 * });
 * api.owner.editPerson(model, { person, attributes: { MiddleNames: ["The"], FamilyName: "Builder" } });
 * ```
 */
export const editPerson = wrapUsecase("owner.edit_person", editPersonUsecase);
