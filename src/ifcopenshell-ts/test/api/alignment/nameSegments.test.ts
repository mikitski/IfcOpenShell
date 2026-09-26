// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/alignment/test_name_segments.py` (src/ifcopenshell-python).
// Real Python's own fixture builds a full PI-method alignment via
// `ifcopenshell.api.alignment.create_by_pi_method(...)` (5 coordinates, 3 curve radii,
// 6 vertical PI points, 4 vertical curve lengths) -- not in this chunk's scope (a much
// larger, later chunk with its own geometry-generation dependencies). This port
// builds an equivalent horizontal-layout-with-segments shape directly, then ports the
// real test's own assertion verbatim: after `name_segments("Q", layout)`, each nested
// `IfcAlignmentSegment.Name` is `f"Q{i}"`, 1-indexed in nesting order. Gated to IFC4X3
// (`describe.skipIf`, matching real Python's own `IFC4X3_AVAILABLE` guard).

import { describe, expect, test } from "vitest";
import { getAlignmentSegmentNest } from "../../../src/api/alignment/getAlignmentSegmentNest";
import { nameSegments } from "../../../src/api/alignment/nameSegments";
import type { EntityInstance } from "../../../src/entityInstance";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.nameSegments (IFC4X3)", () => {
	test("names each nested IfcAlignmentSegment with the prefix and a 1-based sequence number", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const segments = [1, 2, 3, 4].map(() => file.createEntity("IfcAlignmentSegment", guid.new()));
		file.createEntity("IfcRelNests", guid.new(), null, null, null, horizontal, segments);

		nameSegments("Q", horizontal);

		const segmentNest = getAlignmentSegmentNest(horizontal) as EntityInstance;
		const relatedObjects = segmentNest.get("RelatedObjects") as EntityInstance[];
		relatedObjects.forEach((segment, index) => {
			expect(segment.get("Name")).toBe(`Q${index + 1}`);
		});
	});

	test("throws TypeError for a non-layout argument, matching real Python's own message", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		expect(() => nameSegments("Q", alignment)).toThrow(
			new TypeError(
				"Expected entity type to be one of ['IfcAlignmentHorizontal', 'IfcAlignmentVertical', 'IfcAlignmentCant'], instead received 'IfcAlignment",
			),
		);
	});
});
