// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/unit/add_conversion_based_unit.py` (src/ifcopenshell-
// python, 86 lines).
//
// *** A real, load-bearing, pre-existing, already-disclosed primitive-layer gap
// blocks this function's core purpose entirely -- confirmed empirically against this
// exact worktree's own built native addon, not assumed. Ported faithfully anyway
// (correct the moment the gap closes), NOT silently worked around. ***
//
// Every branch of this function needs to build an `IfcMeasureWithUnit.ValueComponent`
// -- a freestanding, *valued* simple/defined-type instance (Python:
// `file.create_entity("IfcReal", **{"wrappedValue": conversion_real})`). This is the
// exact same gap `util/migrator.ts`'s own header comment (finding 1) already
// disclosed for its `id() === 0` loose-value-migration branch, and its own dedicated
// regression test (`test/util/migrator.test.ts`, "disclosed primitive-layer gap ...
// finding 1") -- independently re-confirmed here for a second, unrelated call site:
// `IfcFile.createEntity`/`EntityInstance.setByIndex` unconditionally call the native
// `attribute_kind_of` primitive to disambiguate an ambiguous JS value's IFC kind, and
// that primitive's shim implementation throws "Attribute access is only supported on
// entity instances" for ANY non-entity (simple/defined-type) target -- populated or
// not, created via positional `createEntity` args or via a separate `setByIndex` call
// afterward on an already-created bare instance. Reproduced directly against this
// worktree's own native addon before writing this file:
//
// ```
// file.createEntity("IfcReal", 0.3048)              // throws immediately
// const real = file.createEntity("IfcReal");        // succeeds (0 positional args,
// real.setByIndex(0, 0.3048);                        //  no attribute_kind_of call) --
//                                                     //  but the follow-up set throws
// ```
//
// This is a foundational, cross-cutting gap in already-shipped Phase 2 code
// (`entityInstance.ts`), not something introduced by or fixable within this chunk's
// own scope -- per this project's standing instruction ("do NOT silently add a new
// native primitive without flagging it for the orchestrating session's review"), it
// is disclosed here (and in the final report) rather than worked around with a lower-
// level escape hatch. `addConversionBasedUnit` is therefore ported completely and
// faithfully below -- every branch's dimension/unit-type/name resolution logic is
// real, working code -- but it will always throw this same, pre-existing error at the
// `ValueComponent` construction step the moment it's actually invoked, for every
// input, because every unit this function can produce needs a non-zero conversion
// factor. `test/api/unit/addConversionBasedUnit.test.ts` pins this CURRENT, disclosed,
// blocked behavior with a dedicated test (matching `migrator.test.ts`'s own
// precedent), not silently skipped -- it starts failing (a good thing) the moment this
// foundational gap is ever closed.
//
// `IfcSIUnit`'s own leading-`Dimensions`-placeholder quirk (`addSiUnit.ts`'s header
// comment) also applies to the `si_unit` this function builds internally.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { imperialTypes, namedDimensions, siConversions, siOffsets, siTypeNames } from "../../util/unit";
import { wrapUsecase } from "../hooks";

export interface AddConversionBasedUnitSettings {
	/**
	 * A converted name chosen from: inch, foot, yard, mile, square inch, square foot,
	 * square yard, acre, square mile, cubic inch, cubic foot, cubic yard, litre, fluid
	 * ounce UK, fluid ounce US, pint UK, pint US, gallon UK, gallon US, degree, ounce,
	 * pound, ton UK, ton US, tonne, lbf, kip, psi, ksi, minute, hour, day, btu, and
	 * fahrenheit. Python default: `"foot"`.
	 */
	name?: string;
	/**
	 * If you want to offset the conversion further by a set number, you may specify it
	 * here. For example, fahrenheit is `1.8 * kelvin - 459.67`. The `-459.67` is the
	 * conversion offset. Note that this is just an example and you don't actually need
	 * to specify that for fahrenheit as it's built into this function. For advanced
	 * users only.
	 */
	conversionOffset?: number | null;
}

function addConversionBasedUnitUsecase(file: IfcFile, settings: AddConversionBasedUnitSettings = {}): EntityInstance {
	const name = settings.name ?? "foot";
	let conversionOffset = settings.conversionOffset ?? null;

	const unitType = imperialTypes[name] ?? "USERDEFINED";
	const dimensions = namedDimensions[unitType];
	const exponents = file.createEntity("IfcDimensionalExponents", ...dimensions);
	const siName = siTypeNames[unitType];

	// Leading `null` placeholder for `IfcSIUnit`'s derived `Dimensions` slot -- see
	// `addSiUnit.ts`'s own header comment.
	const siUnit =
		unitType === "MASSUNIT"
			? file.createEntity("IfcSIUnit", null, unitType, "KILO", siName)
			: file.createEntity("IfcSIUnit", null, unitType, null, siName);

	const conversionReal = siConversions[name] ?? 1;
	// *** Throws here -- see this file's own header comment. `IfcReal` is created bare
	// (no positional value) then given its value via a separate `setByIndex` call,
	// matching Python's own `create_entity(ifc_class, **{"wrappedValue": ...})` as
	// closely as this port's primitive layer allows -- both call shapes hit the same
	// underlying `attribute_kind_of` gate. ***
	const valueComponent = file.createEntity("IfcReal");
	valueComponent.setByIndex(0, conversionReal);
	const conversionFactor = file.createEntity("IfcMeasureWithUnit", valueComponent, siUnit);

	if (!conversionOffset) {
		conversionOffset = siOffsets[name] ?? 0;
	}

	if (conversionOffset) {
		return file.createEntity(
			"IfcConversionBasedUnitWithOffset",
			exponents,
			unitType,
			name,
			conversionFactor,
			conversionOffset,
		);
	}
	return file.createEntity("IfcConversionBasedUnit", exponents, unitType, name, conversionFactor);
}

/**
 * Add a conversion based unit (Python: `ifcopenshell.api.unit.add_conversion_based_unit`).
 *
 * If you're in one of those countries who don't use SI units, you're probably simply
 * using SI units converted into another unit. If you want to use _those_ units, you
 * can create a conversion based unit with this function. You can choose from one of:
 * inch, foot, yard, mile, square inch, square foot, square yard, acre, square mile,
 * cubic inch, cubic foot, cubic yard, litre, fluid ounce UK, fluid ounce US, pint UK,
 * pint US, gallon UK, gallon US, degree, ounce, pound, ton UK, ton US, tonne, lbf,
 * kip, psi, ksi, minute, hour, day, btu, and fahrenheit.
 *
 * **Currently always throws** -- see this file's own header comment for the real,
 * disclosed, pre-existing primitive-layer gap this function unconditionally hits.
 *
 * @example
 * ```ts
 * // Some common imperial measurements
 * const length = api.unit.addConversionBasedUnit(model, { name: "inch" });
 * const area = api.unit.addConversionBasedUnit(model, { name: "square foot" });
 *
 * // Make it our default units, if we are doing an imperial building
 * api.unit.assignUnit(model, { units: [length, area] });
 * ```
 */
export const addConversionBasedUnit = wrapUsecase("unit.add_conversion_based_unit", addConversionBasedUnitUsecase);
