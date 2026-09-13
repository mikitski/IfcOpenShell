// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/unit/add_si_unit.py` (src/ifcopenshell-python, 60 lines) --
// the first of this project's `api.unit` chunk (11 files, ~790 lines total; see
// `index.ts`'s own header comment for the module's overall scope and this chunk's one
// real, load-bearing cross-cutting finding).
//
// --- `IfcSIUnit`'s real attribute layout: a leading `Dimensions` placeholder slot,
// confirmed empirically against this exact worktree's own built native addon, not
// assumed ---
//
// `IfcNamedUnit.Dimensions` is explicit (a real, stored, forward attribute) on most
// `IfcNamedUnit` subtypes (`IfcConversionBasedUnit`, `IfcContextDependentUnit`), but
// `IfcSIUnit` re-declares it as `DERIVE ... := IfcDeriveDimensionalExponents(Name,
// Prefix)` -- computed from `Name`/`Prefix`, not user-supplied. `util/unit.ts`'s own
// header comment already documented this for *reading* (`calculateUnitScale`
// computes `getSiDimensions(unit.Name)` directly instead of reading the derived
// `.Dimensions` attribute, since this port's `EntityInstance.get()` doesn't execute
// EXPRESS derived-attribute rules) and noted "the SPF placeholder `*` is required at
// that attribute's position for a hand-written `IfcSIUnit` to parse at all" --
// confirmed again here independently for *construction*: `EntityInstance
// .attributeCount()` on a fresh `IfcSIUnit` reports 4, not the 3 fields
// (`UnitType`/`Prefix`/`Name`) `src/generated/ifc4.d.ts`'s `IfcSIUnit` interface
// lists (the derived `Dimensions` slot is invisible to the generated interface, since
// the codegen only emits explicit/inherited-explicit attributes, but the underlying
// STEP-level attribute list still reserves index 0 for it). Positional
// `file.createEntity("IfcSIUnit", ...)` therefore needs a leading placeholder value
// (`null`, matching STEP's `*` "derived, not restated" token) before `UnitType`/
// `Prefix`/`Name` -- verified by reproducing the exact real Python source's own
// convenience-wrapper call shape: `assign_unit.py`'s `create_metric_unit`/
// `create_imperial_unit` (this chunk's `assignUnit.ts`) both literally call
// `self.file.createIfcSIUnit(None, "{}UNIT".format(...), prefix, name)` -- a leading
// `None` as the very first positional argument -- which is exactly this same
// placeholder, confirming this isn't a TS-port-specific quirk but a real property of
// the underlying schema/core that real Python's own convenience wrapper already has
// to account for. `test/util/migrator.test.ts`'s own fixture SPF string
// (`"#1=IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.);"`) independently confirms the same
// 4-slot, `*`-first layout at the file-format level.
//
// Reading (`.get("UnitType")`/`.get("Prefix")`/`.get("Name")`) is unaffected -- name-
// based attribute resolution (`get_argument_index`) already accounts for this real
// index shift internally, this only matters for *positional* `createEntity` calls.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { siTypeNames } from "../../util/unit";
import { wrapUsecase } from "../hooks";

export interface AddSiUnitSettings {
	/**
	 * A type of unit. For example, choosing `"LENGTHUNIT"` will give you a metre. See
	 * this file's Python source docstring for the full list of supported types.
	 * Python default: `"LENGTHUNIT"`.
	 */
	unitType?: string;
	/**
	 * A prefix chosen from ATTO, CENTI, DECA, DECI, EXA, FEMTO, GIGA, HECTO, KILO,
	 * MEGA, MICRO, MILLI, NANO, PETA, PICO, TERA, or `null`/omitted for no prefix.
	 */
	prefix?: string | null;
}

function addSiUnitUsecase(file: IfcFile, settings: AddSiUnitSettings = {}): EntityInstance {
	const unitType = settings.unitType ?? "LENGTHUNIT";
	const prefix = settings.prefix ?? null;

	const name = siTypeNames[unitType] ?? null;
	// Leading `null` placeholder for the derived `Dimensions` slot -- see this file's
	// header comment.
	return file.createEntity("IfcSIUnit", null, unitType, prefix, name);
}

/**
 * Add a new SI unit (Python: `ifcopenshell.api.unit.add_si_unit`).
 *
 * The supported types are ABSORBEDDOSEUNIT, AMOUNTOFSUBSTANCEUNIT, AREAUNIT,
 * DOSEEQUIVALENTUNIT, ELECTRICCAPACITANCEUNIT, ELECTRICCHARGEUNIT,
 * ELECTRICCONDUCTANCEUNIT, ELECTRICCURRENTUNIT, ELECTRICRESISTANCEUNIT,
 * ELECTRICVOLTAGEUNIT, ENERGYUNIT, FORCEUNIT, FREQUENCYUNIT, ILLUMINANCEUNIT,
 * INDUCTANCEUNIT, LENGTHUNIT, LUMINOUSFLUXUNIT, LUMINOUSINTENSITYUNIT,
 * MAGNETICFLUXDENSITYUNIT, MAGNETICFLUXUNIT, MASSUNIT, PLANEANGLEUNIT, POWERUNIT,
 * PRESSUREUNIT, RADIOACTIVITYUNIT, SOLIDANGLEUNIT, THERMODYNAMICTEMPERATUREUNIT,
 * TIMEUNIT, VOLUMEUNIT.
 *
 * Prefixes supported are ATTO, CENTI, DECA, DECI, EXA, FEMTO, GIGA, HECTO, KILO, MEGA,
 * MICRO, MILLI, NANO, PETA, PICO, TERA.
 *
 * @example
 * ```ts
 * // Millimeters and square meters
 * const length = api.unit.addSiUnit(model, { unitType: "LENGTHUNIT", prefix: "MILLI" });
 * const area = api.unit.addSiUnit(model, { unitType: "AREAUNIT" });
 *
 * // Make it our default units, if we are doing a metric building
 * api.unit.assignUnit(model, { units: [length, area] });
 * ```
 */
export const addSiUnit = wrapUsecase("unit.add_si_unit", addSiUnitUsecase);
