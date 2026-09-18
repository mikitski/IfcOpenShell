// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `_add_zero_length_segment.py` (confirmed by
// reading the whole real test directory) -- its own real caller (`create()`) is out of
// this chunk's scope. Original test coverage written here, gated to IFC4X3.
//
// Since `addZeroLengthSegment` (this chunk's own file 5) is only conditionally
// blocked, this plain 2-call wrapper inherits that same conditional behavior for
// both of its own calls -- see `_addZeroLengthSegment.ts`'s own header comment. Tests
// below confirm: (1) a layout nested to a real `IfcAlignment` that has NO
// representation at all fully succeeds calling only ONE of the 2 real calls (the
// second is skipped, since `getLayoutCurve` returns `null` gracefully in that specific
// shape -- see below); (2) a layout WITH an associated, equally-empty curve fully
// succeeds calling BOTH; (3) a non-empty side (either layout or curve) propagates the
// disclosed throw.
//
// A layout with NO `IfcAlignment` nesting it AT ALL is a DIFFERENT, already-disclosed
// case, NOT exercised as a "success" scenario here: `getLayoutCurve.ts`'s own header
// comment already discloses that `get_layout_curve`'s own unguarded `get_curve(get_
// alignment(layout))` crashes (a real Python `AttributeError`, this port's equivalent
// "Cannot read properties of null" `TypeError`) the instant `getAlignment(layout)`
// itself returns `null` -- so `_addZeroLengthSegment` on such a layout crashes at its
// own `getLayoutCurve` call, AFTER its first `addZeroLengthSegment(file, layout)` call
// already ran for real. This is the SAME already-tracked gap, not a new one -- no new
// `TODOS.md` entry needed, matching this module's own "don't duplicate an existing
// entry" convention.

import { describe, expect, test } from "vitest";
import { _addZeroLengthSegment } from "../../../src/api/alignment/_addZeroLengthSegment";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function create3dContext(file: IfcFile): EntityInstance {
	const origin = file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0, 0, 0]));
	return file.createEntity("IfcGeometricRepresentationContext", null, "Model", 3, 1.0e-5, origin);
}

/** Gives `alignment` a single "Axis"/"Curve2D" `IfcShapeRepresentation` whose sole
 * `Items` entry is `curve` -- matching `getLayoutCurve.test.ts`'s own established
 * fixture helper. */
function addAxisRepresentation(file: IfcFile, alignment: EntityInstance, curve: EntityInstance): void {
	const shapeRepresentation = file.createEntity("IfcShapeRepresentation", create3dContext(file), "Axis", "Curve2D", [
		curve,
	]);
	alignment.set("Representation", file.createEntity("IfcProductDefinitionShape", null, null, [shapeRepresentation]));
}

function nestLayout(file: IfcFile, alignment: EntityInstance, layout: EntityInstance): void {
	file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [layout]);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._addZeroLengthSegment (IFC4X3)", () => {
	test("throws TypeError for an unexpected layout entity type", () => {
		const file = createTestFile("IFC4X3");
		const notALayout = file.createEntity("IfcCompositeCurve");

		expect(() => _addZeroLengthSegment(file, notALayout)).toThrow(
			new TypeError(
				"Expected layout type to be one of ['IfcAlignmentHorizontal', 'IfcAlignmentVertical', 'IfcAlignmentCant'], instead received IfcCompositeCurve",
			),
		);
	});

	test("a layout nested to a real IfcAlignment with NO representation at all: only the layout call runs (getLayoutCurve gracefully returns null via getCurve, the curve call is skipped)", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A0");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		nestLayout(file, alignment, horizontal);

		expect(() => _addZeroLengthSegment(file, horizontal)).not.toThrow();

		const rels = horizontal.get("IsNestedBy") as EntityInstance[];
		expect(rels.length).toBe(1);
		expect((rels[0].get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});

	test("a layout with NO IfcAlignment nesting it at all: the layout call still runs for real, then crashes at the ALREADY-disclosed getLayoutCurve gap (getAlignment returns null)", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");

		expect(() => _addZeroLengthSegment(file, horizontal)).toThrow();

		// The layout-side call ran and succeeded for real before the crash.
		const rels = horizontal.get("IsNestedBy") as EntityInstance[];
		expect(rels.length).toBe(1);
		expect((rels[0].get("RelatedObjects") as EntityInstance[]).length).toBe(1);
	});

	test("a layout WITH an equally-empty associated curve: BOTH real addZeroLengthSegment calls succeed", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const compositeCurve = file.createEntity("IfcCompositeCurve", [], false);
		addAxisRepresentation(file, alignment, compositeCurve);
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		nestLayout(file, alignment, horizontal);

		expect(() => _addZeroLengthSegment(file, horizontal)).not.toThrow();

		expect((horizontal.get("IsNestedBy") as EntityInstance[]).length).toBe(1);
		expect((compositeCurve.get("Segments") as EntityInstance[]).length).toBe(1);
	});

	test("a non-empty layout propagates addZeroLengthSegment's own disclosed _getSegmentEndpoint throw", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const designParameters = file.createEntity(
			"IfcAlignmentHorizontalSegment",
			null,
			null,
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			0.0,
			0.0,
			0.0,
			25.0,
			null,
			"LINE",
		);
		const segment = file.createEntity(
			"IfcAlignmentSegment",
			guid.new(),
			null,
			null,
			null,
			null,
			null,
			null,
			designParameters,
		);
		file.createEntity("IfcRelNests", guid.new(), null, null, null, horizontal, [segment]);

		expect(() => _addZeroLengthSegment(file, horizontal)).toThrow(/_getSegmentEndpoint/);
	});

	test("an empty layout with a NON-empty associated curve propagates the throw from the curve-side call", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A2");
		const placement = file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		);
		const parentCurve = file.createEntity(
			"IfcLine",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0),
		);
		const existingSegment = file.createEntity("IfcCurveSegment", "DISCONTINUOUS", placement, 0.0, 5.0, parentCurve);
		const compositeCurve = file.createEntity("IfcCompositeCurve", [existingSegment], false);
		addAxisRepresentation(file, alignment, compositeCurve);
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H2");
		nestLayout(file, alignment, horizontal);

		expect(() => _addZeroLengthSegment(file, horizontal)).toThrow(/_getSegmentEndpoint/);
		// The layout-side call ran and succeeded for real before the curve-side call threw.
		expect((horizontal.get("IsNestedBy") as EntityInstance[]).length).toBe(1);
	});
});
