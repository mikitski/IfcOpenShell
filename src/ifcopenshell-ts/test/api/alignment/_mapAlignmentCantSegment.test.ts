// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `_map_alignment_cant_segment.py` (confirmed by
// reading the whole real test directory) -- its own real callers are out of this
// chunk's scope. Original test coverage written here, gated to IFC4X3.
//
// Expected numeric values below are computed independently in this file, following
// the real Python source's own formulas line-by-line (not by calling back into the
// module under test) -- a genuine cross-check of transcription fidelity.

import { describe, expect, test } from "vitest";
import { _mapAlignmentCantSegment } from "../../../src/api/alignment/_mapAlignmentCantSegment";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function approxEqual(actual: readonly number[], expected: readonly number[], precision = 8): void {
	expect(actual.length).toBe(expected.length);
	for (let i = 0; i < expected.length; i++) {
		expect(actual[i]).toBeCloseTo(expected[i], precision);
	}
}

function cantSegment(
	file: IfcFile,
	predefinedType: string,
	fields: {
		startDistAlong?: number;
		horizontalLength?: number;
		startCantLeft?: number;
		endCantLeft?: number | null;
		startCantRight?: number;
		endCantRight?: number | null;
	},
): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentCantSegment",
		null,
		null,
		fields.startDistAlong ?? 0.0,
		fields.horizontalLength ?? 0.0,
		fields.startCantLeft ?? 0.0,
		fields.endCantLeft ?? null,
		fields.startCantRight ?? 0.0,
		fields.endCantRight ?? null,
		predefinedType,
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

/** Real Python's `_get_axis`: `Dh = railHeadDistance`, `Dy = 2 * Ds`, `Dz =
 * sqrt(Dh^2 - Dy^2)`. */
function expectedAxis(Ds: number, railHeadDistance: number): readonly [number, number, number] {
	const Dh = railHeadDistance;
	const Dy = 2 * Ds;
	const Dz = Math.sqrt(Dh * Dh - Dy * Dy);
	return [0.0, Dy / Dh, Dz / Dh];
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._mapAlignmentCantSegment (IFC4X3)", () => {
	test("throws TypeError for a non-IfcAlignmentSegment argument", () => {
		const file = createTestFile("IFC4X3");
		const notASegment = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);

		expect(() => _mapAlignmentCantSegment(file, notASegment, 1.5)).toThrow(
			new TypeError("Expected to see type 'IfcAlignmentSegment', instead received 'IfcCartesianPoint'."),
		);
	});

	// NOT tested: the dispatcher's own final "else: throw TypeError" branch. Empirically
	// verified (against this chunk's own freshly-built native addon) that real
	// `IfcAlignmentCantSegmentTypeEnum`'s ONLY 7 valid schema keywords are exactly the
	// 7 branches this dispatcher already handles, so no schema-valid
	// `IfcAlignmentCantSegment` can ever reach that branch -- see
	// `_mapAlignmentVerticalSegment.test.ts`'s own identical disclosure for the full
	// reasoning (same category of genuinely dead branch).

	test("CONSTANTCANT builds an IfcLine-based IfcCurveSegment with a symmetric cant", () => {
		const file = createTestFile("IFC4X3");
		const railHeadDistance = 1.5;
		const segment = cantSegment(file, "CONSTANTCANT", {
			startDistAlong: 10,
			horizontalLength: 100,
			startCantLeft: 0.02,
			startCantRight: 0.02,
		});

		const [curveSegment, second] = _mapAlignmentCantSegment(file, segment, railHeadDistance);
		expect(second).toBeNull();
		expect(curveSegment.isA()).toBe("IfcCurveSegment");
		expect(curveSegment.get("Transition")).toBe("DISCONTINUOUS");

		const Ds = 0.5 * (0.02 + 0.02);
		const placement = curveSegment.get("Placement") as EntityInstance;
		expect(placement.isA()).toBe("IfcAxis2Placement3D");
		approxEqual((placement.get("Location") as EntityInstance).get("Coordinates") as number[], [10, Ds, 0.0]);
		// Symmetric cant (Dsl == Dsr) -> _get_axis(0.5*(Dsr-Dsl)=0, railHeadDistance).
		approxEqual(
			(placement.get("Axis") as EntityInstance).get("DirectionRatios") as number[],
			expectedAxis(0, railHeadDistance),
		);
		approxEqual((placement.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[], [1, 0, 0]);

		expect(curveSegment.get("SegmentStart")).toBe(0.0);
		expect(curveSegment.get("SegmentLength")).toBe(100);

		const parentCurve = curveSegment.get("ParentCurve") as EntityInstance;
		expect(parentCurve.isA()).toBe("IfcLine");
	});

	test("LINEARTRANSITION builds an IfcClothoid-based IfcCurveSegment", () => {
		const file = createTestFile("IFC4X3");
		const railHeadDistance = 1.5;
		const length = 30;
		const Dsl = 0.0;
		const Del = 0.06;
		const Dsr = 0.0;
		const Der = 0.06;
		const segment = cantSegment(file, "LINEARTRANSITION", {
			startDistAlong: 0,
			horizontalLength: length,
			startCantLeft: Dsl,
			endCantLeft: Del,
			startCantRight: Dsr,
			endCantRight: Der,
		});

		const [curveSegment] = _mapAlignmentCantSegment(file, segment, railHeadDistance);

		const Ds = 0.5 * (Dsl + Dsr);
		const De = 0.5 * (Del + Der);
		const f = De - Ds;
		const a0 = Ds;
		const a1 = f;
		const A0 = a0 !== 0.0 ? length ** 2 * Math.abs(a0) ** -1 * (a0 / Math.abs(a0)) : 0.0;
		const A1 = a1 !== 0.0 ? length ** 1.5 * Math.abs(a1) ** -0.5 * (a1 / Math.abs(a1)) : 0.0;

		const parentCurve = curveSegment.get("ParentCurve") as EntityInstance;
		expect(parentCurve.isA()).toBe("IfcClothoid");
		expect(parentCurve.get("ClothoidConstant") as number).toBeCloseTo(A1, 8);

		const expectedY = A0 !== 0.0 ? length ** 2 / A0 : 0.0;
		const placement = curveSegment.get("Placement") as EntityInstance;
		approxEqual((placement.get("Location") as EntityInstance).get("Coordinates") as number[], [0, expectedY, 0]);

		expect(curveSegment.get("SegmentStart")).toBe(0.0);
		expect(curveSegment.get("SegmentLength")).toBe(length);
	});

	test("HELMERTCURVE returns 2 IfcCurveSegments, each half the length", () => {
		const file = createTestFile("IFC4X3");
		const railHeadDistance = 1.5;
		const length = 40;
		const segment = cantSegment(file, "HELMERTCURVE", {
			startDistAlong: 0,
			horizontalLength: length,
			startCantLeft: 0.0,
			endCantLeft: 0.08,
			startCantRight: 0.0,
			endCantRight: 0.08,
		});

		const [curveSegment1, curveSegment2] = _mapAlignmentCantSegment(file, segment, railHeadDistance);
		expect(curveSegment2).not.toBeNull();
		const seg2 = curveSegment2 as EntityInstance;

		expect(curveSegment1.get("SegmentStart")).toBe(0.0);
		expect(curveSegment1.get("SegmentLength")).toBe(length / 2);
		expect(seg2.get("SegmentStart")).toBe(length / 2);
		expect(seg2.get("SegmentLength")).toBe(length / 2);
		expect((curveSegment1.get("ParentCurve") as EntityInstance).isA()).toBe("IfcSecondOrderPolynomialSpiral");
		expect((seg2.get("ParentCurve") as EntityInstance).isA()).toBe("IfcSecondOrderPolynomialSpiral");
	});

	test("BLOSSCURVE builds an IfcThirdOrderPolynomialSpiral-based IfcCurveSegment", () => {
		const file = createTestFile("IFC4X3");
		const railHeadDistance = 1.5;
		const length = 25;
		const Dsl = 0.0;
		const Del = 0.05;
		const Dsr = 0.0;
		const Der = 0.05;
		const segment = cantSegment(file, "BLOSSCURVE", {
			startDistAlong: 5,
			horizontalLength: length,
			startCantLeft: Dsl,
			endCantLeft: Del,
			startCantRight: Dsr,
			endCantRight: Der,
		});

		const [curveSegment] = _mapAlignmentCantSegment(file, segment, railHeadDistance);

		const Ds = 0.5 * (Dsl + Dsr);
		const De = 0.5 * (Del + Der);
		const f = De - Ds;
		const a2 = 3.0 * f;
		const a3 = -2.0 * f;
		const A2 = a2 !== 0.0 ? length ** (4.0 / 3.0) * Math.abs(a2) ** (-1.0 / 3.0) * (a2 / Math.abs(a2)) : 0.0;
		const A3 = a3 !== 0.0 ? length ** (5.0 / 4.0) * Math.abs(a3) ** (-1.0 / 4.0) * (a3 / Math.abs(a3)) : 0.0;

		const parentCurve = curveSegment.get("ParentCurve") as EntityInstance;
		expect(parentCurve.isA()).toBe("IfcThirdOrderPolynomialSpiral");
		expect(parentCurve.get("CubicTerm") as number).toBeCloseTo(A3, 8);
		expect(parentCurve.get("QuadraticTerm") as number).toBeCloseTo(A2, 8);
		expect(parentCurve.get("LinearTerm")).toBeNull();
		expect(parentCurve.get("ConstantTerm")).toBeNull();

		const placement = curveSegment.get("Placement") as EntityInstance;
		approxEqual((placement.get("Location") as EntityInstance).get("Coordinates") as number[], [5, Ds, 0]);
	});

	test("COSINECURVE builds an IfcCosineSpiral-based IfcCurveSegment", () => {
		const file = createTestFile("IFC4X3");
		const railHeadDistance = 1.5;
		const length = 20;
		const Dsl = 0.0;
		const Del = 0.04;
		const Dsr = 0.0;
		const Der = 0.04;
		const segment = cantSegment(file, "COSINECURVE", {
			horizontalLength: length,
			startCantLeft: Dsl,
			endCantLeft: Del,
			startCantRight: Dsr,
			endCantRight: Der,
		});

		const [curveSegment] = _mapAlignmentCantSegment(file, segment, railHeadDistance);
		const parentCurve = curveSegment.get("ParentCurve") as EntityInstance;
		expect(parentCurve.isA()).toBe("IfcCosineSpiral");

		const Ds = 0.5 * (Dsl + Dsr);
		const De = 0.5 * (Del + Der);
		const f = De - Ds;
		const a1 = -0.5 * f;
		const A1 = a1 !== 0.0 ? length ** 2 * Math.abs(a1) ** -1 * (a1 / Math.abs(a1)) : 0.0;
		expect(parentCurve.get("CosineTerm") as number).toBeCloseTo(A1, 8);
	});

	test("SINECURVE builds an IfcSineSpiral-based IfcCurveSegment", () => {
		const file = createTestFile("IFC4X3");
		const railHeadDistance = 1.5;
		const length = 20;
		const Dsl = 0.0;
		const Del = 0.04;
		const Dsr = 0.0;
		const Der = 0.04;
		const segment = cantSegment(file, "SINECURVE", {
			horizontalLength: length,
			startCantLeft: Dsl,
			endCantLeft: Del,
			startCantRight: Dsr,
			endCantRight: Der,
		});

		const [curveSegment] = _mapAlignmentCantSegment(file, segment, railHeadDistance);
		const parentCurve = curveSegment.get("ParentCurve") as EntityInstance;
		expect(parentCurve.isA()).toBe("IfcSineSpiral");

		const Ds = 0.5 * (Dsl + Dsr);
		const De = 0.5 * (Del + Der);
		const f = De - Ds;
		const a2 = -(1.0 / (2.0 * Math.PI)) * f;
		const A2 = a2 !== 0.0 ? length ** 2 * Math.abs(a2) ** -1 * (a2 / Math.abs(a2)) : 0.0;
		expect(parentCurve.get("SineTerm") as number).toBeCloseTo(A2, 8);
	});

	test("VIENNESEBEND builds an IfcSeventhOrderPolynomialSpiral-based IfcCurveSegment", () => {
		const file = createTestFile("IFC4X3");
		const railHeadDistance = 1.5;
		const length = 35;
		const Dsl = 0.0;
		const Del = 0.07;
		const Dsr = 0.0;
		const Der = 0.07;
		const segment = cantSegment(file, "VIENNESEBEND", {
			horizontalLength: length,
			startCantLeft: Dsl,
			endCantLeft: Del,
			startCantRight: Dsr,
			endCantRight: Der,
		});

		const [curveSegment, second] = _mapAlignmentCantSegment(file, segment, railHeadDistance);
		expect(second).toBeNull();
		const parentCurve = curveSegment.get("ParentCurve") as EntityInstance;
		expect(parentCurve.isA()).toBe("IfcSeventhOrderPolynomialSpiral");

		const Ds = 0.5 * (Dsl + Dsr);
		const De = 0.5 * (Del + Der);
		const f = De - Ds;
		const a7 = -20.0 * f;
		const A7 = a7 !== 0.0 ? length ** (9.0 / 8.0) * Math.abs(a7) ** (-1.0 / 8.0) * (a7 / Math.abs(a7)) : 0.0;
		expect(parentCurve.get("SepticTerm") as number).toBeCloseTo(A7, 8);
	});
});
