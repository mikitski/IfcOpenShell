// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/unit/test_add_monetary_unit.py` (src/ifcopenshell-
// python) -- its one real test case ported verbatim, plus new Transaction/undo-redo
// regression coverage (no Python counterpart).

import { describe, expect, test } from "vitest";
import { addMonetaryUnit } from "../../../src/api/unit/addMonetaryUnit";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.unit.addMonetaryUnit (%s)", (schema) => {
	test("test_run", () => {
		const file = createTestFile(schema);
		const unit = addMonetaryUnit(file, { currency: "USD" });
		expect(unit.isA("IfcMonetaryUnit")).toBe(true);
		expect(unit.get("Currency")).toBe("USD");
	});

	test("defaults to DOLLARYDOO", () => {
		const file = createTestFile(schema);
		const unit = addMonetaryUnit(file, {});
		expect(unit.get("Currency")).toBe("DOLLARYDOO");
	});
});

describe.each(AVAILABLE_SCHEMAS)("api.unit.addMonetaryUnit Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcMonetaryUnit; redo recreates it", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		const unit = addMonetaryUnit(file, { currency: "ZWL" });
		file.endTransaction();
		const id = unit.id();

		file.undo();
		expect(() => file.byId(id)).toThrow();

		file.redo();
		expect(file.byId(id).isA("IfcMonetaryUnit")).toBe(true);
		expect(file.byId(id).get("Currency")).toBe("ZWL");
	});
});
