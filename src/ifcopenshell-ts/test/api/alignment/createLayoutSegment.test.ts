// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `create_layout_segment.py` (confirmed by reading
// the whole real test directory). Original test coverage written here, pinning the real
// type-checking, real `IfcAlignmentSegment` construction, and real
// `nest.assignObject`/`nest.reorderNesting` side effects that run before the already-
// disclosed, unconditional `_addSegmentToLayout` throw (chunk 7).

import { describe, expect, test } from "vitest";
import { createLayoutSegment } from "../../../src/api/alignment/createLayoutSegment";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function horizontalDesignParameters(file: IfcFile): EntityInstance {
	return file.createEntity(
		"IfcAlignmentHorizontalSegment",
		null,
		null,
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		0.0,
		0.0,
		0.0,
		10.0,
		null,
		"LINE",
	);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.createLayoutSegment (IFC4X3)", () => {
	test("throws TypeError for an unexpected layout entity type", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		expect(() => createLayoutSegment(file, alignment, horizontalDesignParameters(file))).toThrow(
			new TypeError(
				"Expected entity type to be one of ['IfcAlignmentHorizontal', 'IfcAlignmentVertical', 'IfcAlignmentCant'], instead received IfcAlignment",
			),
		);
	});

	test("throws TypeError when designParameters doesn't match layout's expected type", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		const verticalDesignParameters = file.createEntity(
			"IfcAlignmentVerticalSegment",
			null,
			null,
			0.0,
			10.0,
			0.0,
			0.0,
			0.0,
			null,
			"CONSTANTGRADIENT",
		);

		expect(() => createLayoutSegment(file, horizontal, verticalDesignParameters)).toThrow(
			new TypeError("Expected design_parameters to be IfcAlignmentHorizontalSegment"),
		);
	});

	test("creates a real IfcAlignmentSegment, nests it into the layout, then throws from the already-blocked _addSegmentToLayout", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		const designParameters = horizontalDesignParameters(file);

		expect(() => createLayoutSegment(file, horizontal, designParameters)).toThrow(/_getSegmentEndpoint/);

		// The real `IfcAlignmentSegment` was created and nested before the throw.
		const rels = horizontal.get("IsNestedBy") as EntityInstance[];
		expect(rels.length).toBe(1);
		const related = rels[0].get("RelatedObjects") as EntityInstance[];
		expect(related.length).toBe(1);
		expect(related[0].isA()).toBe("IfcAlignmentSegment");
		expect((related[0].get("DesignParameters") as EntityInstance).identity()).toBe(designParameters.identity());
	});
});
