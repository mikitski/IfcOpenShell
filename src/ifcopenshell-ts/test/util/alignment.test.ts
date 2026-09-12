// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_alignment.py` (src/ifcopenshell-python) --
// `test_station_as_string` (which itself runs four underscore-prefixed helper
// functions: SI stations, SI millimeter stations, US/foot stations, and a
// custom-named-conversion-based-unit regression) is ported faithfully below, reusing
// `util/unit.ts`'s own test file's established local fixture helpers
// (`createProject`/`createSiUnit`/`createConversionBasedUnit`/`assignUnits`,
// redefined here per this project's "no cross-file sharing" convention for
// module-private test fixtures -- see `unit.test.ts`'s own header comment for why
// `createProject` reuses `createTestFile`'s pre-seeded `IfcProject` rather than
// creating a second one). All numeric expectations below were independently verified
// against a real CPython interpreter running `station_as_string`'s pure-math core
// (this sandbox has no installed `ifcopenshell` module to run the real function
// end-to-end) -- see `alignment.ts`'s own header comment for the verification method.
//
// A near-shifter-boundary regression case (the Python source's own "if station =
// 69500.00000, we sometimes get 694+100.00 instead of 695+00.00" comment) is added as
// original coverage -- `test_alignment.py` itself has no dedicated test for this
// branch, so a value was crafted here (`68999.9997`, chosen so `v2` lands within the
// correction's `abs_tol` of the shifter boundary) and cross-checked against the same
// real-CPython pure-math core.
//
// `addLinearPlacementFallbackPosition`/`createAlignmentGeometry`/
// `appendZeroLengthSegments` are genuine, disclosed hard blockers (see `alignment.ts`'s
// own header comment) -- `test_alignment.py` has no tests for them at all (confirmed
// by reading the whole file), and building realistic fixtures for them would itself
// need the unported `api.alignment` module. The tests below instead pin the current,
// disclosed-blocked behavior directly: each throws a descriptive error naming the
// missing `api.alignment` dependency, matching `representation.test.ts`'s
// `getReferenceLine`-blocker precedent.

import { describe, expect, test } from "vitest";
import { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import { entity_instance as NativeEntityInstance } from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";
import * as subject from "../../src/util/alignment";
import { createTestFile } from "../bootstrap";

// --- local fixture helpers (no Python/api counterpart -- see this file's header comment,
// mirroring `test/util/unit.test.ts`'s own identically-named helpers) ---

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

function createTypedLengthValue(file: IfcFile, value: number): EntityInstance {
	// See `unit.test.ts`'s `createTypedValue` header comment: bypasses the pre-existing,
	// disclosed Phase 2 gap blocking `EntityInstance.setByIndex`/`.set()` on a
	// standalone simple/defined-type instance, via the native `set_attribute_value`
	// primitive directly. Test-only, not a production-code workaround.
	const declaration = file.nativeFile.schema().declaration_by_name_with_name("IfcLengthMeasure");
	const handle = file.nativeFile.create_with_declaration_instance_id(declaration, -1);
	new NativeEntityInstance(handle._handle).set_attribute_value(0, { kind: native.DOUBLE, double_value: value });
	return new EntityInstance(handle._handle, file);
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
	measureWithUnit.set("ValueComponent", createTypedLengthValue(file, conversionValue));
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

// --- TestStationAsString (direct port of test_alignment.py's test_station_as_string) ---

describe("util.alignment stationAsString", () => {
	test("SI (metre) stations", () => {
		const file = createTestFile("IFC4");
		const project = createProject(file);
		const length = createSiUnit(file, "LENGTHUNIT", "METRE");
		assignUnits(file, project, [length]);

		expect(subject.stationAsString(file, 0.0)).toBe("0+000.000");
		expect(subject.stationAsString(file, 100.0)).toBe("0+100.000");
		expect(subject.stationAsString(file, -100.0)).toBe("-0+100.000");
		expect(subject.stationAsString(file, 123456.789)).toBe("123+456.789");
		expect(subject.stationAsString(file, -123456.789)).toBe("-123+456.789");
	});

	test("SI (millimetre) stations", () => {
		const file = createTestFile("IFC4");
		const project = createProject(file);
		const length = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		assignUnits(file, project, [length]);

		expect(subject.stationAsString(file, 100.0)).toBe("0+000.100");
		expect(subject.stationAsString(file, 1000.0)).toBe("0+001.000");
	});

	test("US/Imperial (foot) stations", () => {
		const file = createTestFile("IFC4");
		const project = createProject(file);
		const metre = createSiUnit(file, "LENGTHUNIT", "METRE");
		const length = createConversionBasedUnit(file, "LENGTHUNIT", "foot", 0.3048, metre);
		assignUnits(file, project, [length]);

		expect(subject.stationAsString(file, 0.0)).toBe("0+00.00");
		expect(subject.stationAsString(file, 100.0)).toBe("1+00.00");
		expect(subject.stationAsString(file, -100.0)).toBe("-1+00.00");
		expect(subject.stationAsString(file, 123456.789)).toBe("1234+56.79");
		expect(subject.stationAsString(file, -123456.789)).toBe("-1234+56.79");
	});

	test("custom-named IfcConversionBasedUnit stations (US survey foot, 1200/3937 m exact) -- regression: must not silently treat an unrecognised conversion-unit Name as a 1.0 scale factor", () => {
		// Real Python's own regression test (test_alignment.py's
		// `_test_custom_named_conversion_based_unit_stations`): station_as_string()
		// converts via calculate_unit_scale() (which reads the unit's own
		// ConversionFactor graph directly), NOT a by-name lookup table -- so a
		// project unit named something other than the fixed set
		// util.unit.si_conversions recognises (e.g. distinguishing US survey foot
		// from international foot, ~2ppm apart) still converts correctly.
		const file = createTestFile("IFC4");
		const project = createProject(file);
		const metre = createSiUnit(file, "LENGTHUNIT", "METRE");
		const length = createConversionBasedUnit(file, "LENGTHUNIT", "US survey foot", 1200.0 / 3937.0, metre);
		assignUnits(file, project, [length]);

		expect(subject.stationAsString(file, 0.0)).toBe("0+00.00");
		expect(subject.stationAsString(file, 100.0)).toBe("1+00.00");
		expect(subject.stationAsString(file, -100.0)).toBe("-1+00.00");
		// At a large enough station, the ~2ppm US-survey-foot/international-foot
		// difference becomes visible at 2 decimal places -- this is the real,
		// correct divergence from the plain "foot" case above, not a bug.
		expect(subject.stationAsString(file, 123456.789)).toBe("1234+57.04");
		expect(subject.stationAsString(file, -123456.789)).toBe("-1234+57.04");
	});

	test("near-shifter-boundary rounding correction (regression, original coverage -- see this file's header comment)", () => {
		const file = createTestFile("IFC4");
		const project = createProject(file);
		const length = createSiUnit(file, "LENGTHUNIT", "METRE");
		assignUnits(file, project, [length]);

		// Without the correction, a naive fixed-point format of v2 (~999.9997) would
		// round up to "1000.000" (overflowing the field width) instead of carrying
		// into v1 -- verified against the real CPython pure-math core.
		expect(subject.stationAsString(file, 68999.9997)).toBe("69+000.000");
		expect(subject.stationAsString(file, -68999.9997)).toBe("-69+000.000");
	});

	test("throws (matching Python's uncaught AttributeError on a None unit_type) rather than silently defaulting when the project has no LENGTHUNIT assigned", () => {
		const file = createTestFile("IFC4");
		const project = createProject(file);
		// `createTestFile` pre-seeds a default unit assignment (see `unit.test.ts`'s
		// own header comment) -- explicitly clear it to exercise the real "no
		// LENGTHUNIT" path.
		project.set("UnitsInContext", null);

		expect(() => subject.stationAsString(file, 100.0)).toThrow(TypeError);
	});
});

// --- Disclosed hard blockers: addLinearPlacementFallbackPosition/createAlignmentGeometry/
// appendZeroLengthSegments (see alignment.ts's own header comment) ---

describe("util.alignment disclosed-blocked functions (genuine api.alignment dependency gap)", () => {
	test("addLinearPlacementFallbackPosition throws, naming the missing api.alignment dependency", () => {
		const file = createTestFile("IFC4");
		expect(() => subject.addLinearPlacementFallbackPosition(file)).toThrow(/api\.alignment/);
		expect(() => subject.addLinearPlacementFallbackPosition(file)).toThrow(/update_fallback_position/);
	});

	test("createAlignmentGeometry throws, naming the missing api.alignment dependency", () => {
		const file = createTestFile("IFC4");
		expect(() => subject.createAlignmentGeometry(file)).toThrow(/api\.alignment/);
		expect(() => subject.createAlignmentGeometry(file)).toThrow(/create_representation/);
	});

	test("appendZeroLengthSegments throws, naming the missing api.alignment dependency", () => {
		const file = createTestFile("IFC4");
		expect(() => subject.appendZeroLengthSegments(file)).toThrow(/api\.alignment/);
		expect(() => subject.appendZeroLengthSegments(file)).toThrow(/get_alignment_layouts/);
	});
});
