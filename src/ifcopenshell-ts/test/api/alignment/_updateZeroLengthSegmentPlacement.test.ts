// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `_update_zero_length_segment_placement.py`
// (confirmed by reading the whole real test directory) -- its only real caller,
// `_add_segment_to_curve`, is itself still blocked on the unported, geometry-kernel-
// needing `_get_segment_endpoint` (see `../../../src/api/alignment/
// _updateZeroLengthSegmentPlacement.ts`'s own header comment), so this function is
// unreachable end to end from any currently-ported public entry point -- matching
// chunk 3's own `updateFallbackPosition.test.ts`/`updateEndPoint.test.ts` precedent
// of testing a not-yet-reachable function directly with hand-built fixtures. Original
// test coverage written here, gated to IFC4X3 (this whole module's own established
// schema-availability convention).
//
// `placement`'s `MatrixType` values below are plain 16-number array literals (gl-
// matrix's own `mat4` type accepts a plain tuple, not only its own typed-array
// factories -- confirmed against `node_modules/gl-matrix/index.d.ts`), laid out
// column-major per this file's own header comment's index derivation: indices 0-2 are
// the "Rd" column, 8-10 the "Ad" column, 12-14 the translation.

import { describe, expect, test } from "vitest";
import { _updateZeroLengthSegmentPlacement } from "../../../src/api/alignment/_updateZeroLengthSegmentPlacement";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import type { MatrixType } from "../../../src/util/placement";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Builds a `MatrixType` with the given "Rd" (x-axis, flat indices 0-2), "Ad" (z-axis,
 * flat indices 8-10) and translation (flat indices 12-14) columns; the unused y-axis
 * column (4-7) and homogeneous row (3/7/11/15) are filled with placeholder/identity
 * values this function never reads. */
function buildPlacement(
	rd: readonly [number, number, number],
	ad: readonly [number, number, number],
	translation: readonly [number, number, number],
): MatrixType {
	return [
		rd[0],
		rd[1],
		rd[2],
		0,
		0,
		1,
		0,
		0,
		ad[0],
		ad[1],
		ad[2],
		0,
		translation[0],
		translation[1],
		translation[2],
		1,
	];
}

function nest(file: IfcFile, relating: EntityInstance, related: readonly EntityInstance[]): EntityInstance {
	return file.createEntity("IfcRelNests", guid.new(), null, null, null, relating, [...related]);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))(
	"api.alignment._updateZeroLengthSegmentPlacement (IFC4X3)",
	() => {
		test("IfcCurveSegment with an IfcAxis2Placement2D placement", () => {
			const file = createTestFile("IFC4X3");
			const placement2d = file.createEntity(
				"IfcAxis2Placement2D",
				file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
				file.createEntity("IfcDirection", [1.0, 0.0]),
			);
			const parentCurve = file.createEntity(
				"IfcLine",
				file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
				file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0),
			);
			const zeroLength = file.createEntity("IfcCurveSegment", "DISCONTINUOUS", placement2d, 0.0, 0.0, parentCurve);

			const placement = buildPlacement([0.6, 0.8, 0], [0, 0, 1], [10, 20, 30]);
			_updateZeroLengthSegmentPlacement(file, zeroLength, placement);

			expect((placement2d.get("Location") as EntityInstance).get("Coordinates")).toEqual([10, 20]);
			expect((placement2d.get("RefDirection") as EntityInstance).get("DirectionRatios")).toEqual([0.6, 0.8]);
		});

		test("IfcCurveSegment with an IfcAxis2Placement3D placement", () => {
			const file = createTestFile("IFC4X3");
			const placement3d = file.createEntity(
				"IfcAxis2Placement3D",
				file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]),
				file.createEntity("IfcDirection", [0.0, 0.0, 1.0]),
				file.createEntity("IfcDirection", [1.0, 0.0, 0.0]),
			);
			const parentCurve = file.createEntity(
				"IfcLine",
				file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
				file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0),
			);
			const zeroLength = file.createEntity("IfcCurveSegment", "DISCONTINUOUS", placement3d, 0.0, 0.0, parentCurve);

			const placement = buildPlacement([1, 0, 0], [0, 0, 1], [5, 6, 7]);
			_updateZeroLengthSegmentPlacement(file, zeroLength, placement);

			expect((placement3d.get("Location") as EntityInstance).get("Coordinates")).toEqual([5, 6, 7]);
			expect((placement3d.get("RefDirection") as EntityInstance).get("DirectionRatios")).toEqual([1, 0, 0]);
			expect((placement3d.get("Axis") as EntityInstance).get("DirectionRatios")).toEqual([0, 0, 1]);
		});

		test("IfcAlignmentSegment with an IfcAlignmentHorizontalSegment DesignParameters", () => {
			const file = createTestFile("IFC4X3");
			const designParameters = file.createEntity("IfcAlignmentHorizontalSegment");
			designParameters.set("StartPoint", file.createEntity("IfcCartesianPoint", [0.0, 0.0]));
			designParameters.set("StartDirection", 0.0);
			designParameters.set("StartRadiusOfCurvature", 0.0);
			designParameters.set("EndRadiusOfCurvature", 0.0);
			designParameters.set("SegmentLength", 100.0);
			designParameters.set("PredefinedType", "LINE");
			const segment = file.createEntity(
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

			// Rd = (1, 1, 0) -> atan(1/1) = pi/4.
			const placement = buildPlacement([1, 1, 0], [0, 0, 1], [12, 34, 0]);
			_updateZeroLengthSegmentPlacement(file, segment, placement);

			expect((designParameters.get("StartPoint") as EntityInstance).get("Coordinates")).toEqual([12, 34]);
			expect(designParameters.get("StartDirection")).toBeCloseTo(Math.atan(1), 12);
		});

		test("IfcAlignmentSegment with an IfcAlignmentVerticalSegment DesignParameters", () => {
			const file = createTestFile("IFC4X3");
			const designParameters = file.createEntity("IfcAlignmentVerticalSegment");
			designParameters.set("StartDistAlong", 0.0);
			designParameters.set("HorizontalLength", 100.0);
			designParameters.set("StartHeight", 0.0);
			designParameters.set("StartGradient", 0.0);
			designParameters.set("EndGradient", 0.0);
			designParameters.set("PredefinedType", "CONSTANTGRADIENT");
			const segment = file.createEntity(
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

			// Rd = (2, 1, 0) -> gradient = 1/2 = 0.5.
			const placement = buildPlacement([2, 1, 0], [0, 0, 1], [40, 50, 0]);
			_updateZeroLengthSegmentPlacement(file, segment, placement);

			expect(designParameters.get("StartDistAlong")).toBe(40);
			expect(designParameters.get("StartHeight")).toBe(50);
			expect(designParameters.get("StartGradient")).toBeCloseTo(0.5, 12);
			expect(designParameters.get("EndGradient")).toBe(designParameters.get("StartGradient"));
		});

		test("IfcAlignmentSegment with an IfcAlignmentCantSegment DesignParameters computes StartCantLeft/Right from RailHeadDistance and looks up the layout via getLayout", () => {
			const file = createTestFile("IFC4X3");
			const designParameters = file.createEntity("IfcAlignmentCantSegment");
			designParameters.set("StartDistAlong", 0.0);
			designParameters.set("HorizontalLength", 100.0);
			designParameters.set("StartCantLeft", 0.0);
			designParameters.set("StartCantRight", 0.0);
			designParameters.set("PredefinedType", "CONSTANTCANT");
			const segment = file.createEntity(
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
			const cantLayout = file.createEntity("IfcAlignmentCant", guid.new(), null, "C1");
			cantLayout.set("RailHeadDistance", 1.5);
			nest(file, cantLayout, [segment]);

			// Ad = (0, 0.6, 0.8) -> slope = Ady / sqrt(Ady^2 + Adz^2) = 0.6.
			const placement = buildPlacement([1, 0, 0], [0, 0.6, 0.8], [7, 8, 0]);
			_updateZeroLengthSegmentPlacement(file, segment, placement);

			expect(designParameters.get("StartDistAlong")).toBe(7);
			const railhead = 1.5;
			const slope = 0.6;
			const expectedLeft = 8 - (slope * railhead) / 2.0;
			const expectedRight = 8 + (slope * railhead) / 2.0;
			expect(designParameters.get("StartCantLeft")).toBeCloseTo(expectedLeft, 12);
			expect(designParameters.get("StartCantRight")).toBeCloseTo(expectedRight, 12);
			expect(designParameters.get("EndCantLeft")).toBe(designParameters.get("StartCantLeft"));
			expect(designParameters.get("EndCantRight")).toBe(designParameters.get("StartCantRight"));
		});
	},
);
