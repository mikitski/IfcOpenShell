// This file was generated with the assistance of an AI coding tool.
//
// `test/api/geometry/test_add_slab_representation.py` does not exist anywhere in
// `src/ifcopenshell-python` (confirmed by a repo-wide search) -- `add_slab_representation
// .py` has no dedicated Python test file to port from, matching
// `./addWallRepresentation.test.ts`'s own identical precedent. Every test below is
// therefore original coverage, written directly against `add_slab_representation.py`'s
// real source / `../../../src/api/geometry/addSlabRepresentation.ts`'s own port.
//
// Run against `AVAILABLE_SCHEMAS` -- same rationale as `./addWallRepresentation.test.ts`'s
// own header comment (IFC2X3-specific assertions live inside an `if (schema ===
// "IFC2X3")` branch of a schema-agnostic test body, never a standalone ungated
// `describe("... (IFC2X3)")` block).

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { addSlabRepresentation } from "../../../src/api/geometry/addSlabRepresentation";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { Clipping } from "../../../src/util/data";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Matches `../geometry/addWallRepresentation.test.ts`'s own identical fixture. */
function bodyContext(file: IfcFile): EntityInstance {
	createEntity(file, { ifcClass: "IfcProject" });
	const model = addContext(file, { contextType: "Model" });
	return addContext(file, {
		contextType: "Model",
		contextIdentifier: "Body",
		targetView: "MODEL_VIEW",
		parent: model,
	});
}

function rawPoints(schema: string, curve: EntityInstance): number[][] {
	return schema === "IFC2X3"
		? (curve.get("Points") as EntityInstance[]).map((p) => p.get("Coordinates") as number[])
		: ((curve.get("Points") as EntityInstance).get("CoordList") as number[][]);
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.addSlabRepresentation (%s)", (schema) => {
	test("builds a default unit-square profile (SweptSolid, no offset)", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const rep = addSlabRepresentation(file, { context: body, depth: 0.2 });

		expect(rep.isA("IfcShapeRepresentation")).toBe(true);
		expect((rep.get("ContextOfItems") as EntityInstance).equals(body)).toBe(true);
		expect(rep.get("RepresentationIdentifier")).toBe(body.get("ContextIdentifier"));
		expect(rep.get("RepresentationType")).toBe("SweptSolid");

		const items = rep.get("Items") as EntityInstance[];
		expect(items.length).toBe(1);
		const extrusion = items[0];
		expect(extrusion.isA("IfcExtrudedAreaSolid")).toBe(true);
		expect(extrusion.get("Depth")).toBeCloseTo(0.2);
		expect((extrusion.get("ExtrudedDirection") as EntityInstance).get("DirectionRatios")).toEqual([0.0, 0.0, 1.0]);

		const profile = extrusion.get("SweptArea") as EntityInstance;
		expect(profile.isA("IfcArbitraryClosedProfileDef")).toBe(true);
		expect(profile.get("ProfileType")).toBe("AREA");

		const curve = profile.get("OuterCurve") as EntityInstance;
		const points = rawPoints(schema, curve);
		expect(points).toEqual([
			[0.0, 0.0],
			[1.0, 0.0],
			[1.0, 1.0],
			[0.0, 1.0],
			[0.0, 0.0],
		]);
		if (schema === "IFC2X3") {
			expect(curve.isA("IfcPolyline")).toBe(true);
		} else {
			expect(curve.isA("IfcIndexedPolyCurve")).toBe(true);
			// Only `Points` is passed -- `Segments`/`SelfIntersect` default to `null`,
			// UNLIKE `addWallRepresentation.ts`'s own sibling call (which explicitly passes
			// `false` for `SelfIntersect`). See this file's own header comment.
			expect(curve.get("Segments")).toBeNull();
			expect(curve.get("SelfIntersect")).toBeNull();
		}

		// Default position: offset is 0 and this isn't IFC2X3, so `Position` stays `null`
		// (except on IFC2X3, where it's required -- see next test).
		if (schema === "IFC2X3") {
			expect(extrusion.get("Position")).not.toBeNull();
		} else {
			expect(extrusion.get("Position")).toBeNull();
		}

		file.dispose();
	});

	test("offset shifts the extrusion's own Position, even on non-IFC2X3 schemas", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const rep = addSlabRepresentation(file, { context: body, offset: 0.5 });
		const extrusion = (rep.get("Items") as EntityInstance[])[0];
		const position = extrusion.get("Position") as EntityInstance;
		expect(position).not.toBeNull();
		expect((position.get("Location") as EntityInstance).get("Coordinates")).toEqual([0.0, 0.0, 0.5]);

		file.dispose();
	});

	test("NEGATIVE direction_sense negates the extrusion direction but not the offset direction", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const rep = addSlabRepresentation(file, { context: body, offset: 0.5, directionSense: "NEGATIVE" });
		const extrusion = (rep.get("Items") as EntityInstance[])[0];
		// `-0` (not `0`) for the first two ratios is expected here -- negating `0.0` in
		// both JS and Python produces a signed zero; `toBeCloseTo` (rather than `toEqual`,
		// which distinguishes `-0`/`0`) matches real Python's own `assertAlmostEqual`-style
		// tolerance instead of asserting the sign bit.
		const ratios = (extrusion.get("ExtrudedDirection") as EntityInstance).get("DirectionRatios") as number[];
		expect(ratios[0]).toBeCloseTo(0.0);
		expect(ratios[1]).toBeCloseTo(0.0);
		expect(ratios[2]).toBeCloseTo(-1.0);
		const position = extrusion.get("Position") as EntityInstance;
		// Offset direction doesn't change if direction_sense is negative (real Python's
		// own comment, verbatim) -- still +0.5, not -0.5.
		expect((position.get("Location") as EntityInstance).get("Coordinates")).toEqual([0.0, 0.0, 0.5]);

		file.dispose();
	});

	test("a polyline builds an arbitrary profile instead of the default unit square", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const rep = addSlabRepresentation(file, {
			context: body,
			polyline: [
				[0.0, 0.0],
				[2.0, 0.0],
				[2.0, 3.0],
				[0.0, 3.0],
				[0.0, 0.0],
			],
		});

		const extrusion = (rep.get("Items") as EntityInstance[])[0];
		const curve = (extrusion.get("SweptArea") as EntityInstance).get("OuterCurve") as EntityInstance;
		expect(rawPoints(schema, curve)).toEqual([
			[0.0, 0.0],
			[2.0, 0.0],
			[2.0, 3.0],
			[0.0, 3.0],
			[0.0, 0.0],
		]);

		file.dispose();
	});

	test("a polyline's Y ordinates (but not X) get the x_angle slope correction", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const xAngle = Math.PI / 6;

		const rep = addSlabRepresentation(file, {
			context: body,
			xAngle,
			polyline: [
				[1.0, 2.0],
				[3.0, 4.0],
			],
		});

		const extrusion = (rep.get("Items") as EntityInstance[])[0];
		const curve = (extrusion.get("SweptArea") as EntityInstance).get("OuterCurve") as EntityInstance;
		const points = rawPoints(schema, curve);
		const scale = Math.abs(1 / Math.cos(xAngle));
		expect(points[0][0]).toBeCloseTo(1.0);
		expect(points[0][1]).toBeCloseTo(2.0 * scale);
		expect(points[1][0]).toBeCloseTo(3.0);
		expect(points[1][1]).toBeCloseTo(4.0 * scale);

		file.dispose();
	});

	test("clippings apply an IfcBooleanClippingResult, switching RepresentationType to Clipping", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const clippings = [new Clipping({ location: [0.0, 0.0, 0.1], normal: [0.0, 0.0, 1.0] })];
		const rep = addSlabRepresentation(file, { context: body, depth: 0.2, clippings });

		expect(rep.get("RepresentationType")).toBe("Clipping");
		const result = (rep.get("Items") as EntityInstance[])[0];
		expect(result.isA("IfcBooleanClippingResult")).toBe(true);
		expect(result.get("Operator")).toBe("DIFFERENCE");
		expect((result.get("FirstOperand") as EntityInstance).isA("IfcExtrudedAreaSolid")).toBe(true);

		file.dispose();
	});

	test("clippings ARE genuinely drained (mutated in place) -- disclosed aliasing quirk, unlike addWallRepresentation", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const clippings = [new Clipping({ location: [0.0, 0.0, 0.1], normal: [0.0, 0.0, 1.0] })];
		addSlabRepresentation(file, { context: body, clippings });
		expect(clippings.length).toBe(0);

		file.dispose();
	});

	test("an existing IfcBooleanResult clipping is copied and chained via FirstOperand", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const raw = addSlabRepresentation(file, { context: body, depth: 0.2 });
		const rawExtrusion = (raw.get("Items") as EntityInstance[])[0];
		const secondSolid = file.createEntity(
			"IfcExtrudedAreaSolid",
			rawExtrusion.get("SweptArea") as EntityInstance,
			null,
			file.createEntity("IfcDirection", [0.0, 0.0, 1.0]),
			1.0,
		);
		const existingClipping = file.createEntity("IfcBooleanClippingResult", "DIFFERENCE", rawExtrusion, secondSolid);

		const rep = addSlabRepresentation(file, { context: body, depth: 0.2, clippings: [existingClipping] });
		const result = (rep.get("Items") as EntityInstance[])[0];
		// A COPY, not the same instance (`util.element.copy`, a shallow copy).
		expect(result.equals(existingClipping)).toBe(false);
		expect(result.isA("IfcBooleanClippingResult")).toBe(true);
		expect((result.get("SecondOperand") as EntityInstance).equals(secondSolid)).toBe(true);
		expect((result.get("FirstOperand") as EntityInstance).isA("IfcExtrudedAreaSolid")).toBe(true);
		expect((result.get("FirstOperand") as EntityInstance).equals(rawExtrusion)).toBe(false);

		file.dispose();
	});
});
