// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `create_representation.py` (confirmed by reading
// the whole real test directory). Original test coverage written here.
//
// This suite pins the precise, carefully-verified finding that CORRECTS this chunk's
// own task brief's "may complete for a fresh, empty alignment" hypothesis -- see
// `../../../src/api/alignment/createRepresentation.ts`'s own header comment for the full
// writeup. `createRepresentation` throws for EVERY realistic alignment (one with at
// least one real layout), via one of 2 distinct paths depending on whether that layout
// has any real segments; it only completes for the degenerate, non-realistic case of an
// alignment with ZERO layouts at all (tested here purely to pin the exact boundary of
// what does and doesn't throw).

import { describe, expect, test } from "vitest";
import { createRepresentation } from "../../../src/api/alignment/createRepresentation";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function bareAlignment(file: IfcFile, name: string): EntityInstance {
	return file.createEntity(
		"IfcAlignment",
		guid.new(),
		null,
		name,
		null,
		null,
		file.createEntity(
			"IfcLocalPlacement",
			null,
			file.createEntity("IfcAxis2Placement2D", file.createEntity("IfcCartesianPoint", [0.0, 0.0])),
		),
	);
}

function nest(
	file: IfcFile,
	relatingObject: EntityInstance,
	relatedObjects: readonly EntityInstance[],
): EntityInstance {
	return file.createEntity("IfcRelNests", guid.new(), null, null, null, relatingObject, [...relatedObjects]);
}

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

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.createRepresentation (IFC4X3)", () => {
	test("throws TypeError for a non-IfcAlignment", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());

		expect(() => createRepresentation(file, horizontal)).toThrow(
			new TypeError("Expected to see type 'IfcAlignment', instead received 'IfcAlignmentHorizontal'."),
		);
	});

	test("no-op when alignment already has a Representation", () => {
		const file = createTestFile("IFC4X3");
		const alignment = bareAlignment(file, "A1");
		const shape = file.createEntity("IfcProductDefinitionShape", null, null, []);
		alignment.set("Representation", shape);

		expect(() => createRepresentation(file, alignment)).not.toThrow();
		expect((alignment.get("Representation") as EntityInstance).identity()).toBe(shape.identity());
	});

	test("**KEY FINDING**: throws (Cannot read properties of null) for a real horizontal layout with ZERO real segments -- NOT a no-op loop", () => {
		const file = createTestFile("IFC4X3");
		const alignment = bareAlignment(file, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		nest(file, alignment, [horizontal]);

		expect(() => createRepresentation(file, alignment)).toThrow(/null/i);

		// _createGeometricRepresentation's own real, portable work already ran: the
		// alignment DOES have a real "Axis"/"Curve2D" representation by the time the throw
		// happens.
		const representation = alignment.get("Representation") as EntityInstance | null;
		expect(representation).not.toBeNull();
	});

	test("throws the already-disclosed _addSegmentToCurve kernel gap for a layout with a real (hand-built) segment", () => {
		const file = createTestFile("IFC4X3");
		const alignment = bareAlignment(file, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		nest(file, alignment, [horizontal]);
		nest(file, horizontal, [horizontalSegment(file, 25.0)]);

		expect(() => createRepresentation(file, alignment)).toThrow(/_getSegmentEndpoint/);
	});

	test("degenerate zero-layout alignment with no stationing referent: fully portable, completes with no throw", () => {
		const file = createTestFile("IFC4X3");
		const alignment = bareAlignment(file, "A1");

		expect(() => createRepresentation(file, alignment)).not.toThrow();

		const representation = alignment.get("Representation") as EntityInstance;
		expect(representation).not.toBeNull();
		const reps = representation.get("Representations") as EntityInstance[];
		expect(reps.length).toBe(1);
		expect(reps[0].get("RepresentationIdentifier")).toBe("FootPrint");
		expect(reps[0].get("RepresentationType")).toBe("Curve2D");
	});

	test("throws the already-disclosed IfcLengthMeasure standalone-construction gap when the stationing-referent tail is actually reached", () => {
		const file = createTestFile("IFC4X3");
		const alignment = bareAlignment(file, "A1");

		// Hand-built stationing referent with a non-linear placement -- bypasses the
		// separately-blocked `addStationingReferent`.
		const referentPlacement = file.createEntity(
			"IfcLocalPlacement",
			null,
			file.createEntity("IfcAxis2Placement2D", file.createEntity("IfcCartesianPoint", [0.0, 0.0])),
		);
		const referent = file.createEntity(
			"IfcReferent",
			guid.new(),
			null,
			null,
			null,
			null,
			referentPlacement,
			null,
			"STATION",
		);
		nest(file, alignment, [referent]);

		expect(() => createRepresentation(file, alignment)).toThrow();

		// The degenerate zero-layout representation was already created for real, and the
		// old placement was already dismantled, before the throw.
		expect(alignment.get("Representation")).not.toBeNull();
	});
});
