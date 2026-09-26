// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `_map_alignment_segment.py` (confirmed by
// reading the whole real test directory) -- its own real callers are out of this
// chunk's scope. Original test coverage written here, gated to IFC4X3.
//
// Rather than mocking the 3 underlying `_map*Segment` functions (this project has no
// established mocking convention for this module), dispatch correctness is verified
// via REAL behavioral differences between the 3 `IfcAlignment*Segment`
// `DesignParameters` shapes: an `IfcAlignmentHorizontalSegment` has no
// `StartDistAlong` attribute and an `IfcAlignmentVerticalSegment` has no `StartPoint`
// attribute, so routing to the WRONG underlying mapper throws a real
// "has no attribute" `Error` (`entityInstance.ts`'s own `.get()` behavior) rather than
// silently producing a plausible-looking result.

import { describe, expect, test } from "vitest";
import { _mapAlignmentSegment } from "../../../src/api/alignment/_mapAlignmentSegment";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function alignmentSegment(file: IfcFile, designParameters: EntityInstance): EntityInstance {
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._mapAlignmentSegment (IFC4X3)", () => {
	test("IfcAlignmentHorizontal layout dispatches to _mapAlignmentHorizontalSegment", () => {
		const file = createTestFile("IFC4X3");
		const layout = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const startPoint = file.createEntity("IfcCartesianPoint", [1, 2]);
		const designParameters = file.createEntity(
			"IfcAlignmentHorizontalSegment",
			null,
			null,
			startPoint,
			0.0,
			0.0,
			0.0,
			10.0,
			null,
			"LINE",
		);
		const segment = alignmentSegment(file, designParameters);

		const [curveSegment, second] = _mapAlignmentSegment(file, layout, segment);
		expect(second).toBeNull();
		expect(curveSegment.isA()).toBe("IfcCurveSegment");
		expect((curveSegment.get("ParentCurve") as EntityInstance).isA()).toBe("IfcLine");
		const placement = curveSegment.get("Placement") as EntityInstance;
		expect((placement.get("Location") as EntityInstance).equals(startPoint)).toBe(true);
	});

	test("IfcAlignmentVertical layout dispatches to _mapAlignmentVerticalSegment", () => {
		const file = createTestFile("IFC4X3");
		const layout = file.createEntity("IfcAlignmentVertical", guid.new(), null, "V1");
		const designParameters = file.createEntity(
			"IfcAlignmentVerticalSegment",
			null,
			null,
			0.0,
			100.0,
			5.0,
			0.5,
			0.5,
			null,
			"CONSTANTGRADIENT",
		);
		const segment = alignmentSegment(file, designParameters);

		const [curveSegment, second] = _mapAlignmentSegment(file, layout, segment);
		expect(second).toBeNull();
		expect((curveSegment.get("ParentCurve") as EntityInstance).isA()).toBe("IfcLine");
		const placement = curveSegment.get("Placement") as EntityInstance;
		// Vertical placement builds a FRESH IfcCartesianPoint at (StartDistAlong,
		// StartHeight), unlike horizontal's own StartPoint pass-through.
		expect((placement.get("Location") as EntityInstance).get("Coordinates")).toEqual([0.0, 5.0]);
	});

	test("any other layout (IfcAlignmentCant) dispatches to _mapAlignmentCantSegment with layout.RailHeadDistance", () => {
		const file = createTestFile("IFC4X3");
		const layout = file.createEntity("IfcAlignmentCant", guid.new(), null, "C1");
		layout.set("RailHeadDistance", 1.5);
		const designParameters = file.createEntity(
			"IfcAlignmentCantSegment",
			null,
			null,
			0.0,
			100.0,
			0.02,
			null,
			0.02,
			null,
			"CONSTANTCANT",
		);
		const segment = alignmentSegment(file, designParameters);

		const [curveSegment, second] = _mapAlignmentSegment(file, layout, segment);
		expect(second).toBeNull();
		const placement = curveSegment.get("Placement") as EntityInstance;
		expect(placement.isA()).toBe("IfcAxis2Placement3D");
	});

	test("real Python's own unguarded RailHeadDistance access: a layout with no RailHeadDistance attribute crashes, matching real Python's AttributeError", () => {
		const file = createTestFile("IFC4X3");
		// IfcAlignmentHorizontal/IfcAlignmentVertical are the only 2 branches
		// explicitly checked; anything else (including a nonsensical layout) falls
		// through to the unconditional `layout.RailHeadDistance` read -- ported
		// verbatim, no `is_a("IfcAlignmentCant")` guard invented here (see this file's
		// own header comment / `_mapAlignmentSegment.ts`'s own header comment).
		const notALayout = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
		const designParameters = file.createEntity(
			"IfcAlignmentCantSegment",
			null,
			null,
			0.0,
			100.0,
			0.0,
			null,
			0.0,
			null,
			"CONSTANTCANT",
		);
		const segment = alignmentSegment(file, designParameters);

		expect(() => _mapAlignmentSegment(file, notALayout, segment)).toThrow(/has no attribute 'RailHeadDistance'/);
	});
});
