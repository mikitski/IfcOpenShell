// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/system/edit_system.py` (src/ifcopenshell-python, 44 lines)
// -- the first of this project's `api.system` chunk (see `./index.ts`'s own header
// comment for the module's overall scope). Trivial, unconditional attribute-setter
// loop over `attributes`, structurally identical to `../material/editLayerUsage.ts`'s
// own established pattern for this exact Python shape (`for name, value in
// attributes.items(): setattr(system, name, value)`).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditSystemSettings {
	/** The `IfcSystem` entity you want to edit. */
	system: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editSystemUsecase(_file: IfcFile, settings: EditSystemSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.system.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcSystem` (Python: `ifcopenshell.api.system.edit_system`).
 *
 * For more information about the attributes and data types of an `IfcSystem`, consult
 * the IFC documentation.
 *
 * @example
 * ```ts
 * // A completely empty distribution system
 * const system = api.system.addSystem(model, {});
 *
 * // Change the name of the system to "HW" for Hot Water
 * api.system.editSystem(model, { system, attributes: { Name: "HW" } });
 * ```
 */
export const editSystem = wrapUsecase("system.edit_system", editSystemUsecase);
