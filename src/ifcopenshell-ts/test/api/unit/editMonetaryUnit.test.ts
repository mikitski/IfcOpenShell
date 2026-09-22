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
		// "GBP" (not "ZWL") as the PREVIOUS value -- this test exercises undo/redo
		// bookkeeping, not any specific currency value, and "ZWL" isn't a valid
		// `IfcCurrencyEnum` member on IFC2X3 (`IfcMonetaryUnit.Currency` is a closed
		// enum there, confirmed against the real compiled schema,
		// `src/ifcparse/schemas/Ifc2x3-schema.cpp`; IFC4/IFC4X3 loosened it to a
		// free-form `IfcLabel`, where any string is valid). "GBP"/"USD" are both valid
		// on all 3 schemas.
		const unit = file.createEntity("IfcMonetaryUnit", "GBP");

		file.beginTransaction();
		editMonetaryUnit(file, { unit, attributes: { Currency: "USD" } });
		file.endTransaction();

		expect(unit.get("Currency")).toBe("USD");

		file.undo();
		expect(unit.get("Currency")).toBe("GBP");

		file.redo();
		expect(unit.get("Currency")).toBe("USD");
	});
});
