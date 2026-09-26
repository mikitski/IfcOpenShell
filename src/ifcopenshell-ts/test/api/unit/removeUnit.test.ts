// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/unit/test_remove_unit.py` (src/ifcopenshell-python) --
// 3 of its 4 real test cases ported verbatim
// (`test_remove_a_single_unit`/`test_remove_the_only_assigned_unit`/
// `test_remove_an_assigned_unit`, all fully unblocked). The 4th,
// `test_removing_a_unit_deeply`, calls the disclosed-blocked
// `unit.add_conversion_based_unit` as its own setup -- ported below as a dedicated
// "currently blocked" assertion (matching `addConversionBasedUnit.test.ts`'s own
// precedent), PLUS a hand-built supplementary test that constructs the same
// conversion-based-unit-shaped subgraph directly via `file.createEntity(...)` (a
// `null` `ValueComponent` instead of a real, blocked `IfcReal` -- legal for this
// port, which doesn't enforce EXPRESS mandatory-attribute validity at write time) so
// `removeUnit`'s own deep-removal logic (`util.element.removeDeep2`) still gets real
// coverage for this exact shape, without depending on the blocked function.

import { describe, expect, test } from "vitest";
import { addConversionBasedUnit } from "../../../src/api/unit/addConversionBasedUnit";
import { addSiUnit } from "../../../src/api/unit/addSiUnit";
import { assignUnit } from "../../../src/api/unit/assignUnit";
import { removeUnit } from "../../../src/api/unit/removeUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";

function unitsOf(assignment: EntityInstance): EntityInstance[] {
	return (assignment.get("Units") as EntityInstance[]) ?? [];
}

describe.each(AVAILABLE_SCHEMAS)("api.unit.removeUnit (%s)", (schema) => {
	test("test_remove_a_single_unit", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		file.createEntity("IfcProject");
		const unit = file.createEntity("IfcContextDependentUnit");

		removeUnit(file, { unit });

		expect(file.byType("IfcContextDependentUnit")).toHaveLength(0);
	});

	test("test_remove_the_only_assigned_unit", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		file.createEntity("IfcProject");
		const unit = file.createEntity("IfcContextDependentUnit");
		assignUnit(file, { units: [unit] });

		removeUnit(file, { unit });

		expect(file.byType("IfcContextDependentUnit")).toHaveLength(0);
		expect(file.byType("IfcUnitAssignment")).toHaveLength(0);
	});

	test("test_remove_an_assigned_unit", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		file.createEntity("IfcProject");
		const unit1 = file.createEntity("IfcContextDependentUnit");
		const unit2 = file.createEntity("IfcSIUnit");
		const assignment = assignUnit(file, { units: [unit1, unit2] });

		removeUnit(file, { unit: unit1 });

		expect(file.byType("IfcContextDependentUnit")).toHaveLength(0);
		const remaining = unitsOf(assignment);
		expect(remaining).toHaveLength(1);
		expect(remaining[0].equals(unit2)).toBe(true);
	});

	test("test_removing_a_unit_deeply: removing a real addConversionBasedUnit-built unit leaves only the IfcProject", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		file.createEntity("IfcProject");
		const unit = addConversionBasedUnit(file, { name: "foot" });

		removeUnit(file, { unit });

		expect([...file].length).toBe(1);
	});

	test("removing a conversion-based-unit-shaped subgraph deeply removes its Dimensions/ConversionFactor/SI unit (hand-built, avoiding the blocked addConversionBasedUnit)", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		file.createEntity("IfcProject");

		const dimensions = file.createEntity("IfcDimensionalExponents", 1, 0, 0, 0, 0, 0, 0);
		// Leading `null` placeholder for `IfcSIUnit`'s derived `Dimensions` slot -- see
		// `addSiUnit.ts`'s own header comment.
		const siUnit = file.createEntity("IfcSIUnit", null, "LENGTHUNIT", null, "METRE");
		// `ValueComponent` left `null` -- see this file's own header comment.
		const conversionFactor = file.createEntity("IfcMeasureWithUnit", null, siUnit);
		const unit = file.createEntity("IfcConversionBasedUnit", dimensions, "LENGTHUNIT", "foot", conversionFactor);

		removeUnit(file, { unit });

		expect(file.byType("IfcConversionBasedUnit")).toHaveLength(0);
		expect(file.byType("IfcDimensionalExponents")).toHaveLength(0);
		expect(file.byType("IfcMeasureWithUnit")).toHaveLength(0);
		expect(file.byType("IfcSIUnit")).toHaveLength(0);
		// Only the IfcProject remains.
		expect([...file].length).toBe(1);
	});
});

describe.each(AVAILABLE_SCHEMAS)("api.unit.removeUnit Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed unit and its unit assignment; redo removes it again", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		file.createEntity("IfcProject");
		const unit = file.createEntity("IfcContextDependentUnit");
		const unitId = unit.id();
		const assignment = assignUnit(file, { units: [unit] });
		const assignmentId = assignment.id();

		file.beginTransaction();
		removeUnit(file, { unit });
		file.endTransaction();

		expect(() => file.byId(unitId)).toThrow();
		expect(() => file.byId(assignmentId)).toThrow();

		file.undo();
		expect(file.byId(unitId).isA("IfcContextDependentUnit")).toBe(true);
		expect(file.byId(assignmentId).isA("IfcUnitAssignment")).toBe(true);

		file.redo();
		expect(() => file.byId(unitId)).toThrow();
		expect(() => file.byId(assignmentId)).toThrow();
	});
});
