// This file was generated with the assistance of an AI coding tool.
//
// `test/api/geometry/test_add_door_representation.py` does not exist anywhere in
// `src/ifcopenshell-python` (confirmed by a repo-wide search) -- no real Python test file
// exists for this module at all. Every test below is original coverage, written directly
// against `add_door_representation.py`'s real source / `../../../src/api/geometry/
// addDoorRepresentation.ts`'s own port.
//
// This module was blocked end-to-end by 2 independent, disclosed issues, THE SAME SHAPE
// as `addWindowRepresentation.test.ts`'s own (see `addDoorRepresentation.ts`'s own header
// comment for the full writeup):
//
// 1. A genuine, verbatim-preserved upstream-Python evaluation-order BUG that crashes every
//    real call omitting `overallHeight`/`overallWidth` (this file's own documented defaults,
//    2.0m/0.9m -- DIFFERENT from window's 0.9m/0.6m) -- schema-independent, still real today,
//    pinned first below.
// 2. Once both dimensions are supplied explicitly, the actual geometry work used to hit the
//    SAME 2 pre-existing, already-tracked `util/shapeBuilder.ts` primitive-layer gaps
//    (`.profile()`'s `Dim`-DERIVED-attribute gap, reached here via `extrude()`'s own internal
//    auto-`.profile()` wrap rather than an explicit call site; `.rectangle()`/
//    `.polyline(closed=true)`'s `IfcLineIndex`/`IfcArcIndex` defined-type-creation gap, the
//    latter IFC2X3-exempt) -- EXCEPT the `PLAN_VIEW` + `ContextIdentifier === "Annotation"`
//    sliding-door arrow-symbol sub-branch, which was already genuinely unblocked on every
//    schema (see below) and is pinned with real, non-throwing geometry assertions.
//
// **UPDATE (Phase EX-2 chunk 2, `planning/ifcopenshell-ts/70-express-rules-plan.md` §4)**:
// finding 2's `Dim` gap closed for IFC2X3 first -- Phase EX-2 chunks 1+2 ported enough of the
// `calc_*` `Dim`-DERIVE family (`calc_IfcCartesianPoint_Dim`, `calc_IfcCurve_Dim`,
// `calc_IfcElementarySurface_Dim`, ...) that `.profile()`'s own `Dim` read (via `extrude()`'s
// internal auto-wrap) resolved for real IFC2X3 geometry. `addDoorRepresentation` completed
// end-to-end on IFC2X3 for every `operationType`/view combination, producing a real
// `IfcShapeRepresentation` each time.
//
// **UPDATE 2 (reference-parity chunk 5 of 5): BOTH gaps are now closed on IFC4/IFC4X3 too --
// every test below is genuinely unblocked on ALL 3 SCHEMAS.** Independently, Phase EX-2's own
// later, separate IFC4/IFC4X3 `calc_*`-porting chunks (see `TODOS.md`'s "`util.representation
// .guessType`'s `Curve2D`/... branches..." entry, "UPDATE"/"UPDATE 2" through "UPDATE 5", and
// `src/util/representation.ts`'s own header comment) finished closing finding 2's `Dim` half for
// IFC4/IFC4X3 as well, and TODOS.md's "`EntityInstance.setByIndex`/`IfcFile.createEntity` ..."
// entry's shared native gate (finding 2's OTHER half, the `IfcLineIndex`/`IfcArcIndex`
// defined-type-creation blocker) was fixed 2026-09-23. Both fixes landed independently, well
// before this chunk, but nothing had re-verified their COMBINED effect on this file's own tests
// until now. Re-verified directly (not assumed) with a throwaway script against a fresh,
// from-scratch multi-schema native rebuild before updating these tests: every previously-skipped
// case below now produces a real `IfcShapeRepresentation`/geometry result on IFC4/IFC4X3 too,
// with item COUNTS and STRUCTURE identical to IFC2X3's own already-asserted values in every case
// -- the only schema-observable difference is which concrete curve class `ShapeBuilder.rectangle
// ()`/`.polyline(closed=true)` build (a real, disclosed, pre-existing `util/shapeBuilder.ts`
// finding, not new here): IFC2X3 (no `IfcIndexedPolyCurve`/`IfcLineIndex`/`IfcArcIndex` in that
// schema) builds a plain `IfcPolyline`; IFC4/IFC4X3 build an `IfcIndexedPolyCurve` instead. The
// tests below now assert a deliberately MINIMAL, structural-sanity shape (return value's type,
// `RepresentationIdentifier`/`RepresentationType`, and `Items` count/entity-type, using the
// correct per-schema curve class where a curve item's own class is checked at all) -- NOT full
// geometric-fidelity verification (exact panel/lining/frame placement, swing-arc geometry,
// L-shape lining offsets, etc. for every one of the 9 door types, on any schema). That deeper
// verification is real, disclosed, scoped-out follow-up work (tracked in `TODOS.md`), comparable
// in size to its own dedicated verification chunk.
//
// Run against `AVAILABLE_SCHEMAS` throughout (no hardcoded schema `describe`); the one remaining
// real, disclosed schema-observable divergence (curve item class) is handled with a small
// `curveItemClass(schema)` helper below.

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

/**
 * `util/shapeBuilder.ts`'s `rectangle()`/`polyline(closed=true)` build a plain `IfcPolyline` on
 * IFC2X3 (no `IfcIndexedPolyCurve`/`IfcLineIndex`/`IfcArcIndex` in that schema), but an
 * `IfcIndexedPolyCurve` on IFC4/IFC4X3 -- the one real, disclosed, schema-observable difference
 * left now that both primitive-layer gaps this file's own header comment describes are closed on
 * every schema (see that comment for the full history).
 */
function curveItemClass(schema: string): string {
	return schema === "IFC2X3" ? "IfcPolyline" : "IfcIndexedPolyCurve";
}

/**
 * Asserts the MINIMAL, structural-sanity shape a genuinely-unblocked
 * `addDoorRepresentation`/`createIfcDoorLining`/`createIfcBox` call now produces on ANY schema
 * (see this file's own header comment) -- deliberately not a full geometric-correctness check.
 */
function expectStructurallySaneRepresentation(
	result: EntityInstance | null | undefined,
	expected: { identifier: string; type: string; itemCount: number; itemClass?: string },
): void {
	expect(result).toBeTruthy();
	const rep = result as EntityInstance;
	expect(rep.isA()).toBe("IfcShapeRepresentation");
	expect(rep.get("RepresentationIdentifier")).toBe(expected.identifier);
	expect(rep.get("RepresentationType")).toBe(expected.type);
	const items = rep.get("Items") as EntityInstance[];
	expect(items).toHaveLength(expected.itemCount);
	if (expected.itemClass) {
		for (const item of items) expect(item.isA()).toBe(expected.itemClass);
	}
}

/**
 * Real, expected `Items` count for `addDoorRepresentation`'s `MODEL_VIEW` `SweptSolid` body
 * representation, per `operationType`, on now-genuinely-unblocked IFC2X3 -- verified directly
 * against the real, built native addon (not derived from the door-geometry logic by
 * inspection).
 */
const MODEL_VIEW_ITEM_COUNTS: Record<DoorType, number> = {
	SINGLE_SWING_LEFT: 8,
	SINGLE_SWING_RIGHT: 8,
	DOUBLE_SWING_RIGHT: 7,
	DOUBLE_SWING_LEFT: 7,
	DOUBLE_DOOR_SINGLE_SWING: 11,
	DOUBLE_DOOR_DOUBLE_SWING: 10,
	SLIDING_TO_LEFT: 7,
	SLIDING_TO_RIGHT: 7,
	DOUBLE_DOOR_SLIDING: 10,
};

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

	// Genuinely unblocked on ALL 3 SCHEMAS as of reference-parity chunk 5 of 5 (see this
	// file's own header comment) -- once both dimensions bypass the settings bug, this
	// completes end-to-end everywhere now.
	test("ELEVATION_VIEW: genuinely unblocked on every schema once both dimensions are supplied (bypassing the settings bug)", () => {
		const file = createTestFile(schema);
		const body = context(file, "ELEVATION_VIEW");

		const rep = addDoorRepresentation(file, { context: body, overallHeight: 2.0, overallWidth: 0.9 });
		expectStructurallySaneRepresentation(rep as EntityInstance, {
			identifier: "Body",
			type: "Curve3D",
			itemCount: 1,
			itemClass: curveItemClass(schema),
		});

		file.dispose();
	});

	// Genuinely unblocked on ALL 3 SCHEMAS as of reference-parity chunk 5 of 5 -- same
	// gate/reasoning as the ELEVATION_VIEW test above.
	test("PLAN_VIEW (non-Annotation): genuinely unblocked on every schema once both dimensions are supplied", () => {
		const file = createTestFile(schema);
		const body = context(file, "PLAN_VIEW");

		const rep = addDoorRepresentation(file, { context: body, overallHeight: 2.0, overallWidth: 0.9 });
		expectStructurallySaneRepresentation(rep as EntityInstance, {
			identifier: "Body",
			type: "Curve2D",
			itemCount: 4,
		});

		file.dispose();
	});

	if (schema === "IFC2X3") {
		test("PLAN_VIEW on IFC2X3: genuinely UNBLOCKED -- every lining/panel polyline/rectangle succeeds, producing a real Curve2D representation, not a partial-progress throw", () => {
			const file = createTestFile(schema);
			const body = context(file, "PLAN_VIEW");

			const polylinesBefore = file.byType("IfcPolyline").length;
			const rep = addDoorRepresentation(file, { context: body, overallHeight: 2.0, overallWidth: 0.9 });
			const polylinesAfter = file.byType("IfcPolyline").length;
			// A single-swing door's 2D representation builds: 1 lining rectangle + 1 mirrored
			// copy + a swing-arc rectangle -- several real IfcPolylines were created, and the
			// final getRepresentation() call now completes (4 total 2D items -- 3 polylines +
			// 1 IfcTrimmedCurve for the swing arc, verified directly).
			expect(polylinesAfter).toBeGreaterThan(polylinesBefore + 1);
			expectStructurallySaneRepresentation(rep as EntityInstance, {
				identifier: "Body",
				type: "Curve2D",
				itemCount: 4,
			});

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

	// Genuinely unblocked on ALL 3 SCHEMAS as of reference-parity chunk 5 of 5 -- same
	// gate/reasoning as the ELEVATION_VIEW test above.
	test.each(SUPPORTED_DOOR_TYPES)(
		"MODEL_VIEW (default target view): operationType %s is genuinely unblocked on every schema",
		(operationType) => {
			const file = createTestFile(schema);
			const body = context(file, "MODEL_VIEW");

			const rep = addDoorRepresentation(file, {
				context: body,
				overallHeight: 2.0,
				overallWidth: 0.9,
				operationType,
			});
			expectStructurallySaneRepresentation(rep as EntityInstance, {
				identifier: "Body",
				type: "SweptSolid",
				itemCount: MODEL_VIEW_ITEM_COUNTS[operationType],
				itemClass: "IfcExtrudedAreaSolid",
			});

			file.dispose();
		},
	);

	// Genuinely unblocked on ALL 3 SCHEMAS as of reference-parity chunk 5 of 5 -- same
	// gate/reasoning as the ELEVATION_VIEW test above.
	test("MODEL_VIEW: a partOfProduct is accepted (never itself the cause of a different error); genuinely unblocked on every schema", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");
		const door = createEntity(file, { ifcClass: "IfcDoor" });
		const productShape = file.createEntity("IfcProductDefinitionShape", null, null, []);
		door.set("Representation", productShape);

		const rep = addDoorRepresentation(file, {
			context: body,
			overallHeight: 2.0,
			overallWidth: 0.9,
			partOfProduct: productShape,
		});
		expectStructurallySaneRepresentation(rep as EntityInstance, {
			identifier: "Body",
			type: "SweptSolid",
			itemCount: MODEL_VIEW_ITEM_COUNTS.SINGLE_SWING_LEFT,
			itemClass: "IfcExtrudedAreaSolid",
		});

		file.dispose();
	});

	// Genuinely unblocked on ALL 3 SCHEMAS as of reference-parity chunk 5 of 5 -- same
	// gate/reasoning as the ELEVATION_VIEW test above.
	test("custom liningProperties/panelProperties are accepted; genuinely unblocked on every schema", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");

		const rep = addDoorRepresentation(file, {
			context: body,
			overallHeight: 2.1,
			overallWidth: 1.0,
			liningProperties: { liningDepth: 0.1, liningThickness: 0.08, transomThickness: 0.05 },
			panelProperties: { frameDepth: 0.05, frameThickness: 0.04, panelWidth: 0.9 },
		});
		expectStructurallySaneRepresentation(rep as EntityInstance, {
			identifier: "Body",
			type: "SweptSolid",
			itemCount: 12,
			itemClass: "IfcExtrudedAreaSolid",
		});

		file.dispose();
	});

	// Genuinely unblocked on ALL 3 SCHEMAS as of reference-parity chunk 5 of 5 -- same
	// gate/reasoning as the ELEVATION_VIEW test above.
	test("createIfcDoorLining (exported, matches real Python's public create_ifc_door_lining): genuinely unblocked on every schema", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		const result = createIfcDoorLining(builder, [1.0, 0.05, 2.0], [0.05, 0.05]);
		expect(result.isA()).toBe("IfcExtrudedAreaSolid");

		file.dispose();
	});

	// Genuinely unblocked on ALL 3 SCHEMAS as of reference-parity chunk 5 of 5 -- same
	// gate/reasoning as the ELEVATION_VIEW test above.
	test("createIfcBox (exported, matches real Python's public create_ifc_box): genuinely unblocked on every schema via its own rectangle()/extrude() call", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		const result = createIfcBox(builder, [0.9, 0.1, 0.03]);
		expect(result.isA()).toBe("IfcExtrudedAreaSolid");

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

	// Genuinely unblocked as of reference-parity chunk 5 of 5 (see this file's own header
	// comment) -- `createIfcDoorLining` no longer throws on IFC4. Re-verified directly:
	// a real `IfcExtrudedAreaSolid` (matching the list-`thickness` call shape's own
	// assertion elsewhere in this file) for the scalar `thickness` call shape too.
	test("createIfcDoorLining accepts a single scalar thickness (applied to both SIDE and TOP), matching real Python's Union[list[float], float]", () => {
		const file = createTestFile("IFC4");
		const builder = new ShapeBuilder(file);

		// Same call site either way -- this just confirms the scalar-vs-list call shape
		// produces the same real, non-throwing result.
		const result = createIfcDoorLining(builder, [1.0, 0.05, 2.0], 0.05);
		expect(result.isA()).toBe("IfcExtrudedAreaSolid");

		file.dispose();
	});
});
