// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/unit/add_monetary_unit.py` (src/ifcopenshell-python, 42
// lines) -- the simplest file in this module. `IfcMonetaryUnit` has exactly 1
// attribute (`Currency`), confirmed against `src/generated/ifc4.d.ts` and empirically
// (`EntityInstance.attributeCount()` reports 1 for a fresh instance) -- a direct,
// single-positional-argument `createEntity` call, no placeholder/derived-attribute
// quirks (unlike `addSiUnit.ts`'s `IfcSIUnit`).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddMonetaryUnitSettings {
	/**
	 * The currency code. Currency units are useful in cost plans to know in what
	 * currency the costs are calculated in. Should follow ISO 4217, like USD, GBP,
	 * AUD, MYR, etc. Python default: `"DOLLARYDOO"`.
	 */
	currency?: string;
}

function addMonetaryUnitUsecase(file: IfcFile, settings: AddMonetaryUnitSettings = {}): EntityInstance {
	const currency = settings.currency ?? "DOLLARYDOO";
	return file.createEntity("IfcMonetaryUnit", currency);
}

/**
 * Add a new currency (Python: `ifcopenshell.api.unit.add_monetary_unit`).
 *
 * @example
 * ```ts
 * // If you do all your cost plans in Zimbabwean dollars then nobody knows how
 * // accurate the numbers are.
 * const zwl = api.unit.addMonetaryUnit(model, { currency: "ZWL" });
 *
 * // Make it our default currency
 * api.unit.assignUnit(model, { units: [zwl] });
 * ```
 */
export const addMonetaryUnit = wrapUsecase("unit.add_monetary_unit", addMonetaryUnitUsecase);
