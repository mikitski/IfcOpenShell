// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/alignment/test_get_basis_curve.py`
// (src/ifcopenshell-python). Real Python's own fixture builds a full alignment via
// `ifcopenshell.api.alignment.create(...)` -- not in this chunk's scope (a much
// larger, later chunk with its own geometry-generation dependencies). This port
// builds the exact `IfcProductDefinitionShape` -> `IfcShapeRepresentation` shape
// `get_basis_curve`'s own logic reads directly (see `./getCurve.test.ts`'s own header
// comment for the identical substitution rationale), then ports the real test's own
// assertion verbatim: `get_basis_curve(alignment).is_a("IfcCompositeCurve")` for each
// of the 3 real `_test_horizontal`/`_test_horizontal_and_vertical`/
// `_test_horizontal_and_vertical_and_cant` scenarios (all 3 share the same basis-curve
// shape in real Python: only the alignment's OWN geometric representation matters,
// not whether it also has vertical/cant layouts -- reproduced here as one
// representation-shape test, since this chunk doesn't yet port anything that would
// make the 3 scenarios diverge). Also covers the 2 real Python quirks
// `../../../src/api/alignment/getBasisCurve.ts`'s own header comment discloses (the
// `FootPrint`+`Curve2D` alternate match, and the un-filtered `Decomposes[0]` parent
// recursion), neither of which is exercised by real Python's own test suite. Gated to
// IFC4X3 (`describe.skipIf`, matching real Python's own `IFC4X3_AVAILABLE` guard).

import { describe, expect, test } from "vitest";
import { getBasisCurve } from "../../../src/api/alignment/getBasisCurve";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function create3dContext(file: IfcFile): EntityInstance {
	const origin = file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0, 0, 0]));
	return file.createEntity("IfcGeometricRepresentationContext", null, "Model", 3, 1.0e-5, origin);
}

function addRepresentation(
	file: IfcFile,
	product: EntityInstance,
	identifier: string,
	representationType: string,
	items: readonly EntityInstance[],
): void {
	const shapeRepresentation = file.createEntity(
		"IfcShapeRepresentation",
		create3dContext(file),
		identifier,
		representationType,
		[...items],
	);
	product.set("Representation", file.createEntity("IfcProductDefinitionShape", null, null, [shapeRepresentation]));
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getBasisCurve (IFC4X3)", () => {
	test.each([
		["Axis" as const, "Curve2D" as const],
		["FootPrint" as const, "Curve2D" as const],
		["Axis" as const, "Curve3D" as const],
	])("%s/%s representation resolves to the IfcCompositeCurve basis curve", (identifier, representationType) => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const compositeCurve = file.createEntity("IfcCompositeCurve", [], false);
		addRepresentation(file, alignment, identifier, representationType, [compositeCurve]);

		const basisCurve = getBasisCurve(alignment);
		expect(basisCurve?.isA("IfcCompositeCurve")).toBe(true);
		expect(basisCurve?.equals(compositeCurve)).toBe(true);
	});

	test("recurses to the parent alignment's own basis curve when this alignment has none (Decomposes[0], unfiltered)", () => {
		const file = createTestFile("IFC4X3");
		const parent = file.createEntity("IfcAlignment", guid.new(), null, "Parent");
		const compositeCurve = file.createEntity("IfcCompositeCurve", [], false);
		addRepresentation(file, parent, "Axis", "Curve2D", [compositeCurve]);
		const child = file.createEntity("IfcAlignment", guid.new(), null, "Child");
		file.createEntity("IfcRelAggregates", guid.new(), null, null, null, parent, [child]);

		expect(getBasisCurve(child)?.equals(compositeCurve)).toBe(true);
	});

	test("returns null when nothing matches and there is no parent alignment", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");

		expect(getBasisCurve(alignment)).toBeNull();
	});
});
