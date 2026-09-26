// This file was generated with the assistance of an AI coding tool.
//
// Port of `test/api/cost/test_edit_cost_value.py`'s `TestEditCostValue` (real Python
// runs this against IFC4 and IFC4X3 only -- never IFC2X3, gated here the same way).
//
// Both of real Python's own test cases (`AppliedValue`, `UnitBasis`) build a fresh
// simple/defined-type instance (the `TODOS.md` "EntityInstance.setByIndex/IfcFile
// .createEntity ..." gate, resolved 2026-09-23) -- see
// `../../../src/api/cost/editCostValue.ts`'s own header comment for the full writeup.

import { describe, expect, test } from "vitest";
import { addCostItem } from "../../../src/api/cost/addCostItem";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import { addCostValue } from "../../../src/api/cost/addCostValue";
import { editCostValue } from "../../../src/api/cost/editCostValue";
import { addSiUnit } from "../../../src/api/unit/addSiUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.cost.editCostValue (%s)", (schema) => {
	test("a plain attribute needing no wrapping (e.g. Category) is set directly", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const value = addCostValue(file, { parent: item });

		editCostValue(file, { costValue: value, attributes: { Category: "Labour" } });

		expect(value.get("Category")).toBe("Labour");
	});

	// Real Python: `test_editing_applied_value`.
	test("editing AppliedValue wraps the raw number in a fresh IfcMonetaryMeasure", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const value = addCostValue(file, { parent: item });

		editCostValue(file, { costValue: value, attributes: { AppliedValue: 42.0 } });

		expect((value.get("AppliedValue") as EntityInstance).getByIndex(0)).toBe(42.0);
	});

	// Real Python: `test_editing_unit_basis_removes_old_deeply` (the "removes old
	// deeply" part isn't independently observable here -- see `editCostValue.ts`'s own
	// header comment: `removeDeep2`'s no-`alsoConsider` call is a no-op while the old
	// `UnitBasis` is still forward-referenced, matching real Python's own behavior;
	// neither real test asserts the old entity was actually purged from the file).
	test("editing UnitBasis with a new value replaces the old one", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const value = addCostValue(file, { parent: item });
		const unit = addSiUnit(file, { unitType: "LENGTHUNIT" });

		editCostValue(file, {
			costValue: value,
			attributes: { UnitBasis: { ValueComponent: 1.0, UnitComponent: unit } },
		});
		const oldBasis = value.get("UnitBasis") as EntityInstance;
		expect(oldBasis).not.toBeNull();
		const oldBasisId = oldBasis.id();

		editCostValue(file, {
			costValue: value,
			attributes: { UnitBasis: { ValueComponent: 2.0, UnitComponent: unit } },
		});
		const newBasis = value.get("UnitBasis") as EntityInstance;
		expect(newBasis).not.toBeNull();
		expect(newBasis.id()).not.toBe(oldBasisId);
	});

	// Real Python: `test_clearing_unit_basis` -- this direction (clearing to `null`,
	// no new value to construct) is NOT blocked at all.
	test("clearing UnitBasis (no new value to construct) sets it to null", () => {
		const file = createTestFile(schema);
		const schedule = addCostSchedule(file);
		const item = addCostItem(file, { costSchedule: schedule });
		const value = addCostValue(file, { parent: item });

		editCostValue(file, { costValue: value, attributes: { UnitBasis: null } });

		expect(value.get("UnitBasis")).toBeNull();
	});
});
