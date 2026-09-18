// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `_update_curve_segment_transition_code.py`
// (confirmed by reading the whole real test directory) -- its own real callers
// (`_add_curve_segment_to_composite_curve`/`add_zero_length_segment`) are both landed
// later in this same chunk and are themselves either unconditionally or conditionally
// blocked, so this function's own real behavior (always throwing, per its own header
// comment) is what's pinned here. Original test coverage written, gated to IFC4X3.

import { describe, expect, test } from "vitest";
import { _updateCurveSegmentTransitionCode } from "../../../src/api/alignment/_updateCurveSegmentTransitionCode";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))(
	"api.alignment._updateCurveSegmentTransitionCode (IFC4X3)",
	() => {
		test("always throws a clear, descriptive error naming the unported getCurveSegmentTransitionCode/geometry-kernel gap", () => {
			const file = createTestFile("IFC4X3");
			const prevSegment = file.createEntity("IfcAlignmentSegment", guid.new());
			const segment = file.createEntity("IfcAlignmentSegment", guid.new());

			expect(() => _updateCurveSegmentTransitionCode(prevSegment, segment)).toThrow(/getCurveSegmentTransitionCode/);
			expect(() => _updateCurveSegmentTransitionCode(prevSegment, segment)).toThrow(/geometry kernel/);
		});

		test("the thrown message names both entity types, using its own real arguments", () => {
			const file = createTestFile("IFC4X3");
			const prevSegment = file.createEntity("IfcCurveSegment");
			const segment = file.createEntity("IfcAlignmentSegment", guid.new());

			expect(() => _updateCurveSegmentTransitionCode(prevSegment, segment)).toThrow(
				/IfcCurveSegment.*IfcAlignmentSegment/,
			);
		});
	},
);
