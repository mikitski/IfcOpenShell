// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_shape_builder.py` (src/ifcopenshell-python, 539
// lines). Ported verbatim (adapted only for language/gl-matrix idioms, not behavior):
// `TestArcToPolylinePoints` (all 6 cases), `TestPolygonalFaceSetToFacetedBrep` (all 4
// cases), `TestRectangle.test_get_rectangle_coords`, `TestVertex`/`TestEdge`/`TestFace`,
// `TestFaceset.test_polygonal_face_set_invalid_face_types` (one value adjusted, see its
// own comment for why), `TestCreatePolyline`'s 3 cases and `TestMirror.test_mirror` (both
// re-purposed into disclosed-blocked regression tests, see below). NOT ported (at the
// time Part 1 landed): `TestCalculateTransitions` (tests `mep_transition_calculate`, a
// Part-2/MEP method) -- **now ported below, verbatim, all 6 cases**, as part of Part 2
// (`mepTransitionShape`/`mepTransitionLength`/`mepTransitionCalculate`/`mepBendShape`, see
// `shapeBuilder.ts`'s own header comment for the per-method findings). Also NOT ported:
// `TestFaceset.test_polygonal_face_set_simple_and_with_voids`'s
// `ifcopenshell.geom.create_shape`/`ifcopenshell.util.shape.get_area` assertions (both
// unported kernel-dependent modules) -- its structural assertions (isA/Faces
// count/With Voids-or-not) ARE ported. `TestMathutilsCompatibleMethods` is ported with an
// adapted verification strategy: this environment has no `mathutils` (a Blender-only
// package) to compare against, so each case is instead cross-checked against `gl-matrix`
// directly (already established, in `util/placement.ts`, to match numpy's/mathutils'
// rotation-matrix formulas bit-for-bit) or a from-scratch independent re-derivation --
// see each `describe` block below for its own specific method, matching this project's
// Tier-B numeric-verification bar. All other coverage below is original, written directly
// against `shape_builder.py`'s own source / `shapeBuilder.ts`'s port, matching
// `util/representation.ts`/`util/constraint.ts`'s established precedent for a module with
// (partially) no exact 1:1 Python test to port.
//
// *** Real, disclosed, pre-existing, BLOCKING primitive-layer gaps this file pins with
// regression tests (see `shapeBuilder.ts`'s own header comment for the full story) ***
//
// `TestCreatePolyline`'s Python cases all use `closed=true` or `arc_points` (needing
// `IfcLineIndex`/`IfcArcIndex` creation, which `entityInstance.ts`'s pre-existing
// `setByIndex`/`attribute_kind_of` gap -- `TODOS.md`'s existing entry, found by
// `util/migrator.ts` -- blocks completely). `TestMirror.test_mirror` calls
// `builder.rectangle()`, which always calls `polyline(..., closed=true)`, so it is
// blocked transitively for the same reason. Both are re-purposed below into regression
// tests asserting the CURRENT, disclosed, blocked behavior (matching
// `test/util/migrator.test.ts`'s own established precedent for this exact gap) -- they
// will need updating (a good thing) the moment that foundational gap is ever closed.
// Additional original regression tests cover the same gap's other reachable call sites in
// this module (`curveBetweenTwoPoints`, `getSimple2dcurveData(..., createIfcCurve=true)`,
// `createZProfileLipsCurve`, `createTransitionArcIfc(..., createIfcCurve=true)`) and the
// separate `.get("Dim")` DERIVED-attribute gap (`profile`, `createSweptDiskSolid`).
// Conversely, dedicated tests also confirm the module's substantial FULLY FUNCTIONAL
// surface despite both gaps: `polyline()`'s straight-line path, `rectangle()`/
// `polyline(closed=true)` under IFC2X3 (which needs no `IfcLineIndex`/`IfcArcIndex` at
// all), every face-set/mesh method, `vertex`/`edge`/`face`/`sphere`/`block`/
// `halfSpaceSolid`/`plane`/both `createAxis2Placement*` methods/`circle`/
// `createEllipseCurve` (including its TRIMMED path -- `IfcTrimmedCurve` is a real entity,
// not a defined type, so this doesn't hit the gap at all), and `translate`/`rotate`/
// `mirror` on a manually-constructed `IfcExtrudedAreaSolid` (its profile built directly
// via `file.createEntity(...)`, bypassing the blocked `profile()` method, to isolate
// these methods' own logic from the separate `Dim` gap).
//
// One additional disclosed, minor JS/Python numeric-type divergence found while porting
// `test_polygonal_face_set_invalid_face_types`: Python's `[[1.0, 2.0, 3.0]]` case relies
// on `isinstance(1.0, int)` being `False` (a Python float literal is never an `int`) to
// trigger the validation error; JS has only one `number` type, so
// `Number.isInteger(1.0) === true` -- this specific whole-number-float input is
// genuinely NOT distinguishable from an integer at runtime in JS (the same category of
// gap as `TODOS.md`'s existing "EntityInstance.getByIndex/wrapValue collapse EXPRESS
// INTEGER vs. REAL" entry). Ported below using a genuinely fractional value
// (`[1.5, 2.5, 3.5]`) instead, which validates correctly in both languages.
//
// *** Part 2 additions (the four MEP methods) ***
//
// `TestCalculateTransitions` (`mep_transition_calculate`) is ported verbatim below,
// including its shared `calculate_and_test` helper's own independent 3-method (A/B/C)
// angle-recomputation cross-check -- all 6 real Python cases. No Python test file coverage
// exists for `mep_transition_shape`/`mep_transition_length`/`mep_bend_shape` (confirmed by
// reading `test_shape_builder.py` in full) -- original coverage is added for all three,
// matching `util/representation.ts`/`util/constraint.ts`'s established precedent for a
// module with partial Python test coverage. `mepTransitionShape` is exercised across all 3
// profile-pairing branches (rect-rect, circle-circle, and both directions of the mixed
// circle/rect branch) plus its two `[null, null]` early-exit paths (unsupported profile
// type, no material at all). `mepBendShape` is pinned as a regression test asserting its
// current, disclosed, unconditional blockage on every schema (see `shapeBuilder.ts`'s own
// header comment) -- both the IFC2X3 "arcs not supported" throw and the IFC4/IFC4X3
// defined-type-instance-creation gap throw are covered.

import { mat4, vec3 } from "gl-matrix";
import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import * as subject from "../../src/util/shapeBuilder";
import { ShapeBuilder } from "../../src/util/shapeBuilder";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

const DIM_ERROR = /has no attribute 'Dim'/;
const DEFINED_TYPE_ERROR = /Attribute access is only supported on entity instances/;

// --- local fixture helpers (bypass `ShapeBuilder.profile()`'s disclosed `Dim` gap to
// build a working `IfcArbitraryClosedProfileDef` + `IfcExtrudedAreaSolid` directly,
// isolating `translate`/`rotate`/`mirror`/`extrude`/`getRepresentation` coverage from
// that separate, pre-existing, already-disclosed gap -- no Python counterpart, matching
// `test/util/placement.test.ts`'s established "local fixture helper" pattern for this
// exact kind of gap) ---

function rectangleProfile(file: IfcFile, builder: ShapeBuilder, size: readonly number[] = [10, 20]): EntityInstance {
	const curve = builder.polyline(subject.ShapeBuilder.getRectangleCoords(size), false);
	return file.createEntity("IfcArbitraryClosedProfileDef", "AREA", null, curve);
}

function extrudedRectangle(
	file: IfcFile,
	builder: ShapeBuilder,
	position: readonly number[] = [0, 0, 0],
	size: readonly number[] = [10, 20],
	magnitude = 5,
): EntityInstance {
	const profile = rectangleProfile(file, builder, size);
	return builder.extrude(profile, magnitude, position);
}

function allClose(
	a: readonly (readonly number[])[] | readonly number[],
	b: readonly (readonly number[])[] | readonly number[],
	tol = 1e-6,
): boolean {
	const flat = (x: unknown): number[] => (Array.isArray(x) ? x.flatMap((v) => flat(v)) : [x as number]);
	const fa = flat(a);
	const fb = flat(b);
	return fa.length === fb.length && fa.every((v, i) => Math.abs(v - fb[i]) <= tol);
}

// --- `arcToPolylinePoints` (ported verbatim from `TestArcToPolylinePoints`) ---

describe("arcToPolylinePoints", () => {
	test("quarter arc 2D samples n+1 points", () => {
		const sqrtHalf = Math.sqrt(0.5);
		const points = subject.arcToPolylinePoints([1.0, 0.0], [sqrtHalf, sqrtHalf], [0.0, 1.0], 8);
		expect(points).toHaveLength(9);
		expect(points[0][0]).toBeCloseTo(1.0, 9);
		expect(points[0][1]).toBeCloseTo(0.0, 9);
		expect(points[8][0]).toBeCloseTo(0.0, 9);
		expect(points[8][1]).toBeCloseTo(1.0, 9);
		for (const [x, y] of points) {
			expect(x * x + y * y).toBeCloseTo(1.0, 9);
		}
		// Independent cross-check: every sampled point's own angle from the origin
		// (the known circle center here) is evenly spaced across the quarter turn.
		for (let i = 0; i <= 8; i++) {
			const [x, y] = points[i];
			const angle = Math.atan2(y, x);
			expect(angle).toBeCloseTo((Math.PI / 2) * (i / 8), 6);
		}
	});

	test("collinear inputs fall back to a straight chord", () => {
		const points = subject.arcToPolylinePoints([0.0, 0.0], [1.0, 0.0], [2.0, 0.0], 16);
		expect(points).toEqual([
			[0.0, 0.0],
			[2.0, 0.0],
		]);
	});

	test("3D inputs with constant Z preserved", () => {
		// biome-ignore lint/suspicious/noApproximativeNumericConstant: literal approximate value matches the real Python test verbatim, not meant to be Math.SQRT1_2-exact.
		const points = subject.arcToPolylinePoints([1.0, 0.0, 5.0], [0.7071, 0.7071, 5.0], [0.0, 1.0, 5.0], 4);
		expect(points).toHaveLength(5);
		for (const p of points) expect(p[2]).toBe(5.0);
	});

	test("3D inputs with mismatched Z raise", () => {
		expect(() => subject.arcToPolylinePoints([1.0, 0.0, 0.0], [0.0, 1.0, 1.0], [-1.0, 0.0, 0.0])).toThrow(/XY plane/);
	});

	test("3D inputs with near-equal Z pass within tolerance", () => {
		const sqrtHalf = Math.sqrt(0.5);
		const points = subject.arcToPolylinePoints(
			[1.0, 0.0, 5.0],
			[sqrtHalf, sqrtHalf, 5.0 + 1e-15],
			[0.0, 1.0, 5.0 - 2e-16],
			4,
		);
		expect(points).toHaveLength(5);
	});

	test("subdivisions 0 raises", () => {
		expect(() => subject.arcToPolylinePoints([1.0, 0.0], [0.0, 1.0], [-1.0, 0.0], 0)).toThrow(/subdivisions/);
	});
});

// --- `polygonalFaceSetToFacetedBrep` (ported verbatim from `TestPolygonalFaceSetToFacetedBrep`) ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("polygonalFaceSetToFacetedBrep (%s)", (schema) => {
	test("triangulated face set preserves coordinates", () => {
		const file = createTestFile(schema);
		const coords = file.createEntity("IfcCartesianPointList3D", [
			[0.0, 0.0, 0.0],
			[1.0, 0.0, 0.0],
			[0.0, 1.0, 0.0],
			[0.5, 0.5, 1.0],
		]);
		const faceSet = file.createEntity("IfcTriangulatedFaceSet", coords, null, null, [
			[1, 2, 4],
			[2, 3, 4],
			[3, 1, 4],
			[1, 3, 2],
		]);

		const brep = subject.polygonalFaceSetToFacetedBrep(faceSet);

		expect(brep.isA("IfcFacetedBrep")).toBe(true);
		const outer = brep.get("Outer") as EntityInstance;
		const cfsFaces = outer.get("CfsFaces") as EntityInstance[];
		expect(cfsFaces).toHaveLength(4);
		const brepPoints = new Set<string>();
		for (const f of cfsFaces) {
			const bound = (f.get("Bounds") as EntityInstance[])[0].get("Bound") as EntityInstance;
			for (const p of bound.get("Polygon") as EntityInstance[]) {
				brepPoints.add(JSON.stringify(p.get("Coordinates")));
			}
		}
		expect(brepPoints.has(JSON.stringify([0.0, 0.0, 0.0]))).toBe(true);
		expect(brepPoints.has(JSON.stringify([1.0, 0.0, 0.0]))).toBe(true);
		expect(brepPoints.has(JSON.stringify([0.0, 1.0, 0.0]))).toBe(true);
		expect(brepPoints.has(JSON.stringify([0.5, 0.5, 1.0]))).toBe(true);

		file.dispose();
	});

	test("polygonal face set with voids preserves inner bounds", () => {
		const file = createTestFile(schema);
		const coords = file.createEntity("IfcCartesianPointList3D", [
			[0.0, 0.0, 0.0],
			[4.0, 0.0, 0.0],
			[4.0, 4.0, 0.0],
			[0.0, 4.0, 0.0],
			[1.0, 1.0, 0.0],
			[3.0, 1.0, 0.0],
			[2.0, 3.0, 0.0],
		]);
		const face = file.createEntity("IfcIndexedPolygonalFaceWithVoids", [1, 2, 3, 4], [[5, 6, 7]]);
		const faceSet = file.createEntity("IfcPolygonalFaceSet", coords, null, [face]);

		const brep = subject.polygonalFaceSetToFacetedBrep(faceSet);

		const outer = brep.get("Outer") as EntityInstance;
		const cfsFaces = outer.get("CfsFaces") as EntityInstance[];
		expect(cfsFaces).toHaveLength(1);
		const bounds = cfsFaces[0].get("Bounds") as EntityInstance[];
		expect(bounds).toHaveLength(2);
		const outerBound = bounds.find((b) => b.isA("IfcFaceOuterBound")) as EntityInstance;
		const innerBound = bounds.find((b) => !b.isA("IfcFaceOuterBound")) as EntityInstance;
		expect((outerBound.get("Bound") as EntityInstance).get("Polygon")).toHaveLength(4);
		expect((innerBound.get("Bound") as EntityInstance).get("Polygon")).toHaveLength(3);

		file.dispose();
	});

	test("wrong class raises TypeError", () => {
		const file = createTestFile(schema);
		const notAFaceSet = file.createEntity("IfcCartesianPointList3D", [[0.0, 0.0, 0.0]]);
		expect(() => subject.polygonalFaceSetToFacetedBrep(notAFaceSet)).toThrow(/IfcPolygonalFaceSet/);
		file.dispose();
	});

	test("out-of-range index raises", () => {
		const file = createTestFile(schema);
		const coords = file.createEntity("IfcCartesianPointList3D", [[0.0, 0.0, 0.0]]);
		const faceSet = file.createEntity("IfcTriangulatedFaceSet", coords, null, null, [[1, 1, 5]]);
		expect(() => subject.polygonalFaceSetToFacetedBrep(faceSet)).toThrow(/outside CoordList range/);
		file.dispose();
	});
});

// --- mathutils-compatible free functions (ported from `TestMathutilsCompatibleMethods`,
// verification methodology adapted per this file's header comment) ---

describe("npRotationMatrix", () => {
	test("2D matches the size-2 rotation formula (self-consistency + known point rotation)", () => {
		const m = subject.npRotationMatrix(Math.PI / 4, 2);
		// A 45-degree rotation of (1,0) should land on (cos45, sin45).
		const rotated = [m[0][0] * 1 + m[0][1] * 0, m[1][0] * 1 + m[1][1] * 0];
		expect(rotated[0]).toBeCloseTo(Math.SQRT1_2, 9);
		expect(rotated[1]).toBeCloseTo(Math.SQRT1_2, 9);
	});

	test("3D/4D axis-literal branches match gl-matrix's independently-verified fromXRotation/fromYRotation/fromZRotation " +
		"(already cross-checked against numpy's own rotation formulas by util/placement.ts's header comment)", () => {
		for (const axis of ["X", "Y", "Z"] as const) {
			const angle = Math.PI / 4;
			const got4 = subject.npRotationMatrix(angle, 4, axis);
			const expected4 = mat4.create();
			if (axis === "X") mat4.fromXRotation(expected4, angle);
			else if (axis === "Y") mat4.fromYRotation(expected4, angle);
			else mat4.fromZRotation(expected4, angle);
			expect(allClose(Array.from(got4), Array.from(expected4))).toBe(true);

			const got3 = subject.npRotationMatrix(angle, 3, axis);
			// Extract the 3x3 rotation part from the independently-built 4x4.
			const expected3 = [
				[expected4[0], expected4[4], expected4[8]],
				[expected4[1], expected4[5], expected4[9]],
				[expected4[2], expected4[6], expected4[10]],
			];
			expect(allClose(got3, expected3)).toBe(true);
		}
	});

	test("arbitrary-axis (Rodrigues) branch: rotating (1,0,0) by 120 degrees around the (1,1,1) diagonal " +
		"cyclically permutes it to (0,1,0), independently verifiable without reference to this formula " +
		"(a well-known geometric property of a 120-degree rotation around a cube's main diagonal)", () => {
		const m = subject.npRotationMatrix((120 * Math.PI) / 180, 3, [1, 1, 1]);
		const rotateVec = (v: readonly number[]) => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
		const r1 = rotateVec([1, 0, 0]);
		const r2 = rotateVec([0, 1, 0]);
		const r3 = rotateVec([0, 0, 1]);
		expect(allClose(r1, [0, 1, 0], 1e-9)).toBe(true);
		expect(allClose(r2, [0, 0, 1], 1e-9)).toBe(true);
		expect(allClose(r3, [1, 0, 0], 1e-9)).toBe(true);
	});

	test("size 2 with an axis argument, or size out of [2,4], throws", () => {
		expect(() => subject.npRotationMatrix(0.1, 5 as never, "Z")).toThrow(/Size must be/);
		expect(() => subject.npRotationMatrix(0.1, 3 as const)).toThrow(/not optional/);
	});
});

describe("npMatrixToEuler", () => {
	test("assumes matrix = Rz(z) @ Ry(y) @ Rx(x) -- verified empirically (not assumed), see shapeBuilder.ts's header comment", () => {
		const x = (20 * Math.PI) / 180;
		const y = (30 * Math.PI) / 180;
		const z = (40 * Math.PI) / 180;
		const rx = subject.npRotationMatrix(x, 4, "X");
		const ry = subject.npRotationMatrix(y, 4, "Y");
		const rz = subject.npRotationMatrix(z, 4, "Z");
		const ryrx = mat4.create();
		mat4.multiply(ryrx, ry, rx);
		const m = mat4.create();
		mat4.multiply(m, rz, ryrx);

		const [ex, ey, ez] = subject.npMatrixToEuler(m);
		expect(ex).toBeCloseTo(x, 9);
		expect(ey).toBeCloseTo(y, 9);
		expect(ez).toBeCloseTo(z, 9);
	});

	test("supports a scaled matrix (npMatrixNormalized re-normalizes columns first)", () => {
		const x = 0.5;
		const y = 0.5;
		const z = 0.5;
		const rx = subject.npRotationMatrix(x, 4, "X");
		const ry = subject.npRotationMatrix(y, 4, "Y");
		const rz = subject.npRotationMatrix(z, 4, "Z");
		const ryrx = mat4.create();
		mat4.multiply(ryrx, ry, rx);
		const m = mat4.create();
		mat4.multiply(m, rz, ryrx);
		// Scale column 0 by 2, matching the real Python test's `rot.col[0] *= 2`.
		m[0] *= 2;
		m[1] *= 2;
		m[2] *= 2;

		const [ex, ey, ez] = subject.npMatrixToEuler(m);
		expect(ex).toBeCloseTo(x, 6);
		expect(ey).toBeCloseTo(y, 6);
		expect(ez).toBeCloseTo(z, 6);
	});
});

describe("npAngle / npAngleSigned", () => {
	test("matches Python test's concrete cases", () => {
		expect(subject.npAngle([1, 0, 0], [0, 1, 0])).toBeCloseTo(Math.PI / 2, 9);
		expect(subject.npAngleSigned([1, 0], [0, 1])).toBeCloseTo(-Math.PI / 2, 9);
		expect(subject.npAngle([0, 1, 0], [1, 0, 0])).toBeCloseTo(Math.PI / 2, 9);
		expect(subject.npAngleSigned([0, 1], [1, 0])).toBeCloseTo(Math.PI / 2, 9);
	});

	test("npAngleSigned independently cross-checked: |signed angle| must equal npAngle, and the sign must match " +
		"a from-scratch (non-cross-product) polar-angle-difference calculation", () => {
		const a = [3, -1];
		const b = [-2, 4];
		const signed = subject.npAngleSigned(a, b);
		const unsigned = subject.npAngle(a, b);
		expect(Math.abs(signed)).toBeCloseTo(unsigned, 9);

		// Independent method: docstring says clockwise is positive, i.e. the NEGATIVE
		// of the standard (counter-clockwise-positive) polar-angle difference.
		const angleA = Math.atan2(a[1], a[0]);
		const angleB = Math.atan2(b[1], b[0]);
		let ccwDiff = angleB - angleA;
		while (ccwDiff > Math.PI) ccwDiff -= 2 * Math.PI;
		while (ccwDiff <= -Math.PI) ccwDiff += 2 * Math.PI;
		expect(signed).toBeCloseTo(-ccwDiff, 9);
	});

	test("npAngleSigned rejects non-2D input", () => {
		expect(() => subject.npAngleSigned([1, 0, 0], [0, 1, 0])).toThrow(/2D/);
	});
});

describe("npNormal", () => {
	test("matches Python test's concrete cases", () => {
		expect(
			allClose(
				subject.npNormal([
					[0, 0, 0],
					[1, 0, 0],
					[0, 1, 0],
				]),
				[0, 0, 1],
			),
		).toBe(true);
		expect(
			allClose(
				subject.npNormal([
					[0, 0, 0],
					[0, 1, 0],
					[1, 0, 0],
				]),
				[0, 0, -1],
			),
		).toBe(true);
	});

	test("rejects a non-3-vector input", () => {
		expect(() =>
			subject.npNormal([
				[0, 0, 0],
				[1, 0, 0],
			]),
		).toThrow(/3 vectors required/);
	});
});

describe("npIntersectLineLine", () => {
	test("two lines that genuinely cross at a known, non-axis-aligned point: both closest points equal that point", () => {
		// Line 1: (0,0,0)-(2,2,0). Line 2: (0,2,0)-(2,0,0). Cross at (1,1,0).
		const [p1, p2] = subject.npIntersectLineLine([0, 0, 0], [2, 2, 0], [0, 2, 0], [2, 0, 0]);
		expect(allClose(p1, [1, 1, 0], 1e-9)).toBe(true);
		expect(allClose(p2, [1, 1, 0], 1e-9)).toBe(true);
	});

	test("Python test's mathutils.geometry.intersect_line_line case", () => {
		const [p1, p2] = subject.npIntersectLineLine([0, 0, 0], [1, 1, 1], [0, 1, 0], [1, 0, 1]);
		expect(allClose(p1, [0.5, 0.5, 0.5], 1e-9)).toBe(true);
		expect(allClose(p2, [0.5, 0.5, 0.5], 1e-9)).toBe(true);
	});

	test("two genuinely skew (non-intersecting, non-parallel) 3D lines: cross-checked against an independent " +
		"from-scratch 2x2 linear-system (Cramer's rule) solution, not a transliteration of npIntersectLineLine's " +
		"own cross-product formula", () => {
		const v1 = [0, 0, 0];
		const v2 = [1, 0, 0];
		const v3 = [0, 1, 1];
		const v4 = [1, 3, 1];
		const [p1, p2] = subject.npIntersectLineLine(v1, v2, v3, v4);

		// Independent method: minimize ||(v1 + t*d1) - (v3 + u*d2)||^2 by solving the
		// normal equations directly (2 unknowns t, u) via Cramer's rule.
		const d1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
		const d2 = [v4[0] - v3[0], v4[1] - v3[1], v4[2] - v3[2]];
		const r = [v1[0] - v3[0], v1[1] - v3[1], v1[2] - v3[2]];
		const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
		const a11 = dot(d1, d1);
		const a12 = -dot(d1, d2);
		const a21 = dot(d1, d2);
		const a22 = -dot(d2, d2);
		const b1 = -dot(d1, r);
		const b2 = -dot(d2, r);
		const det = a11 * a22 - a12 * a21;
		const t = (b1 * a22 - a12 * b2) / det;
		const u = (a11 * b2 - b1 * a21) / det;
		const expectedP1 = [v1[0] + t * d1[0], v1[1] + t * d1[1], v1[2] + t * d1[2]];
		const expectedP2 = [v3[0] + u * d2[0], v3[1] + u * d2[1], v3[2] + u * d2[2]];

		expect(allClose(p1, expectedP1, 1e-9)).toBe(true);
		expect(allClose(p2, expectedP2, 1e-9)).toBe(true);
	});

	test("parallel lines throw", () => {
		expect(() => subject.npIntersectLineLine([0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0])).toThrow(/parallel/);
	});
});

// --- other module-level free functions (original coverage) ---

describe("V", () => {
	test("multiple numeric args", () => {
		expect(subject.V(1, 2, 3)).toEqual([1, 2, 3]);
	});

	test("a single vector argument", () => {
		expect(subject.V([1, 2, 3])).toEqual([1, 2, 3]);
	});

	test("a sequence of vectors", () => {
		expect(
			subject.V([
				[1, 2],
				[3, 4],
			]),
		).toEqual([
			[1, 2],
			[3, 4],
		]);
	});

	test("more than one non-numeric argument throws", () => {
		expect(() => subject.V([1, 2], [3, 4])).toThrow(/single argument/);
	});
});

describe("ifcSafeVectorType", () => {
	test("converts a plain vector", () => {
		expect(subject.ifcSafeVectorType([1, 2, 3])).toEqual([1, 2, 3]);
	});

	test("converts a sequence of vectors", () => {
		expect(
			subject.ifcSafeVectorType([
				[1, 2],
				[3, 4],
			]),
		).toEqual([
			[1, 2],
			[3, 4],
		]);
	});

	test("converts a gl-matrix typed-array vector to a plain Array (Array.isArray must be true)", () => {
		const v = vec3.fromValues(1, 2, 3);
		const result = subject.ifcSafeVectorType(v as unknown as readonly number[]);
		expect(Array.isArray(result)).toBe(true);
		expect(result).toEqual([1, 2, 3]);
	});
});

describe("isX / roundToPrecision / npRoundToPrecision", () => {
	test("isX", () => {
		expect(subject.isX(1.0000001, 1)).toBe(true);
		expect(subject.isX(1.1, 1)).toBe(false);
		expect(subject.isX(0.001, 1, 1000)).toBe(true);
	});

	test("roundToPrecision", () => {
		expect(subject.roundToPrecision(1.123456789, 1)).toBeCloseTo(1.12346, 9);
	});

	test("npRoundToPrecision", () => {
		expect(subject.npRoundToPrecision([1.123456789, 2.987654321], 1)).toEqual([
			subject.roundToPrecision(1.123456789, 1),
			subject.roundToPrecision(2.987654321, 1),
		]);
	});
});

describe("npNormalized / npLerp / npTo3d / npTo4d / npApplyMatrix / npTranslationMatrix / npMatrixNormalized", () => {
	test("npNormalized", () => {
		const n = subject.npNormalized([3, 4]);
		expect(n[0]).toBeCloseTo(0.6, 9);
		expect(n[1]).toBeCloseTo(0.8, 9);
	});

	test("npLerp", () => {
		expect(subject.npLerp([0, 0], [10, 20], 0.5)).toEqual([5, 10]);
	});

	test("npTo3d / npTo4d", () => {
		expect(subject.npTo3d([1, 2])).toEqual([1, 2, 0]);
		expect(subject.npTo3d([1, 2], 9)).toEqual([1, 2, 9]);
		expect(subject.npTo3d([1, 2, 3, 1])).toEqual([1, 2, 3]);
		expect(() => subject.npTo3d([1, 2, 3])).toThrow(/Unexpected vector length/);

		expect(subject.npTo4d([1, 2])).toEqual([1, 2, 0, 1]);
		expect(subject.npTo4d([1, 2, 3])).toEqual([1, 2, 3, 1]);
		expect(() => subject.npTo4d([1])).toThrow(/Unexpected vector length/);
	});

	test("npApplyMatrix (matches gl-matrix's own vec3.transformMat4, already verified against numpy's " +
		"(M @ [x,y,z,1])[:3] convention by util/geolocation.ts's header comment)", () => {
		const m = mat4.create();
		mat4.fromZRotation(m, Math.PI / 2);
		mat4.translate(m, m, [0, 0, 0]);
		m[12] = 5;
		m[13] = 6;
		m[14] = 7;
		const result = subject.npApplyMatrix([[1, 0, 0]], m);
		expect(allClose(result[0], [5, 7, 7], 1e-9)).toBe(true);
	});

	test("npTranslationMatrix", () => {
		const m = subject.npTranslationMatrix([1, 2, 3]);
		expect(Array.from(mat4.getTranslation([0, 0, 0], m))).toEqual([1, 2, 3]);
	});

	test("npMatrixNormalized leaves translation untouched and normalizes rotation columns", () => {
		const m = mat4.create();
		m[0] = 2;
		m[5] = 3;
		m[10] = 4;
		m[12] = 10;
		m[13] = 20;
		m[14] = 30;
		const n = subject.npMatrixNormalized(m);
		expect(n[0]).toBeCloseTo(1, 9);
		expect(n[5]).toBeCloseTo(1, 9);
		expect(n[10]).toBeCloseTo(1, 9);
		expect(n[12]).toBe(10);
		expect(n[13]).toBe(20);
		expect(n[14]).toBe(30);
	});
});

describe("intersectXAxis2d", () => {
	test("intersects a diagonal line with the X axis", () => {
		expect(subject.intersectXAxis2d([0, -1], [2, 1])).toBeCloseTo(1, 9);
	});

	test("a horizontal line returns undefined", () => {
		expect(subject.intersectXAxis2d([0, 5], [2, 5])).toBeUndefined();
	});
});

// --- `ShapeBuilder` ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("ShapeBuilder (%s)", (schema) => {
	test("getRectangleCoords (ported from TestRectangle.test_get_rectangle_coords)", () => {
		expect(
			allClose(subject.ShapeBuilder.getRectangleCoords([1, 2], [3, 4]), [
				[3.0, 4.0],
				[4.0, 4.0],
				[4.0, 6.0],
				[3.0, 6.0],
			]),
		).toBe(true);

		expect(
			allClose(subject.ShapeBuilder.getRectangleCoords([1, 2, 0], [3, 4, 0]), [
				[3.0, 4.0, 0.0],
				[4.0, 4.0, 0.0],
				[4.0, 6.0, 0.0],
				[3.0, 6.0, 0.0],
			]),
		).toBe(true);

		expect(
			allClose(subject.ShapeBuilder.getRectangleCoords([1, 0, 2], [3, 0, 4]), [
				[3.0, 0.0, 4.0],
				[4.0, 0.0, 4.0],
				[4.0, 0.0, 6.0],
				[3.0, 0.0, 6.0],
			]),
		).toBe(true);
	});

	test("polyline: straight (unclosed, no arcs) path is fully functional", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const points = [
			[0.0, 0.0],
			[1.0, 0.0],
			[1.0, 1.0],
			[0.0, 1.0],
		];
		const polyline = builder.polyline(points, false, [2.0, 0.0]);
		expect(polyline.isA("IfcIndexedPolyCurve")).toBe(true);
		const coordList = (polyline.get("Points") as EntityInstance).get("CoordList") as number[][];
		expect(
			allClose(coordList, [
				[2.0, 0.0],
				[3.0, 0.0],
				[3.0, 1.0],
				[2.0, 1.0],
			]),
		).toBe(true);
		expect(polyline.get("Segments")).toBeNull();
		file.dispose();
	});

	test("polyline: DISCLOSED BLOCKED (closed=true, ported from TestCreatePolyline.test_simple_polyline) -- " +
		"Python builds one IfcLineIndex with wrappedValue (1,2,3,4,1); this throws today because " +
		"IfcLineIndex creation needs an initial value on a freshly-created defined-type instance " +
		"(entityInstance.ts's disclosed setByIndex/attribute_kind_of gap, TODOS.md). Asserts the " +
		"CURRENT, disclosed, blocked behavior, not silently skipped.", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const points = [
			[0.0, 0.0],
			[1.0, 0.0],
			[1.0, 1.0],
			[0.0, 1.0],
		];
		expect(() => builder.polyline(points, true, [2.0, 0.0])).toThrow(DEFINED_TYPE_ERROR);
		file.dispose();
	});

	test("polyline: DISCLOSED BLOCKED (arc_points, ported from TestCreatePolyline.test_polyline_with_arc)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const points = [
			[1, 0],
			// biome-ignore lint/suspicious/noApproximativeNumericConstant: literal approximate value matches the real Python test verbatim, not meant to be Math.SQRT1_2-exact.
			[0.707, 0.707],
			[0, 1],
			[0, 2],
		];
		expect(() => builder.polyline(points, false, [2, 0], [1])).toThrow(DEFINED_TYPE_ERROR);
		file.dispose();
	});

	test("polyline: DISCLOSED BLOCKED (closed ending with arc, ported from TestCreatePolyline.test_closed_polyline_ending_with_arc)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const points = [
			[0, 0],
			[1, 0],
			[0.5, 0.5],
		];
		expect(() => builder.polyline(points, true, [2, 0], [2])).toThrow(DEFINED_TYPE_ERROR);
		file.dispose();
	});

	test("rectangle: DISCLOSED BLOCKED (always closed=true) -- also blocks TestMirror.test_mirror transitively", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		expect(() => builder.rectangle([100, 100])).toThrow(DEFINED_TYPE_ERROR);
		file.dispose();
	});

	test("curveBetweenTwoPoints: DISCLOSED BLOCKED (always creates one IfcArcIndex)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		expect(() =>
			builder.curveBetweenTwoPoints([
				[1, 0],
				[0, 1],
			]),
		).toThrow(DEFINED_TYPE_ERROR);
		file.dispose();
	});

	test("circle / plane / sphere / block / halfSpaceSolid are fully functional", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		const circle = builder.circle([1, 2], 5);
		expect(circle.isA("IfcCircle")).toBe(true);
		expect(circle.get("Radius")).toBe(5);

		const plane = builder.plane([0, 0, 0], [0, 0, 1]);
		expect(plane.isA("IfcPlane")).toBe(true);
		const planeXAxis = ((plane.get("Position") as EntityInstance).get("RefDirection") as EntityInstance).get(
			"DirectionRatios",
		) as number[];
		// Normal is +Z, so the arbitrary vector used is (0,1,0), and
		// x = normal x arbitrary = (0,0,1) x (0,1,0) = (-1,0,0).
		expect(allClose(planeXAxis, [-1, 0, 0], 1e-9)).toBe(true);

		const sphere = builder.sphere(3, [1, 1, 1]);
		expect(sphere.isA("IfcSphere")).toBe(true);
		expect(sphere.get("Radius")).toBe(3);

		const block = builder.block([0, 0, 0], 1, 2, 3);
		expect(block.isA("IfcBlock")).toBe(true);
		expect(block.get("XLength")).toBe(1);
		expect(block.get("YLength")).toBe(2);
		expect(block.get("ZLength")).toBe(3);

		const halfSpace = builder.halfSpaceSolid(plane, true);
		expect(halfSpace.isA("IfcHalfSpaceSolid")).toBe(true);
		expect(halfSpace.get("AgreementFlag")).toBe(true);

		file.dispose();
	});

	test("createAxis2Placement3d / createAxis2Placement3dFromMatrix / createAxis2Placement2d", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		const p3d = builder.createAxis2Placement3d([1, 2, 3], [0, 0, 1], [1, 0, 0]);
		expect((p3d.get("Location") as EntityInstance).get("Coordinates")).toEqual([1, 2, 3]);

		const m = mat4.create();
		mat4.translate(m, m, [7, 8, 9]);
		const fromMatrix = builder.createAxis2Placement3dFromMatrix(m);
		expect((fromMatrix.get("Location") as EntityInstance).get("Coordinates")).toEqual([7, 8, 9]);
		const fromIdentity = builder.createAxis2Placement3dFromMatrix();
		expect((fromIdentity.get("Location") as EntityInstance).get("Coordinates")).toEqual([0, 0, 0]);

		const p2dNoDir = builder.createAxis2Placement2d([1, 2]);
		expect(p2dNoDir.get("RefDirection")).toBeNull();
		const p2dWithDir = builder.createAxis2Placement2d([1, 2], [0, 1]);
		expect((p2dWithDir.get("RefDirection") as EntityInstance).get("DirectionRatios")).toEqual([0, 1]);

		file.dispose();
	});

	test("vertex / edge / face (ported from TestVertex/TestEdge/TestFace)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		const vertex = builder.vertex([1, 2, 3]);
		expect((vertex.get("VertexGeometry") as EntityInstance).get("Coordinates")).toEqual([1, 2, 3]);

		const edge = builder.edge([1, 0, 0], [1, 2, 3]);
		expect(
			((edge.get("EdgeStart") as EntityInstance).get("VertexGeometry") as EntityInstance).get("Coordinates"),
		).toEqual([1, 0, 0]);
		expect(
			((edge.get("EdgeEnd") as EntityInstance).get("VertexGeometry") as EntityInstance).get("Coordinates"),
		).toEqual([1, 2, 3]);

		const face = builder.face([
			[0, 0, 0],
			[1, 0, 0],
			[1, 1, 0],
			[0, 1, 0],
		]);
		const polygon = ((face.get("Bounds") as EntityInstance[])[0].get("Bound") as EntityInstance).get(
			"Polygon",
		) as EntityInstance[];
		expect(polygon.map((p) => p.get("Coordinates"))).toEqual([
			[0, 0, 0],
			[1, 0, 0],
			[1, 1, 0],
			[0, 1, 0],
		]);

		file.dispose();
	});

	test("createEllipseCurve: untrimmed", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const ellipse = builder.createEllipseCurve(5, 3, [1, 1]);
		expect(ellipse.isA("IfcEllipse")).toBe(true);
		expect(ellipse.get("SemiAxis1")).toBe(5);
		expect(ellipse.get("SemiAxis2")).toBe(3);
		file.dispose();
	});

	test("createEllipseCurve: trimmed (fully functional -- IfcTrimmedCurve is a real entity, not a defined type)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const trimmed = builder.createEllipseCurve(5, 3, [0, 0], [], [1, 0], [0, 2]);
		expect(trimmed.isA("IfcTrimmedCurve")).toBe(true);
		expect((trimmed.get("Trim1") as EntityInstance[])[0].get("Coordinates")).toEqual([5, 0]);
		expect((trimmed.get("Trim2") as EntityInstance[])[0].get("Coordinates")).toEqual([-5, 0]);
		file.dispose();
	});

	test("getTrimPointsFromMask", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const points = builder.getTrimPointsFromMask(5, 3, [0, 1, 2, 3]);
		expect(points).toEqual([
			[5, 0],
			[0, 3],
			[-5, 0],
			[0, -3],
		]);
		const offsetPoints = builder.getTrimPointsFromMask(5, 3, [0, 2], [1, 1]);
		expect(offsetPoints).toEqual([
			[6, 1],
			[-4, 1],
		]);
		file.dispose();
	});

	test("profile: DISCLOSED BLOCKED (Dim derived-attribute gap)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const curve = builder.polyline(
			[
				[0, 0],
				[1, 0],
				[1, 1],
			],
			false,
		);
		expect(() => builder.profile(curve)).toThrow(DIM_ERROR);
		file.dispose();
	});

	test("createSweptDiskSolid: DISCLOSED BLOCKED (Dim derived-attribute gap)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const curve = builder.polyline(
			[
				[0, 0, 0],
				[1, 0, 0],
				[1, 1, 0],
			],
			false,
		);
		expect(() => builder.createSweptDiskSolid(curve, 0.5)).toThrow(DIM_ERROR);
		file.dispose();
	});

	test("extrude / translate / rotate / mirror on a manually-built IfcExtrudedAreaSolid " +
		"(isolated from the disclosed profile()/Dim gap via a local fixture helper)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		const solid = extrudedRectangle(file, builder, [0, 0, 0], [10, 20], 5);
		expect(solid.isA("IfcExtrudedAreaSolid")).toBe(true);
		expect(solid.get("Depth")).toBe(5);

		builder.translate(solid, [1, 1, 1]);
		const positionAfterTranslate = ((solid.get("Position") as EntityInstance).get("Location") as EntityInstance).get(
			"Coordinates",
		) as number[];
		expect(allClose(positionAfterTranslate, [1, 1, 1], 1e-9)).toBe(true);

		builder.rotate(solid, 90, [0, 0], false);
		const positionAfterRotate = ((solid.get("Position") as EntityInstance).get("Location") as EntityInstance).get(
			"Coordinates",
		) as number[];
		// Clockwise 90-degree rotation of (1,1) around origin -> (1,-1).
		expect(positionAfterRotate[0]).toBeCloseTo(1, 6);
		expect(positionAfterRotate[1]).toBeCloseTo(-1, 6);

		const outerCurveBefore = (solid.get("SweptArea") as EntityInstance).get("OuterCurve") as EntityInstance;
		const coordsBefore = builder.getPolylineCoords(outerCurveBefore);

		builder.mirror(solid, [1, 0]);
		const coordsAfter = builder.getPolylineCoords(
			(solid.get("SweptArea") as EntityInstance).get("OuterCurve") as EntityInstance,
		);
		// Mirroring across the Y axis negates every X coordinate.
		for (let i = 0; i < coordsBefore.length; i++) {
			expect(coordsAfter[i][0]).toBeCloseTo(-coordsBefore[i][0], 6);
			expect(coordsAfter[i][1]).toBeCloseTo(coordsBefore[i][1], 6);
		}

		file.dispose();
	});

	test("extrude: zero magnitude throws", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const profile = rectangleProfile(file, builder);
		expect(() => builder.extrude(profile, 0)).toThrow(/magnitude/);
		file.dispose();
	});

	test("getRepresentation with an explicit representationType (functional even with curve items)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const context = file.createEntity("IfcGeometricRepresentationContext", null, "Model", 3, 1.0e-5);
		const curve = builder.polyline(
			[
				[0, 0],
				[1, 0],
			],
			false,
		);
		const rep = builder.getRepresentation(context, curve, "Curve2D");
		expect(rep.isA("IfcShapeRepresentation")).toBe(true);
		expect(rep.get("RepresentationType")).toBe("Curve2D");
		file.dispose();
	});

	test("getRepresentation with SolidModel items infers the type via the real (unblocked) guessType branch", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const context = file.createEntity("IfcGeometricRepresentationContext", null, "Model", 3, 1.0e-5);
		const solid = extrudedRectangle(file, builder);
		const rep = builder.getRepresentation(context, solid);
		expect(rep.isA("IfcShapeRepresentation")).toBe(true);
		expect(rep.get("RepresentationType")).toBe("SweptSolid");
		file.dispose();
	});

	test("deepCopy delegates to util.element.copyDeep", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const circle = builder.circle([1, 2], 5);
		const copy = builder.deepCopy(circle);
		expect(copy.identity()).not.toBe(circle.identity());
		expect(copy.get("Radius")).toBe(5);
		file.dispose();
	});

	test("extrudeKwargs / rotateExtrusionKwargsByZ (preserves the disclosed counterClockwise-is-unused quirk)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		const kwargsZ = builder.extrudeKwargs("Z");
		expect(kwargsZ.positionXAxis).toEqual([1, 0, 0]);
		expect(kwargsZ.positionZAxis).toEqual([0, 0, 1]);
		expect(kwargsZ.extrusionVector).toEqual([0, 0, 1]);

		const rotatedTrue = builder.rotateExtrusionKwargsByZ(kwargsZ, Math.PI / 2, true);
		const rotatedFalse = builder.rotateExtrusionKwargsByZ(kwargsZ, Math.PI / 2, false);
		// The disclosed quirk: counterClockwise is accepted but never used.
		expect(allClose(rotatedTrue.positionXAxis, rotatedFalse.positionXAxis, 1e-9)).toBe(true);
		expect(allClose(rotatedTrue.positionZAxis, rotatedFalse.positionZAxis, 1e-9)).toBe(true);

		file.dispose();
	});

	test("getPolylineCoords / setPolylineCoords round-trip on a functional (unclosed) polyline", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const polyline = builder.polyline(
			[
				[0, 0],
				[1, 0],
				[1, 1],
			],
			false,
		);
		const coords = builder.getPolylineCoords(polyline);
		expect(coords).toEqual([
			[0, 0],
			[1, 0],
			[1, 1],
		]);
		builder.setPolylineCoords(polyline, [
			[9, 9],
			[1, 0],
			[1, 1],
		]);
		expect(builder.getPolylineCoords(polyline)).toEqual([
			[9, 9],
			[1, 0],
			[1, 1],
		]);
		file.dispose();
	});

	test("rotate2dPoint / mirror2dPoint", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		const rotated = builder.rotate2dPoint([1, 0], 90);
		// Clockwise (default) 90-degree rotation of (1,0) -> (0,-1).
		expect(rotated[0]).toBeCloseTo(0, 9);
		expect(rotated[1]).toBeCloseTo(-1, 9);

		const rotatedCcw = builder.rotate2dPoint([1, 0], 90, [0, 0], true);
		expect(rotatedCcw[0]).toBeCloseTo(0, 9);
		expect(rotatedCcw[1]).toBeCloseTo(1, 9);

		const mirrored = builder.mirror2dPoint([1, 2], [1, 0]);
		expect(mirrored).toEqual([-1, 2]);

		expect(() => builder.mirror2dPoint([1, 2, 3], [1, 0])).toThrow(/matching length/);

		file.dispose();
	});

	test("getSimple2dcurveData: createIfcCurve=false is fully functional (pure point/segment computation)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const [points, segments, ifcCurve] = builder.getSimple2dcurveData(
			[
				[0, 0],
				[10, 0],
				[10, 10],
				[0, 10],
			],
			[1],
			2,
			true,
			false,
		);
		expect(ifcCurve).toBeNull();
		expect(points.length).toBeGreaterThan(4); // The fillet at point 1 adds 2 extra points.
		expect(segments.length).toBeGreaterThan(0);
		file.dispose();
	});

	test("getSimple2dcurveData: DISCLOSED BLOCKED when createIfcCurve=true", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		expect(() =>
			builder.getSimple2dcurveData(
				[
					[0, 0],
					[10, 0],
					[10, 10],
					[0, 10],
				],
				[1],
				2,
				true,
				true,
			),
		).toThrow(DEFINED_TYPE_ERROR);
		file.dispose();
	});

	test("createZProfileLipsCurve: DISCLOSED BLOCKED (always createIfcCurve=true)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		expect(() => builder.createZProfileLipsCurve(50, 40, 200, 20, 2, 5)).toThrow(DEFINED_TYPE_ERROR);
		file.dispose();
	});

	test("createTransitionArcIfc: createIfcCurve=false (default) is fully functional", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const [points, segments, ifcCurve] = builder.createTransitionArcIfc(100, 50);
		expect(ifcCurve).toBeNull();
		expect(points.length).toBeGreaterThan(0);
		expect(segments.length).toBeGreaterThan(0);

		// Width too large for a single arc of the given height -- takes the "straight
		// segment in the middle" branch.
		const [wideePoints] = builder.createTransitionArcIfc(1000, 50);
		expect(wideePoints.length).toBeGreaterThan(points.length);
		file.dispose();
	});

	test("createTransitionArcIfc: DISCLOSED BLOCKED when createIfcCurve=true", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		expect(() => builder.createTransitionArcIfc(100, 50, true)).toThrow(DEFINED_TYPE_ERROR);
		file.dispose();
	});

	test("mesh / facetedBrep / triangulatedFaceSet / polygonalFaceSet / extrudeFaceSet are fully functional", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const points: readonly (readonly number[])[] = [
			[0, 0, 0],
			[1, 0, 0],
			[1, 1, 0],
			[0, 1, 0],
		];
		const faces = [[0, 1, 2, 3]];

		const facetedBrep = builder.facetedBrep(points, faces);
		expect(facetedBrep.isA("IfcFacetedBrep")).toBe(true);

		const triangulated = builder.triangulatedFaceSet(points, [[0, 1, 2]]);
		expect(triangulated.isA("IfcTriangulatedFaceSet")).toBe(true);
		expect(triangulated.get("CoordIndex")).toEqual([[1, 2, 3]]);

		const polygonal = builder.polygonalFaceSet(points, faces);
		expect(polygonal.isA("IfcPolygonalFaceSet")).toBe(true);
		expect((polygonal.get("Faces") as EntityInstance[])[0].get("CoordIndex")).toEqual([1, 2, 3, 4]);

		const mesh = builder.mesh(points, faces);
		expect(mesh.isA(schema === "IFC2X3" ? "IfcFacetedBrep" : "IfcPolygonalFaceSet")).toBe(true);

		const extruded = builder.extrudeFaceSet(points, 5, [0, 0, 1]);
		expect(extruded.isA("IfcPolygonalFaceSet")).toBe(true);
		// 4 side faces + start cap + end cap.
		expect((extruded.get("Faces") as EntityInstance[]).length).toBe(6);

		file.dispose();
	});

	test("polygonalFaceSet: with/without inner voids (structural assertions ported from " +
		"TestFaceset.test_polygonal_face_set_simple_and_with_voids -- the ifcopenshell.geom/util.shape " +
		"area assertions are NOT ported, both unported kernel-dependent modules)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		const v0 = [0.0, 0.0, 0.0];
		const v1 = [4.0, 0.0, 0.0];
		const v2 = [4.0, 4.0, 0.0];
		const v3 = [0.0, 4.0, 0.0];
		const v4 = [1.0, 1.0, 0.0];
		const v5 = [3.0, 1.0, 0.0];
		const v6 = [3.0, 3.0, 0.0];
		const v7 = [1.0, 3.0, 0.0];

		const withInnerResult = builder.polygonalFaceSet(
			[v0, v1, v2, v3, v4, v5, v6, v7],
			[
				[
					[0, 1, 2, 3],
					[4, 5, 6, 7],
				],
			],
		);
		expect(withInnerResult.isA("IfcPolygonalFaceSet")).toBe(true);
		expect((withInnerResult.get("Coordinates") as EntityInstance).isA("IfcCartesianPointList3D")).toBe(true);
		expect(withInnerResult.get("Faces") as EntityInstance[]).toHaveLength(1);
		expect((withInnerResult.get("Faces") as EntityInstance[])[0].isA("IfcIndexedPolygonalFaceWithVoids")).toBe(true);

		const simpleResult = builder.polygonalFaceSet([v0, v1, v2, v3], [[0, 1, 2, 3]]);
		expect((simpleResult.get("Faces") as EntityInstance[])[0].isA("IfcIndexedPolygonalFace")).toBe(true);

		file.dispose();
	});

	test("polygonalFaceSet: invalid face types raise (adapted from TestFaceset.test_polygonal_face_set_invalid_face_types " +
		"-- see this file's header comment for the [1.0, 2.0, 3.0] -> [1.5, 2.5, 3.5] adaptation)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		expect(() => builder.polygonalFaceSet([], ["123" as unknown as readonly number[]])).toThrow(
			/Expected a sequence of int or sequence of sequence of int/,
		);
		expect(() => builder.polygonalFaceSet([], [[1.5, 2.5, 3.5] as unknown as readonly number[]])).toThrow(
			/Expected a sequence of int or sequence of sequence of int/,
		);
		expect(() =>
			builder.polygonalFaceSet(
				[],
				[
					[
						[[1, 2], 3],
						[4, 5, 6],
					] as unknown as readonly number[],
				],
			),
		).toThrow(/Expected a sequence of int or sequence of sequence of int/);
		file.dispose();
	});
});

// --- IFC2X3-specific coverage: `polyline(closed=true)`/`rectangle()` are fully
// functional there (no `IfcLineIndex`/`IfcArcIndex` needed at all -- see shapeBuilder.ts's
// header comment) -- guarded per this project's established `AVAILABLE_SCHEMAS`
// convention. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC2X3"))("ShapeBuilder IFC2X3-specific (%s)", (schema) => {
	test("rectangle / polyline(closed=true) are fully functional under IFC2X3 (ported from TestMirror.test_mirror)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const rectangle = builder.rectangle([100, 100]);
		expect(rectangle.isA("IfcPolyline")).toBe(true);
		const pointsBefore = (rectangle.get("Points") as EntityInstance[]).map((p) => p.get("Coordinates"));
		expect(
			allClose(pointsBefore as number[][], [
				[0.0, 0.0],
				[100.0, 0.0],
				[100.0, 100.0],
				[0.0, 100.0],
				[0.0, 0.0],
			]),
		).toBe(true);

		builder.mirror(rectangle, [1, 0]);
		const pointsAfter = (rectangle.get("Points") as EntityInstance[]).map((p) => p.get("Coordinates"));
		expect(
			allClose(pointsAfter as number[][], [
				[0.0, 0.0],
				[-100.0, 0.0],
				[-100.0, 100.0],
				[0.0, 100.0],
				[0.0, 0.0],
			]),
		).toBe(true);

		file.dispose();
	});

	test("polyline: arcs are rejected under IFC2X3", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		expect(() =>
			builder.polyline(
				[
					[0, 0],
					[1, 0],
					[1, 1],
				],
				false,
				null,
				[1],
			),
		).toThrow(/Arcs are not supported for IFC2X3/);
		file.dispose();
	});
});

// =====================================================================================
// Part 2: MEP transition/bend methods
// =====================================================================================

// --- local fixture helpers (no Python counterpart) ---

function assignMaterial(file: IfcFile, elements: readonly EntityInstance[], material: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelAssociatesMaterial");
	rel.set("RelatedObjects", [...elements]);
	rel.set("RelatingMaterial", material);
	return rel;
}

/** A segment (any element works structurally -- `getMaterial`/`get_material` only cares
 * about `HasAssociations`) with a single-profile `IfcMaterialProfileSet`, the shape
 * `mepGetProfile`/`get_profile` (both `mep_transition_shape` and `mep_bend_shape`'s own
 * nested closure) requires to resolve a profile at all. */
function segmentWithProfile(file: IfcFile, profile: EntityInstance): EntityInstance {
	const segment = file.createEntity("IfcFlowSegment");
	const profileSet = file.createEntity("IfcMaterialProfileSet");
	const materialProfile = file.createEntity("IfcMaterialProfile");
	materialProfile.set("Profile", profile);
	profileSet.set("MaterialProfiles", [materialProfile]);
	assignMaterial(file, [segment], profileSet);
	return segment;
}

function rectProfile(file: IfcFile, xDim: number, yDim: number): EntityInstance {
	const profile = file.createEntity("IfcRectangleProfileDef");
	profile.set("ProfileType", "AREA");
	profile.set("XDim", xDim);
	profile.set("YDim", yDim);
	return profile;
}

function circleProfile(file: IfcFile, radius: number): EntityInstance {
	const profile = file.createEntity("IfcCircleProfileDef");
	profile.set("ProfileType", "AREA");
	profile.set("Radius", radius);
	return profile;
}

/** A Model/Body/MODEL_VIEW `IfcGeometricRepresentationSubContext`, matching
 * `representation.test.ts`'s own `subContext` fixture helper -- `mepTransitionShape`/
 * `mepBendShape` both call `getContext(file, "Model", "Body", "MODEL_VIEW")` and throw
 * (Python: `assert body`) if none is found. */
function bodyContext(file: IfcFile): EntityInstance {
	const context = file.createEntity("IfcGeometricRepresentationSubContext");
	context.set("ContextType", "Model");
	context.set("ContextIdentifier", "Body");
	context.set("TargetView", "MODEL_VIEW");
	return context;
}

function addVec(a: readonly number[], b: readonly number[]): number[] {
	return a.map((v, i) => v + b[i]);
}

function subVec(a: readonly number[], b: readonly number[]): number[] {
	return a.map((v, i) => v - b[i]);
}

// --- `mepTransitionCalculate` (ported verbatim from `TestCalculateTransitions`,
// including its shared `calculate_and_test` helper) ---

function calculateAndTest(
	builder: ShapeBuilder,
	params: subject.MepTransitionCalculateOptions,
	length: number | null,
): void {
	const endProfile = params.endProfile ?? false;
	const startHalfDim = params.startHalfDim;
	const endHalfDim = params.endHalfDim;
	const offsetRaw = params.offset;
	const offset: readonly [number, number] = endProfile ? [offsetRaw[1], offsetRaw[0]] : [offsetRaw[0], offsetRaw[1]];
	const angle = params.angle as number;

	const calculatedLength = builder.mepTransitionCalculate(params);
	if (length === null) {
		expect(calculatedLength).toBeNull();
		return;
	}
	expect(calculatedLength).not.toBeNull();
	expect(subject.isX(calculatedLength as number, length)).toBe(true);

	// Angle confirmation methods:
	// A - between two profiles of different dimensions
	// B - between two profiles of the same dimensions, no offset by X
	// C - between two profiles of the same dimensions, has offset by X
	const diff = [startHalfDim[0] - endHalfDim[0], startHalfDim[1] - endHalfDim[1]];
	const sameDimension = subject.isX(endProfile ? diff[1] : diff[0], 0);
	const confirmationMethod: "A" | "B" | "C" = !sameDimension ? "A" : subject.isX(offset[0], 0) ? "B" : "C";

	if (confirmationMethod === "A") {
		const A = [(endProfile ? endHalfDim : startHalfDim)[0], 0, 0];
		const endProfileOffset = subject.npTo3d(offset, length);
		const D0 = [(endProfile ? startHalfDim : endHalfDim)[0], 0, 0];
		const B = A.map((v) => -v);
		const C = addVec(
			D0.map((v) => -v),
			endProfileOffset,
		);
		const D = addVec(D0, endProfileOffset);
		const testedAngle = (subject.npAngle(subVec(A, D), subVec(B, C)) * 180) / Math.PI;
		expect(subject.isX(testedAngle, angle)).toBe(true);
	} else if (confirmationMethod === "B") {
		const O = [0, 0, 0];
		const A = addVec([-startHalfDim[0], 0, length], subject.npTo3d(offset));
		const B = [A[0] * -1, A[1], A[2]];
		const testedAngle = (subject.npAngle(subVec(A, O), subVec(B, O)) * 180) / Math.PI;
		expect(subject.isX(testedAngle, angle)).toBe(true);
	} else {
		const A = [-startHalfDim[0], 0, 0];
		const H = [A[0], A[1], A[2] + length];
		H[1] += offset[1];
		const D = [...H];
		D[0] += offset[0];
		const testedAngle = (subject.npAngle(subVec(H, A), subVec(D, A)) * 180) / Math.PI;
		expect(subject.isX(testedAngle, angle)).toBe(true);
	}

	const calculatedAngle = builder.mepTransitionCalculate({ ...params, angle: null, length: calculatedLength });
	expect(calculatedAngle).not.toBeNull();
	expect(subject.isX(calculatedAngle as number, angle)).toBe(true);
}

describe("mepTransitionCalculate (ported verbatim from TestCalculateTransitions)", () => {
	test("same dims, no offset", () => {
		const file = createTestFile("IFC4");
		const builder = new ShapeBuilder(file);
		calculateAndTest(
			builder,
			{
				startHalfDim: [100, 50, 0],
				endHalfDim: [100, 50, 0],
				offset: [0, 0],
				endProfile: false,
				angle: 90,
				verbose: true,
			},
			100,
		);
		file.dispose();
	});

	test("same dims, has X offset", () => {
		const file = createTestFile("IFC4");
		const builder = new ShapeBuilder(file);
		calculateAndTest(
			builder,
			{
				startHalfDim: [100, 50, 0],
				endHalfDim: [100, 50, 0],
				offset: [50, 50],
				endProfile: false,
				angle: 30,
				verbose: true,
			},
			70.71068,
		);
		file.dispose();
	});

	test("same dims, has Y offset", () => {
		const file = createTestFile("IFC4");
		const builder = new ShapeBuilder(file);
		calculateAndTest(
			builder,
			{
				startHalfDim: [100, 50, 0],
				endHalfDim: [100, 50, 0],
				offset: [0, 50],
				endProfile: false,
				angle: 90,
				verbose: true,
			},
			86.60254,
		);
		file.dispose();
	});

	test("different dims, no offset", () => {
		const file = createTestFile("IFC4");
		const builder = new ShapeBuilder(file);
		calculateAndTest(
			builder,
			{
				startHalfDim: [100, 50, 0],
				endHalfDim: [50, 100, 0],
				offset: [0, 0],
				endProfile: false,
				angle: 30,
				verbose: true,
			},
			186.60254,
		);
		file.dispose();
	});

	test("different dims, has X and Y offset", () => {
		const file = createTestFile("IFC4");
		const builder = new ShapeBuilder(file);
		calculateAndTest(
			builder,
			{
				startHalfDim: [100, 50, 0],
				endHalfDim: [50, 100, 0],
				offset: [50, 50],
				endProfile: false,
				angle: 30,
				verbose: true,
			},
			165.83124,
		);
		file.dispose();
	});

	test("Y offset too big -- infeasible via methods A, B, and C", () => {
		const file = createTestFile("IFC4");
		const builder = new ShapeBuilder(file);

		// Method A.
		const paramsA: subject.MepTransitionCalculateOptions = {
			startHalfDim: [100, 50, 0],
			endHalfDim: [50, 100, 0],
			// offset.y > h -- 190 > 186.6
			offset: [0, 190],
			endProfile: false,
			angle: 30,
			verbose: true,
		};
		calculateAndTest(builder, paramsA, null);

		// Method B.
		const paramsB: subject.MepTransitionCalculateOptions = { ...paramsA, endHalfDim: [100, 100, 0] };
		calculateAndTest(builder, paramsB, null);

		// Method C.
		const paramsC: subject.MepTransitionCalculateOptions = { ...paramsB, offset: [10.0, 190] };
		calculateAndTest(builder, paramsC, null);

		file.dispose();
	});
});

// --- `mepTransitionLength` (no Python test coverage -- original, exercising the
// bidirectional `check_transition()`/`check_transition(True)` logic that
// `TestCalculateTransitions` above doesn't reach, since it calls `mep_transition_calculate`
// directly) ---

describe("mepTransitionLength", () => {
	test("returns the same length as the underlying mepTransitionCalculate for a feasible case", () => {
		const file = createTestFile("IFC4");
		const builder = new ShapeBuilder(file);
		const length = builder.mepTransitionLength([100, 50, 0], [100, 50, 0], 90, [0, 0]);
		expect(length).not.toBeNull();
		expect(subject.isX(length as number, 100)).toBe(true);
		file.dispose();
	});

	test("returns null when no feasible transition exists", () => {
		const file = createTestFile("IFC4");
		const builder = new ShapeBuilder(file);
		const length = builder.mepTransitionLength([100, 50, 0], [50, 100, 0], 30, [0, 190]);
		expect(length).toBeNull();
		file.dispose();
	});
});

// --- `mepTransitionShape` (no Python test coverage -- original, exercising all 3
// profile-pairing branches plus both `[null, null]` early-exit paths; fully functional,
// see `shapeBuilder.ts`'s own header comment) ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("mepTransitionShape (%s)", (schema) => {
	test("rectangle-to-rectangle transition", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		bodyContext(file);
		const start = segmentWithProfile(file, rectProfile(file, 200, 100));
		const end = segmentWithProfile(file, rectProfile(file, 100, 50));

		const [representation, data] = builder.mepTransitionShape(start, end, 50, 50, 30);

		expect(representation).not.toBeNull();
		expect((representation as EntityInstance).isA("IfcShapeRepresentation")).toBe(true);
		expect((representation as EntityInstance).get("RepresentationType")).toBe("Tesselation");
		const items = (representation as EntityInstance).get("Items") as EntityInstance[];
		// Rect-rect builds a single combined IfcPolygonalFaceSet -- no separate start/end
		// extrusions (unlike the circle-circle/mixed branches below).
		expect(items).toHaveLength(1);
		expect(items[0].isA("IfcPolygonalFaceSet")).toBe(true);

		expect(data).not.toBeNull();
		const transitionData = data as subject.MepTransitionData;
		expect(transitionData.startLength).toBe(50);
		expect(transitionData.endLength).toBe(50);
		expect(transitionData.angle).toBe(30);
		expect(transitionData.transitionLength).toBeGreaterThan(0);
		expect(transitionData.fullTransitionLength).toBeCloseTo(
			transitionData.startLength + transitionData.transitionLength + transitionData.endLength,
			9,
		);

		file.dispose();
	});

	test("circle-to-circle transition", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		bodyContext(file);
		const start = segmentWithProfile(file, circleProfile(file, 50));
		const end = segmentWithProfile(file, circleProfile(file, 30));

		const [representation, data] = builder.mepTransitionShape(start, end, 40, 40, 30);

		expect(representation).not.toBeNull();
		const items = (representation as EntityInstance).get("Items") as EntityInstance[];
		// Circle-circle: start extrusion, end extrusion, transition face set.
		expect(items).toHaveLength(3);
		for (const item of items) expect(item.isA("IfcPolygonalFaceSet")).toBe(true);
		expect((data as subject.MepTransitionData).transitionLength).toBeGreaterThan(0);

		file.dispose();
	});

	test("rectangle-to-circle transition (mixed branch, starting with rectangle)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		bodyContext(file);
		const start = segmentWithProfile(file, rectProfile(file, 100, 100));
		const end = segmentWithProfile(file, circleProfile(file, 50));

		const [representation, data] = builder.mepTransitionShape(start, end, 40, 40, 30);

		expect(representation).not.toBeNull();
		const items = (representation as EntityInstance).get("Items") as EntityInstance[];
		expect(items).toHaveLength(3);
		expect((data as subject.MepTransitionData).transitionLength).toBeGreaterThan(0);

		file.dispose();
	});

	test("circle-to-rectangle transition (mixed branch, starting with circle -- exercises the face-orientation reversal)", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		bodyContext(file);
		const start = segmentWithProfile(file, circleProfile(file, 50));
		const end = segmentWithProfile(file, rectProfile(file, 100, 100));

		const [representation, data] = builder.mepTransitionShape(start, end, 40, 40, 30);

		expect(representation).not.toBeNull();
		const items = (representation as EntityInstance).get("Items") as EntityInstance[];
		expect(items).toHaveLength(3);
		expect((data as subject.MepTransitionData).transitionLength).toBeGreaterThan(0);

		file.dispose();
	});

	test("returns [null, null] when a segment has no resolvable single-profile material", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		const start = file.createEntity("IfcFlowSegment"); // No material at all.
		const end = segmentWithProfile(file, rectProfile(file, 100, 50));

		const [representation, data] = builder.mepTransitionShape(start, end, 40, 40);

		expect(representation).toBeNull();
		expect(data).toBeNull();

		file.dispose();
	});

	test("returns [null, null] for an unsupported profile type", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);
		bodyContext(file);
		const start = segmentWithProfile(file, file.createEntity("IfcArbitraryClosedProfileDef"));
		const end = segmentWithProfile(file, rectProfile(file, 100, 50));

		const [representation, data] = builder.mepTransitionShape(start, end, 40, 40);

		expect(representation).toBeNull();
		expect(data).toBeNull();

		file.dispose();
	});
});

// --- `mepBendShape` (no Python test coverage -- original; pinned as a regression test
// against the CURRENT, disclosed, unconditional blockage on every schema -- see
// `shapeBuilder.ts`'s own header comment for the full story) ---

describe("mepBendShape (currently unconditionally blocked -- see shapeBuilder.ts's header comment)", () => {
	// `describe.skipIf`/`test.skipIf`-guarded on `AVAILABLE_SCHEMAS.includes("IFC2X3")` --
	// CI's core build is `SCHEMA_VERSIONS=4` (IFC4 only, see `bootstrap.ts`'s own header
	// comment), so an unconditional `createTestFile("IFC2X3")` throws "No schema loaded"
	// there, matching this project's established convention for any IFC2X3-specific test
	// (e.g. `test/util/doc.test.ts`'s own `describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))`).
	test.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))(
		"throws under IFC2X3 -- 'IfcMaterialProfileSet' doesn't exist in that schema at all, so no segment can ever resolve a profile",
		() => {
			// `IfcMaterialProfileSet` is an IFC4+ entity (confirmed: absent from
			// `src/generated/ifc2x3.d.ts`), so `segmentWithProfile()`'s own fixture can't be
			// built under IFC2X3 -- meaning no real IFC2X3 caller could ever satisfy
			// `mepGetProfile`/`get_profile` either. `mepBendShape` throws via its own
			// `assert profile` check (never even reaching `polyline()`'s separate, real
			// "arcs not supported for IFC2X3" restriction) -- a distinct, schema-capability
			// reason, not the same IFC4/IFC4X3 primitive-layer gap tested below.
			const file = createTestFile("IFC2X3");
			const builder = new ShapeBuilder(file);
			const segment = file.createEntity("IfcFlowSegment"); // No material at all.

			expect(() => builder.mepBendShape(segment, 100, 100, Math.PI / 4, 200, [0, 1, 0], false)).toThrow(
				/no supported single-profile material/,
			);

			file.dispose();
		},
	);

	test.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
		"throws under %s (pre-existing defined-type-instance-creation primitive gap)",
		(schema) => {
			const file = createTestFile(schema);
			const builder = new ShapeBuilder(file);
			const segment = segmentWithProfile(file, circleProfile(file, 50));

			expect(() => builder.mepBendShape(segment, 100, 100, Math.PI / 4, 200, [0, 1, 0], false)).toThrow(
				DEFINED_TYPE_ERROR,
			);

			file.dispose();
		},
	);

	test("throws for a rectangular profile too (same transitive blockage)", () => {
		const file = createTestFile("IFC4");
		const builder = new ShapeBuilder(file);
		const segment = segmentWithProfile(file, rectProfile(file, 100, 100));

		expect(() => builder.mepBendShape(segment, 100, 100, Math.PI / 4, 200, [0, 1, 0], false)).toThrow(
			DEFINED_TYPE_ERROR,
		);

		file.dispose();
	});
});
