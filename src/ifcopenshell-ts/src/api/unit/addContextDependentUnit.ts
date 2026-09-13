// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/unit/add_context_dependent_unit.py` (src/ifcopenshell-
// python, 61 lines). Unlike `IfcSIUnit` (`addSiUnit.ts`'s own header comment),
// `IfcContextDependentUnit` does NOT re-declare `Dimensions` as `DERIVE` -- it's a
// real, explicit, stored attribute here, confirmed empirically:
// `EntityInstance.attributeCount()` on a fresh `IfcContextDependentUnit` reports 3,
// exactly matching `src/generated/ifc4.d.ts`'s 3 listed fields (`Dimensions`,
// `UnitType`, `Name`) with no extra placeholder slot needed. Positional
// `file.createEntity("IfcContextDependentUnit", dimensions, unitType, name)` is a
// direct, unblocked port of Python's own `file.create_entity("IfcContextDependentUnit",
// Dimensions=..., UnitType=..., Name=...)`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import type { DimensionalExponents } from "../../util/unit";
import { wrapUsecase } from "../hooks";

export interface AddContextDependentUnitSettings {
	/**
	 * Typically should be left as `"USERDEFINED"`, unless for some bizarre reason you
	 * are redefining something you could use a sensible normal unit for. Python
	 * default: `"USERDEFINED"`.
	 */
	unitType?: string;
	/** Give your unit a name. X what? X bananas? Python default: `"THINGAMAJIG"`. */
	name?: string;
	/**
	 * Units typically measure one of 7 fundamental physical dimensions: length, mass,
	 * time, electric current, temperature, substance amount, or luminous intensity.
	 * Represented as 7 integers, the exponents of each dimension. For context
	 * dependent units, it is recommended to leave this as the default of all zeroes.
	 */
	dimensions?: DimensionalExponents;
}

const DEFAULT_DIMENSIONS: DimensionalExponents = [0, 0, 0, 0, 0, 0, 0];

function addContextDependentUnitUsecase(file: IfcFile, settings: AddContextDependentUnitSettings = {}): EntityInstance {
	const unitType = settings.unitType ?? "USERDEFINED";
	const name = settings.name ?? "THINGAMAJIG";
	const dimensions = settings.dimensions ?? DEFAULT_DIMENSIONS;

	const dimensionsEntity = file.createEntity("IfcDimensionalExponents", ...dimensions);
	return file.createEntity("IfcContextDependentUnit", dimensionsEntity, unitType, name);
}

/**
 * Add a new arbitrary unit that can only be interpreted in a project specific context
 * (Python: `ifcopenshell.api.unit.add_context_dependent_unit`).
 *
 * Occasionally the construction industry uses arbitrary units to quantify objects,
 * like "pairs" of door hardware, "palettes" or "boxes" of fixings or equipment.
 *
 * @example
 * ```ts
 * // Boxes of things
 * api.unit.addContextDependentUnit(model, { name: "BOXES" });
 * ```
 */
export const addContextDependentUnit = wrapUsecase("unit.add_context_dependent_unit", addContextDependentUnitUsecase);
