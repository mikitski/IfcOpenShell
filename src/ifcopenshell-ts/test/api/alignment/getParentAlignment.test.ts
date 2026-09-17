// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `get_parent_alignment.py` -- see
// `../../../src/api/alignment/index.ts`'s own header comment. Original test coverage
// written here, gated to IFC4X3.

import { describe, expect, test } from "vitest";
import { getParentAlignment } from "../../../src/api/alignment/getParentAlignment";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getParentAlignment (IFC4X3)", () => {
	test("returns the aggregating parent IfcAlignment", () => {
		const file = createTestFile("IFC4X3");
		const parent = file.createEntity("IfcAlignment", guid.new(), null, "Parent");
		const child = file.createEntity("IfcAlignment", guid.new(), null, "Child");
		file.createEntity("IfcRelAggregates", guid.new(), null, null, null, parent, [child]);

		expect(getParentAlignment(child)?.equals(parent)).toBe(true);
	});

	test("returns null when the alignment has no parent", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		expect(getParentAlignment(alignment)).toBeNull();
	});

	test("returns null when the decomposing relationship's RelatingObject is not an IfcAlignment", () => {
		const file = createTestFile("IFC4X3");
		const site = file.createEntity("IfcSite", guid.new(), null, "Site");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		file.createEntity("IfcRelAggregates", guid.new(), null, null, null, site, [alignment]);

		expect(getParentAlignment(alignment)).toBeNull();
	});
});
