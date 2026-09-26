// This file was generated with the assistance of an AI coding tool.
//
// A real Python test file, `test/api/alignment/test_add_segment_to_layout.py` (91
// lines), DOES exist for `_add_segment_to_layout.py` -- this file's own previous
// header comment claimed otherwise; that claim was FALSE, corrected here after a
// dedicated re-verification pass (see `PROGRESS.md`'s "`api.alignment` test-fidelity
// backfill" entry, chunk 4/final of that item). It imports `_add_segment_to_layout`
// directly (`from ifcopenshell.api.alignment._add_segment_to_layout import
// _add_segment_to_layout`) and calls it on a hand-built `IfcAlignmentSegment`, exactly
// like this file's own tests below -- but its own fixture first calls
// `ifcopenshell.api.alignment.create(file, "")` to build a realistic alignment (with a
// working stationing nest) to call it against, and `create()` is unconditionally
// blocked in this port (see `../../../src/api/alignment/create.ts`'s own header
// comment) -- so the real fixture isn't reusable as-is. Original test coverage written
// here instead, gated to IFC4X3.
//
// The main test below pins this file's own key finding: `nest.assignObject`/
// `reorderNesting` (both real, portable side effects) run BEFORE the unconditional
// `_get_segment_endpoint` throw -- confirmed via the exact final `RelatedObjects`
// order (`[newSegment, zeroLengthSegment]`, the newly-added segment swapped in front
// of the mandatory zero-length one that must stay last).
//
// The real test's own final 2 assertions re-check `get_stationing_nest(file,
// alignment)` before AND after the `_add_segment_to_layout` call, to confirm the
// alignment's own SEPARATE stationing nest (an unrelated `IfcRelNests`, nested
// directly to the alignment, not to the horizontal layout) is untouched by a segment
// being added to the horizontal layout -- genuinely distinct coverage from the main
// test above (which only inspects the layout's OWN nest). Ported below as its own
// dedicated test, using a hand-built stationing nest (since the real one can't be
// built via the blocked `create()`/`addStationingReferent`).

import { describe, expect, test } from "vitest";
import { _addSegmentToLayout } from "../../../src/api/alignment/_addSegmentToLayout";
import { getStationingNest } from "../../../src/api/alignment/getStationingNest";
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

	test("a separate stationing nest (an unrelated IfcRelNests on the same alignment) is untouched, both before and after the throw -- matching test_add_segment_to_layout.py's own explicit double-check", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [horizontal]);

		const referent = file.createEntity("IfcReferent", guid.new(), null, "1+00.0", null, null, null, null, "STATION");
		const stationingNest = file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [referent]);

		const zeroLengthSegment = horizontalSegment(file, 0.0);
		file.createEntity("IfcRelNests", guid.new(), null, null, null, horizontal, [zeroLengthSegment]);

		// Matches the real test's own explicit before-check: resolve the stationing nest
		// via the real, public `getStationingNest` lookup (not just the hand-built
		// reference), so a regression in the lookup itself -- not just this specific
		// `IfcRelNests` object -- would also be caught.
		const nestBefore = getStationingNest(file, alignment);
		expect(nestBefore?.identity()).toBe(stationingNest.identity());
		expect((nestBefore?.get("RelatedObjects") as EntityInstance[]).length).toBe(1);

		const newSegment = horizontalSegment(file, 25.0);
		expect(() => _addSegmentToLayout(file, horizontal, newSegment)).toThrow(/_getSegmentEndpoint/);

		// The stationing nest is a completely separate IfcRelNests -- adding a segment to
		// the horizontal layout's own nest must not touch it at all. Re-resolve via
		// `getStationingNest` again (the real test's own explicit after-check), not just
		// re-read the retained handle.
		const nestAfter = getStationingNest(file, alignment);
		expect(nestAfter?.identity()).toBe(stationingNest.identity());
		expect((nestAfter?.get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});
});
