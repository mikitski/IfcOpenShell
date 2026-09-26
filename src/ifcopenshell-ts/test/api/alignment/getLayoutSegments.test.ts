// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `get_layout_segments.py` -- see
// `../../../src/api/alignment/index.ts`'s own header comment. Original test coverage
// written here, gated to IFC4X3.

import { describe, expect, test } from "vitest";
import { getLayoutSegments } from "../../../src/api/alignment/getLayoutSegments";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getLayoutSegments (IFC4X3)", () => {
	test("returns the nested IfcAlignmentSegments, in nesting order", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const seg1 = file.createEntity("IfcAlignmentSegment", guid.new(), null, "H1.1");
		const seg2 = file.createEntity("IfcAlignmentSegment", guid.new(), null, "H1.2");
		const referent = file.createEntity("IfcReferent", guid.new(), null, "P.C.");
		file.createEntity("IfcRelNests", guid.new(), null, null, null, horizontal, [seg1, referent, seg2]);

		const segments = getLayoutSegments(horizontal);
		expect(segments).toHaveLength(2);
		expect(segments[0]?.equals(seg1)).toBe(true);
		expect(segments[1]?.equals(seg2)).toBe(true);
	});

	test("returns an empty array when nothing is nested to the layout", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");

		expect(getLayoutSegments(horizontal)).toEqual([]);
	});
});
