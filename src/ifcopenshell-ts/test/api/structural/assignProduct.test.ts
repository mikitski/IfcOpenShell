// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/structural/test_assign_product.py`
// (src/ifcopenshell-python) -- all 3 real test methods ported verbatim, extended from
// real Python's own IFC4/IFC2X3-only coverage (`TestAssignProduct`/
// `TestAssignProductIFC2X3`) to all of `AVAILABLE_SCHEMAS` including IFC4X3.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { assignProduct } from "../../../src/api/structural/assignProduct";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.assignProduct (%s)", (schema) => {
	test("creating a new relationship", () => {
		const file = createTestFile(schema);
		const member = createEntity(file, { ifcClass: "IfcStructuralSurfaceMember" });
		const wall = createEntity(file, { ifcClass: "IfcWall" });

		const rel = assignProduct(file, { relatingProduct: member, relatedObject: wall });

		expect(rel.isA("IfcRelAssignsToProduct")).toBe(true);
		expect((rel.get("RelatingProduct") as EntityInstance).equals(member)).toBe(true);
		expect((rel.get("RelatedObjects") as EntityInstance[]).some((o) => o.equals(wall))).toBe(true);
	});

	test("adding a second object to an existing relationship", () => {
		const file = createTestFile(schema);
		const member = createEntity(file, { ifcClass: "IfcStructuralSurfaceMember" });
		const wall1 = createEntity(file, { ifcClass: "IfcWall" });
		const wall2 = createEntity(file, { ifcClass: "IfcWall" });

		const rel1 = assignProduct(file, { relatingProduct: member, relatedObject: wall1 });
		const rel2 = assignProduct(file, { relatingProduct: member, relatedObject: wall2 });

		expect(rel1.equals(rel2)).toBe(true);
		expect(file.byType("IfcRelAssignsToProduct").length).toBe(1);
		const relatedObjects = rel1.get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.some((o) => o.equals(wall1))).toBe(true);
		expect(relatedObjects.some((o) => o.equals(wall2))).toBe(true);
	});

	test("does not duplicate an existing assignment", () => {
		const file = createTestFile(schema);
		const member = createEntity(file, { ifcClass: "IfcStructuralSurfaceMember" });
		const wall = createEntity(file, { ifcClass: "IfcWall" });

		assignProduct(file, { relatingProduct: member, relatedObject: wall });
		assignProduct(file, { relatingProduct: member, relatedObject: wall });

		expect(file.byType("IfcRelAssignsToProduct").length).toBe(1);
		const rels = file.byType("IfcRelAssignsToProduct");
		expect((rels[0].get("RelatedObjects") as unknown[]).length).toBe(1);
	});
});
