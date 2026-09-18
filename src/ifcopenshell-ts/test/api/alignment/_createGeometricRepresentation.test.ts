// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `_create_geometric_representation.py`
// (confirmed by reading the whole real test directory) -- its own real callers
// (`create`/`create_by_pi_method`) are both out of this chunk's scope. Original test
// coverage written here, gated to IFC4X3, matching this module's established
// hand-rolled-fixture pattern.

import { describe, expect, test } from "vitest";
import { _createGeometricRepresentation } from "../../../src/api/alignment/_createGeometricRepresentation";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function nest(file: IfcFile, relatingObject: EntityInstance, relatedObjects: readonly EntityInstance[]): void {
	file.createEntity("IfcRelNests", guid.new(), null, null, null, relatingObject, [...relatedObjects]);
}

function aggregate(file: IfcFile, relatingObject: EntityInstance, relatedObjects: readonly EntityInstance[]): void {
	file.createEntity("IfcRelAggregates", guid.new(), null, null, null, relatingObject, [...relatedObjects]);
}

function alignment(file: IfcFile, name: string): EntityInstance {
	return file.createEntity("IfcAlignment", guid.new(), null, name);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._createGeometricRepresentation (IFC4X3)", () => {
	test("throws TypeError for a non-IfcAlignment", () => {
		const file = createTestFile("IFC4X3");
		const notAnAlignment = file.createEntity("IfcSite", guid.new());

		expect(() => _createGeometricRepresentation(file, notAnAlignment)).toThrow(TypeError);
	});

	test("Horizontal only: creates a single Axis/Curve2D IfcCompositeCurve representation", () => {
		const file = createTestFile("IFC4X3");
		const a = alignment(file, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		nest(file, a, [horizontal]);

		_createGeometricRepresentation(file, a);

		const representation = a.get("Representation") as EntityInstance;
		const reps = representation.get("Representations") as EntityInstance[];
		expect(reps).toHaveLength(1);
		expect(reps[0].get("RepresentationIdentifier")).toBe("Axis");
		expect(reps[0].get("RepresentationType")).toBe("Curve2D");
		const items = reps[0].get("Items") as EntityInstance[];
		expect(items[0].isA("IfcCompositeCurve")).toBe(true);
	});

	test("Horizontal + Vertical: creates FootPrint/Curve2D IfcCompositeCurve and Axis/Curve3D IfcGradientCurve", () => {
		const file = createTestFile("IFC4X3");
		const a = alignment(file, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		const vertical = file.createEntity("IfcAlignmentVertical", guid.new());
		nest(file, a, [horizontal, vertical]);

		_createGeometricRepresentation(file, a);

		const reps = (a.get("Representation") as EntityInstance).get("Representations") as EntityInstance[];
		expect(reps).toHaveLength(2);
		expect(reps[0].get("RepresentationIdentifier")).toBe("FootPrint");
		expect(reps[0].get("RepresentationType")).toBe("Curve2D");
		const compositeCurve = (reps[0].get("Items") as EntityInstance[])[0];
		expect(compositeCurve.isA("IfcCompositeCurve")).toBe(true);

		expect(reps[1].get("RepresentationIdentifier")).toBe("Axis");
		expect(reps[1].get("RepresentationType")).toBe("Curve3D");
		const gradientCurve = (reps[1].get("Items") as EntityInstance[])[0];
		expect(gradientCurve.isA("IfcGradientCurve")).toBe(true);
		expect((gradientCurve.get("BaseCurve") as EntityInstance).equals(compositeCurve)).toBe(true);
	});

	test("Horizontal + Vertical + Cant: creates FootPrint/Curve2D and Axis/Curve3D IfcSegmentedReferenceCurve", () => {
		const file = createTestFile("IFC4X3");
		const a = alignment(file, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		const vertical = file.createEntity("IfcAlignmentVertical", guid.new());
		const cant = file.createEntity("IfcAlignmentCant", guid.new(), null, null, null, null, null, null, 0);
		nest(file, a, [horizontal, vertical, cant]);

		_createGeometricRepresentation(file, a);

		const reps = (a.get("Representation") as EntityInstance).get("Representations") as EntityInstance[];
		expect(reps).toHaveLength(2);
		expect(reps[1].get("RepresentationIdentifier")).toBe("Axis");
		expect(reps[1].get("RepresentationType")).toBe("Curve3D");
		const segmentedReferenceCurve = (reps[1].get("Items") as EntityInstance[])[0];
		expect(segmentedReferenceCurve.isA("IfcSegmentedReferenceCurve")).toBe(true);
		const gradientCurve = segmentedReferenceCurve.get("BaseCurve") as EntityInstance;
		expect(gradientCurve.isA("IfcGradientCurve")).toBe(true);
	});

	test("Reusing Horizontal (CT 4.1.4.4.1.2): a parent with only a horizontal layout plus a child gets a single FootPrint/Curve2D representation, and the vertical-only child gets its own Axis/Curve3D representation", () => {
		const file = createTestFile("IFC4X3");
		const parent = alignment(file, "Parent");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		nest(file, parent, [horizontal]);

		const child = alignment(file, "Child");
		aggregate(file, parent, [child]);
		const childVertical = file.createEntity("IfcAlignmentVertical", guid.new());
		nest(file, child, [childVertical]);

		_createGeometricRepresentation(file, parent);

		const parentReps = (parent.get("Representation") as EntityInstance).get("Representations") as EntityInstance[];
		expect(parentReps).toHaveLength(1);
		expect(parentReps[0].get("RepresentationIdentifier")).toBe("FootPrint");
		expect(parentReps[0].get("RepresentationType")).toBe("Curve2D");

		expect(child.get("ObjectPlacement")).toBe(null);

		const childReps = (child.get("Representation") as EntityInstance).get("Representations") as EntityInstance[];
		expect(childReps).toHaveLength(1);
		expect(childReps[0].get("RepresentationIdentifier")).toBe("Axis");
		expect(childReps[0].get("RepresentationType")).toBe("Curve3D");
		const childCurve = (childReps[0].get("Items") as EntityInstance[])[0];
		expect(childCurve.isA("IfcGradientCurve")).toBe(true);
	});

	test("REGRESSION -- a child alignment with both Vertical and Cant layouts hits real Python's own confirmed `creatIfcShapeRepresentation` typo (missing the 'e'), throwing at the exact point the mistyped call would raise AttributeError, after the gradient/segmented-reference curves were already created", () => {
		const file = createTestFile("IFC4X3");
		const parent = alignment(file, "Parent");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		nest(file, parent, [horizontal]);

		const child = alignment(file, "Child");
		aggregate(file, parent, [child]);
		const childVertical = file.createEntity("IfcAlignmentVertical", guid.new());
		const childCant = file.createEntity("IfcAlignmentCant", guid.new(), null, null, null, null, null, null, 0);
		nest(file, child, [childVertical, childCant]);

		expect(() => _createGeometricRepresentation(file, parent)).toThrow(/creatIfcShapeRepresentation is not a function/);

		// The gradient curve and segmented reference curve are created BEFORE the
		// mistyped call is reached -- matching real Python's own line-by-line order.
		expect(file.byType("IfcGradientCurve")).toHaveLength(1);
		expect(file.byType("IfcSegmentedReferenceCurve")).toHaveLength(1);
	});

	test("REGRESSION -- Python's own `assert False` (unreachable, 'can't have more than one vertical and cant in a child alignment') throws when a child has 3 layouts", () => {
		const file = createTestFile("IFC4X3");
		const parent = alignment(file, "Parent");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		nest(file, parent, [horizontal]);

		const child = alignment(file, "Child");
		aggregate(file, parent, [child]);
		const childHorizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());
		const childVertical = file.createEntity("IfcAlignmentVertical", guid.new());
		const childCant = file.createEntity("IfcAlignmentCant", guid.new(), null, null, null, null, null, null, 0);
		nest(file, child, [childHorizontal, childVertical, childCant]);

		expect(() => _createGeometricRepresentation(file, parent)).toThrow(/Unreachable/);
	});

	test("throws the direct AssertionError equivalent when the sole layout isn't IfcAlignmentHorizontal", () => {
		const file = createTestFile("IFC4X3");
		const a = alignment(file, "A1");
		const vertical = file.createEntity("IfcAlignmentVertical", guid.new());
		nest(file, a, [vertical]);

		expect(() => _createGeometricRepresentation(file, a)).toThrow(/Assertion failed/);
	});
});
