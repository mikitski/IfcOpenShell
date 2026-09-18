// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_work_schedule.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python), so this coverage is written directly
// from the real source/docstring, run against every schema.

import { describe, expect, test } from "vitest";
import { addWorkPlan } from "../../../src/api/sequence/addWorkPlan";
import { addWorkSchedule } from "../../../src/api/sequence/addWorkSchedule";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.sequence.addWorkSchedule (%s)", (schema) => {
	test("creates a work schedule with defaults, declared against the project (IFC4+ only)", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkSchedule(file, {});
		expect(workSchedule.isA("IfcWorkSchedule")).toBe(true);
		expect(workSchedule.get("Name")).toBe("Unnamed");
		expect(workSchedule.get("CreationDate")).toBeTruthy();
		expect(workSchedule.get("StartTime")).toBeTruthy();

		if (schema === "IFC2X3") {
			expect(workSchedule.get("ObjectType")).toBe("NOTDEFINED");
			// IFC2X3 has no `IfcContext` class at all -- see this port's own header
			// comment. This function's own `if file.schema != "IFC2X3":` guard means
			// `IfcContext` is never touched here.
			return;
		}
		expect(workSchedule.get("PredefinedType")).toBe("NOTDEFINED");
		const context = file.byType("IfcContext")[0];
		const declares = context.get("Declares") as EntityInstance[];
		expect(declares.length).toBe(1);
		expect((declares[0].get("RelatedDefinitions") as EntityInstance[]).map((d) => d.identity())).toEqual([
			workSchedule.identity(),
		]);
	});

	test("respects a custom startTime for StartTime (unlike addWorkPlan's own disclosed bug)", () => {
		const file = createTestFile(schema);
		const startTime = new Date(1999, 0, 1, 0, 0, 0);
		const workSchedule = addWorkSchedule(file, { startTime });

		if (schema === "IFC2X3") {
			const startTimeEntity = workSchedule.get("StartTime") as EntityInstance;
			const dateComponent = startTimeEntity.get("DateComponent") as EntityInstance;
			expect(dateComponent.get("YearComponent")).toBe(1999);
		} else {
			const startTimeStr = workSchedule.get("StartTime") as string;
			expect(startTimeStr.startsWith("1999-01-01")).toBe(true);
		}
	});

	test("sets ObjectType when provided (overwriting the IFC2X3 PredefinedType-fallback default)", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkSchedule(file, { objectType: "Custom" });
		// On IFC2X3, `root.createEntity`'s own PredefinedType-absent fallback first
		// writes "NOTDEFINED" to ObjectType, but `objectType`, applied afterward, always
		// wins -- ported verbatim (real Python's own two statements run in the same order).
		expect(workSchedule.get("ObjectType")).toBe("Custom");
	});

	test("aggregates under a work plan when given, and does NOT declare against the context in that case", () => {
		const file = createTestFile(schema);
		const workPlan = addWorkPlan(file, { name: "Construction" });
		const workSchedule = addWorkSchedule(file, { name: "Construction Schedule A", workPlan });

		const isDecomposedBy = workPlan.get("IsDecomposedBy") as EntityInstance[];
		const aggregate = isDecomposedBy.find((rel) => rel.isA("IfcRelAggregates"));
		expect(aggregate).toBeDefined();
		expect((aggregate?.get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([
			workSchedule.identity(),
		]);

		if (schema !== "IFC2X3") {
			// The schedule itself must NOT also be separately declared against the
			// context, since `workPlan` was given (the `elif` branch is skipped).
			const context = file.byType("IfcContext")[0];
			const declares = context.get("Declares") as EntityInstance[];
			const declaresWorkSchedule = declares.some((rel) =>
				(rel.get("RelatedDefinitions") as EntityInstance[]).some((d) => d.equals(workSchedule)),
			);
			expect(declaresWorkSchedule).toBe(false);
		}
	});
});
