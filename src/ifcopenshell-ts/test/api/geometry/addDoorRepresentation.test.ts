// This file was generated with the assistance of an AI coding tool.
//
// `test/api/geometry/test_add_door_representation.py` does not exist anywhere in
// `src/ifcopenshell-python` (confirmed by a repo-wide search) -- no real Python test file
// exists for this module at all. Every test below is original coverage, written directly
// against `add_door_representation.py`'s real source / `../../../src/api/geometry/
// addDoorRepresentation.ts`'s own port.
//
// This module is blocked end-to-end today by 2 independent, disclosed issues, THE SAME SHAPE
// as `addWindowRepresentation.test.ts`'s own (see `addDoorRepresentation.ts`'s own header
// comment for the full writeup):
//
// 1. A genuine, verbatim-preserved upstream-Python evaluation-order BUG that crashes every
//    real call omitting `overallHeight`/`overallWidth` (this file's own documented defaults,
//    2.0m/0.9m -- DIFFERENT from window's 0.9m/0.6m) -- schema-independent, pinned first below.
// 2. Once both dimensions are supplied explicitly, the actual geometry work hits the SAME 2
//    pre-existing, already-tracked `util/shapeBuilder.ts` primitive-layer gaps
//    (`.profile()`'s `Dim`-DERIVED-attribute gap, reached here via `extrude()`'s own internal
//    auto-`.profile()` wrap rather than an explicit call site; `.rectangle()`/
//    `.polyline(closed=true)`'s `IfcLineIndex`/`IfcArcIndex` defined-type-creation gap, the
//    latter IFC2X3-exempt) -- EXCEPT the `PLAN_VIEW` + `ContextIdentifier === "Annotation"`
//    sliding-door arrow-symbol sub-branch, which is genuinely unblocked on every schema (see
//    below) and is pinned with real, non-throwing geometry assertions instead.
//
// Run against `AVAILABLE_SCHEMAS` throughout (no hardcoded schema `describe`); this
// environment's own locally-built native addon currently only registers IFC4 (matching CI's
// own `-DSCHEMA_VERSIONS=4`), so the IFC2X3-only assertions below are written the same way
// `addWindowRepresentation.test.ts` writes them (an `if (schema === "IFC2X3")` branch) but are
// only actually exercised if/when a wider multi-schema addon is used to run this suite.

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import {
	type AddDoorRepresentationSettings,
	type DoorType,
	SUPPORTED_DOOR_TYPES,
	addDoorRepresentation,
	createIfcBox,
	createIfcDoorLining,
	doorLShapeCheck,
} from "../../../src/api/geometry/addDoorRepresentation";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { ShapeBuilder } from "../../../src/util/shapeBuilder";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Matches `../geometry/addWindowRepresentation.test.ts`'s own identical fixture. */
function context(
	file: IfcFile,
	targetView: "MODEL_VIEW" | "PLAN_VIEW" | "ELEVATION_VIEW",
	contextIdentifier?: string,
): EntityInstance {
	createEntity(file, { ifcClass: "IfcProject" });
	const model = addContext(file, { contextType: "Model" });
	return addContext(file, {
		contextType: "Model",
		contextIdentifier: contextIdentifier ?? "Body",
		targetView,
		parent: model,
	});
}

/** The settings-order-bug error (see this file's/`addDoorRepresentation.ts`'s own header comment). */
const SETTINGS_BUG_ERROR = /evaluation-order bug/;
/** `entityInstance.ts`'s own DERIVED-attribute error (`.profile()`'s `Dim` gap, reached here
 * via `extrude()`'s own internal auto-wrap). */
const DIM_ERROR = /has no attribute 'Dim'/;
/** `util/shapeBuilder.ts`'s own defined-type-creation error (`.rectangle()`/
 * `.polyline(closed=true)`'s `IfcLineIndex`/`IfcArcIndex` gap). */
const DEFINED_TYPE_ERROR = /Attribute access is only supported on entity instances/;

const BLOCKED_ERROR = (schema: string): RegExp => (schema === "IFC2X3" ? DIM_ERROR : DEFINED_TYPE_ERROR);

describe.each(AVAILABLE_SCHEMAS)("api.geometry.addDoorRepresentation (%s)", (schema) => {
	test("omitting overallHeight throws the disclosed, verbatim-preserved upstream-Python evaluation-order bug", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");

		expect(() => addDoorRepresentation(file, { context: body, overallWidth: 0.9 })).toThrow(SETTINGS_BUG_ERROR);
		expect(() => addDoorRepresentation(file, { context: body, overallWidth: 0.9 })).toThrow(/overallHeight/);

		file.dispose();
	});

	test("omitting overallWidth (overallHeight supplied) throws the same disclosed bug, naming overallWidth", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");

		expect(() => addDoorRepresentation(file, { context: body, overallHeight: 2.0 })).toThrow(SETTINGS_BUG_ERROR);
		expect(() => addDoorRepresentation(file, { context: body, overallHeight: 2.0 })).toThrow(/overallWidth/);

		file.dispose();
	});

	test("omitting both throws for overallHeight first -- matches real Python's own dict-literal key evaluation order", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");

		expect(() => addDoorRepresentation(file, { context: body })).toThrow(/overallHeight/);

		file.dispose();
	});

	test("an explicit null for either dimension is treated the same as omitting it", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");

		expect(() => addDoorRepresentation(file, { context: body, overallHeight: null, overallWidth: 0.9 })).toThrow(
			/overallHeight/,
		);

		file.dispose();
	});

	test("ELEVATION_VIEW: throws the disclosed geometry blocker once both dimensions are supplied (bypassing the settings bug)", () => {
		const file = createTestFile(schema);
		const body = context(file, "ELEVATION_VIEW");

		expect(() => addDoorRepresentation(file, { context: body, overallHeight: 2.0, overallWidth: 0.9 })).toThrow(
			BLOCKED_ERROR(schema),
		);

		file.dispose();
	});

	test("PLAN_VIEW (non-Annotation): throws the disclosed geometry blocker once both dimensions are supplied", () => {
		const file = createTestFile(schema);
		const body = context(file, "PLAN_VIEW");

		expect(() => addDoorRepresentation(file, { context: body, overallHeight: 2.0, overallWidth: 0.9 })).toThrow(
			BLOCKED_ERROR(schema),
		);

		file.dispose();
	});

	if (schema === "IFC2X3") {
		test("PLAN_VIEW on IFC2X3: every lining/panel polyline/rectangle actually succeeds before the final blocked call -- real, measurable progress, not an immediate throw", () => {
			const file = createTestFile(schema);
			const body = context(file, "PLAN_VIEW");

			const polylinesBefore = file.byType("IfcPolyline").length;
			expect(() => addDoorRepresentation(file, { context: body, overallHeight: 2.0, overallWidth: 0.9 })).toThrow(
				DIM_ERROR,
			);
			const polylinesAfter = file.byType("IfcPolyline").length;
			// A single-swing door's 2D representation builds: 1 lining rectangle + 1 mirrored
			// copy + a swing-arc rectangle -- several real IfcPolylines were created before the
			// final getRepresentation() call threw.
			expect(polylinesAfter).toBeGreaterThan(polylinesBefore + 1);

			file.dispose();
		});
	}

	test("PLAN_VIEW + Annotation, non-sliding door: returns null (matches real Python's own None return), no throw", () => {
		const file = createTestFile(schema);
		const body = context(file, "PLAN_VIEW", "Annotation");

		const result = addDoorRepresentation(file, {
			context: body,
			overallHeight: 2.0,
			overallWidth: 0.9,
			operationType: "SINGLE_SWING_LEFT",
		});

		expect(result).toBeNull();

		file.dispose();
	});

	test("PLAN_VIEW + Annotation, sliding door: genuinely UNBLOCKED -- produces a real, non-throwing Curve2D representation", () => {
		const file = createTestFile(schema);
		const body = context(file, "PLAN_VIEW", "Annotation");

		const representation = addDoorRepresentation(file, {
			context: body,
			overallHeight: 2.0,
			overallWidth: 0.9,
			operationType: "SLIDING_TO_LEFT",
		});

		expect(representation).not.toBeNull();
		const rep = representation as EntityInstance;
		expect(rep.get("RepresentationType")).toBe("Curve2D");
		expect((rep.get("ContextOfItems") as EntityInstance).equals(body)).toBe(true);

		const items = rep.get("Items") as EntityInstance[];
		expect(items).toHaveLength(2);

		const builder = new ShapeBuilder(file);
		const line = builder.getPolylineCoords(items[0]);
		const arrow = builder.getPolylineCoords(items[1]);

		// The first item is a horizontal 2-point line (a straight segment along the sliding
		// direction).
		expect(line).toHaveLength(2);
		expect(line[0][1]).toBeCloseTo(line[1][1], 10);
		expect(line[0][0]).not.toBeCloseTo(line[1][0], 10);

		// The second item is the 3-point arrowhead: its 2 "wing" points (index 0 and 2) are
		// mirrored around the middle point (index 1) on the Y axis.
		expect(arrow).toHaveLength(3);
		expect(arrow[0][1] - arrow[1][1]).toBeCloseTo(-(arrow[2][1] - arrow[1][1]), 10);
		expect(arrow[0][0]).toBeCloseTo(arrow[2][0], 10);

		file.dispose();
	});

	test("PLAN_VIEW + Annotation: SLIDING_TO_LEFT and SLIDING_TO_RIGHT produce IDENTICAL geometry -- a real, disclosed Python-source quirk (door_swing_type is never computed/read in this early-return branch, unlike every other branch)", () => {
		const fileLeft = createTestFile(schema);
		const bodyLeft = context(fileLeft, "PLAN_VIEW", "Annotation");
		const repLeft = addDoorRepresentation(fileLeft, {
			context: bodyLeft,
			overallHeight: 2.0,
			overallWidth: 0.9,
			operationType: "SLIDING_TO_LEFT",
		}) as EntityInstance;

		const fileRight = createTestFile(schema);
		const bodyRight = context(fileRight, "PLAN_VIEW", "Annotation");
		const repRight = addDoorRepresentation(fileRight, {
			context: bodyRight,
			overallHeight: 2.0,
			overallWidth: 0.9,
			operationType: "SLIDING_TO_RIGHT",
		}) as EntityInstance;

		const builderLeft = new ShapeBuilder(fileLeft);
		const builderRight = new ShapeBuilder(fileRight);
		const lineLeft = builderLeft.getPolylineCoords((repLeft.get("Items") as EntityInstance[])[0]);
		const lineRight = builderRight.getPolylineCoords((repRight.get("Items") as EntityInstance[])[0]);
		const arrowLeft = builderLeft.getPolylineCoords((repLeft.get("Items") as EntityInstance[])[1]);
		const arrowRight = builderRight.getPolylineCoords((repRight.get("Items") as EntityInstance[])[1]);

		expect(lineRight).toEqual(lineLeft);
		expect(arrowRight).toEqual(arrowLeft);

		fileLeft.dispose();
		fileRight.dispose();
	});

	test.each(SUPPORTED_DOOR_TYPES)(
		"MODEL_VIEW (default target view): operationType %s throws the disclosed blocked-geometry error for this schema",
		(operationType) => {
			const file = createTestFile(schema);
			const body = context(file, "MODEL_VIEW");

			expect(() =>
				addDoorRepresentation(file, {
					context: body,
					overallHeight: 2.0,
					overallWidth: 0.9,
					operationType,
				}),
			).toThrow(BLOCKED_ERROR(schema));

			file.dispose();
		},
	);

	test("MODEL_VIEW: a partOfProduct is accepted (never itself the cause of a different error) -- still blocked at the same disclosed geometry point", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");
		const door = createEntity(file, { ifcClass: "IfcDoor" });
		const productShape = file.createEntity("IfcProductDefinitionShape", null, null, []);
		door.set("Representation", productShape);

		expect(() =>
			addDoorRepresentation(file, {
				context: body,
				overallHeight: 2.0,
				overallWidth: 0.9,
				partOfProduct: productShape,
			}),
		).toThrow(BLOCKED_ERROR(schema));

		file.dispose();
	});

	test("custom liningProperties/panelProperties are accepted without changing which class of error is thrown", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");

		expect(() =>
			addDoorRepresentation(file, {
				context: body,
				overallHeight: 2.1,
				overallWidth: 1.0,
				liningProperties: { liningDepth: 0.1, liningThickness: 0.08, transomThickness: 0.05 },
				panelProperties: { frameDepth: 0.05, frameThickness: 0.04, panelWidth: 0.9 },
			}),
		).toThrow(BLOCKED_ERROR(schema));

		file.dispose();
	});

	test("createIfcDoorLining (exported, matches real Python's public create_ifc_door_lining): the closed polyline is what's actually blocked on IFC4/IFC4X3 -- Dim gap (via extrude()'s auto-profile wrap) is reached only on IFC2X3", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		expect(() => createIfcDoorLining(builder, [1.0, 0.05, 2.0], [0.05, 0.05])).toThrow(BLOCKED_ERROR(schema));

		file.dispose();
	});

	test("createIfcBox (exported, matches real Python's public create_ifc_box): blocked the same way via its own rectangle()/extrude() call", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		expect(() => createIfcBox(builder, [0.9, 0.1, 0.03])).toThrow(BLOCKED_ERROR(schema));

		file.dispose();
	});
});

describe("api.geometry.addDoorRepresentation -- schema-agnostic pure-logic coverage", () => {
	test("SUPPORTED_DOOR_TYPES has all 9 real DOOR_TYPE values", () => {
		expect(SUPPORTED_DOOR_TYPES).toHaveLength(9);
		const expected: DoorType[] = [
			"SINGLE_SWING_LEFT",
			"SINGLE_SWING_RIGHT",
			"DOUBLE_SWING_RIGHT",
			"DOUBLE_SWING_LEFT",
			"DOUBLE_DOOR_SINGLE_SWING",
			"DOUBLE_DOOR_DOUBLE_SWING",
			"SLIDING_TO_LEFT",
			"SLIDING_TO_RIGHT",
			"DOUBLE_DOOR_SLIDING",
		];
		expect([...SUPPORTED_DOOR_TYPES]).toEqual(expected);
	});

	test("doorLShapeCheck: liningToPanelOffsetYFull >= liningDepth is never an L shape, regardless of thickness/offset", () => {
		expect(doorLShapeCheck(0.05, 0.05, 0.01, [0.05])).toBe(false);
		expect(doorLShapeCheck(0.06, 0.05, 0.0, [1.0])).toBe(false);
	});

	test("doorLShapeCheck: an L shape requires liningToPanelOffsetYFull < liningDepth AND some thickness greater than the single offset", () => {
		// offsetYFull < depth, but every thickness <= the offset -> not an L shape.
		expect(doorLShapeCheck(0.02, 0.05, 0.05, [0.03, 0.04])).toBe(false);
		// offsetYFull < depth, and one thickness > the offset -> an L shape.
		expect(doorLShapeCheck(0.02, 0.05, 0.02, [0.01, 0.05])).toBe(true);
	});

	test.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))(
		"createIfcDoorLining accepts a single scalar thickness (applied to both SIDE and TOP), matching real Python's Union[list[float], float]",
		() => {
			const file = createTestFile("IFC4");
			const builder = new ShapeBuilder(file);

			// Same disclosed blocker either way -- this just confirms the scalar-vs-list call
			// shape doesn't change which error is thrown.
			expect(() => createIfcDoorLining(builder, [1.0, 0.05, 2.0], 0.05)).toThrow(DEFINED_TYPE_ERROR);

			file.dispose();
		},
	);
});
