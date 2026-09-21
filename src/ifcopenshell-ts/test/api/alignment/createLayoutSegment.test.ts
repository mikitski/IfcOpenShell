// This file was generated with the assistance of an AI coding tool.
//
// TWO real Python test files DO exist that call `create_layout_segment.py` directly --
// `test_create_layout_segment.py` (297 lines) and `test_create_no_geometry.py` (87
// lines) -- this file's own previous header comment's blanket "no real Python test
// file exists" claim was FALSE, corrected here after a dedicated re-verification pass
// (see `PROGRESS.md`'s "`api.alignment` test-fidelity backfill" entry, chunk 4/final of
// that item, which covers `test_create_no_geometry.py` specifically as its own
// standout investigation). Both real files build their fixture via
// `ifcopenshell.api.alignment.create(...)` first, which is unconditionally blocked in
// this port (see `../../../src/api/alignment/create.ts`'s own header comment) -- not
// reusable as-is by simply calling `create()` and expecting it to succeed.
// `test_create_layout_segment.py`'s own bulk (its `_test_horizontal`/
// `_test_horizontal_vertical`/`_test_horizontal_vertical2` helpers) goes further than
// `test_create_no_geometry.py` -- it asserts real numeric `end[0,3]`/`end[1,3]`/
// `end[2,3]` coordinates across MULTIPLE successive `create_layout_segment` calls
// (second horizontal segment, first/second vertical segments) plus nest/curve-segment
// growth after each one. None of that is disclosed with its own dedicated writeup below
// (unlike `test_create_no_geometry.py`'s) because it does not need one: every one of
// those calls is downstream of the SAME unconditional `_getSegmentEndpoint` throw this
// file's own first `createLayoutSegment` call already hits (see the next paragraph) --
// so none of its coordinate assertions are reachable here, for the identical reason,
// not a distinct one.
//
// **`test_create_no_geometry.py`'s own deep-dive finding, investigated specifically
// because its fixture (`create(file, "A1", include_vertical=True,
// include_geometry=False)`) throws BEFORE any geometry is built, unlike every other
// real caller of `create()`**: catching that throw and recovering
// `file.byType("IfcAlignment")[0]` DOES yield a real, correctly-shaped `IfcAlignment`
// with real, nested horizontal+vertical layouts (`create()`'s own real, portable
// prefix -- entity creation, layout creation, nesting -- runs before its own
// unconditional `addStationingReferent` throw), and `getCurve(ali)` on it correctly
// returns `null` (matching the real test's own explicit `assert curve == None`,
// since `include_geometry=False` means no representation was ever created). BUT the
// real test's own SUBSTANTIVE, distinguishing assertions -- the `create_layout_segment`
// return value's `end[0,3]`/`end[1,3]`/`end[2,3]` coordinate checks, for both a
// horizontal LINE segment and a vertical CONSTANTGRADIENT segment -- can NEVER be
// exercised on this port, for any input, not just this one: `createLayoutSegment`'s own
// `_addSegmentToLayout` dependency calls `_get_segment_endpoint`
// UNCONDITIONALLY, with no branch of any kind (confirmed by reading real Python's own
// `_get_segment_endpoint.py` directly -- every code path, including the simplest LINE
// segment, unconditionally constructs `ifcopenshell.geom.settings()` and calls
// `ifcopenshell_wrapper.map_shape`/`function_item_evaluator`) -- genuinely different
// from `addZeroLengthSegment`'s own conditional gate (chunk 7), which skips the
// kernel-needing call entirely for a genuinely empty layout. There is no "recover a
// real alignment first" trick that unblocks this: the real geometry kernel is needed
// for literally every real invocation, a permanent architectural boundary already
// documented in `./index.ts`'s own "permanently excluded" list. Ported below: the
// genuinely reachable sliver (recovering a real alignment via `create()`+catch, then
// confirming `getCurve` returns `null` and `getHorizontalLayout`/`getVerticalLayout`
// resolve correctly), plus a dedicated regression test using the real test's own
// literal LINE `DesignParameters`, pinning the disclosed `_getSegmentEndpoint` throw
// with real, not self-derived, input values.
//
// The rest of this file's own original test coverage (pinning the real type-checking,
// real `IfcAlignmentSegment` construction, and real `nest.assignObject`/
// `nest.reorderNesting` side effects that run before the already-disclosed,
// unconditional `_addSegmentToLayout` throw, chunk 7) is unchanged.

import { describe, expect, test } from "vitest";
import { create } from "../../../src/api/alignment/create";
import { createLayoutSegment } from "../../../src/api/alignment/createLayoutSegment";
import { getCurve } from "../../../src/api/alignment/getCurve";
import { getHorizontalLayout } from "../../../src/api/alignment/getHorizontalLayout";
import { getVerticalLayout } from "../../../src/api/alignment/getVerticalLayout";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function horizontalDesignParameters(file: IfcFile): EntityInstance {
	return file.createEntity(
		"IfcAlignmentHorizontalSegment",
		null,
		null,
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		0.0,
		0.0,
		0.0,
		10.0,
		null,
		"LINE",
	);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.createLayoutSegment (IFC4X3)", () => {
	test("throws TypeError for an unexpected layout entity type", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		expect(() => createLayoutSegment(file, alignment, horizontalDesignParameters(file))).toThrow(
			new TypeError(
				"Expected entity type to be one of ['IfcAlignmentHorizontal', 'IfcAlignmentVertical', 'IfcAlignmentCant'], instead received IfcAlignment",
			),
		);
	});

	test("throws TypeError when designParameters doesn't match layout's expected type", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		const verticalDesignParameters = file.createEntity(
			"IfcAlignmentVerticalSegment",
			null,
			null,
			0.0,
			10.0,
			0.0,
			0.0,
			0.0,
			null,
			"CONSTANTGRADIENT",
		);

		expect(() => createLayoutSegment(file, horizontal, verticalDesignParameters)).toThrow(
			new TypeError("Expected design_parameters to be IfcAlignmentHorizontalSegment"),
		);
	});

	test("creates a real IfcAlignmentSegment, nests it into the layout, then throws from the already-blocked _addSegmentToLayout", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		const designParameters = horizontalDesignParameters(file);

		expect(() => createLayoutSegment(file, horizontal, designParameters)).toThrow(/_getSegmentEndpoint/);

		// The real `IfcAlignmentSegment` was created and nested before the throw.
		const rels = horizontal.get("IsNestedBy") as EntityInstance[];
		expect(rels.length).toBe(1);
		const related = rels[0].get("RelatedObjects") as EntityInstance[];
		expect(related.length).toBe(1);
		expect(related[0].isA()).toBe("IfcAlignmentSegment");
		expect((related[0].get("DesignParameters") as EntityInstance).identity()).toBe(designParameters.identity());
	});

	test("test_create_no_geometry.py's own real fixture, recovered via catch-and-recover: create() throws (unconditionally, at addStationingReferent) but leaves a real, correctly-shaped IfcAlignment with nested horizontal+vertical layouts and a null curve -- createLayoutSegment with the real test's own literal LINE design parameters still throws at the SAME unconditional _getSegmentEndpoint gap, confirmed unreachable even for the simplest segment", () => {
		const file = createTestFile("IFC4X3");

		let thrown: unknown;
		try {
			create(file, "A1", true, false, false, 0.0);
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toBeDefined();

		// create()'s own real, portable prefix (entity creation, layout creation,
		// nesting) ran before its own unconditional addStationingReferent throw --
		// recover the partially-constructed alignment exactly as the real test's own
		// `ali` return value would have been, had create() not been blocked.
		const alignments = file.byType("IfcAlignment");
		expect(alignments.length).toBe(1);
		const ali = alignments[0];

		const horizontalAlignment = getHorizontalLayout(ali);
		const verticalAlignment = getVerticalLayout(ali);
		expect(horizontalAlignment).not.toBeNull();
		expect(verticalAlignment).not.toBeNull();

		// Matches the real test's own `assert curve == None` -- include_geometry=False
		// means no representation was ever created.
		expect(getCurve(ali)).toBeNull();

		// The real test's own literal LINE design parameters.
		const designParameters = file.createEntity(
			"IfcAlignmentHorizontalSegment",
			null,
			null,
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			0.0,
			0.0,
			0.0,
			100.0,
			null,
			"LINE",
		);

		// createLayoutSegment's own unconditional _getSegmentEndpoint gap (chunk 7/8) is
		// NOT conditional on the layout being empty, unlike addZeroLengthSegment's own
		// gate -- confirmed directly against real Python's own `_get_segment_endpoint.py`
		// (every branch unconditionally calls `ifcopenshell.geom.settings()`/
		// `map_shape`/`function_item_evaluator`, even for the simplest LINE segment) --
		// so the real test's own `end = create_layout_segment(...); assert end[0, 3] ==
		// 100.0` etc. assertions can NEVER be exercised on this port, regardless of how
		// the layout got built. See this file's own header comment for the full
		// deep-dive writeup.
		expect(() => createLayoutSegment(file, horizontalAlignment as EntityInstance, designParameters)).toThrow(
			/_getSegmentEndpoint/,
		);

		// The real, portable prefix (segment creation + nesting) still ran before the
		// throw.
		const segmentNests = (horizontalAlignment as EntityInstance).get("IsNestedBy") as EntityInstance[];
		expect(segmentNests.length).toBe(1);
		expect((segmentNests[0].get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});
});
