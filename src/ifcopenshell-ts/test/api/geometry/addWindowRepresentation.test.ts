// This file was generated with the assistance of an AI coding tool.
//
// `test/api/geometry/test_add_window_representation.py` does not exist anywhere in
// `src/ifcopenshell-python` (confirmed by a repo-wide search) -- no real Python test file
// exists for this module at all. Every test below is original coverage, written directly
// against `add_window_representation.py`'s real source / `../../../src/api/geometry/
// addWindowRepresentation.ts`'s own port.
//
// This module is blocked end-to-end today by 2 independent, disclosed issues (see
// `addWindowRepresentation.ts`'s own header comment for the full writeup):
//
// 1. A genuine, verbatim-preserved upstream-Python evaluation-order BUG that crashes every
//    real call omitting `overallHeight`/`overallWidth` (their own documented defaults) --
//    schema-independent, pinned first below.
// 2. Once both dimensions are supplied explicitly, the actual geometry work hits 2
//    pre-existing, already-tracked `util/shapeBuilder.ts` primitive-layer gaps
//    (`.profile()`'s `Dim`-DERIVED-attribute gap; `.rectangle()`/`.polyline(closed=true)`'s
//    `IfcLineIndex`/`IfcArcIndex` defined-type-creation gap, the latter IFC2X3-exempt).
//    Confirmed empirically (not assumed) by actually running this test file: EVERY branch
//    of `createIfcWindowFrameSimple` -- the one place this file's own `MODEL_VIEW` path
//    actually builds panel geometry -- calls `builder.rectangle()` (the "no zero thickness"
//    branch's own `panel_rect`) or `builder.polyline(..., closed=true)` (the "has zero
//    thickness" branch's own per-segment polyline) BEFORE it ever reaches `.profile()`. So
//    on IFC4/IFC4X3, the `IfcLineIndex`/`IfcArcIndex` gap (finding 2) ALWAYS fires first,
//    for every branch and every `partitionType` -- `.profile()`'s `Dim` gap (finding 1) is
//    never actually reached there. Only on IFC2X3 (where `rectangle()`/`polyline(closed)`
//    are fully functional) does execution get far enough to hit `.profile()`'s own `Dim`
//    gap. Every test below therefore asserts the exact, schema-specific error rather than
//    a loose "either of 2 possible errors" net.
//
// Run against `AVAILABLE_SCHEMAS` throughout (no hardcoded schema `describe`); the real,
// disclosed IFC2X3-vs-IFC4+ divergence in finding 2 above is handled with an `if (schema
// === "IFC2X3")` branch inside each otherwise schema-agnostic test body.

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import {
	DEFAULT_PANEL_SCHEMAS,
	type WindowType,
	addWindowRepresentation,
	createIfcWindow,
	createIfcWindowFrameSimple,
	windowLShapeCheck,
} from "../../../src/api/geometry/addWindowRepresentation";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { ShapeBuilder } from "../../../src/util/shapeBuilder";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Matches `../geometry/addWallRepresentation.test.ts`'s own identical fixture. */
function context(file: IfcFile, targetView: "MODEL_VIEW" | "PLAN_VIEW" | "ELEVATION_VIEW"): EntityInstance {
	createEntity(file, { ifcClass: "IfcProject" });
	const model = addContext(file, { contextType: "Model" });
	return addContext(file, {
		contextType: "Model",
		contextIdentifier: "Body",
		targetView,
		parent: model,
	});
}

/** The settings-order-bug error (see this file's/`addWindowRepresentation.ts`'s own header comment). */
const SETTINGS_BUG_ERROR = /evaluation-order bug/;
/** `entityInstance.ts`'s own DERIVED-attribute error (`.profile()`'s `Dim` gap). */
const DIM_ERROR = /has no attribute 'Dim'/;
/** `util/shapeBuilder.ts`'s own defined-type-creation error (`.rectangle()`/
 * `.polyline(closed=true)`'s `IfcLineIndex`/`IfcArcIndex` gap). */
const DEFINED_TYPE_ERROR = /Attribute access is only supported on entity instances/;

describe.each(AVAILABLE_SCHEMAS)("api.geometry.addWindowRepresentation (%s)", (schema) => {
	test("omitting overallHeight throws the disclosed, verbatim-preserved upstream-Python evaluation-order bug", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");

		expect(() => addWindowRepresentation(file, { context: body, overallWidth: 0.6 })).toThrow(SETTINGS_BUG_ERROR);
		expect(() => addWindowRepresentation(file, { context: body, overallWidth: 0.6 })).toThrow(/overallHeight/);

		file.dispose();
	});

	test("omitting overallWidth (overallHeight supplied) throws the same disclosed bug, naming overallWidth", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");

		expect(() => addWindowRepresentation(file, { context: body, overallHeight: 0.9 })).toThrow(SETTINGS_BUG_ERROR);
		expect(() => addWindowRepresentation(file, { context: body, overallHeight: 0.9 })).toThrow(/overallWidth/);

		file.dispose();
	});

	test("omitting both throws for overallHeight first -- matches real Python's own dict-literal key evaluation order", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");

		expect(() => addWindowRepresentation(file, { context: body })).toThrow(/overallHeight/);

		file.dispose();
	});

	test("an explicit null for either dimension is treated the same as omitting it", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");

		expect(() => addWindowRepresentation(file, { context: body, overallHeight: null, overallWidth: 0.6 })).toThrow(
			/overallHeight/,
		);

		file.dispose();
	});

	test("ELEVATION_VIEW: throws the disclosed geometry blocker once both dimensions are supplied (bypassing the settings bug)", () => {
		const file = createTestFile(schema);
		const body = context(file, "ELEVATION_VIEW");

		if (schema === "IFC2X3") {
			// rectangle()/polyline(closed=true) fully work on IFC2X3 -- blocked only at
			// the final getRepresentation() -> guessType() call (the Dim gap).
			expect(() => addWindowRepresentation(file, { context: body, overallHeight: 0.9, overallWidth: 0.6 })).toThrow(
				DIM_ERROR,
			);
		} else {
			// rectangle() itself throws first (the IfcLineIndex/IfcArcIndex gap).
			expect(() => addWindowRepresentation(file, { context: body, overallHeight: 0.9, overallWidth: 0.6 })).toThrow(
				DEFINED_TYPE_ERROR,
			);
		}

		file.dispose();
	});

	test("PLAN_VIEW: throws the disclosed geometry blocker once both dimensions are supplied", () => {
		const file = createTestFile(schema);
		const body = context(file, "PLAN_VIEW");

		if (schema === "IFC2X3") {
			expect(() => addWindowRepresentation(file, { context: body, overallHeight: 0.9, overallWidth: 0.6 })).toThrow(
				DIM_ERROR,
			);
		} else {
			expect(() => addWindowRepresentation(file, { context: body, overallHeight: 0.9, overallWidth: 0.6 })).toThrow(
				DEFINED_TYPE_ERROR,
			);
		}

		file.dispose();
	});

	if (schema === "IFC2X3") {
		test("PLAN_VIEW on IFC2X3: every lining/frame polyline/rectangle actually succeeds before the final blocked call -- real, measurable progress, not an immediate throw", () => {
			const file = createTestFile(schema);
			const body = context(file, "PLAN_VIEW");

			const polylinesBefore = file.byType("IfcPolyline").length;
			expect(() => addWindowRepresentation(file, { context: body, overallHeight: 0.9, overallWidth: 0.6 })).toThrow(
				DIM_ERROR,
			);
			const polylinesAfter = file.byType("IfcPolyline").length;
			// A single-panel window's 2D representation builds: 1 sill line + 2 lining
			// shapes + 2 frame verticals (1 real + 1 mirrored-in-place, same object) +
			// 2 frame horizontals (1 real + 2 translated copies) -- several real
			// IfcPolylines were created before the final getRepresentation() call threw.
			expect(polylinesAfter).toBeGreaterThan(polylinesBefore + 3);

			file.dispose();
		});
	}

	test.each(Object.keys(DEFAULT_PANEL_SCHEMAS) as WindowType[])(
		"MODEL_VIEW (default target view): partitionType %s throws the disclosed blocked-geometry error for this schema",
		(partitionType) => {
			const file = createTestFile(schema);
			const body = context(file, "MODEL_VIEW");
			// 3 entries -- enough for every partitionType's own distinct panel count
			// (TRIPLE_PANEL_* needs up to 3; extra unused entries are harmless, matching
			// real Python's own behavior of never reading past the highest panel index
			// actually used by `partition_type`'s own schema).
			const panelProperties = [{}, {}, {}];

			expect(() =>
				addWindowRepresentation(file, {
					context: body,
					overallHeight: 0.9,
					overallWidth: 0.6,
					partitionType,
					panelProperties,
				}),
			).toThrow(schema === "IFC2X3" ? DIM_ERROR : DEFINED_TYPE_ERROR);

			file.dispose();
		},
	);

	test("MODEL_VIEW: omitting panelProperties for a multi-panel partitionType throws a plain JS 'reading property of undefined' error -- a faithful (if differently-worded) reproduction of real Python's own equally-undocumented IndexError for the identical insufficiently-sized default panelProperties list", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");

		// The default `panelProperties` is a single-entry list (Python: `[WindowPanelProperties()]`)
		// regardless of how many distinct panels `partitionType` actually needs -- so any
		// multi-panel type reaches `panels[1]` (`undefined` in JS) before ever reaching the
		// disclosed ShapeBuilder blocker.
		expect(() =>
			addWindowRepresentation(file, {
				context: body,
				overallHeight: 0.9,
				overallWidth: 0.6,
				partitionType: "DOUBLE_PANEL_HORIZONTAL",
			}),
		).toThrow(/reading 'frameDepth'/);

		file.dispose();
	});

	test("MODEL_VIEW: a partOfProduct is accepted (never itself the cause of a different error) -- still blocked at the same disclosed geometry point", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");
		const wall = createEntity(file, { ifcClass: "IfcWall" });
		const productShape = file.createEntity("IfcProductDefinitionShape", null, null, []);
		wall.set("Representation", productShape);

		expect(() =>
			addWindowRepresentation(file, {
				context: body,
				overallHeight: 0.9,
				overallWidth: 0.6,
				partOfProduct: productShape,
			}),
		).toThrow(schema === "IFC2X3" ? DIM_ERROR : DEFINED_TYPE_ERROR);

		file.dispose();
	});

	test("custom liningProperties/panelProperties are accepted without changing which class of error is thrown", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");

		expect(() =>
			addWindowRepresentation(file, {
				context: body,
				overallHeight: 1.2,
				overallWidth: 0.9,
				liningProperties: { liningDepth: 0.1, liningThickness: 0.08 },
				panelProperties: [{ frameDepth: 0.05, frameThickness: 0.04 }],
			}),
		).toThrow(schema === "IFC2X3" ? DIM_ERROR : DEFINED_TYPE_ERROR);

		file.dispose();
	});

	test("createIfcWindowFrameSimple (exported, matches real Python's public create_ifc_window_frame_simple): the 'no zero thickness' branch's own panel_rect = rectangle() call is what's actually blocked first on IFC4/IFC4X3 -- profile()'s Dim gap is reached only on IFC2X3", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		expect(() => createIfcWindowFrameSimple(builder, [1.0, 0.05, 1.0], [0.05, 0.05, 0.05, 0.05])).toThrow(
			schema === "IFC2X3" ? DIM_ERROR : DEFINED_TYPE_ERROR,
		);

		file.dispose();
	});

	test("createIfcWindowFrameSimple: the 'has zero thickness' branch always builds a closed polyline first -- blocked by the IfcLineIndex gap on IFC4/IFC4X3, by the Dim gap on IFC2X3", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		if (schema === "IFC2X3") {
			expect(() => createIfcWindowFrameSimple(builder, [1.0, 0.05, 1.0], [0.05, 0, 0.05, 0.05])).toThrow(DIM_ERROR);
		} else {
			expect(() => createIfcWindowFrameSimple(builder, [1.0, 0.05, 1.0], [0.05, 0, 0.05, 0.05])).toThrow(
				DEFINED_TYPE_ERROR,
			);
		}

		file.dispose();
	});

	test("createIfcWindow (exported, matches real Python's public create_ifc_window): reaches the same disclosed blocker via its own first createIfcWindowFrameSimple call", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		expect(() =>
			createIfcWindow(
				builder,
				[1.0, 0.05, 1.0],
				[0.05, 0.05, 0.05, 0.05],
				0.025,
				0.02,
				[0.9, 0.035, 1.9],
				0.035,
				0.01,
				[0, 0, 0],
			),
		).toThrow(schema === "IFC2X3" ? DIM_ERROR : DEFINED_TYPE_ERROR);

		file.dispose();
	});
});

describe("api.geometry.addWindowRepresentation -- schema-agnostic pure-logic coverage", () => {
	test("DEFAULT_PANEL_SCHEMAS has an entry for every WindowType, rows top-to-bottom, columns left-to-right", () => {
		expect(Object.keys(DEFAULT_PANEL_SCHEMAS)).toHaveLength(9);
		expect(DEFAULT_PANEL_SCHEMAS.SINGLE_PANEL).toEqual([[0]]);
		expect(DEFAULT_PANEL_SCHEMAS.DOUBLE_PANEL_HORIZONTAL).toEqual([[0], [1]]);
		expect(DEFAULT_PANEL_SCHEMAS.DOUBLE_PANEL_VERTICAL).toEqual([[0, 1]]);
		expect(DEFAULT_PANEL_SCHEMAS.TRIPLE_PANEL_BOTTOM).toEqual([
			[0, 1],
			[2, 2],
		]);
		expect(DEFAULT_PANEL_SCHEMAS.TRIPLE_PANEL_TOP).toEqual([
			[0, 0],
			[1, 2],
		]);
		expect(DEFAULT_PANEL_SCHEMAS.TRIPLE_PANEL_LEFT).toEqual([
			[0, 1],
			[0, 2],
		]);
		expect(DEFAULT_PANEL_SCHEMAS.TRIPLE_PANEL_RIGHT).toEqual([
			[0, 1],
			[2, 1],
		]);
		expect(DEFAULT_PANEL_SCHEMAS.TRIPLE_PANEL_HORIZONTAL).toEqual([[0], [1], [2]]);
		expect(DEFAULT_PANEL_SCHEMAS.TRIPLE_PANEL_VERTICAL).toEqual([[0, 1, 2]]);
	});

	test("windowLShapeCheck: liningToPanelOffsetYFull >= liningDepth is never an L shape, regardless of thickness/offset", () => {
		expect(windowLShapeCheck(0.05, 0.05, [0.01], [0.05])).toBe(false);
		expect(windowLShapeCheck(0.06, 0.05, [0.0], [1.0])).toBe(false);
	});

	test("windowLShapeCheck: an L shape requires liningToPanelOffsetYFull < liningDepth AND some offset smaller than its thickness", () => {
		// offsetYFull < depth, but every offset >= its own thickness -> not an L shape.
		expect(windowLShapeCheck(0.02, 0.05, [0.05, 0.05], [0.05, 0.05])).toBe(false);
		// offsetYFull < depth, and one offset < its own thickness -> an L shape.
		expect(windowLShapeCheck(0.02, 0.05, [0.01, 0.05], [0.05, 0.05])).toBe(true);
	});

	test("windowLShapeCheck: throws on a liningThickness/liningToPanelOffsetX length mismatch (Python: zip(..., strict=True))", () => {
		expect(() => windowLShapeCheck(0.02, 0.05, [0.01, 0.02], [0.05])).toThrow(/must have the same length/);
	});
});
