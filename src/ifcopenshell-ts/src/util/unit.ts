// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/unit.py` (src/ifcopenshell-python, 973
// lines, ~24 functions plus module-level lookup tables) --
// planning/ifcopenshell-ts/research/03-python-util-inventory.md's "unit.py" entry,
// next in Phase 3's `util` Tier A sequencing after `util.element`/`util.schema`
// (query/reflection chunk)/`util.attribute`.
//
// **Explicitly NOT in this chunk's scope**: `convert_file_length_units`. This is a
// genuine, disclosed hard blocker, not a "split into a follow-up chunk" situation --
// it transitively imports `ifcopenshell.api.unit`, `ifcopenshell.api.georeference`,
// and `ifcopenshell.util.geolocation`, none of which are ported yet (the `api.*`
// layer is a separate, much-later phase in this project's roadmap,
// `planning/ifcopenshell-ts/20-roadmap.md` Phase 6+). No part of it is ported, stubbed,
// or partially implemented here -- see `TODOS.md`'s own entry for this. Every other
// function/constant in `unit.py` is ported below.
//
// Ported: the module-level lookup tables (`prefixes`, `unitNames`, `siDimensions`,
// `siTypeNames`, `namedDimensions`, `siConversions`, `siOffsets`, `imperialTypes`,
// `prefixSymbols`, `unitSymbols`) and the `QUANTITY_CLASS`/`MEASURE_CLASS` type
// aliases (verbatim data/types, not reformulated), `getPrefix`, `getPrefixMultiplier`,
// `getUnitName`, `getUnitNameUniversal`, `getFullUnitName`, `getSiDimensions`,
// `getNamedDimensions`, `getUnitAssignment`, `cacheUnits`, `clearUnitCache`,
// `getProjectUnit`, `getPropertyUnit`, `getPropertyTableUnit`, `getUnitMeasureClass`,
// `getMeasureUnitType`, `getSymbolMeasureClass`, `getSymbolQuantityClass`,
// `getUnitSymbol`, `convertUnit`, `mmToM`, `convert`, `calculateUnitScale`,
// `formatLength`, `isAttrType`, `iterElementAndAttributesPerType`.
//
// *** Three real, disclosed findings surfaced while building this chunk: ***
//
// 1. A *correction* to `util/element.ts` chunk 1's own disclosed finding #2 (that
//    file's header comment, "the N-API attribute-value shim auto-unwraps `IfcValue`-
//    typed attributes ... directly to a raw JS string/number/boolean"), which
//    `get_property_unit`'s `prop.NominalValue.is_a()` would depend on if true. This
//    chunk built and ran the real native addon against this exact worktree's own
//    commit (manual `clang++` build, no `cmake` in this sandbox -- see the final
//    report) and empirically, reproducibly confirmed the *opposite*: reading
//    `IfcPropertySingleValue.NominalValue` (and `IfcPropertyEnumeratedValue
//    .EnumerationValues`/`IfcPropertyListValue.ListValues`/etc.) off a real,
//    file-parsed instance returns a proper `EntityInstance` handle whose `.isA()`
//    correctly reports the concrete measure class (`"IfcLengthMeasure"`,
//    `"IfcInteger"`, `"IfcLabel"`, ...) and whose `.getByIndex(0)` correctly returns
//    the unwrapped scalar (Python's `.wrappedValue` equivalent) -- not a raw,
//    type-erased JS primitive. `getPropertyUnit`/`getPropertyTableUnit` below are
//    therefore a direct, unblocked port of Python's own `.is_a()`-based dispatch, no
//    workaround needed. Flagged prominently for the orchestrating session to
//    reconcile against `util/element.ts`'s own claim -- not silently overwritten,
//    since that chunk may have been testing a genuinely different code path (e.g. the
//    Proxy's dynamic-property path vs. this chunk's own direct `.get(name)` calls,
//    though both route through the same `getByIndex`/`wrapValue` internally) or a
//    stale local build; this chunk's own finding is a real, reproducible,
//    from-this-exact-commit empirical result, not a guess.
//
// 2. `calculate_unit_scale`'s `IfcSIUnit.Dimensions` access
//    (`dimensions = unit.Dimensions`) reads an EXPRESS *derived* attribute
//    (`IfcNamedUnit.Dimensions` on `IfcSIUnit` is `DERIVE ... :=
//    IfcDeriveDimensionalExponents(Name, Prefix)`, confirmed both by reading the
//    schema and by a real parse: the SPF placeholder `*` is required at that
//    attribute's position for a hand-written `IfcSIUnit` to parse at all) --
//    EXPRESS derived-attribute rule execution is explicitly, project-wide out of
//    scope for this entire TS port (`entityInstance.ts`'s own header comment: "not
//    relevant to a base TS port"; `.get()`/the attribute Proxy both throw "has no
//    attribute" for a derived name, by design). Rather than that being a hard
//    blocker for this one function, `IfcDeriveDimensionalExponents` is a small,
//    pure, **name-only** function (dimensional exponents don't depend on `Prefix` --
//    a prefix is a dimensionless scale factor) whose entire value table is exactly
//    this module's own already-ported `siDimensions` constant (that table's shape --
//    keyed by `IfcSIUnitName`, a 7-tuple of exponents -- *is* `IfcDeriveDimensionalExponents`'s
//    mapping). `calculateUnitScale` below therefore computes `getSiDimensions(unit.Name)`
//    directly instead of reading the derived `.Dimensions` attribute -- semantically
//    identical, not an approximation, and verified to reproduce every one of
//    `test_unit.py::TestCalculateUnitScale`'s three scenarios' exact expected numeric
//    results locally (see the final report) before committing to this approach.
//
// 3. `calculate_unit_scale`'s `IfcUnitEnum` membership validation
//    (`unit_type not in ...enumeration_items()`) hits the exact same, already-disclosed
//    `enumeration_type::enumeration_items()` primitive gap `util/attribute.ts`'s
//    `getEnumItems` documented (no forward index -> name enumeration primitive exists).
//    Per that file's own precedent (`util/schema.ts`'s `reassignClass` /
//    `isEnumMember`), this uses the real, working *reverse* (name -> index) lookup
//    `enumeration_type.lookup_enum_offset(value)` (throws for an unknown name) to
//    answer the single-value membership question this validation actually needs,
//    without requiring the full item list -- not a new gap, the same established
//    workaround applied a third time.
//
// See `EntityInstance.declaration()`/`util/schema.ts`/`util/attribute.ts` for prior
// Phase 3 chunks' own conventions this file reuses directly (the `attrOrNull`/
// `attrList` "Python `getattr(..., default)`" translation idiom from `util/element.ts`,
// duplicated locally here since that module doesn't export them -- matching
// `util/schema.ts`'s own precedent of small per-module private helpers rather than a
// shared cross-module utility file).

import { AttributeCategory, EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";
import type {
	aggregation_type as NativeAggregationType,
	attribute as NativeAttribute,
	declaration as NativeDeclaration,
	parameter_type as NativeParameterType,
} from "../native/ifcopenshell_native";

// --- internal helpers (not exported -- pure translation aids, matching
// `util/element.ts`'s own "getattr(..., default)" idiom; duplicated here rather than
// imported since `element.ts` doesn't export them, per `util/schema.ts`'s own
// "small per-module private helpers" precedent) ---

/** Python's `getattr(instance, name, None)`. */
function attrOrNull(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return null;
	}
}

/** Python's `getattr(instance, name, ()) ` for a list-valued attribute, always an array. */
function attrList(instance: EntityInstance, name: string): EntityInstance[] {
	const value = attrOrNull(instance, name);
	return value === null ? [] : (value as EntityInstance[]);
}

// --- module-level lookup tables (Python: `prefixes`, `unit_names`, `si_dimensions`,
// `si_type_names`, `named_dimensions`, `si_conversions`, `si_offsets`,
// `imperial_types`, `prefix_symbols`, `unit_symbols`) -- verbatim data, ported as
// plain constant objects/arrays, not reformulated. ---

export const prefixes: Record<string, number> = {
	EXA: 1e18,
	PETA: 1e15,
	TERA: 1e12,
	GIGA: 1e9,
	MEGA: 1e6,
	KILO: 1e3,
	HECTO: 1e2,
	DECA: 1e1,
	DECI: 1e-1,
	CENTI: 1e-2,
	MILLI: 1e-3,
	MICRO: 1e-6,
	NANO: 1e-9,
	PICO: 1e-12,
	FEMTO: 1e-15,
	ATTO: 1e-18,
};

export const unitNames: readonly string[] = [
	"AMPERE",
	"BECQUEREL",
	"CANDELA",
	"COULOMB",
	"CUBIC_METRE",
	"DEGREE_CELSIUS",
	"FARAD",
	"GRAM",
	"GRAY",
	"HENRY",
	"HERTZ",
	"JOULE",
	"KELVIN",
	"LUMEN",
	"LUX",
	"MOLE",
	"NEWTON",
	"OHM",
	"PASCAL",
	"RADIAN",
	"SECOND",
	"SIEMENS",
	"SIEVERT",
	"SQUARE_METRE",
	"METRE",
	"STERADIAN",
	"TESLA",
	"VOLT",
	"WATT",
	"WEBER",
];

/** Python: `DimensionalExponents = tuple[int, int, int, int, int, int, int]` (implicit). */
export type DimensionalExponents = readonly [number, number, number, number, number, number, number];

export const siDimensions: Record<string, DimensionalExponents> = {
	METRE: [1, 0, 0, 0, 0, 0, 0],
	SQUARE_METRE: [2, 0, 0, 0, 0, 0, 0],
	CUBIC_METRE: [3, 0, 0, 0, 0, 0, 0],
	GRAM: [0, 1, 0, 0, 0, 0, 0],
	SECOND: [0, 0, 1, 0, 0, 0, 0],
	AMPERE: [0, 0, 0, 1, 0, 0, 0],
	KELVIN: [0, 0, 0, 0, 1, 0, 0],
	MOLE: [0, 0, 0, 0, 0, 1, 0],
	CANDELA: [0, 0, 0, 0, 0, 0, 1],
	RADIAN: [0, 0, 0, 0, 0, 0, 0],
	STERADIAN: [0, 0, 0, 0, 0, 0, 0],
	HERTZ: [0, 0, -1, 0, 0, 0, 0],
	NEWTON: [1, 1, -2, 0, 0, 0, 0],
	PASCAL: [-1, 1, -2, 0, 0, 0, 0],
	JOULE: [2, 1, -2, 0, 0, 0, 0],
	WATT: [2, 1, -3, 0, 0, 0, 0],
	COULOMB: [0, 0, 1, 1, 0, 0, 0],
	VOLT: [2, 1, -3, -1, 0, 0, 0],
	FARAD: [-2, -1, 4, 2, 0, 0, 0],
	OHM: [2, 1, -3, -2, 0, 0, 0],
	SIEMENS: [-2, -1, 3, 2, 0, 0, 0],
	WEBER: [2, 1, -2, -1, 0, 0, 0],
	TESLA: [0, 1, -2, -1, 0, 0, 0],
	HENRY: [2, 1, -2, -2, 0, 0, 0],
	DEGREE_CELSIUS: [0, 0, 0, 0, 1, 0, 0],
	LUMEN: [0, 0, 0, 0, 0, 0, 1],
	LUX: [-2, 0, 0, 0, 0, 0, 1],
	BECQUEREL: [0, 0, -1, 0, 0, 0, 0],
	GRAY: [2, 0, -2, 0, 0, 0, 0],
	SIEVERT: [2, 0, -2, 0, 0, 0, 0],
	OTHERWISE: [0, 0, 0, 0, 0, 0, 0],
};

/** See https://github.com/buildingSMART/IFC4.3.x-development/issues/72 */
export const siTypeNames: Record<string, string> = {
	ABSORBEDDOSEUNIT: "GRAY",
	AMOUNTOFSUBSTANCEUNIT: "MOLE",
	AREAUNIT: "SQUARE_METRE",
	DOSEEQUIVALENTUNIT: "SIEVERT",
	ELECTRICCAPACITANCEUNIT: "FARAD",
	ELECTRICCHARGEUNIT: "COULOMB",
	ELECTRICCONDUCTANCEUNIT: "SIEMENS",
	ELECTRICCURRENTUNIT: "AMPERE",
	ELECTRICRESISTANCEUNIT: "OHM",
	ELECTRICVOLTAGEUNIT: "VOLT",
	ENERGYUNIT: "JOULE",
	FORCEUNIT: "NEWTON",
	FREQUENCYUNIT: "HERTZ",
	ILLUMINANCEUNIT: "LUX",
	INDUCTANCEUNIT: "HENRY",
	LENGTHUNIT: "METRE",
	LUMINOUSFLUXUNIT: "LUMEN",
	LUMINOUSINTENSITYUNIT: "CANDELA",
	MAGNETICFLUXDENSITYUNIT: "TESLA",
	MAGNETICFLUXUNIT: "WEBER",
	MASSUNIT: "GRAM",
	PLANEANGLEUNIT: "RADIAN",
	POWERUNIT: "WATT",
	PRESSUREUNIT: "PASCAL",
	RADIOACTIVITYUNIT: "BECQUEREL",
	SOLIDANGLEUNIT: "STERADIAN",
	THERMODYNAMICTEMPERATUREUNIT: "KELVIN", // Or, DEGREE_CELSIUS, but this is a quirk of IFC
	TIMEUNIT: "SECOND",
	VOLUMEUNIT: "CUBIC_METRE",
	USERDEFINED: "METRE",
};

/**
 * See `IfcDimensionalExponents`:
 * (Length, Mass, Time, ElectricCurrent, ThermodynamicTemperature, AmountOfSubstance, LuminousIntensity)
 */
export const namedDimensions: Record<string, DimensionalExponents> = {
	ABSORBEDDOSEUNIT: [2, 0, -2, 0, 0, 0, 0],
	AMOUNTOFSUBSTANCEUNIT: [0, 0, 0, 0, 0, 1, 0],
	AREAUNIT: [2, 0, 0, 0, 0, 0, 0],
	DOSEEQUIVALENTUNIT: [2, 0, -2, 0, 0, 0, 0],
	ELECTRICCAPACITANCEUNIT: [-2, -1, 4, 2, 0, 0, 0],
	ELECTRICCHARGEUNIT: [0, 0, 1, 1, 0, 0, 0],
	ELECTRICCONDUCTANCEUNIT: [-2, -1, 3, 2, 0, 0, 0],
	ELECTRICCURRENTUNIT: [0, 0, 0, 1, 0, 0, 0],
	ELECTRICRESISTANCEUNIT: [2, 1, -3, -2, 0, 0, 0],
	ELECTRICVOLTAGEUNIT: [2, 1, -3, -1, 0, 0, 0],
	ENERGYUNIT: [2, 1, -2, 0, 0, 0, 0],
	FORCEUNIT: [1, 1, -2, 0, 0, 0, 0],
	FREQUENCYUNIT: [0, 0, -1, 0, 0, 0, 0],
	ILLUMINANCEUNIT: [-2, 0, 0, 0, 0, 1, 1],
	INDUCTANCEUNIT: [2, 1, -2, -2, 0, 0, 0],
	LENGTHUNIT: [1, 0, 0, 0, 0, 0, 0],
	LUMINOUSFLUXUNIT: [0, 0, 0, 0, 0, 1, 1],
	LUMINOUSINTENSITYUNIT: [0, 0, 0, 0, 0, 0, 1],
	MAGNETICFLUXDENSITYUNIT: [0, 1, -2, -1, 0, 0, 0],
	MAGNETICFLUXUNIT: [2, 1, -2, -1, 0, 0, 0],
	MASSUNIT: [0, 1, 0, 0, 0, 0, 0],
	PLANEANGLEUNIT: [0, 0, 0, 0, 0, 0, 0],
	POWERUNIT: [2, 1, -3, 0, 0, 0, 0],
	PRESSUREUNIT: [-1, 1, -2, 0, 0, 0, 0],
	RADIOACTIVITYUNIT: [0, 0, -1, 0, 0, 0, 0],
	SOLIDANGLEUNIT: [0, 0, 0, 0, 0, 0, 0],
	THERMODYNAMICTEMPERATUREUNIT: [0, 0, 0, 0, 1, 0, 0],
	TIMEUNIT: [0, 0, 1, 0, 0, 0, 0],
	VOLUMEUNIT: [3, 0, 0, 0, 0, 0, 0],
	USERDEFINED: [0, 0, 0, 0, 0, 0, 0],
};

export const siConversions: Record<string, number> = {
	thou: 0.0000254,
	inch: 0.0254,
	foot: 0.3048,
	yard: 0.914,
	mile: 1609,
	"square thou": 6.4516e-10,
	"square inch": 0.0006452,
	"square foot": 0.09290304,
	"square yard": 0.83612736,
	acre: 4046.86,
	"square mile": 2588881,
	"cubic thou": 1.6387064e-14,
	"cubic inch": 0.00001639,
	"cubic foot": 0.02831684671168849,
	"cubic yard": 0.7636,
	"cubic mile": 4165509529,
	litre: 0.001,
	"fluid ounce UK": 0.0000284130625,
	"fluid ounce US": 0.00002957353,
	"pint UK": 0.000568,
	"pint US": 0.000473,
	"gallon UK": 0.004546,
	"gallon US": 0.003785,
	degree: Math.PI / 180,
	ounce: 0.02835,
	pound: 0.454,
	"ton UK": 1016.0469088,
	"ton US": 907.18474,
	tonne: 1000.0,
	lbf: 4.4482216153,
	kip: 4448.2216153,
	psi: 6894.7572932,
	ksi: 6894757.2932,
	minute: 60,
	hour: 3600,
	day: 86400,
	btu: 1055.056,
	fahrenheit: 1.8,
};

export const siOffsets: Record<string, number> = {
	fahrenheit: -459.67,
};

export const imperialTypes: Record<string, string> = {
	thou: "LENGTHUNIT",
	inch: "LENGTHUNIT",
	foot: "LENGTHUNIT",
	yard: "LENGTHUNIT",
	mile: "LENGTHUNIT",
	"square thou": "AREAUNIT",
	"square inch": "AREAUNIT",
	"square foot": "AREAUNIT",
	"square yard": "AREAUNIT",
	acre: "AREAUNIT",
	"square mile": "AREAUNIT",
	"cubic thou": "VOLUMEUNIT",
	"cubic inch": "VOLUMEUNIT",
	"cubic foot": "VOLUMEUNIT",
	"cubic yard": "VOLUMEUNIT",
	"cubic mile": "VOLUMEUNIT",
	litre: "VOLUMEUNIT",
	"fluid ounce UK": "VOLUMEUNIT",
	"fluid ounce US": "VOLUMEUNIT",
	"pint UK": "VOLUMEUNIT",
	"pint US": "VOLUMEUNIT",
	"gallon UK": "VOLUMEUNIT",
	"gallon US": "VOLUMEUNIT",
	degree: "PLANEANGLEUNIT",
	ounce: "MASSUNIT",
	pound: "MASSUNIT",
	"ton UK": "MASSUNIT",
	"ton US": "MASSUNIT",
	tonne: "MASSUNIT",
	lbf: "FORCEUNIT",
	kip: "FORCEUNIT",
	psi: "PRESSUREUNIT",
	ksi: "PRESSUREUNIT",
	minute: "TIMEUNIT",
	hour: "TIMEUNIT",
	day: "TIMEUNIT",
	btu: "ENERGYUNIT",
	fahrenheit: "THERMODYNAMICTEMPERATUREUNIT",
};

export const prefixSymbols: Record<string, string> = {
	EXA: "E",
	PETA: "P",
	TERA: "T",
	GIGA: "G",
	MEGA: "M",
	KILO: "k",
	HECTO: "h",
	DECA: "da",
	DECI: "d",
	CENTI: "c",
	MILLI: "m",
	MICRO: "μ",
	NANO: "n",
	PICO: "p",
	FEMTO: "f",
	ATTO: "a",
};

export const unitSymbols: Record<string, string> = {
	// si units
	CUBIC_METRE: "m3",
	GRAM: "g",
	SECOND: "s",
	SQUARE_METRE: "m2",
	METRE: "m",
	NEWTON: "N",
	PASCAL: "Pa",
	// conversion based units
	"pound-force": "lbf",
	"pound-force per square inch": "psi",
	thou: "th",
	inch: "in",
	foot: "ft",
	yard: "yd",
	mile: "mi",
	"square thou": "th2",
	"square inch": "in2",
	"square foot": "ft2",
	"square yard": "yd2",
	acre: "ac",
	"square mile": "mi2",
	"cubic thou": "th3",
	"cubic inch": "in3",
	"cubic foot": "ft3",
	"cubic yard": "yd3",
	"cubic mile": "mi3",
	litre: "L",
	"fluid ounce UK": "fl oz",
	"fluid ounce US": "fl oz",
	"pint UK": "pt",
	"pint US": "pt",
	"gallon UK": "gal",
	"gallon US": "gal",
	degree: "°",
	ounce: "oz",
	pound: "lb",
	"ton UK": "ton",
	"ton US": "ton",
	tonne: "t",
	lbf: "lbf",
	kip: "kip",
	psi: "psi",
	ksi: "ksi",
	minute: "min",
	hour: "hr",
	day: "day",
	btu: "btu",
	fahrenheit: "°F",
};

/**
 * Python: `QUANTITY_CLASS = Literal[..., "IfcQuantityCount"]` (kept `ALL_CAPS`,
 * matching `util/schema.ts`'s own `IFC_SCHEMA` precedent for a Python module-level
 * `Literal` alias -- not camelCased like a regular value binding). Python's own list
 * repeats `"IfcQuantityCount"` twice; a TS union naturally dedupes the repeated
 * member, ported as a single occurrence (the repeat has no type-level effect either
 * way).
 */
export type QUANTITY_CLASS =
	| "IfcQuantityCount"
	| "IfcQuantityNumber"
	| "IfcQuantityLength"
	| "IfcQuantityArea"
	| "IfcQuantityVolume"
	| "IfcQuantityWeight"
	| "IfcQuantityTime";

/** Python: `MEASURE_CLASS = Literal[...]`. */
export type MEASURE_CLASS =
	| "IfcNumericMeasure"
	| "IfcLengthMeasure"
	| "IfcAreaMeasure"
	| "IfcVolumeMeasure"
	| "IfcMassMeasure";

/** Python: `FloatOrSequenceOfFloats = Union[float, tuple["FloatOrSequenceOfFloats", ...]]`. */
export type FloatOrSequenceOfFloats = number | readonly FloatOrSequenceOfFloats[];

// --- small pure lookup functions ---

/** Python: `get_prefix(text) -> Optional[str]`. */
export function getPrefix(text: string | null | undefined): string | null {
	if (text) {
		const upper = text.toUpperCase();
		for (const prefix of Object.keys(prefixes)) {
			if (upper.includes(prefix)) return prefix;
		}
	}
	return null;
}

/** Python: `get_prefix_multiplier(text) -> float`. */
export function getPrefixMultiplier(text: string | null | undefined): number {
	if (!text) return 1;
	const prefix = getPrefix(text);
	return prefix ? prefixes[prefix] : 1;
}

/** Python: `get_unit_name(text: str) -> Union[str, None]`. Get unit name from str, if unit is in SI. */
export function getUnitName(text: string): string | null {
	const upper = text.toUpperCase().replaceAll("METER", "METRE");
	for (const name of unitNames) {
		if (upper.includes(name.replaceAll("_", " "))) return name;
	}
	return null;
}

/**
 * Python: `get_unit_name_universal(text: str) -> Union[str, None]`. Get unit name
 * from str, supports both SI and imperial system. Can be used to provide units for
 * `convert()`.
 */
export function getUnitNameUniversal(text: string): string | null {
	const upper = text.toUpperCase().replaceAll("METER", "METRE");
	for (const name of unitNames) {
		if (upper.includes(name.replaceAll("_", " "))) return name;
	}
	for (const name of Object.keys(imperialTypes)) {
		if (upper.includes(name.toUpperCase())) return name;
	}
	return null;
}

/** Python: `get_full_unit_name(unit: entity_instance) -> str`. */
export function getFullUnitName(unit: EntityInstance): string {
	const prefix = (attrOrNull(unit, "Prefix") as string | null) ?? "";
	return prefix + (unit.get("Name") as string).toUpperCase();
}

/** Python: `get_si_dimensions(name) -> DimensionalExponents`. */
export function getSiDimensions(name: string): DimensionalExponents {
	return siDimensions[name] ?? siDimensions.OTHERWISE;
}

/** Python: `get_named_dimensions(name) -> DimensionalExponents`. */
export function getNamedDimensions(name: string): DimensionalExponents {
	return namedDimensions[name] ?? [0, 0, 0, 0, 0, 0, 0];
}

// --- project/property unit resolution ---

/**
 * Python: `get_unit_assignment(ifc_file) -> Union[entity_instance, None]`.
 *
 * Python's `ifc_file.by_type("IfcProject")[0].UnitsInContext` raises an uncaught
 * `IndexError` when the file has no `IfcProject` at all -- a malformed-file
 * condition, not the same thing as "a real `IfcProject` with no units assigned yet"
 * (which legitimately returns `null` below). An earlier version of this function
 * used `attrOrNull` for the `projects[0]` access too, which (per `/code-review`,
 * caught before this landed) silently swallowed that `undefined`-access crash into a
 * plain `null` return -- masking the missing-`IfcProject` case as an ordinary "no
 * units" result instead of failing loudly like Python does. Fixed by indexing
 * `projects[0]` directly (not through `attrOrNull`) so a missing project still
 * throws; only the *attribute* lookup on a real project uses `attrOrNull` (a
 * project's `UnitsInContext` is legitimately allowed to be unset).
 */
export function getUnitAssignment(ifcFile: IfcFile): EntityInstance | null {
	const projects = ifcFile.byType("IfcProject");
	const project = projects[0];
	if (project === undefined) {
		throw new RangeError("get_unit_assignment: ifc_file has no IfcProject (list index out of range)");
	}
	return attrOrNull(project, "UnitsInContext") as EntityInstance | null;
}

/**
 * Python: `cache_units(ifc_file) -> None`. Cache the default units for performance --
 * repetitively fetching project units (such as for determining the unit of a
 * property) can be costly. If the project units change, rerun this to update the
 * cache. Threads through `IfcFile.units` (`file.ts`'s `FileState.units`, added by
 * this chunk following the `toDelete` precedent -- see that field's own doc comment).
 */
export function cacheUnits(ifcFile: IfcFile): void {
	ifcFile.units = {};
	const assignment = getUnitAssignment(ifcFile);
	if (assignment) {
		const units: Record<string, EntityInstance> = {};
		for (const u of attrList(assignment, "Units")) {
			const unitType = attrOrNull(u, "UnitType") as string | null;
			if (unitType) units[unitType] = u;
		}
		ifcFile.units = units;
	}
}

/** Python: `clear_unit_cache(ifc_file) -> None`. Clears the unit cache of the project. */
export function clearUnitCache(ifcFile: IfcFile): void {
	ifcFile.units = {};
}

/**
 * Python: `get_project_unit(ifc_file, unit_type, use_cache=False) -> Union[entity_instance, None]`.
 * Get the default project unit of a particular unit type (e.g. `"LENGTHUNIT"`).
 */
export function getProjectUnit(ifcFile: IfcFile, unitType: string, useCache = false): EntityInstance | null {
	if (useCache && Object.keys(ifcFile.units).length === 0) {
		cacheUnits(ifcFile);
	}
	const units = ifcFile.units;
	if (Object.keys(units).length > 0) {
		return units[unitType] ?? null;
	}
	const unitAssignment = getUnitAssignment(ifcFile);
	if (unitAssignment) {
		for (const unit of attrList(unitAssignment, "Units")) {
			if ((attrOrNull(unit, "UnitType") as string | null) === unitType) return unit;
		}
	}
	return null;
}

/**
 * Python: `get_property_unit(prop, ifc_file, use_cache=False) -> Union[entity_instance, None]`.
 *
 * Gets the unit definition of a property or quantity. Properties and quantities in
 * psets and qtos can be associated with a unit, defined at the property itself
 * explicitly or, if not specified, falling back to the project default.
 *
 * See this file's header comment, finding #1: `prop.get("NominalValue")` etc. return
 * real `EntityInstance` handles with a working `.isA()`, confirmed empirically --
 * this is a direct port of Python's own `.is_a()`-based dispatch, not a workaround.
 */
export function getPropertyUnit(
	prop: EntityInstance,
	ifcFile: IfcFile | null,
	useCache = false,
): EntityInstance | null {
	const explicitUnit = attrOrNull(prop, "Unit") as EntityInstance | null;
	if (explicitUnit) return explicitUnit;

	let measureClass: string | null = null;

	if (prop.isA("IfcPhysicalSimpleQuantity")) {
		// `entity.attribute_by_index(3).type_of_attribute().declared_type().name()` in
		// Python -- `type_of_attribute()` for a physical-simple-quantity's own measure
		// value attribute (index 3, e.g. `IfcQuantityLength.LengthValue`) is always a
		// `named_type`, so `.as_named_type()` (the structured-walk equivalent of
		// Python's dynamic dispatch, matching `util/attribute.ts`'s own established
		// approach) is expected to succeed; verified against a real parsed
		// `IfcQuantityLength` (see the final report).
		const entityDeclaration = prop.declaration().as_entity();
		const namedType = entityDeclaration?.attribute_by_index(3).type_of_attribute().as_named_type();
		measureClass = namedType ? namedType.declared_type().name() : null;
	} else if (prop.isA("IfcPropertySingleValue")) {
		const nominalValue = attrOrNull(prop, "NominalValue") as EntityInstance | null;
		measureClass = nominalValue ? nominalValue.isA() : null;
	} else if (prop.isA("IfcPropertyEnumeratedValue")) {
		// Not `elif`/mutually exclusive in Python: the own `EnumerationValues` check
		// below always runs too (if present, its result overwrites `measureClass`),
		// *unless* `EnumerationReference.Unit` already triggered an early return --
		// ported exactly, see `test_unit.py::TestGetPropertyUnit::test_enumerated_value`.
		const enumerationReference = attrOrNull(prop, "EnumerationReference") as EntityInstance | null;
		if (enumerationReference) {
			const referenceUnit = attrOrNull(enumerationReference, "Unit") as EntityInstance | null;
			if (referenceUnit) return referenceUnit;
			const referenceValue = attrList(enumerationReference, "EnumerationValues")[0];
			if (referenceValue) measureClass = referenceValue.isA();
		}
		const ownValue = attrList(prop, "EnumerationValues")[0];
		if (ownValue) measureClass = ownValue.isA();
	} else if (prop.isA("IfcPropertyListValue")) {
		const value = attrList(prop, "ListValues")[0];
		if (value) measureClass = value.isA();
	} else if (prop.isA("IfcPropertyBoundedValue")) {
		const value =
			(attrOrNull(prop, "UpperBoundValue") as EntityInstance | null) ??
			(attrOrNull(prop, "LowerBoundValue") as EntityInstance | null) ??
			(attrOrNull(prop, "SetPointValue") as EntityInstance | null);
		if (value) measureClass = value.isA();
	}

	if (measureClass) {
		const unitType = getMeasureUnitType(measureClass);
		if (unitType) {
			const file = ifcFile ?? (prop.file as IfcFile);
			return getProjectUnit(file, unitType, useCache);
		}
	}
	return null;
}

/**
 * Python: `get_property_table_unit(prop, ifc_file, use_cache=False) ->
 * dict[str, Union[entity_instance, None]]`.
 *
 * Gets the unit definition of a property table (`IfcPropertyTableValue`).
 */
export function getPropertyTableUnit(
	prop: EntityInstance,
	ifcFile: IfcFile | null,
	useCache = false,
): { DefiningUnit: EntityInstance | null; DefinedUnit: EntityInstance | null } {
	const file = ifcFile ?? (prop.file as IfcFile);

	let definingUnit = attrOrNull(prop, "DefiningUnit") as EntityInstance | null;
	if (!definingUnit) {
		const value = attrList(prop, "DefiningValues")[0];
		if (value) {
			const unitType = getMeasureUnitType(value.isA());
			if (unitType) definingUnit = getProjectUnit(file, unitType, useCache);
		}
	}

	let definedUnit = attrOrNull(prop, "DefinedUnit") as EntityInstance | null;
	if (!definedUnit) {
		const value = attrList(prop, "DefinedValues")[0];
		if (value) {
			const unitType = getMeasureUnitType(value.isA());
			if (unitType) definedUnit = getProjectUnit(file, unitType, useCache);
		}
	}

	return { DefiningUnit: definingUnit, DefinedUnit: definedUnit };
}

// --- measure/quantity class <-> unit type ---

/**
 * Python: `get_unit_measure_class(unit_type: str) -> MEASURE_CLASS`. Get the IFC
 * measure class for a unit type (e.g. `LENGTHUNIT` -> `IfcLengthMeasure`). The
 * inverse of `getMeasureUnitType`.
 */
export function getUnitMeasureClass(unitType: string): MEASURE_CLASS {
	if (unitType === "USERDEFINED") {
		// See https://github.com/buildingSMART/IFC4.3.x-development/issues/71
		return "IfcNumericMeasure";
	}
	const base = unitType.slice(0, -4).toLowerCase();
	const capitalized = base.charAt(0).toUpperCase() + base.slice(1);
	return `Ifc${capitalized}Measure` as MEASURE_CLASS;
}

/**
 * Python: `get_measure_unit_type(measure_class: MEASURE_CLASS) -> str`. Get the unit
 * type of an IFC measure class. The inverse of `getUnitMeasureClass`.
 *
 * `measureClass` is typed loosely (`string`, not `MEASURE_CLASS`) -- Python's own
 * `MEASURE_CLASS` parameter type hint isn't enforced at runtime, and this function's
 * real callers (`getPropertyUnit`/`getPropertyTableUnit` above) pass arbitrary
 * `.isA()` results (`"IfcLabel"`, `"IfcInteger"`, ...), not just the five canonical
 * measure classes -- ported to accept exactly what Python's own callers actually
 * pass.
 */
export function getMeasureUnitType(measureClass: string): string {
	if (measureClass === "IfcNumericMeasure") {
		// See https://github.com/buildingSMART/IFC4.3.x-development/issues/71
		return "USERDEFINED";
	}
	let result = measureClass;
	for (const text of ["Ifc", "Measure", "Non", "Positive", "Negative"]) {
		// Python's `str.replace` replaces every occurrence by default -- `replaceAll`
		// matches that (a plain `.replace(text, "")` would only strip the first hit).
		result = result.replaceAll(text, "");
	}
	return `${result.toUpperCase()}UNIT`;
}

/**
 * Python: `get_symbol_measure_class(symbol=None) -> MEASURE_CLASS`.
 *
 * Faithfully-preserved Python quirk: the function's own body returns
 * `"IfcTimeMeasure"` for a time symbol, but Python's own `MEASURE_CLASS` Literal
 * (ported verbatim above) does not include `"IfcTimeMeasure"` as a member -- a real
 * inconsistency in `unit.py`'s own type hints, not something this port "fixes" (see
 * this file's header comment / `util/schema.ts`'s own "port the documented quirk"
 * precedent). The return type here is therefore `MEASURE_CLASS | "IfcTimeMeasure"`,
 * not the narrower `MEASURE_CLASS` alone, so this compiles without silently lying to
 * callers.
 */
export function getSymbolMeasureClass(symbol?: string | null): MEASURE_CLASS | "IfcTimeMeasure" {
	// Dumb, but everybody gets it, unlike regex golf.
	if (!symbol) return "IfcNumericMeasure";
	const s = symbol.toLowerCase();
	if (["km", "m", "cm", "mm", "ly", "lf", "lin", "yd", "ft", "in"].includes(s)) return "IfcLengthMeasure";
	if (["km2", "m2", "cm2", "mm2", "sqy", "sqft", "sqin"].includes(s)) return "IfcAreaMeasure";
	if (["km3", "m3", "cm3", "mm3", "cy", "cft", "cin"].includes(s)) return "IfcVolumeMeasure";
	if (["kg", "g", "mt", "kt", "t"].includes(s)) return "IfcMassMeasure";
	if (["day", "d", "hour", "hr", "h", "minute", "min", "m", "second", "sec", "s"].includes(s)) return "IfcTimeMeasure";
	return "IfcNumericMeasure";
}

/** Python: `get_symbol_quantity_class(symbol=None) -> QUANTITY_CLASS`. */
export function getSymbolQuantityClass(symbol?: string | null): QUANTITY_CLASS {
	// Dumb, but everybody gets it, unlike regex golf.
	if (!symbol) return "IfcQuantityCount";
	const s = symbol.toLowerCase();
	if (["km", "m", "cm", "mm", "ly", "lf", "lin", "yd", "ft", "in"].includes(s)) return "IfcQuantityLength";
	if (["km2", "m2", "cm2", "mm2", "sqy", "sqft", "sqin"].includes(s)) return "IfcQuantityArea";
	if (["km3", "m3", "cm3", "mm3", "cy", "cft", "cin"].includes(s)) return "IfcQuantityVolume";
	if (["kg", "g", "mt", "kt", "t"].includes(s)) return "IfcQuantityWeight";
	if (["day", "d", "hour", "hr", "h", "minute", "min", "m", "second", "sec", "s"].includes(s)) return "IfcQuantityTime";
	return "IfcQuantityCount";
}

/** Python: `get_unit_symbol(unit: entity_instance) -> str`. */
export function getUnitSymbol(unit: EntityInstance): string {
	let symbol = "";
	if (unit.isA("IfcSIUnit")) {
		const prefix = attrOrNull(unit, "Prefix") as string | null;
		symbol += (prefix ? prefixSymbols[prefix] : undefined) ?? "";
	}
	const name = unit.get("Name") as string;
	symbol += unitSymbols[name.replaceAll("METER", "METRE")] ?? "?";
	if (unit.isA("IfcContextDependentUnit") && (attrOrNull(unit, "UnitType") as string | null) === "USERDEFINED") {
		symbol = unit.get("Name") as string;
	}
	return symbol;
}

// --- scalar conversion ---

/**
 * Python: `convert_unit(value, from_unit, to_unit) -> float`. Convert from one unit
 * to another unit.
 */
export function convertUnit(value: number, fromUnit: EntityInstance, toUnit: EntityInstance): number {
	return convert(
		value,
		attrOrNull(fromUnit, "Prefix") as string | null,
		fromUnit.get("Name") as string,
		attrOrNull(toUnit, "Prefix") as string | null,
		toUnit.get("Name") as string,
	);
}

/** Python: `mm_to_m(value: float) -> float`. Convert a millimetre value to metres. */
export function mmToM(value: number): number {
	return value / 1000;
}

/**
 * Python: `convert(value, from_prefix, from_unit, to_prefix, to_unit) -> float`.
 * Converts between length, area, and volume units -- manually specify the names and
 * (optionally) prefixes to convert to and from. To automatically convert to units
 * already available as IFC entities, use `convertUnit` instead.
 *
 * Faithfully-preserved Python quirk: both the "from" and "to" SQUARE/CUBIC exponent
 * checks below test `fromUnit` (never `toUnit`), even in the `to_unit`-conversion
 * branch -- ported exactly as written, not "fixed" to check `toUnit` there, matching
 * this project's verbatim-translation mandate.
 */
export function convert(
	value: number,
	fromPrefix: string | null | undefined,
	fromUnit: string,
	toPrefix: string | null | undefined,
	toUnit: string,
): number {
	let result = value;
	if (fromUnit.toLowerCase() in siConversions) {
		result *= siConversions[fromUnit.toLowerCase()];
	} else if (fromPrefix) {
		result *= getPrefixMultiplier(fromPrefix);
		if (fromUnit.includes("SQUARE")) {
			result *= getPrefixMultiplier(fromPrefix);
		} else if (fromUnit.includes("CUBIC")) {
			result *= getPrefixMultiplier(fromPrefix);
			result *= getPrefixMultiplier(fromPrefix);
		}
	}
	if (toUnit.toLowerCase() in siConversions) {
		return result * (1 / siConversions[toUnit.toLowerCase()]);
	}
	if (toPrefix) {
		result *= 1 / getPrefixMultiplier(toPrefix);
		if (fromUnit.includes("SQUARE")) {
			result *= 1 / getPrefixMultiplier(toPrefix);
		} else if (fromUnit.includes("CUBIC")) {
			result *= 1 / getPrefixMultiplier(toPrefix);
			result *= 1 / getPrefixMultiplier(toPrefix);
		}
	}
	return result;
}

// --- calculateUnitScale ---

/**
 * @internal Answers `IfcUnitEnum` membership without needing the (unbound, see this
 * file's header comment, finding #3) full forward enumeration-item list --
 * `enumeration_type.lookup_enum_offset(value)` is a real, working reverse (name ->
 * index) lookup that throws for an unknown name.
 */
function isValidUnitEnumMember(ifcFile: IfcFile, unitType: string): boolean {
	const enumerationType = ifcFile.nativeFile
		.schema()
		.declaration_by_name_with_name("IfcUnitEnum")
		.as_enumeration_type();
	if (enumerationType === null) {
		// Should never happen for a real, schema-registered file -- `IfcUnitEnum` is a
		// real enumeration in every IFC schema version this project supports.
		return true;
	}
	try {
		enumerationType.lookup_enum_offset(unitType);
		return true;
	} catch {
		return false;
	}
}

/**
 * Python: `calculate_unit_scale(ifc_file, unit_type="LENGTHUNIT") -> float`.
 *
 * Returns a unit scale factor to convert to and from IFC project units and SI units:
 * `ifc_project_length * unit_scale = si_meters`.
 *
 * Python's own `type(ifc_file) is ifcopenshell.file` guard (skipping validation for a
 * mocked/subclassed file object in Python's own test suite) has no TS equivalent to
 * skip -- `IfcFile` is the only concrete class this port has, so the `IfcUnitEnum`
 * membership check always runs. See this file's header comment, findings #2 (the
 * `IfcSIUnit.Dimensions` derived-attribute workaround via `getSiDimensions`) and #3
 * (the `IfcUnitEnum` validation workaround).
 */
export function calculateUnitScale(ifcFile: IfcFile, unitType = "LENGTHUNIT"): number {
	if (!isValidUnitEnumMember(ifcFile, unitType)) {
		throw new Error(`Unit type '${unitType}' does not name a valid type`);
	}

	// Currently we assume that all ifc projects must have IfcProject.
	const projects = ifcFile.byType("IfcProject");
	if (projects.length === 0) return 1;
	const unitsInContext = attrOrNull(projects[0], "UnitsInContext") as EntityInstance | null;
	if (!unitsInContext) return 1;

	let unitScale = 1;
	for (const rawUnit of attrList(unitsInContext, "Units")) {
		let unit = rawUnit;
		if ((attrOrNull(unit, "UnitType") as string | null) !== unitType) continue;

		while (unit.isA("IfcConversionBasedUnit")) {
			const conversionFactor = unit.get("ConversionFactor") as EntityInstance;
			const valueComponent = conversionFactor.get("ValueComponent") as EntityInstance;
			unitScale *= valueComponent.getByIndex(0) as number;
			unit = conversionFactor.get("UnitComponent") as EntityInstance;
		}
		if (unit.isA("IfcSIUnit")) {
			let prefixMultiplier = getPrefixMultiplier(attrOrNull(unit, "Prefix") as string | null);
			// An SI prefix attaches to the base unit symbol, and the prefixed symbol is
			// raised to the power as a whole: dm3 = (dm)3 = 1e-3 m3, not 0.1 m3. For units
			// whose dimensions are a pure power of length (METRE, SQUARE_METRE,
			// CUBIC_METRE) the prefix multiplier must therefore be raised to the length
			// exponent. Units with mixed or non-length dimensions (PASCAL, NEWTON, GRAM,
			// ...) keep the linear multiplier, as there the prefix scales the derived unit
			// itself. https://github.com/IfcOpenShell/IfcOpenShell/issues/9278
			//
			// See this file's header comment, finding #2: computed via `getSiDimensions`
			// (name-keyed, prefix-independent) instead of reading the real EXPRESS
			// *derived* `unit.Dimensions` attribute (out of scope for this whole port).
			const dimensions = getSiDimensions(unit.get("Name") as string);
			const [
				lengthExponent,
				massExponent,
				timeExponent,
				currentExponent,
				temperatureExponent,
				amountExponent,
				luminousExponent,
			] = dimensions;
			const hasOtherDimension =
				massExponent !== 0 ||
				timeExponent !== 0 ||
				currentExponent !== 0 ||
				temperatureExponent !== 0 ||
				amountExponent !== 0 ||
				luminousExponent !== 0;
			if (lengthExponent > 0 && !hasOtherDimension) {
				prefixMultiplier **= lengthExponent;
			}
			unitScale *= prefixMultiplier;
		}
	}
	return unitScale;
}

// --- formatLength ---

/**
 * Python's `round()` for a `float` uses round-half-to-even ("banker's rounding")
 * ties, unlike JS's `Math.round` (always rounds a `.5` tie toward +Infinity) --
 * `format_length`'s whole purpose is exact, human-readable rounding, so this
 * replicates Python's tie-breaking rule (within a small floating-point epsilon,
 * since an exact `.5` tie is itself rarely bit-exact after prior float arithmetic)
 * rather than accepting `Math.round`'s different behavior on that one edge case.
 *
 * Exported (not `@internal`) because `util/selector.ts`'s `round()` format function
 * needs the exact same half-even tie-break (it goes through Python's `Decimal`, which
 * defaults to the same `ROUND_HALF_EVEN` rule) -- reused directly rather than
 * duplicated, per `/code-review`'s finding on that chunk's PR.
 */
export function pythonRound(x: number): number {
	const floor = Math.floor(x);
	const diff = x - floor;
	const EPSILON = 1e-9;
	if (Math.abs(diff - 0.5) < EPSILON) {
		return floor % 2 === 0 ? floor : floor + 1;
	}
	return Math.round(x);
}

/** @internal Greatest common divisor, for exact-fraction reduction below. */
function gcd(a: number, b: number): number {
	let x = Math.abs(a);
	let y = Math.abs(b);
	while (y !== 0) {
		[x, y] = [y, x % y];
	}
	return x;
}

/**
 * @internal Minimal exact-fraction reduction to lowest terms, matching Python's
 * `Fraction(numerator, denominator)`'s automatic normalization (always-positive
 * denominator, reduced by the pair's gcd) -- JS has no built-in rational-number type.
 */
function reduceFraction(numerator: number, denominator: number): { numerator: number; denominator: number } {
	const sign = denominator < 0 ? -1 : 1;
	const signedNumerator = sign * numerator;
	const signedDenominator = sign * denominator;
	const divisor = gcd(signedNumerator, signedDenominator) || 1;
	return { numerator: signedNumerator / divisor, denominator: signedDenominator / divisor };
}

/**
 * Python: `format_length(value, precision, decimal_places=2,
 * suppress_zero_inches=True, unit_system="imperial", input_unit="foot",
 * output_unit="foot") -> str`.
 *
 * Formats a length for readability and imperial formatting.
 *
 * :param value: The value in meters if metric, or either decimal feet or inches if
 *     imperial depending on `inputUnit`.
 * :param precision: How precise the format should be, i.e. round to nearest. For
 *     imperial, it is 1/Nth -- e.g. 12 means to the nearest 1/12th of an inch.
 * :param decimalPlaces: How many decimal places to display. Defaults to 2.
 * :param suppressZeroInches: If imperial, whether to suppress the inches if the
 *     inches is zero.
 * :param unitSystem: Whether `value` is `"metric"` or `"imperial"`.
 * :param inputUnit: If imperial, whether `value` is `"foot"` or `"inch"`.
 * :param outputUnit: If imperial, `"foot"` to format as both feet and inches, or
 *     `"inch"` if only inches should be shown.
 * :returns: The formatted string, such as `1' - 5 1/2"`.
 *
 * Faithfully-ported divergence: this uses JS's `%`, matching Python's `%`'s result
 * *unless* an operand is negative (Python's modulo result takes the sign of the
 * divisor; JS's takes the sign of the dividend) -- untested and undocumented for
 * negative lengths in Python's own test suite either, so not specially handled here,
 * matching this project's "don't add robustness beyond what's needed" convention.
 */
export function formatLength(
	value: number,
	precision: number,
	decimalPlaces = 2,
	suppressZeroInches = true,
	unitSystem: "metric" | "imperial" = "imperial",
	inputUnit: "foot" | "inch" = "foot",
	outputUnit: "foot" | "inch" = "foot",
): string {
	if (unitSystem === "imperial") {
		let feet: number;
		let inches: number;
		if (inputUnit === "foot") {
			feet = Math.trunc(value);
			inches = (value - feet) * 12;
		} else {
			inches = value % 12;
			feet = pythonRound((value - inches) / 12);
		}

		// Round to the nearest 1/N.
		const nearest = pythonRound(inches * precision);

		// Create a fraction based on the rounded value and the precision.
		const frac = reduceFraction(nearest, precision);

		// If fraction is a whole number, format it accordingly.
		if (frac.denominator === 1) {
			if (suppressZeroInches && frac.numerator === 0) {
				if (outputUnit === "foot") return `${feet}'`;
				return `${feet * 12}"`;
			}
			if (outputUnit === "foot") return `${feet}' - ${frac.numerator}"`;
			return `${feet * 12 + frac.numerator}"`;
		}
		if (frac.numerator > frac.denominator) {
			const remainder = frac.numerator % frac.denominator;
			const whole = (frac.numerator - remainder) / frac.denominator;
			if (outputUnit === "foot") return `${feet}' - ${whole} ${remainder}/${frac.denominator}"`;
			return `${feet * 12 + whole} ${remainder}/${frac.denominator}"`;
		}
		// When we have a proper fraction (numerator < denominator), show "0 frac".
		if (outputUnit === "foot") return `${feet}' - 0 ${frac.numerator}/${frac.denominator}"`;
		return `${feet * 12} ${frac.numerator}/${frac.denominator}"`;
	}
	// metric
	const roundedVal = pythonRound(value / precision) * precision;
	return roundedVal.toFixed(decimalPlaces);
}

// --- isAttrType / iterElementAndAttributesPerType ---

/**
 * @internal Recursive walk starting from a `declaration` node (a `type_declaration`/
 * `select_type`/`enumeration_type`/`entity` -- anything with a `.name()`). Python's
 * `hasattr(cur_decl, "name")`/`"select_list"`/`"declared_type"` duck-typing, ported as
 * structural `as_*` dispatch on the real primitive-layer classes (per this chunk's
 * own instructions to prefer that over duck-typing where the underlying classes are
 * real and distinct, not duck-typed like Python's SWIG wrappers).
 */
function isAttrTypeFromDeclaration(
	declaration: NativeDeclaration,
	ifcUnitTypeName: string,
	includeSelectTypes: boolean,
): NativeDeclaration | null {
	if (declaration.name() === ifcUnitTypeName) {
		return declaration;
	}
	if (includeSelectTypes) {
		const selectType = declaration.as_select_type();
		if (selectType !== null) {
			for (const selectItem of selectType.select_list()) {
				// Faithfully-preserved Python quirk: the recursive call here
				// (`is_attr_type(select_item, ifc_unit_type_name)`) omits
				// `include_select_types`, so it always defaults to `True` regardless of
				// this call's own `includeSelectTypes` value -- ported exactly, not
				// "fixed" to thread the outer value through.
				if (isAttrTypeFromDeclaration(selectItem, ifcUnitTypeName, true) !== null) {
					return selectItem;
				}
			}
		}
	}
	const typeDeclaration = declaration.as_type_declaration();
	if (typeDeclaration !== null) {
		return isAttrTypeFromParameter(typeDeclaration.declared_type(), ifcUnitTypeName, includeSelectTypes);
	}
	return null;
}

/**
 * @internal Recursive walk starting from a `parameter_type` node (a `named_type`/
 * `simple_type`/`aggregation_type`). See `isAttrTypeFromDeclaration`'s own comment.
 */
function isAttrTypeFromParameter(
	parameterType: NativeParameterType,
	ifcUnitTypeName: string,
	includeSelectTypes: boolean,
): NativeDeclaration | null {
	const namedType = parameterType.as_named_type();
	if (namedType !== null) {
		return isAttrTypeFromDeclaration(namedType.declared_type(), ifcUnitTypeName, includeSelectTypes);
	}
	const aggregation = parameterType.as_aggregation_type();
	if (aggregation !== null) {
		// Support aggregate of aggregates, as in `IfcCartesianPointList3D.CoordList`.
		let cursor: NativeAggregationType = aggregation;
		let elementType: NativeParameterType = cursor.type_of_element();
		let nested = elementType.as_aggregation_type();
		while (nested !== null) {
			cursor = nested;
			elementType = cursor.type_of_element();
			nested = elementType.as_aggregation_type();
		}
		const elementNamedType = elementType.as_named_type();
		if (elementNamedType === null) {
			// A real, empirically-hit case (not a hypothetical): e.g.
			// `IfcCompoundPlaneAngleMeasure = LIST [3:4] OF INTEGER` (reachable from
			// `IfcValue`'s own select hierarchy, which every `IfcPropertySingleValue
			// .NominalValue` search walks) has a raw, non-named `INTEGER` aggregate
			// element. This does NOT crash Python's own `is_attr_type`: `simple_type` (the
			// C++ class backing a raw element type -- `src/ifcparse/schema.h`) has its
			// OWN, differently-shaped `declared_type()` method (returns a `data_type`
			// enum, not a `declaration*`) -- so Python's `cur_decl.declared_type()` call
			// here succeeds, producing a plain enum value, and the *next* recursive
			// `is_attr_type(cur_decl, ...)` call on that enum value fails every one of its
			// `hasattr` checks (`name`/`select_list`/`declared_type`) and safely falls
			// through to `return None` -- verified against a real crash-vs-no-crash
			// difference (this exact case initially, incorrectly, threw here -- caught by
			// this chunk's own tests exercising `isAttrType(nominalValue,
			// "IfcLengthMeasure")` against a real schema, not by reasoning alone). Ported
			// as the equivalent, direct `null` return -- not a crash -- so a later select
			// member (e.g. `IfcLengthMeasure`, alphabetically after `IfcComplexNumber`/
			// `IfcCompoundPlaneAngleMeasure` in this schema's generated `select_list()`
			// order) still gets a chance to match.
			return null;
		}
		return isAttrTypeFromDeclaration(elementNamedType.declared_type(), ifcUnitTypeName, includeSelectTypes);
	}
	// `simple_type`: no `.name()`, no `.declared_type()`, not an aggregation -- null.
	return null;
}

/**
 * Python: `is_attr_type(content_type, ifc_unit_type_name, include_select_types=True)
 * -> Union[declaration, None]`.
 *
 * See `isAttrTypeFromDeclaration`/`isAttrTypeFromParameter`'s own doc comments for
 * the structural-walk translation of Python's `hasattr`-based duck typing.
 */
export function isAttrType(
	contentType: NativeParameterType,
	ifcUnitTypeName: string,
	includeSelectTypes = true,
): NativeDeclaration | null {
	return isAttrTypeFromParameter(contentType, ifcUnitTypeName, includeSelectTypes);
}

/**
 * Python: `iter_element_and_attributes_per_type(ifc_file, attr_type_name) ->
 * Generator[tuple[entity_instance, attribute, ...], None, None]`.
 *
 * Yields `(element, attribute, value)` triples for every entity/attribute in the
 * whole file whose declared type matches `attrTypeName`. Used internally by the
 * out-of-scope `convert_file_length_units` (Python), but is itself in scope -- ported
 * as a TS generator function, with its own dedicated tests exercising it directly
 * (see `test/util/unit.test.ts`), not just as a stepping stone to a function this
 * chunk doesn't port.
 *
 * Python's `entity.derived()` (a bulk forward-vs-derived split) has no N-API binding
 * (the same real, disclosed gap `attributeCache.ts`'s own header comment documents in
 * detail) -- worked around exactly as that module already established: `element
 * ._resolveTypeInfo().cache.list` (this project's existing attribute-metadata cache,
 * already excludes derived slots) stands in for the `attrs`/`attrs_derived`
 * zip-and-filter Python does by hand, not a new workaround.
 */
export function* iterElementAndAttributesPerType(
	ifcFile: IfcFile,
	attrTypeName: string,
): Generator<[EntityInstance, NativeAttribute, FloatOrSequenceOfFloats | EntityInstance], void, void> {
	for (const element of ifcFile) {
		const entityDeclaration = element.declaration().as_entity();
		if (entityDeclaration === null) {
			throw new Error(`iterElementAndAttributesPerType: '${element.isA()}' has no entity declaration`);
		}
		const forwardMeta = element
			._resolveTypeInfo()
			.cache.list.filter((meta) => meta.category === AttributeCategory.FORWARD);
		for (const meta of forwardMeta) {
			const attr = entityDeclaration.attribute_by_index(meta.index);
			const baseType = isAttrType(attr.type_of_attribute(), attrTypeName);
			if (baseType === null) continue;

			const val = element.getByIndex(meta.index);
			if (val === null) continue;

			if (val instanceof EntityInstance) {
				if (!val.isA(attrTypeName)) continue;
				yield [element, attr, val];
				continue;
			}
			if (Array.isArray(val)) {
				if (val.length === 0) continue;
				const first = val[0];
				// If it's a tuple of entities, just yield the entities we need to edit.
				if (first instanceof EntityInstance) {
					for (const v of val) {
						if (!(v instanceof EntityInstance) || !v.isA(attrTypeName)) continue;
						yield [element, attr, v];
					}
					continue;
				}
			}
			yield [element, attr, val as FloatOrSequenceOfFloats];
		}
	}
}
