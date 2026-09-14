// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/edit_organisation.py` (src/ifcopenshell-python, 43
// lines) -- a trivial attribute-setter loop, matching `./editPerson.ts`'s identical
// shape verbatim. No `update_owner_history` call -- `IfcOrganization` isn't an
// `IfcRoot` subtype.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditOrganisationSettings {
	/** The `IfcOrganization` entity you want to edit. */
	organisation: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editOrganisationUsecase(_file: IfcFile, settings: EditOrganisationSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.organisation.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcOrganization` (Python:
 * `ifcopenshell.api.owner.edit_organisation`).
 *
 * For more information about the attributes and data types of an `IfcOrganization`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const organisation = api.owner.addOrganisation(model, { identification: "AWB", name: "Architects With Ballpens" });
 * api.owner.editOrganisation(model, { organisation, attributes: { Name: "Architects Without Ballpens" } });
 * ```
 */
export const editOrganisation = wrapUsecase("owner.edit_organisation", editOrganisationUsecase);
