// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/context/edit_context.py` (src/ifcopenshell-python, 49
// lines) -- a trivial attribute-setter loop, no dependency beyond `EntityInstance.set`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditContextSettings {
	/** The `IfcGeometricRepresentationContext` (or SubContext) entity you want to edit. */
	context: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editContextUsecase(_file: IfcFile, settings: EditContextSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.context.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcGeometricRepresentationContext` (Python:
 * `ifcopenshell.api.context.edit_context`).
 *
 * For more information about the attributes and data types of an
 * `IfcGeometricRepresentationContext`, consult the IFC documentation.
 */
export const editContext = wrapUsecase("context.edit_context", editContextUsecase);
