// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/unit/test_unassign_unit.py` (src/ifcopenshell-python)
// -- all 3 real test cases ported verbatim, plus new Transaction/undo-redo regression
// coverage.

import { describe, expect, test } from "vitest";
import { addMonetaryUnit } from "../../../src/api/unit/addMonetaryUnit";
import { assignUnit } from "../../../src/api/unit/assignUnit";
import { unassignUnit } from "../../../src/api/unit/unassignUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";

function unitsOf(assignment: EntityInstance): EntityInstance[] {
	return (assignment.get("Units") as EntityInstance[]) ?? [];
}

function includesUnit(units: readonly EntityInstance[], unit: EntityInstance): boolean {
	return units.some((u) => u.equals(unit));
}

describe.each(AVAILABLE_SCHEMAS)("api.unit.unassignUnit (%s)", (schema) => {
	test("test_run", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		file.createEntity("IfcProject");
		const unit1 = addMonetaryUnit(file, { currency: "USD" });
		const unit2 = addMonetaryUnit(file, { currency: "JPY" });
		const assignment = assignUnit(file, { units: [unit1, unit2] });

		unassignUnit(file, { units: [unit1] });

		expect(includesUnit(unitsOf(assignment), unit1)).toBe(false);
		expect(includesUnit(unitsOf(assignment), unit2)).toBe(true);
	});

	test("test_unassigning_the_last_unit", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const project = file.createEntity("IfcProject");
		const unit = addMonetaryUnit(file, { currency: "USD" });
		assignUnit(file, { units: [unit] });

		unassignUnit(file, { units: [unit] });

		expect(project.get("UnitsInContext")).toBeNull();
	});

	test("test_doing_nothing_if_the_unit_is_not_assigned", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const unit = addMonetaryUnit(file, { currency: "USD" });
		expect(unassignUnit(file, { units: [unit] })).toBeUndefined();
	});
});

describe.each(AVAILABLE_SCHEMAS)("api.unit.unassignUnit Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the purged IfcUnitAssignment; redo purges it again", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const project = file.createEntity("IfcProject");
		const unit = addMonetaryUnit(file, { currency: "USD" });
		const assignment = assignUnit(file, { units: [unit] });
		const assignmentId = assignment.id();

		file.beginTransaction();
		unassignUnit(file, { units: [unit] });
		file.endTransaction();

		expect(project.get("UnitsInContext")).toBeNull();
		expect(() => file.byId(assignmentId)).toThrow();

		file.undo();
		expect(file.byId(assignmentId).isA("IfcUnitAssignment")).toBe(true);
		expect(includesUnit(unitsOf(file.byId(assignmentId)), unit)).toBe(true);

		file.redo();
		expect(() => file.byId(assignmentId)).toThrow();
	});

	test("undo restores a removed member when other units remain assigned; redo removes it again", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		file.createEntity("IfcProject");
		const unit1 = addMonetaryUnit(file, { currency: "USD" });
		const unit2 = addMonetaryUnit(file, { currency: "JPY" });
		const assignment = assignUnit(file, { units: [unit1, unit2] });

		file.beginTransaction();
		unassignUnit(file, { units: [unit1] });
		file.endTransaction();

		expect(includesUnit(unitsOf(assignment), unit1)).toBe(false);

		file.undo();
		expect(includesUnit(unitsOf(assignment), unit1)).toBe(true);
		expect(includesUnit(unitsOf(assignment), unit2)).toBe(true);

		file.redo();
		expect(includesUnit(unitsOf(assignment), unit1)).toBe(false);
	});
});
