// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/unit/edit_monetary_unit.py` (src/ifcopenshell-python, 45
// lines) -- a trivial attribute-setter loop, ported verbatim.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditMonetaryUnitSettings {
	/** The `IfcMonetaryUnit` entity you want to edit. */
	unit: EntityInstance;
	/** A dictionary of attribute names and values (Python: `dict[str, Any]`). */
	attributes: Record<string, unknown>;
}

function editMonetaryUnitUsecase(_file: IfcFile, settings: EditMonetaryUnitSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.unit.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcMonetaryUnit` (Python: `ifcopenshell.api.unit.edit_monetary_unit`).
 *
 * For more information about the attributes and data types of an `IfcMonetaryUnit`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * // If you do all your cost plans in Zimbabwean dollars then nobody knows how
 * // accurate the numbers are.
 * const zwl = api.unit.addMonetaryUnit(model, { currency: "ZWL" });
 *
 * // Ah who are we kidding
 * api.unit.editMonetaryUnit(model, { unit: zwl, attributes: { Currency: "USD" } });
 * ```
 */
export const editMonetaryUnit = wrapUsecase("unit.edit_monetary_unit", editMonetaryUnitUsecase);
