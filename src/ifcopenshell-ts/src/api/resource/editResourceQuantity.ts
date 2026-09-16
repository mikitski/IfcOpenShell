// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/resource/edit_resource_quantity.py` (src/ifcopenshell-
// python, 55 lines) -- part of this project's brand-new `api.resource` chunk (see
// `./index.ts`'s own header comment). Trivial, unconditional attribute-setter loop,
// structurally identical to `../system/editSystem.ts`'s own established pattern for
// this exact Python shape (`for name, value in attributes.items(): setattr(x, name,
// value)`). No `OwnerHistory` touch of any kind -- real Python never calls
// `update_owner_history` here either.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditResourceQuantitySettings {
	/** The `IfcPhysicalQuantity` entity you want to edit. */
	physicalQuantity: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editResourceQuantityUsecase(_file: IfcFile, settings: EditResourceQuantitySettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.physicalQuantity.set(name, value);
	}
}

/**
 * Edits the attributes of an IFC quantity (Python: `ifcopenshell.api.resource.edit_resource_quantity`).
 *
 * For more information about the attributes and data types of an IFC quantity, consult
 * the IFC documentation.
 *
 * @example
 * ```ts
 * const crew = api.resource.addResource(model, { ifcClass: "IfcCrewResource" });
 * const labour = api.resource.addResource(model, { parentResource: crew, ifcClass: "IfcLaborResource" });
 * const quantity = api.resource.addResourceQuantity(model, { resource: labour, ifcClass: "IfcQuantityTime" });
 * // Store the time used in hours.
 * api.resource.editResourceQuantity(model, { physicalQuantity: quantity, attributes: { TimeValue: 8.0 } });
 * ```
 */
export const editResourceQuantity = wrapUsecase("resource.edit_resource_quantity", editResourceQuantityUsecase);
