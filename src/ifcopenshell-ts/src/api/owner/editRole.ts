// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/edit_role.py` (src/ifcopenshell-python, 40 lines) --
// a trivial attribute-setter loop, matching `./editOrganisation.ts`/`./editPerson.ts`'s
// identical shape verbatim.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditRoleSettings {
	/** The `IfcActorRole` entity you want to edit. */
	role: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editRoleUsecase(_file: IfcFile, settings: EditRoleSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.role.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcActorRole` (Python: `ifcopenshell.api.owner.edit_role`).
 *
 * For more information about the attributes and data types of an `IfcActorRole`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const person = api.owner.addPerson(model, { identification: "bobthebuilder", familyName: "Thebuilder", givenName: "Bob" });
 * const role = api.owner.addRole(model, { assignedObject: person });
 * api.owner.editRole(model, { role, attributes: { Role: "CONSTRUCTIONMANAGER" } });
 * ```
 */
export const editRole = wrapUsecase("owner.edit_role", editRoleUsecase);
