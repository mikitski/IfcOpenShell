// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `unassign_process.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python -- only `unassign_product` has a real
// test), so this coverage is written directly from the real source/docstring, adapted
// from `./unassignProduct.test.ts`'s own shape (the two functions are structurally
// near-identical -- see `../../../src/api/sequence/unassignProcess.ts`'s own header
// comment) plus dedicated shrink-vs-delete coverage matching `./assignProcess.test.ts`'s
// own multi-assignment setup.

import { describe, expect, test } from "vitest";
import { assignProcess } from "../../../src/api/sequence/assignProcess";
import { unassignProcess } from "../../../src/api/sequence/unassignProcess";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.sequence.unassignProcess (%s)", (schema) => {
	test("unassigning the only related object deletes the relationship entirely", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const task = file.createEntity("IfcTask");
		assignProcess(file, { relatingProcess: task, relatedObject: wall });

		const result = unassignProcess(file, { relatingProcess: task, relatedObject: wall });
		expect(result).toBeUndefined();
		expect(file.byType("IfcRelAssignsToProcess").length).toBe(0);
	});

	test("unassigning one of several related objects shrinks the relationship instead", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		const task = file.createEntity("IfcTask");
		assignProcess(file, { relatingProcess: task, relatedObject: wall });
		assignProcess(file, { relatingProcess: task, relatedObject: wall2 });

		const result = unassignProcess(file, { relatingProcess: task, relatedObject: wall });
		expect(result?.isA("IfcRelAssignsToProcess")).toBe(true);
		expect(file.byType("IfcRelAssignsToProcess").length).toBe(1);
		expect((result?.get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([wall2.identity()]);
	});

	test("unassigning something that was never assigned is a no-op", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const task = file.createEntity("IfcTask");
		expect(unassignProcess(file, { relatingProcess: task, relatedObject: wall })).toBeUndefined();
	});
});
