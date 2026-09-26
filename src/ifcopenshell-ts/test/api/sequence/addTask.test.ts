// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_task.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python), so this coverage is written directly
// from the real source/docstring, including dedicated pins for the disclosed IFC2X3
// `identification`-throws bug (`../../../src/api/sequence/addTask.ts`'s own header
// comment).

import { describe, expect, test } from "vitest";
import { addTask } from "../../../src/api/sequence/addTask";
import { addWorkSchedule } from "../../../src/api/sequence/addWorkSchedule";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.sequence.addTask (%s)", (schema) => {
	test("creates a root task under a work schedule via api.control.assignControl", () => {
		const file = createTestFile(schema);
		const schedule = addWorkSchedule(file, {});
		const task = addTask(file, { workSchedule: schedule, name: "Construction" });
		expect(task.isA("IfcTask")).toBe(true);
		expect(task.get("Name")).toBe("Construction");
		expect(task.get("IsMilestone")).toBe(false);

		const controls = schedule.get("Controls") as EntityInstance[];
		expect(controls.length).toBe(1);
		expect((controls[0].get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([task.identity()]);
	});

	test("creates a subtask under a parent task via api.nest.assignObject", () => {
		const file = createTestFile(schema);
		const schedule = addWorkSchedule(file, {});
		const construction = addTask(file, { workSchedule: schedule, name: "Construction" });
		const subtask = addTask(file, { parentTask: construction, name: "Early Works" });

		const isNestedBy =
			schema === "IFC2X3"
				? (construction.get("IsDecomposedBy") as EntityInstance[]).filter((r) => r.isA("IfcRelNests"))
				: (construction.get("IsNestedBy") as EntityInstance[]);
		expect(isNestedBy.length).toBe(1);
		expect((isNestedBy[0].get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([
			subtask.identity(),
		]);
	});

	test("workSchedule wins when both workSchedule and parentTask are given", () => {
		const file = createTestFile(schema);
		const schedule = addWorkSchedule(file, {});
		const construction = addTask(file, { workSchedule: schedule, name: "Construction" });
		const task = addTask(file, { workSchedule: schedule, parentTask: construction, name: "Ambiguous" });

		const controls = schedule.get("Controls") as EntityInstance[];
		expect((controls[0].get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toContain(task.identity());
	});

	test("sets Description when provided", () => {
		const file = createTestFile(schema);
		const task = addTask(file, { description: "Turn off equipment." });
		expect(task.get("Description")).toBe("Turn off equipment.");
	});

	if (schema === "IFC2X3") {
		test("throws when identification is given -- IfcTask has no Identification attribute on IFC2X3 (disclosed, confirmed real Python bug)", () => {
			const file = createTestFile(schema);
			expect(() => addTask(file, { identification: "C" })).toThrow(/Identification/);
		});

		test("predefinedType falls back to ObjectType (root.createEntity's own already-verified fallback)", () => {
			const file = createTestFile(schema);
			const task = addTask(file, { predefinedType: "CONSTRUCTION" });
			expect(task.get("ObjectType")).toBe("CONSTRUCTION");
		});
	} else {
		test("sets Identification when provided, and PredefinedType", () => {
			const file = createTestFile(schema);
			const task = addTask(file, { identification: "C", predefinedType: "CONSTRUCTION" });
			expect(task.get("Identification")).toBe("C");
			expect(task.get("PredefinedType")).toBe("CONSTRUCTION");
		});

		test("auto-numbers Identification from the parent task's own Identification", () => {
			const file = createTestFile(schema);
			const schedule = addWorkSchedule(file, {});
			const construction = addTask(file, { workSchedule: schedule, name: "Construction", identification: "C" });
			const subtask1 = addTask(file, { parentTask: construction, name: "Early Works" });
			expect(subtask1.get("Identification")).toBe("C.1");
			const subtask2 = addTask(file, { parentTask: construction, name: "Substructure" });
			expect(subtask2.get("Identification")).toBe("C.2");
		});

		test("does NOT auto-number when the parent task has no Identification of its own", () => {
			const file = createTestFile(schema);
			const schedule = addWorkSchedule(file, {});
			const construction = addTask(file, { workSchedule: schedule, name: "Construction" });
			const subtask = addTask(file, { parentTask: construction, name: "Early Works" });
			expect(subtask.get("Identification")).toBe(null);
		});
	}
});
