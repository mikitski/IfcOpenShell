// This file was generated with the assistance of an AI coding tool.
//
// `test/api/geometry/test_create_2pt_wall.py` does not exist anywhere in
// `src/ifcopenshell-python` (confirmed by a repo-wide search) -- `create_2pt_wall.py`
// has no dedicated Python test file to port from, matching `add_wall_representation
// .py`'s/`add_axis_representation.py`'s own identical precedent (see
// `./addWallRepresentation.test.ts`'s own header comment). Every test below is
// therefore original coverage, written directly against `create_2pt_wall.py`'s real
// source / `../../../src/api/geometry/create2ptWall.ts`'s own port.
//
// Numeric assertions use `expectClose` (matching `./editObjectPlacement.test.ts`'s own
// identical helper) since every placement matrix here has round-tripped through
// `edit_object_placement`'s own `a2p`/matrix-inversion path at least once -- exact to
// within ordinary double-precision rounding, not bit-exact by construction.
//
// Run against `AVAILABLE_SCHEMAS` -- nothing here is schema-specific on its own (the
// underlying `addWallRepresentation`'s own real IFC2X3-vs-IFC4+ curve-class branch is
// already covered by that file's own dedicated tests), matching this project's
// established precedent for schema-agnostic fixtures.

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { addWallRepresentation } from "../../../src/api/geometry/addWallRepresentation";
import { create2ptWall } from "../../../src/api/geometry/create2ptWall";
import { createEntity } from "../../../src/api/root/createEntity";
import { assignUnit } from "../../../src/api/unit/assignUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { getLocalPlacement } from "../../../src/util/placement";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Python: `model = add_context(...)` then `body = add_context(..., parent=model)` --
 * matching `./addWallRepresentation.test.ts`'s own identical fixture. */
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

/** See `./editObjectPlacement.test.ts`'s identical `expectClose` helper's own doc
 * comment. */
function expectClose(actual: readonly number[], expected: readonly number[], precision = 9): void {
	expect(actual.length).toBe(expected.length);
	for (let i = 0; i < actual.length; i++) {
		expect(actual[i]).toBeCloseTo(expected[i], precision);
	}
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.create2ptWall (%s)", (schema) => {
	test("builds a wall representation and places element at p1 facing p2 (axis-aligned)", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const wall = file.createEntity("IfcWall");

		const rep = create2ptWall(file, {
			element: wall,
			context: body,
			p1: [0.0, 0.0],
			p2: [10.0, 0.0],
			elevation: 2.0,
			height: 3.0,
			thickness: 0.2,
		});

		// Same shape `addWallRepresentation` itself produces, with `length` computed
		// from `p1`/`p2` (the Euclidean distance, `10.0`).
		expect(rep.isA("IfcShapeRepresentation")).toBe(true);
		const extrusion = (rep.get("Items") as EntityInstance[])[0];
		expect(extrusion.isA("IfcExtrudedAreaSolid")).toBe(true);
		expect(extrusion.get("Depth")).toBe(3.0);
		const curve = (extrusion.get("SweptArea") as EntityInstance).get("OuterCurve") as EntityInstance;
		const rawPoints =
			schema === "IFC2X3"
				? (curve.get("Points") as EntityInstance[]).map((p) => p.get("Coordinates") as number[])
				: ((curve.get("Points") as EntityInstance).get("CoordList") as number[][]);
		// Profile runs from local (0,0) to (length, 0) along its own local X -- length
		// == distance(p1, p2) == 10.0.
		expect(rawPoints[2][0]).toBeCloseTo(10.0);

		// `element`'s placement: origin at `p1` (with `elevation` as Z), local X axis
		// pointing from `p1` towards `p2` (here, world +X, i.e. an identity rotation).
		const matrix = getLocalPlacement(wall.get("ObjectPlacement") as EntityInstance);
		expectClose([matrix[12], matrix[13], matrix[14]], [0.0, 0.0, 2.0]);
		expectClose([matrix[0], matrix[1], matrix[2]], [1.0, 0.0, 0.0]);
		expectClose([matrix[8], matrix[9], matrix[10]], [0.0, 0.0, 1.0]);

		file.dispose();
	});

	test("orients the wall along an arbitrary diagonal p1->p2 direction", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const wall = file.createEntity("IfcWall");

		// p2 - p1 = (3, 4), a 3-4-5 triangle: normalized direction (0.6, 0.8), length 5.
		create2ptWall(file, {
			element: wall,
			context: body,
			p1: [1.0, 1.0],
			p2: [4.0, 5.0],
			elevation: 0.0,
			height: 3.0,
			thickness: 0.2,
		});

		const matrix = getLocalPlacement(wall.get("ObjectPlacement") as EntityInstance);
		expectClose([matrix[12], matrix[13], matrix[14]], [1.0, 1.0, 0.0]);
		// X axis: the normalized direction vector itself.
		expectClose([matrix[0], matrix[1], matrix[2]], [0.6, 0.8, 0.0]);
		// Y axis: `(-v[1], v[0], 0)`, matching real Python's own hand-built matrix (see
		// `../../../src/api/geometry/create2ptWall.ts`'s own header comment).
		expectClose([matrix[4], matrix[5], matrix[6]], [-0.8, 0.6, 0.0]);
		expectClose([matrix[8], matrix[9], matrix[10]], [0.0, 0.0, 1.0]);

		file.dispose();
	});

	test("returns the same IfcShapeRepresentation shape addWallRepresentation itself would build", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const wall = file.createEntity("IfcWall");

		const rep = create2ptWall(file, {
			element: wall,
			context: body,
			p1: [0.0, 0.0],
			p2: [1.0, 0.0],
			elevation: 0.0,
			height: 3.0,
			thickness: 0.2,
		});
		const expected = addWallRepresentation(file, { context: body, length: 1.0, height: 3.0, thickness: 0.2 });

		expect(rep.get("RepresentationType")).toBe(expected.get("RepresentationType"));
		expect((rep.get("Items") as EntityInstance[])[0].isA("IfcExtrudedAreaSolid")).toBe(true);

		file.dispose();
	});

	test("isSi: false -- DISCLOSED BUG: `v`'s direction mixes SI-converted p1 with never-converted p2, " +
		"producing the WRONG wall orientation (preserved verbatim from real Python, see create2ptWall.ts's " +
		"own header comment)", () => {
		const file = createTestFile(schema);
		createEntity(file, { ifcClass: "IfcProject" });
		assignUnit(file); // default length unit: millimetres (unit_scale 0.001).
		const model = addContext(file, { contextType: "Model" });
		const body = addContext(file, {
			contextType: "Model",
			contextIdentifier: "Body",
			targetView: "MODEL_VIEW",
			parent: model,
		});
		const wall = file.createEntity("IfcWall");

		// p1/p2 given in millimetres, both offset far from the origin so the bug's
		// effect is visible: a geometrically-correct implementation would orient the
		// wall along world +X ((1,0,0)) since p1->p2 is purely along X in project
		// units. Because `p1` alone gets SI-converted (`(1000,2000)mm -> (1,2)m`)
		// before `v = p2 - p1` is computed, while `p2` is left at `(11000,2000)mm`,
		// the resulting (still-normalized) direction is visibly NOT `(1,0,0)`.
		create2ptWall(file, {
			element: wall,
			context: body,
			p1: [1000.0, 2000.0],
			p2: [11000.0, 2000.0],
			elevation: 500.0,
			height: 3000.0,
			thickness: 200.0,
			isSi: false,
		});

		const matrix = getLocalPlacement(wall.get("ObjectPlacement") as EntityInstance);
		// Translation, read back via `getLocalPlacement`, is in PROJECT units (millimetres)
		// -- `p1`/`elevation` are converted to SI (`(1000,2000,500)mm -> (1,2,0.5)m`) to
		// build the placement matrix, then `editObjectPlacement`'s own default `isSi: true`
		// converts that SI matrix straight back to project units for storage, an exact,
		// lossless round-trip that reproduces the original raw values -- unaffected by the
		// bug (only `v`'s own direction is).
		expectClose([matrix[12], matrix[13], matrix[14]], [1000.0, 2000.0, 500.0]);
		// The X axis is NOT close to the geometrically-correct `(1,0,0)` -- the real,
		// disclosed bug's effect, reproduced verbatim.
		expect(Math.abs(matrix[0] - 1.0)).toBeGreaterThan(1e-6);
		expect(Math.abs(matrix[1])).toBeGreaterThan(1e-6);
		// Still a genuine unit vector (only its DIRECTION is wrong, not its length).
		expectClose([matrix[0] ** 2 + matrix[1] ** 2 + matrix[2] ** 2], [1.0]);

		file.dispose();
	});
});
