// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `assign_connection_geometry.py` (confirmed: no
// `test_assign_connection_geometry.py` under `test/api/boundary/` in
// src/ifcopenshell-python). This suite is written directly from the real source's own
// docstring/behavior, covering: the basic geometry graph shape, the `close_polyline`/
// `np.allclose`-dedup interaction (an already-closed outer boundary must not be
// double-closed), inner boundaries, and the default (omitted) `innerBoundaries` case.
// Default test-file units are plain SI meters (`unit_scale == 1`, see
// `../../../src/template.ts`), so `create_point`'s division is a no-op here and
// coordinates round-trip exactly -- unit-scale conversion itself is already covered by
// `../../../src/util/unit.test.ts`, matching `../profile/addArbitraryProfile.test.ts`'s
// own identical precedent for a from-scratch test suite. No schema divergence exists
// for any entity involved (see `../../../src/api/boundary/index.ts`'s own header
// comment), so this runs against every `AVAILABLE_SCHEMAS` entry.

import { describe, expect, test } from "vitest";
import { assignConnectionGeometry } from "../../../src/api/boundary/assignConnectionGeometry";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.boundary.assignConnectionGeometry (%s)", (schema) => {
	test("builds a curve-bounded-plane connection geometry and assigns it", () => {
		const file = createTestFile(schema);
		const boundary = createEntity(file, { ifcClass: "IfcRelSpaceBoundary" });

		assignConnectionGeometry(file, {
			relSpaceBoundary: boundary,
			outerBoundary: [
				[0.0, 0.0],
				[1.0, 0.0],
				[1.0, 1.0],
				[0.0, 1.0],
			],
			location: [0.0, 0.0, 0.0],
			axis: [1.0, 0.0, 0.0],
			refDirection: [0.0, 0.0, 1.0],
		});

		const geometry = boundary.get("ConnectionGeometry") as EntityInstance;
		expect(geometry.isA("IfcConnectionSurfaceGeometry")).toBe(true);
		expect(geometry.get("SurfaceOnRelatedElement")).toBeNull();

		const plane = geometry.get("SurfaceOnRelatingElement") as EntityInstance;
		expect(plane.isA("IfcCurveBoundedPlane")).toBe(true);

		const basisSurface = plane.get("BasisSurface") as EntityInstance;
		expect(basisSurface.isA("IfcPlane")).toBe(true);
		const position = basisSurface.get("Position") as EntityInstance;
		expect(position.isA("IfcAxis2Placement3D")).toBe(true);
		expect((position.get("Location") as EntityInstance).get("Coordinates")).toEqual([0.0, 0.0, 0.0]);
		expect((position.get("Axis") as EntityInstance).get("DirectionRatios")).toEqual([1.0, 0.0, 0.0]);
		expect((position.get("RefDirection") as EntityInstance).get("DirectionRatios")).toEqual([0.0, 0.0, 1.0]);

		// The outer boundary is closed by appending the first point again, since the
		// caller's own 4 points didn't already repeat the first as the last.
		const outerCurve = plane.get("OuterBoundary") as EntityInstance;
		expect(outerCurve.isA("IfcPolyline")).toBe(true);
		const outerPoints = outerCurve.get("Points") as EntityInstance[];
		expect(outerPoints.map((p) => p.get("Coordinates"))).toEqual([
			[0.0, 0.0],
			[1.0, 0.0],
			[1.0, 1.0],
			[0.0, 1.0],
			[0.0, 0.0],
		]);
		// The closing point is a real re-reference of the very first point, not merely
		// an equal-by-value copy.
		expect(outerPoints[4].equals(outerPoints[0])).toBe(true);

		expect(plane.get("InnerBoundaries")).toEqual([]);
	});

	test("does not double-close an outer boundary the caller already explicitly closed", () => {
		const file = createTestFile(schema);
		const boundary = createEntity(file, { ifcClass: "IfcRelSpaceBoundary" });

		assignConnectionGeometry(file, {
			relSpaceBoundary: boundary,
			// The last point already repeats the first -- `np.allclose` should detect
			// this and drop the trailing duplicate before `close_polyline` re-adds it,
			// producing the same 5-point result as the "open" 4-point case above, not a
			// 6-point one.
			outerBoundary: [
				[0.0, 0.0],
				[1.0, 0.0],
				[1.0, 1.0],
				[0.0, 1.0],
				[0.0, 0.0],
			],
			location: [0.0, 0.0, 0.0],
			axis: [1.0, 0.0, 0.0],
			refDirection: [0.0, 0.0, 1.0],
		});

		const geometry = boundary.get("ConnectionGeometry") as EntityInstance;
		const plane = geometry.get("SurfaceOnRelatingElement") as EntityInstance;
		const outerCurve = plane.get("OuterBoundary") as EntityInstance;
		const outerPoints = outerCurve.get("Points") as EntityInstance[];
		expect(outerPoints.map((p) => p.get("Coordinates"))).toEqual([
			[0.0, 0.0],
			[1.0, 0.0],
			[1.0, 1.0],
			[0.0, 1.0],
			[0.0, 0.0],
		]);
	});

	test("builds inner boundaries, such as for a window opening", () => {
		const file = createTestFile(schema);
		const boundary = createEntity(file, { ifcClass: "IfcRelSpaceBoundary" });

		assignConnectionGeometry(file, {
			relSpaceBoundary: boundary,
			outerBoundary: [
				[0.0, 0.0],
				[2.0, 0.0],
				[2.0, 2.0],
				[0.0, 2.0],
			],
			innerBoundaries: [
				[
					[0.5, 0.5],
					[1.0, 0.5],
					[1.0, 1.0],
					[0.5, 1.0],
				],
			],
			location: [0.0, 0.0, 0.0],
			axis: [1.0, 0.0, 0.0],
			refDirection: [0.0, 0.0, 1.0],
		});

		const geometry = boundary.get("ConnectionGeometry") as EntityInstance;
		const plane = geometry.get("SurfaceOnRelatingElement") as EntityInstance;
		const innerCurves = plane.get("InnerBoundaries") as EntityInstance[];
		expect(innerCurves).toHaveLength(1);
		expect(innerCurves[0].isA("IfcPolyline")).toBe(true);
		const innerPoints = innerCurves[0].get("Points") as EntityInstance[];
		expect(innerPoints.map((p) => p.get("Coordinates"))).toEqual([
			[0.5, 0.5],
			[1.0, 0.5],
			[1.0, 1.0],
			[0.5, 1.0],
			[0.5, 0.5],
		]);
	});
});
