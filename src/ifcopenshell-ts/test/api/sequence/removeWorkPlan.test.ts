// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `remove_work_plan.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python), so this coverage is written directly
// from the real source/docstring, including a dedicated pin for the disclosed
// "no IFC2X3 guard at all" bug (`../../../src/api/sequence/removeWorkPlan.ts`'s own
// header comment, identical finding to `./assignWorkPlan.test.ts`).

import { describe, expect, test } from "vitest";
import { addWorkPlan } from "../../../src/api/sequence/addWorkPlan";
import { addWorkSchedule } from "../../../src/api/sequence/addWorkSchedule";
import { assignWorkPlan } from "../../../src/api/sequence/assignWorkPlan";
import { removeWorkPlan } from "../../../src/api/sequence/removeWorkPlan";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.removeWorkPlan (%s)", (schema) => {
	test("removes the work plan without removing its grouped work schedules", () => {
		const file = createTestFile(schema);
		const workPlan = addWorkPlan(file, { name: "Construction" });
		const workSchedule = addWorkSchedule(file, { name: "Construction Schedule A" });
		assignWorkPlan(file, { workSchedule, workPlan });

		removeWorkPlan(file, { workPlan });
		expect(file.byType("IfcWorkPlan").length).toBe(0);
		// The schedule itself is untouched -- only the aggregation relationship is undone.
		expect(file.byType("IfcWorkSchedule").length).toBe(1);
		expect((workSchedule.get("Decomposes") as EntityInstance[]).length).toBe(0);
	});

	test("un-declares the work plan from the project's context first", () => {
		const file = createTestFile(schema);
		const workPlan = addWorkPlan(file, { name: "Construction" });
		const context = file.byType("IfcContext")[0];
		expect((context.get("Declares") as EntityInstance[]).length).toBe(1);

		removeWorkPlan(file, { workPlan });
		expect((context.get("Declares") as EntityInstance[]).length).toBe(0);
	});

	test("removing a work plan with no grouped schedules is a no-op beyond removal itself", () => {
		const file = createTestFile(schema);
		const workPlan = addWorkPlan(file, { name: "Construction" });
		removeWorkPlan(file, { workPlan });
		expect(file.byType("IfcWorkPlan").length).toBe(0);
	});
});

// --- IFC2X3: no `file.schema != "IFC2X3"` guard at all -- see this file's header comment ---
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.sequence.removeWorkPlan (IFC2X3)", () => {
	test("throws unconditionally -- IfcContext doesn't exist on IFC2X3 (confirmed, disclosed real Python bug)", () => {
		const file = createTestFile("IFC2X3");
		const workPlan = file.createEntity("IfcWorkPlan");
		expect(() => removeWorkPlan(file, { workPlan })).toThrow();
	});
});
