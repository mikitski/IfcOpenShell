// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `get_curve_segment.py` -- see
// `../../../src/api/alignment/index.ts`'s own header comment. Original test coverage
// written here, gated to IFC4X3.
//
// Same placeholder-`IfcCartesianPoint`-as-`IfcCurveSegment` substitution as
// `./getMappedSegments.test.ts` (the function under test never inspects a segment's
// own content, only indexes into `curve.Segments`). Unlike `get_mapped_segments`,
// `get_curve_segment` has no off-by-one bug of its own: it always returns the FIRST
// curve segment belonging to `segment` (the loop's own `index` accumulates counts of
// every PRECEDING segment only, breaking before adding `segment`'s own count).

import { describe, expect, test } from "vitest";
import { getCurveSegment } from "../../../src/api/alignment/getCurveSegment";
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

/** Same 3-segment (LINE, HELMERTCURVE, LINE) / 4-curve-segment fixture as
 * `./getMappedSegments.test.ts`'s own `buildFixture`. */
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
	addAxisRepresentation(file, alignment, file.createEntity("IfcCompositeCurve", curveSegments, false));

	return { horizontal, seg1, seg2, seg3, curveSegments };
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getCurveSegment (IFC4X3)", () => {
	test("first segment resolves to the first curve segment", () => {
		const file = createTestFile("IFC4X3");
		const { horizontal, seg1, curveSegments } = buildFixture(file);

		expect(getCurveSegment(horizontal, seg1)?.equals(curveSegments[0])).toBe(true);
	});

	test("Helmert (2-curve-segment) segment resolves to its own FIRST curve segment only", () => {
		const file = createTestFile("IFC4X3");
		const { horizontal, seg2, curveSegments } = buildFixture(file);

		expect(getCurveSegment(horizontal, seg2)?.equals(curveSegments[1])).toBe(true);
	});

	test("trailing segment resolves to its own (later) curve segment", () => {
		const file = createTestFile("IFC4X3");
		const { horizontal, seg3, curveSegments } = buildFixture(file);

		expect(getCurveSegment(horizontal, seg3)?.equals(curveSegments[3])).toBe(true);
	});

	test("returns null when the layout has no representation curve at all", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [horizontal]);
		const seg1 = horizontalSegment(file, "H1.1", "LINE");
		file.createEntity("IfcRelNests", guid.new(), null, null, null, horizontal, [seg1]);

		expect(getCurveSegment(horizontal, seg1)).toBeNull();
	});

	test("returns null when the computed index falls outside the curve's own Segments", () => {
		const file = createTestFile("IFC4X3");
		const { horizontal, seg3 } = buildFixture(file);
		// Replace the representation with a curve that has too few segments for seg3's
		// own computed index (3).
		const nests = horizontal.get("Nests") as EntityInstance[];
		const alignment = nests[0].get("RelatingObject") as EntityInstance;
		const shortCurve = file.createEntity("IfcCompositeCurve", [file.createEntity("IfcCartesianPoint", [0, 0])], false);
		addAxisRepresentation(file, alignment, shortCurve);

		expect(getCurveSegment(horizontal, seg3)).toBeNull();
	});
});
