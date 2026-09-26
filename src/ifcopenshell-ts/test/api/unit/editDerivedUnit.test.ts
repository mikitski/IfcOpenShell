// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/unit/test_edit_derived_unit.py` (src/ifcopenshell-
// python) -- its one real test case ported verbatim, plus new Transaction/undo-redo
// regression coverage.

import { describe, expect, test } from "vitest";
import { editDerivedUnit } from "../../../src/api/unit/editDerivedUnit";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.unit.editDerivedUnit (%s)", (schema) => {
	test("test_run", () => {
		const file = createTestFile(schema);
		const unit = file.createEntity("IfcDerivedUnit");
		editDerivedUnit(file, {
			unit,
			attributes: { UnitType: "USERDEFINED", UserDefinedType: "UserDefinedType" },
		});
		expect(unit.get("UnitType")).toBe("USERDEFINED");
		expect(unit.get("UserDefinedType")).toBe("UserDefinedType");
	});
});

describe.each(AVAILABLE_SCHEMAS)("api.unit.editDerivedUnit Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous attributes; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const unit = file.createEntity("IfcDerivedUnit", [], "LINEARVELOCITYUNIT", null);

		file.beginTransaction();
		editDerivedUnit(file, { unit, attributes: { UnitType: "USERDEFINED", UserDefinedType: "Widgets" } });
		file.endTransaction();

		expect(unit.get("UnitType")).toBe("USERDEFINED");
		expect(unit.get("UserDefinedType")).toBe("Widgets");

		file.undo();
		expect(unit.get("UnitType")).toBe("LINEARVELOCITYUNIT");
		expect(unit.get("UserDefinedType")).toBeNull();

		file.redo();
		expect(unit.get("UnitType")).toBe("USERDEFINED");
		expect(unit.get("UserDefinedType")).toBe("Widgets");
	});
});
