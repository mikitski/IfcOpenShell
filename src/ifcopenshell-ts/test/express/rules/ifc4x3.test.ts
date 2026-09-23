// This file was generated with the assistance of an AI coding tool.
//
// Original, hand-rolled coverage for Phase EX-2's IFC4X3 first chunk
// (planning/ifcopenshell-ts/70-express-rules-plan.md §4): the first 15 of
// IFC4X3_ADD2's 60 `calc_*` DERIVE functions (`src/express/rules/ifc4x3.ts`) and
// their wiring into `EntityInstance`'s attribute-read path (`entityInstance.ts`'s
// `.get()`). Real Python has no per-function unit test for individual `calc_*`
// formulas (confirmed directly by `ifc2x3.test.ts`'s own header comment, re-verified
// here too) -- every test below is original, with expected values hand-derived
// directly from the real `IFC4X3_ADD2.py` formula bodies in a comment next to each
// test, matching this project's established "cross-check the real formula, not just
// the TS port" convention.
//
// Gated with `describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))` throughout
// (`bootstrap.ts`'s own disclosure: IFC4X3 is not guaranteed to be registered in
// every build this suite runs in) rather than hard-assuming availability, matching
// `ifc2x3.test.ts`'s/`ifc4.test.ts`'s own IFC4X3-touching tests' precedent.
//
// Two genuine, disclosed real-Python bugs are deliberately pinned here, not worked
// around (see `../../src/express/rules/ifc4x3.ts`'s own header comment for the full
// citations, including exactly which of IFC2X3's/IFC4's own disclosed bugs each is
// shared with): `IfcFirstProjAxis`'s always-true tuple/list comparison (visible via a
// degenerate `Axis === X-axis` fixture on `calc_IfcAxis2Placement3D_P`),
// `IfcListToArray`'s rotation for `low === 0` (`calc_IfcBSplineCurve_ControlPoints`),
// and `IfcMakeArrayOfArray`'s list-int operator-precedence crash
// (`calc_IfcBSplineSurface_ControlPoints`, unconditional -- shared with `ifc4.ts`'s own
// second-chunk disclosed bug 1, genuinely absent from IFC2X3).

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../../src/entityInstance";
import * as ifc4x3 from "../../../src/express/rules/ifc4x3";
import { INDETERMINATE } from "../../../src/express/runtimeShim";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function ratios(direction: unknown): number[] {
	return (direction as EntityInstance & { DirectionRatios: number[] }).DirectionRatios;
}

function closeArray(actual: number[], expected: number[]) {
	expect(actual.length).toBe(expected.length);
	for (let i = 0; i < expected.length; i++) {
		expect(actual[i]).toBeCloseTo(expected[i], 10);
	}
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("express/rules/ifc4x3 -- calc_* functions", () => {
	// --- calc_IfcAxis1Placement_Z ---
	describe("calc_IfcAxis1Placement_Z", () => {
		// Python: `nvl(IfcNormalise(axis), IfcDirection(DirectionRatios=[0.0, 0.0, 1.0]))`.
		// `Axis` unset (null) -> `exists(None)` is false -> `IfcNormalise` returns `None`
		// -> `nvl` falls back to the default `[0, 0, 1]`.
		test("Axis unset -> default [0,0,1]", () => {
			const file = createTestFile("IFC4X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis1Placement", location, null);
			const z = ifc4x3.calc_IfcAxis1Placement_Z(placement as EntityInstance);
			closeArray(ratios(z), [0, 0, 1]);
		});

		// Axis = [0, 2, 0] (unnormalized) -> IfcNormalise divides by magnitude (2) -> [0, 1, 0].
		test("Axis set, unnormalized -> normalised in place", () => {
			const file = createTestFile("IFC4X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const axis = file.createEntity("IfcDirection", [0.0, 2.0, 0.0]);
			const placement = file.createEntity("IfcAxis1Placement", location, axis);
			const z = ifc4x3.calc_IfcAxis1Placement_Z(placement as EntityInstance);
			closeArray(ratios(z), [0, 1, 0]);
		});

		// True end-to-end test: read `.Z` through the normal EntityInstance attribute-read
		// path (the Proxy -> cache-miss -> `.get()` -> DERIVE dispatch), not by calling the
		// ported function directly. Also the chunk's own proof that the dispatch registry
		// key ("IFC4X3_ADD2", not "IFC4X3" -- see `ifc4x3.ts`'s own header comment) is
		// actually correct: if it were wrong, this real `createTestFile("IFC4X3")` instance
		// would throw "has no attribute 'Z'" instead of resolving.
		test("end-to-end: placement.Z resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis1Placement", location, null);
			const z = (placement as unknown as { Z: EntityInstance }).Z;
			expect(z.isA()).toBe("IfcDirection");
			closeArray(ratios(z), [0, 0, 1]);
		});
	});

	// --- calc_IfcAxis2Placement2D_P ---
	describe("calc_IfcAxis2Placement2D_P", () => {
		// Python: `IfcBuild2Axes(refdirection)` = `[d, IfcOrthogonalComplement(d)]` where
		// `d = nvl(IfcNormalise(refdirection), IfcDirection([1.0, 0.0]))`.
		// RefDirection unset -> d=[1,0]; OrthogonalComplement([1,0]) = [-DirectionRatios[2],
		// DirectionRatios[1]] = [-0, 1].
		test("RefDirection unset -> [[1,0], [0,1]]", () => {
			const file = createTestFile("IFC4X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement2D", location, null);
			const p = ifc4x3.calc_IfcAxis2Placement2D_P(placement as EntityInstance) as unknown[];
			expect(p).toHaveLength(2);
			closeArray(ratios(p[0]), [1, 0]);
			closeArray(ratios(p[1]), [0, 1]);
		});

		// RefDirection = [0,1] (already unit) -> d=[0,1]; OrthogonalComplement([0,1]) =
		// [-1, 0].
		test("RefDirection set -> [refdirection, orthogonal complement]", () => {
			const file = createTestFile("IFC4X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const refDirection = file.createEntity("IfcDirection", [0.0, 1.0]);
			const placement = file.createEntity("IfcAxis2Placement2D", location, refDirection);
			const p = ifc4x3.calc_IfcAxis2Placement2D_P(placement as EntityInstance) as unknown[];
			closeArray(ratios(p[0]), [0, 1]);
			closeArray(ratios(p[1]), [-1, 0]);
		});

		test("end-to-end: placement.P resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement2D", location, null);
			const p = (placement as unknown as { P: EntityInstance[] }).P;
			closeArray(ratios(p[0]), [1, 0]);
			closeArray(ratios(p[1]), [0, 1]);
		});
	});

	// --- calc_IfcAxis2Placement3D_P ---
	describe("calc_IfcAxis2Placement3D_P", () => {
		// Python: `IfcBuildAxes(axis, refdirection)`. Both unset -> hand-derived through
		// the full real formula chain (IfcNormalise/IfcFirstProjAxis/IfcCrossProduct):
		// d1 = [0,0,1] (default Z); d2 = FirstProjAxis(d1, null) = [1,0,0] (real Python's
		// own `IfcFirstProjAxis` -- the `!exists(arg)` branch's dead `else` never runs, see
		// disclosed bug #1, but here it doesn't matter: real Z is [0,0,1], not [1,0,0], so
		// the (dead) `else` would never have fired here anyway); middle =
		// Normalise(CrossProduct(d1,d2)).Orientation = [0,1,0]. Standard identity basis.
		test("Axis and RefDirection both unset -> standard identity basis", () => {
			const file = createTestFile("IFC4X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const p = ifc4x3.calc_IfcAxis2Placement3D_P(placement as EntityInstance) as unknown[];
			expect(p).toHaveLength(3);
			closeArray(ratios(p[0]), [1, 0, 0]);
			closeArray(ratios(p[1]), [0, 1, 0]);
			closeArray(ratios(p[2]), [0, 0, 1]);
		});

		// **Disclosed bug #1 pin** (see `ifc4x3.ts`'s own header comment -- shared with
		// IFC2X3's own disclosed bug 1 and IFC4's own disclosed bug 1): with `Axis` set to
		// exactly the X axis itself (`[1,0,0]`) and `RefDirection` unset, real Python's
		// `IfcFirstProjAxis` SHOULD (per the IFC spec's own intent) fall back to `[0,1,0]`
		// to avoid a degenerate cross product -- but its `!=` comparison (tuple vs. list)
		// is unconditionally `True`, so it always picks `[1,0,0]` regardless, producing
		// `d2` parallel to `d1`. The resulting cross product is then genuinely
		// zero-magnitude, and `IfcNormalise` of a zero-magnitude vector returns `None` --
		// so the middle ("Y") axis of `P` comes back as `runtimeShim.INDETERMINATE`
		// (real Python: `None`), not a real direction. `P[0]`/`P[2]` both degenerately
		// equal `[1,0,0]`.
		test("disclosed bug #1: Axis === X axis produces a degenerate P (dead else branch)", () => {
			const file = createTestFile("IFC4X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const axis = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, axis, null);
			const p = ifc4x3.calc_IfcAxis2Placement3D_P(placement as EntityInstance) as unknown[];
			closeArray(ratios(p[0]), [1, 0, 0]);
			closeArray(ratios(p[2]), [1, 0, 0]);
			expect(p[1]).toBe(INDETERMINATE);
		});

		test("end-to-end: placement.P resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const p = (placement as unknown as { P: EntityInstance[] }).P;
			closeArray(ratios(p[0]), [1, 0, 0]);
			closeArray(ratios(p[1]), [0, 1, 0]);
			closeArray(ratios(p[2]), [0, 0, 1]);
		});
	});

	// --- calc_IfcBSplineCurve_UpperIndexOnControlPoints / _ControlPoints ---
	describe("calc_IfcBSplineCurve_UpperIndexOnControlPoints", () => {
		// Python: `sizeof(controlpointslist) - 1`.
		test("3 control points -> upper index 2", () => {
			const file = createTestFile("IFC4X3");
			const points = [
				file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
				file.createEntity("IfcCartesianPoint", [1.0, 0.0]),
				file.createEntity("IfcCartesianPoint", [2.0, 0.0]),
			];
			const curve = file.createEntity("IfcBSplineCurve", 3, points, "UNSPECIFIED", false, false);
			expect(ifc4x3.calc_IfcBSplineCurve_UpperIndexOnControlPoints(curve as EntityInstance)).toBe(2);
		});

		test("end-to-end: curve.UpperIndexOnControlPoints resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4X3");
			const points = [
				file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
				file.createEntity("IfcCartesianPoint", [1.0, 0.0]),
			];
			const curve = file.createEntity("IfcBSplineCurve", 2, points, "UNSPECIFIED", false, false);
			expect((curve as unknown as { UpperIndexOnControlPoints: number }).UpperIndexOnControlPoints).toBe(1);
		});
	});

	describe("calc_IfcBSplineCurve_ControlPoints", () => {
		// **Disclosed bug #2 pin** (see `ifc4x3.ts`'s own header comment -- shared with
		// IFC2X3's own disclosed bug 3 and IFC4's own disclosed bug 3): real Python's
		// `IfcListToArray(ControlPointsList, 0, UpperIndexOnControlPoints)` cyclically
		// LEFT-ROTATES its input by one position for `low === 0` (hand-derived
		// symbolically: `res == [lis[1], lis[2], ..., lis[n-1], lis[0]]`), rather than
		// copying it in the same order -- ported faithfully, not silently fixed to an
		// identity copy. For 3 points [p0, p1, p2], the real (buggy) result is
		// [p1, p2, p0].
		test("3 control points -> cyclically rotated, NOT an identity copy (real bug, preserved)", () => {
			const file = createTestFile("IFC4X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0]);
			const p2 = file.createEntity("IfcCartesianPoint", [2.0, 0.0]);
			const curve = file.createEntity("IfcBSplineCurve", 3, [p0, p1, p2], "UNSPECIFIED", false, false);
			const controlPoints = ifc4x3.calc_IfcBSplineCurve_ControlPoints(curve as EntityInstance) as EntityInstance[];
			expect(controlPoints.map((p) => (p as unknown as { Coordinates: number[] }).Coordinates)).toEqual([
				[1, 0],
				[2, 0],
				[0, 0],
			]);
		});
	});

	// --- calc_IfcBSplineCurveWithKnots_UpperIndexOnKnots ---
	describe("calc_IfcBSplineCurveWithKnots_UpperIndexOnKnots", () => {
		// Python: `sizeof(Knots)`.
		function buildCurve(file: IfcFile, knots: number[]) {
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0]);
			const p2 = file.createEntity("IfcCartesianPoint", [2.0, 0.0]);
			// Degree, ControlPointsList, CurveForm, ClosedCurve, SelfIntersect,
			// KnotMultiplicities, Knots, KnotSpec.
			return file.createEntity(
				"IfcBSplineCurveWithKnots",
				2,
				[p0, p1, p2],
				"UNSPECIFIED",
				false,
				false,
				[3, 3],
				knots,
				"UNSPECIFIED",
			);
		}

		test("3 knots -> UpperIndexOnKnots = 3", () => {
			const file = createTestFile("IFC4X3");
			const curve = buildCurve(file, [0.0, 0.5, 1.0]);
			expect(ifc4x3.calc_IfcBSplineCurveWithKnots_UpperIndexOnKnots(curve as EntityInstance)).toBe(3);
		});

		test("end-to-end: curve.UpperIndexOnKnots resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4X3");
			const curve = buildCurve(file, [0.0, 0.5, 1.0]);
			expect((curve as unknown as { UpperIndexOnKnots: number }).UpperIndexOnKnots).toBe(3);
		});
	});

	// --- calc_IfcBSplineSurface_UUpper / _VUpper / _ControlPoints ---
	describe("calc_IfcBSplineSurface_UUpper / _VUpper / _ControlPoints", () => {
		function grid(file: IfcFile, rows: number, cols: number): EntityInstance[][] {
			const result: EntityInstance[][] = [];
			for (let r = 0; r < rows; r++) {
				const row: EntityInstance[] = [];
				for (let c = 0; c < cols; c++) {
					row.push(file.createEntity("IfcCartesianPoint", [r, c]));
				}
				result.push(row);
			}
			return result;
		}

		function buildSurface(file: IfcFile, rows: number, cols: number) {
			// UDegree, VDegree, ControlPointsList, SurfaceForm, UClosed, VClosed, SelfIntersect.
			return file.createEntity("IfcBSplineSurface", 3, 3, grid(file, rows, cols), "UNSPECIFIED", false, false, false);
		}

		// Python: `sizeof(ControlPointsList) - 1`. A 3-row grid -> UUpper = 2.
		test("calc_IfcBSplineSurface_UUpper: 3 rows -> 2", () => {
			const file = createTestFile("IFC4X3");
			const surface = buildSurface(file, 3, 4);
			expect(ifc4x3.calc_IfcBSplineSurface_UUpper(surface as EntityInstance)).toBe(2);
		});

		// Python: `sizeof(ControlPointsList[0]) - 1`. A 4-column grid -> VUpper = 3.
		test("calc_IfcBSplineSurface_VUpper: 4 columns -> 3", () => {
			const file = createTestFile("IFC4X3");
			const surface = buildSurface(file, 3, 4);
			expect(ifc4x3.calc_IfcBSplineSurface_VUpper(surface as EntityInstance)).toBe(3);
		});

		// **Disclosed bug #3 pin** (see `ifc4x3.ts`'s own header comment -- shared with
		// `ifc4.ts`'s own second-chunk disclosed bug 1, genuinely absent from IFC2X3):
		// `IfcMakeArrayOfArray` (delegated to by `calc_IfcBSplineSurface_ControlPoints`)
		// unconditionally raises a TypeError-equivalent for any structurally valid
		// `IfcBSplineSurface` -- ported as a thrown error, not silently "fixed".
		test("disclosed bug #3: ControlPoints always throws (real Python crashes here too)", () => {
			const file = createTestFile("IFC4X3");
			const surface = buildSurface(file, 3, 4);
			expect(() => ifc4x3.calc_IfcBSplineSurface_ControlPoints(surface as EntityInstance)).toThrow(
				/unsupported operand type/,
			);
		});

		test("end-to-end: surface.UUpper/.VUpper resolve through the normal attribute-read path", () => {
			const file = createTestFile("IFC4X3");
			const surface = buildSurface(file, 3, 4);
			expect((surface as unknown as { UUpper: number }).UUpper).toBe(2);
			expect((surface as unknown as { VUpper: number }).VUpper).toBe(3);
		});
	});

	// --- calc_IfcBSplineSurfaceWithKnots_KnotUUpper / _KnotVUpper ---
	describe("calc_IfcBSplineSurfaceWithKnots_KnotUUpper / _KnotVUpper", () => {
		function buildSurface(file: IfcFile, uKnots: number[], vKnots: number[]) {
			const points = [
				[file.createEntity("IfcCartesianPoint", [0, 0]), file.createEntity("IfcCartesianPoint", [0, 1])],
				[file.createEntity("IfcCartesianPoint", [1, 0]), file.createEntity("IfcCartesianPoint", [1, 1])],
			];
			// UDegree, VDegree, ControlPointsList, SurfaceForm, UClosed, VClosed,
			// SelfIntersect, UMultiplicities, VMultiplicities, UKnots, VKnots, KnotSpec.
			return file.createEntity(
				"IfcBSplineSurfaceWithKnots",
				1,
				1,
				points,
				"UNSPECIFIED",
				false,
				false,
				false,
				[2, 2],
				[2, 2],
				uKnots,
				vKnots,
				"UNSPECIFIED",
			);
		}

		// Python: `sizeof(UKnots)` / `sizeof(VKnots)`.
		test("KnotUUpper = sizeof(UKnots), KnotVUpper = sizeof(VKnots)", () => {
			const file = createTestFile("IFC4X3");
			const surface = buildSurface(file, [0.0, 1.0], [0.0, 0.5, 1.0]);
			expect(ifc4x3.calc_IfcBSplineSurfaceWithKnots_KnotUUpper(surface as EntityInstance)).toBe(2);
			expect(ifc4x3.calc_IfcBSplineSurfaceWithKnots_KnotVUpper(surface as EntityInstance)).toBe(3);
		});

		test("end-to-end: surface.KnotUUpper/.KnotVUpper resolve through the normal attribute-read path", () => {
			const file = createTestFile("IFC4X3");
			const surface = buildSurface(file, [0.0, 1.0], [0.0, 0.5, 1.0]);
			expect((surface as unknown as { KnotUUpper: number }).KnotUUpper).toBe(2);
			expect((surface as unknown as { KnotVUpper: number }).KnotVUpper).toBe(3);
		});
	});

	// --- calc_IfcBooleanResult_Dim ---
	describe("calc_IfcBooleanResult_Dim", () => {
		// Python: `express_getattr(firstoperand, 'Dim', INDETERMINATE)`. FirstOperand is an
		// `IfcExtrudedAreaSolid` (`IfcSweptAreaSolid` -> `IfcSolidModel`, whose own `Dim`
		// is the constant `3`, `calc_IfcSolidModel_Dim` -- one of this chunk's own 3
		// necessary, disclosed extra functions, see `ifc4x3.ts`'s header comment).
		test("FirstOperand.Dim resolves via the supertype chain to IfcSolidModel's constant 3", () => {
			const file = createTestFile("IFC4X3");
			const profile = file.createEntity("IfcRectangleProfileDef", "AREA", null, null, 2.0, 3.0);
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const direction = file.createEntity("IfcDirection", [0.0, 0.0, 1.0]);
			const extruded = file.createEntity("IfcExtrudedAreaSolid", profile, placement, direction, 5.0);
			const half = file.createEntity("IfcHalfSpaceSolid");
			const booleanResult = file.createEntity("IfcBooleanResult", "DIFFERENCE", extruded, half);
			expect(ifc4x3.calc_IfcBooleanResult_Dim(booleanResult as EntityInstance)).toBe(3);
		});

		test("end-to-end: booleanResult.Dim resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4X3");
			const profile = file.createEntity("IfcRectangleProfileDef", "AREA", null, null, 2.0, 3.0);
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const direction = file.createEntity("IfcDirection", [0.0, 0.0, 1.0]);
			const extruded = file.createEntity("IfcExtrudedAreaSolid", profile, placement, direction, 5.0);
			const half = file.createEntity("IfcHalfSpaceSolid");
			const booleanResult = file.createEntity("IfcBooleanResult", "DIFFERENCE", extruded, half);
			expect((booleanResult as unknown as { Dim: number }).Dim).toBe(3);
		});
	});

	// --- calc_IfcBoundingBox_Dim ---
	describe("calc_IfcBoundingBox_Dim", () => {
		// Python: `return 3` (unconditional constant).
		test("always 3", () => {
			const file = createTestFile("IFC4X3");
			const corner = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const bbox = file.createEntity("IfcBoundingBox", corner, 1.0, 2.0, 3.0);
			expect(ifc4x3.calc_IfcBoundingBox_Dim(bbox as EntityInstance)).toBe(3);
		});

		test("end-to-end: bbox.Dim resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4X3");
			const corner = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const bbox = file.createEntity("IfcBoundingBox", corner, 1.0, 2.0, 3.0);
			expect((bbox as unknown as { Dim: number }).Dim).toBe(3);
		});
	});

	// --- calc_IfcCartesianPointList_Dim ---
	describe("calc_IfcCartesianPointList_Dim", () => {
		// Python: `IfcPointListDim(self)` -- dispatches on the concrete
		// IfcCartesianPointList2D/3D subtype (genuinely IFC4-and-later-only, no IFC2X3
		// equivalent).
		test("IfcCartesianPointList2D -> 2", () => {
			const file = createTestFile("IFC4X3");
			const pointList = file.createEntity("IfcCartesianPointList2D", [
				[0.0, 0.0],
				[1.0, 1.0],
			]);
			expect(ifc4x3.calc_IfcCartesianPointList_Dim(pointList as EntityInstance)).toBe(2);
		});

		test("IfcCartesianPointList3D -> 3", () => {
			const file = createTestFile("IFC4X3");
			const pointList = file.createEntity("IfcCartesianPointList3D", [
				[0.0, 0.0, 0.0],
				[1.0, 1.0, 1.0],
			]);
			expect(ifc4x3.calc_IfcCartesianPointList_Dim(pointList as EntityInstance)).toBe(3);
		});

		test("end-to-end: pointList.Dim resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4X3");
			const pointList = file.createEntity("IfcCartesianPointList3D", [[0.0, 0.0, 0.0]]);
			expect((pointList as unknown as { Dim: number }).Dim).toBe(3);
		});
	});

	// --- calc_IfcCartesianTransformationOperator_Scl ---
	describe("calc_IfcCartesianTransformationOperator_Scl", () => {
		// Python: `nvl(scale, 1.0)`. `Scale` unset -> defaults to `1.0`.
		test("Scale unset -> defaults to 1.0", () => {
			const file = createTestFile("IFC4X3");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const operator = file.createEntity("IfcCartesianTransformationOperator2D", null, null, origin, null);
			expect(ifc4x3.calc_IfcCartesianTransformationOperator_Scl(operator as EntityInstance)).toBe(1.0);
		});

		// `Scale` set -> `nvl` returns it unchanged.
		test("Scale set -> returned unchanged", () => {
			const file = createTestFile("IFC4X3");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const operator = file.createEntity("IfcCartesianTransformationOperator2D", null, null, origin, 2.5);
			expect(ifc4x3.calc_IfcCartesianTransformationOperator_Scl(operator as EntityInstance)).toBe(2.5);
		});

		// End-to-end: `Scl` is declared on the ABSTRACT supertype `IfcCartesianTransformationOperator`
		// (registry key `"IfcCartesianTransformationOperator.Scl"`) -- reading it off a
		// concrete `IfcCartesianTransformationOperator2D` instance exercises the
		// DERIVE-dispatch supertype walk directly, not just a same-class registry hit.
		test("end-to-end: operator.Scl resolves via the supertype chain through the normal attribute-read path", () => {
			const file = createTestFile("IFC4X3");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const operator = file.createEntity("IfcCartesianTransformationOperator2D", null, null, origin, null);
			expect((operator as unknown as { Scl: number }).Scl).toBe(1.0);
		});
	});

	// --- the 3 minimal, necessary, disclosed extra functions ---
	describe("calc_IfcDirection_Dim / calc_IfcVector_Dim / calc_IfcSolidModel_Dim", () => {
		test("calc_IfcDirection_Dim: hiindex(DirectionRatios)", () => {
			const file = createTestFile("IFC4X3");
			const direction = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
			expect(ifc4x3.calc_IfcDirection_Dim(direction as EntityInstance)).toBe(3);
		});

		test("calc_IfcVector_Dim: delegates to Orientation.Dim", () => {
			const file = createTestFile("IFC4X3");
			const direction = file.createEntity("IfcDirection", [1.0, 0.0]);
			const vector = file.createEntity("IfcVector", direction, 1.0);
			expect(ifc4x3.calc_IfcVector_Dim(vector as EntityInstance)).toBe(2);
		});

		test("calc_IfcSolidModel_Dim: always 3", () => {
			const file = createTestFile("IFC4X3");
			const half = file.createEntity("IfcHalfSpaceSolid") as EntityInstance;
			expect(ifc4x3.calc_IfcSolidModel_Dim(half)).toBe(3);
		});

		test("end-to-end: direction.Dim / vector.Dim resolve through the normal attribute-read path", () => {
			const file = createTestFile("IFC4X3");
			const direction = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
			expect((direction as unknown as { Dim: number }).Dim).toBe(3);
			const vector = file.createEntity("IfcVector", direction, 1.0);
			expect((vector as unknown as { Dim: number }).Dim).toBe(3);
		});
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))(
	"EntityInstance DERIVE-dispatch wiring (entityInstance.ts, IFC4X3)",
	() => {
		test("a genuinely nonexistent attribute still throws the same error as before this chunk", () => {
			const file: IfcFile = createTestFile("IFC4X3");
			const point = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
			expect(() => (point as unknown as { NotARealAttribute: unknown }).NotARealAttribute).toThrow(
				/has no attribute 'NotARealAttribute'/,
			);
		});

		// `IfcCartesianPoint.Dim` is a real EXPRESS DERIVE attribute on IFC2X3/IFC4, but
		// IFC4X3_ADD2 consolidated it into a NEW, differently-named formula at an abstract
		// supertype level (`calc_IfcPoint_Dim`, `IFC4X3_ADD2.py` line 9831 -- see `ifc4x3.ts`'s
		// own header comment for the full writeup) -- NOT one of this chunk's own assigned
		// 15, and not byte-identical/same-named to anything IFC2X3/IFC4 chunk 1 ported
		// either, so it remains a genuine dispatch MISS after this chunk. Demonstrates the
		// dispatch mechanism's own supertype walk reaching `IfcPoint` and finding nothing
		// registered there, distinct from `test/express/rules/ifc2x3.test.ts`'s own
		// `IfcSIUnit.Dimensions`-based demonstration (a different still-unported function).
		test("IfcCartesianPoint.Dim is a genuine dispatch MISS on IFC4X3 (calc_IfcPoint_Dim, not calc_IfcCartesianPoint_Dim, and not one of this chunk's 15)", () => {
			const file: IfcFile = createTestFile("IFC4X3");
			const point = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
			expect(() => (point as unknown as { Dim: unknown }).Dim).toThrow(/has no attribute 'Dim'/);
		});
	},
);
