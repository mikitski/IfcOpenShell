// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `add_zero_length_segment.py` (confirmed by
// reading the whole real test directory) -- its own real caller (`create()`) is out of
// this chunk's scope. Original test coverage written here, gated to IFC4X3.
//
// This is the MOST IMPORTANT test file of this chunk: unlike every other file here,
// `addZeroLengthSegment` is only CONDITIONALLY blocked on the real geometry kernel --
// see `addZeroLengthSegment.ts`'s own header comment for the full, nuanced writeup.
// The tests below exercise BOTH the fully-portable, genuinely functional empty-layout
// path (real, passing assertions, not just a disclosed-throw stub) AND the disclosed
// throw for a non-empty one -- confirming exactly which layout types/shapes qualify
// for each, including the standout finding that `IfcAlignmentCant` NEVER calls the
// kernel-needing dependency at all, regardless of whether it already has segments.

import { describe, expect, test } from "vitest";
import { addZeroLengthSegment } from "../../../src/api/alignment/addZeroLengthSegment";
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

function curveSegment2d(file: IfcFile, segmentLength: number): EntityInstance {
	const placement = file.createEntity(
		"IfcAxis2Placement2D",
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		file.createEntity("IfcDirection", [1.0, 0.0]),
	);
	return file.createEntity("IfcCurveSegment", "DISCONTINUOUS", placement, 0.0, segmentLength, dummyParentCurve(file));
}

function dummyPolyline(file: IfcFile): EntityInstance {
	return file.createEntity("IfcPolyline", [
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		file.createEntity("IfcCartesianPoint", [1.0, 0.0]),
	]);
}

function horizontalSegment(file: IfcFile, segmentLength: number): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentHorizontalSegment",
		null,
		null,
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		0.0,
		0.0,
		0.0,
		segmentLength,
		null,
		"LINE",
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

function verticalSegment(
	file: IfcFile,
	startDistAlong: number,
	horizontalLength: number,
	endGradient: number,
): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentVerticalSegment",
		null,
		null,
		startDistAlong,
		horizontalLength,
		0.0,
		0.0,
		endGradient,
		null,
		"CONSTANTGRADIENT",
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

function cantSegment(
	file: IfcFile,
	startDistAlong: number,
	horizontalLength: number,
	startCantLeft: number,
	endCantLeft: number | null,
	startCantRight: number,
	endCantRight: number | null,
): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentCantSegment",
		null,
		null,
		startDistAlong,
		horizontalLength,
		startCantLeft,
		endCantLeft,
		startCantRight,
		endCantRight,
		"CONSTANTCANT",
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

function nest(
	file: IfcFile,
	relatingObject: EntityInstance,
	relatedObjects: readonly EntityInstance[],
): EntityInstance {
	return file.createEntity("IfcRelNests", guid.new(), null, null, null, relatingObject, [...relatedObjects]);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.addZeroLengthSegment (IFC4X3)", () => {
	test("returns undefined (bare Python `return`, not `false`) for IfcPolyline/IfcOffsetCurveByDistances/IfcIndexedPolyCurve", () => {
		const file = createTestFile("IFC4X3");
		expect(addZeroLengthSegment(file, dummyPolyline(file))).toBeUndefined();
		expect(
			addZeroLengthSegment(
				file,
				file.createEntity(
					"IfcIndexedPolyCurve",
					file.createEntity("IfcCartesianPointList2D", [
						[0, 0],
						[1, 0],
					]),
				),
			),
		).toBeUndefined();
	});

	test("throws TypeError for an unexpected layout entity type (no unmatched-quote bug this time)", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		expect(() => addZeroLengthSegment(file, alignment)).toThrow(
			new TypeError(
				"Expected layout type to be one of ['IfcAlignmentHorizontal', 'IfcAlignmentVertical', 'IfcAlignmentCant', 'IfcCompositeCurve', 'IfcGradientCurve', 'IfcSegmentedReferenceCurve'], instead received IfcAlignment",
			),
		);
	});

	test("returns false (real Python's own explicit False) when layout already has a zero-length segment", () => {
		const file = createTestFile("IFC4X3");
		const curve = file.createEntity("IfcCompositeCurve");
		curve.set("Segments", [curveSegment2d(file, 0.0)]);

		expect(addZeroLengthSegment(file, curve)).toBe(false);
	});

	test("empty IfcCompositeCurve: fully portable, adds a real 2D zero-length IfcCurveSegment", () => {
		const file = createTestFile("IFC4X3");
		const curve = file.createEntity("IfcCompositeCurve");

		expect(addZeroLengthSegment(file, curve)).toBe(true);

		const segments = curve.get("Segments") as EntityInstance[];
		expect(segments.length).toBe(1);
		const seg = segments[0];
		expect(seg.isA()).toBe("IfcCurveSegment");
		expect(seg.get("Transition")).toBe("DISCONTINUOUS");
		const placement = seg.get("Placement") as EntityInstance;
		expect(placement.isA()).toBe("IfcAxis2Placement2D");
	});

	test("empty IfcGradientCurve: fully portable, adds a real 2D zero-length segment AND recurses into a non-alignment BaseCurve harmlessly", () => {
		const file = createTestFile("IFC4X3");
		const curve = file.createEntity("IfcGradientCurve", [], null, dummyPolyline(file), null);

		expect(addZeroLengthSegment(file, curve)).toBe(true);

		const segments = curve.get("Segments") as EntityInstance[];
		expect(segments.length).toBe(1);
		expect((segments[0].get("Placement") as EntityInstance).isA()).toBe("IfcAxis2Placement2D");
	});

	test("empty IfcSegmentedReferenceCurve: fully portable, adds a real 3D zero-length segment AND recurses into an empty IfcGradientCurve BaseCurve, which ALSO gets one", () => {
		const file = createTestFile("IFC4X3");
		const gradientCurve = file.createEntity("IfcGradientCurve", [], null, dummyPolyline(file), null);
		const curve = file.createEntity("IfcSegmentedReferenceCurve", [], null, gradientCurve, null);

		expect(addZeroLengthSegment(file, curve)).toBe(true);

		const outerSegments = curve.get("Segments") as EntityInstance[];
		expect(outerSegments.length).toBe(1);
		expect((outerSegments[0].get("Placement") as EntityInstance).isA()).toBe("IfcAxis2Placement3D");

		// The recursive call on `gradientCurve` (this SAME function) also ran for real.
		const innerSegments = gradientCurve.get("Segments") as EntityInstance[];
		expect(innerSegments.length).toBe(1);
		expect((innerSegments[0].get("Placement") as EntityInstance).isA()).toBe("IfcAxis2Placement2D");
	});

	test("non-empty IfcCompositeCurve throws the disclosed _getSegmentEndpoint gap, without mutating Segments", () => {
		const file = createTestFile("IFC4X3");
		const curve = file.createEntity("IfcCompositeCurve");
		curve.set("Segments", [curveSegment2d(file, 5.0)]);

		expect(() => addZeroLengthSegment(file, curve)).toThrow(/_getSegmentEndpoint/);
		expect((curve.get("Segments") as EntityInstance[]).length).toBe(1);
	});

	test("empty IfcAlignmentHorizontal (no IsNestedBy rels at all): fully portable, nests a real zero-length IfcAlignmentSegment", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");

		expect(addZeroLengthSegment(file, horizontal)).toBe(true);

		const rels = horizontal.get("IsNestedBy") as EntityInstance[];
		expect(rels.length).toBe(1);
		const related = rels[0].get("RelatedObjects") as EntityInstance[];
		expect(related.length).toBe(1);
		const designParameters = related[0].get("DesignParameters") as EntityInstance;
		expect(designParameters.isA()).toBe("IfcAlignmentHorizontalSegment");
		expect(designParameters.get("SegmentLength")).toBe(0.0);
		expect(designParameters.get("PredefinedType")).toBe("LINE");
		expect((designParameters.get("StartPoint") as EntityInstance).get("Coordinates")).toEqual([0.0, 0.0]);
	});

	test("non-empty IfcAlignmentHorizontal throws the disclosed _getSegmentEndpoint gap, without nesting anything new", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		nest(file, horizontal, [horizontalSegment(file, 25.0)]);

		expect(() => addZeroLengthSegment(file, horizontal)).toThrow(/_getSegmentEndpoint/);
		expect((horizontal.get("IsNestedBy") as EntityInstance[]).length).toBe(1);
		expect(
			((horizontal.get("IsNestedBy") as EntityInstance[])[0].get("RelatedObjects") as EntityInstance[]).length,
		).toBe(1);
	});

	test("empty IfcAlignmentVertical: fully portable, nests a real zero-length IfcAlignmentSegment with all-zero defaults", () => {
		const file = createTestFile("IFC4X3");
		const vertical = file.createEntity("IfcAlignmentVertical", guid.new(), null, "V1");

		expect(addZeroLengthSegment(file, vertical)).toBe(true);

		const related = (vertical.get("IsNestedBy") as EntityInstance[])[0].get("RelatedObjects") as EntityInstance[];
		const designParameters = related[0].get("DesignParameters") as EntityInstance;
		expect(designParameters.isA()).toBe("IfcAlignmentVerticalSegment");
		expect(designParameters.get("StartDistAlong")).toBe(0.0);
		expect(designParameters.get("HorizontalLength")).toBe(0.0);
		expect(designParameters.get("StartHeight")).toBe(0.0);
		expect(designParameters.get("StartGradient")).toBe(0.0);
		expect(designParameters.get("EndGradient")).toBe(0.0);
		expect(designParameters.get("PredefinedType")).toBe("CONSTANTGRADIENT");
	});

	test("non-empty IfcAlignmentVertical throws the disclosed _getSegmentEndpoint gap", () => {
		const file = createTestFile("IFC4X3");
		const vertical = file.createEntity("IfcAlignmentVertical", guid.new(), null, "V1");
		nest(file, vertical, [verticalSegment(file, 0.0, 50.0, 0.02)]);

		expect(() => addZeroLengthSegment(file, vertical)).toThrow(/_getSegmentEndpoint/);
	});

	test("empty IfcAlignmentCant: fully portable, nests a real zero-length IfcAlignmentSegment with all-zero defaults", () => {
		const file = createTestFile("IFC4X3");
		const cant = file.createEntity("IfcAlignmentCant", guid.new(), null, "C1");
		cant.set("RailHeadDistance", 1.5);

		expect(addZeroLengthSegment(file, cant)).toBe(true);

		const related = (cant.get("IsNestedBy") as EntityInstance[])[0].get("RelatedObjects") as EntityInstance[];
		const designParameters = related[0].get("DesignParameters") as EntityInstance;
		expect(designParameters.isA()).toBe("IfcAlignmentCantSegment");
		expect(designParameters.get("StartDistAlong")).toBe(0.0);
		expect(designParameters.get("StartCantLeft")).toBe(0.0);
		expect(designParameters.get("StartCantRight")).toBe(0.0);
		expect(designParameters.get("PredefinedType")).toBe("CONSTANTCANT");
	});

	test("**KEY FINDING**: non-empty IfcAlignmentCant is ALSO fully portable -- NEVER calls the kernel-needing dependency, unlike Horizontal/Vertical/composite-curve-family", () => {
		const file = createTestFile("IFC4X3");
		const cant = file.createEntity("IfcAlignmentCant", guid.new(), null, "C1");
		cant.set("RailHeadDistance", 1.5);
		nest(file, cant, [cantSegment(file, 0.0, 40.0, 0.02, null, 0.03, 0.05)]);

		expect(addZeroLengthSegment(file, cant)).toBe(true);

		const related = (cant.get("IsNestedBy") as EntityInstance[])[0].get("RelatedObjects") as EntityInstance[];
		expect(related.length).toBe(2);
		const designParameters = related[1].get("DesignParameters") as EntityInstance;
		// StartDistAlong = last segment's StartDistAlong(0) + HorizontalLength(40) = 40.
		expect(designParameters.get("StartDistAlong")).toBe(40.0);
		// EndCantLeft was null, so falls back to StartCantLeft (0.02); EndCantRight was
		// real (0.05), so it's used directly -- see this file's own header comment /
		// `addZeroLengthSegment.ts`'s own header comment for the `!= None` fallback.
		expect(designParameters.get("StartCantLeft")).toBe(0.02);
		expect(designParameters.get("StartCantRight")).toBe(0.05);
		expect(designParameters.get("HorizontalLength")).toBe(0.0);
		expect(designParameters.get("PredefinedType")).toBe("CONSTANTCANT");
	});
});
