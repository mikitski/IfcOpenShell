// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `get_alignment_layout_nest.py` -- see
// `../../../src/api/alignment/index.ts`'s own header comment. Original test coverage
// written here, gated to IFC4X3.

import { describe, expect, test } from "vitest";
import { getAlignmentLayoutNest } from "../../../src/api/alignment/getAlignmentLayoutNest";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getAlignmentLayoutNest (IFC4X3)", () => {
	test("returns the IfcRelNests containing the alignment's layout(s)", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const referent = file.createEntity("IfcReferent", guid.new(), null, "A1 0+00.00");
		file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [referent]);
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const layoutNest = file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [horizontal]);

		expect(getAlignmentLayoutNest(alignment)?.equals(layoutNest)).toBe(true);
	});

	test("returns null when no layout is nested to the alignment", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		expect(getAlignmentLayoutNest(alignment)).toBeNull();
	});
});
