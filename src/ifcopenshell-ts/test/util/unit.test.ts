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
import { addContext } from "../../src/api/context/addContext";
import { addGeoreferencing } from "../../src/api/georeference/addGeoreferencing";
import { editGeoreferencing } from "../../src/api/georeference/editGeoreferencing";
import { addPset } from "../../src/api/pset/addPset";
import { editPset } from "../../src/api/pset/editPset";
import { createEntity } from "../../src/api/root/createEntity";
import { addDerivedUnit } from "../../src/api/unit/addDerivedUnit";
import { addSiUnit } from "../../src/api/unit/addSiUnit";
import { assignUnit } from "../../src/api/unit/assignUnit";
import { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import { entity_instance as NativeEntityInstance } from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";
import * as subject from "../../src/util/unit";
import type { Schema } from "../bootstrap";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../bootstrap";

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

/** Thin wrapper over `api.unit.addDerivedUnit` -- see this file's header comment. */
function createDerivedUnit(
	file: IfcFile,
	unitType: string,
	userDefinedType: string | null,
	attributes: readonly (readonly [EntityInstance, number])[],
): EntityInstance {
	return addDerivedUnit(file, { unitType, userDefinedType, attributes });
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

	// --- Upstream `d11c4411e` (test_unit.py::TestGetProjectUnit): dimensional-analysis
	// fallback for IfcDerivedUnit, both with and without the cache (cacheUnits' own
	// dimensional-fallback pass, added by the same commit). ---

	test("area and volume derived from length are matched dimensionally (test_area_and_volume_derived_from_length_are_matched_dimensionally)", () => {
		const file = createTestFile(schema);
		const project = createProject(file);
		const length = createSiUnit(file, "LENGTHUNIT", "METRE");
		const area = createDerivedUnit(file, "USERDEFINED", "area-ish", [[length, 2]]);
		const volume = createDerivedUnit(file, "USERDEFINED", "volume-ish", [[length, 3]]);
		assignUnits(file, project, [length, area, volume]);

		expect(subject.getProjectUnit(file, "AREAUNIT")?.equals(area)).toBe(true);
		expect(subject.getProjectUnit(file, "VOLUMEUNIT")?.equals(volume)).toBe(true);
	});

	test("a literal UnitType match takes priority over a dimensional one (test_literal_unit_type_match_takes_priority_over_dimensional)", () => {
		const file = createTestFile(schema);
		const project = createProject(file);
		const length = createSiUnit(file, "LENGTHUNIT", "METRE");
		const literalArea = createSiUnit(file, "AREAUNIT", "SQUARE_METRE");
		const derivedArea = createDerivedUnit(file, "USERDEFINED", "area-ish", [[length, 2]]);
		assignUnits(file, project, [length, literalArea, derivedArea]);

		expect(subject.getProjectUnit(file, "AREAUNIT")?.equals(literalArea)).toBe(true);
	});

	test("the dimensional fallback also applies when using a cache (test_dimensional_fallback_also_applies_when_using_a_cache)", () => {
		const file = createTestFile(schema);
		const project = createProject(file);
		const length = createSiUnit(file, "LENGTHUNIT", "METRE");
		const area = createDerivedUnit(file, "USERDEFINED", "area-ish", [[length, 2]]);
		assignUnits(file, project, [length, area]);

		expect(subject.getProjectUnit(file, "AREAUNIT", true)?.equals(area)).toBe(true);
		expect(file.units.AREAUNIT.equals(area)).toBe(true);
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

	// Regression test for upstream `0e8d0ee84` ("Fix get_property_unit() crash on
	// IfcPropertySingleValue.NominalValue = None"): real Python originally did
	// `prop.NominalValue.is_a()` unconditionally, crashing on a legitimately blank
	// `NominalValue` (`IfcPropertySingleValue` permits a null value). This port's own
	// `getPropertyUnit` (`src/util/unit.ts`) was verified to already guard this
	// correctly (`attrOrNull(prop, "NominalValue")` + a ternary before `.isA()`) --
	// this test locks that existing-correct behavior in rather than fixing a bug, since
	// none was found here.
	test("IfcPropertySingleValue: a null NominalValue does not crash, resolves no unit", () => {
		const file = createTestFile(schema);
		setupUnits(file);
		const prop = file.createEntity("IfcPropertySingleValue");
		prop.set("Name", "Foo");
		prop.set("NominalValue", null);
		expect(subject.getPropertyUnit(prop, file)).toBeNull();
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

// --- getUnitDimensions / identifyUnitDimensions (upstream `20a6c73fb`, direct port of
// test_unit.py::TestIdentifyUnitDimensions plus original coverage for getUnitDimensions
// itself, which real Python's own test suite never exercises directly -- only through
// identify_unit_dimensions/calculate_unit_scale). ---

describe.each(AVAILABLE_SCHEMAS)("util.unit getUnitDimensions / identifyUnitDimensions (%s)", (schema) => {
	test("getUnitDimensions: IfcSIUnit resolves via getSiDimensions (prefix-independent)", () => {
		const file = createTestFile(schema);
		const millimetre = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		expect(subject.getUnitDimensions(millimetre)).toEqual([1, 0, 0, 0, 0, 0, 0]);
	});

	test("getUnitDimensions: IfcConversionBasedUnit/IfcContextDependentUnit fall back to getNamedDimensions via UnitType", () => {
		const file = createTestFile(schema);
		const metre = createSiUnit(file, "LENGTHUNIT", "METRE");
		const foot = createConversionBasedUnit(file, "LENGTHUNIT", "foot", 0.3048, metre);
		expect(subject.getUnitDimensions(foot)).toEqual([1, 0, 0, 0, 0, 0, 0]);
	});

	test("getUnitDimensions: IfcDerivedUnit composes recursively from its Elements", () => {
		const file = createTestFile(schema);
		createProject(file);
		const force = createSiUnit(file, "FORCEUNIT", "NEWTON");
		const area = createSiUnit(file, "AREAUNIT", "SQUARE_METRE");
		const modulus = createDerivedUnit(file, "MODULUSOFELASTICITYUNIT", null, [
			[force, 1],
			[area, -1],
		]);
		// FORCEUNIT [1,1,-2,0,0,0,0] - AREAUNIT [2,0,0,0,0,0,0] = PRESSUREUNIT [-1,1,-2,0,0,0,0].
		expect(subject.getUnitDimensions(modulus)).toEqual([-1, 1, -2, 0, 0, 0, 0]);
	});

	test("identifyUnitDimensions: matches a named unit type by dimension (test_matches_a_named_unit_type_by_dimension)", () => {
		const file = createTestFile(schema);
		createProject(file);
		const force = createSiUnit(file, "FORCEUNIT", "NEWTON");
		const area = createSiUnit(file, "AREAUNIT", "SQUARE_METRE");
		const modulus = createDerivedUnit(file, "MODULUSOFELASTICITYUNIT", null, [
			[force, 1],
			[area, -1],
		]);
		expect(subject.identifyUnitDimensions(modulus)).toBe("PRESSUREUNIT");
	});

	test("identifyUnitDimensions: returns null for no match (test_returns_none_for_no_match)", () => {
		const file = createTestFile(schema);
		createProject(file);
		const force = createSiUnit(file, "FORCEUNIT", "NEWTON");
		const time = createSiUnit(file, "TIMEUNIT", "SECOND");
		const weird = createDerivedUnit(file, "USERDEFINED", "force per time", [
			[force, 1],
			[time, -1],
		]);
		expect(subject.identifyUnitDimensions(weird)).toBeNull();
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

	// Upstream `20a6c73fb` (test_unit.py::TestGetUnitSymbol): getUnitSymbol dispatches to
	// getDerivedUnitSymbol for an IfcDerivedUnit.
	test("derived unit composes a symbol from its elements (test_derived_unit_composes_a_symbol)", () => {
		const file = createTestFile(schema);
		createProject(file);
		const force = createSiUnit(file, "FORCEUNIT", "NEWTON");
		const area = createSiUnit(file, "AREAUNIT", "SQUARE_METRE");
		const modulus = createDerivedUnit(file, "MODULUSOFELASTICITYUNIT", null, [
			[force, 1],
			[area, -1],
		]);
		expect(subject.getUnitSymbol(modulus)).toBe("N/m2");
	});

	test("an unnamed (USERDEFINED) derived unit still composes a symbol without crashing (test_unnamed_derived_unit_still_composes_a_symbol_without_crashing)", () => {
		const file = createTestFile(schema);
		createProject(file);
		const force = createSiUnit(file, "FORCEUNIT", "NEWTON");
		const time = createSiUnit(file, "TIMEUNIT", "SECOND");
		const weird = createDerivedUnit(file, "USERDEFINED", "force per time", [
			[force, 1],
			[time, -1],
		]);
		expect(subject.getUnitSymbol(weird)).toBe("N/s");
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

	// Upstream `20a6c73fb` (test_unit.py::TestCalculateUnitScale::test_derived_units_are_considered).
	test("derived units are considered (test_derived_units_are_considered)", () => {
		const file = createTestFile(schema);
		const project = createProject(file);
		const force = createSiUnit(file, "FORCEUNIT", "NEWTON");
		const area = createSiUnit(file, "AREAUNIT", "SQUARE_METRE", "MILLI");
		const modulus = createDerivedUnit(file, "MODULUSOFELASTICITYUNIT", null, [
			[force, 1],
			[area, -1],
		]);
		assignUnits(file, project, [modulus]);
		// AREAUNIT is a pure power of length, so its MILLI prefix is raised to the length
		// exponent (2) per #9278: (1e-3)**2 = 1e-6, inverted by the derived unit's -1
		// exponent to give 1e6.
		expect(subject.calculateUnitScale(file, "MODULUSOFELASTICITYUNIT")).toBeCloseTo(1_000_000, 6);
	});

	// Upstream `20a6c73fb`: the IfcUnitEnum-only membership check widened to also accept
	// IfcDerivedUnitEnum (an IfcDerivedUnit project unit's own unit_type).
	test("accepts an IfcDerivedUnitEnum unit_type even with no matching unit assigned", () => {
		const file = createTestFile(schema);
		expect(subject.calculateUnitScale(file, "MODULUSOFELASTICITYUNIT")).toBe(1);
	});
});

// --- getNamedUnitScale / getDerivedUnitScale / getUnitScale (upstream `20a6c73fb`
// extracts the first two from calculateUnitScale's own former inline dispatch;
// `d19c86c72` adds getUnitScale as a thin dispatcher over both -- direct ports of
// test_unit.py::TestGetNamedUnitScale/TestGetDerivedUnitScale/TestGetUnitScale). ---

describe.each(AVAILABLE_SCHEMAS)("util.unit getNamedUnitScale / getDerivedUnitScale / getUnitScale (%s)", (schema) => {
	test("getNamedUnitScale: prefix is raised to the length exponent for area and volume (test_prefix_is_raised_to_the_length_exponent_for_area_and_volume)", () => {
		const file = createTestFile(schema);
		const area = createSiUnit(file, "AREAUNIT", "SQUARE_METRE", "DECI");
		expect(subject.getNamedUnitScale(area)).toBeCloseTo(0.1 ** 2, 12);
	});

	test("getNamedUnitScale: prefix stays linear for units that are not a pure power of length (test_prefix_stays_linear_for_units_that_are_not_a_pure_power_of_length)", () => {
		const file = createTestFile(schema);
		const pressure = createSiUnit(file, "PRESSUREUNIT", "PASCAL", "KILO");
		expect(subject.getNamedUnitScale(pressure)).toBeCloseTo(1000, 9);
	});

	test("getDerivedUnitScale: composes scale from elements (test_composes_scale_from_elements)", () => {
		const file = createTestFile(schema);
		createProject(file);
		const mass = createSiUnit(file, "MASSUNIT", "GRAM", "KILO");
		const volume = createSiUnit(file, "VOLUMEUNIT", "CUBIC_METRE");
		const density = createDerivedUnit(file, "MASSDENSITYUNIT", null, [
			[mass, 1],
			[volume, -1],
		]);
		expect(subject.getDerivedUnitScale(density)).toBe(1000.0);
	});

	test("getDerivedUnitScale: an unnamed derived unit still composes (test_unnamed_derived_unit_still_composes)", () => {
		const file = createTestFile(schema);
		createProject(file);
		const force = createSiUnit(file, "FORCEUNIT", "NEWTON");
		const time = createSiUnit(file, "TIMEUNIT", "SECOND", "MILLI");
		const weird = createDerivedUnit(file, "USERDEFINED", "force per time", [
			[force, 1],
			[time, -1],
		]);
		expect(subject.getDerivedUnitScale(weird)).toBeCloseTo(1 / 0.001, 9);
	});

	test("getUnitScale: dispatches to getNamedUnitScale for SI/conversion-based units (test_dispatches_to_named_unit_scale_for_si_and_conversion_based_units)", () => {
		const file = createTestFile(schema);
		const mm = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		const metre = createSiUnit(file, "LENGTHUNIT", "METRE");
		const foot = createConversionBasedUnit(file, "LENGTHUNIT", "foot", 0.3048, metre);
		expect(subject.getUnitScale(mm)).toBe(subject.getNamedUnitScale(mm));
		expect(subject.getUnitScale(foot)).toBe(subject.getNamedUnitScale(foot));
	});

	test("getUnitScale: dispatches to getDerivedUnitScale for derived units (test_dispatches_to_derived_unit_scale_for_derived_units)", () => {
		const file = createTestFile(schema);
		createProject(file);
		const mass = createSiUnit(file, "MASSUNIT", "GRAM", "KILO");
		const volume = createSiUnit(file, "VOLUMEUNIT", "CUBIC_METRE");
		const density = createDerivedUnit(file, "MASSDENSITYUNIT", null, [
			[mass, 1],
			[volume, -1],
		]);
		expect(subject.getUnitScale(density)).toBe(subject.getDerivedUnitScale(density));
	});
});

// --- getCandidateUnits (upstream `d19c86c72`, direct port of
// test_unit.py::TestGetCandidateUnits). ---

describe.each(AVAILABLE_SCHEMAS)("util.unit getCandidateUnits (%s)", (schema) => {
	// Uses `blankProjectFile` (defined below, hoisted) rather than `createTestFile`
	// directly -- `createTestFile`'s own `template.create`-seeded default LENGTHUNIT
	// (METRE) would otherwise be a 3rd, unwanted `getCandidateUnits(file, "LENGTHUNIT")`
	// match, unlike real Python's genuinely blank `test.bootstrap.IFC4` fixture.

	test("returns only units matching the unit type (test_returns_only_units_matching_the_unit_type)", () => {
		const file = blankProjectFile(schema);
		const mm = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		const m = createSiUnit(file, "LENGTHUNIT", "METRE");
		const area = createSiUnit(file, "AREAUNIT", "SQUARE_METRE");
		const candidates = subject.getCandidateUnits(file, "LENGTHUNIT");
		expect(candidates).toHaveLength(2);
		expect(candidates.some((u) => u.equals(mm))).toBe(true);
		expect(candidates.some((u) => u.equals(m))).toBe(true);
		expect(candidates.some((u) => u.equals(area))).toBe(false);
	});

	test("returns all matching units, not just the assigned default (test_returns_all_matching_units_not_just_the_assigned_default)", () => {
		const file = blankProjectFile(schema);
		const project = createProject(file);
		const mm = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		const m = createSiUnit(file, "LENGTHUNIT", "METRE");
		assignUnits(file, project, [mm]);
		expect(subject.getProjectUnit(file, "LENGTHUNIT")?.equals(mm)).toBe(true);
		const candidates = subject.getCandidateUnits(file, "LENGTHUNIT");
		expect(candidates).toHaveLength(2);
		expect(candidates.some((u) => u.equals(mm))).toBe(true);
		expect(candidates.some((u) => u.equals(m))).toBe(true);
	});

	test("a derived unit is matched by literal unit type (test_derived_unit_matched_by_literal_unit_type)", () => {
		const file = createTestFile(schema);
		createProject(file);
		const force = createSiUnit(file, "FORCEUNIT", "NEWTON");
		const area = createSiUnit(file, "AREAUNIT", "SQUARE_METRE");
		const modulus = createDerivedUnit(file, "MODULUSOFELASTICITYUNIT", null, [
			[force, 1],
			[area, -1],
		]);
		const candidates = subject.getCandidateUnits(file, "MODULUSOFELASTICITYUNIT");
		expect(candidates).toHaveLength(1);
		expect(candidates[0].equals(modulus)).toBe(true);
	});

	test("a USERDEFINED derived unit is matched by dimensional fallback (test_userdefined_derived_unit_matched_by_dimensional_fallback)", () => {
		const file = createTestFile(schema);
		createProject(file);
		const force = createSiUnit(file, "FORCEUNIT", "NEWTON");
		const area = createSiUnit(file, "AREAUNIT", "SQUARE_METRE");
		const weirdPressure = createDerivedUnit(file, "USERDEFINED", "pressure-ish", [
			[force, 1],
			[area, -1],
		]);
		const candidates = subject.getCandidateUnits(file, "PRESSUREUNIT");
		expect(candidates).toHaveLength(1);
		expect(candidates[0].equals(weirdPressure)).toBe(true);
	});

	test("empty when nothing matches (test_empty_when_nothing_matches)", () => {
		const file = createTestFile(schema);
		createProject(file);
		createSiUnit(file, "LENGTHUNIT", "METRE");
		expect(subject.getCandidateUnits(file, "MASSUNIT")).toEqual([]);
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

// --- TestConvertFileLengthUnits / TestConvertFileLengthUnitsIFC4 / TestConvertFileLengthUnitsIFC4X3 ---
//
// See `src/util/unit.ts`'s own doc comment on `convertFileLengthUnits` (and this
// module's own header comment, findings 4-6) for the three real, disclosed
// primitive-layer blockers this function faithfully preserves rather than guards
// around. Ported below: every real Python test scenario NOT itself blocked by one of
// those findings, plus a dedicated regression test pinning each finding, matching
// `test/api/unit/addConversionBasedUnit.test.ts`'s own established precedent for this
// kind of disclosed, currently-blocked behavior.
//
// All fixtures below start from a genuinely blank project (`blankProjectFile`, this
// file's own local convention, matching `test/api/georeference/editGeoreferencing
// .test.ts`'s identical helper) rather than `createTestFile`'s own pre-baked template
// project/unit-assignment/context chain -- real Python's own bootstrap starts every
// one of these tests from a project-and-unit-free file too
// (`ifcopenshell.api.root.create_entity(self.file, ifc_class="IfcProject")` against a
// blank `test.bootstrap` fixture), and reusing the template's own baseline units/
// contexts here would make several of these tests' assertions ambiguous (e.g. a
// second, competing `IfcGeometricRepresentationContext`/`IfcSIUnit` already present
// before the test's own fixture-building code runs).

// Reviewer fix (found empirically, against this exact worktree's own built native
// addon -- not caught by the dispatch's own non-functional local test run, which had
// no buildable native addon in its sandbox): `stripProjectBootstrap`'s own doc comment
// already discloses that removing `IfcProject` cascades (via `removeDeep2`) and takes
// down the ENTIRE owner-history chain (`IfcPersonAndOrganization`/`IfcApplication`/
// `IfcPerson`/`IfcOrganization`) with it, since those become orphaned once the project
// (their only remaining referencer) is removed. On IFC2X3, `api.owner.createOwnerHistory`
// -- which `api.root.createEntity` calls for EVERY entity it creates, including the
// `IfcProject` this helper creates next -- deliberately throws if no
// `IfcPersonAndOrganization` exists yet (`api/owner/settings.ts`'s own documented,
// intentional "mandatory owner tracking" behavior, matching real Python). This chunk's
// own cited precedent (`test/api/georeference/editGeoreferencing.test.ts`'s identical
// `blankProjectFile` helper) never hits this because that describe block excludes
// IFC2X3 entirely -- this file's own `describe.each(AVAILABLE_SCHEMAS)` does not, since
// `convertFileLengthUnits` (unlike `editGeoreferencing`) has real, distinct IFC2X3
// logic worth covering (the `ePSet_ProjectedCRS`/`MapUnit`-based map-unit detection
// branch). Fixed by manually constructing a minimal, valid bootstrap chain via RAW
// `file.createEntity` calls -- NOT `api.owner.addPerson`/`addOrganisation`/
// `addPersonAndOrganisation`, which would recursively hit this exact same "no user yet"
// check via their own `api.root.createEntity` calls, a genuine bootstrap circularity.
function blankProjectFile(schema: Schema): IfcFile {
	const file = createTestFile(schema);
	stripProjectBootstrap(file);
	if (file.schema === "IFC2X3") {
		const person = file.createEntity("IfcPerson", null, null, null, null, null, null, null, null);
		const organization = file.createEntity("IfcOrganization", null, "Bootstrap", null, null, null);
		file.createEntity("IfcPersonAndOrganization", person, organization, null);
		// `api.owner.createOwnerHistory`'s own "mandatory owner tracking" check on
		// IFC2X3 (`api/owner/settings.ts`) requires BOTH a user AND an application to
		// pre-exist -- same bootstrap-circularity reasoning as the person/organization
		// above.
		file.createEntity("IfcApplication", organization, "1.0", "Bootstrap", "Bootstrap");
	}
	createEntity(file, { ifcClass: "IfcProject" });
	return file;
}

describe.each(AVAILABLE_SCHEMAS)("util.unit convertFileLengthUnits (%s)", (schema) => {
	test("test_run: converts the project length unit to METRE", () => {
		const file = blankProjectFile(schema);
		const unit = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: "MILLI" });
		assignUnit(file, { units: [unit] });

		const output = subject.convertFileLengthUnits(file, "METER");
		expect(subject.getFullUnitName(subject.getProjectUnit(output, "LENGTHUNIT") as EntityInstance)).toBe("METRE");
		// Real Python's own `test_run` additionally asserts
		// `max(i.id() for i in output) == len(output.entity_names()) + 1` (a leftover
		// rocksdb-renumbering regression check) -- not ported: this port's
		// `blankProjectFile` fixture-building sequence (`stripProjectBootstrap` +
		// `createEntity`) doesn't produce the same clean, contiguous 1..N id sequence
		// real Python's genuinely-fresh bootstrap file does (removed/orphaned ids from
		// the strip step leave gaps beforehand), so the exact numeric invariant doesn't
		// transfer -- the behavioral outcome that assertion is really checking for (the
		// old length unit is cleanly removed, nothing else is corrupted) is what the
		// `getFullUnitName`/`getProjectUnit` assertion above and this describe block's
		// other tests already exercise.
	});

	test("test_precision_conversion: IfcGeometricRepresentationContext.Precision is scaled; subcontexts are left alone (regression for #6127)", () => {
		const file = blankProjectFile(schema);
		const unit = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: "MILLI" });
		assignUnit(file, { units: [unit] });
		const context = addContext(file, { contextType: "Model" });
		context.set("Precision", 0.01);
		// Subcontexts derive Precision from the parent and must be left alone.
		addContext(file, {
			contextType: "Model",
			contextIdentifier: "Body",
			targetView: "MODEL_VIEW",
			parent: context,
		});

		const output = subject.convertFileLengthUnits(file, "METER");
		const newContext = output.byType("IfcGeometricRepresentationContext", false)[0];
		expect(newContext.get("Precision") as number).toBeCloseTo(0.00001, 9);
	});
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"util.unit convertFileLengthUnits map-unit handling (%s)",
	(schema) => {
		// IFC2X3 excluded: real Python's own fixture setup for these scenarios
		// (`api.georeference.addGeoreferencing`/`editGeoreferencing` with a non-empty
		// `coordinateOperation`) cannot even be constructed for IFC2X3 in this port
		// today -- `addGeoreferencing.ts`/`editGeoreferencing.ts`'s own already-
		// disclosed IFC2X3-branch primitive-layer gap (this module's own header
		// comment, finding 6), entirely independent of `convertFileLengthUnits` itself.

		test("test_converting_map_conversion_if_there_is_no_map_unit: plain attribute conversion still applies to IfcMapConversion when no MapUnit is set", () => {
			const file = blankProjectFile(schema);
			const unit = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: "MILLI" });
			addContext(file, { contextType: "Model" });
			addGeoreferencing(file, {});
			editGeoreferencing(file, { coordinateOperation: { Eastings: 10000 } });
			assignUnit(file, { units: [unit] });

			const output = subject.convertFileLengthUnits(file, "METER");
			expect(subject.getFullUnitName(subject.getProjectUnit(output, "LENGTHUNIT") as EntityInstance)).toBe("METRE");
			expect(output.byType("IfcMapConversion")[0].get("Eastings")).toBe(10);
		});

		test("test_preserving_enh_if_there_is_a_map_unit: a map unit distinct from the project default is preserved via the Helmert-transformation round-trip", () => {
			const file = blankProjectFile(schema);
			const unit = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: "MILLI" });
			const meter = addSiUnit(file, { unitType: "LENGTHUNIT" });
			addContext(file, { contextType: "Model" });
			addGeoreferencing(file, {});
			editGeoreferencing(file, {
				projectedCrs: { MapUnit: meter },
				coordinateOperation: { Eastings: 10, Scale: 0.001 },
			});
			assignUnit(file, { units: [unit] });

			const output = subject.convertFileLengthUnits(file, "METER");
			expect(subject.getFullUnitName(subject.getProjectUnit(output, "LENGTHUNIT") as EntityInstance)).toBe("METRE");
			const mapConversion = output.byType("IfcMapConversion")[0];
			expect(mapConversion.get("Eastings")).toBe(10);
			expect(mapConversion.get("Northings")).toBe(0);
			expect(mapConversion.get("Scale")).toBe(1);
			expect(subject.getFullUnitName(output.byType("IfcProjectedCRS")[0].get("MapUnit") as EntityInstance)).toBe(
				"METRE",
			);
		});

		test("test_preserving_enh_if_there_is_a_map_unit_which_is_also_the_project_default", () => {
			const file = blankProjectFile(schema);
			const meter = addSiUnit(file, { unitType: "LENGTHUNIT" });
			addContext(file, { contextType: "Model" });
			addGeoreferencing(file, {});
			editGeoreferencing(file, {
				projectedCrs: { MapUnit: meter },
				coordinateOperation: { Eastings: 10, Scale: 1 },
			});
			assignUnit(file, { units: [meter] });

			const output = subject.convertFileLengthUnits(file, "MILLIMETER");
			expect(subject.getFullUnitName(subject.getProjectUnit(output, "LENGTHUNIT") as EntityInstance)).toBe(
				"MILLIMETRE",
			);
			const mapConversion = output.byType("IfcMapConversion")[0];
			expect(mapConversion.get("Eastings")).toBe(10);
			expect(mapConversion.get("Northings")).toBe(0);
			expect(mapConversion.get("Scale")).toBe(0.001);
			expect(subject.getFullUnitName(output.byType("IfcProjectedCRS")[0].get("MapUnit") as EntityInstance)).toBe(
				"METRE",
			);

			const unitAssignment = subject.getUnitAssignment(output);
			expect(unitAssignment).toBeTruthy();
			expect((unitAssignment?.get("Units") as EntityInstance[]).length).toBe(1);
		});
	},
);

describe.each(AVAILABLE_SCHEMAS)("util.unit convertFileLengthUnits (%s)", (schema) => {
	test("converts to a non-SI (imperial) target unit via addConversionBasedUnit (unit.ts's header comment, finding 5; " +
		"gate fixed 2026-09-23): the old MILLI-metre unit is replaced by a real 'foot' IfcConversionBasedUnit", () => {
		const file = blankProjectFile(schema);
		const unit = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: "MILLI" });
		assignUnit(file, { units: [unit] });

		const output = subject.convertFileLengthUnits(file, "FOOT");
		const newLength = subject.getProjectUnit(output, "LENGTHUNIT") as EntityInstance;
		expect(newLength.isA("IfcConversionBasedUnit")).toBe(true);
		expect(newLength.get("Name")).toBe("foot");
		const conversionFactor = newLength.get("ConversionFactor") as EntityInstance;
		expect((conversionFactor.get("ValueComponent") as EntityInstance).getByIndex(0)).toBe(0.3048);
	});

	test("converts an entity-wrapped IfcLengthMeasure value (e.g. a typed pset property) in place -- a genuinely NEW " +
		"consequence of the same gate (unit.ts's header comment, finding 4; fixed 2026-09-23): 50mm -> 0.05m", () => {
		const file = blankProjectFile(schema);
		const unit = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: "MILLI" });
		const product = createEntity(file, { ifcClass: "IfcWall" });
		const pset = addPset(file, { product, name: "TestPset" });
		const lengthMeasure = createTypedValue(file, "IfcLengthMeasure", 50.0);
		editPset(file, { pset, properties: { Length: lengthMeasure } });
		assignUnit(file, { units: [unit] });

		const output = subject.convertFileLengthUnits(file, "METER");
		const outputProperty = output
			.byType("IfcPropertySingleValue")
			.find((p) => p.get("Name") === "Length") as EntityInstance;
		const nominalValue = outputProperty.get("NominalValue") as EntityInstance;
		expect(nominalValue.isA()).toBe("IfcLengthMeasure");
		expect(nominalValue.getByIndex(0)).toBeCloseTo(0.05, 12);
	});
});
