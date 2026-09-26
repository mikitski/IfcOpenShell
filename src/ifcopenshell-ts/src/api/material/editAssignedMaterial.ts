// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/edit_assigned_material.py`
// (src/ifcopenshell-python, 44 lines) -- chunk 2 of `api.material` (see `./index.ts`'s
// own header comment). A trivial attribute-setter loop, matching `./editMaterial.ts`
// (this same chunk's own sibling) byte-for-byte in body (`for name, value in
// attributes.items(): setattr(element, name, value)`) -- see `editMaterial.ts`'s own
// header comment for confirmation these are genuine real-Python duplicates of each
// other, not a copy/paste error introduced by this port. No `update_owner_history`
// call, for the same reason as `editMaterial.ts` (an `IfcMaterial` has no
// `OwnerHistory` to touch).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditAssignedMaterialSettings {
	/** The `IfcMaterial` entity you want to edit. */
	element: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editAssignedMaterialUsecase(_file: IfcFile, settings: EditAssignedMaterialSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.element.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcMaterial` (Python:
 * `ifcopenshell.api.material.edit_assigned_material`).
 *
 * For more information about the attributes and data types of an `IfcMaterial`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const concrete = api.material.addMaterial(model, { name: "CON01", category: "concrete" });
 * api.material.editAssignedMaterial(model, {
 *   element: concrete,
 *   attributes: { Description: "40MPA concrete with broom finish" },
 * });
 * ```
 */
export const editAssignedMaterial = wrapUsecase("material.edit_assigned_material", editAssignedMaterialUsecase);
