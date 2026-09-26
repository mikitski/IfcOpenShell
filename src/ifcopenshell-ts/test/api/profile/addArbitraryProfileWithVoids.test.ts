// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_arbitrary_profile_with_voids.py` (confirmed: no
// `test_add_arbitrary_profile_with_voids.py` under `test/api/profile/`). This suite is
// written directly from the real source's own behavior/docstring, covering the
// IFC2X3-vs-IFC4+ schema branch and, crucially, pinning the real, disclosed Python bug
// documented in `../../../src/api/profile/addArbitraryProfileWithVoids.ts`'s own
// header comment: on IFC4+, the OUTER curve is never dimension-checked and is always
// built as `IfcCartesianPointList3D`, even for 2D input -- unlike the inner-profile
// loop, which DOES branch correctly on dimensionality.

import { describe, expect, test } from "vitest";
import { addArbitraryProfileWithVoids } from "../../../src/api/profile/addArbitraryProfileWithVoids";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const OUTER_2D = [
	[0.0, 0.0],
	[0.4, 0.0],
	[0.4, 0.4],
	[0.0, 0.4],
	[0.0, 0.0],
];
const INNER_2D = [
	[0.1, 0.1],
	[0.3, 0.1],
	[0.3, 0.3],
	[0.1, 0.3],
	[0.1, 0.1],
];

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.profile.addArbitraryProfileWithVoids (IFC2X3)", () => {
	test("builds an IfcPolyline outer curve and one IfcPolyline per inner profile", () => {
		const file = createTestFile("IFC2X3");
		const profile = addArbitraryProfileWithVoids(file, {
			outerProfile: OUTER_2D,
			innerProfiles: [INNER_2D],
			name: "SK01 Hole Profile",
		});

		expect(profile.isA("IfcArbitraryProfileDefWithVoids")).toBe(true);
		expect(profile.get("ProfileType")).toBe("AREA");
		expect(profile.get("ProfileName")).toBe("SK01 Hole Profile");

		const outerCurve = profile.get("OuterCurve") as EntityInstance;
		expect(outerCurve.isA("IfcPolyline")).toBe(true);
		expect((outerCurve.get("Points") as EntityInstance[]).map((p) => p.get("Coordinates"))).toEqual(OUTER_2D);

		const innerCurves = profile.get("InnerCurves") as EntityInstance[];
		expect(innerCurves).toHaveLength(1);
		expect(innerCurves[0].isA("IfcPolyline")).toBe(true);
		expect((innerCurves[0].get("Points") as EntityInstance[]).map((p) => p.get("Coordinates"))).toEqual(INNER_2D);
	});
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.profile.addArbitraryProfileWithVoids (%s)",
	(schema) => {
		test("*** disclosed Python bug: the outer curve is always IfcCartesianPointList3D, even for 2D input ***", () => {
			const file = createTestFile(schema);
			const profile = addArbitraryProfileWithVoids(file, {
				outerProfile: OUTER_2D,
				innerProfiles: [],
			});

			const outerCurve = profile.get("OuterCurve") as EntityInstance;
			expect(outerCurve.isA("IfcIndexedPolyCurve")).toBe(true);
			const outerPoints = outerCurve.get("Points") as EntityInstance;
			// This is the real, disclosed bug (see this file's own header comment and
			// `addArbitraryProfileWithVoids.ts`'s): despite `OUTER_2D` being 2D
			// coordinates, real Python unconditionally builds `IfcCartesianPointList3D`
			// for the outer curve -- reproduced verbatim, not "fixed" to match the
			// inner-profile loop's own, more careful dimension branch below.
			expect(outerPoints.isA("IfcCartesianPointList3D")).toBe(true);
			const coordList = outerPoints.get("CoordList") as number[][];
			expect(coordList).toEqual(OUTER_2D);
			// Each row genuinely has only 2 coordinates, not the 3 a real
			// `IfcCartesianPointList3D.CoordList` (`LIST [3:3] OF IfcLengthMeasure`)
			// requires -- schema-invalid, but `ifcopenshell` doesn't validate this at
			// entity-creation time, so no error is thrown here either.
			expect(coordList.every((row) => row.length === 2)).toBe(true);
		});

		test("inner profiles ARE correctly dimension-checked: 2D -> IfcCartesianPointList2D", () => {
			const file = createTestFile(schema);
			const profile = addArbitraryProfileWithVoids(file, {
				outerProfile: OUTER_2D,
				innerProfiles: [INNER_2D],
			});

			const innerCurves = profile.get("InnerCurves") as EntityInstance[];
			expect(innerCurves).toHaveLength(1);
			expect(innerCurves[0].isA("IfcIndexedPolyCurve")).toBe(true);
			const innerPoints = innerCurves[0].get("Points") as EntityInstance;
			expect(innerPoints.isA("IfcCartesianPointList2D")).toBe(true);
			expect(innerPoints.get("CoordList")).toEqual(INNER_2D);
		});

		test("inner profiles ARE correctly dimension-checked: 3D -> IfcCartesianPointList3D", () => {
			const file = createTestFile(schema);
			const inner3d = [
				[0.1, 0.1, 0.0],
				[0.3, 0.1, 0.0],
				[0.3, 0.3, 0.0],
			];
			const profile = addArbitraryProfileWithVoids(file, {
				outerProfile: OUTER_2D,
				innerProfiles: [inner3d],
			});

			const innerCurves = profile.get("InnerCurves") as EntityInstance[];
			const innerPoints = innerCurves[0].get("Points") as EntityInstance;
			expect(innerPoints.isA("IfcCartesianPointList3D")).toBe(true);
			expect(innerPoints.get("CoordList")).toEqual(inner3d);
		});

		test("invalid inner-profile dimensions (neither 2 nor 3) throw, matching real Python's assert False", () => {
			const file = createTestFile(schema);
			expect(() =>
				addArbitraryProfileWithVoids(file, {
					outerProfile: OUTER_2D,
					innerProfiles: [
						[
							[0.0, 0.0, 0.0, 0.0],
							[1.0, 0.0, 0.0, 0.0],
						],
					],
				}),
			).toThrow(/Invalid dimensions: 4/);
		});

		test("name defaults to null when unset", () => {
			const file = createTestFile(schema);
			const profile = addArbitraryProfileWithVoids(file, { outerProfile: OUTER_2D, innerProfiles: [] });
			expect(profile.get("ProfileName")).toBeNull();
			expect(profile.get("InnerCurves")).toEqual([]);
		});
	},
);
