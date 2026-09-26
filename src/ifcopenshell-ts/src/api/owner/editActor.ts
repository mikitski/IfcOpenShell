// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/edit_actor.py` (src/ifcopenshell-python, 49 lines) --
// a trivial attribute-setter loop, matching `./editOrganisation.ts`/`./editPerson.ts`'s
// identical shape verbatim. No `update_owner_history` call, even though `IfcActor` (and
// `IfcOccupant`) *is* an `IfcRoot` subtype (unlike `IfcOrganization`/`IfcPerson`) --
// real Python's `edit_actor.py` simply doesn't call it (matching this project's
// established convention of only ever calling `update_owner_history` where the real
// Python source itself does, not wherever an `IfcRoot` subtype happens to be edited).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditActorSettings {
	/** The `IfcActor` (or `IfcOccupant`) entity you want to edit. */
	actor: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editActorUsecase(_file: IfcFile, settings: EditActorSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.actor.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcActor` (Python: `ifcopenshell.api.owner.edit_actor`).
 *
 * For more information about the attributes and data types of an `IfcActor`, consult
 * the IFC documentation.
 *
 * @example
 * ```ts
 * const organisation = api.owner.addOrganisation(model, { identification: "AWB", name: "Architects Without Ballpens" });
 * const actor = api.owner.addActor(model, { actor: organisation });
 * api.owner.editActor(model, { actor, attributes: { Description: "Responsible for buildings A, B, and C." } });
 * ```
 */
export const editActor = wrapUsecase("owner.edit_actor", editActorUsecase);
