// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/unit/add_derived_unit.py` (src/ifcopenshell-python, 77
// lines). No real Python test file exists for this function
// (`src/ifcopenshell-python/test/api/unit/` has no `test_add_derived_unit.py`) -- this
// port's own regression test below (Transaction/undo-redo coverage aside) is
// therefore original, not adapted from a real Python test, following this function's
// own docstring example instead.
//
// --- `attributes: dict[entity_instance, int]` -> `readonly (readonly [EntityInstance,
// number])[]`, a deliberate divergence from a native `Map`, disclosed ---
//
// Python's `attributes` parameter is a `dict` keyed by `entity_instance` objects
// themselves (e.g. `{length: 1, time: -1}`, where `length`/`time` are the SI unit
// entities from a prior `add_si_unit` call). A real Python `entity_instance` is
// properly hashable/equatable by underlying identity (id() + file), so two Python
// wrapper objects referring to the same underlying STEP entity collide correctly as
// the same dict key. This port's `EntityInstance` is deliberately NOT given that
// property (`research/07-fresh-wrapper-per-access.md`: a fresh JS wrapper object is
// minted on every accessor call, so `===`-based identity, which is what a native JS
// `Map<EntityInstance, number>` would use for its keys, is documented project-wide as
// unsafe for entity-identity comparisons -- see `EntityInstance.equals()`'s own doc
// comment). A `Map<EntityInstance, number>` parameter here would therefore silently
// misbehave for a caller who fetches the same unit twice (e.g. once to pass to this
// function, once already held from `add_si_unit`'s own return value used as a
// different map key) -- two wrappers of the identical underlying `IfcSIUnit` would
// NOT collide as the same `Map` key, unlike Python's real dict. To avoid introducing
// that pitfall, `attributes` here is an ordinary array of `[unit, exponent]` pairs
// instead (order-preserving, matching Python `dict`'s own iteration-order guarantee,
// and immune to the identity trap since no key-hashing is ever performed) -- semantics-
// preserving for every real use of this parameter (iterate the pairs, build one
// `IfcDerivedUnitElement` per pair), just spelled as a list instead of a `Map`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddDerivedUnitSettings {
	/**
	 * A type of unit. For example, choosing `"THERMALCONDUCTANCEUNIT"` will give you a
	 * Thermal conductance. See this file's Python source docstring for the full list
	 * of supported types.
	 */
	unitType: string;
	/** The user defined type in case of choosing `"USERDEFINED"`, or `null` otherwise. */
	userDefinedType: string | null;
	/**
	 * The named units making up this derived unit and their exponents, e.g.
	 * `[[length, 1], [time, -1]]` for a linear velocity (length/time). See this file's
	 * own header comment for why this is a list of pairs, not a `Map`.
	 */
	attributes: readonly (readonly [EntityInstance, number])[];
}

function addDerivedUnitUsecase(file: IfcFile, settings: AddDerivedUnitSettings): EntityInstance {
	const derivedUnitElements: EntityInstance[] = [];
	for (const [namedUnit, exponent] of settings.attributes) {
		derivedUnitElements.push(file.createEntity("IfcDerivedUnitElement", namedUnit, exponent));
	}

	return file.createEntity("IfcDerivedUnit", derivedUnitElements, settings.unitType, settings.userDefinedType);
}

/**
 * Add a new Derived unit (Python: `ifcopenshell.api.unit.add_derived_unit`).
 *
 * The supported types are ANGULARVELOCITYUNIT, AREADENSITYUNIT,
 * COMPOUNDPLANEANGLEUNIT, DYNAMICVISCOSITYUNIT, HEATFLUXDENSITYUNIT,
 * INTEGERCOUNTRATEUNIT, ISOTHERMALMOISTURECAPACITYUNIT, KINEMATICVISCOSITYUNIT,
 * LINEARVELOCITYUNIT, MASSDENSITYUNIT, MASSFLOWRATEUNIT, MOISTUREDIFFUSIVITYUNIT,
 * MOLECULARWEIGHTUNIT, SPECIFICHEATCAPACITYUNIT, THERMALADMITTANCEUNIT,
 * THERMALCONDUCTANCEUNIT, THERMALRESISTANCEUNIT, THERMALTRANSMITTANCEUNIT,
 * VAPORPERMEABILITYUNIT, VOLUMETRICFLOWRATEUNIT, ROTATIONALFREQUENCYUNIT,
 * TORQUEUNIT, MOMENTOFINERTIAUNIT, LINEARMOMENTUNIT, LINEARFORCEUNIT,
 * PLANARFORCEUNIT, MODULUSOFELASTICITYUNIT, SHEARMODULUSUNIT, LINEARSTIFFNESSUNIT,
 * ROTATIONALSTIFFNESSUNIT, MODULUSOFSUBGRADEREACTIONUNIT, ACCELERATIONUNIT,
 * CURVATUREUNIT, HEATINGVALUEUNIT, IONCONCENTRATIONUNIT,
 * LUMINOUSINTENSITYDISTRIBUTIONUNIT, MASSPERLENGTHUNIT,
 * MODULUSOFLINEARSUBGRADEREACTIONUNIT, MODULUSOFROTATIONALSUBGRADEREACTIONUNIT,
 * PHUNIT, ROTATIONALMASSUNIT, SECTIONAREAINTEGRALUNIT, SECTIONMODULUSUNIT,
 * SOUNDPOWERLEVELUNIT, SOUNDPOWERUNIT, SOUNDPRESSURELEVELUNIT, SOUNDPRESSUREUNIT,
 * TEMPERATUREGRADIENTUNIT, TEMPERATURERATEOFCHANGEUNIT,
 * THERMALEXPANSIONCOEFFICIENTUNIT, WARPINGCONSTANTUNIT, WARPINGMOMENTUNIT,
 * USERDEFINED.
 *
 * In case of choosing USERDEFINED, the `userDefinedType` parameter needs to be
 * provided.
 *
 * @example
 * ```ts
 * // Linear velocity in m/s
 * const length = api.unit.addSiUnit(model, { unitType: "LENGTHUNIT" });
 * const time = api.unit.addSiUnit(model, { unitType: "TIMEUNIT" });
 * const linearVelocity = api.unit.addDerivedUnit(model, {
 *   unitType: "LINEARVELOCITYUNIT",
 *   userDefinedType: null,
 *   attributes: [[length, 1], [time, -1]],
 * });
 * ```
 */
export const addDerivedUnit = wrapUsecase("unit.add_derived_unit", addDerivedUnitUsecase);
