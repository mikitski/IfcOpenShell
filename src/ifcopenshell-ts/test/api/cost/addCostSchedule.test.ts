// This file was generated with the assistance of an AI coding tool.
//
// Port of `test/api/cost/test_add_cost_schedule.py`'s `TestAddCostSchedule` (real
// Python runs this against IFC4 and IFC2X3) -- run against every `AVAILABLE_SCHEMAS`
// entry here since nothing in `add_cost_schedule.py` is IFC4X3-incompatible.

import { describe, expect, test } from "vitest";
import { addCostSchedule } from "../../../src/api/cost/addCostSchedule";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.cost.addCostSchedule (%s)", (schema) => {
	test("adds a cost schedule with a name and predefined type", () => {
		const file = createTestFile(schema);

		const schedule = addCostSchedule(file, { name: "Foo", predefinedType: "BUDGET" });

		expect(schedule.isA("IfcCostSchedule")).toBe(true);
		expect(schedule.get("Name")).toBe("Foo");
		expect(schedule.get("PredefinedType")).toBe("BUDGET");
	});

	test("adding a userdefined type stores it in ObjectType", () => {
		const file = createTestFile(schema);

		const schedule = addCostSchedule(file, { name: "Foo", predefinedType: "FOO" });

		expect(schedule.isA("IfcCostSchedule")).toBe(true);
		expect(schedule.get("Name")).toBe("Foo");
		expect(schedule.get("PredefinedType")).toBe("USERDEFINED");
		expect(schedule.get("ObjectType")).toBe("FOO");
	});

	test("UpdateDate is stamped via api.sequence.addDateTime", () => {
		const file = createTestFile(schema);

		const schedule = addCostSchedule(file);

		const updateDate = schedule.get("UpdateDate");
		expect(updateDate).not.toBeNull();
		if (schema === "IFC2X3") {
			expect((updateDate as EntityInstance).isA("IfcDateAndTime")).toBe(true);
		} else {
			expect(typeof updateDate).toBe("string");
		}
	});
});
