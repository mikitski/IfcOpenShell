// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `update_end_point.py` (confirmed by reading the
// whole real test directory) -- its own real callers
// (`create_representation`/`create_segment_representations`) are both out of this
// chunk's scope. Original test coverage written here, gated to IFC4X3.
//
// Fixtures for a `curve` that ALREADY has a zero-length segment build a REAL
// zero-length `IfcCurveSegment` directly (`SegmentStart`/`SegmentLength` set to a raw
// JS `0.0` at construction time, both `IfcCurveMeasureSelect` SELECT-typed attributes)
// rather than going through `api.alignment.addZeroLengthSegment` -- see
// `../../../src/api/alignment/updateEndPoint.ts`'s own header comment for the
// empirically-confirmed technique this reuses from chunk 2
// (`getAlignmentStartStation.test.ts`/`distanceAlongFromStation.test.ts`).
//
// UPDATE (chunk 7): `updateEndPoint`'s own previously-disclosed blocker
// (`addZeroLengthSegment` not ported) is now RESOLVED -- see `updateEndPoint.ts`'s own
// header comment. A `curve` with an EMPTY `Segments` list now succeeds end to end (the
// real `addZeroLengthSegment` auto-adds a zero-length segment placed at the origin),
// while a `curve` with a real, non-zero-length segment but no zero-length one yet still
// throws -- now via `addZeroLengthSegment`'s own disclosed error message (bubbled up
// transparently), not `updateEndPoint`'s own former bespoke one.

import { describe, expect, test } from "vitest";
import { updateEndPoint } from "../../../src/api/alignment/updateEndPoint";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function approxEqual(actual: readonly number[], expected: readonly number[]): void {
	expect(actual.length).toBe(expected.length);
	for (let i = 0; i < expected.length; i++) {
		expect(actual[i]).toBeCloseTo(expected[i], 10);
	}
}

/** A dummy `IfcLine` (a valid `IfcCurve`), standing in for a real `IfcCurveSegment
 * .ParentCurve` this function never inspects the content of. */
function dummyParentCurve(file: IfcFile): EntityInstance {
	return file.createEntity(
		"IfcLine",
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0),
	);
}

/** A zero-length `IfcCurveSegment` with a 2D `IfcAxis2Placement2D` placement at
 * `origin`/`refDirection` (see this file's own header comment for the raw-SELECT-value
 * construction technique). */
function zeroLengthSegment2d(
	file: IfcFile,
	origin: readonly [number, number],
	refDirection: readonly [number, number] = [1.0, 0.0],
): EntityInstance {
	const placement = file.createEntity(
		"IfcAxis2Placement2D",
		file.createEntity("IfcCartesianPoint", [...origin]),
		file.createEntity("IfcDirection", [...refDirection]),
	);
	return file.createEntity("IfcCurveSegment", "DISCONTINUOUS", placement, 0.0, 0.0, dummyParentCurve(file));
}

/** A zero-length `IfcCurveSegment` with a 3D `IfcAxis2Placement3D` placement at
 * `origin` (default axis/refDirection). */
function zeroLengthSegment3d(file: IfcFile, origin: readonly [number, number, number]): EntityInstance {
	const placement = file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [...origin]));
	return file.createEntity("IfcCurveSegment", "DISCONTINUOUS", placement, 0.0, 0.0, dummyParentCurve(file));
}

function dummyBaseCurve(file: IfcFile): EntityInstance {
	return file.createEntity("IfcPolyline", [
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		file.createEntity("IfcCartesianPoint", [1.0, 0.0]),
	]);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.updateEndPoint (IFC4X3)", () => {
	test("throws TypeError for an unexpected entity type, matching real Python's own (unmatched-quote) message", () => {
		const file = createTestFile("IFC4X3");
		const polyline = dummyBaseCurve(file);

		expect(() => updateEndPoint(file, polyline)).toThrow(
			new TypeError(
				"Expected entity type to be one of ['IfcGradientCurve', 'IfcSegmentedReferenceCurve'], instead received 'IfcPolyline",
			),
		);
	});

	test("IfcGradientCurve: an empty curve auto-adds a real zero-length segment (via the newly-wired addZeroLengthSegment) and computes EndPoint at the origin", () => {
		const file = createTestFile("IFC4X3");
		const curve = file.createEntity("IfcGradientCurve", [], null, dummyBaseCurve(file), null);

		expect(curve.get("Segments")).toEqual([]);

		updateEndPoint(file, curve);

		const segments = curve.get("Segments") as EntityInstance[];
		expect(segments.length).toBe(1);
		expect(segments[0].isA()).toBe("IfcCurveSegment");

		const endPoint = curve.get("EndPoint") as EntityInstance;
		expect(endPoint).not.toBeNull();
		expect(endPoint.isA()).toBe("IfcAxis2Placement2D");
		// The zero-length segment `addZeroLengthSegment` builds for a fresh, empty
		// composite-curve-family layout is always placed at the 2D origin, facing +X
		// (no earlier real segment to derive a position from).
		approxEqual((endPoint.get("Location") as EntityInstance).get("Coordinates") as number[], [0, 0]);
		approxEqual((endPoint.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[], [1, 0]);
	});

	test("throws a disclosed error (from addZeroLengthSegment) when the curve already has a real, non-zero-length segment but no zero-length one yet", () => {
		const file = createTestFile("IFC4X3");
		const placement = file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		);
		const nonZeroSegment = file.createEntity(
			"IfcCurveSegment",
			"DISCONTINUOUS",
			placement,
			0.0,
			5.0,
			dummyParentCurve(file),
		);
		const curve = file.createEntity("IfcGradientCurve", [nonZeroSegment], null, dummyBaseCurve(file), null);

		expect(() => updateEndPoint(file, curve)).toThrow(/_getSegmentEndpoint/);
	});

	test("IfcGradientCurve: creates a fresh EndPoint when missing, and computes the correct 2D position", () => {
		const file = createTestFile("IFC4X3");
		const zeroLength = zeroLengthSegment2d(file, [1, 2], [0, 1]);
		const curve = file.createEntity("IfcGradientCurve", [zeroLength], null, dummyBaseCurve(file), null);

		expect(curve.get("EndPoint")).toBeNull();

		updateEndPoint(file, curve);

		const endPoint = curve.get("EndPoint") as EntityInstance;
		expect(endPoint).not.toBeNull();
		expect(endPoint.isA()).toBe("IfcAxis2Placement2D");
		approxEqual((endPoint.get("Location") as EntityInstance).get("Coordinates") as number[], [1, 2]);
		approxEqual((endPoint.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[], [0, 1]);
	});

	test("IfcGradientCurve: reuses an existing EndPoint/RefDirection, only updating values", () => {
		const file = createTestFile("IFC4X3");
		const zeroLength = zeroLengthSegment2d(file, [3, 4]);
		const curve = file.createEntity("IfcGradientCurve", [zeroLength], null, dummyBaseCurve(file), null);

		const existingRefDirection = file.createEntity("IfcDirection", [0.0, 1.0]);
		const existingEndPoint = file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			existingRefDirection,
		);
		curve.set("EndPoint", existingEndPoint);

		updateEndPoint(file, curve);

		const endPoint = curve.get("EndPoint") as EntityInstance;
		expect(endPoint.equals(existingEndPoint)).toBe(true);
		expect((endPoint.get("RefDirection") as EntityInstance).equals(existingRefDirection)).toBe(true);
		approxEqual((endPoint.get("Location") as EntityInstance).get("Coordinates") as number[], [3, 4]);
		approxEqual((endPoint.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[], [1, 0]);
	});

	test("IfcSegmentedReferenceCurve: creates a fresh EndPoint when missing, and computes the correct 3D position", () => {
		const file = createTestFile("IFC4X3");
		const zeroLength = zeroLengthSegment3d(file, [1, 2, 3]);
		const baseCurve = dummyBaseCurve(file);
		const curve = file.createEntity("IfcSegmentedReferenceCurve", [zeroLength], null, baseCurve, null);

		updateEndPoint(file, curve);

		const endPoint = curve.get("EndPoint") as EntityInstance;
		expect(endPoint).not.toBeNull();
		expect(endPoint.isA()).toBe("IfcAxis2Placement3D");
		approxEqual((endPoint.get("Location") as EntityInstance).get("Coordinates") as number[], [1, 2, 3]);
		approxEqual((endPoint.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[], [1, 0, 0]);
		approxEqual((endPoint.get("Axis") as EntityInstance).get("DirectionRatios") as number[], [0, 0, 1]);
	});
});
