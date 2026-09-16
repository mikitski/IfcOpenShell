// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/control/test_assign_control.py` (src/ifcopenshell-
// python) -- `TestAssignControl`'s 2 cases ported verbatim, run against both IFC4 and
// IFC2X3 matching the real `TestAssignControlIFC2X3` mixin. Real Python's own fixture
// builds `control` via `ifcopenshell.api.cost.add_cost_schedule`, not ported yet in
// this project (`api.cost` doesn't exist as a TS module) -- matching `test/util/
// cost.test.ts`'s own established precedent for this exact gap, a bare
// `file.createEntity("IfcCostSchedule")` (a concrete `IfcControl` subtype) is used
// directly instead. `assign_control`/`unassign_control` themselves have no dependency
// on `api.cost` at all (confirmed by reading both real files), so this substitution
// doesn't affect what's actually under test.

import { describe, expect, test } from "vitest";
import { assignControl } from "../../../src/api/control/assignControl";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.control.assignControl (%s)", (schema) => {
	test("run", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const control = file.createEntity("IfcCostSchedule");

		// simple assignment
		let relation = assignControl(file, { relatingControl: control, relatedObjects: [wall] });
		expect(relation).toBeDefined();
		expect(file.byType("IfcRelAssignsToControl").length).toBe(1);
		expect((relation?.get("RelatingControl") as EntityInstance).equals(control)).toBe(true);
		expect((relation?.get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([wall.identity()]);

		// trying to establish existing relationship
		relation = assignControl(file, { relatingControl: control, relatedObjects: [wall] });
		expect(relation).toBeUndefined();

		// assigning same control to another object
		const wall1 = file.createEntity("IfcWall");
		relation = assignControl(file, { relatingControl: control, relatedObjects: [wall1] });
		expect(relation).toBeDefined();
		expect(file.byType("IfcRelAssignsToControl").length).toBe(1);
		expect((relation?.get("RelatingControl") as EntityInstance).equals(control)).toBe(true);
		const relatedIds = (relation?.get("RelatedObjects") as EntityInstance[]).map((o) => o.identity()).sort();
		expect(relatedIds).toEqual([wall, wall1].map((o) => o.identity()).sort());
	});

	test("batch assignment", () => {
		const file = createTestFile(schema);
		const walls = Array.from({ length: 5 }, () => file.createEntity("IfcWall"));
		const control = file.createEntity("IfcCostSchedule");

		const relation = assignControl(file, { relatingControl: control, relatedObjects: walls });
		expect(relation).toBeDefined();
		expect(file.byType("IfcRelAssignsToControl").length).toBe(1);
		expect((relation?.get("RelatingControl") as EntityInstance).equals(control)).toBe(true);
		const relatedIds = (relation?.get("RelatedObjects") as EntityInstance[]).map((o) => o.identity()).sort();
		expect(relatedIds).toEqual(walls.map((o) => o.identity()).sort());
	});
});
