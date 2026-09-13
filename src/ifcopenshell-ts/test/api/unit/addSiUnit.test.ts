// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/unit/test_add_si_unit.py` (src/ifcopenshell-python) --
// its one real test case ported verbatim, plus new Transaction/undo-redo regression
// coverage (no Python counterpart).

import { describe, expect, test } from "vitest";
import { addSiUnit } from "../../../src/api/unit/addSiUnit";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.unit.addSiUnit (%s)", (schema) => {
	test("test_run", () => {
		const file = createTestFile(schema);
		const unit = addSiUnit(file, { unitType: "LENGTHUNIT", prefix: "MILLI" });
		expect(unit.get("UnitType")).toBe("LENGTHUNIT");
		expect(unit.get("Name")).toBe("METRE");
		expect(unit.get("Prefix")).toBe("MILLI");
	});

	test("defaults to LENGTHUNIT with no prefix", () => {
		const file = createTestFile(schema);
		const unit = addSiUnit(file, {});
		expect(unit.get("UnitType")).toBe("LENGTHUNIT");
		expect(unit.get("Name")).toBe("METRE");
		expect(unit.get("Prefix")).toBeNull();
	});
});

describe.each(AVAILABLE_SCHEMAS)("api.unit.addSiUnit Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcSIUnit; redo recreates it", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		const unit = addSiUnit(file, { unitType: "AREAUNIT" });
		file.endTransaction();
		const id = unit.id();

		expect(file.byId(id).isA("IfcSIUnit")).toBe(true);

		file.undo();
		expect(() => file.byId(id)).toThrow();

		file.redo();
		expect(file.byId(id).isA("IfcSIUnit")).toBe(true);
		expect(file.byId(id).get("UnitType")).toBe("AREAUNIT");
	});
});
