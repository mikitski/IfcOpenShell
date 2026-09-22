// This file was generated with the assistance of an AI coding tool.
//
// `test/api/geometry/test_add_window_representation.py` does not exist anywhere in
// `src/ifcopenshell-python` (confirmed by a repo-wide search) -- no real Python test file
// exists for this module at all. Every test below is original coverage, written directly
// against `add_window_representation.py`'s real source / `../../../src/api/geometry/
// addWindowRepresentation.ts`'s own port.
//
// This module was blocked end-to-end by 2 independent, disclosed issues (see
// `addWindowRepresentation.ts`'s own header comment for the full writeup):
//
// 1. A genuine, verbatim-preserved upstream-Python evaluation-order BUG that crashes every
//    real call omitting `overallHeight`/`overallWidth` (their own documented defaults) --
//    schema-independent, still real today, pinned first below.
// 2. Once both dimensions are supplied explicitly, the actual geometry work used to hit 2
//    pre-existing, already-tracked `util/shapeBuilder.ts` primitive-layer gaps
//    (`.profile()`'s `Dim`-DERIVED-attribute gap; `.rectangle()`/`.polyline(closed=true)`'s
//    `IfcLineIndex`/`IfcArcIndex` defined-type-creation gap, the latter IFC2X3-exempt).
//
// **UPDATE (Phase EX-2 chunk 2, `planning/ifcopenshell-ts/70-express-rules-plan.md` §4)**:
// finding 2's `Dim` gap is now CLOSED for IFC2X3 -- Phase EX-2 chunks 1+2 ported enough of
// the `calc_*` `Dim`-DERIVE family (`calc_IfcCartesianPoint_Dim`, `calc_IfcCurve_Dim`,
// `calc_IfcElementarySurface_Dim`, ...) that `.profile()`'s own `Dim` read now resolves for
// real IFC2X3 geometry. Re-verified directly against the real, built multi-schema native
// addon (not assumed) before updating these tests: `addWindowRepresentation` now completes
// end-to-end on IFC2X3 for every `partitionType`/view combination below, producing a real
// `IfcShapeRepresentation` each time. The tests below now assert a deliberately MINIMAL,
// structural-sanity shape for the IFC2X3 case (return value's type,
// `RepresentationIdentifier`/`RepresentationType`, and `Items` count/entity-type) -- NOT
// full geometric-fidelity verification (exact panel/mullion/transom placement, frame miter
// geometry, glazing offsets, etc. for every one of the 9 partition types). That deeper
// verification is real, disclosed, scoped-out follow-up work (tracked in `TODOS.md`),
// comparable in size to its own dedicated verification chunk.
//
// IFC4/IFC4X3 are UNCHANGED: `rectangle()`/`polyline(closed=true)`'s OWN `IfcLineIndex`/
// `IfcArcIndex` gap (finding 2's other half, unrelated to Phase EX-2 -- a
// `createEntity`-on-a-defined-type limitation, not a DERIVE-attribute one) still fires
// first, for every branch and every `partitionType` -- `.profile()`'s `Dim` gap is never
// actually reached there, so IFC4/IFC4X3 still throw exactly as before. Every test below
// therefore still asserts the exact, schema-specific outcome rather than a loose "either
// of 2 possible errors" net.
//
// Run against `AVAILABLE_SCHEMAS` throughout (no hardcoded schema `describe`); the real,
// disclosed IFC2X3-vs-IFC4+ divergence above is handled with an `if (schema ===
// "IFC2X3")` branch inside each otherwise schema-agnostic test body.

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
/** `util/shapeBuilder.ts`'s own defined-type-creation error (`.rectangle()`/
 * `.polyline(closed=true)`'s `IfcLineIndex`/`IfcArcIndex` gap) -- still real on IFC4/IFC4X3,
 * and now the ONLY blocked outcome left in this file (the `.profile()`-level `Dim` gap this
 * file used to also pin, via a `DIM_ERROR` regex, is closed on IFC2X3 as of Phase EX-2 --
 * see this file's own header comment -- and `rectangle()`/`polyline(closed=true)` always
 * runs before `.profile()` in every code path this file exercises, so IFC4/IFC4X3 never
 * reach the now-fixed `Dim` gap in the first place, before or after this chunk). */
const DEFINED_TYPE_ERROR = /Attribute access is only supported on entity instances/;

/**
 * Asserts the MINIMAL, structural-sanity shape a genuinely-unblocked IFC2X3
 * `addWindowRepresentation`/`createIfcWindowFrameSimple`-family call now produces (see this
 * file's own header comment) -- deliberately not a full geometric-correctness check.
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

	test("ELEVATION_VIEW: genuinely unblocked on IFC2X3 once both dimensions are supplied (bypassing the settings bug); still blocked earlier on IFC4/IFC4X3", () => {
		const file = createTestFile(schema);
		const body = context(file, "ELEVATION_VIEW");

		if (schema === "IFC2X3") {
			// rectangle()/polyline(closed=true) fully work on IFC2X3, and .profile()'s own
			// Dim gap is now closed too (Phase EX-2) -- the whole call now completes.
			const rep = addWindowRepresentation(file, { context: body, overallHeight: 0.9, overallWidth: 0.6 });
			expectStructurallySaneRepresentation(rep as EntityInstance, {
				identifier: "Body",
				type: "Curve3D",
				itemCount: 1,
				itemClass: "IfcPolyline",
			});
		} else {
			// rectangle() itself throws first (the IfcLineIndex/IfcArcIndex gap, unrelated
			// to Phase EX-2, still real).
			expect(() => addWindowRepresentation(file, { context: body, overallHeight: 0.9, overallWidth: 0.6 })).toThrow(
				DEFINED_TYPE_ERROR,
			);
		}

		file.dispose();
	});

	test("PLAN_VIEW: genuinely unblocked on IFC2X3 once both dimensions are supplied; still blocked earlier on IFC4/IFC4X3", () => {
		const file = createTestFile(schema);
		const body = context(file, "PLAN_VIEW");

		if (schema === "IFC2X3") {
			const rep = addWindowRepresentation(file, { context: body, overallHeight: 0.9, overallWidth: 0.6 });
			expectStructurallySaneRepresentation(rep as EntityInstance, {
				identifier: "Body",
				type: "Curve2D",
				itemCount: 8,
				itemClass: "IfcPolyline",
			});
		} else {
			expect(() => addWindowRepresentation(file, { context: body, overallHeight: 0.9, overallWidth: 0.6 })).toThrow(
				DEFINED_TYPE_ERROR,
			);
		}

		file.dispose();
	});

	if (schema === "IFC2X3") {
		test("PLAN_VIEW on IFC2X3: genuinely UNBLOCKED -- every lining/frame polyline/rectangle succeeds, producing a real Curve2D representation, not a partial-progress throw", () => {
			const file = createTestFile(schema);
			const body = context(file, "PLAN_VIEW");

			const polylinesBefore = file.byType("IfcPolyline").length;
			const rep = addWindowRepresentation(file, { context: body, overallHeight: 0.9, overallWidth: 0.6 });
			const polylinesAfter = file.byType("IfcPolyline").length;
			// A single-panel window's 2D representation builds: 1 sill line + 2 lining
			// shapes + 2 frame verticals (1 real + 1 mirrored-in-place, same object) +
			// 2 frame horizontals (1 real + 2 translated copies) -- several real
			// IfcPolylines were created, and the final `getRepresentation()` call now
			// completes (8 of those polylines end up as the representation's own `Items`,
			// see the structural-sanity check below).
			expect(polylinesAfter).toBeGreaterThan(polylinesBefore + 3);
			expectStructurallySaneRepresentation(rep as EntityInstance, {
				identifier: "Body",
				type: "Curve2D",
				itemCount: 8,
				itemClass: "IfcPolyline",
			});

			file.dispose();
		});
	}

	/**
	 * Real, expected `Items` count for `addWindowRepresentation`'s `MODEL_VIEW` `SweptSolid`
	 * body representation, per `partitionType`, on now-genuinely-unblocked IFC2X3 -- verified
	 * directly against the real, built native addon (not derived from the panel-schema
	 * geometry by inspection): each panel contributes 4 extrusions (frame x2 axes'-worth +
	 * glazing, matching `createIfcWindow`'s own `{lining: 2, framing: 1, glazing: 1}` per
	 * panel), plus 1 shared window-frame extrusion.
	 */
	const MODEL_VIEW_ITEM_COUNTS: Record<WindowType, number> = {
		SINGLE_PANEL: 4,
		DOUBLE_PANEL_HORIZONTAL: 8,
		DOUBLE_PANEL_VERTICAL: 8,
		TRIPLE_PANEL_BOTTOM: 12,
		TRIPLE_PANEL_TOP: 12,
		TRIPLE_PANEL_LEFT: 12,
		TRIPLE_PANEL_RIGHT: 12,
		TRIPLE_PANEL_HORIZONTAL: 13,
		TRIPLE_PANEL_VERTICAL: 13,
	};

	test.each(Object.keys(DEFAULT_PANEL_SCHEMAS) as WindowType[])(
		"MODEL_VIEW (default target view): partitionType %s is genuinely unblocked on IFC2X3; still blocked earlier on IFC4/IFC4X3",
		(partitionType) => {
			const file = createTestFile(schema);
			const body = context(file, "MODEL_VIEW");
			// 3 entries -- enough for every partitionType's own distinct panel count
			// (TRIPLE_PANEL_* needs up to 3; extra unused entries are harmless, matching
			// real Python's own behavior of never reading past the highest panel index
			// actually used by `partition_type`'s own schema).
			const panelProperties = [{}, {}, {}];

			if (schema === "IFC2X3") {
				const rep = addWindowRepresentation(file, {
					context: body,
					overallHeight: 0.9,
					overallWidth: 0.6,
					partitionType,
					panelProperties,
				});
				expectStructurallySaneRepresentation(rep as EntityInstance, {
					identifier: "Body",
					type: "SweptSolid",
					itemCount: MODEL_VIEW_ITEM_COUNTS[partitionType],
					itemClass: "IfcExtrudedAreaSolid",
				});
			} else {
				expect(() =>
					addWindowRepresentation(file, {
						context: body,
						overallHeight: 0.9,
						overallWidth: 0.6,
						partitionType,
						panelProperties,
					}),
				).toThrow(DEFINED_TYPE_ERROR);
			}

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

	test("MODEL_VIEW: a partOfProduct is accepted (never itself the cause of a different error); genuinely unblocked on IFC2X3", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");
		const wall = createEntity(file, { ifcClass: "IfcWall" });
		const productShape = file.createEntity("IfcProductDefinitionShape", null, null, []);
		wall.set("Representation", productShape);

		if (schema === "IFC2X3") {
			const rep = addWindowRepresentation(file, {
				context: body,
				overallHeight: 0.9,
				overallWidth: 0.6,
				partOfProduct: productShape,
			});
			expectStructurallySaneRepresentation(rep as EntityInstance, {
				identifier: "Body",
				type: "SweptSolid",
				itemCount: MODEL_VIEW_ITEM_COUNTS.SINGLE_PANEL,
				itemClass: "IfcExtrudedAreaSolid",
			});
		} else {
			expect(() =>
				addWindowRepresentation(file, {
					context: body,
					overallHeight: 0.9,
					overallWidth: 0.6,
					partOfProduct: productShape,
				}),
			).toThrow(DEFINED_TYPE_ERROR);
		}

		file.dispose();
	});

	test("custom liningProperties/panelProperties are accepted; genuinely unblocked on IFC2X3", () => {
		const file = createTestFile(schema);
		const body = context(file, "MODEL_VIEW");

		if (schema === "IFC2X3") {
			const rep = addWindowRepresentation(file, {
				context: body,
				overallHeight: 1.2,
				overallWidth: 0.9,
				liningProperties: { liningDepth: 0.1, liningThickness: 0.08 },
				panelProperties: [{ frameDepth: 0.05, frameThickness: 0.04 }],
			});
			expectStructurallySaneRepresentation(rep as EntityInstance, {
				identifier: "Body",
				type: "SweptSolid",
				itemCount: MODEL_VIEW_ITEM_COUNTS.SINGLE_PANEL,
				itemClass: "IfcExtrudedAreaSolid",
			});
		} else {
			expect(() =>
				addWindowRepresentation(file, {
					context: body,
					overallHeight: 1.2,
					overallWidth: 0.9,
					liningProperties: { liningDepth: 0.1, liningThickness: 0.08 },
					panelProperties: [{ frameDepth: 0.05, frameThickness: 0.04 }],
				}),
			).toThrow(DEFINED_TYPE_ERROR);
		}

		file.dispose();
	});

	test("createIfcWindowFrameSimple (exported, matches real Python's public create_ifc_window_frame_simple): the 'no zero thickness' branch's own panel_rect = rectangle() call is what's actually blocked first on IFC4/IFC4X3; genuinely unblocked on IFC2X3", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		if (schema === "IFC2X3") {
			const items = createIfcWindowFrameSimple(builder, [1.0, 0.05, 1.0], [0.05, 0.05, 0.05, 0.05]);
			expect(items).toHaveLength(1);
			expect(items[0].isA()).toBe("IfcExtrudedAreaSolid");
		} else {
			expect(() => createIfcWindowFrameSimple(builder, [1.0, 0.05, 1.0], [0.05, 0.05, 0.05, 0.05])).toThrow(
				DEFINED_TYPE_ERROR,
			);
		}

		file.dispose();
	});

	test("createIfcWindowFrameSimple: the 'has zero thickness' branch always builds a closed polyline first; genuinely unblocked on IFC2X3, still blocked by the IfcLineIndex gap on IFC4/IFC4X3", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		if (schema === "IFC2X3") {
			const items = createIfcWindowFrameSimple(builder, [1.0, 0.05, 1.0], [0.05, 0, 0.05, 0.05]);
			expect(items).toHaveLength(1);
			expect(items[0].isA()).toBe("IfcExtrudedAreaSolid");
		} else {
			expect(() => createIfcWindowFrameSimple(builder, [1.0, 0.05, 1.0], [0.05, 0, 0.05, 0.05])).toThrow(
				DEFINED_TYPE_ERROR,
			);
		}

		file.dispose();
	});

	test("createIfcWindow (exported, matches real Python's public create_ifc_window): genuinely unblocked on IFC2X3 via its own first createIfcWindowFrameSimple call; still blocked on IFC4/IFC4X3", () => {
		const file = createTestFile(schema);
		const builder = new ShapeBuilder(file);

		if (schema === "IFC2X3") {
			const result = createIfcWindow(
				builder,
				[1.0, 0.05, 1.0],
				[0.05, 0.05, 0.05, 0.05],
				0.025,
				0.02,
				[0.9, 0.035, 1.9],
				0.035,
				0.01,
				[0, 0, 0],
			);
			expect(result.lining).toHaveLength(2);
			expect(result.framing).toHaveLength(1);
			expect(result.glazing).toHaveLength(1);
			for (const item of [...result.lining, ...result.framing, ...result.glazing]) {
				expect(item.isA()).toBe("IfcExtrudedAreaSolid");
			}
		} else {
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
			).toThrow(DEFINED_TYPE_ERROR);
		}

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
