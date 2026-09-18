// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/sequence/test_assign_product.py`'s `TestAssignProduct`/
// `TestAssignProductIFC2X3` (src/ifcopenshell-python) -- both real cases ported verbatim
// below, plus one additional test for the created relationship's own shape (no real
// Python assertion covers that).

import { describe, expect, test } from "vitest";
import { assignProduct } from "../../../src/api/sequence/assignProduct";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.sequence.assignProduct (%s)", (schema) => {
	test("assigning a product", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const task = file.createEntity("IfcTask");
		const task2 = file.createEntity("IfcTask");

		assignProduct(file, { relatingProduct: wall, relatedObject: task });
		let referencedBy = wall.get("ReferencedBy") as EntityInstance[];
		expect((referencedBy[0].get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([
			task.identity(),
		]);

		assignProduct(file, { relatingProduct: wall, relatedObject: task2 });
		referencedBy = wall.get("ReferencedBy") as EntityInstance[];
		expect((referencedBy[0].get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([
			task.identity(),
			task2.identity(),
		]);
	});

	test("not assigning twice", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const task = file.createEntity("IfcTask");

		const first = assignProduct(file, { relatingProduct: wall, relatedObject: task });
		const second = assignProduct(file, { relatingProduct: wall, relatedObject: task });
		expect(second.equals(first)).toBe(true);

		const referencedBy = wall.get("ReferencedBy") as EntityInstance[];
		expect((referencedBy[0].get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([
			task.identity(),
		]);
	});

	test("the created relationship is a real IfcRelAssignsToProduct", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const task = file.createEntity("IfcTask");
		const rel = assignProduct(file, { relatingProduct: wall, relatedObject: task });
		expect(rel.isA("IfcRelAssignsToProduct")).toBe(true);
		expect((rel.get("RelatingProduct") as EntityInstance).equals(wall)).toBe(true);
	});
});
