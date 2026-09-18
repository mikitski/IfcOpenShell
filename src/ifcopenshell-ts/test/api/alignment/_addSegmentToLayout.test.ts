// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `_add_segment_to_layout.py` (confirmed by
// reading the whole real test directory) -- its own real callers
// (`create`/`create_layout_segment`) are out of this chunk's scope. Original test
// coverage written here, gated to IFC4X3.
//
// The main test below pins this file's own key finding: `nest.assignObject`/
// `reorderNesting` (both real, portable side effects) run BEFORE the unconditional
// `_get_segment_endpoint` throw -- confirmed via the exact final `RelatedObjects`
// order (`[newSegment, zeroLengthSegment]`, the newly-added segment swapped in front
// of the mandatory zero-length one that must stay last).

import { describe, expect, test } from "vitest";
import { _addSegmentToLayout } from "../../../src/api/alignment/_addSegmentToLayout";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function horizontalSegment(file: IfcFile, segmentLength: number): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentHorizontalSegment",
		null,
		null,
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		0.0,
		0.0,
		0.0,
		segmentLength,
		null,
		"LINE",
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._addSegmentToLayout (IFC4X3)", () => {
	test("throws TypeError for an unexpected layout entity type", () => {
		const file = createTestFile("IFC4X3");
		const notALayout = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const layoutSegment = horizontalSegment(file, 10.0);

		expect(() => _addSegmentToLayout(file, notALayout, layoutSegment)).toThrow(
			new TypeError(
				"Expected entity type to be one of ['IfcAlignmentHorizontal', 'IfcAlignmentVertical', 'IfcAlignmentCant'], instead received IfcAlignment",
			),
		);
	});

	test("throws TypeError for an unexpected layoutSegment entity type", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const notASegment = file.createEntity("IfcAlignmentVertical", guid.new(), null, "V1");

		expect(() => _addSegmentToLayout(file, horizontal, notASegment)).toThrow(
			new TypeError("Expected to see IfcAlignmentSegment, instead received IfcAlignmentVertical."),
		);
	});

	test("real nest.assignObject/reorderNesting side effects run for real -- the new segment is swapped in front of the mandatory zero-length one -- before the unconditional _getSegmentEndpoint throw", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const zeroLengthSegment = horizontalSegment(file, 0.0);
		file.createEntity("IfcRelNests", guid.new(), null, null, null, horizontal, [zeroLengthSegment]);

		const newSegment = horizontalSegment(file, 25.0);

		expect(() => _addSegmentToLayout(file, horizontal, newSegment)).toThrow(/_getSegmentEndpoint/);

		const rels = horizontal.get("IsNestedBy") as EntityInstance[];
		expect(rels.length).toBe(1);
		const relatedObjects = rels[0].get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(2);
		// The mandatory zero-length segment is back at the end, with the newly-added
		// segment swapped in just before it -- confirming both real side effects ran.
		expect(relatedObjects[0].equals(newSegment)).toBe(true);
		expect(relatedObjects[1].equals(zeroLengthSegment)).toBe(true);
	});
});
