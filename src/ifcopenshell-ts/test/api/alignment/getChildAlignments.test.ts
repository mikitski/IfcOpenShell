// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `get_child_alignments.py` -- see
// `../../../src/api/alignment/index.ts`'s own header comment. Original test coverage
// written here, gated to IFC4X3.

import { describe, expect, test } from "vitest";
import { getChildAlignments } from "../../../src/api/alignment/getChildAlignments";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getChildAlignments (IFC4X3)", () => {
	test("returns only the aggregated IfcAlignment children, per CT 4.1.4.4.1.2", () => {
		const file = createTestFile("IFC4X3");
		const parent = file.createEntity("IfcAlignment", guid.new(), null, "Parent");
		const child = file.createEntity("IfcAlignment", guid.new(), null, "Child");
		// A non-IfcAlignment sibling in the same aggregation must be filtered out.
		const site = file.createEntity("IfcSite", guid.new(), null, "Site");
		file.createEntity("IfcRelAggregates", guid.new(), null, null, null, parent, [child, site]);

		const children = getChildAlignments(parent);
		expect(children).toHaveLength(1);
		expect(children[0]?.equals(child)).toBe(true);
	});

	test("returns an empty array when the alignment decomposes nothing", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		expect(getChildAlignments(alignment)).toEqual([]);
	});
});
