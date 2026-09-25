// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/unit/test_add_conversion_based_unit.py`
// (src/ifcopenshell-python) -- `test_run`, `test_adding_mass_units_creates_proper_massunit`,
// `test_adding_time_units_creates_proper_timeunit`, `test_adding_a_unit_with_offset`, and
// `test_unknown_units_fall_back_to_userdefined` ported directly below. These were
// previously blocked by a native primitive-layer gate (`EntityInstance.setByIndex`
// couldn't write an initial value into a freshly created simple/defined-type instance,
// e.g. the `IfcReal` `ConversionFactor.ValueComponent`), fixed 2026-09-23 (TODOS.md's
// "EntityInstance.setByIndex/IfcFile.createEntity ..." entry) -- verified against the
// real Python source's own `util/unit.py` tables (byte-identical to this port's
// `util/unit.ts` tables) and this exact worktree's own rebuilt native addon.

import { describe, expect, test } from "vitest";
import { addConversionBasedUnit } from "../../../src/api/unit/addConversionBasedUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function conversionValue(unit: EntityInstance): number {
	const valueComponent = (unit.get("ConversionFactor") as EntityInstance).get("ValueComponent") as EntityInstance;
	return valueComponent.getByIndex(0) as number;
}

function conversionSiUnit(unit: EntityInstance): EntityInstance {
	return (unit.get("ConversionFactor") as EntityInstance).get("UnitComponent") as EntityInstance;
}

describe.each(AVAILABLE_SCHEMAS)("api.unit.addConversionBasedUnit (%s)", (schema) => {
	test("test_run: foot is a LENGTHUNIT converting to an unprefixed METRE SI unit at 0.3048", () => {
		const file = createTestFile(schema);
		const unit = addConversionBasedUnit(file, { name: "foot" });
		expect(unit.isA("IfcConversionBasedUnit")).toBe(true);
		const dimensions = unit.get("Dimensions") as EntityInstance;
		expect(dimensions.get("LengthExponent")).toBe(1);
		expect(dimensions.get("MassExponent")).toBe(0);
		expect(dimensions.get("TimeExponent")).toBe(0);
		expect(dimensions.get("ElectricCurrentExponent")).toBe(0);
		expect(dimensions.get("ThermodynamicTemperatureExponent")).toBe(0);
		expect(dimensions.get("AmountOfSubstanceExponent")).toBe(0);
		expect(dimensions.get("LuminousIntensityExponent")).toBe(0);
		expect(unit.get("UnitType")).toBe("LENGTHUNIT");
		expect(unit.get("Name")).toBe("foot");
		expect(conversionValue(unit)).toBe(0.3048);
		const siUnit = conversionSiUnit(unit);
		expect(siUnit.isA("IfcSIUnit")).toBe(true);
		expect(siUnit.get("UnitType")).toBe("LENGTHUNIT");
		expect(siUnit.get("Prefix")).toBeNull();
		expect(siUnit.get("Name")).toBe("METRE");
	});

	test("test_adding_mass_units_creates_proper_massunit: tonne/pound/ounce/ton UK/ton US all resolve to a MASSUNIT with a KILO-prefixed GRAM SI unit", () => {
		const file = createTestFile(schema);
		const massUnits: readonly [string, number][] = [
			["tonne", 1000.0],
			["pound", 0.454],
			["ounce", 0.02835],
			["ton UK", 1016.0469088],
			["ton US", 907.18474],
		];
		for (const [name, expectedConversion] of massUnits) {
			const unit = addConversionBasedUnit(file, { name });
			expect(unit.isA("IfcConversionBasedUnit")).toBe(true);
			expect(unit.get("UnitType")).toBe("MASSUNIT");
			expect(unit.get("Name")).toBe(name);
			expect(conversionValue(unit)).toBe(expectedConversion);
			const siUnit = conversionSiUnit(unit);
			expect(siUnit.isA("IfcSIUnit")).toBe(true);
			expect(siUnit.get("UnitType")).toBe("MASSUNIT");
			expect(siUnit.get("Name")).toBe("GRAM");
			expect(siUnit.get("Prefix")).toBe("KILO");
		}
	});

	test("test_adding_time_units_creates_proper_timeunit: minute/hour/day all resolve to a TIMEUNIT with an unprefixed SECOND SI unit", () => {
		const file = createTestFile(schema);
		const timeUnits: readonly [string, number][] = [
			["minute", 60],
			["hour", 3600],
			["day", 86400],
		];
		for (const [name, expectedConversion] of timeUnits) {
			const unit = addConversionBasedUnit(file, { name });
			expect(unit.isA("IfcConversionBasedUnit")).toBe(true);
			expect(unit.get("UnitType")).toBe("TIMEUNIT");
			expect(unit.get("Name")).toBe(name);
			expect(conversionValue(unit)).toBe(expectedConversion);
			const siUnit = conversionSiUnit(unit);
			expect(siUnit.isA("IfcSIUnit")).toBe(true);
			expect(siUnit.get("UnitType")).toBe("TIMEUNIT");
			expect(siUnit.get("Name")).toBe("SECOND");
			expect(siUnit.get("Prefix")).toBeNull();
		}
	});

	test("test_unknown_units_fall_back_to_userdefined: unit.UnitType === 'USERDEFINED', unit.Name === 'unknown_unit'", () => {
		const file = createTestFile(schema);
		const unknownUnit = addConversionBasedUnit(file, { name: "unknown_unit" });
		expect(unknownUnit.get("UnitType")).toBe("USERDEFINED");
		expect(unknownUnit.get("Name")).toBe("unknown_unit");
	});

	test("no-argument default (Python default name='foot') also creates a proper foot LENGTHUNIT", () => {
		const file = createTestFile(schema);
		const unit = addConversionBasedUnit(file, {});
		expect(unit.get("UnitType")).toBe("LENGTHUNIT");
		expect(unit.get("Name")).toBe("foot");
		expect(conversionValue(unit)).toBe(0.3048);
	});
});

describe("api.unit.addConversionBasedUnit (IFC4-only)", () => {
	test("test_adding_a_unit_with_offset: fahrenheit produces an IfcConversionBasedUnitWithOffset, ConversionOffset === -459.67", () => {
		const file = createTestFile("IFC4");
		const unit = addConversionBasedUnit(file, { name: "fahrenheit" });
		expect(unit.isA("IfcConversionBasedUnitWithOffset")).toBe(true);
		const dimensions = unit.get("Dimensions") as EntityInstance;
		expect(dimensions.get("LengthExponent")).toBe(0);
		expect(dimensions.get("MassExponent")).toBe(0);
		expect(dimensions.get("TimeExponent")).toBe(0);
		expect(dimensions.get("ElectricCurrentExponent")).toBe(0);
		expect(dimensions.get("ThermodynamicTemperatureExponent")).toBe(1);
		expect(dimensions.get("AmountOfSubstanceExponent")).toBe(0);
		expect(dimensions.get("LuminousIntensityExponent")).toBe(0);
		expect(unit.get("UnitType")).toBe("THERMODYNAMICTEMPERATUREUNIT");
		expect(unit.get("Name")).toBe("fahrenheit");
		expect(conversionValue(unit)).toBe(1.8);
		const siUnit = conversionSiUnit(unit);
		expect(siUnit.isA("IfcSIUnit")).toBe(true);
		expect(siUnit.get("UnitType")).toBe("THERMODYNAMICTEMPERATUREUNIT");
		expect(siUnit.get("Prefix")).toBeNull();
		expect(siUnit.get("Name")).toBe("KELVIN");
		expect(unit.get("ConversionOffset")).toBe(-459.67);
	});
});
