// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/unit/test_edit_monetary_unit.py` (src/ifcopenshell-
// python) -- its one real test case ported verbatim, plus new Transaction/undo-redo
// regression coverage.

import { describe, expect, test } from "vitest";
import { editMonetaryUnit } from "../../../src/api/unit/editMonetaryUnit";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.unit.editMonetaryUnit (%s)", (schema) => {
	test("test_run", () => {
		const file = createTestFile(schema);
		const unit = file.createEntity("IfcMonetaryUnit");
		editMonetaryUnit(file, { unit, attributes: { Currency: "USD" } });
		expect(unit.get("Currency")).toBe("USD");
	});
});

describe.each(AVAILABLE_SCHEMAS)("api.unit.editMonetaryUnit Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous Currency; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const unit = file.createEntity("IfcMonetaryUnit", "ZWL");

		file.beginTransaction();
		editMonetaryUnit(file, { unit, attributes: { Currency: "USD" } });
		file.endTransaction();

		expect(unit.get("Currency")).toBe("USD");

		file.undo();
		expect(unit.get("Currency")).toBe("ZWL");

		file.redo();
		expect(unit.get("Currency")).toBe("USD");
	});
});
