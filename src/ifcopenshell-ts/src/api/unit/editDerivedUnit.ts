// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/unit/edit_derived_unit.py` (src/ifcopenshell-python, 34
// lines) -- a trivial attribute-setter loop, ported verbatim. No docstring example in
// the real Python source for this one.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditDerivedUnitSettings {
	/** The `IfcDerivedUnit` entity you want to edit. */
	unit: EntityInstance;
	/** A dictionary of attribute names and values (Python: `dict[str, Any]`). */
	attributes: Record<string, unknown>;
}

function editDerivedUnitUsecase(_file: IfcFile, settings: EditDerivedUnitSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.unit.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcDerivedUnit` (Python: `ifcopenshell.api.unit.edit_derived_unit`).
 *
 * For more information about the attributes and data types of an `IfcDerivedUnit`,
 * consult the IFC documentation.
 */
export const editDerivedUnit = wrapUsecase("unit.edit_derived_unit", editDerivedUnitUsecase);
