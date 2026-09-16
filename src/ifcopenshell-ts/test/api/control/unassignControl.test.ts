// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/control/test_unassign_control.py` (src/ifcopenshell-
// python) -- `TestUnassignControl.test_run` ported verbatim, run against both IFC4 and
// IFC2X3 matching the real `TestUnassignControlIFC2X3` mixin. See `./assignControl.
// test.ts`'s own header comment for why the fixture builds `control` via a bare
// `file.createEntity("IfcCostSchedule")` rather than the not-yet-ported
// `api.cost.add_cost_schedule`.

import { describe, expect, test } from "vitest";
import { assignControl } from "../../../src/api/control/assignControl";
import { unassignControl } from "../../../src/api/control/unassignControl";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.control.unassignControl (%s)", (schema) => {
	test("run", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const control = file.createEntity("IfcCostSchedule");

		// assign and unassign
		let relation = assignControl(file, { relatingControl: control, relatedObjects: [wall] });
		expect(relation).toBeDefined();
		unassignControl(file, { relatingControl: control, relatedObjects: [wall] });
		expect(file.byType("IfcRelAssignsToControl").length).toBe(0);

		// 1 control 2 related objects
		const wall1 = file.createEntity("IfcWall");
		relation = assignControl(file, { relatingControl: control, relatedObjects: [wall] });
		expect(relation).toBeDefined();
		assignControl(file, { relatingControl: control, relatedObjects: [wall1] });
		unassignControl(file, { relatingControl: control, relatedObjects: [wall1] });
		expect(file.byType("IfcRelAssignsToControl").length).toBe(1);
		expect((relation?.get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([wall.identity()]);
	});
});
