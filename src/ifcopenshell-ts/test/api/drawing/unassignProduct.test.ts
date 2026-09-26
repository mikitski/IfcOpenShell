// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/drawing/test_unassign_product.py` (src/ifcopenshell-
// python) -- `TestUnassignProduct`'s 2 cases ported verbatim, run against both IFC4 and
// IFC2X3 matching the real `TestUnassignProductIFC2X3` mixin (`describe.each
// (AVAILABLE_SCHEMAS)`).

import { describe, expect, test } from "vitest";
import { assignProduct } from "../../../src/api/drawing/assignProduct";
import { unassignProduct } from "../../../src/api/drawing/unassignProduct";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function createGridAxis(file: IfcFile, axisTag: string): EntityInstance {
	const axis = file.createEntity("IfcGridAxis");
	axis.set("AxisTag", axisTag);
	return axis;
}

describe.each(AVAILABLE_SCHEMAS)("api.drawing.unassignProduct (%s)", (schema) => {
	test("unassigning a product", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const label = file.createEntity("IfcAnnotation");

		assignProduct(file, { relatingProduct: wall, relatedObject: label });
		unassignProduct(file, { relatingProduct: wall, relatedObject: label });

		expect(file.byType("IfcRelAssignsToProduct").length).toBe(0);
	});

	test("unassigning a grid axis", () => {
		const file = createTestFile(schema);
		const axis = createGridAxis(file, "A");
		const grid = file.createEntity("IfcGrid");
		grid.set("UAxes", [axis]);
		const line = file.createEntity("IfcAnnotation");

		assignProduct(file, { relatingProduct: axis, relatedObject: line });
		unassignProduct(file, { relatingProduct: axis, relatedObject: line });

		expect(file.byType("IfcRelAssignsToProduct").length).toBe(0);
	});
});
