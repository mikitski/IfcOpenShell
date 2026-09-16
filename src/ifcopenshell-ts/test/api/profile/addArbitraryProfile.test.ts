// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_arbitrary_profile.py` (confirmed: no
// `test_add_arbitrary_profile.py` under `test/api/profile/`). This suite is written
// directly from the real source's own behavior/docstring, covering both the
// IFC2X3-vs-IFC4+ schema branch and the 2D-vs-3D dimension branch (see
// `../../../src/api/profile/addArbitraryProfile.ts`'s own header comment for the full
// writeup of both). Default test-file units are plain SI meters (`unit_scale == 1`,
// see `../../../src/template.ts`), so `convert_si_to_unit`'s division is a no-op here
// and coordinates round-trip exactly -- kept simple deliberately, since unit-scale
// conversion itself is already covered by `../../../src/util/unit.test.ts`.

import { describe, expect, test } from "vitest";
import { addArbitraryProfile } from "../../../src/api/profile/addArbitraryProfile";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.profile.addArbitraryProfile (IFC2X3)", () => {
	test("builds an IfcPolyline of IfcCartesianPoints on IFC2X3", () => {
		const file = createTestFile("IFC2X3");
		const profile = addArbitraryProfile(file, {
			profile: [
				[0.0, 0.0],
				[0.01, 0.0],
				[0.01, 0.1],
				[0.0, 0.1],
				[0.0, 0.0],
			],
			name: "SK01 Profile",
		});

		expect(profile.isA("IfcArbitraryClosedProfileDef")).toBe(true);
		expect(profile.get("ProfileType")).toBe("AREA");
		expect(profile.get("ProfileName")).toBe("SK01 Profile");
		const curve = profile.get("OuterCurve") as EntityInstance;
		expect(curve.isA("IfcPolyline")).toBe(true);
		const points = curve.get("Points") as EntityInstance[];
		expect(points.map((p) => p.get("Coordinates"))).toEqual([
			[0.0, 0.0],
			[0.01, 0.0],
			[0.01, 0.1],
			[0.0, 0.1],
			[0.0, 0.0],
		]);
	});
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.profile.addArbitraryProfile (%s)", (schema) => {
	test("builds an IfcIndexedPolyCurve over an IfcCartesianPointList2D for 2D input", () => {
		const file = createTestFile(schema);
		const profile = addArbitraryProfile(file, {
			profile: [
				[0.0, 0.0],
				[0.01, 0.0],
				[0.01, 0.1],
				[0.0, 0.1],
				[0.0, 0.0],
			],
			name: "SK01 Profile",
		});

		expect(profile.get("ProfileName")).toBe("SK01 Profile");
		const curve = profile.get("OuterCurve") as EntityInstance;
		expect(curve.isA("IfcIndexedPolyCurve")).toBe(true);
		const pointsList = curve.get("Points") as EntityInstance;
		expect(pointsList.isA("IfcCartesianPointList2D")).toBe(true);
		expect(pointsList.get("CoordList")).toEqual([
			[0.0, 0.0],
			[0.01, 0.0],
			[0.01, 0.1],
			[0.0, 0.1],
			[0.0, 0.0],
		]);
	});

	test("builds an IfcIndexedPolyCurve over an IfcCartesianPointList3D for 3D input", () => {
		const file = createTestFile(schema);
		const profile = addArbitraryProfile(file, {
			profile: [
				[0.0, 0.0, 0.0],
				[1.0, 0.0, 0.0],
				[1.0, 1.0, 0.0],
			],
		});

		const curve = profile.get("OuterCurve") as EntityInstance;
		const pointsList = curve.get("Points") as EntityInstance;
		expect(pointsList.isA("IfcCartesianPointList3D")).toBe(true);
		expect(pointsList.get("CoordList")).toEqual([
			[0.0, 0.0, 0.0],
			[1.0, 0.0, 0.0],
			[1.0, 1.0, 0.0],
		]);
	});

	test("name defaults to null when unset", () => {
		const file = createTestFile(schema);
		const profile = addArbitraryProfile(file, {
			profile: [
				[0.0, 0.0],
				[1.0, 0.0],
				[1.0, 1.0],
			],
		});
		expect(profile.get("ProfileName")).toBeNull();
	});

	test("invalid dimensions (neither 2 nor 3) throw, matching real Python's assert False", () => {
		const file = createTestFile(schema);
		expect(() =>
			addArbitraryProfile(file, {
				profile: [
					[0.0, 0.0, 0.0, 0.0],
					[1.0, 0.0, 0.0, 0.0],
				],
			}),
		).toThrow(/Invalid dimensions: 4/);
	});
});
