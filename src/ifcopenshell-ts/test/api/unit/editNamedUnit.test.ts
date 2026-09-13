// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/unit/test_edit_named_unit.py` (src/ifcopenshell-python)
// -- all 4 real test cases ported (`test_edit_context_dependent_unit`/
// `test_edit_si_unit`/`test_edit_conversion_based_unit` run against every schema,
// `test_edit_conversion_based_unit_with_offset` IFC4-only, matching the real
// `TestEditNamedUnitIFC2X3`/`TestEditNamedUnitIFC4` class split -- `IfcConversion
// BasedUnitWithOffset` doesn't exist in IFC2X3). Plus one supplementary test (no
// Python counterpart) exercising the copy-on-write "shared Dimensions" branch
// (`file.get_total_inverses(dimensions) > 1`) `editNamedUnit.ts`'s own header comment
// documents but no real Python test happens to reach, and new Transaction/undo-redo
// regression coverage.

import { describe, expect, test } from "vitest";
import { editNamedUnit } from "../../../src/api/unit/editNamedUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function exponents(unit: EntityInstance): number[] {
	const d = unit.get("Dimensions") as EntityInstance;
	return [
		d.get("LengthExponent"),
		d.get("MassExponent"),
		d.get("TimeExponent"),
		d.get("ElectricCurrentExponent"),
		d.get("ThermodynamicTemperatureExponent"),
		d.get("AmountOfSubstanceExponent"),
		d.get("LuminousIntensityExponent"),
	] as number[];
}

describe.each(AVAILABLE_SCHEMAS)("api.unit.editNamedUnit (%s)", (schema) => {
	test("test_edit_context_dependent_unit", () => {
		const file = createTestFile(schema);
		const unit = file.createEntity("IfcContextDependentUnit");
		unit.set("Dimensions", file.createEntity("IfcDimensionalExponents"));

		editNamedUnit(file, {
			unit,
			attributes: { Dimensions: [1, 2, 3, 4, 5, 6, 7], UnitType: "LENGTHUNIT", Name: "Name" },
		});

		expect(exponents(unit)).toEqual([1, 2, 3, 4, 5, 6, 7]);
		expect(unit.get("UnitType")).toBe("LENGTHUNIT");
		expect(unit.get("Name")).toBe("Name");
	});

	test("test_edit_si_unit", () => {
		const file = createTestFile(schema);
		const unit = file.createEntity("IfcSIUnit");

		editNamedUnit(file, { unit, attributes: { UnitType: "LENGTHUNIT", Prefix: "MILLI", Name: "METRE" } });

		expect(unit.get("UnitType")).toBe("LENGTHUNIT");
		expect(unit.get("Prefix")).toBe("MILLI");
		expect(unit.get("Name")).toBe("METRE");
	});

	test("test_edit_conversion_based_unit", () => {
		const file = createTestFile(schema);
		const unit = file.createEntity("IfcConversionBasedUnit");
		unit.set("Dimensions", file.createEntity("IfcDimensionalExponents"));

		editNamedUnit(file, {
			unit,
			attributes: { Dimensions: [1, 2, 3, 4, 5, 6, 7], UnitType: "LENGTHUNIT", Name: "Name" },
		});

		expect(exponents(unit)).toEqual([1, 2, 3, 4, 5, 6, 7]);
		expect(unit.get("UnitType")).toBe("LENGTHUNIT");
		expect(unit.get("Name")).toBe("Name");
	});

	test("shared Dimensions is copy-on-write, not mutated in place (no Python counterpart)", () => {
		const file = createTestFile(schema);
		const sharedDimensions = file.createEntity("IfcDimensionalExponents", 9, 9, 9, 9, 9, 9, 9);
		const unit1 = file.createEntity("IfcConversionBasedUnit");
		unit1.set("Dimensions", sharedDimensions);
		const unit2 = file.createEntity("IfcConversionBasedUnit");
		unit2.set("Dimensions", sharedDimensions);
		expect(file.getTotalInverses(sharedDimensions)).toBeGreaterThan(1);

		editNamedUnit(file, { unit: unit1, attributes: { Dimensions: [1, 2, 3, 4, 5, 6, 7] } });

		expect(exponents(unit1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
		// unit2's own Dimensions instance is untouched.
		expect(exponents(unit2)).toEqual([9, 9, 9, 9, 9, 9, 9]);
		expect((unit1.get("Dimensions") as EntityInstance).equals(unit2.get("Dimensions") as EntityInstance)).toBe(false);
	});
});

describe("api.unit.editNamedUnit (IFC4-only)", () => {
	test("test_edit_conversion_based_unit_with_offset", () => {
		const file = createTestFile("IFC4");
		const unit = file.createEntity("IfcConversionBasedUnitWithOffset");
		unit.set("Dimensions", file.createEntity("IfcDimensionalExponents"));

		editNamedUnit(file, {
			unit,
			attributes: { Dimensions: [1, 2, 3, 4, 5, 6, 7], UnitType: "LENGTHUNIT", Name: "Name", ConversionOffset: 1 },
		});

		expect(exponents(unit)).toEqual([1, 2, 3, 4, 5, 6, 7]);
		expect(unit.get("UnitType")).toBe("LENGTHUNIT");
		expect(unit.get("Name")).toBe("Name");
		expect(unit.get("ConversionOffset")).toBe(1);
	});
});

describe.each(AVAILABLE_SCHEMAS)("api.unit.editNamedUnit Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous Name; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const unit = file.createEntity(
			"IfcContextDependentUnit",
			file.createEntity("IfcDimensionalExponents"),
			null,
			"OLD",
		);

		file.beginTransaction();
		editNamedUnit(file, { unit, attributes: { Name: "NEW" } });
		file.endTransaction();

		expect(unit.get("Name")).toBe("NEW");

		file.undo();
		expect(unit.get("Name")).toBe("OLD");

		file.redo();
		expect(unit.get("Name")).toBe("NEW");
	});

	test("undo restores the in-place-mutated Dimensions; redo reapplies", () => {
		const file = createTestFile(schema);
		const unit = file.createEntity("IfcContextDependentUnit");
		unit.set("Dimensions", file.createEntity("IfcDimensionalExponents", 1, 0, 0, 0, 0, 0, 0));

		file.beginTransaction();
		editNamedUnit(file, { unit, attributes: { Dimensions: [9, 9, 9, 9, 9, 9, 9] } });
		file.endTransaction();

		expect(exponents(unit)).toEqual([9, 9, 9, 9, 9, 9, 9]);

		file.undo();
		expect(exponents(unit)).toEqual([1, 0, 0, 0, 0, 0, 0]);

		file.redo();
		expect(exponents(unit)).toEqual([9, 9, 9, 9, 9, 9, 9]);
	});
});
