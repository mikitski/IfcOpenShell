// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `_map_alignment_vertical_segment.py`
// (confirmed by reading the whole real test directory) -- its own real callers
// (`create_segment_representations` et al.) are out of this chunk's scope. Original
// test coverage written here, gated to IFC4X3.
//
// Expected numeric values below are computed independently in this file, following
// the real Python source's own formulas line-by-line (not by calling back into the
// module under test) -- a genuine cross-check of transcription fidelity between the
// real Python source and this TS port, not a tautological re-assertion of the port's
// own arithmetic.

import { describe, expect, test } from "vitest";
import { _mapAlignmentVerticalSegment } from "../../../src/api/alignment/_mapAlignmentVerticalSegment";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function approxEqual(actual: readonly number[], expected: readonly number[], precision = 10): void {
	expect(actual.length).toBe(expected.length);
	for (let i = 0; i < expected.length; i++) {
		expect(actual[i]).toBeCloseTo(expected[i], precision);
	}
}

function verticalSegment(
	file: IfcFile,
	predefinedType: string,
	fields: {
		startDistAlong?: number;
		horizontalLength?: number;
		startHeight?: number;
		startGradient?: number;
		endGradient?: number;
	},
): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentVerticalSegment",
		null,
		null,
		fields.startDistAlong ?? 0.0,
		fields.horizontalLength ?? 0.0,
		fields.startHeight ?? 0.0,
		fields.startGradient ?? 0.0,
		fields.endGradient ?? 0.0,
		null,
		predefinedType,
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._mapAlignmentVerticalSegment (IFC4X3)", () => {
	test("throws TypeError for a non-IfcAlignmentSegment argument", () => {
		const file = createTestFile("IFC4X3");
		const notASegment = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);

		expect(() => _mapAlignmentVerticalSegment(file, notASegment)).toThrow(
			new TypeError("Expected to see type 'IfcAlignmentSegment', instead received 'IfcCartesianPoint'."),
		);
	});

	// NOT tested: the dispatcher's own final "else: throw TypeError" branch. Empirically
	// verified (against this chunk's own freshly-built native addon) that real
	// `IfcAlignmentVerticalSegmentTypeEnum`'s ONLY 4 valid schema keywords are exactly
	// `CONSTANTGRADIENT`/`PARABOLICARC`/`CIRCULARARC`/`CLOTHOID` -- the 4 branches this
	// dispatcher already handles -- so no schema-valid `IfcAlignmentVerticalSegment`
	// can ever reach that branch; any other string is rejected by the native EXPRESS
	// enum-keyword check at `file.createEntity(...)` time, before this function is
	// even called. A genuinely dead branch, matching `getMappedSegments.ts`'s own
	// already-disclosed `_getCurveSegmentCount` "unreachable in practice" precedent
	// (chunk 2) -- not attempted here via a fake/duck-typed object, since this
	// project has no established mocking convention for this module.

	test("CLOTHOID throws, matching real Python's own NotImplementedError", () => {
		const file = createTestFile("IFC4X3");
		const segment = verticalSegment(file, "CLOTHOID", {});

		expect(() => _mapAlignmentVerticalSegment(file, segment)).toThrow(
			"mapping for IfcVerticalSegment.CLOTHOID not implemented",
		);
	});

	test("CONSTANTGRADIENT builds an IfcLine-based IfcCurveSegment", () => {
		const file = createTestFile("IFC4X3");
		const segment = verticalSegment(file, "CONSTANTGRADIENT", {
			startDistAlong: 10,
			horizontalLength: 100,
			startHeight: 5,
			startGradient: 1.0,
		});

		const [curveSegment, second] = _mapAlignmentVerticalSegment(file, segment);
		expect(second).toBeNull();
		expect(curveSegment.isA()).toBe("IfcCurveSegment");
		expect(curveSegment.get("Transition")).toBe("DISCONTINUOUS");

		// Real Python: dx = cos(atan(start_gradient)), dy = sin(atan(start_gradient)).
		const dx = Math.SQRT1_2;
		const dy = Math.SQRT1_2;
		const expectedLength = 100 / dx;

		const placement = curveSegment.get("Placement") as EntityInstance;
		expect(placement.isA()).toBe("IfcAxis2Placement2D");
		approxEqual((placement.get("Location") as EntityInstance).get("Coordinates") as number[], [10, 5]);
		approxEqual((placement.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[], [dx, dy]);

		expect(curveSegment.get("SegmentStart")).toBe(0.0);
		expect(curveSegment.get("SegmentLength") as number).toBeCloseTo(expectedLength, 10);

		const parentCurve = curveSegment.get("ParentCurve") as EntityInstance;
		expect(parentCurve.isA()).toBe("IfcLine");
		expect((parentCurve.get("Pnt") as EntityInstance).get("Coordinates")).toEqual([0.0, 0.0]);
		const dir = parentCurve.get("Dir") as EntityInstance;
		expect(dir.get("Magnitude")).toBe(1.0);
		expect((dir.get("Orientation") as EntityInstance).get("DirectionRatios")).toEqual([1.0, 0.0]);
	});

	test("PARABOLICARC builds an IfcPolynomialCurve-based IfcCurveSegment with the closed-form length", () => {
		const file = createTestFile("IFC4X3");
		const segment = verticalSegment(file, "PARABOLICARC", {
			startDistAlong: 0,
			horizontalLength: 200,
			startHeight: 10,
			startGradient: 0.0,
			endGradient: 0.04,
		});

		const [curveSegment, second] = _mapAlignmentVerticalSegment(file, segment);
		expect(second).toBeNull();

		const A = 10;
		const B = 0.0;
		const C = (0.04 - 0.0) / (2.0 * 200);

		const parentCurve = curveSegment.get("ParentCurve") as EntityInstance;
		expect(parentCurve.isA()).toBe("IfcPolynomialCurve");
		expect(parentCurve.get("CoefficientsX")).toEqual([0.0, 1.0]);
		approxEqual(parentCurve.get("CoefficientsY") as number[], [A, B, C]);

		// Independent numeric-integration cross-check of the closed-form
		// `_polynomial_length`: arc length = integral of sqrt(1 + y'^2) dx over [0, L],
		// y' = B + 2*C*x, using a fine composite Simpson's rule (a DIFFERENT numeric
		// method than the closed-form antiderivative the source itself evaluates).
		const L = 200;
		const n = 20000; // even, for Simpson's rule
		const h = L / n;
		const integrand = (x: number) => Math.sqrt(1 + (B + 2 * C * x) ** 2);
		let sum = integrand(0) + integrand(L);
		for (let i = 1; i < n; i++) {
			sum += (i % 2 === 0 ? 2 : 4) * integrand(i * h);
		}
		const numericLength = (h / 3) * sum;

		expect(curveSegment.get("SegmentStart")).toBe(0.0);
		expect(curveSegment.get("SegmentLength") as number).toBeCloseTo(numericLength, 4);
	});

	test("CIRCULARARC (ascending gradient) builds an IfcCircle-based IfcCurveSegment", () => {
		const file = createTestFile("IFC4X3");
		const segment = verticalSegment(file, "CIRCULARARC", {
			startDistAlong: 0,
			horizontalLength: 100,
			startHeight: 0,
			startGradient: 0.0,
			endGradient: 1.0,
		});

		const [curveSegment] = _mapAlignmentVerticalSegment(file, segment);

		const startAngle = Math.atan(0.0);
		const endAngle = Math.atan(1.0);
		// startAngle < endAngle branch.
		const radius = 100 / (Math.sin(endAngle) - Math.sin(startAngle));
		const x = -radius * Math.sin(startAngle);
		const y = radius * Math.cos(startAngle);
		const adjustedStart = startAngle + (3.0 * Math.PI) / 2.0;
		const adjustedEnd = endAngle + (3.0 * Math.PI) / 2.0;

		const parentCurve = curveSegment.get("ParentCurve") as EntityInstance;
		expect(parentCurve.isA()).toBe("IfcCircle");
		expect(parentCurve.get("Radius") as number).toBeCloseTo(radius, 8);
		const position = parentCurve.get("Position") as EntityInstance;
		approxEqual((position.get("Location") as EntityInstance).get("Coordinates") as number[], [x, y]);

		expect(curveSegment.get("SegmentStart") as number).toBeCloseTo(radius * adjustedStart, 6);
		expect(curveSegment.get("SegmentLength") as number).toBeCloseTo(radius * (adjustedEnd - adjustedStart), 6);
	});
});
