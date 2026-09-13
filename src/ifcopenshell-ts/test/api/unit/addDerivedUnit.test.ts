// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `add_derived_unit.py` (see `addDerivedUnit.ts`'s
// own header comment) -- this coverage is original, following the function's own
// docstring example (linear velocity = length / time), plus new Transaction/undo-redo
// regression coverage.

import { describe, expect, test } from "vitest";
import { addDerivedUnit } from "../../../src/api/unit/addDerivedUnit";
import { addSiUnit } from "../../../src/api/unit/addSiUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.unit.addDerivedUnit (%s)", (schema) => {
	test("linear velocity = length / time (docstring example)", () => {
		const file = createTestFile(schema);
		const length = addSiUnit(file, { unitType: "LENGTHUNIT" });
		const time = addSiUnit(file, { unitType: "TIMEUNIT" });

		const unit = addDerivedUnit(file, {
			unitType: "LINEARVELOCITYUNIT",
			userDefinedType: null,
			attributes: [
				[length, 1],
				[time, -1],
			],
		});

		expect(unit.isA("IfcDerivedUnit")).toBe(true);
		expect(unit.get("UnitType")).toBe("LINEARVELOCITYUNIT");
		expect(unit.get("UserDefinedType")).toBeNull();
		const elements = unit.get("Elements") as EntityInstance[];
		expect(elements).toHaveLength(2);
		expect(elements[0].isA("IfcDerivedUnitElement")).toBe(true);
		expect(elements[0].get("Unit").equals(length)).toBe(true);
		expect(elements[0].get("Exponent")).toBe(1);
		expect(elements[1].get("Unit").equals(time)).toBe(true);
		expect(elements[1].get("Exponent")).toBe(-1);
	});

	test("USERDEFINED with a userDefinedType", () => {
		const file = createTestFile(schema);
		const unit = addDerivedUnit(file, { unitType: "USERDEFINED", userDefinedType: "Widgets", attributes: [] });
		expect(unit.get("UnitType")).toBe("USERDEFINED");
		expect(unit.get("UserDefinedType")).toBe("Widgets");
		expect(unit.get("Elements")).toEqual([]);
	});
});

describe.each(AVAILABLE_SCHEMAS)("api.unit.addDerivedUnit Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcDerivedUnit and its IfcDerivedUnitElements; redo recreates them", () => {
		const file = createTestFile(schema);
		const length = addSiUnit(file, { unitType: "LENGTHUNIT" });
		const time = addSiUnit(file, { unitType: "TIMEUNIT" });

		file.beginTransaction();
		const unit = addDerivedUnit(file, {
			unitType: "LINEARVELOCITYUNIT",
			userDefinedType: null,
			attributes: [
				[length, 1],
				[time, -1],
			],
		});
		file.endTransaction();
		const id = unit.id();
		const elementIds = (unit.get("Elements") as EntityInstance[]).map((e) => e.id());

		file.undo();
		expect(() => file.byId(id)).toThrow();
		for (const elementId of elementIds) expect(() => file.byId(elementId)).toThrow();

		file.redo();
		expect(file.byId(id).isA("IfcDerivedUnit")).toBe(true);
		expect(file.byId(id).get("Elements") as EntityInstance[]).toHaveLength(2);
	});
});
