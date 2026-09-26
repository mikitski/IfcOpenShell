// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `_add_segment_to_curve.py` (confirmed by
// reading the whole real test directory) -- its own real callers
// (`_add_segment_to_layout`/`create_representation`) are either landed later in this
// same chunk (and themselves unconditionally blocked) or out of scope entirely.
// Original test coverage written here, gated to IFC4X3.
//
// The 3 orchestration tests below pin this file's own genuinely nuanced finding (see
// `_addSegmentToCurve.ts`'s own header comment): WHICH of 2 disclosed blockers throws
// first depends on `curve`'s current shape, but the real `IfcCompositeCurve.Segments`
// mutation always happens first, for real, in every case.

import { describe, expect, test } from "vitest";
import { _addSegmentToCurve } from "../../../src/api/alignment/_addSegmentToCurve";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function dummyParentCurve(file: IfcFile): EntityInstance {
	return file.createEntity(
		"IfcLine",
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0),
	);
}

function curveSegment2d(
	file: IfcFile,
	segmentLength: number,
	origin: readonly [number, number] = [0, 0],
): EntityInstance {
	const placement = file.createEntity(
		"IfcAxis2Placement2D",
		file.createEntity("IfcCartesianPoint", [...origin]),
		file.createEntity("IfcDirection", [1.0, 0.0]),
	);
	return file.createEntity("IfcCurveSegment", "DISCONTINUOUS", placement, 0.0, segmentLength, dummyParentCurve(file));
}

function horizontalLayoutSegment(file: IfcFile): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentHorizontalSegment",
		null,
		null,
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		0.0,
		0.0,
		0.0,
		10.0,
		null,
		"LINE",
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._addSegmentToCurve (IFC4X3)", () => {
	test("throws TypeError for an unexpected layoutSegment entity type, matching real Python's own (unmatched-quote) message", () => {
		const file = createTestFile("IFC4X3");
		const notASegment = file.createEntity("IfcAlignmentHorizontal", guid.new());
		const curve = file.createEntity("IfcCompositeCurve");

		expect(() => _addSegmentToCurve(file, notASegment, curve)).toThrow(
			new TypeError(
				"Expected entity type to be one of ['IfcAlignmentSegment'], instead received 'IfcAlignmentHorizontal",
			),
		);
	});

	test("throws TypeError when curve doesn't match the shape expected for a horizontal DesignParameters", () => {
		const file = createTestFile("IFC4X3");
		const layoutSegment = horizontalLayoutSegment(file);
		// NOT an `IfcCompositeCurve` subtype at all (unlike `IfcGradientCurve`/
		// `IfcSegmentedReferenceCurve`, both confirmed real subtypes -- see this file's
		// own header comment) -- a genuinely wrong curve type for this check.
		const wrongCurve = file.createEntity("IfcPolyline", [
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcCartesianPoint", [1.0, 0.0]),
		]);

		expect(() => _addSegmentToCurve(file, layoutSegment, wrongCurve)).toThrow(
			new TypeError("Expected to see IfcCompositeCurve, instead received 'IfcPolyline'."),
		);
	});

	test("case 1 (first segment, empty curve): mutates Segments for real, then throws the unconditional _getSegmentEndpoint gap", () => {
		const file = createTestFile("IFC4X3");
		const layoutSegment = horizontalLayoutSegment(file);
		const curve = file.createEntity("IfcCompositeCurve");

		expect(curve.get("Segments")).toBeNull();

		expect(() => _addSegmentToCurve(file, layoutSegment, curve)).toThrow(/_getSegmentEndpoint/);

		const segments = curve.get("Segments") as EntityInstance[];
		expect(segments.length).toBe(1);
		expect(segments[0].isA()).toBe("IfcCurveSegment");
		expect(segments[0].get("Transition")).toBe("DISCONTINUOUS");
	});

	test("case 2 (not first, no zero-length segment yet -- a real prevSegment): mutates Segments for real, then throws EARLIER at the getCurveSegmentTransitionCode gap", () => {
		const file = createTestFile("IFC4X3");
		const existingSegment = curveSegment2d(file, 5.0);
		const curve = file.createEntity("IfcCompositeCurve");
		curve.set("Segments", [existingSegment]);

		const layoutSegment = horizontalLayoutSegment(file);

		expect(() => _addSegmentToCurve(file, layoutSegment, curve)).toThrow(/getCurveSegmentTransitionCode/);

		const segments = curve.get("Segments") as EntityInstance[];
		expect(segments.length).toBe(2);
		expect(segments[0].equals(existingSegment)).toBe(true);
		expect(segments[1].isA()).toBe("IfcCurveSegment");
	});

	test("case 3 (not first, curve holds ONLY a zero-length segment -- no real prevSegment): mutates Segments for real, then throws at the SAME _getSegmentEndpoint gap as case 1", () => {
		const file = createTestFile("IFC4X3");
		const zeroLength = curveSegment2d(file, 0.0);
		const curve = file.createEntity("IfcCompositeCurve");
		curve.set("Segments", [zeroLength]);

		const layoutSegment = horizontalLayoutSegment(file);

		expect(() => _addSegmentToCurve(file, layoutSegment, curve)).toThrow(/_getSegmentEndpoint/);

		const segments = curve.get("Segments") as EntityInstance[];
		expect(segments.length).toBe(2);
		expect(segments[0].isA()).toBe("IfcCurveSegment");
		expect(segments[1].equals(zeroLength)).toBe(true);
	});

	test("real Python's own unguarded Nests[0] access for cant segments: a not-nested segment crashes, matching real Python's IndexError-shaped access", () => {
		const file = createTestFile("IFC4X3");
		const designParameters = file.createEntity(
			"IfcAlignmentCantSegment",
			null,
			null,
			0.0,
			100.0,
			0.0,
			null,
			0.0,
			null,
			"CONSTANTCANT",
		);
		const layoutSegment = file.createEntity(
			"IfcAlignmentSegment",
			guid.new(),
			null,
			null,
			null,
			null,
			null,
			null,
			designParameters,
		);
		const baseCurve = file.createEntity("IfcPolyline", [
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcCartesianPoint", [1.0, 0.0]),
		]);
		const curve = file.createEntity("IfcSegmentedReferenceCurve", [], null, baseCurve, null);

		expect(() => _addSegmentToCurve(file, layoutSegment, curve)).toThrow();
	});
});
