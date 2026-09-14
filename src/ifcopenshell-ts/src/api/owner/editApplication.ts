// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/edit_application.py` (src/ifcopenshell-python, 39
// lines) -- a trivial attribute-setter loop, matching `./editPerson.ts`'s identical
// shape verbatim. No `update_owner_history` call -- `IfcApplication` isn't an `IfcRoot`
// subtype.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditApplicationSettings {
	/** The `IfcApplication` entity you want to edit. */
	application: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editApplicationUsecase(_file: IfcFile, settings: EditApplicationSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.application.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcApplication` (Python:
 * `ifcopenshell.api.owner.edit_application`).
 *
 * For more information about the attributes and data types of an `IfcApplication`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const application = api.owner.addApplication(model, { applicationFullName: "My App" });
 * api.owner.editApplication(model, { application, attributes: { ApplicationFullName: "My App New Name" } });
 * ```
 */
export const editApplication = wrapUsecase("owner.edit_application", editApplicationUsecase);
