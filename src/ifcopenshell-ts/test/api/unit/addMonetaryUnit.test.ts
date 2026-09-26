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

	// IFC2X3 excluded: `IfcMonetaryUnit.Currency` is a closed `IfcCurrencyEnum`
	// enumeration on IFC2X3 (confirmed against the real compiled schema,
	// `src/ifcparse/schemas/Ifc2x3-schema.cpp`'s own `IfcCurrencyEnum` literal list --
	// it has no `DOLLARYDOO` member, and no `IfcCurrencyEnum` type exists in IFC4/
	// IFC4X3 at all, where `Currency` was loosened to a free-form `IfcLabel`). Real
	// Python's own `add_monetary_unit`'s default genuinely IS `"DOLLARYDOO"` on every
	// schema (`ifcopenshell/api/unit/add_monetary_unit.py`'s own signature, ported
	// verbatim in `addMonetaryUnit.ts`) -- this isn't a TS-port bug, calling
	// `ifcopenshell.api.unit.add_monetary_unit(file)` with no currency on a real
	// IFC2X3 file would raise the identical "keyword not found" error in real Python
	// too. Real Python's own `test_add_monetary_unit.py` never actually exercises this
	// default on either schema (`TestAddMonetaryUnit`/`TestAddMonetaryUnitIFC2X3` both
	// always pass `currency="USD"` explicitly) -- this port's own extra "defaults to
	// DOLLARYDOO" case (beyond real Python's coverage) is IFC4+-only for that reason.
	test.skipIf(schema === "IFC2X3")("defaults to DOLLARYDOO", () => {
		const file = createTestFile(schema);
		const unit = addMonetaryUnit(file, {});
		expect(unit.get("Currency")).toBe("DOLLARYDOO");
	});
});

describe.each(AVAILABLE_SCHEMAS)("api.unit.addMonetaryUnit Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcMonetaryUnit; redo recreates it", () => {
		const file = createTestFile(schema);

		// "USD" (not "ZWL") -- this test exercises undo/redo bookkeeping, not any
		// specific currency value, and "ZWL" isn't a valid `IfcCurrencyEnum` member on
		// IFC2X3 (see this file's own "defaults to DOLLARYDOO" comment above for the
		// real schema difference); "USD" is valid on all 3 schemas.
		file.beginTransaction();
		const unit = addMonetaryUnit(file, { currency: "USD" });
		file.endTransaction();
		const id = unit.id();

		file.undo();
		expect(() => file.byId(id)).toThrow();

		file.redo();
		expect(file.byId(id).isA("IfcMonetaryUnit")).toBe(true);
		expect(file.byId(id).get("Currency")).toBe("USD");
	});
});
