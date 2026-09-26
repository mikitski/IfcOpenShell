// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/group/edit_group.py` (src/ifcopenshell-python, 42 lines) --
// a trivial attribute-setter loop, matching `../layer/editLayer.ts`/
// `../context/editContext.ts`'s identical shape verbatim (same underlying Python
// pattern: `for name, value in attributes.items(): setattr(group, name, value)`). No
// `update_owner_history` call -- real Python's `edit_group` genuinely doesn't touch
// `OwnerHistory` at all, unlike most other mutating `api.group`/`api.spatial`
// functions.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditGroupSettings {
	/** The `IfcGroup` entity you want to edit. */
	group: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editGroupUsecase(_file: IfcFile, settings: EditGroupSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.group.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcGroup` (Python: `ifcopenshell.api.group.edit_group`).
 *
 * For more information about the attributes and data types of an `IfcGroup`, consult
 * the IFC documentation.
 *
 * @example
 * ```ts
 * const group = api.group.addGroup(model, { name: "Unit 1A" });
 * api.group.editGroup(model, {
 *   group,
 *   attributes: { Description: "All furniture and joinery included in the unit" },
 * });
 * ```
 */
export const editGroup = wrapUsecase("group.edit_group", editGroupUsecase);
