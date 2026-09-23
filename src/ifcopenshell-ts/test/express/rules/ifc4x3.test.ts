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

// =============================================================================
// Original, hand-rolled coverage for Phase EX-2's IFC4X3 SECOND chunk
// (planning/ifcopenshell-ts/70-express-rules-plan.md §4): 15 more of IFC4X3_ADD2's 60
// `calc_*` DERIVE functions (`src/express/rules/ifc4x3.ts`) -- see that file's own
// header comment (the "second chunk" section) for the full byte-identical-vs-
// genuinely-different diffing writeup against IFC4/IFC2X3, the `IfcCurveDim`/
// `IfcGetBasisSurface` restructuring findings (including the permanently dead
// `IfcCurveSegment2D` branch), and the cascading-test-check this chunk performed
// elsewhere in the suite (`shapeBuilder.test.ts`, `addSurveyPoint.test.ts`).
// =============================================================================
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))(
	"express/rules/ifc4x3 -- calc_* functions (Phase EX-2, IFC4X3 chunk 2)",
	() => {
		// --- calc_IfcCartesianTransformationOperator_Dim ---
		describe("calc_IfcCartesianTransformationOperator_Dim", () => {
			// Python: `express_getattr(localorigin, 'Dim', INDETERMINATE)` -- LocalOrigin's
			// own Dim. `LocalOrigin.Dim` is itself DERIVE at the `IfcPoint` supertype level
			// (`calc_IfcPoint_Dim` -> `IfcPointDim`, ADD2's own consolidated formula).
			//
			// **UPDATE (Phase EX-2, IFC4X3's own THIRD chunk, `src/express/rules/ifc4x3.ts`):**
			// `calc_IfcPoint_Dim` is now ported (one of that chunk's own 15 assigned
			// functions) -- `LocalOrigin.Dim` now resolves to a REAL number
			// (`hiIndex(Coordinates)` via `IfcPointDim`'s own `IfcCartesianPoint` branch),
			// not `INDETERMINATE` -- re-verified directly against the real built addon, not
			// assumed. Updated to assert the new, real, resolved value.
			test("LocalOrigin.Dim now resolves to a real number via the newly-ported calc_IfcPoint_Dim (IFC4X3 chunk 3)", () => {
				const file = createTestFile("IFC4X3");
				const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const operator = file.createEntity("IfcCartesianTransformationOperator2D", null, null, origin, null);
				expect(ifc4x3.calc_IfcCartesianTransformationOperator_Dim(operator as EntityInstance)).toBe(2);
			});
		});

		// --- calc_IfcCartesianTransformationOperator2D_U (needs the newly-ported IfcBaseAxis) ---
		describe("calc_IfcCartesianTransformationOperator2D_U", () => {
			// Python: `IfcBaseAxis(2, Axis1, Axis2, None)`. Both unset -> the final `else`
			// branch: `[IfcDirection([1,0]), IfcDirection([0,1])]`.
			test("Axis1 and Axis2 both unset -> [[1,0],[0,1]]", () => {
				const file = createTestFile("IFC4X3");
				const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const operator = file.createEntity("IfcCartesianTransformationOperator2D", null, null, origin, null);
				const u = ifc4x3.calc_IfcCartesianTransformationOperator2D_U(operator as EntityInstance) as unknown[];
				closeArray(ratios(u[0]), [1, 0]);
				closeArray(ratios(u[1]), [0, 1]);
			});

			// **Disclosed bug 1b pin** (see `ifc4x3.ts`'s own header comment -- shared with
			// IFC2X3's/IFC4's own disclosed bug 2b): `Axis1` unset, `Axis2` set -- real
			// Python's `IfcBaseAxis` unconditionally hits a tuple-mutation `TypeError`.
			// Ported as an equivalent thrown error.
			test("disclosed bug 1b: Axis1 unset, Axis2 set -> throws (real Python crashes here too)", () => {
				const file = createTestFile("IFC4X3");
				const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const axis2 = file.createEntity("IfcDirection", [0.0, 1.0]);
				const operator = file.createEntity("IfcCartesianTransformationOperator2D", null, axis2, origin, null);
				expect(() => ifc4x3.calc_IfcCartesianTransformationOperator2D_U(operator as EntityInstance)).toThrow(
					/does not support item assignment/,
				);
			});

			test("end-to-end: operator.U resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const operator = file.createEntity("IfcCartesianTransformationOperator2D", null, null, origin, null);
				const u = (operator as unknown as { U: EntityInstance[] }).U;
				closeArray(ratios(u[0]), [1, 0]);
				closeArray(ratios(u[1]), [0, 1]);
			});
		});

		// --- calc_IfcCartesianTransformationOperator2DnonUniform_Scl2 ---
		describe("calc_IfcCartesianTransformationOperator2DnonUniform_Scl2", () => {
			// Python: `nvl(scale2, express_getattr(self, 'Scl', INDETERMINATE))`.
			test("Scale2 and Scale both unset -> falls back through Scl's own default (1.0)", () => {
				const file = createTestFile("IFC4X3");
				const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const operator = file.createEntity(
					"IfcCartesianTransformationOperator2DnonUniform",
					null,
					null,
					origin,
					null,
					null,
				);
				expect(ifc4x3.calc_IfcCartesianTransformationOperator2DnonUniform_Scl2(operator as EntityInstance)).toBe(1.0);
			});

			test("Scale2 set -> that value, independent of Scale", () => {
				const file = createTestFile("IFC4X3");
				const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const operator = file.createEntity(
					"IfcCartesianTransformationOperator2DnonUniform",
					null,
					null,
					origin,
					2.0,
					4.0,
				);
				expect(ifc4x3.calc_IfcCartesianTransformationOperator2DnonUniform_Scl2(operator as EntityInstance)).toBe(4.0);
			});
		});

		// --- calc_IfcCartesianTransformationOperator3D_U ---
		describe("calc_IfcCartesianTransformationOperator3D_U", () => {
			// Python: `IfcBaseAxis(3, Axis1, Axis2, Axis3)`. All unset -> standard identity
			// basis (same hand-derivation as `calc_IfcAxis2Placement3D_P`'s identity case,
			// via `IfcSecondProjAxis` for the middle term).
			test("Axis1/Axis2/Axis3 all unset -> standard identity basis", () => {
				const file = createTestFile("IFC4X3");
				const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const operator = file.createEntity("IfcCartesianTransformationOperator3D", null, null, origin, null, null);
				const u = ifc4x3.calc_IfcCartesianTransformationOperator3D_U(operator as EntityInstance) as unknown[];
				closeArray(ratios(u[0]), [1, 0, 0]);
				closeArray(ratios(u[1]), [0, 1, 0]);
				closeArray(ratios(u[2]), [0, 0, 1]);
			});

			test("end-to-end: operator.U resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const operator = file.createEntity("IfcCartesianTransformationOperator3D", null, null, origin, null, null);
				const u = (operator as unknown as { U: EntityInstance[] }).U;
				closeArray(ratios(u[0]), [1, 0, 0]);
				closeArray(ratios(u[1]), [0, 1, 0]);
				closeArray(ratios(u[2]), [0, 0, 1]);
			});
		});

		// --- calc_IfcCartesianTransformationOperator3DnonUniform_Scl2 / _Scl3 ---
		describe("calc_IfcCartesianTransformationOperator3DnonUniform_Scl2/_Scl3", () => {
			test("Scale2/Scale3 unset, Scale=3.0 -> both fall back to Scl=3.0", () => {
				const file = createTestFile("IFC4X3");
				const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const operator = file.createEntity(
					"IfcCartesianTransformationOperator3DnonUniform",
					null,
					null,
					origin,
					3.0,
					null,
					null,
					null,
				);
				expect(ifc4x3.calc_IfcCartesianTransformationOperator3DnonUniform_Scl2(operator as EntityInstance)).toBe(3.0);
				expect(ifc4x3.calc_IfcCartesianTransformationOperator3DnonUniform_Scl3(operator as EntityInstance)).toBe(3.0);
			});

			test("Scale2/Scale3 set -> their own values", () => {
				const file = createTestFile("IFC4X3");
				const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const operator = file.createEntity(
					"IfcCartesianTransformationOperator3DnonUniform",
					null,
					null,
					origin,
					3.0,
					null,
					5.0,
					7.0,
				);
				expect(ifc4x3.calc_IfcCartesianTransformationOperator3DnonUniform_Scl2(operator as EntityInstance)).toBe(5.0);
				expect(ifc4x3.calc_IfcCartesianTransformationOperator3DnonUniform_Scl3(operator as EntityInstance)).toBe(7.0);
			});
		});

		// --- calc_IfcCompositeCurve_NSegments / _ClosedCurve ---
		describe("calc_IfcCompositeCurve_NSegments / _ClosedCurve", () => {
			// `Segments` is `LIST OF IfcSegment` on ADD2 (an abstract supertype with exactly
			// 2 concrete subtypes) -- `IfcCompositeCurveSegment` still works fine as a
			// fixture here since these 2 functions only ever touch `Transition`/`sizeof`,
			// both declared at the `IfcSegment` supertype level.
			function buildComposite(file: IfcFile, transitions: string[]) {
				const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
				const polyline = file.createEntity("IfcPolyline", [p0, p1]);
				const segments = transitions.map((t) => file.createEntity("IfcCompositeCurveSegment", t, true, polyline));
				return file.createEntity("IfcCompositeCurve", segments, false);
			}

			test("NSegments = sizeof(Segments)", () => {
				const file = createTestFile("IFC4X3");
				const composite = buildComposite(file, ["CONTINUOUS", "CONTINUOUS"]);
				expect(ifc4x3.calc_IfcCompositeCurve_NSegments(composite as EntityInstance)).toBe(2);
			});

			// Python: `Segments[NSegments - 1].Transition != discontinuous` -- the LAST
			// segment's own Transition decides the result.
			test("last segment CONTINUOUS -> closed (true)", () => {
				const file = createTestFile("IFC4X3");
				const composite = buildComposite(file, ["DISCONTINUOUS", "CONTINUOUS"]);
				expect(ifc4x3.calc_IfcCompositeCurve_ClosedCurve(composite as EntityInstance)).toBe(true);
			});

			test("last segment DISCONTINUOUS -> not closed (false)", () => {
				const file = createTestFile("IFC4X3");
				const composite = buildComposite(file, ["CONTINUOUS", "DISCONTINUOUS"]);
				expect(ifc4x3.calc_IfcCompositeCurve_ClosedCurve(composite as EntityInstance)).toBe(false);
			});

			test("end-to-end: composite.ClosedCurve resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const composite = buildComposite(file, ["DISCONTINUOUS", "CONTINUOUS"]);
				expect((composite as unknown as { ClosedCurve: boolean }).ClosedCurve).toBe(true);
			});
		});

		// --- calc_IfcCompositeCurveOnSurface_BasisSurface (genuinely different from IFC4's own) ---
		describe("calc_IfcCompositeCurveOnSurface_BasisSurface", () => {
			function buildOnSurface(file: IfcFile, parentCurves: EntityInstance[]) {
				const segments = parentCurves.map((pc) =>
					file.createEntity("IfcCompositeCurveSegment", "CONTINUOUS", true, pc),
				);
				return file.createEntity("IfcCompositeCurveOnSurface", segments, false);
			}

			// Single segment, ParentCurve = a plain IfcPolyline (neither IfcPcurve nor
			// IfcSurfaceCurve nor IfcCompositeCurveOnSurface) -> the first segment is an
			// `IfcCompositeCurveSegment`, so `ifcGetBasisSurface` recurses into its
			// ParentCurve, which matches none of ITS OWN branches -> [].
			test("single segment, plain-curve ParentCurve -> [] (no basis surface concept)", () => {
				const file = createTestFile("IFC4X3");
				const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
				const polyline = file.createEntity("IfcPolyline", [p0, p1]);
				const onSurface = buildOnSurface(file, [polyline]);
				expect(ifc4x3.calc_IfcCompositeCurveOnSurface_BasisSurface(onSurface as EntityInstance)).toEqual([]);
			});

			// Single segment, ParentCurve = a real IfcPcurve -> the non-buggy
			// `'ifc4x3_add2.ifcpcurve' in typeof(c)` branch: `[c.BasisSurface]`.
			test("single segment, IfcPcurve ParentCurve -> [pcurve.BasisSurface]", () => {
				const file = createTestFile("IFC4X3");
				const planeLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const planePlacement = file.createEntity("IfcAxis2Placement3D", planeLocation, null, null);
				const plane = file.createEntity("IfcPlane", planePlacement);
				const refCurvePnt = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const refCurveDir = file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0);
				const referenceCurve = file.createEntity("IfcLine", refCurvePnt, refCurveDir);
				const pcurve = file.createEntity("IfcPcurve", plane, referenceCurve);
				const onSurface = buildOnSurface(file, [pcurve]);
				const result = ifc4x3.calc_IfcCompositeCurveOnSurface_BasisSurface(
					onSurface as EntityInstance,
				) as EntityInstance[];
				expect(result).toHaveLength(1);
				expect(result[0].equals(plane)).toBe(true);
			});

			// **Disclosed bug 3 pin** (2 segments, both real `IfcCompositeCurveSegment`s --
			// the ADD2-specific type-check gate is satisfied -- unconditionally throws,
			// list * list).
			test("disclosed bug 3: 2 segments -> throws (real Python crashes here too)", () => {
				const file = createTestFile("IFC4X3");
				const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
				const polyline = file.createEntity("IfcPolyline", [p0, p1]);
				const onSurface = buildOnSurface(file, [polyline, polyline]);
				expect(() => ifc4x3.calc_IfcCompositeCurveOnSurface_BasisSurface(onSurface as EntityInstance)).toThrow(
					/list \* list/,
				);
			});

			// **Disclosed bug 2 pin**: a single segment whose ParentCurve is itself an
			// IfcSurfaceCurve unconditionally throws (list + non-list).
			test("disclosed bug 2: IfcSurfaceCurve ParentCurve -> throws (real Python crashes here too)", () => {
				const file = createTestFile("IFC4X3");
				const planeLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const planePlacement = file.createEntity("IfcAxis2Placement3D", planeLocation, null, null);
				const plane = file.createEntity("IfcPlane", planePlacement);
				const refCurvePnt = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const refCurveDir = file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0);
				const referenceCurve = file.createEntity("IfcLine", refCurvePnt, refCurveDir);
				const pcurve = file.createEntity("IfcPcurve", plane, referenceCurve);
				const curve3dPnt = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const curve3dDir = file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0, 0.0]), 1.0);
				const curve3d = file.createEntity("IfcLine", curve3dPnt, curve3dDir);
				const surfaceCurve = file.createEntity("IfcSurfaceCurve", curve3d, [pcurve], "CURVE3D");
				const onSurface = buildOnSurface(file, [surfaceCurve]);
				expect(() => ifc4x3.calc_IfcCompositeCurveOnSurface_BasisSurface(onSurface as EntityInstance)).toThrow(
					/list \+ non-list/,
				);
			});
		});

		// --- calc_IfcCsgPrimitive3D_Dim ---
		describe("calc_IfcCsgPrimitive3D_Dim", () => {
			test("always 3", () => {
				const file = createTestFile("IFC4X3");
				const csgPrimitive = file.createEntity("IfcCsgPrimitive3D");
				expect(ifc4x3.calc_IfcCsgPrimitive3D_Dim(csgPrimitive as EntityInstance)).toBe(3);
			});
		});

		// --- calc_IfcCurve_Dim / IfcCurveDim (all branches, including the 7 genuinely NEW to ADD2) ---
		//
		// **UPDATE (Phase EX-2, IFC4X3's own THIRD chunk, `src/express/rules/ifc4x3.ts`):**
		// that chunk ports both `calc_IfcPoint_Dim` (closing the "no ported `.Dim`
		// formula reachable from a plain `IfcCartesianPoint`" gap this comment originally
		// documented) and `calc_IfcPlacement_Dim` together -- re-verified directly
		// against the real built addon (not assumed from the dependency chain alone):
		// `IfcCurveDim`'s `IfcLine`/`IfcPolyline`/`IfcTrimmedCurve`/`IfcBSplineCurve`
		// branches (bottoming out on a plain `IfcCartesianPoint`) and its
		// `IfcConic`/`IfcSpiral` branches (bottoming out on an `IfcPlacement` subtype's
		// `Position.Dim`) ALL now resolve to REAL numbers, updated below. **The ONLY
		// branch that remains `INDETERMINATE` is `IfcCompositeCurve`'s own
		// `Segments[0].Dim`** -- blocked by a SEPARATE, still genuinely unported
		// dependency (`calc_IfcSegment_Dim`/`calc_IfcCompositeCurveSegment_Dim`, not one
		// of this chunk's own 15 either) -- see that test below, unchanged.
		describe("calc_IfcCurve_Dim", () => {
			test("IfcLine -> Pnt.Dim -> now resolves to a real number (calc_IfcPoint_Dim ported, IFC4X3 chunk 3)", () => {
				const file = createTestFile("IFC4X3");
				const pnt = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const line = file.createEntity("IfcLine", pnt, null);
				expect(ifc4x3.calc_IfcCurve_Dim(line as EntityInstance)).toBe(3);
			});

			// `IfcConic`'s branch reads `Position.Dim` -- `Position` is an
			// `IfcAxis2Placement3D`, whose own `Dim` is DERIVE at the `IfcPlacement`
			// supertype level (`calc_IfcPlacement_Dim`, ported by IFC4X3's own third
			// chunk) -> `Location.Dim` (an `IfcCartesianPoint`, resolved via the same
			// chunk's `calc_IfcPoint_Dim`) -- now resolves to a real number.
			test("IfcCircle (IfcConic subtype) -> Position.Dim now resolves to a real number (calc_IfcPlacement_Dim ported, IFC4X3 chunk 3)", () => {
				const file = createTestFile("IFC4X3");
				const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
				const circle = file.createEntity("IfcCircle", placement, 5.0);
				expect(ifc4x3.calc_IfcCurve_Dim(circle as EntityInstance)).toBe(3);
			});

			test("IfcPolyline -> Points[0].Dim -> now resolves to a real number (calc_IfcPoint_Dim ported, IFC4X3 chunk 3)", () => {
				const file = createTestFile("IFC4X3");
				const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
				const polyline = file.createEntity("IfcPolyline", [p0, p1]);
				expect(ifc4x3.calc_IfcCurve_Dim(polyline as EntityInstance)).toBe(2);
			});

			test("IfcTrimmedCurve -> recurses into IfcCurveDim(BasisCurve) -> now resolves to a real number (via the IfcPolyline it recurses into)", () => {
				const file = createTestFile("IFC4X3");
				const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
				const polyline = file.createEntity("IfcPolyline", [p0, p1]);
				const trimmed = file.createEntity("IfcTrimmedCurve", polyline);
				expect(ifc4x3.calc_IfcCurve_Dim(trimmed as EntityInstance)).toBe(2);
			});

			test("IfcTrimmedCurve with an unset BasisCurve -> null, not a crash (disclosed fix)", () => {
				const file = createTestFile("IFC4X3");
				const trimmed = file.createEntity("IfcTrimmedCurve", null);
				expect(ifc4x3.calc_IfcCurve_Dim(trimmed as EntityInstance)).toBeNull();
			});

			// --- the 2 branches ADD2 shares with IFC4 (postdating IFC2X3) ---

			test("IfcGradientCurve -> always 3 (postdates IFC2X3/IFC4, NEW to ADD2)", () => {
				const file = createTestFile("IFC4X3");
				const gradientCurve = file.createEntity("IfcGradientCurve");
				expect(ifc4x3.calc_IfcCurve_Dim(gradientCurve as EntityInstance)).toBe(3);
			});

			test("IfcSegmentedReferenceCurve -> always 3 (NEW to ADD2)", () => {
				const file = createTestFile("IFC4X3");
				const segmentedReferenceCurve = file.createEntity("IfcSegmentedReferenceCurve");
				expect(ifc4x3.calc_IfcCurve_Dim(segmentedReferenceCurve as EntityInstance)).toBe(3);
			});

			// **UPDATE (IFC4X3 chunk 3): unaffected by this chunk.** `Segments` is `LIST OF
			// IfcSegment` on ADD2 (an abstract supertype, not a subtype-specific override) --
			// resolving `Segments[0].Dim` needs `calc_IfcSegment_Dim` (`IFC4X3_ADD2.py` line
			// 11281, confirmed the ONLY `Dim` formula declared anywhere on `IfcSegment`/its
			// concrete subtypes), which is NOT one of this chunk's own 15 (nor any prior
			// chunk's) -- still a genuine dispatch MISS, re-verified directly.
			test("IfcCompositeCurve -> Segments[0].Dim -> still INDETERMINATE (calc_IfcSegment_Dim not ported for IFC4X3 either)", () => {
				const file = createTestFile("IFC4X3");
				const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
				const parentCurve = file.createEntity("IfcPolyline", [p0, p1]);
				const segment = file.createEntity("IfcCompositeCurveSegment", "CONTINUOUS", true, parentCurve);
				const compositeCurve = file.createEntity("IfcCompositeCurve", [segment], false);
				expect(ifc4x3.calc_IfcCurve_Dim(compositeCurve as EntityInstance)).toBe(INDETERMINATE);
			});

			test("IfcBSplineCurve -> ControlPointsList[0].Dim -> now resolves to a real number (calc_IfcPoint_Dim ported, IFC4X3 chunk 3)", () => {
				const file = createTestFile("IFC4X3");
				const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
				const p2 = file.createEntity("IfcCartesianPoint", [2.0, 0.0, 0.0]);
				const curve = file.createEntity("IfcBSplineCurve", 2, [p0, p1, p2], "UNSPECIFIED", false, false);
				expect(ifc4x3.calc_IfcCurve_Dim(curve as EntityInstance)).toBe(3);
			});

			test("IfcOffsetCurve2D -> always 2", () => {
				const file = createTestFile("IFC4X3");
				const offsetCurve = file.createEntity("IfcOffsetCurve2D");
				expect(ifc4x3.calc_IfcCurve_Dim(offsetCurve as EntityInstance)).toBe(2);
			});

			test("IfcOffsetCurve3D -> always 3", () => {
				const file = createTestFile("IFC4X3");
				const offsetCurve = file.createEntity("IfcOffsetCurve3D");
				expect(ifc4x3.calc_IfcCurve_Dim(offsetCurve as EntityInstance)).toBe(3);
			});

			// --- the 5 branches genuinely NEW to ADD2 (absent from BOTH IFC2X3 and IFC4) ---

			test("IfcOffsetCurveByDistances -> always 3 (NEW to ADD2)", () => {
				const file = createTestFile("IFC4X3");
				const offsetCurve = file.createEntity("IfcOffsetCurveByDistances");
				expect(ifc4x3.calc_IfcCurve_Dim(offsetCurve as EntityInstance)).toBe(3);
			});

			// `IfcCurveSegment2D` is NOT tested here (and cannot be): confirmed via a real
			// built addon that no such entity exists anywhere in the ADD2 schema at all
			// (`schema.declaration_by_name("IfcCurveSegment2D")` raises `RuntimeError:
			// Entity with name 'IfcCurveSegment2D' not found`) -- see `ifc4x3.ts`'s own
			// header comment for the full provenance writeup (a real entity as of
			// RC1/RC2, consolidated away by RC3 onward, but this ONE dispatch branch in
			// the generated `IfcCurveDim` survived unchanged). Since no instance of that
			// type can ever exist, no test fixture can ever reach this branch -- it is
			// permanently, provably dead code, not merely untested.

			test("IfcPolynomialCurve, CoefficientsZ set -> always 3", () => {
				const file = createTestFile("IFC4X3");
				const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const position = file.createEntity("IfcAxis2Placement3D", location, null, null);
				const curve = file.createEntity("IfcPolynomialCurve", position, [0.0, 1.0], [0.0, 1.0], [0.0, 1.0]);
				expect(ifc4x3.calc_IfcCurve_Dim(curve as EntityInstance)).toBe(3);
			});

			// CoefficientsZ unset -> the branch's own 2D condition is `not exists(CoefficientsZ)
			// and Position.Dim == 2` -- `Position.Dim` is itself DERIVE at the `IfcPlacement`
			// supertype level.
			//
			// **UPDATE (Phase EX-2, IFC4X3's own THIRD chunk):** `calc_IfcPlacement_Dim` is
			// now ported -- `Position.Dim` resolves to the REAL value `2` for a 2D
			// `IfcAxis2Placement2D`, so this branch's own condition (`not exists(CoefficientsZ)
			// and Position.Dim == 2`) now genuinely holds, correctly returning `2` -- matching
			// real Python's own intended, conditional behavior for the first time on IFC4X3
			// (previously always `3`, a disclosed CURRENT-STATE-ONLY consequence of
			// `IfcPlacement.Dim` being unported, not a bug -- see chunk 2's own header
			// comment, now resolved). Re-verified directly against the real built addon.
			test("IfcPolynomialCurve, CoefficientsZ unset, 2D Position -> now correctly resolves to 2 (calc_IfcPlacement_Dim ported, IFC4X3 chunk 3)", () => {
				const file = createTestFile("IFC4X3");
				const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const position = file.createEntity("IfcAxis2Placement2D", location, null);
				const curve = file.createEntity("IfcPolynomialCurve", position, [0.0, 1.0], [0.0, 1.0], null);
				expect(ifc4x3.calc_IfcCurve_Dim(curve as EntityInstance)).toBe(2);
			});

			test("IfcPcurve -> always 3", () => {
				const file = createTestFile("IFC4X3");
				const planeLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const planePlacement = file.createEntity("IfcAxis2Placement3D", planeLocation, null, null);
				const plane = file.createEntity("IfcPlane", planePlacement);
				const refCurvePnt = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
				const refCurveDir = file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0);
				const referenceCurve = file.createEntity("IfcLine", refCurvePnt, refCurveDir);
				const pcurve = file.createEntity("IfcPcurve", plane, referenceCurve);
				expect(ifc4x3.calc_IfcCurve_Dim(pcurve as EntityInstance)).toBe(3);
			});

			// IfcIndexedPolyCurve -> Points.Dim, dispatching through this file's own FIRST
			// chunk's `calc_IfcCartesianPointList_Dim` -- a real cross-chunk integration.
			test("IfcIndexedPolyCurve -> Points.Dim (dispatches into calc_IfcCartesianPointList_Dim, this file's own first chunk)", () => {
				const file = createTestFile("IFC4X3");
				const pointList = file.createEntity("IfcCartesianPointList2D", [
					[0.0, 0.0],
					[1.0, 1.0],
					[2.0, 0.0],
				]);
				const indexedCurve = file.createEntity("IfcIndexedPolyCurve", pointList, null, null);
				expect(ifc4x3.calc_IfcCurve_Dim(indexedCurve as EntityInstance)).toBe(2);
			});

			test("IfcSpiral (abstract, tested via its concrete IfcClothoid subtype) -> Position.Dim", () => {
				const file = createTestFile("IFC4X3");
				const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const position = file.createEntity("IfcAxis2Placement3D", location, null, null);
				const clothoid = file.createEntity("IfcClothoid", position, 1.0);
				// Same "now resolves via calc_IfcPlacement_Dim" reasoning as the IfcConic/
				// IfcPolynomialCurve cases above (IFC4X3 chunk 3) -- Position.Dim now resolves
				// to the real value 3 for this 3D placement.
				expect(ifc4x3.calc_IfcCurve_Dim(clothoid as EntityInstance)).toBe(3);
			});

			test("end-to-end: indexedCurve.Dim resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const pointList = file.createEntity("IfcCartesianPointList3D", [
					[0.0, 0.0, 0.0],
					[1.0, 1.0, 1.0],
				]);
				const indexedCurve = file.createEntity("IfcIndexedPolyCurve", pointList, null, null);
				expect((indexedCurve as unknown as { Dim: number }).Dim).toBe(3);
			});
		});

		// --- calc_IfcDerivedUnit_Dimensions (+ IfcDeriveDimensionalExponents) ---
		describe("calc_IfcDerivedUnit_Dimensions", () => {
			function exponents(result: unknown): number[] {
				const r = result as EntityInstance;
				return [
					"LengthExponent",
					"MassExponent",
					"TimeExponent",
					"ElectricCurrentExponent",
					"ThermodynamicTemperatureExponent",
					"AmountOfSubstanceExponent",
					"LuminousIntensityExponent",
				].map((name) => r.get(name) as number);
			}

			function buildDerivedUnit(file: IfcFile, elements: unknown[]) {
				return file.createEntity("IfcDerivedUnit", elements, "USERDEFINED", "test");
			}

			function buildElement(file: IfcFile, unit: unknown, exponent: number) {
				return file.createEntity("IfcDerivedUnitElement", unit, exponent);
			}

			// A `IfcContextDependentUnit` has a PLAIN, directly-stored `Dimensions`
			// attribute (not DERIVE) -- isolates this test from any other DERIVE
			// dependency (`calc_IfcSIUnit_Dimensions` is NOT ported for IFC4X3 yet).
			function buildUnitWithDimensions(file: IfcFile, dims: number[]) {
				const dimensions = file.createEntity("IfcDimensionalExponents", ...dims);
				return file.createEntity("IfcContextDependentUnit", dimensions, "USERDEFINED", "test-unit");
			}

			test("empty Elements -> all-zero exponents, loop body never runs", () => {
				const file = createTestFile("IFC4X3");
				const derivedUnit = buildDerivedUnit(file, []);
				const result = ifc4x3.calc_IfcDerivedUnit_Dimensions(derivedUnit as EntityInstance);
				expect(exponents(result)).toEqual([0, 0, 0, 0, 0, 0, 0]);
			});

			test("single element, Exponent=2 on a length-dimensioned unit -> LengthExponent=2", () => {
				const file = createTestFile("IFC4X3");
				const unit = buildUnitWithDimensions(file, [1, 0, 0, 0, 0, 0, 0]);
				const derivedUnit = buildDerivedUnit(file, [buildElement(file, unit, 2)]);
				const result = ifc4x3.calc_IfcDerivedUnit_Dimensions(derivedUnit as EntityInstance);
				expect(exponents(result)).toEqual([2, 0, 0, 0, 0, 0, 0]);
			});

			test("3 elements (mass, length, time^-2) -> (1, 1, -2, 0, 0, 0, 0)", () => {
				const file = createTestFile("IFC4X3");
				const massUnit = buildUnitWithDimensions(file, [0, 1, 0, 0, 0, 0, 0]);
				const lengthUnit = buildUnitWithDimensions(file, [1, 0, 0, 0, 0, 0, 0]);
				const timeUnit = buildUnitWithDimensions(file, [0, 0, 1, 0, 0, 0, 0]);
				const derivedUnit = buildDerivedUnit(file, [
					buildElement(file, massUnit, 1),
					buildElement(file, lengthUnit, 1),
					buildElement(file, timeUnit, -2),
				]);
				const result = ifc4x3.calc_IfcDerivedUnit_Dimensions(derivedUnit as EntityInstance);
				expect(exponents(result)).toEqual([1, 1, -2, 0, 0, 0, 0]);
			});

			test("end-to-end: derivedUnit.Dimensions resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const unit = buildUnitWithDimensions(file, [1, 0, 0, 0, 0, 0, 0]);
				const derivedUnit = buildDerivedUnit(file, [buildElement(file, unit, 2)]);
				const result = (derivedUnit as unknown as { Dimensions: EntityInstance }).Dimensions;
				expect(exponents(result)).toEqual([2, 0, 0, 0, 0, 0, 0]);
			});
		});

		// --- calc_IfcEdgeLoop_Ne ---
		describe("calc_IfcEdgeLoop_Ne", () => {
			test("Ne = sizeof(EdgeList)", () => {
				const file = createTestFile("IFC4X3");
				const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
				const v0 = file.createEntity("IfcVertexPoint", p0);
				const v1 = file.createEntity("IfcVertexPoint", p1);
				const edge1 = file.createEntity("IfcEdge", v0, v1);
				const edge2 = file.createEntity("IfcEdge", v1, v0);
				const oe1 = file.createEntity("IfcOrientedEdge", edge1, true);
				const oe2 = file.createEntity("IfcOrientedEdge", edge2, true);
				const edgeLoop = file.createEntity("IfcEdgeLoop", [oe1, oe2]);
				expect(ifc4x3.calc_IfcEdgeLoop_Ne(edgeLoop as EntityInstance)).toBe(2);
			});

			test("end-to-end: edgeLoop.Ne resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
				const v0 = file.createEntity("IfcVertexPoint", p0);
				const v1 = file.createEntity("IfcVertexPoint", p1);
				const edge1 = file.createEntity("IfcEdge", v0, v1);
				const edge2 = file.createEntity("IfcEdge", v1, v0);
				const oe1 = file.createEntity("IfcOrientedEdge", edge1, true);
				const oe2 = file.createEntity("IfcOrientedEdge", edge2, true);
				const edgeLoop = file.createEntity("IfcEdgeLoop", [oe1, oe2]);
				expect((edgeLoop as unknown as { Ne: number }).Ne).toBe(2);
			});
		});

		// --- calc_IfcFaceBasedSurfaceModel_Dim ---
		describe("calc_IfcFaceBasedSurfaceModel_Dim", () => {
			test("always 3", () => {
				const file = createTestFile("IFC4X3");
				const model = file.createEntity("IfcFaceBasedSurfaceModel");
				expect(ifc4x3.calc_IfcFaceBasedSurfaceModel_Dim(model as EntityInstance)).toBe(3);
			});
		});

		// --- calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem ---
		describe("calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem", () => {
			// Fixture note: `IfcGeometricRepresentationSubContext`'s real, native attribute
			// order (confirmed empirically against the real built addon) is
			// `['ContextIdentifier', 'ContextType', 'CoordinateSpaceDimension', 'Precision',
			// 'WorldCoordinateSystem', 'TrueNorth', 'ParentContext', 'TargetScale',
			// 'TargetView', 'UserDefinedTargetView']` -- 10 positional slots, same shape as
			// IFC2X3/IFC4 (the 4 DERIVE-overridden attributes inherited from
			// `IfcGeometricRepresentationContext` still occupy real positional slots 3-6).
			function buildSubContext(file: IfcFile) {
				const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const wcs = file.createEntity("IfcAxis2Placement3D", location, null, null);
				const parentContext = file.createEntity(
					"IfcGeometricRepresentationContext",
					null,
					"Model",
					3,
					1.0e-5,
					wcs,
					null,
				);
				const subContext = file.createEntity(
					"IfcGeometricRepresentationSubContext",
					null,
					"Model",
					null,
					null,
					null,
					null,
					parentContext,
					null,
					"MODEL_VIEW",
					null,
				);
				return { wcs, subContext };
			}

			test("delegates to ParentContext.WorldCoordinateSystem", () => {
				const file = createTestFile("IFC4X3");
				const { wcs, subContext } = buildSubContext(file);
				const result = ifc4x3.calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem(
					subContext as EntityInstance,
				) as EntityInstance;
				expect(result.id()).toBe((wcs as EntityInstance).id());
			});

			test("end-to-end: subContext.WorldCoordinateSystem resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const { wcs, subContext } = buildSubContext(file);
				const result = (subContext as unknown as { WorldCoordinateSystem: EntityInstance }).WorldCoordinateSystem;
				expect(result.id()).toBe((wcs as EntityInstance).id());
			});
		});
	},
);

// =============================================================================
// Original, hand-rolled coverage for Phase EX-2's IFC4X3 THIRD chunk
// (planning/ifcopenshell-ts/70-express-rules-plan.md §4): 15 more of IFC4X3_ADD2's 60
// `calc_*` DERIVE functions (`src/express/rules/ifc4x3.ts`) -- see that file's own
// header comment (the "third chunk" section) for the full byte-identical-vs-
// genuinely-different diffing writeup against IFC4/IFC2X3, the `IfcPointDim`
// consolidation finding (`calc_IfcPoint_Dim`, genuinely new to ADD2), and the MAJOR
// `INDETERMINATE`-cascade resolution this chunk caused elsewhere in this same test
// file (chunk 2's own `calc_IfcCartesianTransformationOperator_Dim`/`calc_IfcCurve_Dim`
// tests, updated above) and elsewhere in the suite (`editSurveyPoint.test.ts`,
// `addRailingRepresentation.test.ts`, `createAsOffsetCurve.test.ts`/
// `_createOffsetCurveRepresentation.test.ts`).
// =============================================================================
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))(
	"express/rules/ifc4x3 -- calc_* functions (Phase EX-2, IFC4X3 chunk 3)",
	() => {
		// --- calc_IfcGeometricRepresentationSubContext_CoordinateSpaceDimension / _TrueNorth / _Precision ---
		describe("calc_IfcGeometricRepresentationSubContext_CoordinateSpaceDimension / _TrueNorth / _Precision", () => {
			// Fixture note (same shape as chunk 2's own `_WorldCoordinateSystem` fixture):
			// `IfcGeometricRepresentationSubContext`'s real, native attribute order is the
			// full inherited 10-slot list (`ContextIdentifier`, `ContextType`,
			// `CoordinateSpaceDimension`, `Precision`, `WorldCoordinateSystem`, `TrueNorth`,
			// `ParentContext`, `TargetScale`, `TargetView`, `UserDefinedTargetView`).
			function buildSubContext(file: IfcFile, parentTrueNorth: EntityInstance | null, parentPrecision: number | null) {
				const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const wcs = file.createEntity("IfcAxis2Placement3D", location, null, null);
				const parentContext = file.createEntity(
					"IfcGeometricRepresentationContext",
					null,
					"Model",
					3,
					parentPrecision,
					wcs,
					parentTrueNorth,
				);
				const subContext = file.createEntity(
					"IfcGeometricRepresentationSubContext",
					null,
					"Model",
					null,
					null,
					null,
					null,
					parentContext,
					null,
					"MODEL_VIEW",
					null,
				);
				return { wcs, parentContext, subContext };
			}

			// Python: `express_getattr(ParentContext, 'CoordinateSpaceDimension', INDETERMINATE)`.
			test("CoordinateSpaceDimension delegates to ParentContext.CoordinateSpaceDimension", () => {
				const file = createTestFile("IFC4X3");
				const trueNorth = file.createEntity("IfcDirection", [0.0, 1.0, 0.0]);
				const { subContext } = buildSubContext(file, trueNorth as EntityInstance, 1.0e-5);
				expect(
					ifc4x3.calc_IfcGeometricRepresentationSubContext_CoordinateSpaceDimension(subContext as EntityInstance),
				).toBe(3);
			});

			// Python: `nvl(express_getattr(ParentContext, 'TrueNorth', INDETERMINATE), ...)`.
			test("TrueNorth: ParentContext.TrueNorth set -> returned directly", () => {
				const file = createTestFile("IFC4X3");
				const trueNorth = file.createEntity("IfcDirection", [0.0, 1.0, 0.0]);
				const { subContext } = buildSubContext(file, trueNorth as EntityInstance, 1.0e-5);
				const result = ifc4x3.calc_IfcGeometricRepresentationSubContext_TrueNorth(
					subContext as EntityInstance,
				) as EntityInstance;
				expect(result.id()).toBe((trueNorth as EntityInstance).id());
			});

			// ParentContext.TrueNorth unset -> falls back to
			// `IfcConvertDirectionInto2D(self.WorldCoordinateSystem.P[2 - ONE_BASED])`.
			// `self.WorldCoordinateSystem` = ParentContext.WorldCoordinateSystem = `wcs`, a
			// default (`Axis=null`, `RefDirection=null`) `IfcAxis2Placement3D` -> `P` =
			// `ifcBuildAxes(null, null)` = `[[1,0,0], [0,1,0], [0,0,1]]` (hand-derived the
			// same way `ifc4.ts`'s own third-chunk test derives it -- `IfcFirstProjAxis`'s
			// own disclosed always-true-branch, chunk 1's bug #1). `P[2 - ONE_BASED]`
			// (0-based index 1) = the Y axis = `[0,1,0]`, a 3-component `IfcDirection`.
			// `IfcConvertDirectionInto2D` copies only its first 2 components into a FRESH,
			// genuinely-2D `IfcDirection` (`Dim` = 2 via `calc_IfcDirection_Dim`, chunk 1).
			test("TrueNorth: ParentContext.TrueNorth unset -> IfcConvertDirectionInto2D(WCS.P[1]), a NEW 2D direction", () => {
				const file = createTestFile("IFC4X3");
				const { subContext } = buildSubContext(file, null, 1.0e-5);
				const result = ifc4x3.calc_IfcGeometricRepresentationSubContext_TrueNorth(
					subContext as EntityInstance,
				) as EntityInstance;
				expect((result as unknown as { Dim: number }).Dim).toBe(2);
				closeArray(ratios(result), [0.0, 1.0]);
			});

			// Python: `nvl(express_getattr(ParentContext, 'Precision', INDETERMINATE), 1)`.
			test("Precision delegates to ParentContext.Precision when set", () => {
				const file = createTestFile("IFC4X3");
				const { subContext } = buildSubContext(file, null, 1.0e-5);
				expect(ifc4x3.calc_IfcGeometricRepresentationSubContext_Precision(subContext as EntityInstance)).toBeCloseTo(
					1.0e-5,
					10,
				);
			});

			test("Precision falls back to 1 when ParentContext.Precision is unset", () => {
				const file = createTestFile("IFC4X3");
				const { subContext } = buildSubContext(file, null, null);
				expect(ifc4x3.calc_IfcGeometricRepresentationSubContext_Precision(subContext as EntityInstance)).toBe(1);
			});

			test("end-to-end: subContext.CoordinateSpaceDimension resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const trueNorth = file.createEntity("IfcDirection", [0.0, 1.0, 0.0]);
				const { subContext } = buildSubContext(file, trueNorth as EntityInstance, 1.0e-5);
				expect((subContext as unknown as { CoordinateSpaceDimension: number }).CoordinateSpaceDimension).toBe(3);
			});
		});

		// --- calc_IfcGeometricSet_Dim ---
		describe("calc_IfcGeometricSet_Dim", () => {
			// Python: `express_getattr(express_getitem(Elements, 0, INDETERMINATE), 'Dim',
			// INDETERMINATE)` -- the FIRST element's own Dim. A 2D `IfcCartesianPoint`'s
			// own Dim now resolves via THIS chunk's own `calc_IfcPoint_Dim` (a real
			// cross-function integration within the same chunk).
			test("Elements[0].Dim resolves via calc_IfcPoint_Dim (this chunk's own function)", () => {
				const file = createTestFile("IFC4X3");
				const point = file.createEntity("IfcCartesianPoint", [1.0, 2.0]);
				const geometricSet = file.createEntity("IfcGeometricSet", [point]);
				expect(ifc4x3.calc_IfcGeometricSet_Dim(geometricSet as EntityInstance)).toBe(2);
			});
		});

		// --- calc_IfcHalfSpaceSolid_Dim ---
		describe("calc_IfcHalfSpaceSolid_Dim", () => {
			test("always 3", () => {
				const file = createTestFile("IFC4X3");
				const halfSpace = file.createEntity("IfcHalfSpaceSolid");
				expect(ifc4x3.calc_IfcHalfSpaceSolid_Dim(halfSpace as EntityInstance)).toBe(3);
			});
		});

		// --- calc_IfcMaterialLayerSet_TotalThickness (+ its fresh IfcMlsTotalThickness helper) ---
		describe("calc_IfcMaterialLayerSet_TotalThickness", () => {
			// Python: `IfcMlsTotalThickness` sums every `MaterialLayers[].LayerThickness`
			// (real Python's own local variable is confusingly named `max`, but it is a
			// running SUM, not a maximum). 10.0 + 20.0 + 5.0 = 35.0.
			test("sums every MaterialLayers[].LayerThickness (not a maximum, despite real Python's own `max` variable name)", () => {
				const file = createTestFile("IFC4X3");
				const layer1 = file.createEntity("IfcMaterialLayer", null, 10.0, null, null, null, null, null);
				const layer2 = file.createEntity("IfcMaterialLayer", null, 20.0, null, null, null, null, null);
				const layer3 = file.createEntity("IfcMaterialLayer", null, 5.0, null, null, null, null, null);
				const layerSet = file.createEntity("IfcMaterialLayerSet", [layer1, layer2, layer3], null, null);
				expect(ifc4x3.calc_IfcMaterialLayerSet_TotalThickness(layerSet as EntityInstance)).toBeCloseTo(35.0, 10);
			});

			test("single-layer set: total is just that one layer's own thickness", () => {
				const file = createTestFile("IFC4X3");
				const layer1 = file.createEntity("IfcMaterialLayer", null, 42.0, null, null, null, null, null);
				const layerSet = file.createEntity("IfcMaterialLayerSet", [layer1], null, null);
				expect(ifc4x3.calc_IfcMaterialLayerSet_TotalThickness(layerSet as EntityInstance)).toBeCloseTo(42.0, 10);
			});

			test("end-to-end: layerSet.TotalThickness resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const layer1 = file.createEntity("IfcMaterialLayer", null, 10.0, null, null, null, null, null);
				const layer2 = file.createEntity("IfcMaterialLayer", null, 20.0, null, null, null, null, null);
				const layerSet = file.createEntity("IfcMaterialLayerSet", [layer1, layer2], null, null);
				expect((layerSet as unknown as { TotalThickness: number }).TotalThickness).toBeCloseTo(30.0, 10);
			});
		});

		// --- calc_IfcMirroredProfileDef_Operator (byte-identical to IFC4's own) ---
		describe("calc_IfcMirroredProfileDef_Operator", () => {
			// Python: `IfcCartesianTransformationOperator2D(Axis1=IfcDirection(
			// DirectionRatios=[-1.0, 0.0]), Axis2=IfcDirection(DirectionRatios=[0.0, 1.0]),
			// LocalOrigin=IfcCartesianPoint(Coordinates=[0.0, 0.0]), Scale=1.0)` -- a FIXED
			// value that does not read `self` at all. Called here with an unrelated dummy
			// entity to confirm exactly that.
			test("returns a fixed X-axis-mirroring 2D transformation operator, ignoring self entirely", () => {
				const file = createTestFile("IFC4X3");
				const dummy = file.createEntity("IfcCsgPrimitive3D");
				const operator = ifc4x3.calc_IfcMirroredProfileDef_Operator(dummy as EntityInstance) as EntityInstance;
				expect(operator.isA("IfcCartesianTransformationOperator2D")).toBe(true);
				const axis1 = (operator as unknown as { Axis1: EntityInstance }).Axis1;
				closeArray(ratios(axis1), [-1.0, 0.0]);
				const axis2 = (operator as unknown as { Axis2: EntityInstance }).Axis2;
				closeArray(ratios(axis2), [0.0, 1.0]);
				const localOrigin = (operator as unknown as { LocalOrigin: EntityInstance }).LocalOrigin;
				expect((localOrigin as unknown as { Coordinates: number[] }).Coordinates).toEqual([0.0, 0.0]);
				expect((operator as unknown as { Scale: number }).Scale).toBe(1.0);
			});

			// Fixture note: `IfcMirroredProfileDef`'s real, native attribute order,
			// confirmed EMPIRICALLY against the real built addon, is `['ProfileType',
			// 'ProfileName', 'ParentProfile', 'Operator', 'Label']` -- 5 positional slots,
			// including `Operator` itself (DERIVE-overriding `IfcDerivedProfileDef`'s own
			// stored `Operator`) at slot 4 -- SAME SHAPE as `ifc4.ts`'s own equivalent
			// finding -- `generated/ifc4x3.d.ts`'s own `IfcMirroredProfileDef` interface
			// omits it (4 fields only), matching this file's own "`.d.ts` is accurate for
			// reading, not for `createEntity`'s positional convention" precedent.
			test("end-to-end: mirroredProfile.Operator resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const parentProfile = file.createEntity("IfcCircleProfileDef", "AREA", null, null, 5.0);
				const mirroredProfile = file.createEntity("IfcMirroredProfileDef", "AREA", null, parentProfile, null, null);
				const operator = (mirroredProfile as unknown as { Operator: EntityInstance }).Operator;
				expect(operator.isA("IfcCartesianTransformationOperator2D")).toBe(true);
				closeArray(ratios((operator as unknown as { Axis1: EntityInstance }).Axis1), [-1.0, 0.0]);
			});
		});

		// --- calc_IfcOrientedEdge_EdgeStart / calc_IfcOrientedEdge_EdgeEnd (+ fresh IfcBooleanChoose) ---
		describe("calc_IfcOrientedEdge_EdgeStart / calc_IfcOrientedEdge_EdgeEnd", () => {
			// Fixture note: `IfcOrientedEdge`'s real, native attribute order, confirmed
			// EMPIRICALLY against the real built addon, is `[EdgeStart, EdgeEnd,
			// EdgeElement, Orientation]` -- the SAME SHAPE as IFC2X3's/IFC4's own --
			// `createEntity` needs all 4 positional slots, not just the 2
			// genuinely-storable ones `generated/ifc4x3.d.ts` documents (`EdgeElement`,
			// `Orientation`).
			function buildOrientedEdge(file: IfcFile, orientation: boolean | null) {
				const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
				const v0 = file.createEntity("IfcVertexPoint", p0);
				const v1 = file.createEntity("IfcVertexPoint", p1);
				const edge = file.createEntity("IfcEdge", v0, v1);
				const orientedEdge = file.createEntity("IfcOrientedEdge", null, null, edge, orientation);
				return { v0, v1, orientedEdge };
			}

			test("Orientation=true -> EdgeStart is EdgeElement.EdgeStart", () => {
				const file = createTestFile("IFC4X3");
				const { v0, orientedEdge } = buildOrientedEdge(file, true);
				const result = ifc4x3.calc_IfcOrientedEdge_EdgeStart(orientedEdge as EntityInstance) as EntityInstance;
				expect(result.id()).toBe((v0 as EntityInstance).id());
			});

			test("Orientation=false -> EdgeStart is EdgeElement.EdgeEnd", () => {
				const file = createTestFile("IFC4X3");
				const { v1, orientedEdge } = buildOrientedEdge(file, false);
				const result = ifc4x3.calc_IfcOrientedEdge_EdgeStart(orientedEdge as EntityInstance) as EntityInstance;
				expect(result.id()).toBe((v1 as EntityInstance).id());
			});

			test("Orientation=true -> EdgeEnd is EdgeElement.EdgeEnd", () => {
				const file = createTestFile("IFC4X3");
				const { v1, orientedEdge } = buildOrientedEdge(file, true);
				const result = ifc4x3.calc_IfcOrientedEdge_EdgeEnd(orientedEdge as EntityInstance) as EntityInstance;
				expect(result.id()).toBe((v1 as EntityInstance).id());
			});

			test("Orientation=false -> EdgeEnd is EdgeElement.EdgeStart", () => {
				const file = createTestFile("IFC4X3");
				const { v0, orientedEdge } = buildOrientedEdge(file, false);
				const result = ifc4x3.calc_IfcOrientedEdge_EdgeEnd(orientedEdge as EntityInstance) as EntityInstance;
				expect(result.id()).toBe((v0 as EntityInstance).id());
			});

			test("Orientation unset (INDETERMINATE) -> treated as falsy, matching real Python's indeterminate_type.__bool__", () => {
				const file = createTestFile("IFC4X3");
				const { v1, orientedEdge } = buildOrientedEdge(file, null);
				const result = ifc4x3.calc_IfcOrientedEdge_EdgeStart(orientedEdge as EntityInstance) as EntityInstance;
				expect(result.id()).toBe((v1 as EntityInstance).id());
			});

			test("end-to-end: orientedEdge.EdgeStart resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const { v0, orientedEdge } = buildOrientedEdge(file, true);
				expect((orientedEdge as unknown as { EdgeStart: EntityInstance }).EdgeStart.id()).toBe(
					(v0 as EntityInstance).id(),
				);
			});
		});

		// --- calc_IfcPlacement_Dim ---
		describe("calc_IfcPlacement_Dim", () => {
			// Python: `express_getattr(Location, 'Dim', INDETERMINATE)`. Location is a 3D
			// `IfcCartesianPoint` -- Dim now resolves via THIS chunk's own `calc_IfcPoint_Dim`.
			test("Location.Dim resolves via calc_IfcPoint_Dim (this chunk's own function)", () => {
				const file = createTestFile("IFC4X3");
				const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
				expect(ifc4x3.calc_IfcPlacement_Dim(placement as EntityInstance)).toBe(3);
			});

			// End-to-end: `IfcAxis2Placement3D` has no own `Dim` function, so dispatch
			// must walk its supertype chain up to `IfcPlacement.Dim` to resolve it.
			test("end-to-end: placement.Dim resolves through the normal attribute-read path via supertype dispatch", () => {
				const file = createTestFile("IFC4X3");
				const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
				expect((placement as unknown as { Dim: number }).Dim).toBe(3);
			});
		});

		// --- calc_IfcPoint_Dim (+ IfcPointDim, ADD2's own consolidated supertype formula) ---
		describe("calc_IfcPoint_Dim / IfcPointDim (genuinely new to ADD2, no IFC2X3/IFC4 equivalent)", () => {
			// Branch 1: IfcCartesianPoint -> hiIndex(Coordinates).
			test("IfcCartesianPoint branch: hiIndex(Coordinates)", () => {
				const file = createTestFile("IFC4X3");
				const point2d = file.createEntity("IfcCartesianPoint", [1.0, 2.0]);
				const point3d = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
				expect(ifc4x3.calc_IfcPoint_Dim(point2d as EntityInstance)).toBe(2);
				expect(ifc4x3.calc_IfcPoint_Dim(point3d as EntityInstance)).toBe(3);
			});

			// Branch 2: IfcPointOnCurve -> BasisCurve.Dim. `BasisCurve` is a plain IfcLine
			// whose own `Pnt` is a 3D IfcCartesianPoint -> IfcCurve.Dim (chunk 2) ->
			// IfcLine's Pnt.Dim -> IfcPoint.Dim (this chunk) = 3.
			test("IfcPointOnCurve branch: BasisCurve.Dim (a real cross-function integration with calc_IfcCurve_Dim)", () => {
				const file = createTestFile("IFC4X3");
				const pnt = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const dir = file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0, 0.0]), 1.0);
				const line = file.createEntity("IfcLine", pnt, dir);
				const pointOnCurve = file.createEntity("IfcPointOnCurve", line, 0.5);
				expect(ifc4x3.calc_IfcPoint_Dim(pointOnCurve as EntityInstance)).toBe(3);
			});

			// Branch 3: IfcPointOnSurface -> BasisSurface.Dim. `BasisSurface` is a plain
			// `IfcPlane` -- `IfcSurface.Dim` (`calc_IfcSurface_Dim`) is NOT one of this
			// chunk's own 15 (still genuinely unported, see this file's own header
			// comment) -- resolves to `runtimeShim.INDETERMINATE`, not a crash (via
			// `expressGetAttr`'s own try/catch around the underlying dispatch-miss
			// throw), matching real Python's own `express_getattr(BasisSurface, 'Dim',
			// INDETERMINATE)` catch-and-default shape exactly.
			test("IfcPointOnSurface branch: BasisSurface.Dim -> INDETERMINATE (calc_IfcSurface_Dim not ported by this chunk)", () => {
				const file = createTestFile("IFC4X3");
				const planeLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const planePlacement = file.createEntity("IfcAxis2Placement3D", planeLocation, null, null);
				const plane = file.createEntity("IfcPlane", planePlacement);
				const pointOnSurface = file.createEntity("IfcPointOnSurface", plane, 0.5, 0.5);
				expect(ifc4x3.calc_IfcPoint_Dim(pointOnSurface as EntityInstance)).toBe(INDETERMINATE);
			});

			// Branch 4: IfcPointByDistanceExpression -> BasisCurve.Dim (genuinely new to
			// ADD2 -- an alignment-geometry entity absent from both IFC2X3/IFC4 entirely).
			test("IfcPointByDistanceExpression branch: BasisCurve.Dim (NEW to ADD2, no IFC2X3/IFC4 equivalent)", () => {
				const file = createTestFile("IFC4X3");
				const pnt = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const dir = file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0, 0.0]), 1.0);
				const line = file.createEntity("IfcLine", pnt, dir);
				const pointByDistance = file.createEntity("IfcPointByDistanceExpression", 1.0, null, null, null, line);
				expect(ifc4x3.calc_IfcPoint_Dim(pointByDistance as EntityInstance)).toBe(3);
			});

			// Else branch: an unrelated entity (not an `IfcPoint` subtype at all) -> null
			// -- called directly (not through DERIVE dispatch, which would never route a
			// non-`IfcPoint` instance here in the first place).
			test("an unrelated entity type -> null (the else branch)", () => {
				const file = createTestFile("IFC4X3");
				const dummy = file.createEntity("IfcCsgPrimitive3D");
				expect(ifc4x3.calc_IfcPoint_Dim(dummy as EntityInstance)).toBeNull();
			});

			test("end-to-end: point.Dim resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const point = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
				expect((point as unknown as { Dim: number }).Dim).toBe(3);
			});
		});

		// --- calc_IfcRationalBSplineCurveWithKnots_Weights (reuses chunk 1's ifcListToArray) ---
		describe("calc_IfcRationalBSplineCurveWithKnots_Weights", () => {
			// Python: `IfcListToArray(WeightsData, 0, UpperIndexOnControlPoints)`. Reuses
			// this file's own chunk-1 `ifcListToArray` UNCHANGED -- a NEW CALL SITE into
			// chunk 1's own already-disclosed bug #2 (the `low === 0` left-rotation), not
			// a new bug: for 4 weights [1,2,3,4], the buggy result is [2,3,4,1], not an
			// identity copy.
			test("4 weights -> cyclically rotated, NOT an identity copy (chunk 1's disclosed bug #2, reused here)", () => {
				const file = createTestFile("IFC4X3");
				const points = [0, 1, 2, 3].map((i) => file.createEntity("IfcCartesianPoint", [Number(i), 0.0]));
				const curve = file.createEntity(
					"IfcRationalBSplineCurveWithKnots",
					3,
					points,
					"UNSPECIFIED",
					false,
					false,
					[4, 4],
					[0.0, 1.0],
					"UNSPECIFIED",
					[1.0, 2.0, 3.0, 4.0],
				);
				const weights = ifc4x3.calc_IfcRationalBSplineCurveWithKnots_Weights(curve as EntityInstance);
				expect(weights).toEqual([2.0, 3.0, 4.0, 1.0]);
			});

			test("end-to-end: curve.Weights resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const points = [0, 1, 2].map((i) => file.createEntity("IfcCartesianPoint", [Number(i), 0.0]));
				const curve = file.createEntity(
					"IfcRationalBSplineCurveWithKnots",
					2,
					points,
					"UNSPECIFIED",
					false,
					false,
					[3, 3],
					[0.0, 1.0],
					"UNSPECIFIED",
					[10.0, 20.0, 30.0],
				);
				expect((curve as unknown as { Weights: number[] }).Weights).toEqual([20.0, 30.0, 10.0]);
			});
		});

		// --- calc_IfcRationalBSplineSurfaceWithKnots_Weights (reuses chunk 1's ifcMakeArrayOfArray) ---
		describe("calc_IfcRationalBSplineSurfaceWithKnots_Weights", () => {
			function buildSurface(file: IfcFile) {
				const p00 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const p01 = file.createEntity("IfcCartesianPoint", [0.0, 1.0, 0.0]);
				const p10 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
				const p11 = file.createEntity("IfcCartesianPoint", [1.0, 1.0, 0.0]);
				return file.createEntity(
					"IfcRationalBSplineSurfaceWithKnots",
					1,
					1,
					[
						[p00, p01],
						[p10, p11],
					],
					"UNSPECIFIED",
					false,
					false,
					false,
					[2, 2],
					[2, 2],
					[0.0, 1.0],
					[0.0, 1.0],
					"UNSPECIFIED",
					[
						[1.0, 2.0],
						[3.0, 4.0],
					],
				);
			}

			// Python: `IfcMakeArrayOfArray(WeightsData, 0, UUpper, 0, VUpper)`. Reuses
			// this file's own chunk-1 `ifcMakeArrayOfArray` UNCHANGED -- a NEW CALL SITE
			// into chunk 1's own already-disclosed bug #3 (unconditional `TypeError`),
			// not a new bug. **Net effect: this function can never successfully compute a
			// value in real Python, for ANY structurally valid
			// `IfcRationalBSplineSurfaceWithKnots`** -- same as
			// `calc_IfcBSplineSurface_ControlPoints` itself (chunk 1).
			test("always throws once both size-validation guards pass (chunk 1's disclosed bug #3, reused here)", () => {
				const file = createTestFile("IFC4X3");
				const surface = buildSurface(file);
				expect(() => ifc4x3.calc_IfcRationalBSplineSurfaceWithKnots_Weights(surface as EntityInstance)).toThrow(
					/IfcMakeArrayOfArray/,
				);
			});

			test("end-to-end: surface.Weights throws through the normal attribute-read path too", () => {
				const file = createTestFile("IFC4X3");
				const surface = buildSurface(file);
				expect(() => (surface as unknown as { Weights: unknown }).Weights).toThrow(/IfcMakeArrayOfArray/);
			});
		});

		// --- calc_IfcRevolvedAreaSolid_AxisLine (+ fresh IfcLine) ---
		describe("calc_IfcRevolvedAreaSolid_AxisLine", () => {
			// Python: `IfcLine(Pnt=Axis.Location, Dir=IfcVector(Orientation=Axis.Z,
			// Magnitude=1.0))`. `Axis.Z` is `IfcAxis1Placement`'s own DERIVE attribute
			// (`calc_IfcAxis1Placement_Z`, chunk 1) -- exercised here with an
			// UNNORMALIZED `Axis` ([0,0,2]) to confirm the full chain normalizes it (->
			// [0,0,1]), not just passes it through.
			test("AxisLine.Pnt is Axis.Location, AxisLine.Dir is a unit vector along (normalised) Axis.Z", () => {
				const file = createTestFile("IFC4X3");
				const profile = file.createEntity("IfcRectangleProfileDef", "AREA", null, null, 2.0, 3.0);
				const positionLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const position = file.createEntity("IfcAxis2Placement3D", positionLocation, null, null);
				const axisLocation = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
				const zAxis = file.createEntity("IfcDirection", [0.0, 0.0, 2.0]);
				const axis = file.createEntity("IfcAxis1Placement", axisLocation, zAxis);
				const revolvedSolid = file.createEntity("IfcRevolvedAreaSolid", profile, position, axis, Math.PI / 2);
				const axisLine = ifc4x3.calc_IfcRevolvedAreaSolid_AxisLine(revolvedSolid as EntityInstance) as EntityInstance;
				const pnt = (axisLine as unknown as { Pnt: EntityInstance }).Pnt;
				expect(pnt.id()).toBe((axisLocation as EntityInstance).id());
				const dir = (axisLine as unknown as { Dir: EntityInstance }).Dir;
				expect((dir as unknown as { Magnitude: number }).Magnitude).toBe(1.0);
				closeArray(ratios((dir as unknown as { Orientation: unknown }).Orientation), [0, 0, 1]);
			});

			test("end-to-end: revolvedSolid.AxisLine resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const profile = file.createEntity("IfcRectangleProfileDef", "AREA", null, null, 2.0, 3.0);
				const positionLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
				const position = file.createEntity("IfcAxis2Placement3D", positionLocation, null, null);
				const axisLocation = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
				const zAxis = file.createEntity("IfcDirection", [0.0, 0.0, 2.0]);
				const axis = file.createEntity("IfcAxis1Placement", axisLocation, zAxis);
				const revolvedSolid = file.createEntity("IfcRevolvedAreaSolid", profile, position, axis, Math.PI / 2);
				const axisLine = (revolvedSolid as unknown as { AxisLine: EntityInstance }).AxisLine;
				expect((axisLine as unknown as { Pnt: EntityInstance }).Pnt.id()).toBe((axisLocation as EntityInstance).id());
			});
		});

		// --- calc_IfcSIUnit_Dimensions (+ fresh ifcDimensionsForSiUnit, identical to IFC4's own) ---
		describe("calc_IfcSIUnit_Dimensions", () => {
			function exponents(result: unknown): number[] {
				const d = result as EntityInstance;
				return [
					"LengthExponent",
					"MassExponent",
					"TimeExponent",
					"ElectricCurrentExponent",
					"ThermodynamicTemperatureExponent",
					"AmountOfSubstanceExponent",
					"LuminousIntensityExponent",
				].map((name) => d.get(name) as number);
			}

			function buildSiUnit(file: IfcFile, name: string) {
				return file.createEntity("IfcSIUnit", null, "LENGTHUNIT", null, name);
			}

			test("METRE -> LengthExponent=1, everything else 0 (byte-identical to IFC2X3's/IFC4's own branch)", () => {
				const file = createTestFile("IFC4X3");
				const unit = buildSiUnit(file, "METRE");
				const result = ifc4x3.calc_IfcSIUnit_Dimensions(unit as EntityInstance);
				expect(exponents(result)).toEqual([1, 0, 0, 0, 0, 0, 0]);
			});

			test("NEWTON -> (1, 1, -2, 0, 0, 0, 0) (byte-identical to IFC2X3's/IFC4's own branch)", () => {
				const file = createTestFile("IFC4X3");
				const unit = buildSiUnit(file, "NEWTON");
				const result = ifc4x3.calc_IfcSIUnit_Dimensions(unit as EntityInstance);
				expect(exponents(result)).toEqual([1, 1, -2, 0, 0, 0, 0]);
			});

			// The ONE genuinely different branch vs. IFC2X3 (confirmed by a direct `diff`
			// -- same value as IFC4's own, see `ifc4x3.ts`'s own header comment): FARAD's
			// own `ElectricCurrentExponent` is `2` here, `1` in IFC2X3 -- real, verified
			// schema evolution, not a porting error.
			test("FARAD -> (-2, -1, 4, 2, 0, 0, 0) -- GENUINELY DIFFERENT from IFC2X3's own (-2, -1, 4, 1, 0, 0, 0), same as IFC4's own", () => {
				const file = createTestFile("IFC4X3");
				const unit = buildSiUnit(file, "FARAD");
				const result = ifc4x3.calc_IfcSIUnit_Dimensions(unit as EntityInstance);
				expect(exponents(result)).toEqual([-2, -1, 4, 2, 0, 0, 0]);
			});

			test("RADIAN -> (0, 0, 0, 0, 0, 0, 0) (an explicit branch, not the else fallback)", () => {
				const file = createTestFile("IFC4X3");
				const unit = buildSiUnit(file, "RADIAN");
				const result = ifc4x3.calc_IfcSIUnit_Dimensions(unit as EntityInstance);
				expect(exponents(result)).toEqual([0, 0, 0, 0, 0, 0, 0]);
			});

			test("an out-of-domain Name cannot even be constructed (native ENUMERATION-domain validation) -- the else branch is genuine dead code", () => {
				const file = createTestFile("IFC4X3");
				expect(() => buildSiUnit(file, "NOT_A_REAL_SI_UNIT_NAME")).toThrow(/Unable to find keyword in schema/);
			});

			test("end-to-end: unit.Dimensions resolves through the normal attribute-read path", () => {
				const file = createTestFile("IFC4X3");
				const unit = buildSiUnit(file, "WATT");
				const result = (unit as unknown as { Dimensions: unknown }).Dimensions;
				expect(exponents(result)).toEqual([2, 1, -3, 0, 0, 0, 0]);
			});
		});
	},
);

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

		// `IfcCartesianPoint.Dim` is a real EXPRESS DERIVE attribute on IFC2X3/IFC4; IFC4X3_ADD2
		// consolidated it into a NEW, differently-named formula at an abstract supertype level
		// (`calc_IfcPoint_Dim`, `IFC4X3_ADD2.py` line 9831 -- see `ifc4x3.ts`'s own header
		// comment for the full writeup).
		//
		// **UPDATE (Phase EX-2, IFC4X3's own THIRD chunk):** `calc_IfcPoint_Dim` is now one
		// of that chunk's own 15 assigned functions -- `IfcCartesianPoint.Dim` now resolves
		// correctly through the normal attribute-read path, demonstrating the dispatch
		// mechanism's own supertype walk reaching `IfcPoint` and finding a real registration
		// there. Re-verified directly against the real built addon, not assumed. The original
		// "genuine dispatch MISS" demonstration below is swapped to `IfcSurface.Dim`
		// (`calc_IfcSurface_Dim`, `IFC4X3_ADD2.py` line 11960, confirmed the ONLY `Dim`
		// formula declared anywhere on `IfcSurface`/its subtypes for ADD2 -- same "no
		// per-subtype override" shape `ifc4.ts`'s own fourth-chunk header comment already
		// found for IFC4 -- genuinely still unported, not one of this chunk's own 15 or any
		// prior chunk's), matching `ifc2x3.test.ts`'s/`ifc4.test.ts`'s own established
		// "swap to the next, still genuinely unported attribute" precedent for this exact
		// kind of test.
		test("IfcCartesianPoint.Dim now resolves through the normal attribute-read path (calc_IfcPoint_Dim ported, IFC4X3 chunk 3)", () => {
			const file: IfcFile = createTestFile("IFC4X3");
			const point = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
			expect((point as unknown as { Dim: number }).Dim).toBe(3);
		});

		test("IfcSurface.Dim is a genuine dispatch MISS on IFC4X3 (calc_IfcSurface_Dim not ported by this chunk)", () => {
			const file: IfcFile = createTestFile("IFC4X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const plane = file.createEntity("IfcPlane", placement);
			expect(() => (plane as unknown as { Dim: unknown }).Dim).toThrow(/has no attribute 'Dim'/);
		});
	},
);
