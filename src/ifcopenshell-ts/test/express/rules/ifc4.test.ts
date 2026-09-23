// This file was generated with the assistance of an AI coding tool.
//
// Original, hand-rolled coverage for Phase EX-2's IFC4 first chunk
// (planning/ifcopenshell-ts/70-express-rules-plan.md §4): 15 of IFC4's 62 `calc_*`
// DERIVE functions (`src/express/rules/ifc4.ts`) plus their 3 minimal, necessary
// extra dependencies, and their wiring into `EntityInstance`'s attribute-read path
// (`entityInstance.ts`'s `.get()`). Real Python has no per-function unit test for any
// individual `calc_*` formula -- same finding as `ifc2x3.test.ts`'s own header comment
// already establishes (`src/ifcopenshell-python/test/test_rules.py` only exercises
// `rule_executor.run` against whole fixture `.ifc` files, never any single `calc_*`
// function) -- so every test below is original, with expected values hand-derived
// directly from the real Python formula bodies in `IFC4.py` (not from this port's own
// code), matching this project's established "cross-check the real formula, not just
// the TS port" convention.
//
// This chunk's own 15 assigned functions are the EXACT SAME 15 function names IFC2X3's
// own chunk 1 ported, and all 15 (plus the 3 extra deps, plus 9 of the 12 shared
// EXPRESS-library helper functions) are byte-identical Python source between
// `IFC2X3.py` and `IFC4.py` -- confirmed directly, not assumed from name overlap (see
// `../../../src/express/rules/ifc4.ts`'s own header comment for the full diff
// citations). The same 3 real, disclosed Python bugs `ifc2x3.test.ts` already pins are
// pinned again here (independently re-verified against `IFC4.py`'s own real source at
// each bug's own line, not merely inherited): `IfcListToArray`'s rotation for
// `low === 0`, `IfcFirstProjAxis`'s always-true tuple/list comparison, and
// `IfcBaseAxis`'s unconditional crash when only `Axis2` is set.

import { describe, expect, test } from "vitest";
import type { EntityInstance } from "../../../src/entityInstance";
import * as ifc4 from "../../../src/express/rules/ifc4";
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

describe("express/rules/ifc4 -- calc_* functions (Phase EX-2, IFC4 chunk 1)", () => {
	// --- calc_IfcAxis1Placement_Z ---
	describe("calc_IfcAxis1Placement_Z", () => {
		// Python: `nvl(IfcNormalise(axis), IfcDirection(DirectionRatios=[0.0, 0.0, 1.0]))`.
		// `Axis` unset (null) -> `exists(None)` is false -> `IfcNormalise` returns `None`
		// -> `nvl` falls back to the default `[0, 0, 1]`.
		test("Axis unset -> default [0,0,1]", () => {
			const file = createTestFile("IFC4");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis1Placement", location, null);
			const z = ifc4.calc_IfcAxis1Placement_Z(placement as EntityInstance);
			closeArray(ratios(z), [0, 0, 1]);
		});

		// Axis = [0, 2, 0] (unnormalized) -> IfcNormalise divides by magnitude (2) -> [0, 1, 0].
		test("Axis set, unnormalized -> normalised in place", () => {
			const file = createTestFile("IFC4");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const axis = file.createEntity("IfcDirection", [0.0, 2.0, 0.0]);
			const placement = file.createEntity("IfcAxis1Placement", location, axis);
			const z = ifc4.calc_IfcAxis1Placement_Z(placement as EntityInstance);
			closeArray(ratios(z), [0, 1, 0]);
		});

		// True end-to-end test: read `.Z` through the normal EntityInstance attribute-read
		// path (the Proxy -> cache-miss -> `.get()` -> DERIVE dispatch), not by calling the
		// ported function directly.
		test("end-to-end: placement.Z resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
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
			const file = createTestFile("IFC4");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement2D", location, null);
			const p = ifc4.calc_IfcAxis2Placement2D_P(placement as EntityInstance) as unknown[];
			expect(p).toHaveLength(2);
			closeArray(ratios(p[0]), [1, 0]);
			closeArray(ratios(p[1]), [0, 1]);
		});

		// RefDirection = [0,1] (already unit) -> d=[0,1]; OrthogonalComplement([0,1]) =
		// [-1, 0].
		test("RefDirection set -> [refdirection, orthogonal complement]", () => {
			const file = createTestFile("IFC4");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const refDirection = file.createEntity("IfcDirection", [0.0, 1.0]);
			const placement = file.createEntity("IfcAxis2Placement2D", location, refDirection);
			const p = ifc4.calc_IfcAxis2Placement2D_P(placement as EntityInstance) as unknown[];
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
			const file = createTestFile("IFC4");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const p = ifc4.calc_IfcAxis2Placement3D_P(placement as EntityInstance) as unknown[];
			expect(p).toHaveLength(3);
			closeArray(ratios(p[0]), [1, 0, 0]);
			closeArray(ratios(p[1]), [0, 1, 0]);
			closeArray(ratios(p[2]), [0, 0, 1]);
		});

		// **Disclosed bug #1 pin** (see `ifc4.ts`'s header comment): with `Axis` set to
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
			const file = createTestFile("IFC4");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const axis = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, axis, null);
			const p = ifc4.calc_IfcAxis2Placement3D_P(placement as EntityInstance) as unknown[];
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
			const file = createTestFile("IFC4");
			const points = [
				file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
				file.createEntity("IfcCartesianPoint", [1.0, 0.0]),
				file.createEntity("IfcCartesianPoint", [2.0, 0.0]),
			];
			const curve = file.createEntity("IfcBSplineCurve", 3, points, "UNSPECIFIED", false, false);
			expect(ifc4.calc_IfcBSplineCurve_UpperIndexOnControlPoints(curve as EntityInstance)).toBe(2);
		});
	});

	describe("calc_IfcBSplineCurve_ControlPoints", () => {
		// **Disclosed bug #3 pin** (see `ifc4.ts`'s own header comment): real Python's
		// `IfcListToArray(ControlPointsList, 0, UpperIndexOnControlPoints)` cyclically
		// LEFT-ROTATES its input by one position for `low === 0` (hand-derived
		// symbolically: `res == [lis[1], lis[2], ..., lis[n-1], lis[0]]`), rather than
		// copying it in the same order -- ported faithfully, not silently fixed to an
		// identity copy. For 3 points [p0, p1, p2], the real (buggy) result is
		// [p1, p2, p0].
		test("3 control points -> cyclically rotated, NOT an identity copy (real bug, preserved)", () => {
			const file = createTestFile("IFC4");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0]);
			const p2 = file.createEntity("IfcCartesianPoint", [2.0, 0.0]);
			const curve = file.createEntity("IfcBSplineCurve", 3, [p0, p1, p2], "UNSPECIFIED", false, false);
			const controlPoints = ifc4.calc_IfcBSplineCurve_ControlPoints(curve as EntityInstance) as EntityInstance[];
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
		// necessary, disclosed extra functions, see `ifc4.ts`'s header comment).
		test("FirstOperand.Dim resolves via the supertype chain to IfcSolidModel's constant 3", () => {
			const file = createTestFile("IFC4");
			const profile = file.createEntity("IfcRectangleProfileDef", "AREA", null, null, 2.0, 3.0);
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const direction = file.createEntity("IfcDirection", [0.0, 0.0, 1.0]);
			const extruded = file.createEntity("IfcExtrudedAreaSolid", profile, placement, direction, 5.0);
			const half = file.createEntity("IfcHalfSpaceSolid");
			const booleanResult = file.createEntity("IfcBooleanResult", "DIFFERENCE", extruded, half);
			expect(ifc4.calc_IfcBooleanResult_Dim(booleanResult as EntityInstance)).toBe(3);
		});

		test("end-to-end: booleanResult.Dim resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
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
			const file = createTestFile("IFC4");
			const corner = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const bbox = file.createEntity("IfcBoundingBox", corner, 1.0, 2.0, 3.0);
			expect(ifc4.calc_IfcBoundingBox_Dim(bbox as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcCartesianPoint_Dim ---
	describe("calc_IfcCartesianPoint_Dim", () => {
		// Python: `hiindex(coordinates)` -- the coordinate count.
		test("3D point -> 3", () => {
			const file = createTestFile("IFC4");
			const point = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
			expect(ifc4.calc_IfcCartesianPoint_Dim(point as EntityInstance)).toBe(3);
		});

		test("2D point -> 2", () => {
			const file = createTestFile("IFC4");
			const point = file.createEntity("IfcCartesianPoint", [1.0, 2.0]);
			expect(ifc4.calc_IfcCartesianPoint_Dim(point as EntityInstance)).toBe(2);
		});
	});

	// --- calc_IfcCartesianTransformationOperator_Scl / _Dim ---
	describe("calc_IfcCartesianTransformationOperator_Scl", () => {
		// Python: `nvl(scale, 1.0)`.
		test("Scale unset -> default 1.0", () => {
			const file = createTestFile("IFC4");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator", null, null, origin, null);
			expect(ifc4.calc_IfcCartesianTransformationOperator_Scl(cto as EntityInstance)).toBe(1.0);
		});

		test("Scale set -> that value", () => {
			const file = createTestFile("IFC4");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator", null, null, origin, 2.5);
			expect(ifc4.calc_IfcCartesianTransformationOperator_Scl(cto as EntityInstance)).toBe(2.5);
		});
	});

	describe("calc_IfcCartesianTransformationOperator_Dim", () => {
		// Python: `express_getattr(localorigin, 'Dim', INDETERMINATE)` -- LocalOrigin's
		// own Dim (a 3D IfcCartesianPoint -> 3).
		test("3D LocalOrigin -> 3", () => {
			const file = createTestFile("IFC4");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator", null, null, origin, null);
			expect(ifc4.calc_IfcCartesianTransformationOperator_Dim(cto as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcCartesianTransformationOperator2D_U ---
	describe("calc_IfcCartesianTransformationOperator2D_U", () => {
		// Python: `IfcBaseAxis(2, Axis1, Axis2, None)`. Both unset -> the final `else`
		// branch: `[IfcDirection([1,0]), IfcDirection([0,1])]`.
		test("Axis1 and Axis2 both unset -> [[1,0],[0,1]]", () => {
			const file = createTestFile("IFC4");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator2D", null, null, origin, null);
			const u = ifc4.calc_IfcCartesianTransformationOperator2D_U(cto as EntityInstance) as unknown[];
			closeArray(ratios(u[0]), [1, 0]);
			closeArray(ratios(u[1]), [0, 1]);
		});

		// **Disclosed bug #2b pin**: `Axis1` unset, `Axis2` set -- real Python's
		// `IfcBaseAxis` unconditionally hits `u[0].DirectionRatios[k] = ...` on a tuple,
		// raising `TypeError` every time. Ported as an equivalent thrown error.
		test("disclosed bug #2b: Axis1 unset, Axis2 set -> throws (real Python crashes here too)", () => {
			const file = createTestFile("IFC4");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const axis2 = file.createEntity("IfcDirection", [0.0, 1.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator2D", null, axis2, origin, null);
			expect(() => ifc4.calc_IfcCartesianTransformationOperator2D_U(cto as EntityInstance)).toThrow(
				/does not support item assignment/,
			);
		});
	});

	// --- calc_IfcCartesianTransformationOperator2DnonUniform_Scl2 ---
	describe("calc_IfcCartesianTransformationOperator2DnonUniform_Scl2", () => {
		// Python: `nvl(scale2, express_getattr(self, 'Scl', INDETERMINATE))`. Scale2
		// unset, Scale also unset -> falls back to Scl's own default (1.0).
		test("Scale2 and Scale both unset -> falls back through Scl's own default (1.0)", () => {
			const file = createTestFile("IFC4");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator2DnonUniform", null, null, origin, null, null);
			expect(ifc4.calc_IfcCartesianTransformationOperator2DnonUniform_Scl2(cto as EntityInstance)).toBe(1.0);
		});

		test("Scale2 set -> that value, independent of Scale", () => {
			const file = createTestFile("IFC4");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator2DnonUniform", null, null, origin, 2.0, 4.0);
			expect(ifc4.calc_IfcCartesianTransformationOperator2DnonUniform_Scl2(cto as EntityInstance)).toBe(4.0);
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
			const file = createTestFile("IFC4");
			const origin = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const cto = file.createEntity("IfcCartesianTransformationOperator3D", null, null, origin, null, null);
			const u = ifc4.calc_IfcCartesianTransformationOperator3D_U(cto as EntityInstance) as unknown[];
			closeArray(ratios(u[0]), [1, 0, 0]);
			closeArray(ratios(u[1]), [0, 1, 0]);
			closeArray(ratios(u[2]), [0, 0, 1]);
		});
	});

	// --- calc_IfcCartesianTransformationOperator3DnonUniform_Scl2 / _Scl3 ---
	describe("calc_IfcCartesianTransformationOperator3DnonUniform_Scl2/_Scl3", () => {
		// Python: `nvl(scale2/scale3, express_getattr(self, 'Scl', INDETERMINATE))`.
		test("Scale2/Scale3 unset, Scale=3.0 -> both fall back to Scl=3.0", () => {
			const file = createTestFile("IFC4");
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
			expect(ifc4.calc_IfcCartesianTransformationOperator3DnonUniform_Scl2(cto as EntityInstance)).toBe(3.0);
			expect(ifc4.calc_IfcCartesianTransformationOperator3DnonUniform_Scl3(cto as EntityInstance)).toBe(3.0);
		});

		test("Scale2/Scale3 set -> their own values", () => {
			const file = createTestFile("IFC4");
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
			expect(ifc4.calc_IfcCartesianTransformationOperator3DnonUniform_Scl2(cto as EntityInstance)).toBe(5.0);
			expect(ifc4.calc_IfcCartesianTransformationOperator3DnonUniform_Scl3(cto as EntityInstance)).toBe(7.0);
		});
	});

	// --- the 3 minimal, necessary, disclosed extra functions ---
	describe("calc_IfcDirection_Dim / calc_IfcVector_Dim / calc_IfcSolidModel_Dim", () => {
		test("calc_IfcDirection_Dim: hiindex(DirectionRatios)", () => {
			const file = createTestFile("IFC4");
			const direction = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
			expect(ifc4.calc_IfcDirection_Dim(direction as EntityInstance)).toBe(3);
		});

		test("calc_IfcVector_Dim: Orientation.Dim", () => {
			const file = createTestFile("IFC4");
			const direction = file.createEntity("IfcDirection", [1.0, 0.0]);
			const vector = file.createEntity("IfcVector", direction, 5.0);
			expect(ifc4.calc_IfcVector_Dim(vector as EntityInstance)).toBe(2);
		});

		test("calc_IfcSolidModel_Dim: always 3", () => {
			const file = createTestFile("IFC4");
			const solid = file.createEntity("IfcSolidModel");
			expect(ifc4.calc_IfcSolidModel_Dim(solid as EntityInstance)).toBe(3);
		});
	});

	// --- schema-scoping: IFC4's own registry entries are independent of IFC2X3's ---
	describe("dispatch is schema-scoped", () => {
		// Reading `.Z` on an `IfcAxis1Placement` in a *different* schema (IFC2X3) must
		// resolve through IFC2X3's own registered `calc_IfcAxis1Placement_Z`, not IFC4's
		// -- demonstrating `dispatch.ts`'s own `schemaRegistries` keying is genuinely
		// per-schema-identifier, not a single shared/global registry a later-loaded
		// module could accidentally clobber (both `rules/ifc2x3.ts` and `rules/ifc4.ts`
		// register a same-named `"IfcAxis1Placement.Z"` key, under two different schema
		// identifiers).
		test("IFC2X3's own IfcAxis1Placement.Z still resolves independently of IFC4's registration", () => {
			const file = createTestFile("IFC2X3");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis1Placement", location, null);
			const z = (placement as unknown as { Z: EntityInstance }).Z;
			closeArray(ratios(z), [0, 0, 1]);
		});
	});
});

// =============================================================================
// Original, hand-rolled coverage for Phase EX-2's IFC4 SECOND chunk
// (planning/ifcopenshell-ts/70-express-rules-plan.md §4): 15 more of IFC4's 62
// `calc_*` DERIVE functions (`src/express/rules/ifc4.ts`) -- see that file's own
// header comment (the "second chunk" section) for the full byte-identical-vs-genuinely
// -different diffing writeup against IFC2X3, the 3 newly-disclosed bugs, and the 3
// cascading test-fidelity fixes this chunk required elsewhere in the suite
// (`test/express/rules/ifc2x3.test.ts`, `test/util/representation.test.ts`,
// `test/util/shapeBuilder.test.ts`).
// =============================================================================
describe("express/rules/ifc4 -- calc_* functions (Phase EX-2, IFC4 chunk 2)", () => {
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
			const file = createTestFile("IFC4");
			const curve = buildCurve(file, [0.0, 0.5, 1.0]);
			expect(ifc4.calc_IfcBSplineCurveWithKnots_UpperIndexOnKnots(curve as EntityInstance)).toBe(3);
		});

		test("end-to-end: curve.UpperIndexOnKnots resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
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
			const file = createTestFile("IFC4");
			const surface = buildSurface(file, 3, 4);
			expect(ifc4.calc_IfcBSplineSurface_UUpper(surface as EntityInstance)).toBe(2);
		});

		// Python: `sizeof(ControlPointsList[0]) - 1`. A 4-column grid -> VUpper = 3.
		test("calc_IfcBSplineSurface_VUpper: 4 columns -> 3", () => {
			const file = createTestFile("IFC4");
			const surface = buildSurface(file, 3, 4);
			expect(ifc4.calc_IfcBSplineSurface_VUpper(surface as EntityInstance)).toBe(3);
		});

		// **Disclosed bug 1 pin** (see `ifc4.ts`'s own header comment, second chunk):
		// `IfcMakeArrayOfArray` (delegated to by `calc_IfcBSplineSurface_ControlPoints`)
		// unconditionally raises a TypeError-equivalent for any structurally valid
		// `IfcBSplineSurface` -- ported as a thrown error, not silently "fixed".
		test("disclosed bug 1: ControlPoints always throws (real Python crashes here too)", () => {
			const file = createTestFile("IFC4");
			const surface = buildSurface(file, 3, 4);
			expect(() => ifc4.calc_IfcBSplineSurface_ControlPoints(surface as EntityInstance)).toThrow(
				/unsupported operand type/,
			);
		});

		test("end-to-end: surface.UUpper/.VUpper resolve through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
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
			const file = createTestFile("IFC4");
			const surface = buildSurface(file, [0.0, 1.0], [0.0, 0.5, 1.0]);
			expect(ifc4.calc_IfcBSplineSurfaceWithKnots_KnotUUpper(surface as EntityInstance)).toBe(2);
			expect(ifc4.calc_IfcBSplineSurfaceWithKnots_KnotVUpper(surface as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcCartesianPointList_Dim ---
	describe("calc_IfcCartesianPointList_Dim", () => {
		// Python: `IfcPointListDim(self)` -- dispatches on the concrete
		// IfcCartesianPointList2D/3D subtype (genuinely IFC4-only, no IFC2X3 equivalent).
		test("IfcCartesianPointList2D -> 2", () => {
			const file = createTestFile("IFC4");
			const pointList = file.createEntity("IfcCartesianPointList2D", [
				[0.0, 0.0],
				[1.0, 1.0],
			]);
			expect(ifc4.calc_IfcCartesianPointList_Dim(pointList as EntityInstance)).toBe(2);
		});

		test("IfcCartesianPointList3D -> 3", () => {
			const file = createTestFile("IFC4");
			const pointList = file.createEntity("IfcCartesianPointList3D", [
				[0.0, 0.0, 0.0],
				[1.0, 1.0, 1.0],
			]);
			expect(ifc4.calc_IfcCartesianPointList_Dim(pointList as EntityInstance)).toBe(3);
		});

		test("end-to-end: pointList.Dim resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
			const pointList = file.createEntity("IfcCartesianPointList3D", [[0.0, 0.0, 0.0]]);
			expect((pointList as unknown as { Dim: number }).Dim).toBe(3);
		});
	});

	// --- calc_IfcCompositeCurve_NSegments / _ClosedCurve (byte-identical to IFC2X3's own) ---
	describe("calc_IfcCompositeCurve_NSegments / _ClosedCurve", () => {
		function buildComposite(file: IfcFile, transitions: string[]) {
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const segments = transitions.map((t) => file.createEntity("IfcCompositeCurveSegment", t, true, polyline));
			return file.createEntity("IfcCompositeCurve", segments, false);
		}

		test("NSegments = sizeof(Segments)", () => {
			const file = createTestFile("IFC4");
			const composite = buildComposite(file, ["CONTINUOUS", "CONTINUOUS"]);
			expect(ifc4.calc_IfcCompositeCurve_NSegments(composite as EntityInstance)).toBe(2);
		});

		// Python: `Segments[NSegments - 1].Transition != discontinuous` -- the LAST
		// segment's own Transition decides the result.
		test("last segment CONTINUOUS -> closed (true)", () => {
			const file = createTestFile("IFC4");
			const composite = buildComposite(file, ["DISCONTINUOUS", "CONTINUOUS"]);
			expect(ifc4.calc_IfcCompositeCurve_ClosedCurve(composite as EntityInstance)).toBe(true);
		});

		test("last segment DISCONTINUOUS -> not closed (false)", () => {
			const file = createTestFile("IFC4");
			const composite = buildComposite(file, ["CONTINUOUS", "DISCONTINUOUS"]);
			expect(ifc4.calc_IfcCompositeCurve_ClosedCurve(composite as EntityInstance)).toBe(false);
		});

		test("end-to-end: composite.ClosedCurve resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
			const composite = buildComposite(file, ["DISCONTINUOUS", "CONTINUOUS"]);
			expect((composite as unknown as { ClosedCurve: boolean }).ClosedCurve).toBe(true);
		});
	});

	// --- calc_IfcCompositeCurveOnSurface_BasisSurface ---
	describe("calc_IfcCompositeCurveOnSurface_BasisSurface", () => {
		function buildOnSurface(file: IfcFile, parentCurves: EntityInstance[]) {
			const segments = parentCurves.map((pc) => file.createEntity("IfcCompositeCurveSegment", "CONTINUOUS", true, pc));
			return file.createEntity("IfcCompositeCurveOnSurface", segments, false);
		}

		// Single segment, ParentCurve = a plain IfcPolyline (neither IfcPcurve nor
		// IfcSurfaceCurve nor IfcCompositeCurveOnSurface) -> recursion into
		// IfcGetBasisSurface matches none of its own branches -> [].
		test("single segment, plain-curve ParentCurve -> [] (no basis surface concept)", () => {
			const file = createTestFile("IFC4");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const onSurface = buildOnSurface(file, [polyline]);
			expect(ifc4.calc_IfcCompositeCurveOnSurface_BasisSurface(onSurface as EntityInstance)).toEqual([]);
		});

		// Single segment, ParentCurve = a real IfcPcurve -> the non-buggy
		// `'ifc4.ifcpcurve' in typeof(c)` branch: `[c.BasisSurface]`.
		test("single segment, IfcPcurve ParentCurve -> [pcurve.BasisSurface]", () => {
			const file = createTestFile("IFC4");
			const planeLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const planePlacement = file.createEntity("IfcAxis2Placement3D", planeLocation, null, null);
			const plane = file.createEntity("IfcPlane", planePlacement);
			const refCurvePnt = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const refCurveDir = file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0);
			const referenceCurve = file.createEntity("IfcLine", refCurvePnt, refCurveDir);
			const pcurve = file.createEntity("IfcPcurve", plane, referenceCurve);
			const onSurface = buildOnSurface(file, [pcurve]);
			const result = ifc4.calc_IfcCompositeCurveOnSurface_BasisSurface(onSurface as EntityInstance) as EntityInstance[];
			expect(result).toHaveLength(1);
			expect(result[0].equals(plane)).toBe(true);
		});

		// **Disclosed bug 3 pin**: 2+ segments unconditionally throws (list * list).
		test("disclosed bug 3: 2 segments -> throws (real Python crashes here too)", () => {
			const file = createTestFile("IFC4");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const onSurface = buildOnSurface(file, [polyline, polyline]);
			expect(() => ifc4.calc_IfcCompositeCurveOnSurface_BasisSurface(onSurface as EntityInstance)).toThrow(
				/list \* list/,
			);
		});

		// **Disclosed bug 2 pin**: a single segment whose ParentCurve is itself an
		// IfcSurfaceCurve unconditionally throws (list + non-list).
		test("disclosed bug 2: IfcSurfaceCurve ParentCurve -> throws (real Python crashes here too)", () => {
			const file = createTestFile("IFC4");
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
			expect(() => ifc4.calc_IfcCompositeCurveOnSurface_BasisSurface(onSurface as EntityInstance)).toThrow(
				/list \+ non-list/,
			);
		});
	});

	// --- calc_IfcCompositeCurveSegment_Dim (byte-identical to IFC2X3's own) ---
	describe("calc_IfcCompositeCurveSegment_Dim", () => {
		test("ParentCurve.Dim resolves through calc_IfcCurve_Dim's IfcPolyline branch", () => {
			const file = createTestFile("IFC4");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const segment = file.createEntity("IfcCompositeCurveSegment", "CONTINUOUS", true, polyline);
			expect(ifc4.calc_IfcCompositeCurveSegment_Dim(segment as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcCsgPrimitive3D_Dim (byte-identical to IFC2X3's own) ---
	describe("calc_IfcCsgPrimitive3D_Dim", () => {
		test("always 3", () => {
			const file = createTestFile("IFC4");
			const csgPrimitive = file.createEntity("IfcCsgPrimitive3D");
			expect(ifc4.calc_IfcCsgPrimitive3D_Dim(csgPrimitive as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcCurve_Dim / IfcCurveDim (all 10 dispatch branches, including the 2 new to IFC4) ---
	describe("calc_IfcCurve_Dim", () => {
		test("IfcLine -> Pnt.Dim", () => {
			const file = createTestFile("IFC4");
			const pnt = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const line = file.createEntity("IfcLine", pnt, null);
			expect(ifc4.calc_IfcCurve_Dim(line as EntityInstance)).toBe(3);
		});

		// `IfcCurveDim`'s `IfcConic` branch reads `Position.Dim` -- `Position` is an
		// `IfcAxis2Placement3D`, whose OWN `Dim` is declared DERIVE at the `IfcPlacement`
		// supertype level (`calc_IfcPlacement_Dim`). **Updated by this file's own THIRD
		// chunk**, which now ports exactly that function: `Position.Dim` resolves to
		// `Location.Dim` = 3 (a 3D `IfcCartesianPoint`), so this branch's own end
		// result is now the real, resolved `3`, not `INDETERMINATE` (re-verified
		// directly against the real built addon, not assumed from the dependency chain
		// alone).
		test("IfcCircle (IfcConic subtype) -> Position.Dim (now resolves: IfcPlacement.Dim ported by this file's own third chunk)", () => {
			const file = createTestFile("IFC4");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			const circle = file.createEntity("IfcCircle", placement, 5.0);
			expect(ifc4.calc_IfcCurve_Dim(circle as EntityInstance)).toBe(3);
		});

		test("IfcPolyline -> Points[0].Dim", () => {
			const file = createTestFile("IFC4");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			expect(ifc4.calc_IfcCurve_Dim(polyline as EntityInstance)).toBe(2);
		});

		test("IfcTrimmedCurve -> recurses into IfcCurveDim(BasisCurve)", () => {
			const file = createTestFile("IFC4");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const trimmed = file.createEntity("IfcTrimmedCurve", polyline);
			expect(ifc4.calc_IfcCurve_Dim(trimmed as EntityInstance)).toBe(2);
		});

		// **Disclosed fix pin** (see `ifcCurveDim`'s own doc comment in `ifc4.ts`,
		// same fix as `ifc2x3.ts`'s own version): an `IfcTrimmedCurve` with an unset
		// `BasisCurve` recurses into `ifcCurveDim(INDETERMINATE)`, which returns `null`
		// via the explicit `!exists()` guard instead of throwing.
		test("IfcTrimmedCurve with an unset BasisCurve -> null, not a crash (disclosed fix)", () => {
			const file = createTestFile("IFC4");
			const trimmed = file.createEntity("IfcTrimmedCurve", null);
			expect(ifc4.calc_IfcCurve_Dim(trimmed as EntityInstance)).toBeNull();
		});

		test("IfcCompositeCurve -> Segments[0].Dim", () => {
			const file = createTestFile("IFC4");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
			const parentCurve = file.createEntity("IfcPolyline", [p0, p1]);
			const segment = file.createEntity("IfcCompositeCurveSegment", "CONTINUOUS", true, parentCurve);
			const compositeCurve = file.createEntity("IfcCompositeCurve", [segment], false);
			expect(ifc4.calc_IfcCurve_Dim(compositeCurve as EntityInstance)).toBe(3);
		});

		test("IfcBSplineCurve -> ControlPointsList[0].Dim", () => {
			const file = createTestFile("IFC4");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
			const p2 = file.createEntity("IfcCartesianPoint", [2.0, 0.0, 0.0]);
			const curve = file.createEntity("IfcBSplineCurve", 2, [p0, p1, p2], "UNSPECIFIED", false, false);
			expect(ifc4.calc_IfcCurve_Dim(curve as EntityInstance)).toBe(3);
		});

		test("IfcOffsetCurve2D -> always 2", () => {
			const file = createTestFile("IFC4");
			const offsetCurve = file.createEntity("IfcOffsetCurve2D");
			expect(ifc4.calc_IfcCurve_Dim(offsetCurve as EntityInstance)).toBe(2);
		});

		test("IfcOffsetCurve3D -> always 3", () => {
			const file = createTestFile("IFC4");
			const offsetCurve = file.createEntity("IfcOffsetCurve3D");
			expect(ifc4.calc_IfcCurve_Dim(offsetCurve as EntityInstance)).toBe(3);
		});

		// --- the 2 branches genuinely NEW to IFC4 (not in IFC2X3's own IfcCurveDim) ---

		test("IfcPcurve -> always 3 (NEW branch, IFC4-only)", () => {
			const file = createTestFile("IFC4");
			const planeLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const planePlacement = file.createEntity("IfcAxis2Placement3D", planeLocation, null, null);
			const plane = file.createEntity("IfcPlane", planePlacement);
			const refCurvePnt = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const refCurveDir = file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0);
			const referenceCurve = file.createEntity("IfcLine", refCurvePnt, refCurveDir);
			const pcurve = file.createEntity("IfcPcurve", plane, referenceCurve);
			expect(ifc4.calc_IfcCurve_Dim(pcurve as EntityInstance)).toBe(3);
		});

		// IfcIndexedPolyCurve -> Points.Dim, itself dispatching through THIS chunk's
		// own calc_IfcCartesianPointList_Dim -- a real cross-function integration.
		test("IfcIndexedPolyCurve -> Points.Dim (NEW branch, IFC4-only, dispatches into calc_IfcCartesianPointList_Dim)", () => {
			const file = createTestFile("IFC4");
			const pointList = file.createEntity("IfcCartesianPointList2D", [
				[0.0, 0.0],
				[1.0, 1.0],
				[2.0, 0.0],
			]);
			const indexedCurve = file.createEntity("IfcIndexedPolyCurve", pointList, null, null);
			expect(ifc4.calc_IfcCurve_Dim(indexedCurve as EntityInstance)).toBe(2);
		});

		test("end-to-end: indexedCurve.Dim resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
			const pointList = file.createEntity("IfcCartesianPointList3D", [
				[0.0, 0.0, 0.0],
				[1.0, 1.0, 1.0],
			]);
			const indexedCurve = file.createEntity("IfcIndexedPolyCurve", pointList, null, null);
			expect((indexedCurve as unknown as { Dim: number }).Dim).toBe(3);
		});
	});

	// --- calc_IfcDerivedUnit_Dimensions (+ IfcDeriveDimensionalExponents, byte-identical to IFC2X3's own) ---
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
		// attribute (not DERIVE) -- used here so these tests don't need
		// `calc_IfcSIUnit_Dimensions` (deliberately NOT ported by this chunk, still
		// genuinely unported for IFC4 -- see `ifc4.ts`'s own header comment).
		function buildUnitWithDimensions(file: IfcFile, dims: number[]) {
			const dimensions = file.createEntity("IfcDimensionalExponents", ...dims);
			return file.createEntity("IfcContextDependentUnit", dimensions, "USERDEFINED", "test-unit");
		}

		// Empty `Elements` -- `range(loindex([]), hiindex([]) + 1)` is `range(1, 1)`, an
		// empty range, so the loop body never runs and `result` stays the all-zero
		// `IfcDimensionalExponents(0, 0, 0, 0, 0, 0, 0)` it was constructed with.
		test("empty Elements -> all-zero exponents, loop body never runs", () => {
			const file = createTestFile("IFC4");
			const derivedUnit = buildDerivedUnit(file, []);
			const result = ifc4.calc_IfcDerivedUnit_Dimensions(derivedUnit as EntityInstance);
			expect(exponents(result)).toEqual([0, 0, 0, 0, 0, 0, 0]);
		});

		// One element, Exponent=2, Unit dims (1,0,0,0,0,0,0) -> LengthExponent
		// accumulates 2 * 1 = 2.
		test("single element, Exponent=2 on a length-dimensioned unit -> LengthExponent=2", () => {
			const file = createTestFile("IFC4");
			const unit = buildUnitWithDimensions(file, [1, 0, 0, 0, 0, 0, 0]);
			const derivedUnit = buildDerivedUnit(file, [buildElement(file, unit, 2)]);
			const result = ifc4.calc_IfcDerivedUnit_Dimensions(derivedUnit as EntityInstance);
			expect(exponents(result)).toEqual([2, 0, 0, 0, 0, 0, 0]);
		});

		// 3 elements, matching newton's own dimensions ((1,1,-2,0,0,0,0): mass^1 *
		// length^1 * time^-2) -- hand-derived accumulation across 3 units.
		test("3 elements (mass, length, time^-2) -> (1, 1, -2, 0, 0, 0, 0)", () => {
			const file = createTestFile("IFC4");
			const massUnit = buildUnitWithDimensions(file, [0, 1, 0, 0, 0, 0, 0]);
			const lengthUnit = buildUnitWithDimensions(file, [1, 0, 0, 0, 0, 0, 0]);
			const timeUnit = buildUnitWithDimensions(file, [0, 0, 1, 0, 0, 0, 0]);
			const derivedUnit = buildDerivedUnit(file, [
				buildElement(file, massUnit, 1),
				buildElement(file, lengthUnit, 1),
				buildElement(file, timeUnit, -2),
			]);
			const result = ifc4.calc_IfcDerivedUnit_Dimensions(derivedUnit as EntityInstance);
			expect(exponents(result)).toEqual([1, 1, -2, 0, 0, 0, 0]);
		});

		// Self-referential recursion: `Unit` typed `IfcDerivedUnit` -- the inner
		// `IfcDerivedUnit`'s own `.Dimensions` resolves via `calc_IfcDerivedUnit_
		// Dimensions` recursively (through the ordinary DERIVE-dispatch mechanism, no
		// special-casing needed).
		test("Unit=IfcDerivedUnit (self-referential recursion, one level deep)", () => {
			const file = createTestFile("IFC4");
			const lengthUnit = buildUnitWithDimensions(file, [1, 0, 0, 0, 0, 0, 0]);
			const innerDerivedUnit = buildDerivedUnit(file, [buildElement(file, lengthUnit, 2)]);
			// innerDerivedUnit.Dimensions (via DERIVE dispatch) = (2, 0, 0, 0, 0, 0, 0).
			const outerElement = file.createEntity("IfcDerivedUnitElement", innerDerivedUnit, 1);
			const outerDerivedUnit = buildDerivedUnit(file, [outerElement]);
			const result = ifc4.calc_IfcDerivedUnit_Dimensions(outerDerivedUnit as EntityInstance);
			expect(exponents(result)).toEqual([2, 0, 0, 0, 0, 0, 0]);
		});

		test("end-to-end: derivedUnit.Dimensions resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
			const unit = buildUnitWithDimensions(file, [1, 0, 0, 0, 0, 0, 0]);
			const derivedUnit = buildDerivedUnit(file, [buildElement(file, unit, 2)]);
			const result = (derivedUnit as unknown as { Dimensions: EntityInstance }).Dimensions;
			expect(exponents(result)).toEqual([2, 0, 0, 0, 0, 0, 0]);
		});
	});

	// --- calc_IfcEdgeLoop_Ne (byte-identical to IFC2X3's own) ---
	describe("calc_IfcEdgeLoop_Ne", () => {
		test("Ne = sizeof(EdgeList)", () => {
			const file = createTestFile("IFC4");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 0.0, 0.0]);
			const v0 = file.createEntity("IfcVertexPoint", p0);
			const v1 = file.createEntity("IfcVertexPoint", p1);
			const edge1 = file.createEntity("IfcEdge", v0, v1);
			const edge2 = file.createEntity("IfcEdge", v1, v0);
			const oe1 = file.createEntity("IfcOrientedEdge", edge1, true);
			const oe2 = file.createEntity("IfcOrientedEdge", edge2, true);
			const edgeLoop = file.createEntity("IfcEdgeLoop", [oe1, oe2]);
			expect(ifc4.calc_IfcEdgeLoop_Ne(edgeLoop as EntityInstance)).toBe(2);
		});

		test("end-to-end: edgeLoop.Ne resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
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
});

// =============================================================================
// Original, hand-rolled coverage for Phase EX-2's IFC4 THIRD chunk
// (planning/ifcopenshell-ts/70-express-rules-plan.md §4): 15 more of IFC4's 62
// `calc_*` DERIVE functions (`src/express/rules/ifc4.ts`) -- see that file's own
// header comment (the "third chunk" section) for the full byte-identical-vs-
// genuinely-different diffing writeup against IFC2X3, the empirically-verified
// `IfcGeometricRepresentationSubContext`/`IfcOrientedEdge`/`IfcMirroredProfileDef`
// positional-attribute-order findings, and the cascading test-fidelity fixes this
// chunk required elsewhere in the suite (`test/express/rules/ifc4.test.ts`'s own
// chunk-2 `calc_IfcCurve_Dim` test, `src/api/geometry/addRailingRepresentation.ts` +
// its own test file).
// =============================================================================
describe("express/rules/ifc4 -- calc_* functions (Phase EX-2, IFC4 chunk 3)", () => {
	// --- calc_IfcFaceBasedSurfaceModel_Dim (byte-identical to IFC2X3's own) ---
	describe("calc_IfcFaceBasedSurfaceModel_Dim", () => {
		// Python: `return 3` (unconditional constant).
		test("always 3", () => {
			const file = createTestFile("IFC4");
			const model = file.createEntity("IfcFaceBasedSurfaceModel");
			expect(ifc4.calc_IfcFaceBasedSurfaceModel_Dim(model as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcGeometricRepresentationSubContext_* (4 functions) ---
	//
	// Fixture note: `IfcGeometricRepresentationSubContext`'s real, native attribute
	// order (`declaration().as_entity().all_attributes()`, confirmed EMPIRICALLY
	// against the real built addon, per this chunk's own task brief -- NOT assumed to
	// carry over from IFC2X3 just because the entity name matches) is
	// `['ContextIdentifier', 'ContextType', 'CoordinateSpaceDimension', 'Precision',
	// 'WorldCoordinateSystem', 'TrueNorth', 'ParentContext', 'TargetScale',
	// 'TargetView', 'UserDefinedTargetView']` -- 10 positional slots, the SAME SHAPE as
	// IFC2X3's own (the 4 DERIVE-overridden attributes inherited from
	// `IfcGeometricRepresentationContext` still occupy real positional slots 3-6).
	// Schema evolution between IFC2X3 and IFC4 did NOT change this entity's own
	// inherited attribute ordering.
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
			const file = createTestFile("IFC4");
			const trueNorth = file.createEntity("IfcDirection", [0.0, 1.0, 0.0]);
			const { wcs, subContext } = buildSubContext(file, trueNorth as EntityInstance, 1.0e-5);
			const result = ifc4.calc_IfcGeometricRepresentationSubContext_WorldCoordinateSystem(
				subContext as EntityInstance,
			) as EntityInstance;
			expect(result.id()).toBe((wcs as EntityInstance).id());
		});

		// Python: `express_getattr(ParentContext, 'CoordinateSpaceDimension', INDETERMINATE)`.
		test("CoordinateSpaceDimension delegates to ParentContext.CoordinateSpaceDimension", () => {
			const file = createTestFile("IFC4");
			const trueNorth = file.createEntity("IfcDirection", [0.0, 1.0, 0.0]);
			const { subContext } = buildSubContext(file, trueNorth as EntityInstance, 1.0e-5);
			expect(
				ifc4.calc_IfcGeometricRepresentationSubContext_CoordinateSpaceDimension(subContext as EntityInstance),
			).toBe(3);
		});

		// Python: `nvl(express_getattr(ParentContext, 'TrueNorth', INDETERMINATE), ...)`.
		// ParentContext.TrueNorth is set -> returned directly (the
		// `IfcConvertDirectionInto2D` fallback path below is never reached, so this
		// branch behaves identically to IFC2X3's own version).
		test("TrueNorth: ParentContext.TrueNorth set -> returned directly", () => {
			const file = createTestFile("IFC4");
			const trueNorth = file.createEntity("IfcDirection", [0.0, 1.0, 0.0]);
			const { subContext } = buildSubContext(file, trueNorth as EntityInstance, 1.0e-5);
			const result = ifc4.calc_IfcGeometricRepresentationSubContext_TrueNorth(
				subContext as EntityInstance,
			) as EntityInstance;
			expect(result.id()).toBe((trueNorth as EntityInstance).id());
		});

		// **Genuinely different from IFC2X3** (see `ifc4.ts`'s own header comment, third
		// chunk): ParentContext.TrueNorth unset -> falls back to
		// `IfcConvertDirectionInto2D(self.WorldCoordinateSystem.P[2 - ONE_BASED])`, NOT
		// a raw pass-through of `P[1]` the way IFC2X3's own version does.
		// `self.WorldCoordinateSystem` = ParentContext.WorldCoordinateSystem = `wcs`, a
		// default (`Axis=null`, `RefDirection=null`) `IfcAxis2Placement3D` -> `P` =
		// `ifcBuildAxes(null, null)` = `[[1,0,0], [0,1,0], [0,0,1]]` (X axis, Y axis, Z
		// axis, hand-derived from `IfcFirstProjAxis`'s own disclosed always-true-branch
		// bug: `d1`=[0,0,1] default, `d2`=`IfcFirstProjAxis(d1, null)`=[1,0,0] (the
		// no-arg branch, bug 1, always takes the `[1,0,0]` sub-branch), Y axis =
		// `normalise(cross(d1,d2))` = `normalise(cross([0,0,1],[1,0,0]))` = [0,1,0]).
		// `P[2 - ONE_BASED]` (0-based index 1) = the Y axis = `[0,1,0]`, a 3-component
		// `IfcDirection`. `IfcConvertDirectionInto2D` copies only its first 2
		// components into a FRESH, genuinely-2D `IfcDirection` (`Dim` = 2 via
		// `calc_IfcDirection_Dim`, chunk 1) -- IFC2X3's own version would instead
		// return that exact 3-component `P[1]` instance unwrapped (`Dim` = 3).
		test("TrueNorth: ParentContext.TrueNorth unset -> IfcConvertDirectionInto2D(WCS.P[1]), a NEW 2D direction (genuinely different from IFC2X3's raw pass-through)", () => {
			const file = createTestFile("IFC4");
			const { subContext } = buildSubContext(file, null, 1.0e-5);
			const result = ifc4.calc_IfcGeometricRepresentationSubContext_TrueNorth(
				subContext as EntityInstance,
			) as EntityInstance;
			expect((result as unknown as { Dim: number }).Dim).toBe(2);
			closeArray(ratios(result), [0.0, 1.0]);
		});

		// Python: `nvl(express_getattr(ParentContext, 'Precision', INDETERMINATE), 1)`.
		test("Precision delegates to ParentContext.Precision when set", () => {
			const file = createTestFile("IFC4");
			const { subContext } = buildSubContext(file, null, 1.0e-5);
			expect(ifc4.calc_IfcGeometricRepresentationSubContext_Precision(subContext as EntityInstance)).toBeCloseTo(
				1.0e-5,
				10,
			);
		});

		test("Precision falls back to 1 when ParentContext.Precision is unset", () => {
			const file = createTestFile("IFC4");
			const { subContext } = buildSubContext(file, null, null);
			expect(ifc4.calc_IfcGeometricRepresentationSubContext_Precision(subContext as EntityInstance)).toBe(1);
		});

		// End-to-end: read `.CoordinateSpaceDimension` through the normal
		// `EntityInstance` attribute-read path.
		test("end-to-end: subContext.CoordinateSpaceDimension resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
			const trueNorth = file.createEntity("IfcDirection", [0.0, 1.0, 0.0]);
			const { subContext } = buildSubContext(file, trueNorth as EntityInstance, 1.0e-5);
			expect((subContext as unknown as { CoordinateSpaceDimension: number }).CoordinateSpaceDimension).toBe(3);
		});
	});

	// --- calc_IfcGeometricSet_Dim (byte-identical to IFC2X3's own) ---
	describe("calc_IfcGeometricSet_Dim", () => {
		// Python: `express_getattr(express_getitem(Elements, 0, INDETERMINATE), 'Dim',
		// INDETERMINATE)` -- the FIRST element's own Dim. A 2D IfcCartesianPoint's own
		// Dim (`calc_IfcCartesianPoint_Dim`, chunk 1) is 2.
		test("Elements[0].Dim resolves via calc_IfcCartesianPoint_Dim", () => {
			const file = createTestFile("IFC4");
			const point = file.createEntity("IfcCartesianPoint", [1.0, 2.0]);
			const geometricSet = file.createEntity("IfcGeometricSet", [point]);
			expect(ifc4.calc_IfcGeometricSet_Dim(geometricSet as EntityInstance)).toBe(2);
		});
	});

	// --- calc_IfcHalfSpaceSolid_Dim (byte-identical to IFC2X3's own) ---
	describe("calc_IfcHalfSpaceSolid_Dim", () => {
		// Python: `return 3` (unconditional constant).
		test("always 3", () => {
			const file = createTestFile("IFC4");
			const halfSpace = file.createEntity("IfcHalfSpaceSolid");
			expect(ifc4.calc_IfcHalfSpaceSolid_Dim(halfSpace as EntityInstance)).toBe(3);
		});
	});

	// --- calc_IfcMaterialLayerSet_TotalThickness (+ its IfcMlsTotalThickness helper, byte-identical to IFC2X3's own) ---
	describe("calc_IfcMaterialLayerSet_TotalThickness", () => {
		// Python: `IfcMlsTotalThickness` sums every `MaterialLayers[].LayerThickness`
		// (real Python's own local variable is confusingly named `max`, but it is a
		// running SUM, not a maximum). 10.0 + 20.0 + 5.0 = 35.0.
		test("sums every MaterialLayers[].LayerThickness (not a maximum, despite real Python's own `max` variable name)", () => {
			const file = createTestFile("IFC4");
			const layer1 = file.createEntity("IfcMaterialLayer", null, 10.0, null, null, null, null, null);
			const layer2 = file.createEntity("IfcMaterialLayer", null, 20.0, null, null, null, null, null);
			const layer3 = file.createEntity("IfcMaterialLayer", null, 5.0, null, null, null, null, null);
			const layerSet = file.createEntity("IfcMaterialLayerSet", [layer1, layer2, layer3], null, null);
			expect(ifc4.calc_IfcMaterialLayerSet_TotalThickness(layerSet as EntityInstance)).toBeCloseTo(35.0, 10);
		});

		// Single-layer set: the `sizeof(MaterialLayers) > 1` loop guard is never
		// entered, `total` stays at its initial value (`MaterialLayers[0].LayerThickness`).
		test("single-layer set: total is just that one layer's own thickness", () => {
			const file = createTestFile("IFC4");
			const layer1 = file.createEntity("IfcMaterialLayer", null, 42.0, null, null, null, null, null);
			const layerSet = file.createEntity("IfcMaterialLayerSet", [layer1], null, null);
			expect(ifc4.calc_IfcMaterialLayerSet_TotalThickness(layerSet as EntityInstance)).toBeCloseTo(42.0, 10);
		});

		// End-to-end: read `.TotalThickness` through the normal `EntityInstance`
		// attribute-read path.
		test("end-to-end: layerSet.TotalThickness resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
			const layer1 = file.createEntity("IfcMaterialLayer", null, 10.0, null, null, null, null, null);
			const layer2 = file.createEntity("IfcMaterialLayer", null, 20.0, null, null, null, null, null);
			const layerSet = file.createEntity("IfcMaterialLayerSet", [layer1, layer2], null, null);
			expect((layerSet as unknown as { TotalThickness: number }).TotalThickness).toBeCloseTo(30.0, 10);
		});
	});

	// --- calc_IfcMirroredProfileDef_Operator (genuinely IFC4-only, no IFC2X3 equivalent) ---
	describe("calc_IfcMirroredProfileDef_Operator", () => {
		// Python: `IfcCartesianTransformationOperator2D(Axis1=IfcDirection(
		// DirectionRatios=[-1.0, 0.0]), Axis2=IfcDirection(DirectionRatios=[0.0, 1.0]),
		// LocalOrigin=IfcCartesianPoint(Coordinates=[0.0, 0.0]), Scale=1.0)` -- a FIXED
		// value that does not read `self` at all (confirmed directly: `self` is unused
		// in the entire real Python body). Called here with an unrelated dummy entity
		// to confirm exactly that.
		test("returns a fixed X-axis-mirroring 2D transformation operator, ignoring self entirely", () => {
			const file = createTestFile("IFC4");
			const dummy = file.createEntity("IfcCsgPrimitive3D");
			const operator = ifc4.calc_IfcMirroredProfileDef_Operator(dummy as EntityInstance) as EntityInstance;
			expect(operator.isA("IfcCartesianTransformationOperator2D")).toBe(true);
			const axis1 = (operator as unknown as { Axis1: EntityInstance }).Axis1;
			closeArray(ratios(axis1), [-1.0, 0.0]);
			const axis2 = (operator as unknown as { Axis2: EntityInstance }).Axis2;
			closeArray(ratios(axis2), [0.0, 1.0]);
			const localOrigin = (operator as unknown as { LocalOrigin: EntityInstance }).LocalOrigin;
			expect((localOrigin as unknown as { Coordinates: number[] }).Coordinates).toEqual([0.0, 0.0]);
			expect((operator as unknown as { Scale: number }).Scale).toBe(1.0);
		});

		// Fixture note (same shape as `IfcGeometricRepresentationSubContext`/
		// `IfcOrientedEdge` above): `IfcMirroredProfileDef`'s real, native attribute
		// order, confirmed EMPIRICALLY against the real built addon, is
		// `['ProfileType', 'ProfileName', 'ParentProfile', 'Operator', 'Label']` -- 5
		// positional slots, including `Operator` itself (DERIVE-overriding
		// `IfcDerivedProfileDef`'s own stored `Operator`) at slot 4 --
		// `generated/ifc4.d.ts`'s own `IfcMirroredProfileDef` interface omits it (4
		// fields only), matching this file's own "`.d.ts` is accurate for reading, not
		// for `createEntity`'s positional convention" precedent.
		test("end-to-end: mirroredProfile.Operator resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
			const parentProfile = file.createEntity("IfcCircleProfileDef", "AREA", null, null, 5.0);
			const mirroredProfile = file.createEntity("IfcMirroredProfileDef", "AREA", null, parentProfile, null, null);
			const operator = (mirroredProfile as unknown as { Operator: EntityInstance }).Operator;
			expect(operator.isA("IfcCartesianTransformationOperator2D")).toBe(true);
			closeArray(ratios((operator as unknown as { Axis1: EntityInstance }).Axis1), [-1.0, 0.0]);
		});
	});

	// --- calc_IfcOrientedEdge_EdgeStart / calc_IfcOrientedEdge_EdgeEnd (+ IfcBooleanChoose, byte-identical to IFC2X3's own) ---
	describe("calc_IfcOrientedEdge_EdgeStart / calc_IfcOrientedEdge_EdgeEnd", () => {
		// Fixture note (same shape as `IfcGeometricRepresentationSubContext` above):
		// `IfcOrientedEdge`'s real, native attribute order, confirmed EMPIRICALLY
		// against the real built addon, is `[EdgeStart, EdgeEnd, EdgeElement,
		// Orientation]` -- the SAME SHAPE as IFC2X3's own -- `createEntity` needs all 4
		// positional slots, not just the 2 genuinely-storable ones
		// `generated/ifc4.d.ts` documents (`EdgeElement`, `Orientation`).
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
		test("Orientation=true -> EdgeStart is EdgeElement.EdgeStart", () => {
			const file = createTestFile("IFC4");
			const { v0, orientedEdge } = buildOrientedEdge(file, true);
			const result = ifc4.calc_IfcOrientedEdge_EdgeStart(orientedEdge as EntityInstance) as EntityInstance;
			expect(result.id()).toBe((v0 as EntityInstance).id());
		});

		test("Orientation=false -> EdgeStart is EdgeElement.EdgeEnd", () => {
			const file = createTestFile("IFC4");
			const { v1, orientedEdge } = buildOrientedEdge(file, false);
			const result = ifc4.calc_IfcOrientedEdge_EdgeStart(orientedEdge as EntityInstance) as EntityInstance;
			expect(result.id()).toBe((v1 as EntityInstance).id());
		});

		// `calc_IfcOrientedEdge_EdgeEnd` swaps choice1/choice2.
		test("Orientation=true -> EdgeEnd is EdgeElement.EdgeEnd", () => {
			const file = createTestFile("IFC4");
			const { v1, orientedEdge } = buildOrientedEdge(file, true);
			const result = ifc4.calc_IfcOrientedEdge_EdgeEnd(orientedEdge as EntityInstance) as EntityInstance;
			expect(result.id()).toBe((v1 as EntityInstance).id());
		});

		test("Orientation=false -> EdgeEnd is EdgeElement.EdgeStart", () => {
			const file = createTestFile("IFC4");
			const { v0, orientedEdge } = buildOrientedEdge(file, false);
			const result = ifc4.calc_IfcOrientedEdge_EdgeEnd(orientedEdge as EntityInstance) as EntityInstance;
			expect(result.id()).toBe((v0 as EntityInstance).id());
		});

		// `IfcBooleanChoose`'s own disclosed careful-truthiness handling: `Orientation`
		// unset (`$`) resolves to `runtimeShim.INDETERMINATE`, which real Python's own
		// `indeterminate_type.__bool__` treats as falsy.
		test("Orientation unset (INDETERMINATE) -> treated as falsy, matching real Python's indeterminate_type.__bool__", () => {
			const file = createTestFile("IFC4");
			const { v1, orientedEdge } = buildOrientedEdge(file, null);
			const result = ifc4.calc_IfcOrientedEdge_EdgeStart(orientedEdge as EntityInstance) as EntityInstance;
			expect(result.id()).toBe((v1 as EntityInstance).id());
		});

		// End-to-end: read `.EdgeStart` through the normal `EntityInstance`
		// attribute-read path.
		test("end-to-end: orientedEdge.EdgeStart resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
			const { v0, orientedEdge } = buildOrientedEdge(file, true);
			expect((orientedEdge as unknown as { EdgeStart: EntityInstance }).EdgeStart.id()).toBe(
				(v0 as EntityInstance).id(),
			);
		});
	});

	// --- calc_IfcPlacement_Dim (byte-identical to IFC2X3's own) ---
	describe("calc_IfcPlacement_Dim", () => {
		// Python: `express_getattr(Location, 'Dim', INDETERMINATE)`. Location is a 3D
		// IfcCartesianPoint -> Dim = 3.
		test("Location.Dim resolves via calc_IfcCartesianPoint_Dim", () => {
			const file = createTestFile("IFC4");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			expect(ifc4.calc_IfcPlacement_Dim(placement as EntityInstance)).toBe(3);
		});

		// End-to-end: read `.Dim` on a real `IfcAxis2Placement3D` through the normal
		// `EntityInstance` attribute-read path -- `IfcAxis2Placement3D` has no own
		// `Dim` function, so dispatch must walk its supertype chain up to
		// `IfcPlacement.Dim` to resolve it.
		test("end-to-end: placement.Dim resolves through the normal attribute-read path via supertype dispatch", () => {
			const file = createTestFile("IFC4");
			const location = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const placement = file.createEntity("IfcAxis2Placement3D", location, null, null);
			expect((placement as unknown as { Dim: number }).Dim).toBe(3);
		});
	});

	// --- calc_IfcPointOnCurve_Dim (byte-identical to IFC2X3's own) ---
	describe("calc_IfcPointOnCurve_Dim", () => {
		// Python: `express_getattr(BasisCurve, 'Dim', INDETERMINATE)`. BasisCurve is a
		// 2D IfcPolyline -> Dim = 2 (via `calc_IfcCurve_Dim`, IFC4 chunk 2).
		test("BasisCurve.Dim resolves via calc_IfcCurve_Dim", () => {
			const file = createTestFile("IFC4");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const pointOnCurve = file.createEntity("IfcPointOnCurve", polyline, 0.5);
			expect(ifc4.calc_IfcPointOnCurve_Dim(pointOnCurve as EntityInstance)).toBe(2);
		});

		// End-to-end: read `.Dim` through the normal `EntityInstance` attribute-read path.
		test("end-to-end: pointOnCurve.Dim resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
			const p0 = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
			const p1 = file.createEntity("IfcCartesianPoint", [1.0, 1.0]);
			const polyline = file.createEntity("IfcPolyline", [p0, p1]);
			const pointOnCurve = file.createEntity("IfcPointOnCurve", polyline, 0.5);
			expect((pointOnCurve as unknown as { Dim: number }).Dim).toBe(2);
		});
	});

	// --- calc_IfcPointOnSurface_Dim (byte-identical to IFC2X3's own) ---
	describe("calc_IfcPointOnSurface_Dim", () => {
		// Python: `express_getattr(BasisSurface, 'Dim', INDETERMINATE)` -- a pure
		// delegation, agnostic to the actual real-Python-schema type of `BasisSurface`.
		// **Disclosed fixture note**: no `IfcXxxSurface.Dim` function is ported for
		// IFC4 yet by this chunk or chunks 1-2 (`IfcElementarySurface`/`IfcSweptSurface`
		// are out of this chunk's own assigned scope), so there is no real `IfcSurface`
		// subtype available yet whose own `.Dim` resolves to a concrete number for
		// IFC4. `IfcCsgPrimitive3D` (a SOLID, not a surface -- but the only
		// already-ported-for-IFC4 entity type whose own `.Dim` is a plain,
		// unconditional constant, chunk 2) is used here purely as a schema-
		// nonconformant stand-in to exercise `calc_IfcPointOnSurface_Dim`'s own pure
		// delegation logic in isolation -- this port's `createEntity`/`.get()`
		// primitive layer performs no SELECT-type conformance check, so the fixture is
		// functionally sufficient despite not being a real, valid `IfcSurface`.
		test("BasisSurface.Dim resolves via delegation (IfcCsgPrimitive3D stand-in, see disclosed fixture note)", () => {
			const file = createTestFile("IFC4");
			const basisSurface = file.createEntity("IfcCsgPrimitive3D");
			const pointOnSurface = file.createEntity("IfcPointOnSurface", basisSurface, 0.5, 0.5);
			expect(ifc4.calc_IfcPointOnSurface_Dim(pointOnSurface as EntityInstance)).toBe(3);
		});

		// End-to-end: read `.Dim` through the normal `EntityInstance` attribute-read path.
		test("end-to-end: pointOnSurface.Dim resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
			const basisSurface = file.createEntity("IfcCsgPrimitive3D");
			const pointOnSurface = file.createEntity("IfcPointOnSurface", basisSurface, 0.5, 0.5);
			expect((pointOnSurface as unknown as { Dim: number }).Dim).toBe(3);
		});
	});

	// --- calc_IfcRevolvedAreaSolid_AxisLine (+ IfcLine, byte-identical to IFC2X3's own) ---
	describe("calc_IfcRevolvedAreaSolid_AxisLine", () => {
		// Python: `IfcLine(Pnt=Axis.Location, Dir=IfcVector(Orientation=Axis.Z,
		// Magnitude=1.0))`. `Axis.Z` is `IfcAxis1Placement`'s own DERIVE attribute
		// (`calc_IfcAxis1Placement_Z`, IFC4 chunk 1): `nvl(IfcNormalise(Axis), default)`
		// -- exercised here with an UNNORMALIZED `Axis` ([0,0,2]) to confirm the full
		// chain normalizes it (-> [0,0,1]), not just passes it through.
		test("AxisLine.Pnt is Axis.Location, AxisLine.Dir is a unit vector along (normalised) Axis.Z", () => {
			const file = createTestFile("IFC4");
			const profile = file.createEntity("IfcRectangleProfileDef", "AREA", null, null, 2.0, 3.0);
			const positionLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
			const position = file.createEntity("IfcAxis2Placement3D", positionLocation, null, null);
			const axisLocation = file.createEntity("IfcCartesianPoint", [1.0, 2.0, 3.0]);
			const zAxis = file.createEntity("IfcDirection", [0.0, 0.0, 2.0]);
			const axis = file.createEntity("IfcAxis1Placement", axisLocation, zAxis);
			const revolvedSolid = file.createEntity("IfcRevolvedAreaSolid", profile, position, axis, Math.PI / 2);
			const axisLine = ifc4.calc_IfcRevolvedAreaSolid_AxisLine(revolvedSolid as EntityInstance) as EntityInstance;
			const pnt = (axisLine as unknown as { Pnt: EntityInstance }).Pnt;
			expect(pnt.id()).toBe((axisLocation as EntityInstance).id());
			const dir = (axisLine as unknown as { Dir: EntityInstance }).Dir;
			expect((dir as unknown as { Magnitude: number }).Magnitude).toBe(1.0);
			closeArray(ratios((dir as unknown as { Orientation: unknown }).Orientation), [0, 0, 1]);
		});

		// End-to-end: read `.AxisLine` through the normal `EntityInstance`
		// attribute-read path.
		test("end-to-end: revolvedSolid.AxisLine resolves through the normal attribute-read path", () => {
			const file = createTestFile("IFC4");
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
});
