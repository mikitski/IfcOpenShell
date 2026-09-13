// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/unit/test_assign_unit.py` (src/ifcopenshell-python) --
// all 4 real Python test cases ported verbatim (all exercise only the explicit-`units`
// path, fully unblocked), plus: a default-zero-argument-call test (the convenience
// metric-synthesis path -- also fully unblocked, see `assignUnit.ts`'s own header
// comment), a dedicated "currently blocked" test for the imperial-synthesis branch
// (matching `addConversionBasedUnit.test.ts`'s own precedent for the same disclosed
// gap), and new Transaction/undo-redo regression coverage.

import { describe, expect, test } from "vitest";
import { addMonetaryUnit } from "../../../src/api/unit/addMonetaryUnit";
import { addSiUnit } from "../../../src/api/unit/addSiUnit";
import { assignUnit } from "../../../src/api/unit/assignUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";

function unitsOf(assignment: EntityInstance): EntityInstance[] {
	return (assignment.get("Units") as EntityInstance[]) ?? [];
}

function includesUnit(units: readonly EntityInstance[], unit: EntityInstance): boolean {
	return units.some((u) => u.equals(unit));
}

describe.each(AVAILABLE_SCHEMAS)("api.unit.assignUnit (%s)", (schema) => {
	test("test_run", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const project = file.createEntity("IfcProject");
		const unit1 = addMonetaryUnit(file, { currency: "USD" });
		const unit2 = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: "MILLI" });

		const assignment = assignUnit(file, { units: [unit1, unit2] });

		expect(project.get("UnitsInContext").equals(assignment)).toBe(true);
		expect(assignment.isA("IfcUnitAssignment")).toBe(true);
		expect(includesUnit(unitsOf(assignment), unit1)).toBe(true);
		expect(includesUnit(unitsOf(assignment), unit2)).toBe(true);
	});

	test("test_assign_units_to_an_existing_assignment", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const project = file.createEntity("IfcProject");
		const unit1 = addMonetaryUnit(file, { currency: "USD" });
		const unit2 = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: "MILLI" });

		const assignment1 = assignUnit(file, { units: [unit1] });
		const assignment2 = assignUnit(file, { units: [unit2] });

		expect(project.get("UnitsInContext").equals(assignment1)).toBe(true);
		expect(assignment1.equals(assignment2)).toBe(true);
		expect(includesUnit(unitsOf(assignment1), unit1)).toBe(true);
		expect(includesUnit(unitsOf(assignment1), unit2)).toBe(true);
	});

	test("test_overwriting_an_existing_unit_type", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const project = file.createEntity("IfcProject");
		const unit1 = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: "MILLI" });
		const unit2 = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: "CENTI" });

		const assignment1 = assignUnit(file, { units: [unit1] });
		const assignment2 = assignUnit(file, { units: [unit2] });

		expect(project.get("UnitsInContext").equals(assignment1)).toBe(true);
		expect(assignment1.equals(assignment2)).toBe(true);
		expect(includesUnit(unitsOf(assignment1), unit1)).toBe(false);
		expect(includesUnit(unitsOf(assignment1), unit2)).toBe(true);
	});

	test("test_overwriting_an_existing_monetary_unit", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const project = file.createEntity("IfcProject");
		const unit1 = addMonetaryUnit(file, { currency: "USD" });
		const unit2 = addMonetaryUnit(file, { currency: "AUD" });

		const assignment1 = assignUnit(file, { units: [unit1] });
		const assignment2 = assignUnit(file, { units: [unit2] });

		expect(project.get("UnitsInContext").equals(assignment1)).toBe(true);
		expect(assignment1.equals(assignment2)).toBe(true);
		expect(includesUnit(unitsOf(assignment1), unit1)).toBe(false);
		expect(includesUnit(unitsOf(assignment1), unit2)).toBe(true);
	});

	test("default zero-argument call synthesizes millimeters/square meters/cubic meters (fully unblocked metric path)", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		file.createEntity("IfcProject");

		const assignment = assignUnit(file, {});

		const units = unitsOf(assignment);
		expect(units).toHaveLength(3);
		const lengthUnit = units.find((u) => u.get("UnitType") === "LENGTHUNIT");
		const areaUnit = units.find((u) => u.get("UnitType") === "AREAUNIT");
		const volumeUnit = units.find((u) => u.get("UnitType") === "VOLUMEUNIT");
		expect(lengthUnit?.get("Prefix")).toBe("MILLI");
		expect(lengthUnit?.get("Name")).toBe("METRE");
		expect(areaUnit?.get("Prefix")).toBeNull();
		expect(areaUnit?.get("Name")).toBe("SQUARE_METRE");
		expect(volumeUnit?.get("Prefix")).toBeNull();
		expect(volumeUnit?.get("Name")).toBe("CUBIC_METRE");
	});

	test("imperial-synthesis branch is currently blocked (see assignUnit.ts's own header comment)", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		file.createEntity("IfcProject");
		expect(() => assignUnit(file, { length: { isMetric: false, raw: "INCHES" } })).toThrow(
			/Attribute access is only supported on entity instances/,
		);
	});
});

describe.each(AVAILABLE_SCHEMAS)("api.unit.assignUnit Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous unit assignment membership; redo reapplies the change", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const project = file.createEntity("IfcProject");
		const unit1 = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: "MILLI" });
		const unit2 = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: "CENTI" });
		const assignment = assignUnit(file, { units: [unit1] });

		file.beginTransaction();
		assignUnit(file, { units: [unit2] });
		file.endTransaction();

		expect(includesUnit(unitsOf(assignment), unit1)).toBe(false);
		expect(includesUnit(unitsOf(assignment), unit2)).toBe(true);

		file.undo();
		expect(includesUnit(unitsOf(assignment), unit1)).toBe(true);
		expect(includesUnit(unitsOf(assignment), unit2)).toBe(false);

		file.redo();
		expect(includesUnit(unitsOf(assignment), unit1)).toBe(false);
		expect(includesUnit(unitsOf(assignment), unit2)).toBe(true);
	});

	test("undo removes a freshly created IfcUnitAssignment; redo recreates it", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		file.createEntity("IfcProject");
		const unit = addMonetaryUnit(file, { currency: "USD" });

		file.beginTransaction();
		const assignment = assignUnit(file, { units: [unit] });
		file.endTransaction();
		const id = assignment.id();

		file.undo();
		expect(() => file.byId(id)).toThrow();

		file.redo();
		expect(file.byId(id).isA("IfcUnitAssignment")).toBe(true);
	});
});
