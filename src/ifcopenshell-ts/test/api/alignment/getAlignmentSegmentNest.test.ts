// This file was generated with the assistance of an AI coding tool.
//
// Exercises the same nest-lookup shape as the real `test_name_segments.py` (whose own
// `create_by_pi_method`-built fixture is out of this chunk's scope -- see
// `./nameSegments.test.ts`'s own header comment). No dedicated real Python test file
// exists for `get_alignment_segment_nest.py` on its own -- see
// `../../../src/api/alignment/index.ts`'s own header comment. Original test coverage
// written here, gated to IFC4X3.

import { describe, expect, test } from "vitest";
import { getAlignmentSegmentNest } from "../../../src/api/alignment/getAlignmentSegmentNest";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getAlignmentSegmentNest (IFC4X3)", () => {
	test("returns the IfcRelNests containing the layout's IfcAlignmentSegments", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const seg1 = file.createEntity("IfcAlignmentSegment", guid.new(), null, "H1.1");
		const seg2 = file.createEntity("IfcAlignmentSegment", guid.new(), null, "H1.2");
		const segmentNest = file.createEntity("IfcRelNests", guid.new(), null, null, null, horizontal, [seg1, seg2]);

		expect(getAlignmentSegmentNest(horizontal)?.equals(segmentNest)).toBe(true);
	});

	test("returns null when no IfcAlignmentSegment is nested to the layout", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");

		expect(getAlignmentSegmentNest(horizontal)).toBeNull();
	});
});
