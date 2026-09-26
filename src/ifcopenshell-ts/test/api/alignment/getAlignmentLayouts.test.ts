// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `get_alignment_layouts.py` -- see
// `../../../src/api/alignment/index.ts`'s own header comment. Original test coverage
// written here, gated to IFC4X3.

import { describe, expect, test } from "vitest";
import { getAlignmentLayouts } from "../../../src/api/alignment/getAlignmentLayouts";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getAlignmentLayouts (IFC4X3)", () => {
	test("returns horizontal/vertical/cant layouts, filtering out a stationing IfcReferent nested alongside them", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const vertical = file.createEntity("IfcAlignmentVertical", guid.new(), null, "V1");
		const cant = file.createEntity("IfcAlignmentCant", guid.new(), null, "C1", null, null, null, null, 0);
		const referent = file.createEntity("IfcReferent", guid.new(), null, "Start");
		file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [horizontal, vertical, cant, referent]);

		const layouts = getAlignmentLayouts(alignment);
		expect(layouts).toHaveLength(3);
		expect(layouts.some((l) => l.equals(horizontal))).toBe(true);
		expect(layouts.some((l) => l.equals(vertical))).toBe(true);
		expect(layouts.some((l) => l.equals(cant))).toBe(true);
		expect(layouts.some((l) => l.equals(referent))).toBe(false);
	});

	test("returns an empty array when nothing is nested to the alignment", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		expect(getAlignmentLayouts(alignment)).toEqual([]);
	});
});
