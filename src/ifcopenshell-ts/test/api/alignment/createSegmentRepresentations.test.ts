// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `create_segment_representations.py`
// (confirmed by reading the whole real test directory) -- its own real callers
// (`create`/`create_by_pi_method`) are both out of this chunk's scope. Original test
// coverage written here, gated to IFC4X3.
//
// The fixture uses placeholder `IfcCartesianPoint`s standing in for `IfcCurveSegment`s
// this function never inspects the content of, matching `getMappedSegments.test.ts`'s
// own already-established precedent (chunk 2).

import { describe, expect, test } from "vitest";
import { createSegmentRepresentations } from "../../../src/api/alignment/createSegmentRepresentations";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function nest(file: IfcFile, relatingObject: EntityInstance, relatedObjects: readonly EntityInstance[]): void {
	file.createEntity("IfcRelNests", guid.new(), null, null, null, relatingObject, [...relatedObjects]);
}

/** Matching `getCurve.test.ts`'s own `create3dContext` precedent -- a real context,
 * since `ContextOfItems` is a mandatory (non-nullable) attribute. */
function create3dContext(file: IfcFile): EntityInstance {
	const origin = file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0, 0, 0]));
	return file.createEntity("IfcGeometricRepresentationContext", null, "Model", 3, 1.0e-5, origin);
}

function shapeRepresentation(
	file: IfcFile,
	identifier: string,
	type: string,
	items: readonly EntityInstance[],
): EntityInstance {
	return file.createEntity("IfcShapeRepresentation", create3dContext(file), identifier, type, [...items]);
}

function setRepresentation(file: IfcFile, product: EntityInstance, representations: readonly EntityInstance[]): void {
	product.set("Representation", file.createEntity("IfcProductDefinitionShape", null, null, [...representations]));
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.createSegmentRepresentations (IFC4X3)", () => {
	test("throws TypeError for a non-IfcAlignment", () => {
		const file = createTestFile("IFC4X3");
		const notAnAlignment = file.createEntity("IfcSite", guid.new());

		expect(() => createSegmentRepresentations(file, notAnAlignment)).toThrow(TypeError);
	});

	test("horizontal-only (Axis/Curve2D): creates a per-segment Axis/Segment representation for each alignment segment, zipped against the composite curve's own segments", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const placement = file.createEntity(
			"IfcLocalPlacement",
			null,
			file.createEntity("IfcAxis2Placement2D", file.createEntity("IfcCartesianPoint", [0, 0])),
		);
		alignment.set("ObjectPlacement", placement);

		const curveSegments = [0, 1].map(() => file.createEntity("IfcCartesianPoint", [0, 0]));
		const compositeCurve = file.createEntity("IfcCompositeCurve", curveSegments, false);
		setRepresentation(file, alignment, [shapeRepresentation(file, "Axis", "Curve2D", [compositeCurve])]);

		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		nest(file, alignment, [horizontal]);

		const segment1 = file.createEntity("IfcAlignmentSegment", guid.new());
		const segment2 = file.createEntity("IfcAlignmentSegment", guid.new());
		nest(file, horizontal, [segment1, segment2]);

		createSegmentRepresentations(file, alignment);

		for (const [i, segment] of [segment1, segment2].entries()) {
			expect((segment.get("ObjectPlacement") as EntityInstance).equals(placement)).toBe(true);
			const product = segment.get("Representation") as EntityInstance;
			const reps = product.get("Representations") as EntityInstance[];
			expect(reps).toHaveLength(1);
			expect(reps[0].get("RepresentationIdentifier")).toBe("Axis");
			expect(reps[0].get("RepresentationType")).toBe("Segment");
			const items = reps[0].get("Items") as EntityInstance[];
			expect(items[0].equals(curveSegments[i])).toBe(true);
		}
	});

	test("horizontal + vertical (FootPrint/Curve2D + Axis/Curve3D): each layout's own segments are zipped against that layout's own curve's segments independently", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		const horizontalCurveSegments = [0].map(() => file.createEntity("IfcCartesianPoint", [0, 0]));
		const compositeCurve = file.createEntity("IfcCompositeCurve", horizontalCurveSegments, false);

		const verticalCurveSegments = [0, 1].map(() => file.createEntity("IfcCartesianPoint", [0, 0]));
		const gradientCurve = file.createEntity("IfcGradientCurve", verticalCurveSegments, false, compositeCurve);

		setRepresentation(file, alignment, [
			shapeRepresentation(file, "FootPrint", "Curve2D", [compositeCurve]),
			shapeRepresentation(file, "Axis", "Curve3D", [gradientCurve]),
		]);

		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		const vertical = file.createEntity("IfcAlignmentVertical", guid.new());
		nest(file, alignment, [horizontal, vertical]);

		const hSegment = file.createEntity("IfcAlignmentSegment", guid.new());
		nest(file, horizontal, [hSegment]);

		const vSegment1 = file.createEntity("IfcAlignmentSegment", guid.new());
		const vSegment2 = file.createEntity("IfcAlignmentSegment", guid.new());
		nest(file, vertical, [vSegment1, vSegment2]);

		createSegmentRepresentations(file, alignment);

		const hItems = (
			(hSegment.get("Representation") as EntityInstance).get("Representations") as EntityInstance[]
		)[0].get("Items") as EntityInstance[];
		expect(hItems[0].equals(horizontalCurveSegments[0])).toBe(true);

		const v1Items = (
			(vSegment1.get("Representation") as EntityInstance).get("Representations") as EntityInstance[]
		)[0].get("Items") as EntityInstance[];
		expect(v1Items[0].equals(verticalCurveSegments[0])).toBe(true);

		const v2Items = (
			(vSegment2.get("Representation") as EntityInstance).get("Representations") as EntityInstance[]
		)[0].get("Items") as EntityInstance[];
		expect(v2Items[0].equals(verticalCurveSegments[1])).toBe(true);
	});

	test("REGRESSION -- a representation matching neither expected shape (e.g. an extra 'Body' representation) leaves curve/nestedAlignment null and throws reading .get('Segments') on null, even though a valid Axis/Curve2D representation exists earlier in the same list", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		const curveSegments = [file.createEntity("IfcCartesianPoint", [0, 0])];
		const compositeCurve = file.createEntity("IfcCompositeCurve", curveSegments, false);
		const bodyItem = file.createEntity("IfcCartesianPoint", [0, 0]);

		setRepresentation(file, alignment, [
			shapeRepresentation(file, "Axis", "Curve2D", [compositeCurve]),
			shapeRepresentation(file, "Body", "SweptSolid", [bodyItem]),
		]);

		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		nest(file, alignment, [horizontal]);
		const segment = file.createEntity("IfcAlignmentSegment", guid.new());
		nest(file, horizontal, [segment]);

		expect(() => createSegmentRepresentations(file, alignment)).toThrow(/null/i);

		// The valid "Axis"/"Curve2D" representation's own iteration ran to completion
		// BEFORE the "Body" representation's iteration threw -- matching real Python's
		// own per-iteration crash, not an all-or-nothing failure.
		expect((segment.get("Representation") as EntityInstance) != null).toBe(true);
	});

	test("throws a descriptive error (matching Python's own StopIteration) when no IfcAlignmentHorizontal component exists for an Axis/Curve2D representation", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const compositeCurve = file.createEntity("IfcCompositeCurve", [], false);
		setRepresentation(file, alignment, [shapeRepresentation(file, "Axis", "Curve2D", [compositeCurve])]);
		// No IfcAlignmentHorizontal nested to the alignment at all.

		expect(() => createSegmentRepresentations(file, alignment)).toThrow(/IfcAlignmentHorizontal/);
	});
});
