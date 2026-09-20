// This file was generated with the assistance of an AI coding tool.
//
// Port of `test_unassign_product.py` (src/ifcopenshell-python) -- real Python runs the
// same body against both IFC4 and IFC2X3 (`TestUnassignProductIFC2X3`, a plain subclass
// with no override). Widened here to run against every schema this port has available
// (`IfcRelAssignsToProduct` exists identically on all 3 -- see `../../../src/api/
// sequence/index.ts`'s own chunk 1 header-comment finding), plus extra shrink-vs-delete
// coverage matching `./unassignProcess.test.ts`'s own shape.

import { describe, expect, test } from "vitest";
import { assignProduct } from "../../../src/api/sequence/assignProduct";
import { unassignProduct } from "../../../src/api/sequence/unassignProduct";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.sequence.unassignProduct (%s)", (schema) => {
	test("unassigning a product", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const task = file.createEntity("IfcTask");
		assignProduct(file, { relatingProduct: wall, relatedObject: task });
		unassignProduct(file, { relatingProduct: wall, relatedObject: task });
		expect(file.byType("IfcRelAssignsToProduct").length).toBe(0);
	});

	test("unassigning one of several related objects shrinks the relationship instead", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const task = file.createEntity("IfcTask");
		const task2 = file.createEntity("IfcTask");
		assignProduct(file, { relatingProduct: wall, relatedObject: task });
		assignProduct(file, { relatingProduct: wall, relatedObject: task2 });

		const result = unassignProduct(file, { relatingProduct: wall, relatedObject: task });
		expect(result?.isA("IfcRelAssignsToProduct")).toBe(true);
		expect(file.byType("IfcRelAssignsToProduct").length).toBe(1);
		expect((result?.get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([task2.identity()]);
	});

	test("unassigning something that was never assigned is a no-op", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const task = file.createEntity("IfcTask");
		expect(unassignProduct(file, { relatingProduct: wall, relatedObject: task })).toBeUndefined();
	});
});
