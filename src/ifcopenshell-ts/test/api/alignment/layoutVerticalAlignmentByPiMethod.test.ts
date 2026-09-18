// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `layout_vertical_alignment_by_pi_method.py`
// (confirmed by reading the whole real test directory). Original test coverage written
// here, same shape and treatment as
// `./layoutHorizontalAlignmentByPiMethod.test.ts` (see that file's own header comment
// for the full writeup of why real, hand-computed intermediate math is verifiable via
// the one real segment created and nested before each test's throw).

import { describe, expect, test } from "vitest";
import { layoutVerticalAlignmentByPiMethod } from "../../../src/api/alignment/layoutVerticalAlignmentByPiMethod";
import type { EntityInstance } from "../../../src/entityInstance";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function firstCreatedSegment(vertical: EntityInstance): EntityInstance {
	const rels = vertical.get("IsNestedBy") as EntityInstance[];
	expect(rels.length).toBe(1);
	const related = rels[0].get("RelatedObjects") as EntityInstance[];
	expect(related.length).toBe(1);
	return related[0];
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))(
	"api.alignment.layoutVerticalAlignmentByPiMethod (IFC4X3)",
	() => {
		test("throws ValueError-equivalent when lengths.length !== vpoints.length - 2", () => {
			const file = createTestFile("IFC4X3");
			const vertical = file.createEntity("IfcAlignmentVertical", guid.new());

			expect(() =>
				layoutVerticalAlignmentByPiMethod(
					file,
					vertical,
					[
						[0, 0],
						[100, 10],
						[200, 10],
					],
					[],
				),
			).toThrow("lengths should have two fewer elements that vpoints");
		});

		test("real intermediate math: back-gradient CONSTANTGRADIENT segment matches hand-computed values, then throws", () => {
			const file = createTestFile("IFC4X3");
			const vertical = file.createEntity("IfcAlignmentVertical", guid.new());

			expect(() =>
				layoutVerticalAlignmentByPiMethod(
					file,
					vertical,
					[
						[0, 0],
						[100, 10],
						[200, 10],
					],
					[40],
				),
			).toThrow(/_getSegmentEndpoint/);

			const segment = firstCreatedSegment(vertical);
			const dp = segment.get("DesignParameters") as EntityInstance;
			expect(dp.isA()).toBe("IfcAlignmentVerticalSegment");
			expect(dp.get("PredefinedType")).toBe("CONSTANTGRADIENT");
			expect(dp.get("StartDistAlong")).toBe(0.0);
			expect(dp.get("StartHeight")).toBe(0.0);
			// start_slope = dyBG/dxBG = 10/100 = 0.1
			expect(dp.get("StartGradient")).toBeCloseTo(0.1, 9);
			expect(dp.get("EndGradient")).toBeCloseTo(0.1, 9);
			// gradient_length = dxBG - length/2 = 100 - 20 = 80
			expect(dp.get("HorizontalLength")).toBeCloseTo(80.0, 9);
			expect(dp.get("RadiusOfCurvature")).toBeNull();
		});

		test("real intermediate math: PARABOLICARC segment (zero gradient length, skips CONSTANTGRADIENT) matches hand-computed k/BVC", () => {
			const file = createTestFile("IFC4X3");
			const vertical = file.createEntity("IfcAlignmentVertical", guid.new());

			expect(() =>
				layoutVerticalAlignmentByPiMethod(
					file,
					vertical,
					[
						[0, 0],
						[50, 10],
						[150, 10],
					],
					[100],
				),
			).toThrow(/_getSegmentEndpoint/);

			const segment = firstCreatedSegment(vertical);
			const dp = segment.get("DesignParameters") as EntityInstance;
			expect(dp.get("PredefinedType")).toBe("PARABOLICARC");
			// start_slope = 10/50 = 0.2, end_slope = 0/100 = 0
			expect(dp.get("StartGradient")).toBeCloseTo(0.2, 9);
			expect(dp.get("EndGradient")).toBeCloseTo(0.0, 9);
			expect(dp.get("HorizontalLength")).toBeCloseTo(100.0, 9);
			// xBVC = xPVI - length/2 = 50 - 50 = 0; yBVC = yPVI - start_slope*length/2 = 10 - 10 = 0
			expect(dp.get("StartDistAlong")).toBeCloseTo(0.0, 9);
			expect(dp.get("StartHeight")).toBeCloseTo(0.0, 9);
			// k = (end_slope - start_slope) / length = (0 - 0.2) / 100 = -0.002; 1/k = -500
			expect(dp.get("RadiusOfCurvature")).toBeCloseTo(-500.0, 6);
		});

		test("real intermediate math: both back-gradient and parabolic-arc skipped for a degenerate coincident-VPI/zero-length input, falls through to the final gradient-run segment", () => {
			const file = createTestFile("IFC4X3");
			const vertical = file.createEntity("IfcAlignmentVertical", guid.new());

			expect(() =>
				layoutVerticalAlignmentByPiMethod(
					file,
					vertical,
					[
						[0, 0],
						[0, 0],
						[100, 20],
					],
					[0],
				),
			).toThrow(/_getSegmentEndpoint/);

			const segment = firstCreatedSegment(vertical);
			const dp = segment.get("DesignParameters") as EntityInstance;
			expect(dp.get("PredefinedType")).toBe("CONSTANTGRADIENT");
			expect(dp.get("StartDistAlong")).toBeCloseTo(0.0, 9);
			expect(dp.get("StartHeight")).toBeCloseTo(0.0, 9);
			// slope = dy/dx = 20/100 = 0.2; gradient_length = dx = 100
			expect(dp.get("StartGradient")).toBeCloseTo(0.2, 9);
			expect(dp.get("EndGradient")).toBeCloseTo(0.2, 9);
			expect(dp.get("HorizontalLength")).toBeCloseTo(100.0, 9);
			expect(dp.get("RadiusOfCurvature")).toBeNull();
		});
	},
);
