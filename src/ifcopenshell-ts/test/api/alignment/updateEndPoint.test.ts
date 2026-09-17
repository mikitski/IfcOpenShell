// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `update_end_point.py` (confirmed by reading the
// whole real test directory) -- its own real callers
// (`create_representation`/`create_segment_representations`) are both out of this
// chunk's scope. Original test coverage written here, gated to IFC4X3.
//
// Fixtures build a REAL zero-length `IfcCurveSegment` directly (`SegmentStart`/
// `SegmentLength` set to a raw JS `0.0` at construction time, both `IfcCurveMeasureSelect`
// SELECT-typed attributes) rather than going through the blocked
// `api.alignment.addZeroLengthSegment` path -- see
// `../../../src/api/alignment/updateEndPoint.ts`'s own header comment for the
// empirically-confirmed technique this reuses from chunk 2
// (`getAlignmentStartStation.test.ts`/`distanceAlongFromStation.test.ts`).

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

	test("throws a disclosed error when the curve has no zero-length segment yet (addZeroLengthSegment not ported)", () => {
		const file = createTestFile("IFC4X3");
		const curve = file.createEntity("IfcGradientCurve", [], null, dummyBaseCurve(file), null);

		expect(() => updateEndPoint(file, curve)).toThrow(/addZeroLengthSegment/);
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
