// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `assign_process.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python -- only `assign_product`/
// `unassign_product` have real tests). Written directly from the real source/docstring,
// adapted from `test_assign_product.py`'s own shape (the two functions are structurally
// near-identical -- see `../../../src/api/sequence/assignProcess.ts`'s own header
// comment), with a dedicated pin for the disclosed dedup-return asymmetry vs.
// `assignProduct` (`undefined` here, the existing relationship there).

import { describe, expect, test } from "vitest";
import { assignProcess } from "../../../src/api/sequence/assignProcess";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.sequence.assignProcess (%s)", (schema) => {
	test("assigning a process input", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const task = file.createEntity("IfcTask");
		const task2 = file.createEntity("IfcTask");

		assignProcess(file, { relatingProcess: task, relatedObject: wall });
		let operatesOn = task.get("OperatesOn") as EntityInstance[];
		expect((operatesOn[0].get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([
			wall.identity(),
		]);

		const wall2 = file.createEntity("IfcWall");
		assignProcess(file, { relatingProcess: task, relatedObject: wall2 });
		operatesOn = task.get("OperatesOn") as EntityInstance[];
		expect((operatesOn[0].get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([
			wall.identity(),
			wall2.identity(),
		]);

		// A separate process gets its own, independent IfcRelAssignsToProcess.
		assignProcess(file, { relatingProcess: task2, relatedObject: wall });
		expect((task2.get("OperatesOn") as EntityInstance[]).length).toBe(1);
	});

	test("not assigning twice returns undefined, UNLIKE assignProduct's own dedup-hit behavior (disclosed asymmetry)", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const task = file.createEntity("IfcTask");

		const first = assignProcess(file, { relatingProcess: task, relatedObject: wall });
		expect(first).toBeDefined();
		const second = assignProcess(file, { relatingProcess: task, relatedObject: wall });
		expect(second).toBeUndefined();

		const operatesOn = task.get("OperatesOn") as EntityInstance[];
		expect((operatesOn[0].get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([
			wall.identity(),
		]);
	});

	test("the created relationship is a real IfcRelAssignsToProcess", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const task = file.createEntity("IfcTask");
		const rel = assignProcess(file, { relatingProcess: task, relatedObject: wall });
		expect(rel?.isA("IfcRelAssignsToProcess")).toBe(true);
		expect((rel?.get("RelatingProcess") as EntityInstance).equals(task)).toBe(true);
	});
});
