// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `get_layout.py` -- see
// `../../../src/api/alignment/index.ts`'s own header comment. Original test coverage
// written here, gated to IFC4X3.

import { describe, expect, test } from "vitest";
import { getLayout } from "../../../src/api/alignment/getLayout";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function nest(file: IfcFile, relating: EntityInstance, related: readonly EntityInstance[]): EntityInstance {
	return file.createEntity("IfcRelNests", guid.new(), null, null, null, relating, [...related]);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getLayout (IFC4X3)", () => {
	test("returns the layout an alignment segment is nested to", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const segment = file.createEntity("IfcAlignmentSegment", guid.new(), null, "H1.1");
		nest(file, horizontal, [segment]);

		expect(getLayout(segment)?.equals(horizontal)).toBe(true);
	});

	test("returns null when the segment isn't nested to anything", () => {
		const file = createTestFile("IFC4X3");
		const segment = file.createEntity("IfcAlignmentSegment", guid.new(), null, "H1.1");

		expect(getLayout(segment)).toBeNull();
	});

	test("throws TypeError for a non-IfcAlignmentSegment argument, matching real Python's own message", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");

		expect(() => getLayout(horizontal)).toThrow(
			new TypeError("Expected entity type to be IfcAlignmentSegment, instead received IfcAlignmentHorizontal"),
		);
	});
});
