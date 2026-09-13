// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/unit/assign_unit.py` (src/ifcopenshell-python, 172 lines,
// the largest file in this module). Real Python structures this as a `Usecase` class
// with `settings`/`execute`/`get_unit_assignment`/`assign_units`/`create_metric_unit`/
// `create_imperial_unit` methods; ported here as plain functions closing over `file`,
// matching this project's established "usecase class -> plain function(s)" convention
// (see e.g. `spatial/assignContainer.ts`).
//
// Two branches:
// 1. `units` explicitly given -> use them directly (`assignUnits` below merges them
//    into the project's `IfcUnitAssignment`, replacing any existing unit of the same
//    `is_a()`/`UnitType`).
// 2. `units` omitted (or an empty array -- Python's `if self.settings["units"]:` is
//    falsy for `None` AND `[]` alike, reproduced here as `.length > 0`, not just a
//    null check) -> synthesize length/area/volume units from `length`/`area`/`volume`
//    specs (each defaulting to metric millimetres/square metres/cubic metres -- "we
//    prioritise metric here," per the real docstring), via `createMetricUnit` or
//    `createImperialUnit` depending on each spec's `isMetric` flag.
//
// *** `createImperialUnit` hits the EXACT SAME disclosed, pre-existing primitive-
// layer gap `addConversionBasedUnit.ts`'s own header comment documents in full (a
// freestanding, valued `IfcReal` cannot currently be constructed by this port at all)
// -- see that file for the full empirical writeup, not repeated here. This means: the
// convenience zero-argument `assignUnit(file)` call (the common case, and the only
// one real Python's own test suite exercises) is fully unblocked, since it always
// takes the metric branch; ONLY the imperial-synthesis branch (reached by explicitly
// passing `{ isMetric: false, raw: "INCHES" | "FEET" | "MILES" | "THOU" }` for
// `length`/`area`/`volume`) is blocked, ported faithfully anyway and pinned by a
// dedicated "currently throws" regression test, matching `addConversionBasedUnit
// .test.ts`'s own precedent. ***
//
// One additional, disclosed, deliberate correction to a genuine Python/JS semantic
// gap in `createMetricUnit`: real Python's `type_prefix + get_unit_name(data["raw"])`
// would raise `TypeError: unsupported operand type(s) for +: 'str' and 'NoneType'`
// for an unrecognised `raw` unit name (`util.unit.get_unit_name` returns
// `Optional[str]`). JS's `+` operator does NOT raise the equivalent error for `string
// + null` -- it silently coerces to the string `"null"` (e.g. `"SQUARE_" + null ===
// "SQUARE_null"`), which would silently manufacture a bogus, wrong `IfcSIUnit.Name`
// instead of failing loudly like Python does. This port adds an explicit `if
// (unitName === null) throw` guard to preserve Python's real fail-loudly-on-bad-input
// behavior, rather than letting JS's more lenient string coercion silently diverge --
// a corrected translation of the *same* validation Python's own crash already
// performs, not new validation logic Python lacks.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getPrefix, getUnitAssignment, getUnitName, siConversions } from "../../util/unit";
import { wrapUsecase } from "../hooks";

/** Python's `si_conversions[name]` -- throws (like a Python `KeyError`) for an unrecognised name. */
function requireSiConversion(name: string): number {
	const value = siConversions[name];
	if (value === undefined) throw new Error(`unit.assignUnit: no si_conversions entry for "${name}"`);
	return value;
}

/** Python's `getattr(instance, name, None)`. */
function attrOrNull(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return null;
	}
}

/** Local by-identity set, matching `aggregate/unassignObject.ts`'s own precedent. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface UnitSynthesisSpec {
	/** `true` to synthesize a metric (`IfcSIUnit`) unit, `false` for imperial. */
	isMetric: boolean;
	/**
	 * The raw unit name driving synthesis. For metric: any string `util.unit
	 * .getPrefix`/`getUnitName` can parse (e.g. `"MILLIMETERS"`, `"METERS"`). For
	 * imperial: one of `"INCHES"`, `"FEET"`, `"MILES"`, `"THOU"`.
	 */
	raw: string;
}

export interface AssignUnitSettings {
	/**
	 * A list of units to assign as project defaults. See `addSiUnit`,
	 * `addConversionBasedUnit`, and `addMonetaryUnit` for information on how to create
	 * units.
	 */
	units?: readonly EntityInstance[] | null;
	/** Convenience length-unit synthesis spec, used only when `units` is omitted/empty. */
	length?: UnitSynthesisSpec | null;
	/** Convenience area-unit synthesis spec, used only when `units` is omitted/empty. */
	area?: UnitSynthesisSpec | null;
	/** Convenience volume-unit synthesis spec, used only when `units` is omitted/empty. */
	volume?: UnitSynthesisSpec | null;
}

type SynthesisUnitType = "length" | "area" | "volume";

function createMetricUnit(file: IfcFile, unitType: SynthesisUnitType, data: UnitSynthesisSpec): EntityInstance {
	let typePrefix = "";
	if (unitType === "area") typePrefix = "SQUARE_";
	else if (unitType === "volume") typePrefix = "CUBIC_";

	const unitName = getUnitName(data.raw);
	// Preserves Python's own fail-loudly-on-unrecognised-`raw` behavior -- see this
	// file's header comment.
	if (unitName === null) {
		throw new TypeError(`unit.assignUnit: could not resolve a unit name from "${data.raw}"`);
	}

	// Leading `null` placeholder for `IfcSIUnit`'s derived `Dimensions` slot -- see
	// `addSiUnit.ts`'s own header comment.
	return file.createEntity(
		"IfcSIUnit",
		null,
		`${unitType.toUpperCase()}UNIT`,
		getPrefix(data.raw),
		typePrefix + unitName,
	);
}

function createImperialUnit(file: IfcFile, unitType: SynthesisUnitType, data: UnitSynthesisSpec): EntityInstance {
	let dimensions: readonly [number, number, number, number, number, number, number];
	let namePrefix: string;
	if (unitType === "length") {
		dimensions = [1, 0, 0, 0, 0, 0, 0];
		namePrefix = "";
	} else if (unitType === "area") {
		dimensions = [2, 0, 0, 0, 0, 0, 0];
		namePrefix = "square";
	} else {
		dimensions = [3, 0, 0, 0, 0, 0, 0];
		namePrefix = "cubic";
	}
	const dimensionalExponents = file.createEntity("IfcDimensionalExponents", ...dimensions);

	const siUnit = file.createEntity(
		"IfcSIUnit",
		null,
		`${unitType.toUpperCase()}UNIT`,
		null,
		`${namePrefix ? `${namePrefix.toUpperCase()}_` : ""}METRE`,
	);

	let name: string;
	if (data.raw === "INCHES") name = `${namePrefix ? `${namePrefix} ` : ""}inch`;
	else if (data.raw === "FEET") name = `${namePrefix ? `${namePrefix} ` : ""}foot`;
	else if (data.raw === "MILES") name = `${namePrefix ? `${namePrefix} ` : ""}mile`;
	else if (data.raw === "THOU") name = `${namePrefix ? `${namePrefix} ` : ""}thou`;
	else throw new Error(`unit.assignUnit: unsupported imperial raw unit "${data.raw}"`);

	// *** Throws here -- the exact same disclosed, pre-existing gap
	// `addConversionBasedUnit.ts`'s own header comment documents in full. ***
	const valueComponent = file.createEntity("IfcReal");
	valueComponent.setByIndex(0, requireSiConversion(name));
	const conversionFactor = file.createEntity("IfcMeasureWithUnit", valueComponent, siUnit);

	return file.createEntity(
		"IfcConversionBasedUnit",
		dimensionalExponents,
		`${unitType.toUpperCase()}UNIT`,
		name,
		conversionFactor,
	);
}

function assignUnits(unitAssignment: EntityInstance, newUnits: readonly EntityInstance[]): void {
	const newUnitTypes = newUnits.map((u) => (u.isA("IfcMonetaryUnit") ? u.isA() : (u.get("UnitType") as string)));

	const kept = new EntityInstanceSet();
	const existing = (unitAssignment.get("Units") as EntityInstance[] | null) ?? [];
	for (const u of existing) {
		const unitTypeAttr = attrOrNull(u, "UnitType") as string | null;
		if (!newUnitTypes.includes(u.isA()) && !newUnitTypes.includes(unitTypeAttr as string)) {
			kept.add(u);
		}
	}
	for (const u of newUnits) kept.add(u);
	unitAssignment.set("Units", kept.values());
}

function getOrCreateUnitAssignment(file: IfcFile): EntityInstance {
	// Throws if the file has no `IfcProject` at all -- matches Python's own
	// `ifc_file.by_type("IfcProject")[0].UnitsInContext`. See `util/unit.ts`'s
	// `getUnitAssignment` doc comment.
	const existing = getUnitAssignment(file);
	if (existing) return existing;
	const unitAssignment = file.createEntity("IfcUnitAssignment");
	const projects = file.byType("IfcProject");
	projects[0].set("UnitsInContext", unitAssignment);
	return unitAssignment;
}

function assignUnitUsecase(file: IfcFile, settings: AssignUnitSettings = {}): EntityInstance {
	// This is a convenience function, likely to be deprecated in the future (Python's
	// own comment, ported verbatim).
	const lengthSpec = settings.length ?? { isMetric: true, raw: "MILLIMETERS" };
	const areaSpec = settings.area ?? { isMetric: true, raw: "METERS" };
	const volumeSpec = settings.volume ?? { isMetric: true, raw: "METERS" };

	let units: EntityInstance[];
	if (settings.units && settings.units.length > 0) {
		units = [...settings.units];
	} else {
		units = [];
		const specs: readonly [SynthesisUnitType, UnitSynthesisSpec][] = [
			["length", lengthSpec],
			["area", areaSpec],
			["volume", volumeSpec],
		];
		for (const [unitType, data] of specs) {
			units.push(data.isMetric ? createMetricUnit(file, unitType, data) : createImperialUnit(file, unitType, data));
		}
	}

	const unitAssignment = getOrCreateUnitAssignment(file);
	assignUnits(unitAssignment, units);
	return unitAssignment;
}

/**
 * Assign default project units (Python: `ifcopenshell.api.unit.assign_unit`).
 *
 * Whenever a unitised quantity is specified, such as a length, area, voltage,
 * pressure, etc, these project units are used by default.
 *
 * It is also possible to override units for specific properties. For example,
 * generally you might want square metres for area measurements, but you might want
 * square millimeters for the measurements of the cross sectional area of cables in
 * cable trays. However, this function only deals with the default project units.
 *
 * @example
 * ```ts
 * // You need a project before you can assign units.
 * api.root.createEntity(model, { ifcClass: "IfcProject" });
 *
 * // Millimeters and square meters
 * const length = api.unit.addSiUnit(model, { unitType: "LENGTHUNIT", prefix: "MILLI" });
 * const area = api.unit.addSiUnit(model, { unitType: "AREAUNIT" });
 *
 * // Optionally, add mass and time units
 * const mass = api.unit.addSiUnit(model, { unitType: "MASSUNIT", prefix: "KILO" });
 * const time = api.unit.addSiUnit(model, { unitType: "TIMEUNIT" });
 *
 * // Make these the default units for the project
 * api.unit.assignUnit(model, { units: [length, area, mass, time] });
 *
 * // Alternatively, you may specify without any arguments to automatically create
 * // millimeters, square meters, and cubic meters as a convenience for testing
 * // purposes. Sorry imperial folks, we prioritise metric here.
 * api.unit.assignUnit(model);
 * ```
 */
export const assignUnit = wrapUsecase("unit.assign_unit", assignUnitUsecase);
