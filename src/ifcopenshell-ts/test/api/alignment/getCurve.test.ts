// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/alignment/test_get_curve.py` (src/ifcopenshell-python).
// Real Python's own fixture builds a full alignment via
// `ifcopenshell.api.alignment.create(...)` (which internally generates the real
// `IfcCompositeCurve`/`IfcGradientCurve`/`IfcSegmentedReferenceCurve` geometric
// representation) -- not in this chunk's scope (a much larger, later chunk with its
// own geometry-generation dependencies, `create_representation`/
// `create_segment_representations`/etc.). This port instead builds the exact
// `IfcProductDefinitionShape` -> `IfcShapeRepresentation` -> `Items` shape
// `get_curve`'s own logic reads directly, with a placeholder curve entity standing in
// for the real generated one -- `get_curve` itself never inspects the curve's own
// content, only the enclosing `RepresentationIdentifier`/`RepresentationType`/`Items`
// shape, so this substitution exercises the identical code path. Ports the real
// test's own assertion shape (Curve2D -> `IfcCompositeCurve`, Curve3D-labelled variant
// also covered) without depending on the unported curve-generation chain. Gated to
// IFC4X3 (`describe.skipIf`, matching real Python's own `IFC4X3_AVAILABLE` guard --
// `IfcAlignment` itself is IFC4X3-only).

import { describe, expect, test } from "vitest";
import { getCurve } from "../../../src/api/alignment/getCurve";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function create3dContext(file: IfcFile): EntityInstance {
	const origin = file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0, 0, 0]));
	return file.createEntity("IfcGeometricRepresentationContext", null, "Model", 3, 1.0e-5, origin);
}

/** Gives `alignment` a single "Axis" `IfcShapeRepresentation` of the given
 * `representationType`, whose sole `Items` entry is `curve`. */
function addAxisRepresentation(
	file: IfcFile,
	alignment: EntityInstance,
	representationType: "Curve2D" | "Curve3D",
	curve: EntityInstance,
): void {
	const shapeRepresentation = file.createEntity(
		"IfcShapeRepresentation",
		create3dContext(file),
		"Axis",
		representationType,
		[curve],
	);
	alignment.set("Representation", file.createEntity("IfcProductDefinitionShape", null, null, [shapeRepresentation]));
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getCurve (IFC4X3)", () => {
	test("returns Items[0] of the Axis/Curve2D representation (horizontal-only shape)", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const compositeCurve = file.createEntity("IfcCompositeCurve", [], false);
		addAxisRepresentation(file, alignment, "Curve2D", compositeCurve);

		expect(getCurve(alignment)?.isA("IfcCompositeCurve")).toBe(true);
		expect(getCurve(alignment)?.equals(compositeCurve)).toBe(true);
	});

	test("returns Items[0] of the Axis/Curve3D representation too", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const gradientCurve = file.createEntity(
			"IfcGradientCurve",
			[],
			false,
			file.createEntity("IfcCompositeCurve", [], false),
			null,
		);
		addAxisRepresentation(file, alignment, "Curve3D", gradientCurve);

		expect(getCurve(alignment)?.equals(gradientCurve)).toBe(true);
	});

	test("returns null when the alignment has no representation at all", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");

		expect(getCurve(alignment)).toBeNull();
	});

	test("returns null when no representation matches Axis+Curve2D/Curve3D (e.g. a FootPrint identifier instead)", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const footprint = file.createEntity("IfcShapeRepresentation", create3dContext(file), "FootPrint", "Curve2D", [
			file.createEntity("IfcCompositeCurve", [], false),
		]);
		alignment.set("Representation", file.createEntity("IfcProductDefinitionShape", null, null, [footprint]));

		expect(getCurve(alignment)).toBeNull();
	});
});
