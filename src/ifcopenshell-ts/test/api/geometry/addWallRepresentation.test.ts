// This file was generated with the assistance of an AI coding tool.
//
// `test/api/geometry/test_add_wall_representation.py` does not exist anywhere in
// `src/ifcopenshell-python` (confirmed by a repo-wide search) -- `add_wall_representation
// .py` has no dedicated Python test file to port from, matching `add_axis_representation
// .py`'s own identical precedent (see `./addAxisRepresentation.test.ts`'s own header
// comment). Every test below is therefore original coverage, written directly against
// `add_wall_representation.py`'s real source / `../../../src/api/geometry/
// addWallRepresentation.ts`'s own port.
//
// Run against `AVAILABLE_SCHEMAS`: the IFC2X3-vs-IFC4+ curve-class branch (`IfcPolyline`
// vs. `IfcIndexedPolyCurve`) is genuinely schema-dependent (CI's own `SCHEMA_VERSIONS=4`
// core build only ever registers IFC4, per `../../bootstrap.ts`'s own header comment,
// so this file's own IFC2X3-specific assertions are naturally gated by only running
// inside the `if (schema === "IFC2X3")` branch of an otherwise schema-agnostic test body
// -- never a standalone, ungated `describe("... (IFC2X3)")` block).

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { addWallRepresentation } from "../../../src/api/geometry/addWallRepresentation";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { Clipping } from "../../../src/util/data";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Python: `model = add_context(...)` then `body = add_context(..., parent=model)` --
 * matching `../geometry/addBoolean.test.ts`'s own identical fixture. */
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

describe.each(AVAILABLE_SCHEMAS)("api.geometry.addWallRepresentation (%s)", (schema) => {
	test("builds a default (SweptSolid) rectangular wall profile", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const rep = addWallRepresentation(file, { context: body, length: 1.0, height: 3.0, thickness: 0.2 });

		expect(rep.isA("IfcShapeRepresentation")).toBe(true);
		expect((rep.get("ContextOfItems") as EntityInstance).equals(body)).toBe(true);
		expect(rep.get("RepresentationIdentifier")).toBe(body.get("ContextIdentifier"));
		expect(rep.get("RepresentationType")).toBe("SweptSolid");

		const items = rep.get("Items") as EntityInstance[];
		expect(items.length).toBe(1);
		const extrusion = items[0];
		expect(extrusion.isA("IfcExtrudedAreaSolid")).toBe(true);
		expect(extrusion.get("Depth")).toBe(3.0);
		expect((extrusion.get("ExtrudedDirection") as EntityInstance).get("DirectionRatios")).toEqual([0.0, 0.0, 1.0]);

		const profile = extrusion.get("SweptArea") as EntityInstance;
		expect(profile.isA("IfcArbitraryClosedProfileDef")).toBe(true);
		expect(profile.get("ProfileType")).toBe("AREA");

		const curve = profile.get("OuterCurve") as EntityInstance;
		if (schema === "IFC2X3") {
			expect(curve.isA("IfcPolyline")).toBe(true);
			const points = curve.get("Points") as EntityInstance[];
			expect(points.map((p) => p.get("Coordinates"))).toEqual([
				[0.0, 0.0],
				[0.0, 0.2],
				[1.0, 0.2],
				[1.0, 0.0],
				[0.0, 0.0],
			]);
		} else {
			expect(curve.isA("IfcIndexedPolyCurve")).toBe(true);
			const pointList = curve.get("Points") as EntityInstance;
			expect(pointList.isA("IfcCartesianPointList2D")).toBe(true);
			expect(pointList.get("CoordList")).toEqual([
				[0.0, 0.0],
				[0.0, 0.2],
				[1.0, 0.2],
				[1.0, 0.0],
				[0.0, 0.0],
			]);
			// Real Python explicitly passes `Segments=None, SelfIntersect=False` here --
			// see `addWallRepresentation.ts`'s own header comment for the disclosed
			// divergence from `add_slab_representation.py`'s own sibling call.
			expect(curve.get("Segments")).toBeNull();
			expect(curve.get("SelfIntersect")).toBe(false);
		}

		file.dispose();
	});

	test("NEGATIVE direction_sense negates the thickness", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const rep = addWallRepresentation(file, {
			context: body,
			length: 1.0,
			thickness: 0.2,
			directionSense: "NEGATIVE",
		});

		const extrusion = (rep.get("Items") as EntityInstance[])[0];
		const curve = (extrusion.get("SweptArea") as EntityInstance).get("OuterCurve") as EntityInstance;
		const rawPoints =
			schema === "IFC2X3"
				? (curve.get("Points") as EntityInstance[]).map((p) => p.get("Coordinates") as number[])
				: ((curve.get("Points") as EntityInstance).get("CoordList") as number[][]);
		expect(rawPoints[1]).toEqual([0.0, -0.2]);
		expect(rawPoints[2]).toEqual([1.0, -0.2]);

		file.dispose();
	});

	test("x_angle slopes the extrusion direction and scales depth/thickness", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const xAngle = Math.PI / 6;

		const rep = addWallRepresentation(file, {
			context: body,
			length: 1.0,
			height: 3.0,
			thickness: 0.2,
			xAngle,
		});

		const extrusion = (rep.get("Items") as EntityInstance[])[0];
		const direction = (extrusion.get("ExtrudedDirection") as EntityInstance).get("DirectionRatios") as number[];
		expect(direction[0]).toBeCloseTo(0.0);
		expect(direction[1]).toBeCloseTo(Math.sin(xAngle));
		expect(direction[2]).toBeCloseTo(Math.cos(xAngle));
		expect(extrusion.get("Depth") as number).toBeCloseTo(3.0 * Math.abs(1 / Math.cos(xAngle)));

		// Thickness (the profile's own Y-extent) is scaled by `1 / cos(x_angle)` too --
		// see this file's own header comment on the "unconditional" real Python quirk.
		const curve = (extrusion.get("SweptArea") as EntityInstance).get("OuterCurve") as EntityInstance;
		const rawPoints =
			schema === "IFC2X3"
				? (curve.get("Points") as EntityInstance[]).map((p) => p.get("Coordinates") as number[])
				: ((curve.get("Points") as EntityInstance).get("CoordList") as number[][]);
		expect(rawPoints[1][1]).toBeCloseTo(0.2 * (1 / Math.cos(xAngle)));

		file.dispose();
	});

	test("offset shifts the extrusion's own Position", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const rep = addWallRepresentation(file, { context: body, offset: 0.5 });
		const extrusion = (rep.get("Items") as EntityInstance[])[0];
		const position = extrusion.get("Position") as EntityInstance;
		expect((position.get("Location") as EntityInstance).get("Coordinates")).toEqual([0.0, 0.5, 0.0]);

		file.dispose();
	});

	test("clippings apply an IfcBooleanClippingResult chain, switching RepresentationType to Clipping", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const rep = addWallRepresentation(file, {
			context: body,
			clippings: [new Clipping({ location: [0.5, 0.0, 0.0], normal: [1.0, 0.0, 0.0] })],
		});

		expect(rep.get("RepresentationType")).toBe("Clipping");
		const result = (rep.get("Items") as EntityInstance[])[0];
		expect(result.isA("IfcBooleanClippingResult")).toBe(true);
		expect(result.get("Operator")).toBe("DIFFERENCE");
		expect((result.get("FirstOperand") as EntityInstance).isA("IfcExtrudedAreaSolid")).toBe(true);

		file.dispose();
	});

	test("clippings never alias the caller's own array (unlike booleans -- see header comment)", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const clippings = [new Clipping({ location: [0.5, 0.0, 0.0], normal: [1.0, 0.0, 0.0] })];
		addWallRepresentation(file, { context: body, clippings });
		expect(clippings.length).toBe(1);

		file.dispose();
	});

	test("booleans ARE genuinely drained (mutated in place) by this function -- disclosed aliasing quirk", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const raw = addWallRepresentation(file, { context: body, length: 2.0, thickness: 0.3 });
		const rawExtrusion = (raw.get("Items") as EntityInstance[])[0];
		const secondSolid = file.createEntity(
			"IfcExtrudedAreaSolid",
			rawExtrusion.get("SweptArea") as EntityInstance,
			null,
			file.createEntity("IfcDirection", [0.0, 0.0, 1.0]),
			1.0,
		);
		// `FirstOperand` is a placeholder here -- `apply_booleans` always overwrites it
		// unconditionally, so its initial value is functionally irrelevant.
		const boolean = file.createEntity("IfcBooleanResult", "DIFFERENCE", secondSolid, secondSolid);
		const booleans = [boolean];

		const rep = addWallRepresentation(file, { context: body, booleans });
		expect(booleans.length).toBe(0);
		expect(rep.get("RepresentationType")).toBe("Clipping");
		const result = (rep.get("Items") as EntityInstance[])[0];
		expect(result.equals(boolean)).toBe(true);
		expect((result.get("FirstOperand") as EntityInstance).isA("IfcExtrudedAreaSolid")).toBe(true);

		file.dispose();
	});

	test("both booleans and clippings: booleans applied first (innermost), clippings outermost", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const raw = addWallRepresentation(file, { context: body, length: 2.0, thickness: 0.3 });
		const rawExtrusion = (raw.get("Items") as EntityInstance[])[0];
		const secondSolid = file.createEntity(
			"IfcExtrudedAreaSolid",
			rawExtrusion.get("SweptArea") as EntityInstance,
			null,
			file.createEntity("IfcDirection", [0.0, 0.0, 1.0]),
			1.0,
		);
		// `FirstOperand` is a placeholder here -- see the previous test's identical comment.
		const boolean = file.createEntity("IfcBooleanResult", "DIFFERENCE", secondSolid, secondSolid);

		const rep = addWallRepresentation(file, {
			context: body,
			booleans: [boolean],
			clippings: [new Clipping({ location: [0.0, 0.0, 0.0], normal: [0.0, 0.0, 1.0] })],
		});

		const outer = (rep.get("Items") as EntityInstance[])[0];
		expect(outer.isA("IfcBooleanClippingResult")).toBe(true);
		const inner = outer.get("FirstOperand") as EntityInstance;
		expect(inner.equals(boolean)).toBe(true);

		file.dispose();
	});
});
