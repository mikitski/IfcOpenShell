// This file was generated with the assistance of an AI coding tool.
//
// Original, hand-rolled coverage for Phase EX-2's first chunk
// (planning/ifcopenshell-ts/70-express-rules-plan.md §4): the first 15 IFC2X3
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
// Three genuine, disclosed real-Python bugs (see `../../src/express/rules/ifc2x3.ts`'s
// own header comment for the full citations) are deliberately pinned here, not worked
// around: `IfcListToArray`'s rotation for `low === 0` (`calc_IfcBSplineCurve_
// ControlPoints`), `IfcFirstProjAxis`'s always-true tuple/list comparison (visible via
// a degenerate `Axis === X-axis` fixture), and `IfcBaseAxis`'s unconditional crash when
// only `Axis2` is set (2D transformation operators).

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../../src/entityInstance";
import * as ifc2x3 from "../../../src/express/rules/ifc2x3";
import { INDETERMINATE } from "../../../src/express/runtimeShim";
import type { IfcFile } from "../../../src/file";
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

describe("EntityInstance DERIVE-dispatch wiring (entityInstance.ts)", () => {
	test("a genuinely nonexistent attribute still throws the same error as before this chunk", () => {
		const file: IfcFile = createTestFile("IFC2X3");
		const point = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
		expect(() => (point as unknown as { NotARealAttribute: unknown }).NotARealAttribute).toThrow(
			/has no attribute 'NotARealAttribute'/,
		);
	});

	test("an unported DERIVE-shaped attribute still throws (purely additive capability)", () => {
		// `IfcCsgPrimitive3D.Dim` (`calc_IfcCsgPrimitive3D_Dim`) is a real DERIVE
		// attribute in the same family as this chunk's own 3 extra functions, but is
		// NOT one of them -- confirms this chunk's dispatch is additive, not a general
		// claim that every DERIVE-shaped attribute now resolves.
		const file: IfcFile = createTestFile("IFC2X3");
		const csgPrimitive = file.createEntity("IfcCsgPrimitive3D");
		expect(() => (csgPrimitive as unknown as { Dim: unknown }).Dim).toThrow(/has no attribute 'Dim'/);
	});
});
