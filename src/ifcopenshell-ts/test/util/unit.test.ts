// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_unit.py` (src/ifcopenshell-python), covering this
// chunk's scope (everything in `unit.py` except `convert_file_length_units` -- see
// `src/util/unit.ts`'s own header comment). `TestConvertFileLengthUnits`/
// `TestConvertFileLengthUnitsIFC4`/`TestConvertFileLengthUnitsIFC4X3` have no
// counterpart here (out of scope, see `unit.ts`'s header comment / `TODOS.md`).
//
// Python's own suite builds its fixtures via `ifcopenshell.api.unit`/`api.root`/
// `api.pset` (none of which exist yet in this TS port, `api.*` is Phase 6+) --
// `createTestFixture`/`createTypedValue` below build the same underlying entity
// graphs directly via `file.createEntity(...)` + `.set(...)`, matching
// `util/element.ts`/`util/schema.ts`'s own established local-fixture-helper
// precedent, not Python's exact fixture code.
//
// `createTypedValue` below is a disclosed, test-only workaround for a real,
// *pre-existing* Phase 2 gap (`entityInstance.ts`'s own header comment: attribute
// access via `EntityInstance.setByIndex`/`.set()` on a standalone non-entity/
// simple-type instance throws, since `attribute_kind_of` requires an entity) --
// confirmed directly against the built addon that the lower-level native
// `set_attribute_value` primitive (bypassing `attribute_kind_of`) has no such
// restriction, so a standalone typed measure value (`IfcLengthMeasure(42.0)`, etc.)
// can still be constructed for test fixtures without a raw-SPF-text detour. This
// mirrors Python's own `self.file.createIfcLengthMeasure(42.0)` fixture-building
// sugar as closely as this port's current primitive surface allows -- not a
// production-code fix (the underlying gap is untouched, out of this chunk's scope),
// purely a test-only construction aid.
//
// Additional, original coverage beyond `test_unit.py`'s own classes for functions
// with no dedicated Python test class at all (confirmed by reading the whole file --
// only `TestMmToM`, `TestCacheUnits`, `TestClearUnitCache`, `TestGetProjectUnit`,
// `TestGetPropertyUnit`, `TestConvert`, `TestCalculateUnitScale`, `TestFormatLength`,
// `TestIsAttrType`, and the `TestConvertFileLengthUnits*` classes exist there):
// `getPrefix`/`getPrefixMultiplier`, `getUnitName`/`getUnitNameUniversal`,
// `getFullUnitName`, `getSiDimensions`/`getNamedDimensions`, `getUnitAssignment`,
// `getPropertyTableUnit`, `getUnitMeasureClass`/`getMeasureUnitType`,
// `getSymbolMeasureClass`/`getSymbolQuantityClass`, `getUnitSymbol`, `convertUnit`,
// `iterElementAndAttributesPerType` -- matching `util/element.ts`/`util/schema.ts`'s
// own established precedent for functions Python itself doesn't directly test.

import { describe, expect, test } from "vitest";
import { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import { entity_instance as NativeEntityInstance } from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";
import * as subject from "../../src/util/unit";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart -- see this file's header comment) ---

/**
 * Constructs a standalone, correctly-typed simple/defined-type value instance (e.g.
 * `IfcLengthMeasure(42.0)`) -- see this file's header comment for why this bypasses
 * `EntityInstance.setByIndex`/`.set()` (a real, pre-existing, disclosed Phase 2 gap
 * unrelated to this chunk).
 */
function createTypedValue(file: IfcFile, className: string, value: number | string | boolean): EntityInstance {
	const declaration = file.nativeFile.schema().declaration_by_name_with_name(className);
	const handle = file.nativeFile.create_with_declaration_instance_id(declaration, -1);
	let variant: { kind: number; integer_value?: unknown; double_value?: unknown; string_value?: unknown };
	if (typeof value === "string") {
		variant = { kind: native.STRING, string_value: value };
	} else if (typeof value === "boolean") {
		variant = { kind: native.BOOL, integer_value: value ? 1 : 0 };
	} else if (className === "IfcInteger" || className === "IfcCountMeasure") {
		variant = { kind: native.INTEGER, integer_value: value };
	} else {
		variant = { kind: native.DOUBLE, double_value: value };
	}
	new NativeEntityInstance(handle._handle).set_attribute_value(0, variant);
	return new EntityInstance(handle._handle, file);
}

/**
 * `template.create()` (which `createTestFile` uses under the hood, see
 * `test/bootstrap.ts`) already seeds the file with its own `IfcProject` (plus a
 * default SI `IfcUnitAssignment`) -- this reuses that existing project rather than
 * creating a second, competing one (an earlier version of this fixture helper did
 * exactly that, and `byType("IfcProject")[0]` then non-deterministically returned
 * whichever one the native `instances_by_type_*` primitive happened to order first,
 * not necessarily the one a test had just configured -- caught by this chunk's own
 * tests failing with "no unit found" even though a unit assignment was clearly set).
 */
function createProject(file: IfcFile): EntityInstance {
	return file.byType("IfcProject")[0];
}

function createSiUnit(file: IfcFile, unitType: string, name: string, prefix: string | null = null): EntityInstance {
	const unit = file.createEntity("IfcSIUnit");
	unit.set("UnitType", unitType);
	unit.set("Name", name);
	if (prefix) unit.set("Prefix", prefix);
	return unit;
}

function createConversionBasedUnit(
	file: IfcFile,
	unitType: string,
	name: string,
	conversionValue: number,
	unitComponent: EntityInstance,
): EntityInstance {
	const dimensions = file.createEntity("IfcDimensionalExponents", 0, 0, 0, 0, 0, 0, 0);
	const measureWithUnit = file.createEntity("IfcMeasureWithUnit");
	measureWithUnit.set("ValueComponent", createTypedValue(file, "IfcLengthMeasure", conversionValue));
	measureWithUnit.set("UnitComponent", unitComponent);
	const unit = file.createEntity("IfcConversionBasedUnit");
	unit.set("Dimensions", dimensions);
	unit.set("UnitType", unitType);
	unit.set("Name", name);
	unit.set("ConversionFactor", measureWithUnit);
	return unit;
}

function assignUnits(file: IfcFile, project: EntityInstance, units: readonly EntityInstance[]): EntityInstance {
	const assignment = file.createEntity("IfcUnitAssignment");
	assignment.set("Units", units);
	project.set("UnitsInContext", assignment);
	return assignment;
}

// --- TestMmToM (direct port -- pure, no file needed) ---

describe("util.unit mmToM", () => {
	test("converts a positive value", () => {
		expect(subject.mmToM(150)).toBe(0.15);
	});

	test("returns zero for zero", () => {
		expect(subject.mmToM(0)).toBe(0);
	});

	test("passes through negative values", () => {
		expect(subject.mmToM(-25)).toBe(-0.025);
	});
});

// --- TestCacheUnits / TestClearUnitCache / TestGetProjectUnit (direct ports) ---

describe.each(AVAILABLE_SCHEMAS)("util.unit cacheUnits / clearUnitCache / getProjectUnit (%s)", (schema) => {
	function setup() {
		const file = createTestFile(schema);
		const project = createProject(file);
		const length = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		const area = createSiUnit(file, "AREAUNIT", "SQUARE_METRE");
		assignUnits(file, project, [length, area]);
		return { file, length, area };
	}

	test("cacheUnits populates IfcFile.units keyed by UnitType", () => {
		const { file, length, area } = setup();
		expect(file.units).toEqual({});
		subject.cacheUnits(file);
		expect(file.units.LENGTHUNIT.equals(length)).toBe(true);
		expect(file.units.AREAUNIT.equals(area)).toBe(true);
		expect(Object.keys(file.units)).toHaveLength(2);
	});

	test("clearUnitCache resets IfcFile.units to empty", () => {
		const { file } = setup();
		subject.cacheUnits(file);
		subject.clearUnitCache(file);
		expect(file.units).toEqual({});
	});

	test("getProjectUnit finds a unit by type, without the cache", () => {
		const { file, length, area } = setup();
		expect(subject.getProjectUnit(file, "LENGTHUNIT")?.equals(length)).toBe(true);
		expect(subject.getProjectUnit(file, "AREAUNIT")?.equals(area)).toBe(true);
		expect(subject.getProjectUnit(file, "VOLUMEUNIT")).toBeNull();
	});

	test("getProjectUnit(useCache) populates then reuses the cache until cleared", () => {
		const file = createTestFile(schema);
		const project = createProject(file);
		const length = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		const length2 = createSiUnit(file, "LENGTHUNIT", "METRE", "CENTI");
		const area = createSiUnit(file, "AREAUNIT", "SQUARE_METRE");
		assignUnits(file, project, [length, area]);

		expect(file.units).toEqual({});
		expect(subject.getProjectUnit(file, "LENGTHUNIT", true)?.equals(length)).toBe(true);
		expect(file.units.LENGTHUNIT.equals(length)).toBe(true);

		// Project units changed, but the cache is stale until explicitly cleared.
		assignUnits(file, project, [length2]);
		expect(subject.getProjectUnit(file, "LENGTHUNIT", true)?.equals(length)).toBe(true);

		subject.clearUnitCache(file);
		expect(subject.getProjectUnit(file, "LENGTHUNIT", true)?.equals(length2)).toBe(true);
	});
});

// --- getUnitAssignment (original coverage) ---

describe.each(AVAILABLE_SCHEMAS)("util.unit getUnitAssignment (%s)", (schema) => {
	test("returns the project's UnitsInContext", () => {
		const file = createTestFile(schema);
		const project = createProject(file);
		const length = createSiUnit(file, "LENGTHUNIT", "METRE");
		const assignment = assignUnits(file, project, [length]);
		expect(subject.getUnitAssignment(file)?.equals(assignment)).toBe(true);
	});

	test("throws (matching Python's uncaught IndexError) rather than silently returning null when there is no IfcProject at all -- regression test for a real /code-review finding", () => {
		const file = createTestFile(schema);
		file.remove(createProject(file));
		expect(() => subject.getUnitAssignment(file)).toThrow(/no IfcProject/);
	});
});

// --- TestGetPropertyUnit (direct port) ---

describe.each(AVAILABLE_SCHEMAS)("util.unit getPropertyUnit (%s)", (schema) => {
	function setupUnits(file: IfcFile) {
		const project = createProject(file);
		const length = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		const length2 = createSiUnit(file, "LENGTHUNIT", "METRE", "CENTI");
		const area = createSiUnit(file, "AREAUNIT", "SQUARE_METRE");
		assignUnits(file, project, [length, area]);
		return { length, length2, area };
	}

	test("no unit found when the project has no units assigned (test_unit.py::test_no_unit)", () => {
		const file = createTestFile(schema);
		const project = createProject(file);
		// See `calculateUnitScale`'s own "no units assigned" test above for why this
		// explicit clear is needed against `createTestFile`'s pre-seeded default units.
		project.set("UnitsInContext", null);
		const prop = file.createEntity("IfcQuantityLength");
		prop.set("Name", "Foo");
		prop.set("LengthValue", 42.0);
		expect(subject.getPropertyUnit(prop, file)).toBeNull();
	});

	test("IfcPhysicalSimpleQuantity: resolves via the quantity's own measure attribute, Unit overrides", () => {
		const file = createTestFile(schema);
		const { length, length2 } = setupUnits(file);
		const prop = file.createEntity("IfcQuantityLength");
		prop.set("Name", "Foo");
		prop.set("LengthValue", 42.0);
		expect(subject.getPropertyUnit(prop, file)?.equals(length)).toBe(true);
		prop.set("Unit", length2);
		expect(subject.getPropertyUnit(prop, file)?.equals(length2)).toBe(true);
	});

	test("IfcPropertySingleValue: resolves via NominalValue's own class, Unit overrides", () => {
		const file = createTestFile(schema);
		const { length, length2 } = setupUnits(file);
		const prop = file.createEntity("IfcPropertySingleValue");
		prop.set("Name", "Foo");
		prop.set("NominalValue", createTypedValue(file, "IfcLengthMeasure", 42.0));
		expect(subject.getPropertyUnit(prop, file)?.equals(length)).toBe(true);
		prop.set("Unit", length2);
		expect(subject.getPropertyUnit(prop, file)?.equals(length2)).toBe(true);
	});

	test("IfcPropertyEnumeratedValue: own EnumerationValues, reference EnumerationValues, reference Unit precedence", () => {
		const file = createTestFile(schema);
		const { length, length2, area } = setupUnits(file);
		const prop = file.createEntity("IfcPropertyEnumeratedValue");
		prop.set("Name", "Foo");
		prop.set("EnumerationValues", [createTypedValue(file, "IfcLengthMeasure", 42.0)]);
		expect(subject.getPropertyUnit(prop, file)?.equals(length)).toBe(true);

		prop.set("EnumerationValues", []);
		const enumeration = file.createEntity("IfcPropertyEnumeration");
		enumeration.set("Name", "Foo");
		enumeration.set("EnumerationValues", [createTypedValue(file, "IfcAreaMeasure", 42.0)]);
		prop.set("EnumerationReference", enumeration);
		expect(subject.getPropertyUnit(prop, file)?.equals(area)).toBe(true);

		enumeration.set("Unit", length2);
		expect(subject.getPropertyUnit(prop, file)?.equals(length2)).toBe(true);

		// Reference's own explicit Unit short-circuits even when own EnumerationValues
		// would otherwise resolve to a different unit -- ported exactly, see
		// `getPropertyUnit`'s own doc comment.
		prop.set("EnumerationValues", [createTypedValue(file, "IfcAreaMeasure", 1.0)]);
		expect(subject.getPropertyUnit(prop, file)?.equals(length2)).toBe(true);

		enumeration.set("Unit", null);
		expect(subject.getPropertyUnit(prop, file)?.equals(area)).toBe(true);
	});

	test("IfcPropertyListValue: resolves via the first ListValues entry", () => {
		const file = createTestFile(schema);
		const { length, length2 } = setupUnits(file);
		const prop = file.createEntity("IfcPropertyListValue");
		prop.set("Name", "Foo");
		prop.set("ListValues", [createTypedValue(file, "IfcLengthMeasure", 42.0)]);
		expect(subject.getPropertyUnit(prop, file)?.equals(length)).toBe(true);
		prop.set("Unit", length2);
		expect(subject.getPropertyUnit(prop, file)?.equals(length2)).toBe(true);
		prop.set("Unit", null);
		prop.set("ListValues", []);
		expect(subject.getPropertyUnit(prop, file)).toBeNull();
	});

	test("IfcPropertyBoundedValue: Upper, then Lower, then SetPoint, Unit overrides", () => {
		const file = createTestFile(schema);
		const { length, length2 } = setupUnits(file);
		const prop = file.createEntity("IfcPropertyBoundedValue");
		prop.set("Name", "Foo");
		expect(subject.getPropertyUnit(prop, file)).toBeNull();

		prop.set("UpperBoundValue", createTypedValue(file, "IfcLengthMeasure", 42.0));
		expect(subject.getPropertyUnit(prop, file)?.equals(length)).toBe(true);

		prop.set("UpperBoundValue", null);
		prop.set("LowerBoundValue", createTypedValue(file, "IfcLengthMeasure", 42.0));
		expect(subject.getPropertyUnit(prop, file)?.equals(length)).toBe(true);

		// `SetPointValue` is an IFC4+ addition to `IfcPropertyBoundedValue` -- not
		// declared at all in IFC2X3 (confirmed: `.set()` throws "has no attribute"
		// there) -- skip that one sub-case for IFC2X3, matching this project's
		// established "IFC2X3 support is genuinely narrower" precedent
		// (`util/element.ts`'s own IFC2X3-specific branches).
		if (schema !== "IFC2X3") {
			prop.set("LowerBoundValue", null);
			prop.set("SetPointValue", createTypedValue(file, "IfcLengthMeasure", 42.0));
			expect(subject.getPropertyUnit(prop, file)?.equals(length)).toBe(true);
		}

		prop.set("Unit", length2);
		expect(subject.getPropertyUnit(prop, file)?.equals(length2)).toBe(true);
	});
});

// --- getPropertyTableUnit (original coverage) ---

describe.each(AVAILABLE_SCHEMAS)("util.unit getPropertyTableUnit (%s)", (schema) => {
	test("resolves DefiningUnit/DefinedUnit explicitly, or via the first Defining/DefinedValues entry", () => {
		const file = createTestFile(schema);
		const project = createProject(file);
		const length = createSiUnit(file, "LENGTHUNIT", "METRE");
		const area = createSiUnit(file, "AREAUNIT", "SQUARE_METRE");
		assignUnits(file, project, [length, area]);

		const table = file.createEntity("IfcPropertyTableValue");
		table.set("Name", "Foo");
		table.set("DefiningValues", [createTypedValue(file, "IfcLengthMeasure", 1.0)]);
		table.set("DefinedValues", [createTypedValue(file, "IfcAreaMeasure", 2.0)]);

		const resolved = subject.getPropertyTableUnit(table, file);
		expect(resolved.DefiningUnit?.equals(length)).toBe(true);
		expect(resolved.DefinedUnit?.equals(area)).toBe(true);

		table.set("DefiningUnit", area);
		const resolved2 = subject.getPropertyTableUnit(table, file);
		expect(resolved2.DefiningUnit?.equals(area)).toBe(true);
	});

	test("returns null for both when nothing resolves", () => {
		const file = createTestFile(schema);
		createProject(file);
		const table = file.createEntity("IfcPropertyTableValue");
		table.set("Name", "Foo");
		const resolved = subject.getPropertyTableUnit(table, file);
		expect(resolved).toEqual({ DefiningUnit: null, DefinedUnit: null });
	});
});

// --- TestConvert (direct port -- pure) ---

describe("util.unit convert", () => {
	test("matches test_unit.py::TestConvert::test_run exactly", () => {
		expect(subject.convert(1, null, "METRE", null, "METRE")).toBe(1);
		expect(subject.convert(1, null, "METRE", "MILLI", "METRE")).toBe(1000);
		expect(subject.convert(1000, "MILLI", "METRE", null, "METRE")).toBe(1);
		expect(subject.convert(1, null, "SQUARE_METRE", null, "SQUARE_METRE")).toBe(1);
		expect(subject.convert(1, null, "SQUARE_METRE", "MILLI", "SQUARE_METRE")).toBe(1000000);
		expect(subject.convert(1, null, "CUBIC_METRE", "MILLI", "CUBIC_METRE")).toBe(1000000000);
	});
});

// --- convertUnit (original coverage) ---

describe.each(AVAILABLE_SCHEMAS)("util.unit convertUnit (%s)", (schema) => {
	test("delegates to convert() using each unit's Prefix/Name", () => {
		const file = createTestFile(schema);
		const millimetre = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		const metre = createSiUnit(file, "LENGTHUNIT", "METRE");
		expect(subject.convertUnit(1000, millimetre, metre)).toBe(1);
		expect(subject.convertUnit(1, metre, millimetre)).toBe(1000);
	});
});

// --- getPrefix / getPrefixMultiplier (original coverage, pure) ---

describe("util.unit getPrefix / getPrefixMultiplier", () => {
	test("finds the first matching prefix name within a string", () => {
		expect(subject.getPrefix("MILLIMETRE")).toBe("MILLI");
		expect(subject.getPrefix("millimetre")).toBe("MILLI");
		expect(subject.getPrefix("METRE")).toBeNull();
		expect(subject.getPrefix(null)).toBeNull();
		expect(subject.getPrefix("")).toBeNull();
	});

	test("returns the matching multiplier, or 1 when no prefix / no text", () => {
		expect(subject.getPrefixMultiplier("MILLIMETRE")).toBe(1e-3);
		expect(subject.getPrefixMultiplier("KILOGRAM")).toBe(1e3);
		expect(subject.getPrefixMultiplier("METRE")).toBe(1);
		expect(subject.getPrefixMultiplier(null)).toBe(1);
	});
});

// --- getUnitName / getUnitNameUniversal (original coverage, pure) ---

describe("util.unit getUnitName / getUnitNameUniversal", () => {
	test("getUnitName finds an SI unit name, normalising METER -> METRE", () => {
		expect(subject.getUnitName("MILLIMETRE")).toBe("METRE");
		expect(subject.getUnitName("millimeter")).toBe("METRE");
		expect(subject.getUnitName("SQUARE METRE")).toBe("SQUARE_METRE");
		expect(subject.getUnitName("nonsense")).toBeNull();
	});

	test("getUnitNameUniversal also finds imperial unit names", () => {
		expect(subject.getUnitNameUniversal("METRE")).toBe("METRE");
		expect(subject.getUnitNameUniversal("some foot value")).toBe("foot");
		expect(subject.getUnitNameUniversal("nonsense")).toBeNull();
	});
});

// --- getFullUnitName (original coverage) ---

describe.each(AVAILABLE_SCHEMAS)("util.unit getFullUnitName (%s)", (schema) => {
	test("concatenates Prefix (if any) with the uppercased Name", () => {
		const file = createTestFile(schema);
		const millimetre = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		const metre = createSiUnit(file, "LENGTHUNIT", "METRE");
		expect(subject.getFullUnitName(millimetre)).toBe("MILLIMETRE");
		expect(subject.getFullUnitName(metre)).toBe("METRE");
	});
});

// --- getSiDimensions / getNamedDimensions (original coverage, pure) ---

describe("util.unit getSiDimensions / getNamedDimensions", () => {
	test("getSiDimensions returns the named exponents, or OTHERWISE for an unknown name", () => {
		expect(subject.getSiDimensions("METRE")).toEqual([1, 0, 0, 0, 0, 0, 0]);
		expect(subject.getSiDimensions("SQUARE_METRE")).toEqual([2, 0, 0, 0, 0, 0, 0]);
		expect(subject.getSiDimensions("NONSENSE")).toEqual([0, 0, 0, 0, 0, 0, 0]);
	});

	test("getNamedDimensions returns the named exponents, or all-zero for an unknown name", () => {
		expect(subject.getNamedDimensions("LENGTHUNIT")).toEqual([1, 0, 0, 0, 0, 0, 0]);
		expect(subject.getNamedDimensions("AREAUNIT")).toEqual([2, 0, 0, 0, 0, 0, 0]);
		expect(subject.getNamedDimensions("NONSENSE")).toEqual([0, 0, 0, 0, 0, 0, 0]);
	});
});

// --- getUnitMeasureClass / getMeasureUnitType (original coverage, pure, inverse pair) ---

describe("util.unit getUnitMeasureClass / getMeasureUnitType", () => {
	test("getUnitMeasureClass builds the IfcXMeasure class name, USERDEFINED -> IfcNumericMeasure", () => {
		expect(subject.getUnitMeasureClass("LENGTHUNIT")).toBe("IfcLengthMeasure");
		expect(subject.getUnitMeasureClass("AREAUNIT")).toBe("IfcAreaMeasure");
		expect(subject.getUnitMeasureClass("USERDEFINED")).toBe("IfcNumericMeasure");
	});

	test("getMeasureUnitType is the inverse, IfcNumericMeasure -> USERDEFINED", () => {
		expect(subject.getMeasureUnitType("IfcLengthMeasure")).toBe("LENGTHUNIT");
		expect(subject.getMeasureUnitType("IfcAreaMeasure")).toBe("AREAUNIT");
		expect(subject.getMeasureUnitType("IfcNumericMeasure")).toBe("USERDEFINED");
		expect(subject.getMeasureUnitType("IfcPositiveLengthMeasure")).toBe("LENGTHUNIT");
	});
});

// --- getSymbolMeasureClass / getSymbolQuantityClass (original coverage, pure) ---

describe("util.unit getSymbolMeasureClass / getSymbolQuantityClass", () => {
	test("getSymbolMeasureClass maps common symbols, defaults to IfcNumericMeasure", () => {
		expect(subject.getSymbolMeasureClass("mm")).toBe("IfcLengthMeasure");
		expect(subject.getSymbolMeasureClass("m2")).toBe("IfcAreaMeasure");
		expect(subject.getSymbolMeasureClass("m3")).toBe("IfcVolumeMeasure");
		expect(subject.getSymbolMeasureClass("kg")).toBe("IfcMassMeasure");
		expect(subject.getSymbolMeasureClass("hour")).toBe("IfcTimeMeasure");
		expect(subject.getSymbolMeasureClass()).toBe("IfcNumericMeasure");
		expect(subject.getSymbolMeasureClass("nonsense")).toBe("IfcNumericMeasure");
	});

	test("getSymbolQuantityClass maps common symbols, defaults to IfcQuantityCount", () => {
		expect(subject.getSymbolQuantityClass("mm")).toBe("IfcQuantityLength");
		expect(subject.getSymbolQuantityClass("m2")).toBe("IfcQuantityArea");
		expect(subject.getSymbolQuantityClass("m3")).toBe("IfcQuantityVolume");
		expect(subject.getSymbolQuantityClass("kg")).toBe("IfcQuantityWeight");
		expect(subject.getSymbolQuantityClass("hour")).toBe("IfcQuantityTime");
		expect(subject.getSymbolQuantityClass()).toBe("IfcQuantityCount");
	});
});

// --- getUnitSymbol (original coverage) ---

describe.each(AVAILABLE_SCHEMAS)("util.unit getUnitSymbol (%s)", (schema) => {
	test("SI unit: prefix symbol + unit symbol", () => {
		const file = createTestFile(schema);
		const millimetre = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		expect(subject.getUnitSymbol(millimetre)).toBe("mm");
		const metre = createSiUnit(file, "LENGTHUNIT", "METRE");
		expect(subject.getUnitSymbol(metre)).toBe("m");
	});

	test("conversion-based unit: looked up by name, no prefix symbol", () => {
		const file = createTestFile(schema);
		const metre = createSiUnit(file, "LENGTHUNIT", "METRE");
		const foot = createConversionBasedUnit(file, "LENGTHUNIT", "foot", 0.3048, metre);
		expect(subject.getUnitSymbol(foot)).toBe("ft");
	});
});

// --- TestCalculateUnitScale (direct port) ---

describe.each(AVAILABLE_SCHEMAS)("util.unit calculateUnitScale (%s)", (schema) => {
	test("prefix and conversion-based units are considered", () => {
		const file = createTestFile(schema);
		const project = createProject(file);
		const millimetre = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		const foot = createConversionBasedUnit(file, "LENGTHUNIT", "foot", 0.3048, millimetre);
		assignUnits(file, project, [foot]);
		expect(subject.calculateUnitScale(file)).toBeCloseTo(0.3048 * 0.001, 12);
	});

	test("prefix is raised to the length exponent for area and volume (issue #9278)", () => {
		// A prefixed square/cubic metre is (prefix-metre) squared/cubed:
		// DECI SQUARE_METRE = dm2 = 1e-2 m2, DECI CUBIC_METRE = dm3 (litre) = 1e-3 m3.
		const file = createTestFile(schema);
		const project = createProject(file);
		const area = createSiUnit(file, "AREAUNIT", "SQUARE_METRE", "DECI");
		const volume = createSiUnit(file, "VOLUMEUNIT", "CUBIC_METRE", "DECI");
		assignUnits(file, project, [area, volume]);
		expect(subject.calculateUnitScale(file, "AREAUNIT")).toBeCloseTo(0.1 ** 2, 12);
		expect(subject.calculateUnitScale(file, "VOLUMEUNIT")).toBeCloseTo(0.1 ** 3, 12);
	});

	test("prefix stays linear for units that are not a pure power of length", () => {
		// For derived and non-length SI units the prefix scales the unit itself:
		// KILO PASCAL = 1e3 Pa, KILO GRAM = 1e3 g.
		const file = createTestFile(schema);
		const project = createProject(file);
		const pressure = createSiUnit(file, "PRESSUREUNIT", "PASCAL", "KILO");
		const mass = createSiUnit(file, "MASSUNIT", "GRAM", "KILO");
		assignUnits(file, project, [pressure, mass]);
		expect(subject.calculateUnitScale(file, "PRESSUREUNIT")).toBeCloseTo(1000, 9);
		expect(subject.calculateUnitScale(file, "MASSUNIT")).toBeCloseTo(1000, 9);
	});

	test("returns 1 when the project has no units assigned at all", () => {
		const file = createTestFile(schema);
		const project = createProject(file);
		// `createTestFile` (via `template.create`) seeds a default SI unit assignment --
		// explicitly clear it to exercise the real "no `UnitsInContext`" code path,
		// rather than coincidentally getting `1` back from a real METRE unit's own
		// (also `1`) scale factor.
		project.set("UnitsInContext", null);
		expect(subject.calculateUnitScale(file)).toBe(1);
	});

	test("rejects an unrecognised unit_type -- the disclosed enumeration_items() workaround (see unit.ts header comment, finding #3)", () => {
		const file = createTestFile(schema);
		expect(subject.calculateUnitScale(file, "LENGTHUNIT")).toBe(1); // template's own default METRE unit
		expect(() => subject.calculateUnitScale(file, "NOT_A_REAL_UNIT_TYPE")).toThrow(/does not name a valid type/);
	});
});

// --- TestFormatLength (direct port, extensive per this chunk's own instructions) ---

describe("util.unit formatLength", () => {
	test("matches test_unit.py::TestFormatLength::test_run exactly", () => {
		expect(subject.formatLength(1, 1, 0, undefined, "metric")).toBe("1");
		expect(subject.formatLength(1, 1, 2, undefined, "metric")).toBe("1.00");
		expect(subject.formatLength(3, 5, 2, undefined, "metric")).toBe("5.00");
		expect(subject.formatLength(3.123, 0.01, 2, undefined, "metric")).toBe("3.12");

		expect(subject.formatLength(3, 1, undefined, undefined, "imperial", "foot")).toBe("3'");
		expect(subject.formatLength(3.5, 1, undefined, undefined, "imperial", "foot")).toBe("3' - 6\"");
		expect(subject.formatLength(3.123, 1, undefined, undefined, "imperial", "foot")).toBe("3' - 1\"");
		expect(subject.formatLength(3.123, 2, undefined, undefined, "imperial", "foot")).toBe("3' - 1 1/2\"");
		expect(subject.formatLength(3.123, 4, undefined, undefined, "imperial", "foot")).toBe("3' - 1 1/2\"");
		expect(subject.formatLength(3.123, 32, undefined, undefined, "imperial", "foot")).toBe("3' - 1 15/32\"");
		expect(subject.formatLength(24, 1, undefined, undefined, "imperial", "inch")).toBe("2'");
		expect(subject.formatLength(25.23, 1, undefined, undefined, "imperial", "inch")).toBe("2' - 1\"");
		expect(subject.formatLength(25.23, 4, undefined, undefined, "imperial", "inch")).toBe("2' - 1 1/4\"");

		expect(subject.formatLength(3, 1, undefined, undefined, "imperial", "foot", "inch")).toBe('36"');
		expect(subject.formatLength(3.5, 1, undefined, undefined, "imperial", "foot", "inch")).toBe('42"');
		expect(subject.formatLength(3.123, 1, undefined, undefined, "imperial", "foot", "inch")).toBe('37"');
		expect(subject.formatLength(3.123, 2, undefined, undefined, "imperial", "foot", "inch")).toBe('37 1/2"');
		expect(subject.formatLength(3.123, 4, undefined, undefined, "imperial", "foot", "inch")).toBe('37 1/2"');
		expect(subject.formatLength(3.123, 32, undefined, undefined, "imperial", "foot", "inch")).toBe('37 15/32"');
		expect(subject.formatLength(24, 1, undefined, undefined, "imperial", "inch", "inch")).toBe('24"');
		expect(subject.formatLength(25.23, 1, undefined, undefined, "imperial", "inch", "inch")).toBe('25"');
		expect(subject.formatLength(25.23, 4, undefined, undefined, "imperial", "inch", "inch")).toBe('25 1/4"');
	});

	test('suppressZeroInches=false keeps an explicit 0" for foot output; inch output is unaffected (feet*12+0 either way)', () => {
		expect(subject.formatLength(3, 1, undefined, false, "imperial", "foot")).toBe("3' - 0\"");
		// output_unit="inch" never shows a bare " 0" suffix even unsuppressed --
		// Python's own branch returns `f'{(feet * 12) + frac.numerator}"'` regardless of
		// `suppress_zero_inches` once output_unit is "inch", so a zero numerator is
		// simply invisible either way (`24 + 0 == 24`).
		expect(subject.formatLength(24, 1, undefined, false, "imperial", "inch", "inch")).toBe('24"');
	});

	test("exact-fraction reduction: 4/8 reduces to 1/2, not an unreduced fraction", () => {
		// value=3.123ft -> 1.476in; at precision 8, nearest=round(1.476*8)=12=8+4,
		// i.e. numerator/denominator = 12/8 before reduction, 3/2 after (an
		// "improper" reduced fraction, exercising the numerator > denominator branch
		// with a *non-trivial* gcd, not just an already-coprime pair like 15/32
		// above).
		expect(subject.formatLength(3.123, 8, undefined, undefined, "imperial", "foot")).toBe("3' - 1 1/2\"");
	});

	test("whole-inch results with a zero numerator after reduction (e.g. 8/8 -> 1/1) format as a plain integer, not '8 0/8'", () => {
		// value=3.5ft -> 6in exactly; at precision 8, nearest=48, 48/8 reduces to 6/1
		// -- denominator===1 branch, not the fractional branches.
		expect(subject.formatLength(3.5, 8, undefined, undefined, "imperial", "foot")).toBe("3' - 6\"");
	});
});

// --- TestIsAttrType (direct port) ---

describe.each(AVAILABLE_SCHEMAS)("util.unit isAttrType (%s)", (schema) => {
	test("matches test_unit.py::TestIsAttrType::test_run exactly", () => {
		const file = createTestFile(schema);
		const declaration = file.nativeFile.schema().declaration_by_name_with_name("IfcPropertySingleValue").as_entity();
		expect(declaration).not.toBeNull();
		// IfcPropertySingleValue: Name(0), Description(1), NominalValue(2), Unit(3).
		const nominalValue = declaration?.attribute_by_index(2).type_of_attribute();
		expect(nominalValue).toBeDefined();
		expect(subject.isAttrType(nominalValue as NonNullable<typeof nominalValue>, "IfcValue")).not.toBeNull();
		expect(subject.isAttrType(nominalValue as NonNullable<typeof nominalValue>, "IfcLengthMeasure")).not.toBeNull();
		expect(subject.isAttrType(nominalValue as NonNullable<typeof nominalValue>, "IfcLengthMeasure", false)).toBeNull();
	});

	test("returns null for an unrelated type name", () => {
		const file = createTestFile(schema);
		const declaration = file.nativeFile.schema().declaration_by_name_with_name("IfcPropertySingleValue").as_entity();
		const nominalValue = declaration?.attribute_by_index(2).type_of_attribute();
		expect(subject.isAttrType(nominalValue as NonNullable<typeof nominalValue>, "TotallyNotARealType")).toBeNull();
	});
});

// --- iterElementAndAttributesPerType (original coverage -- its only real Python
// caller, convert_file_length_units, is out of this chunk's scope, so this exercises
// it directly, per this chunk's own instructions) ---

describe.each(AVAILABLE_SCHEMAS)("util.unit iterElementAndAttributesPerType (%s)", (schema) => {
	test("yields (element, attribute, value) for scalar IfcLengthMeasure attributes across the whole file", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		context.set("ContextType", "Model");
		context.set("CoordinateSpaceDimension", 3);
		context.set("Precision", 0.01);

		const results = [...subject.iterElementAndAttributesPerType(file, "IfcLengthMeasure")];
		// `Precision` is a plain `IfcReal`, not `IfcLengthMeasure` -- must NOT be
		// yielded (it's exactly the reason `convert_file_length_units` handles
		// `Precision` as a documented special case rather than relying on this
		// generator for it).
		expect(results.some(([element]) => element.equals(context))).toBe(false);
	});

	test("yields entity-typed IfcLengthMeasure attribute values (e.g. IfcCartesianPoint.Coordinates elements)", () => {
		const file = createTestFile(schema);
		const point = file.createEntity("IfcCartesianPoint");
		point.set("Coordinates", [1.0, 2.0, 3.0]);

		// `Coordinates` is `LIST OF IfcLengthMeasure`, but plain numbers were set above
		// (this port's own attribute-value shim stores a bare aggregate-of-DOUBLE for
		// that, not per-element typed sub-instances -- see `entityInstance.ts`'s
		// `valueToVariant` for aggregate elements) -- confirms this generator correctly
		// does NOT match a same-shaped-but-untyped aggregate, only genuinely
		// `IfcLengthMeasure`-typed values (e.g. `IfcQuantityLength.LengthValue`, tested
		// below), matching Python's own `is_attr_type` schema-declared-type check
		// (which matches on the *declared* attribute type, `LIST OF IfcLengthMeasure`,
		// regardless of the runtime element type) -- ported faithfully: `Coordinates`
		// IS yielded here (its *declared* type matches), with its raw numeric tuple as
		// the value, not per-element `EntityInstance`s (`Coordinates`' elements are
		// plain doubles at the shim boundary, not typed sub-instances, unlike the
		// hand-typed `createTypedValue` fixtures used elsewhere in this file).
		const results = [...subject.iterElementAndAttributesPerType(file, "IfcLengthMeasure")];
		const match = results.find(([element]) => element.equals(point));
		expect(match).toBeDefined();
		expect(match?.[1].name()).toBe("Coordinates");
		expect(match?.[2]).toEqual([1.0, 2.0, 3.0]);
	});

	test("yields IfcQuantityLength.LengthValue (a genuinely IfcLengthMeasure-typed scalar attribute)", () => {
		const file = createTestFile(schema);
		const qty = file.createEntity("IfcQuantityLength");
		qty.set("Name", "Foo");
		qty.set("LengthValue", 42.0);

		const results = [...subject.iterElementAndAttributesPerType(file, "IfcLengthMeasure")];
		const match = results.find(([element]) => element.equals(qty));
		expect(match).toBeDefined();
		expect(match?.[1].name()).toBe("LengthValue");
		expect(match?.[2]).toBe(42.0);
	});

	test("does not yield unset (null) attributes", () => {
		const file = createTestFile(schema);
		const qty = file.createEntity("IfcQuantityLength");
		qty.set("Name", "Foo");
		// LengthValue left unset (null).
		const results = [...subject.iterElementAndAttributesPerType(file, "IfcLengthMeasure")];
		expect(results.some(([element]) => element.equals(qty))).toBe(false);
	});
});
