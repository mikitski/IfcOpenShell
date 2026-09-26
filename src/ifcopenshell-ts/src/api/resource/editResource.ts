// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/resource/edit_resource.py` (src/ifcopenshell-python, 44
// lines) -- part of this project's brand-new `api.resource` chunk (see `./index.ts`'s
// own header comment). Trivial, unconditional attribute-setter loop, structurally
// identical to `../system/editSystem.ts`'s own established pattern.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditResourceSettings {
	/** The `IfcResource` entity you want to edit. */
	resource: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editResourceUsecase(_file: IfcFile, settings: EditResourceSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.resource.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcResource` (Python: `ifcopenshell.api.resource.edit_resource`).
 *
 * For more information about the attributes and data types of an `IfcResource`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const crew = api.resource.addResource(model, { ifcClass: "IfcCrewResource" });
 * // Change the name of the resource to "Zone A Crew".
 * api.resource.editResource(model, { resource: crew, attributes: { Name: "Foo" } });
 * ```
 */
export const editResource = wrapUsecase("resource.edit_resource", editResourceUsecase);
