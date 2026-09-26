// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_work_plan.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python), so this coverage is written directly
// from the real source/docstring, run against every schema, including a dedicated pin
// for the disclosed `startTime`-is-ignored bug (`../../../src/api/sequence/
// addWorkPlan.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { addWorkPlan } from "../../../src/api/sequence/addWorkPlan";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.sequence.addWorkPlan (%s)", (schema) => {
	test("creates a work plan with defaults", () => {
		const file = createTestFile(schema);
		const workPlan = addWorkPlan(file, {});
		expect(workPlan.isA("IfcWorkPlan")).toBe(true);
		expect(workPlan.get("Name")).toBe(null);
		if (schema === "IFC2X3") {
			// IFC2X3's IfcWorkPlan has no PredefinedType attribute at all (it has
			// WorkControlType/UserDefinedControlType instead) -- root.createEntity's own
			// already-verified fallback writes the default "NOTDEFINED" to ObjectType
			// instead, see ../../../src/api/root/createEntity.ts's own header comment.
			expect(workPlan.get("ObjectType")).toBe("NOTDEFINED");
		} else {
			expect(workPlan.get("PredefinedType")).toBe("NOTDEFINED");
		}
		expect(workPlan.get("CreationDate")).toBeTruthy();
		expect(workPlan.get("StartTime")).toBeTruthy();
	});

	test("creates a work plan with a custom name/predefined type", () => {
		const file = createTestFile(schema);
		const workPlan = addWorkPlan(file, { name: "Construction", predefinedType: "PLANNED" });
		expect(workPlan.get("Name")).toBe("Construction");
		if (schema === "IFC2X3") {
			expect(workPlan.get("ObjectType")).toBe("PLANNED");
		} else {
			expect(workPlan.get("PredefinedType")).toBe("PLANNED");
		}
	});

	test("the startTime setting is accepted but has NO effect (disclosed, confirmed real Python bug)", () => {
		const file = createTestFile(schema);
		// A far-past date: if `startTime` were actually used, `StartTime` would encode it.
		const startTime = new Date(1999, 0, 1, 0, 0, 0);
		const before = new Date();
		const workPlan = addWorkPlan(file, { startTime });
		const after = new Date();

		if (schema === "IFC2X3") {
			// IFC2X3: StartTime is a real IfcDateAndTime entity -- round-trip it back.
			const startTimeEntity = workPlan.get("StartTime") as EntityInstance;
			const dateComponent = startTimeEntity.get("DateComponent") as EntityInstance;
			const year = dateComponent.get("YearComponent") as number;
			// The (ignored) 1999 value must NOT appear -- StartTime always uses "now".
			expect(year).not.toBe(1999);
			expect(year).toBe(before.getFullYear());
		} else {
			const startTimeStr = workPlan.get("StartTime") as string;
			expect(startTimeStr.startsWith("1999")).toBe(false);
			// Sanity: StartTime is between `before` and `after`, i.e. "now" at call time.
			const parsed = new Date(startTimeStr);
			expect(parsed.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
			expect(parsed.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
		}
	});

	test("declares the work plan against the project's context (IFC4+ only)", () => {
		// IFC2X3 has no `IfcContext` class at all (confirmed against `ifc2x3.d.ts`) --
		// exactly why real Python's own `if file.schema != "IFC2X3":` guard exists around
		// this step. Skipped entirely on IFC2X3: `file.byType("IfcContext")` itself would
		// throw ("Entity with name 'IfcContext' not found in schema 'IFC2X3'"), and this
		// function's own body never reaches that call on IFC2X3 in the first place.
		if (schema === "IFC2X3") return;

		const file = createTestFile(schema);
		const workPlan = addWorkPlan(file, {});
		const context = file.byType("IfcContext")[0];
		const declares = context.get("Declares") as EntityInstance[];
		expect(declares.length).toBe(1);
		expect((declares[0].get("RelatedDefinitions") as EntityInstance[]).map((d) => d.identity())).toEqual([
			workPlan.identity(),
		]);
	});
});
