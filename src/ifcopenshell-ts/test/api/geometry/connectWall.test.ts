// This file was generated with the assistance of an AI coding tool.
//
// TS tests for `ifcopenshell/api/geometry/connect_wall.py` (src/ifcopenshell-python) --
// **no real Python test file exists for this function** (verified: grepped
// `test/api/geometry/` for `connect_wall` and found no match). These tests are
// original, written directly against the real Python source's own behavior, with the
// expected outputs HAND-DERIVED (not just asserted against whatever this port happens
// to produce) -- see `./connectWall.ts`'s own header comment for the full matrix-math
// verification this test's own fixture numbers were built from.
//
// --- Fixture geometry, hand-derived ---
//
// `wall1`: identity placement (world == local). Reference axis from `(0,0)` to
// `(10,0)`.
// `wall2`: placed at world `(10,0,0)`, rotated 90 degrees about Z (so its own local
// +X axis points along world +Y -- an "L-shaped corner" layout). Reference axis from
// `(0,0)` to `(5,0)` in `wall2`'s own local frame.
//
// Transforming `wall2`'s axis into `wall1`'s local frame (== world frame, since
// `wall1` is identity): local `(0,0)` -> rotate 90 degrees (`(x,y) -> (-y,x)`) ->
// `(0,0)`, then translate by `(10,0,0)` -> world `(10,0)`. Local `(5,0)` -> rotate 90
// -> `(0,5)`, then translate -> world `(10,5)`. So the transformed `axis2` is
// `[(10,0), (10,5)]`.
//
// `midx = (0 + 10) / 2 = 5`. `y = axis1[0][1] = 0`. Intersecting the transformed
// `axis2` (a vertical line at `x=10`, from `y=0` to `y=5`) against the horizontal line
// `y=0` gives `x=10` (`intersectXAxis2d`'s own `t = (y-y1)/(y2-y1) = 0`, so `x = x1 = 10`
// exactly). Since `10 > midx(5)`, `wall1End = "ATEND"`. `starty = 0`, `endy = 5`;
// `abs(y-starty) = 0 < abs(y-endy) = 5`, so (with `isAtpath` left `false`)
// `wall2End = "ATSTART"`.

import { mat4 } from "gl-matrix";
import { describe, expect, test } from "vitest";
import { assignRepresentation } from "../../../src/api/geometry/assignRepresentation";
import { connectWall } from "../../../src/api/geometry/connectWall";
import { editObjectPlacement } from "../../../src/api/geometry/editObjectPlacement";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Builds a wall with a `"Plan"/"Axis"/"GRAPH_VIEW"` reference-axis representation
 * from `(0,0)` to `(length,0)` in its own local frame, and (optionally) a placement
 * matrix. */
function wallWithAxis(file: IfcFile, length: number, placement?: mat4): EntityInstance {
	const wall = file.createEntity("IfcWall");
	if (placement) {
		editObjectPlacement(file, { product: wall, matrix: placement });
	} else {
		editObjectPlacement(file, { product: wall });
	}

	const model = file.createEntity(
		"IfcGeometricRepresentationContext",
		null,
		"Plan",
		2,
		1.0e-5,
		file.createEntity("IfcAxis2Placement2D", file.createEntity("IfcCartesianPoint", [0, 0])),
	);
	const axisContext = file.createEntity(
		"IfcGeometricRepresentationSubContext",
		"Axis",
		"Plan",
		null,
		null,
		null,
		null,
		model,
		null,
		"GRAPH_VIEW",
	);
	const start = file.createEntity("IfcCartesianPoint", [0, 0]);
	const end = file.createEntity("IfcCartesianPoint", [length, 0]);
	const polyline = file.createEntity("IfcPolyline", [start, end]);
	const rep = file.createEntity("IfcShapeRepresentation", axisContext, "Axis", "Curve2D", [polyline]);
	assignRepresentation(file, { product: wall, representation: rep });
	return wall;
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.connectWall (%s)", (schema) => {
	test("connects an L-shaped corner via the computed endpoint types", () => {
		const file = createTestFile(schema);
		const wall1 = wallWithAxis(file, 10);
		const wall2Matrix = mat4.create();
		mat4.fromZRotation(wall2Matrix, Math.PI / 2);
		wall2Matrix[12] = 10;
		wall2Matrix[13] = 0;
		wall2Matrix[14] = 0;
		const wall2 = wallWithAxis(file, 5, wall2Matrix);

		const rel = connectWall(file, { wall1, wall2 });

		expect(rel).toBeDefined();
		const definiteRel = rel as EntityInstance;
		expect(definiteRel.isA("IfcRelConnectsPathElements")).toBe(true);
		expect((definiteRel.get("RelatingElement") as EntityInstance).equals(wall1)).toBe(true);
		expect((definiteRel.get("RelatedElement") as EntityInstance).equals(wall2)).toBe(true);
		expect(definiteRel.get("RelatingConnectionType")).toBe("ATEND");
		expect(definiteRel.get("RelatedConnectionType")).toBe("ATSTART");
	});

	test("isAtpath forces the related wall's connection type to ATPATH", () => {
		const file = createTestFile(schema);
		const wall1 = wallWithAxis(file, 10);
		const wall2Matrix = mat4.create();
		mat4.fromZRotation(wall2Matrix, Math.PI / 2);
		wall2Matrix[12] = 10;
		wall2Matrix[13] = 0;
		wall2Matrix[14] = 0;
		const wall2 = wallWithAxis(file, 5, wall2Matrix);

		const rel = connectWall(file, { wall1, wall2, isAtpath: true }) as EntityInstance;

		expect(rel.get("RelatingConnectionType")).toBe("ATEND");
		expect(rel.get("RelatedConnectionType")).toBe("ATPATH");
	});

	test("returns undefined when the two walls' axes never intersect", () => {
		const file = createTestFile(schema);
		// Two parallel walls along +X, offset in Y -- `wall2`'s transformed axis is a
		// horizontal line at a different Y than `wall1`'s own axis, so `intersectXAxis2d`
		// (a horizontal-vs-horizontal check) returns `undefined`.
		const wall1 = wallWithAxis(file, 10);
		const wall2Matrix = mat4.create();
		wall2Matrix[13] = 5;
		const wall2 = wallWithAxis(file, 10, wall2Matrix);

		const rel = connectWall(file, { wall1, wall2 });

		expect(rel).toBeUndefined();
		expect(file.byType("IfcRelConnectsPathElements")).toHaveLength(0);
	});
});
