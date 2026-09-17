// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `get_mapped_segments.py` -- see
// `../../../src/api/alignment/index.ts`'s own header comment. Original test coverage
// written here, gated to IFC4X3.
//
// The fixture uses plain `IfcCartesianPoint` placeholders standing in for the
// `IfcCurveSegment` entities `curve.Segments` would really hold (matching
// `./getCurve.test.ts`'s own established "the function under test never inspects the
// segment's own content, only indexes into the array" substitution rationale --
// confirmed empirically that this port's `createEntity` does not itself validate an
// aggregate member's EXPRESS type against the attribute's own declared type).
//
// Covers the real, verbatim-preserved off-by-one bug
// `../../../src/api/alignment/getMappedSegments.ts`'s own header comment (quirk 3)
// discloses: for a Helmert-curve `IfcAlignmentSegment` (2 `IfcCurveSegment`s), the
// SECOND returned element is really the FIRST curve segment of the NEXT alignment
// segment (or `undefined`, this port's own non-throwing divergence from Python's
// `IndexError`, when the Helmert segment is the LAST one in the layout).

import { describe, expect, test } from "vitest";
import { getMappedSegments } from "../../../src/api/alignment/getMappedSegments";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function create3dContext(file: IfcFile): EntityInstance {
	const origin = file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0, 0, 0]));
	return file.createEntity("IfcGeometricRepresentationContext", null, "Model", 3, 1.0e-5, origin);
}

function addAxisRepresentation(file: IfcFile, alignment: EntityInstance, curve: EntityInstance): void {
	const shapeRepresentation = file.createEntity("IfcShapeRepresentation", create3dContext(file), "Axis", "Curve2D", [
		curve,
	]);
	alignment.set("Representation", file.createEntity("IfcProductDefinitionShape", null, null, [shapeRepresentation]));
}

function horizontalSegment(file: IfcFile, name: string, predefinedType: string): EntityInstance {
	const startPoint = file.createEntity("IfcCartesianPoint", [0, 0]);
	const designParameters = file.createEntity(
		"IfcAlignmentHorizontalSegment",
		null,
		null,
		startPoint,
		0,
		0,
		0,
		100,
		null,
		predefinedType,
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, name, null, null, null, null, designParameters);
}

/** Builds an `IfcAlignment` with an `IfcAlignmentHorizontal` nested to it, itself
 * nesting `segments` (in order), and a placeholder `IfcCompositeCurve` (4
 * placeholder curve-segment `IfcCartesianPoint`s: seg1 -> [p0]; seg2 (Helmert) ->
 * [p1, p2]; seg3 -> [p3]) as the layout's own representation curve. */
function buildFixture(file: IfcFile): {
	horizontal: EntityInstance;
	seg1: EntityInstance;
	seg2: EntityInstance;
	seg3: EntityInstance;
	curveSegments: EntityInstance[];
} {
	const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
	const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
	file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [horizontal]);

	const seg1 = horizontalSegment(file, "H1.1", "LINE");
	const seg2 = horizontalSegment(file, "H1.2", "HELMERTCURVE");
	const seg3 = horizontalSegment(file, "H1.3", "LINE");
	file.createEntity("IfcRelNests", guid.new(), null, null, null, horizontal, [seg1, seg2, seg3]);

	const curveSegments = [0, 1, 2, 3].map(() => file.createEntity("IfcCartesianPoint", [0, 0]));
	const compositeCurve = file.createEntity("IfcCompositeCurve", curveSegments, false);
	addAxisRepresentation(file, alignment, compositeCurve);

	return { horizontal, seg1, seg2, seg3, curveSegments };
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getMappedSegments (IFC4X3)", () => {
	test("throws TypeError for a non-IfcAlignmentSegment", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");

		expect(() => getMappedSegments(horizontal)).toThrow(
			new TypeError("Expected to see type 'IfcAlignmentSegment', instead received 'IfcAlignmentHorizontal'."),
		);
	});

	test("non-Helmert first segment maps 1:1 to the first curve segment, second element null", () => {
		const file = createTestFile("IFC4X3");
		const { seg1, curveSegments } = buildFixture(file);

		const [first, second] = getMappedSegments(seg1);
		expect(first.equals(curveSegments[0])).toBe(true);
		expect(second).toBeNull();
	});

	test("trailing non-Helmert segment maps 1:1 to its own (later) curve segment", () => {
		const file = createTestFile("IFC4X3");
		const { seg3, curveSegments } = buildFixture(file);

		const [first, second] = getMappedSegments(seg3);
		expect(first.equals(curveSegments[3])).toBe(true);
		expect(second).toBeNull();
	});

	test("quirk: a Helmert segment's second returned element is off by one (the NEXT segment's own first curve segment, not its own second)", () => {
		const file = createTestFile("IFC4X3");
		const { seg2, curveSegments } = buildFixture(file);

		const [first, second] = getMappedSegments(seg2);
		// Correct first element: seg2's own first curve segment.
		expect(first.equals(curveSegments[1])).toBe(true);
		// Real Python's own bug: this should be curveSegments[2] (seg2's own SECOND
		// curve segment) but is actually curveSegments[3] (seg3's own curve segment).
		expect(second?.equals(curveSegments[3])).toBe(true);
		expect(second?.equals(curveSegments[2])).toBe(false);
	});

	test("quirk: a Helmert segment at the very end of the layout returns undefined for the second element (JS's non-throwing out-of-range access; Python raises IndexError)", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [horizontal]);
		const onlySegment = horizontalSegment(file, "H1.1", "HELMERTCURVE");
		file.createEntity("IfcRelNests", guid.new(), null, null, null, horizontal, [onlySegment]);
		const curveSegments = [0, 1].map(() => file.createEntity("IfcCartesianPoint", [0, 0]));
		addAxisRepresentation(file, alignment, file.createEntity("IfcCompositeCurve", curveSegments, false));

		const [first, second] = getMappedSegments(onlySegment);
		expect(first.equals(curveSegments[0])).toBe(true);
		expect(second).toBeUndefined();
	});
});
