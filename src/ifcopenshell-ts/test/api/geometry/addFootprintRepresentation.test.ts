// This file was generated with the assistance of an AI coding tool.
//
// TS tests for `ifcopenshell/api/geometry/add_footprint_representation.py`
// (src/ifcopenshell-python) -- **no real Python test file exists for this function**
// (verified: grepped `test/api/geometry/` for `add_footprint_representation` and found
// no match). These tests are original, written directly against the real Python
// source's own (short, 34-line) behavior rather than ported from an existing suite --
// see `./connectWall.test.ts`'s own header comment for the identical situation there.

import { describe, expect, test } from "vitest";
import { addFootprintRepresentation } from "../../../src/api/geometry/addFootprintRepresentation";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.geometry.addFootprintRepresentation (%s)", (schema) => {
	test("wraps curves in a GeometricCurveSet under the given context", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationSubContext");
		context.set("ContextIdentifier", "FootPrint");
		const p1 = file.createEntity("IfcCartesianPoint", [0, 0]);
		const p2 = file.createEntity("IfcCartesianPoint", [1, 0]);
		const curve = file.createEntity("IfcPolyline", [p1, p2]);

		const rep = addFootprintRepresentation(file, { context, curves: [curve] });

		expect(rep.isA("IfcShapeRepresentation")).toBe(true);
		expect((rep.get("ContextOfItems") as EntityInstance).equals(context)).toBe(true);
		expect(rep.get("RepresentationIdentifier")).toBe("FootPrint");
		expect(rep.get("RepresentationType")).toBe("GeometricCurveSet");
		const items = rep.get("Items") as EntityInstance[];
		expect(items).toHaveLength(1);
		expect((items[0] as EntityInstance).isA("IfcGeometricCurveSet")).toBe(true);
		const elements = (items[0] as EntityInstance).get("Elements") as EntityInstance[];
		expect(elements.map((e) => e.id())).toEqual([curve.id()]);
	});

	test("reuses context.ContextIdentifier verbatim, whatever it is", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		context.set("ContextIdentifier", null);
		const point = file.createEntity("IfcCartesianPoint", [0, 0]);

		const rep = addFootprintRepresentation(file, { context, curves: [point] });

		expect(rep.get("RepresentationIdentifier")).toBeNull();
	});

	test("does not assign the new representation to any product", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationSubContext");
		const point = file.createEntity("IfcCartesianPoint", [0, 0]);

		addFootprintRepresentation(file, { context, curves: [point] });

		expect(file.byType("IfcProductRepresentation")).toHaveLength(0);
	});
});
