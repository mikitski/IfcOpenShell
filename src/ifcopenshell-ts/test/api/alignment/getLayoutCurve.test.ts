// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/alignment/test_get_layout_curve.py`
// (src/ifcopenshell-python). Real Python's own fixture builds a full alignment via
// `ifcopenshell.api.alignment.create(...)` (which internally generates the real
// `IfcCompositeCurve`/`IfcGradientCurve`/`IfcSegmentedReferenceCurve` geometric
// representation) -- not in this chunk's scope (a much larger, later chunk with its
// own geometry-generation dependencies). This port instead builds the exact
// `IfcProductDefinitionShape` -> `IfcShapeRepresentation` -> `Items` shape
// `get_curve`'s own logic reads directly (matching `./getCurve.test.ts`'s own
// established substitution rationale), then nests horizontal/vertical/cant layouts
// to the alignment and ports the real test's own assertion shape verbatim (each of
// the 3 real `include_vertical`/`include_cant` scenarios): a horizontal layout
// always resolves to the alignment's own `IfcCompositeCurve` (unwrapping a
// `IfcGradientCurve`/`IfcSegmentedReferenceCurve`'s own `BaseCurve`(`.BaseCurve`) as
// needed); a vertical layout resolves to the `IfcGradientCurve` (unwrapping a
// `IfcSegmentedReferenceCurve`'s own `BaseCurve`); a cant layout resolves to the
// `IfcSegmentedReferenceCurve` UNMODIFIED (real Python has no `elif
// layout.is_a("IfcAlignmentCant")` branch at all -- not a bug, matching the
// function's own docstring: an alignment with a cant layout always has an
// `IfcSegmentedReferenceCurve` as its OWN representation curve already, so no
// unwrapping is ever needed for that case). Gated to IFC4X3 (`describe.skipIf`,
// matching real Python's own `IFC4X3_AVAILABLE` guard).

import { describe, expect, test } from "vitest";
import { getLayoutCurve } from "../../../src/api/alignment/getLayoutCurve";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function create3dContext(file: IfcFile): EntityInstance {
	const origin = file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0, 0, 0]));
	return file.createEntity("IfcGeometricRepresentationContext", null, "Model", 3, 1.0e-5, origin);
}

/** Gives `alignment` a single "Axis"/"Curve2D" `IfcShapeRepresentation` whose sole
 * `Items` entry is `curve`. */
function addAxisRepresentation(file: IfcFile, alignment: EntityInstance, curve: EntityInstance): void {
	const shapeRepresentation = file.createEntity("IfcShapeRepresentation", create3dContext(file), "Axis", "Curve2D", [
		curve,
	]);
	alignment.set("Representation", file.createEntity("IfcProductDefinitionShape", null, null, [shapeRepresentation]));
}

/** Nests `layout` to `alignment` via a fresh `IfcRelNests` (matching
 * `../../../src/api/alignment/getAlignment.ts`'s own `Nests` lookup). */
function nestLayout(file: IfcFile, alignment: EntityInstance, layout: EntityInstance): void {
	file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [layout]);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getLayoutCurve (IFC4X3)", () => {
	test("horizontal-only: horizontal layout resolves to the alignment's own IfcCompositeCurve", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const compositeCurve = file.createEntity("IfcCompositeCurve", [], false);
		addAxisRepresentation(file, alignment, compositeCurve);
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		nestLayout(file, alignment, horizontal);

		const curve = getLayoutCurve(horizontal);
		expect(curve?.isA("IfcCompositeCurve")).toBe(true);
		expect(curve?.equals(compositeCurve)).toBe(true);
	});

	test("horizontal+vertical: horizontal unwraps IfcGradientCurve.BaseCurve; vertical resolves to the IfcGradientCurve itself", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const compositeCurve = file.createEntity("IfcCompositeCurve", [], false);
		const gradientCurve = file.createEntity("IfcGradientCurve", [], false, compositeCurve, null);
		addAxisRepresentation(file, alignment, gradientCurve);
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		nestLayout(file, alignment, horizontal);
		const vertical = file.createEntity("IfcAlignmentVertical", guid.new(), null, "V1");
		nestLayout(file, alignment, vertical);

		expect(getLayoutCurve(horizontal)?.equals(compositeCurve)).toBe(true);
		expect(getLayoutCurve(vertical)?.equals(gradientCurve)).toBe(true);
	});

	test("horizontal+vertical+cant: horizontal/vertical unwrap through IfcSegmentedReferenceCurve; cant resolves to it unmodified", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const compositeCurve = file.createEntity("IfcCompositeCurve", [], false);
		const gradientCurve = file.createEntity("IfcGradientCurve", [], false, compositeCurve, null);
		const segmentedReferenceCurve = file.createEntity("IfcSegmentedReferenceCurve", [], false, gradientCurve, null);
		addAxisRepresentation(file, alignment, segmentedReferenceCurve);
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		nestLayout(file, alignment, horizontal);
		const vertical = file.createEntity("IfcAlignmentVertical", guid.new(), null, "V1");
		nestLayout(file, alignment, vertical);
		const cant = file.createEntity("IfcAlignmentCant", guid.new(), null, "C1", null, null, null, null, 1.5);
		nestLayout(file, alignment, cant);

		expect(getLayoutCurve(horizontal)?.equals(compositeCurve)).toBe(true);
		expect(getLayoutCurve(vertical)?.equals(gradientCurve)).toBe(true);
		// No `elif` branch for IfcAlignmentCant in real Python -- the cant layout's own
		// curve is the alignment's own representation curve, unmodified.
		expect(getLayoutCurve(cant)?.equals(segmentedReferenceCurve)).toBe(true);
	});

	test("returns null when the alignment has no representation at all", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		nestLayout(file, alignment, horizontal);

		expect(getLayoutCurve(horizontal)).toBeNull();
	});
});
