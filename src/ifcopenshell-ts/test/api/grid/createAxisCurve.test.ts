// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `create_axis_curve.py` (confirmed: `test/api/grid/`
// only has `test_create_grid_axis.py`/`test_remove_grid_axis.py` -- no
// `test_create_axis_curve.py` anywhere in the real Python test suite). This suite is
// written from scratch, directly from the real source's own behavior/docstring (see
// `../../../src/api/grid/createAxisCurve.ts`'s own header comment for the full
// semantics writeup), with real, independently hand-verified numeric assertions on
// POSITIONS -- not just "it doesn't throw" -- per this chunk's own task brief (given
// the real 4x4 matrix math involved).
//
// --- The rotated+translated grid-placement fixture, hand-verified independently of
//     this port's own `a2p`/`mat4.invert` implementation ---
//
// `rotatedGridPlacement()` builds a grid `ObjectPlacement` whose local frame is
// `x_local = (0,1,0)`, `y_local = (-1,0,0)`, `z_local = (0,0,1)` (world coordinates),
// origin `(5,5,0)` -- i.e. the grid's local frame is the world frame rotated +90
// degrees about Z, then translated to `(5,5,0)`. This is directly encoded via
// `IfcAxis2Placement3D(Location=(5,5,0), Axis=(0,0,1), RefDirection=(0,1,0))`
// (`getAxis2placement`'s own parsing: `z = Axis.DirectionRatios`, `x =
// RefDirection.DirectionRatios`, `o = Location.Coordinates`), with no dependency on
// `util.placement.rotation()`/any other rotation helper.
//
// The expected LOCAL coordinates for two world points were computed by hand, entirely
// independently of `gl-matrix`/`a2p`/`mat4.invert`, using the closed-form inverse of a
// rotation+translation matrix (`M(x) = R@x + t` implies `M^-1(y) = R^T@(y-t)`, valid
// since `R` is orthonormal):
//   R (columns = x_local/y_local/z_local) = [[0,-1,0],[1,0,0],[0,0,1]], so
//   R^T = [[0,1,0],[-1,0,0],[0,0,1]], t = (5,5,0).
//   - World point (5,5,0) [the grid's own origin] -> (5,5,0)-t = (0,0,0) -> R^T@(0,0,0)
//     = (0,0,0).
//   - World point (5,15,0) -> (5,15,0)-t = (0,10,0) -> R^T@(0,10,0) =
//     (0*0+1*10+0*0, -1*0+0*10+0*0, 0*0+0*10+1*0) = (10,0,0).
// So `p1=(5,5,0)`, `p2=(5,15,0)` (world, SI meters) must localize to `(0,0)`/`(10,0)`
// (2D, Z dropped) -- asserted below via `createAxisCurve` and cross-checked, as a
// sanity double-check, against `util/placement.ts`'s own `getLocalPlacement` +
// `mat4.invert` + `vec3.transformMat4` computed independently in this file's own
// `expectedLocalXy` helper (a second, independent code path through the same verified
// primitives, not a copy of `createAxisCurve.ts`'s own implementation).

import { mat4, vec3 } from "gl-matrix";
import { describe, expect, test } from "vitest";
import { createAxisCurve } from "../../../src/api/grid/createAxisCurve";
import { createGridAxis } from "../../../src/api/grid/createGridAxis";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { getLocalPlacement } from "../../../src/util/placement";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function createProject(file: IfcFile): EntityInstance {
	return file.byType("IfcProject")[0];
}

/** Duplicated from `test/util/unit.test.ts`'s identical private helper -- see that
 * file's own doc comment for why this is a small, per-test-file helper rather than a
 * shared export. */
function createSiUnit(file: IfcFile, unitType: string, name: string, prefix: string | null = null): EntityInstance {
	const unit = file.createEntity("IfcSIUnit");
	unit.set("UnitType", unitType);
	unit.set("Name", name);
	if (prefix) unit.set("Prefix", prefix);
	return unit;
}

function assignUnits(file: IfcFile, units: readonly EntityInstance[]): void {
	const assignment = file.createEntity("IfcUnitAssignment");
	assignment.set("Units", units);
	createProject(file).set("UnitsInContext", assignment);
}

/** Builds a grid `ObjectPlacement` whose local frame is the world frame rotated +90
 * degrees about Z, translated to `(5,5,0)` -- see this file's header comment for the
 * full hand-worked-out expected-local-coordinate derivation. */
function rotatedGridPlacement(file: IfcFile): EntityInstance {
	const axis2placement = file.createEntity(
		"IfcAxis2Placement3D",
		file.createEntity("IfcCartesianPoint", [5.0, 5.0, 0.0]),
		file.createEntity("IfcDirection", [0.0, 0.0, 1.0]),
		file.createEntity("IfcDirection", [0.0, 1.0, 0.0]),
	);
	return file.createEntity("IfcLocalPlacement", null, axis2placement);
}

/** Independent cross-check of the expected local XY for a world point, computed via
 * `util/placement.ts`'s own already-verified `getLocalPlacement`/`mat4.invert`/
 * `vec3.transformMat4` -- a second code path through the same verified primitives,
 * not a copy of `createAxisCurve.ts`'s own implementation (which uses
 * `npApplyMatrix`, not `vec3.transformMat4` directly, though both are proven
 * equivalent in `util/shapeBuilder.ts`'s own header comment). */
function expectedLocalXy(grid: EntityInstance, worldPoint: readonly [number, number, number]): [number, number] {
	const gridMatrix = getLocalPlacement(grid.get("ObjectPlacement") as EntityInstance | null);
	const inv = mat4.create();
	if (!mat4.invert(inv, gridMatrix)) throw new Error("singular");
	const out = vec3.create();
	vec3.transformMat4(out, worldPoint, inv);
	return [out[0], out[1]];
}

function expectClose(actual: readonly number[], expected: readonly number[], precision = 9): void {
	expect(actual.length).toBe(expected.length);
	for (let i = 0; i < actual.length; i++) {
		expect(actual[i]).toBeCloseTo(expected[i], precision);
	}
}

describe.each(AVAILABLE_SCHEMAS)("api.grid.createAxisCurve (%s)", (schema) => {
	test("docstring example: identity grid placement, straight horizontal axis", () => {
		const file = createTestFile(schema);
		const grid = file.createEntity("IfcGrid");
		const axisA = createGridAxis(file, { axisTag: "A", uvwAxes: "UAxes", grid });

		createAxisCurve(file, { p1: [0.0, 0.0, 0.0], p2: [10.0, 0.0, 0.0], gridAxis: axisA });

		const curve = axisA.get("AxisCurve") as EntityInstance;
		expect(curve.isA("IfcPolyline")).toBe(true);
		const points = curve.get("Points") as EntityInstance[];
		expect(points.map((p) => p.get("Coordinates"))).toEqual([
			[0.0, 0.0],
			[10.0, 0.0],
		]);
	});

	test("docstring example: identity grid placement, straight vertical axis", () => {
		const file = createTestFile(schema);
		const grid = file.createEntity("IfcGrid");
		const axis1 = createGridAxis(file, { axisTag: "1", uvwAxes: "VAxes", grid });

		createAxisCurve(file, { p1: [0.0, 0.0, 0.0], p2: [0.0, 10.0, 0.0], gridAxis: axis1 });

		const points = (axis1.get("AxisCurve") as EntityInstance).get("Points") as EntityInstance[];
		expect(points.map((p) => p.get("Coordinates"))).toEqual([
			[0.0, 0.0],
			[0.0, 10.0],
		]);
	});

	test("real matrix math: a rotated + translated grid placement localizes world points correctly", () => {
		const file = createTestFile(schema);
		const grid = file.createEntity("IfcGrid");
		grid.set("ObjectPlacement", rotatedGridPlacement(file));
		const axis = createGridAxis(file, { grid });

		const p1: [number, number, number] = [5.0, 5.0, 0.0];
		const p2: [number, number, number] = [5.0, 15.0, 0.0];

		// Cross-check against this file's own hand-worked-out derivation AND an
		// independent `getLocalPlacement`/`mat4.invert`/`vec3.transformMat4` code path
		// before asserting against `createAxisCurve` itself.
		expectClose(expectedLocalXy(grid, p1), [0.0, 0.0]);
		expectClose(expectedLocalXy(grid, p2), [10.0, 0.0]);

		createAxisCurve(file, { p1, p2, gridAxis: axis });

		const points = (axis.get("AxisCurve") as EntityInstance).get("Points") as EntityInstance[];
		const coords = points.map((p) => p.get("Coordinates") as number[]);
		expectClose(coords[0], [0.0, 0.0]);
		expectClose(coords[1], [10.0, 0.0]);
	});

	test("unit conversion: SI meters are divided by unit_scale before localizing (isSi defaults to true)", () => {
		const file = createTestFile(schema);
		// 1 project unit (millimetre) == 0.001 SI meter -> unit_scale == 0.001.
		const millimetre = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		assignUnits(file, [millimetre]);

		const grid = file.createEntity("IfcGrid");
		const axis = createGridAxis(file, { grid });

		createAxisCurve(file, { p1: [1.0, 0.0, 0.0], p2: [2.0, 0.0, 0.0], gridAxis: axis });

		const points = (axis.get("AxisCurve") as EntityInstance).get("Points") as EntityInstance[];
		expect(points.map((p) => p.get("Coordinates"))).toEqual([
			[1000.0, 0.0],
			[2000.0, 0.0],
		]);
	});

	test("isSi: false skips unit conversion entirely -- points are already project units", () => {
		const file = createTestFile(schema);
		const millimetre = createSiUnit(file, "LENGTHUNIT", "METRE", "MILLI");
		assignUnits(file, [millimetre]);

		const grid = file.createEntity("IfcGrid");
		const axis = createGridAxis(file, { grid });

		createAxisCurve(file, { p1: [1000.0, 0.0, 0.0], p2: [2000.0, 0.0, 0.0], gridAxis: axis, isSi: false });

		const points = (axis.get("AxisCurve") as EntityInstance).get("Points") as EntityInstance[];
		expect(points.map((p) => p.get("Coordinates"))).toEqual([
			[1000.0, 0.0],
			[2000.0, 0.0],
		]);
	});

	test("replaces an existing, unshared AxisCurve -- the old curve is purged", () => {
		const file = createTestFile(schema);
		const grid = file.createEntity("IfcGrid");
		const axis = createGridAxis(file, { grid });

		createAxisCurve(file, { p1: [0.0, 0.0, 0.0], p2: [10.0, 0.0, 0.0], gridAxis: axis });
		const firstCurve = axis.get("AxisCurve") as EntityInstance;
		const firstCurveId = firstCurve.id();

		createAxisCurve(file, { p1: [0.0, 0.0, 0.0], p2: [20.0, 0.0, 0.0], gridAxis: axis });
		const secondCurve = axis.get("AxisCurve") as EntityInstance;

		expect(secondCurve.identity()).not.toBe(firstCurve.identity());
		expect(() => file.byId(firstCurveId)).toThrow();
		expect(file.byType("IfcPolyline")).toHaveLength(1);
	});

	test("preserves a shared AxisCurve still referenced by another axis", () => {
		const file = createTestFile(schema);
		const grid = file.createEntity("IfcGrid");
		const axisA = createGridAxis(file, { axisTag: "A", grid });
		const axisB = createGridAxis(file, { axisTag: "B", grid });

		const sharedCurve = file.createEntity("IfcPolyline", [
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcCartesianPoint", [10.0, 0.0]),
		]);
		axisA.set("AxisCurve", sharedCurve);
		axisB.set("AxisCurve", sharedCurve);

		createAxisCurve(file, { p1: [0.0, 0.0, 0.0], p2: [20.0, 0.0, 0.0], gridAxis: axisB });

		// The shared curve should be preserved since it's still used by axisA.
		expect(() => file.byId(sharedCurve.id())).not.toThrow();
		expect((axisA.get("AxisCurve") as EntityInstance).equals(sharedCurve)).toBe(true);
	});

	test("throws when the grid axis is not referenced by any IfcGrid", () => {
		const file = createTestFile(schema);
		const orphanAxis = file.createEntity("IfcGridAxis");

		expect(() => createAxisCurve(file, { p1: [0.0, 0.0, 0.0], p2: [10.0, 0.0, 0.0], gridAxis: orphanAxis })).toThrow(
			/not referenced by any IfcGrid/,
		);
	});
});
