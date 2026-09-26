// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/drawing/test_assign_product.py` (src/ifcopenshell-python)
// -- `TestAssignProduct`'s 3 cases ported verbatim, run against both IFC4 and IFC2X3
// matching the real `TestAssignProductIFC2X3(test.bootstrap.IFC2X3, TestAssignProduct)`
// mixin (`describe.each(AVAILABLE_SCHEMAS)`, gated so CI's IFC4-only native build still
// passes -- see `../../bootstrap.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { assignProduct } from "../../../src/api/drawing/assignProduct";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function createGridAxis(file: IfcFile, axisTag: string): EntityInstance {
	const axis = file.createEntity("IfcGridAxis");
	axis.set("AxisTag", axisTag);
	return axis;
}

describe.each(AVAILABLE_SCHEMAS)("api.drawing.assignProduct (%s)", (schema) => {
	test("assigning a product", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const label = file.createEntity("IfcAnnotation");
		const label2 = file.createEntity("IfcAnnotation");

		assignProduct(file, { relatingProduct: wall, relatedObject: label });
		let referencedBy = wall.get("ReferencedBy") as EntityInstance[];
		expect((referencedBy[0].get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([
			label.identity(),
		]);

		assignProduct(file, { relatingProduct: wall, relatedObject: label2 });
		referencedBy = wall.get("ReferencedBy") as EntityInstance[];
		expect((referencedBy[0].get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([
			label.identity(),
			label2.identity(),
		]);
	});

	test("not assigning twice", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const label = file.createEntity("IfcAnnotation");

		assignProduct(file, { relatingProduct: wall, relatedObject: label });
		assignProduct(file, { relatingProduct: wall, relatedObject: label });

		const referencedBy = wall.get("ReferencedBy") as EntityInstance[];
		expect(referencedBy.length).toBe(1);
		expect((referencedBy[0].get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([
			label.identity(),
		]);
	});

	test("assigning a grid axis", () => {
		const file = createTestFile(schema);
		const axis = createGridAxis(file, "A");
		const grid = file.createEntity("IfcGrid");
		grid.set("UAxes", [axis]);
		const line = file.createEntity("IfcAnnotation");

		assignProduct(file, { relatingProduct: axis, relatedObject: line });
		let referencedBy = grid.get("ReferencedBy") as EntityInstance[];
		expect((referencedBy[0].get("RelatedObjects") as EntityInstance[]).map((o) => o.identity())).toEqual([
			line.identity(),
		]);
		expect(referencedBy[0].get("Name")).toBe("A");
		expect(file.byType("IfcRelAssignsToProduct").length).toBe(1);

		assignProduct(file, { relatingProduct: axis, relatedObject: line });
		expect(file.byType("IfcRelAssignsToProduct").length).toBe(1);

		// Sanity-check the two references stay consistent.
		referencedBy = grid.get("ReferencedBy") as EntityInstance[];
		expect(referencedBy.length).toBe(1);
	});
});
