// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `assign_work_plan.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python), so this coverage is written directly
// from the real source/docstring, including a dedicated pin for the disclosed
// "no IFC2X3 guard at all" bug (`../../../src/api/sequence/assignWorkPlan.ts`'s own
// header comment).

import { describe, expect, test } from "vitest";
import { addWorkPlan } from "../../../src/api/sequence/addWorkPlan";
import { addWorkSchedule } from "../../../src/api/sequence/addWorkSchedule";
import { assignWorkPlan } from "../../../src/api/sequence/assignWorkPlan";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.assignWorkPlan (%s)", (schema) => {
	test("aggregates the work schedule under the work plan", () => {
		const file = createTestFile(schema);
		const workPlan = addWorkPlan(file, { name: "Construction" });
		const workSchedule = addWorkSchedule(file, { name: "Construction Schedule A" });

		const rel = assignWorkPlan(file, { workSchedule, workPlan });
		expect(rel?.isA("IfcRelAggregates")).toBe(true);
		expect((workPlan.get("IsDecomposedBy") as EntityInstance[])[0].identity()).toBe(rel?.identity());
		expect(((rel as EntityInstance).get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([
			workSchedule.identity(),
		]);
	});

	test("un-declares the work schedule from the project's context first", () => {
		const file = createTestFile(schema);
		// `addWorkPlan` ALSO declares itself against the project's `IfcContext` (see
		// `add_work_plan.py`'s own real source, lines 76-77) -- so `workPlan` and
		// `workSchedule` end up sharing the exact SAME `IfcRelDeclares` (real Python's own
		// `assign_declaration` reuses an existing rel for the same `relating_context`
		// rather than creating a new one per definition, confirmed empirically). Verified
		// directly (a disposable trace script against this worktree's own built native
		// addon, not assumed): after `assignWorkPlan` un-declares `workSchedule`, that
		// SAME shared rel correctly survives with `RelatedDefinitions` down to just
		// `[workPlan]` -- it is NOT destroyed, since `workPlan` is still declared under it.
		// So the correct assertion is that `workSchedule` itself is no longer declared
		// (`workSchedule.get("HasContext")` -- the definition-side inverse of the SAME
		// relationship -- correctly empties out), not that `context.get("Declares")`
		// itself becomes empty (it doesn't, and per real Python's own logic, shouldn't).
		const workPlan = addWorkPlan(file, { name: "Construction" });
		// A schedule created with no `workPlan` is declared against the context (see
		// `addWorkSchedule.ts`'s own header comment).
		const workSchedule = addWorkSchedule(file, { name: "Construction Schedule A" });
		expect((workSchedule.get("HasContext") as EntityInstance[]).length).toBe(1);

		assignWorkPlan(file, { workSchedule, workPlan });
		expect((workSchedule.get("HasContext") as EntityInstance[]).length).toBe(0);
		// The shared rel itself survives, still declaring `workPlan`.
		const context = file.byType("IfcContext")[0];
		const remainingRels = context.get("Declares") as EntityInstance[];
		expect(remainingRels.length).toBe(1);
		expect((remainingRels[0].get("RelatedDefinitions") as EntityInstance[]).map((d) => d.identity())).toEqual([
			workPlan.identity(),
		]);
	});
});

// --- IFC2X3: no `file.schema != "IFC2X3"` guard at all -- see this file's header comment ---
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.sequence.assignWorkPlan (IFC2X3)", () => {
	test("throws unconditionally -- IfcContext doesn't exist on IFC2X3 (confirmed, disclosed real Python bug)", () => {
		const file = createTestFile("IFC2X3");
		const workPlan = file.createEntity("IfcWorkPlan");
		const workSchedule = file.createEntity("IfcWorkSchedule");
		expect(() => assignWorkPlan(file, { workSchedule, workPlan })).toThrow();
	});
});
