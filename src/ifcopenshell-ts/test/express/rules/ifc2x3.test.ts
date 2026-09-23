// This file was generated with the assistance of an AI coding tool.
//
// Original, hand-rolled coverage for Phase EX-2's first FOUR chunks
// (planning/ifcopenshell-ts/70-express-rules-plan.md §4): 53 of IFC2X3's 55
// `calc_*` DERIVE functions (`src/express/rules/ifc2x3.ts`) and their wiring into
// `EntityInstance`'s attribute-read path (`entityInstance.ts`'s `.get()`). Real Python
// has no per-function unit test for individual `calc_*` formulas -- verified directly
// (`src/ifcopenshell-python/test/test_rules.py` only exercises `rule_executor.run`
// against whole fixture `.ifc` files, checking WHERE-rule violation *counts*, never
// calling any single `calc_*` function or reading a DERIVE attribute directly; a
// repo-wide `grep -rl "calc_"` / `grep -rl "express.rules"` across
// `src/ifcopenshell-python/test/` found nothing else) -- so every test below is
// original, with expected values hand-derived directly from the real Python formula
// bodies in `IFC2X3.py` (not from this port's own code), matching this project's
// established "cross-check the real formula, not just the TS port" convention.
//
// Each expected value is hand-computed from the real Python source in a comment next
// to its test, so a future reader can re-derive it without re-reading `IFC2X3.py`.
//
// Chunk 1 (first `describe` block): 15 functions plus 3 disclosed, necessary extra
// EXPRESS-library functions. Three genuine, disclosed real-Python bugs (see
// `../../src/express/rules/ifc2x3.ts`'s own header comment for the full citations) are
// deliberately pinned here, not worked around: `IfcListToArray`'s rotation for
// `low === 0` (`calc_IfcBSplineCurve_ControlPoints`), `IfcFirstProjAxis`'s always-true
// tuple/list comparison (visible via a degenerate `Axis === X-axis` fixture), and
// `IfcBaseAxis`'s unconditional crash when only `Axis2` is set (2D transformation
// operators).
//
// Chunk 2 (second `describe` block, "Phase EX-2, chunk 2"): the NEXT 15 functions,
// all spatial-dimensionality (`Dim`) formulas. No new real-Python bugs found in this
// chunk -- see `../../src/express/rules/ifc2x3.ts`'s own chunk-2 header comment for
// the full verification writeup. This chunk also updates one PRE-EXISTING chunk-1
// test ("an unported DERIVE-shaped attribute still throws", in the
// "EntityInstance DERIVE-dispatch wiring" `describe` block below) that used
// `IfcCsgPrimitive3D.Dim` as its example of a not-yet-ported attribute -- chunk 2
// ports exactly that function, so the example was swapped for
// `IfcCompositeCurve.NSegments`, which remains genuinely unported.
//
// Chunk 3 (third `describe` block, "Phase EX-2, chunk 3"): the NEXT 10 assigned
// functions plus one necessary, disclosed extra (`calc_IfcCompositeCurve_NSegments`,
// needed for `calc_IfcCompositeCurve_ClosedCurve` to be functional at all -- see
// `../../src/express/rules/ifc2x3.ts`'s own chunk-3 header comment for the full
// rationale). No new real-Python bugs found in this chunk either. This chunk updates
// the same PRE-EXISTING "an unported DERIVE-shaped attribute still throws" test AGAIN
// -- chunk 3 ports exactly the `IfcCompositeCurve.NSegments` example chunk 2 swapped
// in, so it is swapped once more, this time for `IfcOrientedEdge.EdgeStart`
// (`IFC2X3.py` line 5611, `calc_IfcOrientedEdge_EdgeStart`), confirmed still
// genuinely unported.
//
// Chunk 4 (fourth `describe` block, "Phase EX-2, chunk 4"): the LAST 9 real `calc_*`
// functions this chunk's own dispatch identified as still unregistered after chunks
// 1-3's own 44 -- see `../../src/express/rules/ifc2x3.ts`'s own chunk-4 header
// comment for the full citations. **This chunk does NOT bring IFC2X3 to 55/55**:
// `calc_IfcDerivedUnit_Dimensions`/`calc_IfcSIUnit_Dimensions` remain genuinely
// unported (both need a defined-type-construction primitive this port doesn't have
// yet -- see that same header comment), so the running total after this chunk is
// 53/55, not 55/55 as this chunk's own dispatching task brief assumed. One genuine,
// real, verbatim Python bug is newly disclosed and pinned here (`IfcAddToBeginOfList`
// unconditionally crashes whenever its scalar argument is set -- confirmed both by
// reading `IFC2X3.py` directly AND by live execution against a real installed
// `ifcopenshell` 0.8.4 interpreter), affecting all 3 of this chunk's own
// `*Varying_Varying*` functions. This chunk updates the same PRE-EXISTING "an
// unported DERIVE-shaped attribute still throws" test a THIRD time -- chunk 4 ports
// exactly the `IfcOrientedEdge.EdgeStart` example chunk 3 swapped in, so it is
// swapped once more, this time for `IfcDerivedUnit.Dimensions` (one of the 2
// functions confirmed still genuinely unported even after this chunk, per this
// chunk's own finding above).

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../../src/entityInstance";
import * as ifc2x3 from "../../../src/express/rules/ifc2x3";
import { INDETERMINATE } from "../../../src/express/runtimeShim";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { createTestFile } from "../../bootstrap";

function ratios(direction: unknown): number[] {
	return (direction as EntityInstance & { DirectionRatios: number[] }).DirectionRatios;
}

function closeArray(actual: number[], expected: number[]) {
	expect(actual.length).toBe(expected.length);
	for (let i = 0; i < expected.length; i++) {
		expect(actual[i]).toBeCloseTo(expected[i], 10);
	}
}

describe("express/rules/ifc2x3 -- calc_* functions", () => {
	// --- calc_IfcAxis1Placement_Z ---
	describe("calc_IfcAxis1Placement_Z", () => {
		// Python: `nvl(IfcNormalise(axis), IfcDirection(DirectionRatios=[0.0, 0.0, 1.0]))`.
		// `Axis` unset (null) -> `exists(None)` is false -> `IfcNormalise` returns `None`
		// -> `nvl` falls back to the default `[0, 0, 1]`.
		test("Axis unset -> default [0,0,1]", () => {
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis1Placement", location, null);
			const z = ifc2x3.calc_IfcAxis1Placement_Z(placement as EntityInstance);
			closeArray(ratios(z), [0, 0, 1]);
		});

		// Axis = [0, 2, 0] (unnormalized) -> IfcNormalise divides by magnitude (2) -> [0, 1, 0].
		test("Axis set, unnormalized -> normalised in place", () => {
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const axis = file.createEntity("IfcDirection", [0.0, 2.0, 0.0]);
			const placement = file.createEntity("IfcAxis1Placement", location, axis);
			const z = ifc2x3.calc_IfcAxis1Placement_Z(placement as EntityInstance);
			closeArray(ratios(z), [0, 1, 0]);
		});

		// True end-to-end test: read `.Z` through the normal EntityInstance attribute-read
		// path (the Proxy -> cache-miss -> `.get()` -> DERIVE dispatch), not by calling the
		// ported function directly.
		test("end-to-end: placement.Z resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC2X3");
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
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement2D", location, null);
			const p = ifc2x3.calc_IfcAxis2Placement2D_P(placement as EntityInstance) as unknown[];
			expect(p).toHaveLength(2);
			closeArray(ratios(p[0]), [1, 0]);
			closeArray(ratios(p[1]), [0, 1]);
		});

		// RefDirection = [0,1] (already unit) -> d=[0,1]; OrthogonalComplement([0,1]) =
		// [-1, 0].
		test("RefDirection set -> [refdirection, orthogonal complement]", () => {
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const refDirection = file.createEntity("IfcDirection", [0.0, 1.0]);
			const placement = file.createEntity("IfcAxis2Placement2D", location, refDirection);
			const p = ifc2x3.calc_IfcAxis2Placement2D_P(placement as EntityInstance) as unknown[];
			closeArray(ratios(p[0]), [0, 1]);
			closeArray(ratios(p[1]), [-1, 0]);
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
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const p = ifc2x3.calc_IfcAxis2Placement3D_P(placement as EntityInstance) as unknown[];
			expect(p).toHaveLength(3);
			closeArray(ratios(p[0]), [1, 0, 0]);
			closeArray(ratios(p[1]), [0, 1, 0]);
			closeArray(ratios(p[2]), [0, 0, 1]);
		});

		// **Disclosed bug #1 pin** (see `ifc2x3.ts`'s header comment): with `Axis` set to
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
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const axis = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, axis, null);
			const p = ifc2x3.calc_IfcAxis2Placement3D_P(placement as EntityInstance) as unknown[];
			closeArray(ratios(p[0]), [1, 0, 0]);
			closeArray(ratios(p[2]), [1, 0, 0]);
			// The cross product of d1 and (degenerate) d2 is zero-magnitude, so
			// `IfcNormalise` returns `None` (`runtimeShim.INDETERMINATE` here) for the
			// middle ("Y") axis, matching real Python's own quirky-but-real chain.
			expect(p[1]).toBe(INDETERMINATE);
		});
	});

	// --- calc_IfcBSplineCurve_ControlPoints / calc_IfcBSplineCurve_UpperIndexOnControlPoints ---
	describe("calc_IfcBSplineCurve_UpperIndexOnControlPoints", () => {
		// Python: `sizeof(controlpointslist) - 1`.
		test("3 control points -> upper index 2", () => {
			const file = createTestFile("IFC2X3");
			const points = [
				file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
				file.createEntity("IfcCartesianPoint", [1.0, 0.0]),
				file.createEntity("IfcCartesianPoint", [2.0, 0.0]),
			];
			const curve = file.createEntity("IfcBSplineCurve", 3, points, "UNSPECIFIED", false, false);
			expect(ifc2x3.calc_IfcBSplineCurve_UpperIndexOnControlPoints(curve as EntityInstance)).toBe(2);
		});
	});

	describe("calc_IfcBSplineCurve_ControlPoints", () => {
		// **Disclosed bug #3 pin** (see `ifc2x3.ts`'s own header comment): real Python's
		// `IfcListToArray(ControlPointsList, 0, UpperIndexOnControlPoints)` cyclically
		// LEFT-ROTATES its input by one position for `low === 0` (hand-derived
		// symbolically: `res == [lis[1], lis[2], ..., lis[n-1], lis[0]]`), rather than
		// copying it in the same order -- ported faithfully, not silently fixed to an
		// identity copy. For 3 points [p0, p1, p2], the real (buggy) result is
		// [p1, p2, p0].
		test("3 control points -> cyclically rotated, NOT an identity copy (real bug, preserved)", () => {
			const file = createTestFile("IFC2X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0]);
			const p2 = file.createEntity("IfcCartesianPoint", [2.0, 0.0]);
			const curve = file.createEntity("IfcBSplineCurve", 3, [p0, p1, p2], "UNSPECIFIED", false, false);
			const controlPoints = ifc2x3.calc_IfcBSplineCurve_ControlPoints(curve as EntityInstance) as EntityInstance[];
			expect(controlPoints.map((p) => (p as unknown as { Coordinates: number[] }).Coordinates)).toEqual([
				[1, 0],
				[2, 0],
				[0, 0],
			]);
		});
	});

	// --- calc_IfcBooleanResult_Dim ---
	describe("calc_IfcBooleanResult_Dim", () => {
		// Python: `express_getattr(firstoperand, 'Dim', INDETERMINATE)`. FirstOperand is an
		// `IfcExtrudedAreaSolid` (`IfcSweptAreaSolid` -> `IfcSolidModel`, whose own `Dim`
		// is the constant `3`, `calc_IfcSolidModel_Dim` -- one of this chunk's own 3
		// necessary, disclosed extra functions, see `ifc2x3.ts`'s header comment).
		test("FirstOperand.Dim resolves via the supertype chain to IfcSolidModel's constant 3", () => {
			const file = createTestFile("IFC2X3");
			const profile = file.createEntity("IfcRectangleProfileDef", "AREA", null, null, 2.0, 3.0);
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const direction = file.createEntity("IfcDirection", [0.0, 0.0, 1.0]);
			const extruded = file.createEntity("IfcExtrudedAreaSolid", profile, placement, direction, 5.0);
			const half = file.createEntity("IfcHalfSpaceSolid");
			const booleanResult = file.createEntity("IfcBooleanResult", "DIFFERENCE", extruded, half);
			expect(ifc2x3.calc_IfcBooleanResult_Dim(booleanResult as EntityInstance)).toBe(3);
		});

		test("end-to-end: booleanResult.Dim resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC2X3");
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
			const file = createTestFile("IFC2X3");
			const corner = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const bbox = file.createEntity("IfcBoundingBox", corner, 1.0, 2.0, 3.0);
			expect(ifc2x3.calc_IfcBoundingBox_Dim(bbox as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcCartesianPoint_Dim ---
	describe("calc_IfcCartesianPoint_Dim", () => {
		// Python: `hiindex(coordinates)` -- the coordinate count.
		test("3D point -> 3", () => {
			const file = createTestFile("IFC2X3");
			const point = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
			expect(ifc2x3.calc_IfcCartesianPoint_Dim(point as EntityInstance)).toBe(3);
		});

		test("2D point -> 2", () => {
			const file = createTestFile("IFC2X3");
			const point = file.createEntity("IfcCartesianPoint", [1.0, 2.0]);
			expect(ifc2x3.calc_IfcCartesianPoint_Dim(point as EntityInstance)).toBe(2);
		});
	});

	// --- calc_IfcCartesianTransformationOperator_Scl / _Dim ---
	describe("calc_IfcCartesianTransformationOperator_Scl", () => {
		// Python: `nvl(scale, 1.0)`.
		test("Scale unset -> default 1.0", () => {
			const file = createTestFile("IFC2X3");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator", null, null, origin, null);
			expect(ifc2x3.calc_IfcCartesianTransformationOperator_Scl(cto as EntityInstance)).toBe(1.0);
		});

		test("Scale set -> that value", () => {
			const file = createTestFile("IFC2X3");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator", null, null, origin, 2.5);
			expect(ifc2x3.calc_IfcCartesianTransformationOperator_Scl(cto as EntityInstance)).toBe(2.5);
		});
	});

	describe("calc_IfcCartesianTransformationOperator_Dim", () => {
		// Python: `express_getattr(localorigin, 'Dim', INDETERMINATE)` -- LocalOrigin's
		// own Dim (a 3D IfcCartesianPoint -> 3).
		test("3D LocalOrigin -> 3", () => {
			const file = createTestFile("IFC2X3");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator", null, null, origin, null);
			expect(ifc2x3.calc_IfcCartesianTransformationOperator_Dim(cto as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcCartesianTransformationOperator2D_U ---
	describe("calc_IfcCartesianTransformationOperator2D_U", () => {
		// Python: `IfcBaseAxis(2, Axis1, Axis2, None)`. Both unset -> the final `else`
		// branch: `[IfcDirection([1,0]), IfcDirection([0,1])]`.
		test("Axis1 and Axis2 both unset -> [[1,0],[0,1]]", () => {
			const file = createTestFile("IFC2X3");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator2D", null, null, origin, null);
			const u = ifc2x3.calc_IfcCartesianTransformationOperator2D_U(cto as EntityInstance) as unknown[];
			closeArray(ratios(u[0]), [1, 0]);
			closeArray(ratios(u[1]), [0, 1]);
		});

		// **Disclosed bug #2b pin**: `Axis1` unset, `Axis2` set -- real Python's
		// `IfcBaseAxis` unconditionally hits `u[0].DirectionRatios[k] = ...` on a tuple,
		// raising `TypeError` every time. Ported as an equivalent thrown error.
		test("disclosed bug #2b: Axis1 unset, Axis2 set -> throws (real Python crashes here too)", () => {
			const file = createTestFile("IFC2X3");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const axis2 = file.createEntity("IfcDirection", [0.0, 1.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator2D", null, axis2, origin, null);
			expect(() => ifc2x3.calc_IfcCartesianTransformationOperator2D_U(cto as EntityInstance)).toThrow(
				/does not support item assignment/,
			);
		});
	});

	// --- calc_IfcCartesianTransformationOperator2DnonUniform_Scl2 ---
	describe("calc_IfcCartesianTransformationOperator2DnonUniform_Scl2", () => {
		// Python: `nvl(scale2, express_getattr(self, 'Scl', INDETERMINATE))`. Scale2
		// unset, Scale also unset -> falls back to Scl's own default (1.0).
		test("Scale2 and Scale both unset -> falls back through Scl's own default (1.0)", () => {
			const file = createTestFile("IFC2X3");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator2DnonUniform", null, null, origin, null, null);
			expect(ifc2x3.calc_IfcCartesianTransformationOperator2DnonUniform_Scl2(cto as EntityInstance)).toBe(1.0);
		});

		test("Scale2 set -> that value, independent of Scale", () => {
			const file = createTestFile("IFC2X3");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator2DnonUniform", null, null, origin, 2.0, 4.0);
			expect(ifc2x3.calc_IfcCartesianTransformationOperator2DnonUniform_Scl2(cto as EntityInstance)).toBe(4.0);
		});
	});

	// --- calc_IfcCartesianTransformationOperator3D_U ---
	describe("calc_IfcCartesianTransformationOperator3D_U", () => {
		// Python: `IfcBaseAxis(3, Axis1, Axis2, Axis3)`. All unset -> the `dim == 3`
		// branch's own default chain resolves to the standard identity basis (same
		// hand-derivation as `calc_IfcAxis2Placement3D_P`'s identity case, just via
		// `IfcSecondProjAxis` for the middle term instead of `IfcCrossProduct` -- both
		// reduce to [0,1,0] here).
		test("Axis1/Axis2/Axis3 all unset -> standard identity basis", () => {
			const file = createTestFile("IFC2X3");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator3D", null, null, origin, null, null);
			const u = ifc2x3.calc_IfcCartesianTransformationOperator3D_U(cto as EntityInstance) as unknown[];
			closeArray(ratios(u[0]), [1, 0, 0]);
			closeArray(ratios(u[1]), [0, 1, 0]);
			closeArray(ratios(u[2]), [0, 0, 1]);
		});
	});

	// --- calc_IfcCartesianTransformationOperator3DnonUniform_Scl2 / _Scl3 ---
	describe("calc_IfcCartesianTransformationOperator3DnonUniform_Scl2/_Scl3", () => {
		// Python: `nvl(scale2/scale3, express_getattr(self, 'Scl', INDETERMINATE))`.
		test("Scale2/Scale3 unset, Scale=3.0 -> both fall back to Scl=3.0", () => {
			const file = createTestFile("IFC2X3");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity(
				"IfcCartesianTransformationOperator3DnonUniform",
				null,
				null,
				origin,
				3.0,
				null,
				null,
				null,
			);
			expect(ifc2x3.calc_IfcCartesianTransformationOperator3DnonUniform_Scl2(cto as EntityInstance)).toBe(3.0);
			expect(ifc2x3.calc_IfcCartesianTransformationOperator3DnonUniform_Scl3(cto as EntityInstance)).toBe(3.0);
		});

		test("Scale2/Scale3 set -> their own values", () => {
			const file = createTestFile("IFC2X3");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity(
				"IfcCartesianTransformationOperator3DnonUniform",
				null,
				null,
				origin,
				3.0,
				null,
				5.0,
				7.0,
			);
			expect(ifc2x3.calc_IfcCartesianTransformationOperator3DnonUniform_Scl2(cto as EntityInstance)).toBe(5.0);
			expect(ifc2x3.calc_IfcCartesianTransformationOperator3DnonUniform_Scl3(cto as EntityInstance)).toBe(7.0);
		});
	});

	// --- the 3 minimal, necessary, disclosed extra functions ---
	describe("calc_IfcDirection_Dim / calc_IfcVector_Dim / calc_IfcSolidModel_Dim", () => {
		test("calc_IfcDirection_Dim: hiindex(DirectionRatios)", () => {
			const file = createTestFile("IFC2X3");
			const direction = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
			expect(ifc2x3.calc_IfcDirection_Dim(direction as EntityInstance)).toBe(3);
		});

		test("calc_IfcVector_Dim: Orientation.Dim", () => {
			const file = createTestFile("IFC2X3");
			const direction = file.createEntity("IfcDirection", [1.0, 0.0]);
			const vector = file.createEntity("IfcVector", direction, 5.0);
			expect(ifc2x3.calc_IfcVector_Dim(vector as EntityInstance)).toBe(2);
		});

		test("calc_IfcSolidModel_Dim: always 3", () => {
			const file = createTestFile("IFC2X3");
			const solid = file.createEntity("IfcSolidModel");
			expect(ifc2x3.calc_IfcSolidModel_Dim(solid as EntityInstance)).toBe(3);
		});
	});
});

// Phase EX-2, second chunk (planning/ifcopenshell-ts/70-express-rules-plan.md §4):
// the NEXT 15 IFC2X3 `calc_*` DERIVE functions, all spatial-dimensionality (`Dim`)
// formulas -- either a bare constant or a delegation to some other attribute's own
// (possibly also DERIVE) `Dim`. Same "no real Python unit test exists for any
// `calc_*` function" situation as chunk 1 (see this file's own top-of-file header
// comment) -- every expected value below is hand-derived directly from the real
// `IFC2X3.py` formula bodies, not from this port's own code.
describe("express/rules/ifc2x3 -- calc_* functions (Phase EX-2, chunk 2)", () => {
	// --- calc_IfcCompositeCurveSegment_Dim ---
	describe("calc_IfcCompositeCurveSegment_Dim", () => {
		// Python: `express_getattr(ParentCurve, 'Dim', INDETERMINATE)`. ParentCurve is a
		// 3D IfcPolyline -> its own Dim resolves via `calc_IfcCurve_Dim`'s
		// `IfcPolyline` branch to `Points[0].Dim` = 3 (hiindex of a 3-coordinate point).
		test("ParentCurve.Dim resolves through calc_IfcCurve_Dim's IfcPolyline branch", () => {
			const file = createTestFile("IFC2X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const segment = file.createEntity("IfcCompositeCurveSegment", "CONTINUOUS", true, polyline);
			expect(ifc2x3.calc_IfcCompositeCurveSegment_Dim(segment as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcCsgPrimitive3D_Dim ---
	describe("calc_IfcCsgPrimitive3D_Dim", () => {
		// Python: `return 3` (unconditional constant).
		test("always 3", () => {
			const file = createTestFile("IFC2X3");
			const csgPrimitive = file.createEntity("IfcCsgPrimitive3D");
			expect(ifc2x3.calc_IfcCsgPrimitive3D_Dim(csgPrimitive as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcCurve_Dim / IfcCurveDim (all 8 dispatch branches) ---
	describe("calc_IfcCurve_Dim", () => {
		// Python: `IfcCurveDim(self)` -> `'ifc2x3.ifcline' in typeof(curve)` branch ->
		// `express_getattr(express_getattr(curve, 'Pnt', INDETERMINATE), 'Dim', INDETERMINATE)`.
		test("IfcLine -> Pnt.Dim", () => {
			const file = createTestFile("IFC2X3");
			const pnt = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const line = file.createEntity("IfcLine", pnt, null);
			expect(ifc2x3.calc_IfcCurve_Dim(line as EntityInstance)).toBe(3);
		});

		// `'ifc2x3.ifcconic' in typeof(curve)` branch (matched via IfcCircle, a concrete
		// IfcConic subtype) -> `Position.Dim`. Position is a 3D IfcAxis2Placement3D
		// whose own Dim resolves through `calc_IfcPlacement_Dim` -> `Location.Dim` = 3.
		test("IfcCircle (IfcConic subtype) -> Position.Dim", () => {
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const circle = file.createEntity("IfcCircle", placement, 5.0);
			expect(ifc2x3.calc_IfcCurve_Dim(circle as EntityInstance)).toBe(3);
		});

		// `'ifc2x3.ifcpolyline' in typeof(curve)` branch -> `Points[0].Dim`. A 2D
		// polyline's first point has 2 coordinates.
		test("IfcPolyline -> Points[0].Dim", () => {
			const file = createTestFile("IFC2X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			expect(ifc2x3.calc_IfcCurve_Dim(polyline as EntityInstance)).toBe(2);
		});

		// `'ifc2x3.ifctrimmedcurve' in typeof(curve)` branch -> recurses:
		// `IfcCurveDim(BasisCurve)`. BasisCurve is the same 2D polyline as above -> 2.
		test("IfcTrimmedCurve -> recurses into IfcCurveDim(BasisCurve)", () => {
			const file = createTestFile("IFC2X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const trimmed = file.createEntity("IfcTrimmedCurve", polyline);
			expect(ifc2x3.calc_IfcCurve_Dim(trimmed as EntityInstance)).toBe(2);
		});

		// **Disclosed fix pin** (see `ifcCurveDim`'s own doc comment in `ifc2x3.ts`,
		// found by an adversarial review pass on this chunk's own PR): an
		// `IfcTrimmedCurve` with an unset (`$`) `BasisCurve` -- schema-mandatory,
		// but not enforced by this port's own attribute-write path -- recurses into
		// `ifcCurveDim(INDETERMINATE)`. Real Python's own `IfcCurveDim` falls
		// through every branch for an indeterminate `curve` (because
		// `indeterminate_type.__bool__` is `False`, so `typeof(INDETERMINATE)`
		// safely returns an empty set) and returns `None` -- ported to return
		// `null` the same way, via an explicit `exists()` guard this port needs
		// but real Python doesn't (no operator-overloading equivalent). Before the
		// fix, this threw (`typeOf` dereferencing `.declaration()` on the
		// `INDETERMINATE` symbol) instead of returning `null`.
		test("IfcTrimmedCurve with an unset BasisCurve -> null, not a crash (disclosed fix)", () => {
			const file = createTestFile("IFC2X3");
			const trimmed = file.createEntity("IfcTrimmedCurve", null);
			expect(ifc2x3.calc_IfcCurve_Dim(trimmed as EntityInstance)).toBeNull();
		});

		// `'ifc2x3.ifccompositecurve' in typeof(curve)` branch -> `Segments[0].Dim`, a
		// `calc_IfcCompositeCurveSegment_Dim` itself delegating to `ParentCurve.Dim`
		// (the same 3D polyline pattern as this chunk's first test above -> 3).
		test("IfcCompositeCurve -> Segments[0].Dim", () => {
			const file = createTestFile("IFC2X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
			const parentCurve = file.createEntity("IfcPolyline", [p0, p1]);
			const segment = file.createEntity("IfcCompositeCurveSegment", "CONTINUOUS", true, parentCurve);
			const compositeCurve = file.createEntity("IfcCompositeCurve", [segment], false);
			expect(ifc2x3.calc_IfcCurve_Dim(compositeCurve as EntityInstance)).toBe(3);
		});

		// `'ifc2x3.ifcbsplinecurve' in typeof(curve)` branch ->
		// `ControlPointsList[0].Dim`.
		test("IfcBSplineCurve -> ControlPointsList[0].Dim", () => {
			const file = createTestFile("IFC2X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
			const p2 = file.createEntity("IfcCartesianPoint", [2.0, 0.0, 0.0]);
			const curve = file.createEntity("IfcBSplineCurve", 2, [p0, p1, p2], "UNSPECIFIED", false, false);
			expect(ifc2x3.calc_IfcCurve_Dim(curve as EntityInstance)).toBe(3);
		});

		// `'ifc2x3.ifcoffsetcurve2d' in typeof(curve)` branch -> `return 2` (constant,
		// independent of BasisCurve).
		test("IfcOffsetCurve2D -> always 2", () => {
			const file = createTestFile("IFC2X3");
			const offsetCurve = file.createEntity("IfcOffsetCurve2D");
			expect(ifc2x3.calc_IfcCurve_Dim(offsetCurve as EntityInstance)).toBe(2);
		});

		// `'ifc2x3.ifcoffsetcurve3d' in typeof(curve)` branch -> `return 3` (constant).
		test("IfcOffsetCurve3D -> always 3", () => {
			const file = createTestFile("IFC2X3");
			const offsetCurve = file.createEntity("IfcOffsetCurve3D");
			expect(ifc2x3.calc_IfcCurve_Dim(offsetCurve as EntityInstance)).toBe(3);
		});

		// End-to-end: read `.Dim` on a real `IfcPolyline` through the normal
		// `EntityInstance` attribute-read path (Proxy -> cache-miss -> `.get()` ->
		// DERIVE dispatch resolving `IfcPolyline` -> ... -> `IfcCurve.Dim`), not by
		// calling the ported function directly.
		test("end-to-end: polyline.Dim resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC2X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			expect((polyline as unknown as { Dim: number }).Dim).toBe(3);
		});
	});

	// --- calc_IfcCurveBoundedPlane_Dim ---
	describe("calc_IfcCurveBoundedPlane_Dim", () => {
		// Python: `express_getattr(BasisSurface, 'Dim', INDETERMINATE)`. BasisSurface is
		// an `IfcPlane` (`IfcElementarySurface` subtype) with a 3D Position -> Dim = 3
		// via `calc_IfcElementarySurface_Dim`.
		test("BasisSurface.Dim resolves via calc_IfcElementarySurface_Dim", () => {
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const plane = file.createEntity("IfcPlane", placement);
			const curveBoundedPlane = file.createEntity("IfcCurveBoundedPlane", plane);
			expect(ifc2x3.calc_IfcCurveBoundedPlane_Dim(curveBoundedPlane as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcElementarySurface_Dim ---
	describe("calc_IfcElementarySurface_Dim", () => {
		// Python: `express_getattr(Position, 'Dim', INDETERMINATE)`. Position is a 3D
		// IfcAxis2Placement3D -> Dim = 3 (via `calc_IfcPlacement_Dim`).
		test("Position.Dim resolves via calc_IfcPlacement_Dim", () => {
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const plane = file.createEntity("IfcPlane", placement);
			expect(ifc2x3.calc_IfcElementarySurface_Dim(plane as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcFaceBasedSurfaceModel_Dim ---
	describe("calc_IfcFaceBasedSurfaceModel_Dim", () => {
		// Python: `return 3` (unconditional constant).
		test("always 3", () => {
			const file = createTestFile("IFC2X3");
			const model = file.createEntity("IfcFaceBasedSurfaceModel");
			expect(ifc2x3.calc_IfcFaceBasedSurfaceModel_Dim(model as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcGeometricSet_Dim ---
	describe("calc_IfcGeometricSet_Dim", () => {
		// Python: `express_getattr(express_getitem(Elements, 0, INDETERMINATE), 'Dim',
		// INDETERMINATE)` -- the FIRST element's own Dim. A 2D IfcCartesianPoint's own
		// Dim (`calc_IfcCartesianPoint_Dim`, chunk 1) is 2.
		test("Elements[0].Dim resolves via calc_IfcCartesianPoint_Dim", () => {
			const file = createTestFile("IFC2X3");
			const point = file.createEntity("IfcCartesianPoint", [1.0, 2.0]);
			const geometricSet = file.createEntity("IfcGeometricSet", [point]);
			expect(ifc2x3.calc_IfcGeometricSet_Dim(geometricSet as EntityInstance)).toBe(2);
		});
	});

	// --- calc_IfcHalfSpaceSolid_Dim ---
	describe("calc_IfcHalfSpaceSolid_Dim", () => {
		// Python: `return 3` (unconditional constant).
		test("always 3", () => {
			const file = createTestFile("IFC2X3");
			const halfSpace = file.createEntity("IfcHalfSpaceSolid");
			expect(ifc2x3.calc_IfcHalfSpaceSolid_Dim(halfSpace as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcPlacement_Dim ---
	describe("calc_IfcPlacement_Dim", () => {
		// Python: `express_getattr(Location, 'Dim', INDETERMINATE)`. Location is a 3D
		// IfcCartesianPoint -> Dim = 3.
		test("Location.Dim resolves via calc_IfcCartesianPoint_Dim", () => {
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			expect(ifc2x3.calc_IfcPlacement_Dim(placement as EntityInstance)).toBe(3);
		});

		// End-to-end: read `.Dim` on a real `IfcAxis2Placement3D` through the normal
		// `EntityInstance` attribute-read path -- `IfcAxis2Placement3D` has no own
		// `Dim` function, so dispatch must walk its supertype chain up to
		// `IfcPlacement.Dim` to resolve it.
		test("end-to-end: placement.Dim resolves through the normal attribute-read path via supertype dispatch", () => {
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			expect((placement as unknown as { Dim: number }).Dim).toBe(3);
		});
	});

	// --- calc_IfcPointOnCurve_Dim ---
	describe("calc_IfcPointOnCurve_Dim", () => {
		// Python: `express_getattr(BasisCurve, 'Dim', INDETERMINATE)`. BasisCurve is a
		// 2D IfcPolyline -> Dim = 2 (via `calc_IfcCurve_Dim`).
		test("BasisCurve.Dim resolves via calc_IfcCurve_Dim", () => {
			const file = createTestFile("IFC2X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const pointOnCurve = file.createEntity("IfcPointOnCurve", polyline);
			expect(ifc2x3.calc_IfcPointOnCurve_Dim(pointOnCurve as EntityInstance)).toBe(2);
		});
	});

	// --- calc_IfcPointOnSurface_Dim ---
	describe("calc_IfcPointOnSurface_Dim", () => {
		// Python: `express_getattr(BasisSurface, 'Dim', INDETERMINATE)`. BasisSurface is
		// a 3D IfcPlane -> Dim = 3 (via `calc_IfcElementarySurface_Dim`).
		test("BasisSurface.Dim resolves via calc_IfcElementarySurface_Dim", () => {
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const plane = file.createEntity("IfcPlane", placement);
			const pointOnSurface = file.createEntity("IfcPointOnSurface", plane);
			expect(ifc2x3.calc_IfcPointOnSurface_Dim(pointOnSurface as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcRectangularTrimmedSurface_Dim ---
	describe("calc_IfcRectangularTrimmedSurface_Dim", () => {
		// Python: `express_getattr(BasisSurface, 'Dim', INDETERMINATE)`. Same 3D IfcPlane
		// pattern as `calc_IfcPointOnSurface_Dim` above -> 3.
		test("BasisSurface.Dim resolves via calc_IfcElementarySurface_Dim", () => {
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const plane = file.createEntity("IfcPlane", placement);
			const trimmedSurface = file.createEntity("IfcRectangularTrimmedSurface", plane);
			expect(ifc2x3.calc_IfcRectangularTrimmedSurface_Dim(trimmedSurface as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcSectionedSpine_Dim ---
	describe("calc_IfcSectionedSpine_Dim", () => {
		// Python: `return 3` (unconditional constant).
		test("always 3", () => {
			const file = createTestFile("IFC2X3");
			const spine = file.createEntity("IfcSectionedSpine");
			expect(ifc2x3.calc_IfcSectionedSpine_Dim(spine as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcShellBasedSurfaceModel_Dim ---
	describe("calc_IfcShellBasedSurfaceModel_Dim", () => {
		// Python: `return 3` (unconditional constant).
		test("always 3", () => {
			const file = createTestFile("IFC2X3");
			const model = file.createEntity("IfcShellBasedSurfaceModel");
			expect(ifc2x3.calc_IfcShellBasedSurfaceModel_Dim(model as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcSweptSurface_Dim ---
	describe("calc_IfcSweptSurface_Dim", () => {
		// Python: `express_getattr(Position, 'Dim', INDETERMINATE)`. Position is a 3D
		// IfcAxis2Placement3D -> Dim = 3 (via `calc_IfcPlacement_Dim`). Tested through a
		// concrete `IfcSurfaceOfLinearExtrusion` (an `IfcSweptSurface` subtype with no
		// own `Dim` function -> dispatch walks up to `IfcSweptSurface.Dim`).
		test("Position.Dim resolves via calc_IfcPlacement_Dim, dispatched through a concrete subtype", () => {
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const direction = file.createEntity("IfcDirection", [0.0, 0.0, 1.0]);
			const surface = file.createEntity("IfcSurfaceOfLinearExtrusion", null, placement, direction, 5.0);
			expect(ifc2x3.calc_IfcSweptSurface_Dim(surface as EntityInstance)).toBe(3);
		});
	});
});

describe("express/rules/ifc2x3 -- calc_* functions (Phase EX-2, chunk 3)", () => {
	// --- calc_IfcCompositeCurve_ClosedCurve (+ its necessary calc_IfcCompositeCurve_NSegments dependency) ---
	describe("calc_IfcCompositeCurve_ClosedCurve", () => {
		// Python: `express_getattr(Segments[NSegments - 1], 'Transition', INDETERMINATE)
		// != discontinuous`. NSegments = sizeof(Segments) = 2 here, so index 1 (0-based)
		// -- the LAST segment -- decides the result, regardless of the first segment's
		// own Transition.
		test("last segment CONTINUOUS (first DISCONTINUOUS) -> closed (true)", () => {
			const file = createTestFile("IFC2X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const seg1 = file.createEntity("IfcCompositeCurveSegment", "DISCONTINUOUS", true, polyline);
			const seg2 = file.createEntity("IfcCompositeCurveSegment", "CONTINUOUS", true, polyline);
			const compositeCurve = file.createEntity("IfcCompositeCurve", [seg1, seg2], false);
			expect(ifc2x3.calc_IfcCompositeCurve_ClosedCurve(compositeCurve as EntityInstance)).toBe(true);
		});

		test("last segment DISCONTINUOUS (first CONTINUOUS) -> not closed (false)", () => {
			const file = createTestFile("IFC2X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const seg1 = file.createEntity("IfcCompositeCurveSegment", "CONTINUOUS", true, polyline);
			const seg2 = file.createEntity("IfcCompositeCurveSegment", "DISCONTINUOUS", true, polyline);
			const compositeCurve = file.createEntity("IfcCompositeCurve", [seg1, seg2], false);
			expect(ifc2x3.calc_IfcCompositeCurve_ClosedCurve(compositeCurve as EntityInstance)).toBe(false);
		});

		// Sanity check on the necessary extra dependency itself (see this file's own
		// header comment): Python: `sizeof(Segments)`.
		test("calc_IfcCompositeCurve_NSegments: sizeof(Segments)", () => {
			const file = createTestFile("IFC2X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const seg1 = file.createEntity("IfcCompositeCurveSegment", "CONTINUOUS", true, polyline);
			const seg2 = file.createEntity("IfcCompositeCurveSegment", "CONTINUOUS", true, polyline);
			const compositeCurve = file.createEntity("IfcCompositeCurve", [seg1, seg2], false);
			expect(ifc2x3.calc_IfcCompositeCurve_NSegments(compositeCurve as EntityInstance)).toBe(2);
		});

		// End-to-end: read `.ClosedCurve` through the normal `EntityInstance`
		// attribute-read path -- exercises both `ClosedCurve` and its own transitive
		// `.NSegments` dispatch together.
		test("end-to-end: compositeCurve.ClosedCurve resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC2X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const seg1 = file.createEntity("IfcCompositeCurveSegment", "DISCONTINUOUS", true, polyline);
			const seg2 = file.createEntity("IfcCompositeCurveSegment", "CONTINUOUS", true, polyline);
			const compositeCurve = file.createEntity("IfcCompositeCurve", [seg1, seg2], false);
			expect((compositeCurve as unknown as { ClosedCurve: boolean }).ClosedCurve).toBe(true);
		});
	});

	// --- calc_IfcEdgeLoop_Ne ---
	describe("calc_IfcEdgeLoop_Ne", () => {
		// Python: `sizeof(EdgeList)`.
		test("Ne = sizeof(EdgeList)", () => {
			const file = createTestFile("IFC2X3");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
			const v0 = file.createEntity("IfcVertexPoint", p0);
			const v1 = file.createEntity("IfcVertexPoint", p1);
			const edge1 = file.createEntity("IfcEdge", v0, v1);
			const edge2 = file.createEntity("IfcEdge", v1, v0);
			const oe1 = file.createEntity("IfcOrientedEdge", edge1, true);
			const oe2 = file.createEntity("IfcOrientedEdge", edge2, true);
			const edgeLoop = file.createEntity("IfcEdgeLoop", [oe1, oe2]);
			expect(ifc2x3.calc_IfcEdgeLoop_Ne(edgeLoop as EntityInstance)).toBe(2);
		});
	});

	// --- calc_IfcGeometricRepresentationSubContext_* (4 functions, all delegate to ParentContext) ---
	//
	// Fixture note: `IfcGeometricRepresentationSubContext`'s real, native attribute
	// order (`declaration().as_entity().all_attributes()`, confirmed empirically, not
	// assumed from `generated/ifc2x3.d.ts`) is the FULL inherited list, including the
	// 4 attributes this subtype overrides as DERIVE (`CoordinateSpaceDimension`,
	// `Precision`, `WorldCoordinateSystem`, `TrueNorth`, inherited positionally from
	// `IfcGeometricRepresentationContext`) -- `createEntity` needs all 10 positional
	// slots, not just the 6 genuinely-storable ones `generated/ifc2x3.d.ts` documents
	// (that `.d.ts` is accurate for reading -- those 4 are never read from storage,
	// always DERIVE-dispatched -- but not for this port's own positional
	// `createEntity` convention, which mirrors the full underlying declaration).
	describe("calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem / _CoordinateSpaceDimension / _TrueNorth / _Precision", () => {
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

		// Python: `express_getattr(ParentContext, 'WorldCoordinateSystem', INDETERMINATE)`.
		test("WorldCoordinateSystem delegates to ParentContext.WorldCoordinateSystem", () => {
			const file = createTestFile("IFC2X3");
			const trueNorth = file.createEntity("IfcDirection", [0.0, 1.0, 0.0]);
			const { wcs, subContext } = buildSubContext(file, trueNorth as EntityInstance, 1.0e-5);
			const result = ifc2x3.calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem(
				subContext as EntityInstance,
			) as EntityInstance;
			expect(result.id()).toBe((wcs as EntityInstance).id());
		});

		// Python: `express_getattr(ParentContext, 'CoordinateSpaceDimension', INDETERMINATE)`.
		test("CoordinateSpaceDimension delegates to ParentContext.CoordinateSpaceDimension", () => {
			const file = createTestFile("IFC2X3");
			const trueNorth = file.createEntity("IfcDirection", [0.0, 1.0, 0.0]);
			const { subContext } = buildSubContext(file, trueNorth as EntityInstance, 1.0e-5);
			expect(
				ifc2x3.calc_IfcGeometricRepresentationSubContext_CoordinateSpaceDimension(subContext as EntityInstance),
			).toBe(3);
		});

		// Python: `nvl(express_getattr(ParentContext, 'TrueNorth', INDETERMINATE), ...)`.
		// ParentContext.TrueNorth is set -> returned directly, the WorldCoordinateSystem
		// fallback path is never reached.
		test("TrueNorth: ParentContext.TrueNorth set -> returned directly", () => {
			const file = createTestFile("IFC2X3");
			const trueNorth = file.createEntity("IfcDirection", [0.0, 1.0, 0.0]);
			const { subContext } = buildSubContext(file, trueNorth as EntityInstance, 1.0e-5);
			const result = ifc2x3.calc_IfcGeometricRepresentationSubContext_TrueNorth(
				subContext as EntityInstance,
			) as EntityInstance;
			expect(result.id()).toBe((trueNorth as EntityInstance).id());
		});

		// ParentContext.TrueNorth unset -> falls back to
		// `self.WorldCoordinateSystem.P[2 - EXPRESS_ONE_BASED_INDEXING]` (0-based index
		// 1). `self.WorldCoordinateSystem` = ParentContext.WorldCoordinateSystem = the
		// `IfcAxis2Placement3D` built with Axis/RefDirection both unset -- whose own `P`
		// (`calc_IfcAxis2Placement3D_P`, chunk 1) is hand-derived elsewhere in this same
		// file (the "Axis and RefDirection both unset -> standard identity basis" test
		// above) as `[[1,0,0], [0,1,0], [0,0,1]]` -- so `P[1]` = `[0,1,0]`.
		test("TrueNorth: ParentContext.TrueNorth unset -> falls back to WorldCoordinateSystem.P[1]", () => {
			const file = createTestFile("IFC2X3");
			const { subContext } = buildSubContext(file, null, 1.0e-5);
			const result = ifc2x3.calc_IfcGeometricRepresentationSubContext_TrueNorth(subContext as EntityInstance);
			closeArray(ratios(result), [0, 1, 0]);
		});

		// Python: `nvl(express_getattr(ParentContext, 'Precision', INDETERMINATE), 1)`.
		// ParentContext.Precision is set -> returned directly.
		test("Precision: ParentContext.Precision set -> returned directly", () => {
			const file = createTestFile("IFC2X3");
			const { subContext } = buildSubContext(file, null, 1.0e-5);
			expect(ifc2x3.calc_IfcGeometricRepresentationSubContext_Precision(subContext as EntityInstance)).toBe(1.0e-5);
		});

		// ParentContext.Precision unset -> falls back to the literal default `1`.
		test("Precision: ParentContext.Precision unset -> falls back to 1", () => {
			const file = createTestFile("IFC2X3");
			const { subContext } = buildSubContext(file, null, null);
			expect(ifc2x3.calc_IfcGeometricRepresentationSubContext_Precision(subContext as EntityInstance)).toBe(1);
		});

		// End-to-end: read `.CoordinateSpaceDimension` through the normal
		// `EntityInstance` attribute-read path.
		test("end-to-end: subContext.CoordinateSpaceDimension resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC2X3");
			const trueNorth = file.createEntity("IfcDirection", [0.0, 1.0, 0.0]);
			const { subContext } = buildSubContext(file, trueNorth as EntityInstance, 1.0e-5);
			expect((subContext as unknown as { CoordinateSpaceDimension: number }).CoordinateSpaceDimension).toBe(3);
		});
	});

	// --- calc_IfcMaterialLayerSet_TotalThickness (+ its IfcMlsTotalThickness helper) ---
	describe("calc_IfcMaterialLayerSet_TotalThickness", () => {
		// Python: `IfcMlsTotalThickness` sums every `MaterialLayers[].LayerThickness`
		// (real Python's own local variable is confusingly named `max`, but it is a
		// running SUM, not a maximum -- see `ifc2x3.ts`'s own header comment).
		// 10.0 + 20.0 + 5.0 = 35.0.
		test("sums every MaterialLayers[].LayerThickness (not a maximum, despite real Python's own `max` variable name)", () => {
			const file = createTestFile("IFC2X3");
			const layer1 = file.createEntity("IfcMaterialLayer", null, 10.0, null);
			const layer2 = file.createEntity("IfcMaterialLayer", null, 20.0, null);
			const layer3 = file.createEntity("IfcMaterialLayer", null, 5.0, null);
			const layerSet = file.createEntity("IfcMaterialLayerSet", [layer1, layer2, layer3], null);
			expect(ifc2x3.calc_IfcMaterialLayerSet_TotalThickness(layerSet as EntityInstance)).toBeCloseTo(35.0, 10);
		});

		// Single-layer set: the `sizeof(MaterialLayers) > 1` loop guard is never
		// entered, `total` stays at its initial value (`MaterialLayers[0].LayerThickness`).
		test("single-layer set: total is just that one layer's own thickness", () => {
			const file = createTestFile("IFC2X3");
			const layer1 = file.createEntity("IfcMaterialLayer", null, 42.0, null);
			const layerSet = file.createEntity("IfcMaterialLayerSet", [layer1], null);
			expect(ifc2x3.calc_IfcMaterialLayerSet_TotalThickness(layerSet as EntityInstance)).toBeCloseTo(42.0, 10);
		});

		// End-to-end: read `.TotalThickness` through the normal `EntityInstance`
		// attribute-read path.
		test("end-to-end: layerSet.TotalThickness resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC2X3");
			const layer1 = file.createEntity("IfcMaterialLayer", null, 10.0, null);
			const layer2 = file.createEntity("IfcMaterialLayer", null, 20.0, null);
			const layerSet = file.createEntity("IfcMaterialLayerSet", [layer1, layer2], null);
			expect((layerSet as unknown as { TotalThickness: number }).TotalThickness).toBeCloseTo(30.0, 10);
		});
	});

	// --- calc_IfcTable_NumberOfCellsInRow / _NumberOfHeadings / _NumberOfDataRows ---
	describe("calc_IfcTable_NumberOfCellsInRow / _NumberOfHeadings / _NumberOfDataRows", () => {
		function buildTable(file: IfcFile) {
			// row1: heading, 3 cells. row2/row3: data rows, 2 cells each.
			const row1 = file.createEntity("IfcTableRow", ["a", "b", "c"], true);
			const row2 = file.createEntity("IfcTableRow", ["1", "2"], false);
			const row3 = file.createEntity("IfcTableRow", ["3", "4"], false);
			return file.createEntity("IfcTable", "MyTable", [row1, row2, row3]);
		}

		// Python: `hiindex(Rows[0].RowCells)` -- the FIRST row's own cell count, 3.
		test("NumberOfCellsInRow: hiindex(Rows[0].RowCells)", () => {
			const file = createTestFile("IFC2X3");
			const table = buildTable(file);
			expect(ifc2x3.calc_IfcTable_NumberOfCellsInRow(table as EntityInstance)).toBe(3);
		});

		// Python: `sizeof([temp for temp in Rows if temp.IsHeading])` -- 1 heading row.
		test("NumberOfHeadings: count of rows with IsHeading true", () => {
			const file = createTestFile("IFC2X3");
			const table = buildTable(file);
			expect(ifc2x3.calc_IfcTable_NumberOfHeadings(table as EntityInstance)).toBe(1);
		});

		// Python: `sizeof([temp for temp in Rows if not temp.IsHeading])` -- 2 data rows.
		test("NumberOfDataRows: count of rows with IsHeading false", () => {
			const file = createTestFile("IFC2X3");
			const table = buildTable(file);
			expect(ifc2x3.calc_IfcTable_NumberOfDataRows(table as EntityInstance)).toBe(2);
		});

		// End-to-end: read `.NumberOfHeadings` through the normal `EntityInstance`
		// attribute-read path.
		test("end-to-end: table.NumberOfHeadings resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC2X3");
			const table = buildTable(file);
			expect((table as unknown as { NumberOfHeadings: number }).NumberOfHeadings).toBe(1);
		});
	});
});

describe("express/rules/ifc2x3 -- calc_* functions (Phase EX-2, chunk 4)", () => {
	// --- calc_IfcOrientedEdge_EdgeStart / calc_IfcOrientedEdge_EdgeEnd (+ IfcBooleanChoose) ---
	describe("calc_IfcOrientedEdge_EdgeStart / calc_IfcOrientedEdge_EdgeEnd", () => {
		// Fixture note (same shape as chunk 3's own `IfcGeometricRepresentationSubContext`
		// fixture note above): `IfcOrientedEdge`'s real, native attribute order
		// (`declaration().as_entity().all_attributes()`, confirmed empirically, not
		// assumed from `generated/ifc2x3.d.ts`) is `[EdgeStart, EdgeEnd, EdgeElement,
		// Orientation]` -- the FULL inherited list, including the 2 attributes this
		// subtype overrides as DERIVE (`EdgeStart`/`EdgeEnd`, inherited positionally
		// from `IfcEdge`) -- `createEntity` needs all 4 positional slots, not just the
		// 2 genuinely-storable ones `generated/ifc2x3.d.ts` documents (`EdgeElement`,
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

		// Python: `IfcBooleanChoose(orientation, EdgeElement.EdgeStart, EdgeElement.EdgeEnd)`.
		// Orientation=true -> `if b:` is true -> choice1 (EdgeElement.EdgeStart = v0).
		test("Orientation=true -> EdgeStart is EdgeElement.EdgeStart", () => {
			const file = createTestFile("IFC2X3");
			const { v0, orientedEdge } = buildOrientedEdge(file, true);
			const result = ifc2x3.calc_IfcOrientedEdge_EdgeStart(orientedEdge as EntityInstance) as EntityInstance;
			expect(result.id()).toBe((v0 as EntityInstance).id());
		});

		// Orientation=false -> `if b:` is false -> choice2 (EdgeElement.EdgeEnd = v1).
		test("Orientation=false -> EdgeStart is EdgeElement.EdgeEnd", () => {
			const file = createTestFile("IFC2X3");
			const { v1, orientedEdge } = buildOrientedEdge(file, false);
			const result = ifc2x3.calc_IfcOrientedEdge_EdgeStart(orientedEdge as EntityInstance) as EntityInstance;
			expect(result.id()).toBe((v1 as EntityInstance).id());
		});

		// `calc_IfcOrientedEdge_EdgeEnd` swaps choice1/choice2: Orientation=true ->
		// EdgeElement.EdgeEnd (v1); Orientation=false -> EdgeElement.EdgeStart (v0).
		test("Orientation=true -> EdgeEnd is EdgeElement.EdgeEnd", () => {
			const file = createTestFile("IFC2X3");
			const { v1, orientedEdge } = buildOrientedEdge(file, true);
			const result = ifc2x3.calc_IfcOrientedEdge_EdgeEnd(orientedEdge as EntityInstance) as EntityInstance;
			expect(result.id()).toBe((v1 as EntityInstance).id());
		});

		test("Orientation=false -> EdgeEnd is EdgeElement.EdgeStart", () => {
			const file = createTestFile("IFC2X3");
			const { v0, orientedEdge } = buildOrientedEdge(file, false);
			const result = ifc2x3.calc_IfcOrientedEdge_EdgeEnd(orientedEdge as EntityInstance) as EntityInstance;
			expect(result.id()).toBe((v0 as EntityInstance).id());
		});

		// `IfcBooleanChoose`'s own disclosed careful-truthiness handling (see
		// `ifc2x3.ts`'s own header comment): `Orientation` unset (`$`) resolves to
		// `runtimeShim.INDETERMINATE`, which real Python's own `indeterminate_type.
		// __bool__` treats as falsy -- confirmed empirically against a real installed
		// `ifcopenshell` 0.8.4 interpreter (an `IfcOrientedEdge` with `Orientation`
		// left unset resolves `.EdgeStart` to `EdgeElement.EdgeEnd`, the `else`
		// branch) -- so this port must NOT naively do `if (b)` (a JS `Symbol` is
		// always truthy).
		test("Orientation unset (INDETERMINATE) -> treated as falsy, matching real Python's indeterminate_type.__bool__", () => {
			const file = createTestFile("IFC2X3");
			const { v1, orientedEdge } = buildOrientedEdge(file, null);
			const result = ifc2x3.calc_IfcOrientedEdge_EdgeStart(orientedEdge as EntityInstance) as EntityInstance;
			expect(result.id()).toBe((v1 as EntityInstance).id());
		});

		// End-to-end: read `.EdgeStart` through the normal `EntityInstance`
		// attribute-read path.
		test("end-to-end: orientedEdge.EdgeStart resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC2X3");
			const { v0, orientedEdge } = buildOrientedEdge(file, true);
			const result = (orientedEdge as unknown as { EdgeStart: EntityInstance }).EdgeStart;
			expect(result.id()).toBe((v0 as EntityInstance).id());
		});
	});

	// --- calc_IfcRationalBezierCurve_Weights (reuses chunk 1's ifcListToArray) ---
	describe("calc_IfcRationalBezierCurve_Weights", () => {
		// Python: `IfcListToArray(WeightsData, 0, UpperIndexOnControlPoints)`. Reuses
		// this file's own chunk-1 `ifcListToArray` UNCHANGED -- it therefore also
		// reproduces chunk 1's own already-disclosed bug #3 (the `low === 0`
		// left-rotation) for this new call site: for 4 weights [1,2,3,4], the real
		// (buggy) result is [2,3,4,1], NOT an identity copy -- confirmed empirically
		// against a real installed `ifcopenshell` 0.8.4 interpreter (a live
		// 4-control-point `IfcRationalBezierCurve` with `WeightsData=[1,2,3,4]`
		// resolves `.Weights` to exactly `[2.0, 3.0, 4.0, 1.0]`).
		test("4 weights -> cyclically rotated, NOT an identity copy (chunk 1's disclosed bug #3, reused here)", () => {
			const file = createTestFile("IFC2X3");
			const points = [0, 1, 2, 3].map((i) => file.createEntity("IfcCartesianPoint", [Number(i), 0.0]));
			const bezier = file.createEntity(
				"IfcRationalBezierCurve",
				3,
				points,
				"UNSPECIFIED",
				false,
				false,
				[1.0, 2.0, 3.0, 4.0],
			);
			const weights = ifc2x3.calc_IfcRationalBezierCurve_Weights(bezier as EntityInstance);
			expect(weights).toEqual([2.0, 3.0, 4.0, 1.0]);
		});

		// End-to-end: read `.Weights` through the normal `EntityInstance`
		// attribute-read path.
		test("end-to-end: bezier.Weights resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC2X3");
			const points = [0, 1, 2].map((i) => file.createEntity("IfcCartesianPoint", [Number(i), 0.0]));
			const bezier = file.createEntity(
				"IfcRationalBezierCurve",
				2,
				points,
				"UNSPECIFIED",
				false,
				false,
				[10.0, 20.0, 30.0],
			);
			expect((bezier as unknown as { Weights: number[] }).Weights).toEqual([20.0, 30.0, 10.0]);
		});
	});

	// --- calc_IfcRevolvedAreaSolid_AxisLine / calc_IfcSurfaceOfRevolution_AxisLine (+ IfcLine) ---
	describe("calc_IfcRevolvedAreaSolid_AxisLine / calc_IfcSurfaceOfRevolution_AxisLine", () => {
		// Python: `IfcLine(Pnt=Axis.Location, Dir=IfcVector(Orientation=Axis.Z,
		// Magnitude=1.0))`. `Axis.Z` is `IfcAxis1Placement`'s own DERIVE attribute
		// (`calc_IfcAxis1Placement_Z`, chunk 1): `nvl(IfcNormalise(Axis), default)` --
		// exercised here with an UNNORMALIZED `Axis` ([0,0,2]) to confirm the full
		// chain normalizes it (-> [0,0,1]), not just passes it through.
		test("RevolvedAreaSolid: AxisLine.Pnt is Axis.Location, AxisLine.Dir is a unit vector along (normalised) Axis.Z", () => {
			const file = createTestFile("IFC2X3");
			const profile = file.createEntity("IfcRectangleProfileDef", "AREA", null, null, 2.0, 3.0);
			const positionLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const position = file.createEntity("IfcAxis2Placement3D", positionLocation, null, null);
			const axisLocation = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
			const zAxis = file.createEntity("IfcDirection", [0.0, 0.0, 2.0]);
			const axis = file.createEntity("IfcAxis1Placement", axisLocation, zAxis);
			const revolvedSolid = file.createEntity("IfcRevolvedAreaSolid", profile, position, axis, Math.PI / 2);
			const axisLine = ifc2x3.calc_IfcRevolvedAreaSolid_AxisLine(revolvedSolid as EntityInstance) as EntityInstance;
			const pnt = (axisLine as unknown as { Pnt: EntityInstance }).Pnt;
			expect(pnt.id()).toBe((axisLocation as EntityInstance).id());
			const dir = (axisLine as unknown as { Dir: EntityInstance }).Dir;
			expect((dir as unknown as { Magnitude: number }).Magnitude).toBe(1.0);
			closeArray(ratios((dir as unknown as { Orientation: unknown }).Orientation), [0, 0, 1]);
		});

		// Same shape as `calc_IfcRevolvedAreaSolid_AxisLine`, delegating to
		// `AxisPosition` instead of `Axis`.
		test("SurfaceOfRevolution: AxisLine.Pnt is AxisPosition.Location, AxisLine.Dir is a unit vector along (normalised) AxisPosition.Z", () => {
			const file = createTestFile("IFC2X3");
			const positionLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const position = file.createEntity("IfcAxis2Placement3D", positionLocation, null, null);
			const axisLocation = file.createEntity("IfcCartesianPoint", [4.0, 5.0, 6.0]);
			const zAxis = file.createEntity("IfcDirection", [0.0, 0.0, 3.0]);
			const axisPosition = file.createEntity("IfcAxis1Placement", axisLocation, zAxis);
			const revolutionSurface = file.createEntity("IfcSurfaceOfRevolution", null, position, axisPosition);
			const axisLine = ifc2x3.calc_IfcSurfaceOfRevolution_AxisLine(
				revolutionSurface as EntityInstance,
			) as EntityInstance;
			const pnt = (axisLine as unknown as { Pnt: EntityInstance }).Pnt;
			expect(pnt.id()).toBe((axisLocation as EntityInstance).id());
			const dir = (axisLine as unknown as { Dir: EntityInstance }).Dir;
			expect((dir as unknown as { Magnitude: number }).Magnitude).toBe(1.0);
			closeArray(ratios((dir as unknown as { Orientation: unknown }).Orientation), [0, 0, 1]);
		});

		// End-to-end: read `.AxisLine` through the normal `EntityInstance`
		// attribute-read path.
		test("end-to-end: revolvedSolid.AxisLine resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC2X3");
			const profile = file.createEntity("IfcRectangleProfileDef", "AREA", null, null, 2.0, 3.0);
			const positionLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const position = file.createEntity("IfcAxis2Placement3D", positionLocation, null, null);
			const axisLocation = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
			const zAxis = file.createEntity("IfcDirection", [0.0, 0.0, 1.0]);
			const axis = file.createEntity("IfcAxis1Placement", axisLocation, zAxis);
			const revolvedSolid = file.createEntity("IfcRevolvedAreaSolid", profile, position, axis, Math.PI / 2);
			const axisLine = (revolvedSolid as unknown as { AxisLine: EntityInstance }).AxisLine;
			expect(axisLine.isA()).toBe("IfcLine");
			expect((axisLine as unknown as { Pnt: EntityInstance }).Pnt.id()).toBe((axisLocation as EntityInstance).id());
		});
	});

	// --- calc_IfcSurfaceOfLinearExtrusion_ExtrusionAxis ---
	describe("calc_IfcSurfaceOfLinearExtrusion_ExtrusionAxis", () => {
		// Python: `IfcVector(Orientation=ExtrudedDirection, Magnitude=Depth)` -- a
		// direct, unnormalized pass-through (unlike the `AxisLine` functions above,
		// this one does NOT normalise `ExtrudedDirection` first).
		test("ExtrusionAxis.Orientation is ExtrudedDirection, .Magnitude is Depth", () => {
			const file = createTestFile("IFC2X3");
			const positionLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const position = file.createEntity("IfcAxis2Placement3D", positionLocation, null, null);
			const extrudedDirection = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
			const surface = file.createEntity("IfcSurfaceOfLinearExtrusion", null, position, extrudedDirection, 5.0);
			const vec = ifc2x3.calc_IfcSurfaceOfLinearExtrusion_ExtrusionAxis(surface as EntityInstance) as EntityInstance;
			expect((vec as unknown as { Orientation: EntityInstance }).Orientation.id()).toBe(
				(extrudedDirection as EntityInstance).id(),
			);
			expect((vec as unknown as { Magnitude: number }).Magnitude).toBe(5.0);
		});

		// End-to-end: read `.ExtrusionAxis` through the normal `EntityInstance`
		// attribute-read path.
		test("end-to-end: surface.ExtrusionAxis resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC2X3");
			const positionLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const position = file.createEntity("IfcAxis2Placement3D", positionLocation, null, null);
			const extrudedDirection = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
			const surface = file.createEntity("IfcSurfaceOfLinearExtrusion", null, position, extrudedDirection, 5.0);
			const vec = (surface as unknown as { ExtrusionAxis: EntityInstance }).ExtrusionAxis;
			expect(vec.isA()).toBe("IfcVector");
			expect((vec as unknown as { Magnitude: number }).Magnitude).toBe(5.0);
		});
	});

	// --- calc_IfcStructuralLinearActionVarying_VaryingAppliedLoads / calc_IfcStructuralPlanarActionVarying_VaryingAppliedLoads / calc_IfcStructuralSurfaceMemberVarying_VaryingThickness (+ IfcAddToBeginOfList) ---
	describe("calc_IfcStructuralLinearActionVarying_VaryingAppliedLoads / calc_IfcStructuralPlanarActionVarying_VaryingAppliedLoads / calc_IfcStructuralSurfaceMemberVarying_VaryingThickness", () => {
		function buildLinearActionVarying(
			file: IfcFile,
			appliedLoad: EntityInstance | null,
			subsequentAppliedLoads: EntityInstance[],
		) {
			return file.createEntity(
				"IfcStructuralLinearActionVarying",
				guid.new(),
				null,
				null,
				null,
				null,
				null,
				null,
				appliedLoad,
				"GLOBAL_COORDS",
				false,
				null,
				"TRUE_LENGTH",
				null,
				subsequentAppliedLoads,
			);
		}

		function buildPlanarActionVarying(
			file: IfcFile,
			appliedLoad: EntityInstance | null,
			subsequentAppliedLoads: EntityInstance[],
		) {
			return file.createEntity(
				"IfcStructuralPlanarActionVarying",
				guid.new(),
				null,
				null,
				null,
				null,
				null,
				null,
				appliedLoad,
				"GLOBAL_COORDS",
				false,
				null,
				"TRUE_LENGTH",
				null,
				subsequentAppliedLoads,
			);
		}

		function buildSurfaceMemberVarying(file: IfcFile, thickness: number | null, subsequentThickness: number[]) {
			return file.createEntity(
				"IfcStructuralSurfaceMemberVarying",
				guid.new(),
				null,
				null,
				null,
				null,
				null,
				null,
				"SHELL",
				thickness,
				subsequentThickness,
				null,
			);
		}

		// Python: `IfcAddToBeginOfList(AppliedLoad, SubsequentAppliedLoads)`.
		// `AppliedLoad` unset -> `not exists(ascalar)` -> `result = alist`, real
		// Python's own only actually-reachable branch (see `ifc2x3.ts`'s own header
		// comment, disclosed bug #4) -- confirmed empirically against a real
		// installed `ifcopenshell` 0.8.4 interpreter.
		test("IfcStructuralLinearActionVarying: AppliedLoad unset -> SubsequentAppliedLoads returned unchanged", () => {
			const file = createTestFile("IFC2X3");
			const load1 = file.createEntity("IfcStructuralLoadSingleForce", null, 1.0, null, null, null, null, null);
			const action = buildLinearActionVarying(file, null, [load1 as EntityInstance]);
			const result = ifc2x3.calc_IfcStructuralLinearActionVarying_VaryingAppliedLoads(
				action as EntityInstance,
			) as EntityInstance[];
			expect(result.map((r) => r.id())).toEqual([(load1 as EntityInstance).id()]);
		});

		// **Disclosed bug #4 pin**: `AppliedLoad` SET (the normal, expected case, since
		// it's a mandatory attribute in the real schema) -- real Python's own
		// `IfcAddToBeginOfList` unconditionally raises `TypeError: can only
		// concatenate list (not "entity_instance") to list` here, confirmed live
		// against a real installed `ifcopenshell` 0.8.4 interpreter. Ported as an
		// equivalent thrown error.
		test("disclosed bug #4: IfcStructuralLinearActionVarying, AppliedLoad set -> throws (real Python crashes here too)", () => {
			const file = createTestFile("IFC2X3");
			const load1 = file.createEntity("IfcStructuralLoadSingleForce", null, 1.0, null, null, null, null, null);
			const load2 = file.createEntity("IfcStructuralLoadSingleForce", null, 2.0, null, null, null, null, null);
			const action = buildLinearActionVarying(file, load1 as EntityInstance, [load2 as EntityInstance]);
			expect(() => ifc2x3.calc_IfcStructuralLinearActionVarying_VaryingAppliedLoads(action as EntityInstance)).toThrow(
				/can only concatenate list/,
			);
		});

		// Same shape, `IfcStructuralPlanarActionVarying` (identical formula body).
		test("IfcStructuralPlanarActionVarying: AppliedLoad unset -> SubsequentAppliedLoads returned unchanged", () => {
			const file = createTestFile("IFC2X3");
			const load1 = file.createEntity("IfcStructuralLoadSingleForce", null, 1.0, null, null, null, null, null);
			const action = buildPlanarActionVarying(file, null, [load1 as EntityInstance]);
			const result = ifc2x3.calc_IfcStructuralPlanarActionVarying_VaryingAppliedLoads(
				action as EntityInstance,
			) as EntityInstance[];
			expect(result.map((r) => r.id())).toEqual([(load1 as EntityInstance).id()]);
		});

		test("disclosed bug #4: IfcStructuralPlanarActionVarying, AppliedLoad set -> throws (real Python crashes here too)", () => {
			const file = createTestFile("IFC2X3");
			const load1 = file.createEntity("IfcStructuralLoadSingleForce", null, 1.0, null, null, null, null, null);
			const action = buildPlanarActionVarying(file, load1 as EntityInstance, []);
			expect(() => ifc2x3.calc_IfcStructuralPlanarActionVarying_VaryingAppliedLoads(action as EntityInstance)).toThrow(
				/can only concatenate list/,
			);
		});

		// `IfcStructuralSurfaceMemberVarying.Thickness` is a scalar `number`, not an
		// entity -- confirms disclosed bug #4 also fires for a `float` scalar (real
		// Python: `TypeError: can only concatenate list (not "float") to list"),
		// confirmed live against a real installed `ifcopenshell` 0.8.4 interpreter.
		test("IfcStructuralSurfaceMemberVarying: Thickness unset -> SubsequentThickness returned unchanged", () => {
			const file = createTestFile("IFC2X3");
			const member = buildSurfaceMemberVarying(file, null, [1.0, 2.0]);
			const result = ifc2x3.calc_IfcStructuralSurfaceMemberVarying_VaryingThickness(member as EntityInstance);
			expect(result).toEqual([1.0, 2.0]);
		});

		test("disclosed bug #4: IfcStructuralSurfaceMemberVarying, Thickness set -> throws (real Python crashes here too, with a float scalar)", () => {
			const file = createTestFile("IFC2X3");
			const member = buildSurfaceMemberVarying(file, 5.0, [1.0, 2.0]);
			expect(() => ifc2x3.calc_IfcStructuralSurfaceMemberVarying_VaryingThickness(member as EntityInstance)).toThrow(
				/can only concatenate list/,
			);
		});

		// End-to-end: read `.VaryingThickness` through the normal `EntityInstance`
		// attribute-read path (the working, "Thickness unset" branch, so the
		// end-to-end test itself doesn't throw).
		test("end-to-end: member.VaryingThickness resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC2X3");
			const member = buildSurfaceMemberVarying(file, null, [3.0, 4.0]);
			expect((member as unknown as { VaryingThickness: number[] }).VaryingThickness).toEqual([3.0, 4.0]);
		});
	});
});

describe("EntityInstance DERIVE-dispatch wiring (entityInstance.ts)", () => {
	test("a genuinely nonexistent attribute still throws the same error as before this chunk", () => {
		const file: IfcFile = createTestFile("IFC2X3");
		const point = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
		expect(() => (point as unknown as { NotARealAttribute: unknown }).NotARealAttribute).toThrow(
			/has no attribute 'NotARealAttribute'/,
		);
	});

	test("an unported DERIVE-shaped attribute still throws (purely additive capability)", () => {
		// `IfcDerivedUnit.Dimensions` (`calc_IfcDerivedUnit_Dimensions`, `IFC2X3.py`
		// line 4741) is a real DERIVE attribute genuinely untouched by chunks 1-4 --
		// it needs `IfcDeriveDimensionalExponents`, which constructs/mutates an
		// `IfcDimensionalExponents` DEFINED TYPE value, a primitive this port doesn't
		// have yet (see `../../../src/express/rules/ifc2x3.ts`'s own chunk-4 header
		// comment for the full citation) -- confirms dispatch stays additive, not a
		// general claim that every DERIVE-shaped attribute now resolves.
		// (`IfcOrientedEdge.EdgeStart` was this test's example in chunk 3, but chunk 4
		// ports exactly that function -- see this file's own top-of-file header
		// comment for why this test was updated instead of silently starting to
		// assert the opposite of what it's named for. Chunk 4 is also the point at
		// which this test's example had to change kind, not just name: after chunk 4,
		// only 2 of IFC2X3's 55 real `calc_*` functions remain unported at all, both
		// for this same defined-type-construction reason, so this is now the only
		// kind of example left to use.)
		const file: IfcFile = createTestFile("IFC2X3");
		const derivedUnit = file.createEntity("IfcDerivedUnit", [], "MASSDENSITYUNIT", null);
		expect(() => (derivedUnit as unknown as { Dimensions: unknown }).Dimensions).toThrow(
			/has no attribute 'Dimensions'/,
		);
	});
});
