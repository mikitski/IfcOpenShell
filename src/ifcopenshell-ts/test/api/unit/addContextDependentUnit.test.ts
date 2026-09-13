// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/unit/test_add_context_dependent_unit.py`
// (src/ifcopenshell-python) -- its one real test case ported verbatim, plus new
// Transaction/undo-redo regression coverage (no Python counterpart).

import { describe, expect, test } from "vitest";
import { addContextDependentUnit } from "../../../src/api/unit/addContextDependentUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function dims(unit: EntityInstance): EntityInstance {
	return unit.get("Dimensions") as EntityInstance;
}

describe.each(AVAILABLE_SCHEMAS)("api.unit.addContextDependentUnit (%s)", (schema) => {
	test("test_run", () => {
		const file = createTestFile(schema);
		const unit = addContextDependentUnit(file, {
			unitType: "LENGTHUNIT",
			name: "foobar",
			dimensions: [1, 2, 3, 4, 5, 6, 7],
		});
		expect(unit.isA("IfcContextDependentUnit")).toBe(true);
		const d = dims(unit);
		expect(d.get("LengthExponent")).toBe(1);
		expect(d.get("MassExponent")).toBe(2);
		expect(d.get("TimeExponent")).toBe(3);
		expect(d.get("ElectricCurrentExponent")).toBe(4);
		expect(d.get("ThermodynamicTemperatureExponent")).toBe(5);
		expect(d.get("AmountOfSubstanceExponent")).toBe(6);
		expect(d.get("LuminousIntensityExponent")).toBe(7);
		expect(unit.get("UnitType")).toBe("LENGTHUNIT");
		expect(unit.get("Name")).toBe("foobar");
	});

	test("defaults", () => {
		const file = createTestFile(schema);
		const unit = addContextDependentUnit(file, {});
		expect(unit.get("UnitType")).toBe("USERDEFINED");
		expect(unit.get("Name")).toBe("THINGAMAJIG");
		const d = dims(unit);
		expect(d.get("LengthExponent")).toBe(0);
	});
});

describe.each(AVAILABLE_SCHEMAS)("api.unit.addContextDependentUnit Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcContextDependentUnit (and its IfcDimensionalExponents); redo recreates it", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		const unit = addContextDependentUnit(file, { name: "BOXES" });
		file.endTransaction();
		const id = unit.id();
		const dimsId = dims(unit).id();

		file.undo();
		expect(() => file.byId(id)).toThrow();
		expect(() => file.byId(dimsId)).toThrow();

		file.redo();
		expect(file.byId(id).isA("IfcContextDependentUnit")).toBe(true);
		expect(file.byId(id).get("Name")).toBe("BOXES");
	});
});
