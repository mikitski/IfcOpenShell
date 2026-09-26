// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/alignment/test_has_zero_length_segment.py`
// (src/ifcopenshell-python). Real Python's own fixture builds a full alignment via
// `ifcopenshell.api.alignment.create(...)` (which always appends a mandatory
// zero-length segment to every layout it creates) -- not in this chunk's scope (a
// much larger, later chunk). This port builds an equivalent horizontal/vertical/cant
// layout, each ending in a manually-constructed zero-length last segment, then ports
// the real test's own assertion verbatim: `has_zero_length_segment(layout) === true`
// for each of the 3 real `_test_horizontal`/`_test_horizontal_vertical`/
// `_test_horizontal_vertical_cant` scenarios. Gated to IFC4X3 (`describe.skipIf`,
// matching real Python's own `IFC4X3_AVAILABLE` guard).
//
// Also adds original coverage (not in the real Python test suite) for a real,
// verbatim-preserved quirk this port's own header comment
// (`../../../src/api/alignment/hasZeroLengthSegment.ts`) discloses: the
// horizontal/vertical/cant branch never `break`s its `IsNestedBy` loop, so a LATER
// rel's own last segment silently overrides an EARLIER rel's result, and a
// non-matching later rel leaves an earlier match's `result` untouched (never resets
// to `false`).
//
// NOT covered here (also not exercised by real Python's own test suite at all): the
// `IfcCompositeCurve`/`IfcGradientCurve`/`IfcSegmentedReferenceCurve` branch, which
// reads a wrapped `IfcCurveSegment.SegmentLength` (an `IfcCurveMeasureSelect`
// SELECT-typed attribute). Building a real fixture for it requires constructing a
// fresh, standalone declared-type value (e.g. `file.createEntity("IfcLengthMeasure",
// 0)`) to assign there -- confirmed EMPIRICALLY (not assumed) to throw
// `"Attribute access is only supported on entity instances"`, the SAME pre-existing,
// already-tracked `EntityInstance.setByIndex`/`IfcFile.createEntity` primitive-layer
// gap TODOS.md's own dedicated entry documents (title: `` `EntityInstance.setByIndex`/
// `IfcFile.createEntity` cannot write an initial value into a freshly created
// simple/defined-type instance `` -- also disclosed by `api/georeference
// /addGeoreferencing.ts`'s own header comment for an unrelated `IfcRigidOperation`
// case). Not a new gap introduced by this chunk -- this branch's own logic is still
// ported faithfully (see `hasZeroLengthSegment.ts`'s own header comment); it simply
// has no real, working way to be exercised by a constructed-from-scratch fixture
// today.

import { describe, expect, test } from "vitest";
import { hasZeroLengthSegment } from "../../../src/api/alignment/hasZeroLengthSegment";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function nest(file: IfcFile, relating: EntityInstance, related: readonly EntityInstance[]): EntityInstance {
	return file.createEntity("IfcRelNests", guid.new(), null, null, null, relating, [...related]);
}

/** A minimal `IfcAlignmentHorizontal` with one `IfcAlignmentSegment` whose
 * `DesignParameters.SegmentLength` is `zeroLength ? 0 : 100`. */
function horizontalWithLastSegment(file: IfcFile, zeroLength: boolean): EntityInstance {
	const layout = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
	const startPoint = file.createEntity("IfcCartesianPoint", [0, 0]);
	const designParameters = file.createEntity(
		"IfcAlignmentHorizontalSegment",
		null, // StartTag
		null, // EndTag
		startPoint,
		0, // StartDirection
		0, // StartRadiusOfCurvature
		0, // EndRadiusOfCurvature
		zeroLength ? 0 : 100, // SegmentLength
	);
	const segment = file.createEntity(
		"IfcAlignmentSegment",
		guid.new(),
		null,
		"H1.1",
		null,
		null,
		null,
		null,
		designParameters,
	);
	nest(file, layout, [segment]);
	return layout;
}

/** A minimal `IfcAlignmentVertical` with one `IfcAlignmentSegment` whose
 * `DesignParameters.HorizontalLength` is `zeroLength ? 0 : 100`. */
function verticalWithLastSegment(file: IfcFile, zeroLength: boolean): EntityInstance {
	const layout = file.createEntity("IfcAlignmentVertical", guid.new(), null, "V1");
	const designParameters = file.createEntity(
		"IfcAlignmentVerticalSegment",
		null, // StartTag
		null, // EndTag
		0, // StartDistAlong
		zeroLength ? 0 : 100, // HorizontalLength
	);
	const segment = file.createEntity(
		"IfcAlignmentSegment",
		guid.new(),
		null,
		"V1.1",
		null,
		null,
		null,
		null,
		designParameters,
	);
	nest(file, layout, [segment]);
	return layout;
}

/** A minimal `IfcAlignmentCant` with one `IfcAlignmentSegment` whose
 * `DesignParameters.HorizontalLength` is `zeroLength ? 0 : 100`. */
function cantWithLastSegment(file: IfcFile, zeroLength: boolean): EntityInstance {
	const layout = file.createEntity("IfcAlignmentCant", guid.new(), null, "C1", null, null, null, null, 1.5);
	const designParameters = file.createEntity(
		"IfcAlignmentCantSegment",
		null, // StartTag
		null, // EndTag
		0, // StartDistAlong
		zeroLength ? 0 : 100, // HorizontalLength
	);
	const segment = file.createEntity(
		"IfcAlignmentSegment",
		guid.new(),
		null,
		"C1.1",
		null,
		null,
		null,
		null,
		designParameters,
	);
	nest(file, layout, [segment]);
	return layout;
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.hasZeroLengthSegment (IFC4X3)", () => {
	test("horizontal layout ending in a zero-length segment", () => {
		const file = createTestFile("IFC4X3");
		expect(hasZeroLengthSegment(horizontalWithLastSegment(file, true))).toBe(true);
	});

	test("vertical layout ending in a zero-length segment", () => {
		const file = createTestFile("IFC4X3");
		expect(hasZeroLengthSegment(verticalWithLastSegment(file, true))).toBe(true);
	});

	test("cant layout ending in a zero-length segment", () => {
		const file = createTestFile("IFC4X3");
		expect(hasZeroLengthSegment(cantWithLastSegment(file, true))).toBe(true);
	});

	test("horizontal layout NOT ending in a zero-length segment", () => {
		const file = createTestFile("IFC4X3");
		expect(hasZeroLengthSegment(horizontalWithLastSegment(file, false))).toBe(false);
	});

	test("throws TypeError for an unexpected entity type, matching real Python's own (unmatched-quote) message", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		expect(() => hasZeroLengthSegment(alignment)).toThrow(
			new TypeError(
				"Expected entity type to be one of ['IfcAlignmentHorizontal', 'IfcAlignmentVertical', 'IfcAlignmentCant', " +
					"'IfcCompositeCurve', 'IfcGradientCurve', 'IfcSegmentedReferenceCurve'], instead received 'IfcAlignment",
			),
		);
	});

	test("quirk: the LAST matching IsNestedBy rel wins, since the real Python loop never breaks", () => {
		const file = createTestFile("IFC4X3");
		const layout = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const startPoint = file.createEntity("IfcCartesianPoint", [0, 0]);
		const zeroDesignParameters = file.createEntity("IfcAlignmentHorizontalSegment", null, null, startPoint, 0, 0, 0, 0);
		const nonZeroDesignParameters = file.createEntity(
			"IfcAlignmentHorizontalSegment",
			null,
			null,
			startPoint,
			0,
			0,
			0,
			100,
		);
		const zeroSegment = file.createEntity(
			"IfcAlignmentSegment",
			guid.new(),
			null,
			"H1.1",
			null,
			null,
			null,
			null,
			zeroDesignParameters,
		);
		const nonZeroSegment = file.createEntity(
			"IfcAlignmentSegment",
			guid.new(),
			null,
			"H1.2",
			null,
			null,
			null,
			null,
			nonZeroDesignParameters,
		);
		// Two SEPARATE `IfcRelNests`, in this order: a zero-length-last-segment rel,
		// THEN a non-zero-length-last-segment rel. Real Python's own never-`break`
		// loop means the SECOND (non-matching) rel's `result = false` wins.
		nest(file, layout, [zeroSegment]);
		nest(file, layout, [nonZeroSegment]);

		expect(hasZeroLengthSegment(layout)).toBe(false);
	});
});
