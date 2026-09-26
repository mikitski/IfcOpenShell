// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/add_window_representation.py` (src/ifcopenshell-
// python, 779 lines) -- by far the largest `api.geometry` file ported so far (`api.geometry`
// now has 26 of ~29 real files landed -- see `./index.ts`'s own header comment for the full
// cumulative list). A parametric window-geometry generator: frame/lining/sash/glazing
// panels arranged per a "partitioning type" (single/double/triple panel, with mullions
// between columns and transoms between rows), plus separate 2D (`PLAN_VIEW`) and
// elevation (`ELEVATION_VIEW`) representations. No real Python test file exists for this
// module (confirmed by direct search -- `test/api/geometry/test_add_window_representation.py`
// does not exist); all test coverage below is original, written directly against the real
// source.
//
// *** READ THIS FIRST: a real, severe, PRE-EXISTING upstream-Python bug, found by static
// analysis of the exact source lines (not assumed), that blocks the DOCUMENTED DEFAULT
// USAGE of this function on every schema, before any geometry work even begins --
// preserved verbatim per this project's "disclose, don't silently fix" discipline. ***
//
// Real Python's public wrapper function builds a plain `Usecase()` instance and assigns
// `usecase.file = file` -- but does NOT assign `usecase.settings` until AFTER the
// `settings.update({...})` dict-literal call that computes `overall_height`/`overall_width`'s
// own defaults:
//
//     usecase.file = file
//     ...
//     settings.update({
//         ...
//         "overall_height": overall_height if overall_height is not None else usecase.convert_si_to_unit(0.9),
//         "overall_width":  overall_width  if overall_width  is not None else usecase.convert_si_to_unit(0.6),
//         ...
//     })
//     usecase.settings = settings   # <-- only assigned HERE, AFTER the dict above was built
//
// `Usecase.convert_si_to_unit` reads `self.settings["unit_scale"]` -- but `Usecase` is a
// plain class with bare type annotations (`file: ifcopenshell.file` / `settings: dict[str,
// Any]`), which, per ordinary Python semantics, create NO actual instance/class attribute
// at all (confirmed empirically with a standalone Python script reproducing exactly this
// shape: accessing an annotated-but-never-assigned attribute raises `AttributeError`, not
// `None`). Since Python's conditional-expression (`A if cond else B`) only evaluates the
// branch actually taken, `usecase.convert_si_to_unit(...)` is called -- and crashes with
// `AttributeError: 'Usecase' object has no attribute 'settings'` -- if AND ONLY IF
// `overall_height` (checked first) or `overall_width` is omitted/`None`. Both are documented
// as optional, defaulting to 0.9m/0.6m respectively -- i.e. **every real call that omits
// either dimension (the documented default/most-common usage) crashes upstream, on every
// schema, before `Usecase.execute()` is ever reached** -- this has nothing to do with the
// ShapeBuilder gaps below; it fires even earlier, purely from Python's own evaluation order.
// Could not be verified by actually invoking real Python in this environment (no compiled
// `ifcopenshell_wrapper` available here), but this is pure, data-independent Python
// language-semantics analysis (attribute-annotation-without-assignment + conditional-
// expression short-circuiting), not something that depends on any runtime value.
//
// This is NOT a TS-port gap to "fix" -- there is nothing to port differently that would
// make this go away without deviating from real Python's own actual behavior. Preserved
// verbatim below: `addWindowRepresentation` throws a clear, descriptive error the moment
// `overallHeight`/`overallWidth` is omitted (`undefined`/`null`), reproducing the exact
// real-Python crash point and cause, one parameter at a time in the same order Python's own
// dict-literal evaluates its keys (`overall_height` before `overall_width`). Both must be
// supplied explicitly to reach anything else in this file, including the second, separate
// class of blocker below. Pinned by dedicated regression tests, not silently worked around.
//
// *** Second, independent class of blocker: this file makes heavy, load-bearing use of
// `util/shapeBuilder.ts`'s `ShapeBuilder.rectangle`/`.polyline(closed=true|arcPoints=...)`/
// `.profile()` -- ALL THREE already disclosed as blocked in `shapeBuilder.ts`'s own header
// comment, by 2 pre-existing, already-tracked `entityInstance.ts` primitive-layer gaps (NOT
// new findings here, just new, unusually pervasive call sites) ***
//
// 1. `.profile()` unconditionally throws for ANY curve (`outerCurve.get("Dim")` is an
//    EXPRESS DERIVED attribute `EntityInstance.get()` cannot resolve -- see `shapeBuilder.ts`'s
//    header comment finding 1, and `TODOS.md`'s "`util.representation.guessType`'s
//    `Curve2D`/... branches are blocked by the pre-existing `entityInstance.ts` DERIVED-
//    attribute gap" entry). `createIfcWindowFrameSimple` (this file's own port of
//    `create_ifc_window_frame_simple`) calls `builder.profile()` in BOTH of its own branches
//    (the "no zero thickness" branch's `panel_rect`+`inner_rect`, and the "some zero
//    thickness" branch's per-segment `polyline`) -- but see finding 2 immediately below:
//    EVERY branch also calls `builder.rectangle()`/`builder.polyline(..., closed=true)`
//    FIRST, before `.profile()` is ever reached, so on IFC4/IFC4X3 this specific gap is
//    actually NEVER reached in practice for this file (confirmed empirically, not assumed
//    -- see finding 2's own "Net effect" below). It IS reached, and throws, on IFC2X3 (where
//    `rectangle()`/`polyline(closed)` are fully functional).
// 2. `.rectangle()` (always `polyline(..., closed=true)`) throws on IFC4/IFC4X3 (blocked
//    `IfcLineIndex`/`IfcArcIndex` defined-type creation -- see `shapeBuilder.ts`'s header
//    comment finding 2, and `TODOS.md`'s "`EntityInstance.setByIndex`/`IfcFile.createEntity`
//    cannot write an initial value into a freshly created simple/defined-type instance"
//    entry) but is FULLY FUNCTIONAL on IFC2X3 (no `IfcLineIndex`/`IfcArcIndex` needed there
//    at all). `createIfcWindowElevationRepresentation` (`ELEVATION_VIEW`), `createIfcWindow2dRepresentation`
//    (`PLAN_VIEW`, via its own unconditional `frame_vertical = builder.rectangle(...)` call,
//    reached for every panel regardless of mullion/transom layout), AND
//    `createIfcWindowFrameSimple` (the main `MODEL_VIEW` path -- confirmed empirically, by
//    actually running this file's own test suite, that BOTH of its branches reach
//    `rectangle()`/`polyline(closed=true)` before `.profile()`: the "no zero thickness"
//    branch's very first statement IS `panel_rect = builder.rectangle(...)`; the "has zero
//    thickness" branch's per-segment `polyline(points, closed=True)` call comes before that
//    segment's own `.profile()` call) all call into this gap.
// 3. `builder.getRepresentation(context, items)` with `representationType` omitted (both
//    `ELEVATION_VIEW`'s and `PLAN_VIEW`'s own final call) falls back to
//    `util/representation.ts`'s `guessType`, which -- independently of finding 1 above --
//    ALSO throws on `.get("Dim")` for any real `IfcCurve` item (the identical DERIVED-
//    attribute gap, a different call site). Both representations here only ever build
//    curve items (`IfcPolyline`/`IfcIndexedPolyCurve`), so this throws too, REGARDLESS of
//    schema (including IFC2X3, where `rectangle()`/`polyline()` themselves succeed).
//
// Net effect, traced precisely and confirmed EMPIRICALLY (by actually running
// `test/api/geometry/addWindowRepresentation.test.ts`, not just reasoned about) for every
// `TargetView` x schema combination, once `overallHeight`/`overallWidth` are both supplied
// so the settings-bug above doesn't pre-empt everything -- **on IFC4/IFC4X3, EVERY branch
// is blocked by finding 2 (the `IfcLineIndex`/`IfcArcIndex` gap); finding 1's `.profile()`
// `Dim` gap is only ever actually reached on IFC2X3**:
//   - `ELEVATION_VIEW`, IFC4/IFC4X3: throws inside `builder.rectangle()` (finding 2).
//   - `ELEVATION_VIEW`, IFC2X3: `rectangle()` succeeds; throws inside the final
//     `getRepresentation()` -> `guessType()` call (finding 3).
//   - `PLAN_VIEW`, IFC4/IFC4X3: throws inside the FIRST panel's `frame_vertical =
//     builder.rectangle(...)` call (finding 2) -- before any lining polylines are even built.
//   - `PLAN_VIEW`, IFC2X3: every lining/frame polyline/rectangle call succeeds (confirmed by
//     inspecting the resulting file's own entity count in a dedicated test); throws only at
//     the very end, in the final `getRepresentation()` -> `guessType()` call (finding 3).
//   - Every other `TargetView` (`MODEL_VIEW`, or anything else -- Python's own `execute()`
//     has no explicit `else`/default-view guard, so any `TargetView` other than the 2 special-
//     cased strings falls through to the main 3D loop), IFC4/IFC4X3: throws inside
//     `createIfcWindowFrameSimple`'s own `builder.rectangle()`/`builder.polyline(closed=true)`
//     call, for the FIRST panel of ANY `partitionType` (finding 2).
//   - Every other `TargetView`, IFC2X3: `rectangle()`/`polyline(closed)` succeed; throws
//     inside `createIfcWindowFrameSimple`'s own subsequent `builder.profile()` call, for the
//     FIRST panel (finding 1) -- this means the actual 3D solid geometry this function
//     exists to build can never actually be produced today, on ANY schema, just for 2
//     different underlying reasons depending on schema.
//
// One more real, disclosed, verbatim-preserved quirk found while building this file's own
// test suite: real Python's own default `panel_properties` (`[WindowPanelProperties()]`, a
// SINGLE-entry list) is used regardless of how many distinct panel indices `partition_type`'s
// own `panel_schema` actually needs -- so calling with the default `panelProperties` for any
// multi-panel `partitionType` (e.g. `DOUBLE_PANEL_HORIZONTAL`, needing panel indices 0 AND 1)
// reaches `panels[1]` (Python: `IndexError: list index out of range`; this port: `undefined`,
// so `.frameDepth` throws a plain "Cannot read properties of undefined" TypeError) -- BEFORE
// ever reaching either ShapeBuilder blocker above. Not documented in real Python's own
// docstring, and not fixed here (this port's own analogous JS error is the faithful
// reproduction of an equally-undocumented real Python crash for the identical root cause,
// matching this project's established "let the natural language error surface" precedent
// rather than hand-rolling a Python-flavored `IndexError` message).
//
// Every one of these throws is the NATURAL result of calling into `ShapeBuilder`'s own
// already-ported, already-correctly-blocked methods -- this file adds no new throws of its
// own for these; the full, faithful control flow below reaches each blocked call exactly
// where real Python would, and will "just work" the moment `entityInstance.ts` grows
// EXPRESS DERIVED-attribute support and freshly-created-defined-type initial-value support
// (both already tracked), with zero further changes needed here. See `TODOS.md`'s new entry
// for this chunk's own cross-reference (not a new gap -- the same 2 pre-existing primitive-
// layer gaps, just the most pervasive real-world call site found for them so far).
//
// **UPDATE (Phase EX-2 chunks 1+2, `planning/ifcopenshell-ts/70-express-rules-plan.md` §4) --
// finding 1 ("`.profile()`'s `Dim` gap") is now RESOLVED FOR IFC2X3, finding 2
// (`IfcLineIndex`/`IfcArcIndex`) is UNCHANGED.** `entityInstance.ts`'s DERIVE dispatch now
// resolves `IfcCurve.Dim`/`IfcElementarySurface.Dim`/etc. for real IFC2X3 geometry (see
// `TODOS.md`'s "`util.representation.guessType`'s `Curve2D`/... branches..." entry for the
// full writeup) -- so on IFC2X3, `createIfcWindowFrameSimple`'s `.profile()` call and
// `getRepresentation()`'s `guessType()` fallback (finding 3, itself the same `Dim` gap at a
// different call site) both now succeed, and this function completes end-to-end for every
// `TargetView`/`partitionType` on IFC2X3 (verified against the real, built native addon).
// IFC4/IFC4X3 are unaffected -- finding 2 still fires first there, before finding 1 is ever
// reached, exactly as documented above. `addWindowRepresentation.test.ts` has been updated
// accordingly; this header's own narrative above is left intact as the ORIGINAL, still-
// accurate-for-IFC4/IFC4X3 description of how execution reaches each blocker, not rewritten,
// since IFC4/IFC4X3's own control-flow story is unchanged.
//
// *** Two real, disclosed, verbatim-preserved Python-source quirks (independent of the
// blockers above) ***
//
// 1. `overall_depth = lining_depth + lining_to_panel_offset_y` (`execute`'s own local
//    variable) is computed but never referenced again anywhere else in the function -- a
//    genuinely dead local variable in real Python (confirmed by grepping the whole file: the
//    name appears only in its own definition line and 2 comment lines above it explaining
//    the *intent*, never in an actual expression). Preserved verbatim below (computed, then
//    explicitly discarded via `void` to satisfy this project's lint config) rather than
//    silently dropped, matching this project's "preserve real Python dead code" precedent.
// 2. `create_ifc_window_2d_representation`'s `if panel_i in built_panels: continue` (hit
//    whenever a single logical panel spans more than one column/row of the raw
//    `panel_schema` grid, e.g. `TRIPLE_PANEL_TOP`'s own top row `[0, 0]`) skips BOTH
//    `accumulated_width`'s own increment AND appending anything to `items_2d` for that
//    duplicate column/row -- correct here (not a bug) because `panel_width`/`panel_height`
//    for that exact duplicate slot was never added to `accumulated_width`/`accumulated_height`
//    in the first place (the `unique_cols`/`unique_rows_in_col` computation, via `set()`,
//    already collapses duplicate values before any width/height accumulation math runs) --
//    verified by hand-tracing `TRIPLE_PANEL_TOP`'s own top row exactly, not assumed.
//
// *** `ShapeBuilder` methods used, and their exact signatures verified directly against
// `util/shapeBuilder.ts` (not assumed from the Python method names alone) ***
//
// `deepCopy(element)`, `extrudeKwargs(axis)` (returns `{positionXAxis, positionZAxis,
// extrusionVector}` -- unpacked here as explicit POSITIONAL arguments to `extrude()`, since
// this port's `extrude()` is positional-only, unlike Python's own `**kwargs`-unpacked call),
// `extrude(profileOrCurve, magnitude, position, extrusionVector, positionZAxis,
// positionXAxis, positionYAxis?)`, `getRepresentation(context, items, representationType?)`,
// `mirror(curveOrItem, mirrorAxes?, mirrorPoint?, createCopy?, placementMatrix?)` (in-place
// by default -- `createCopy` must be passed `true` explicitly wherever real Python's own
// call site passes `create_copy=True`), `polyline(points, closed?, positionOffset?,
// arcPoints?)`, `profile(outerCurve, name?, innerCurves?, profileType?)` (the single-non-array-
// curve `innerCurves` call shape, see `shapeBuilder.ts`'s own "quirk 1" -- real Python's
// `builder.profile(panel_rect, inner_curves=inner_rect)` passes a single curve, not a list,
// reproduced identically below, not "fixed" into an array), `rectangle(size, position?)`,
// `translate(curveOrItem, translation, createCopy?)` (in-place by default, matching every
// real Python call site here, none of which passes `create_copy=True` except the 2 explicit
// `frame_horizontal`/`frame_vertical` duplication calls in the `PLAN_VIEW` path).
//
// *** Real Python implements this with an internal `Usecase` class -- flattened into
// several well-named top-level functions here (not one giant function), matching this
// project's own established convention for a file of unusual size/structural complexity:
// `windowLShapeCheck` (exported, pure, matches real Python's own public
// `window_l_shape_check`), `createIfcWindowFrameSimple`/`createIfcWindow` (exported, matching
// real Python's own public `create_ifc_window_frame_simple`/`create_ifc_window`),
// `resolveWindowLiningProperties`/`resolveWindowPanelProperties` (this file's own translation
// of the 2 real Python `@dataclass`es' own `initialize_properties` methods -- a plain TS
// `interface` for the public, all-optional settings shape plus a private "resolved" interface
// once defaults are applied, per this project's established "dataclass -> interface +
// resolve function" convention), `createIfcWindowElevationRepresentation`/
// `createIfcWindow2dRepresentation`/`createIfcWindowModelRepresentation` (the 3 real, mutually-
// exclusive `TargetView` branches, each its own function taking the shared numeric
// lining/mullion/transom settings as a small `WindowGeometryParams` bag rather than as
// closure-captured variables, since these are no longer nested closures once flattened) ***
//
// *** Entity classes verified against the generated `.d.ts`s, not assumed *** -- this file
// itself never directly calls `file.createEntity` for any IFC entity class: every entity
// (`IfcArbitraryClosedProfileDef`/`WithVoids`, `IfcExtrudedAreaSolid`, `IfcShapeRepresentation`,
// `IfcIndexedPolyCurve`/`IfcPolyline`, etc.) is created exclusively through already-verified
// `ShapeBuilder` methods (`shapeBuilder.ts`'s own header comment covers their entity-shape
// verification) or through `addShapeAspect` (already verified in that file's own header
// comment) -- no additional schema verification needed here.
//
// `numpy`: only plain elementwise vector math (`+`, `-`, `.copy()`, `min()` per component) on
// 3/4-component vectors -- ported as plain `number[]`/tuple arithmetic, matching this
// project's own established `util/shapeBuilder.ts` convention (no gl-matrix needed, per that
// file's own header comment). `dataclasses`/`itertools.chain`: ported per this project's
// established idiom (`dataclass` -> `interface` + resolve function; `chain(*iterables)` ->
// `[...a, ...b, ...c]`/`.push(...items)`).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { ShapeBuilder } from "../../util/shapeBuilder";
import { calculateUnitScale, mmToM } from "../../util/unit";
import { wrapUsecase } from "../hooks";
import { addShapeAspect } from "./addShapeAspect";

/** Python: `WINDOW_TYPE = Literal[...]`. */
export type WindowType =
	| "SINGLE_PANEL"
	| "DOUBLE_PANEL_HORIZONTAL"
	| "DOUBLE_PANEL_VERTICAL"
	| "TRIPLE_PANEL_BOTTOM"
	| "TRIPLE_PANEL_HORIZONTAL"
	| "TRIPLE_PANEL_LEFT"
	| "TRIPLE_PANEL_RIGHT"
	| "TRIPLE_PANEL_TOP"
	| "TRIPLE_PANEL_VERTICAL";

/**
 * Describes each partitioning type's panel layout (Python: `DEFAULT_PANEL_SCHEMAS`).
 * Rows go from the top of the window to the bottom; columns are the window's X axis.
 */
export const DEFAULT_PANEL_SCHEMAS: Readonly<Record<WindowType, readonly (readonly number[])[]>> = {
	SINGLE_PANEL: [[0]],
	DOUBLE_PANEL_HORIZONTAL: [[0], [1]],
	DOUBLE_PANEL_VERTICAL: [[0, 1]],
	TRIPLE_PANEL_BOTTOM: [
		[0, 1],
		[2, 2],
	],
	TRIPLE_PANEL_TOP: [
		[0, 0],
		[1, 2],
	],
	TRIPLE_PANEL_LEFT: [
		[0, 1],
		[0, 2],
	],
	TRIPLE_PANEL_RIGHT: [
		[0, 1],
		[2, 1],
	],
	TRIPLE_PANEL_HORIZONTAL: [[0], [1], [2]],
	TRIPLE_PANEL_VERTICAL: [[0, 1, 2]],
};

/** Python: `WindowLiningProperties` dataclass (public, all-optional settings shape). */
export interface WindowLiningProperties {
	/** Optional, defaults to 50mm. */
	liningDepth?: number | null;
	/** Optional, defaults to 50mm. */
	liningThickness?: number | null;
	/** Offset to the wall. Optional, defaults to 50mm. */
	liningOffset?: number | null;
	/** Offset from the wall. Optional, defaults to 25mm. */
	liningToPanelOffsetX?: number | null;
	/** Offset from the lining. Optional, defaults to 25mm. */
	liningToPanelOffsetY?: number | null;
	/**
	 * Mullion thickness (horizontal distance between panels). Applies to windows of
	 * types: DoublePanelVertical, TriplePanelBottom, TriplePanelTop, TriplePanelLeft,
	 * TriplePanelRight. Optional, defaults to 50mm.
	 */
	mullionThickness?: number | null;
	/** Distance from the first lining to the mullion center. Optional, defaults to 300mm. */
	firstMullionOffset?: number | null;
	/**
	 * Distance from the first lining to the second mullion center. Applies to windows
	 * of type: TriplePanelVertical. Optional, defaults to 450mm.
	 */
	secondMullionOffset?: number | null;
	/**
	 * Transom thickness (vertical distance between panels), works similar way to
	 * mullions. Applies to windows of types: DoublePanelHorizontal, TriplePanelBottom,
	 * TriplePanelTop, TriplePanelLeft, TriplePanelRight. Optional, defaults to 50mm.
	 */
	transomThickness?: number | null;
	/** Optional, defaults to 300mm. */
	firstTransomOffset?: number | null;
	/** Applies to windows of type: TriplePanelHorizontal. Optional, defaults to 600mm. */
	secondTransomOffset?: number | null;
	/** Optional. Deprecated argument, never used. */
	shapeAspectStyle?: null;
}

interface ResolvedWindowLiningProperties {
	liningDepth: number;
	liningThickness: number;
	liningOffset: number;
	liningToPanelOffsetX: number;
	liningToPanelOffsetY: number;
	mullionThickness: number;
	firstMullionOffset: number;
	secondMullionOffset: number;
	transomThickness: number;
	firstTransomOffset: number;
	secondTransomOffset: number;
}

/** Python: `WindowLiningProperties.initialize_properties`. */
function resolveWindowLiningProperties(
	props: WindowLiningProperties | undefined,
	unitScale: number,
): ResolvedWindowLiningProperties {
	const p = props ?? {};
	const siConversion = 1 / unitScale;
	const withDefault = (v: number | null | undefined, mm: number): number => v ?? mmToM(mm) * siConversion;
	return {
		liningDepth: withDefault(p.liningDepth, 50),
		liningThickness: withDefault(p.liningThickness, 50),
		liningOffset: withDefault(p.liningOffset, 50),
		liningToPanelOffsetX: withDefault(p.liningToPanelOffsetX, 25),
		liningToPanelOffsetY: withDefault(p.liningToPanelOffsetY, 25),
		mullionThickness: withDefault(p.mullionThickness, 50),
		firstMullionOffset: withDefault(p.firstMullionOffset, 300),
		secondMullionOffset: withDefault(p.secondMullionOffset, 450),
		transomThickness: withDefault(p.transomThickness, 50),
		firstTransomOffset: withDefault(p.firstTransomOffset, 300),
		secondTransomOffset: withDefault(p.secondTransomOffset, 600),
	};
}

/** Python: `WindowPanelProperties` dataclass (public, all-optional settings shape). */
export interface WindowPanelProperties {
	/** Frame thickness by Y axis. Optional, defaults to 35mm. */
	frameDepth?: number | null;
	/** Frame thickness by X axis. Optional, defaults to 35mm. */
	frameThickness?: number | null;
	/** Optional, value is never used. */
	panelPosition?: null;
	/** Optional, value is never used. Defines the basic ways to describe how window panels operate. */
	panelOperation?: null;
	/** Optional. Deprecated argument, never used. */
	shapeAspectStyle?: null;
}

interface ResolvedWindowPanelProperties {
	frameDepth: number;
	frameThickness: number;
}

/** Python: `WindowPanelProperties.initialize_properties`. */
function resolveWindowPanelProperties(
	props: WindowPanelProperties | undefined,
	unitScale: number,
): ResolvedWindowPanelProperties {
	const p = props ?? {};
	const siConversion = 1 / unitScale;
	return {
		frameDepth: p.frameDepth ?? mmToM(35) * siConversion,
		frameThickness: p.frameThickness ?? mmToM(35) * siConversion,
	};
}

export interface AddWindowRepresentationSettings {
	/** The `IfcGeometricRepresentationContext` for the representation. */
	context: EntityInstance;
	/**
	 * Overall window height. Defaults to 0.9m -- **but see this file's header comment**:
	 * omitting this reproduces a real, disclosed, verbatim-preserved upstream-Python bug
	 * (`Usecase.settings` accessed before assignment) and always throws. Must be supplied
	 * explicitly to avoid it.
	 */
	overallHeight?: number | null;
	/**
	 * Overall window width. Defaults to 0.6m -- **see `overallHeight`'s own doc comment**:
	 * omitting this hits the identical disclosed bug.
	 */
	overallWidth?: number | null;
	/** Type of the window. Defaults to `"SINGLE_PANEL"`. */
	partitionType?: WindowType;
	/** `WindowLiningProperties`. See that interface's own field docs for details. */
	liningProperties?: WindowLiningProperties;
	/** A list of `WindowPanelProperties`. See that interface's own field docs for details. */
	panelProperties?: readonly WindowPanelProperties[];
	partOfProduct?: EntityInstance | null;
	/**
	 * The unit scale as calculated by `calculateUnitScale`. If not provided, it will be
	 * automatically calculated.
	 */
	unitScale?: number;
}

/** Shared numeric lining/mullion/transom/glass settings, threaded through the 3
 * `TargetView` branch functions below (Python: closure-captured locals in `execute()`). */
interface WindowGeometryParams {
	liningThickness: number;
	liningDepth: number;
	liningOffset: number;
	liningToPanelOffsetX: number;
	liningToPanelOffsetY: number;
	/** Already halved (Python: `lining_props["MullionThickness"] / 2`). */
	mullionThickness: number;
	firstMullionOffset: number;
	secondMullionOffset: number;
	/** Already halved (Python: `lining_props["TransomThickness"] / 2`). */
	transomThickness: number;
	firstTransomOffset: number;
	secondTransomOffset: number;
	glassThickness: number;
}

/**
 * `thickness` of the profile is defined as a list in the following order: `(LEFT, TOP,
 * RIGHT, BOTTOM)` -- or a single number, applied to all 4 sides (Python:
 * `create_ifc_window_frame_simple`).
 */
export function createIfcWindowFrameSimple(
	builder: ShapeBuilder,
	size: readonly [number, number, number],
	thicknessIn: readonly number[] | number,
	position?: readonly [number, number, number] | null,
): EntityInstance[] {
	const thickness = Array.isArray(thicknessIn)
		? [...(thicknessIn as readonly number[])]
		: [thicknessIn as number, thicknessIn as number, thicknessIn as number, thicknessIn as number];
	const pos: readonly [number, number, number] = position ?? [0, 0, 0];
	const [thLeft, thUp, thRight, thBottom] = thickness;

	const extrudeKwargsY = builder.extrudeKwargs("Y");
	const getExtrudedProfile = (profile: EntityInstance): EntityInstance =>
		builder.extrude(
			profile,
			size[1],
			pos,
			extrudeKwargsY.extrusionVector,
			extrudeKwargsY.positionZAxis,
			extrudeKwargsY.positionXAxis,
		);

	// If all lining sides are present then we can just use two rectangles as inner and
	// outer curves of the profile.
	if (thickness.filter((t) => t === 0).length === 0) {
		const panelRect = builder.rectangle([size[0], size[2]]);

		const innerRectSize: readonly [number, number, number] = [
			size[0] - (thLeft + thRight),
			size[1],
			size[2] - (thBottom + thUp),
		];
		const innerRect = builder.rectangle([innerRectSize[0], innerRectSize[2]], [thLeft, thBottom]);

		// Real Python passes a SINGLE curve (not an array) for `inner_curves` -- see this
		// file's header comment (`profile()`'s "quirk 1").
		const panelProfile = builder.profile(panelRect, null, innerRect);
		return [getExtrudedProfile(panelProfile)];
	}

	// If some side has zero thickness it means we cannot use inner curves and need to
	// generate an L/U shape or just separate rectangles.
	const outerCoords: readonly (readonly [readonly [number, number], readonly [number, number]])[] = [
		[
			[0, 0],
			[0, size[2]],
		],
		[
			[0, size[2]],
			[size[0], size[2]],
		],
		[
			[size[0], size[2]],
			[size[0], 0],
		],
		[
			[size[0], 0],
			[0, 0],
		],
	];
	const innerCoords: readonly (readonly [readonly [number, number], readonly [number, number]])[] = [
		[
			[thLeft, thBottom],
			[thLeft, size[2] - thUp],
		],
		[
			[thLeft, size[2] - thUp],
			[size[0] - thRight, size[2] - thUp],
		],
		[
			[size[0] - thRight, size[2] - thUp],
			[size[0] - thRight, thBottom],
		],
		[
			[size[0] - thRight, thBottom],
			[thLeft, thBottom],
		],
	];

	function getSegmentsFromThickness(): number[][] {
		const segments: number[][] = [];
		let curSegment: number[] = [];
		thickness.forEach((t, i) => {
			if (t === 0) {
				if (curSegment.length) segments.push([...curSegment]);
				curSegment = [];
			} else {
				curSegment.push(i);
			}
		});
		if (curSegment.length) {
			if (segments.length > 0 && segments[0][0] === 0) {
				segments[0] = [...curSegment, ...segments[0]];
			} else {
				segments.push(curSegment);
			}
		}
		return segments;
	}

	function getPoints(segment: readonly number[]): [number, number][] {
		const points: [number, number][] = [];
		for (const side of segment) {
			const outer = outerCoords[side];
			if (side === segment[0]) points.push([outer[0][0], outer[0][1]]);
			points.push([outer[1][0], outer[1][1]]);
		}
		for (const side of [...segment].reverse()) {
			const inner = innerCoords[side];
			if (side === segment[segment.length - 1]) points.push([inner[1][0], inner[1][1]]);
			points.push([inner[0][0], inner[0][1]]);
		}
		return points;
	}

	const segments = getSegmentsFromThickness();
	const segmentsItems: EntityInstance[] = [];
	for (const seg of segments) {
		const polyline = builder.polyline(getPoints(seg), true);
		const panelProfile = builder.profile(polyline);
		segmentsItems.push(getExtrudedProfile(panelProfile));
	}
	return segmentsItems;
}

/**
 * `lining_thickness` and `x_offsets` are expected to be defined as a list, similarly to
 * `createIfcWindowFrameSimple`'s `thickness` argument (Python: `window_l_shape_check`).
 */
export function windowLShapeCheck(
	liningToPanelOffsetYFull: number,
	liningDepth: number,
	liningToPanelOffsetX: readonly number[],
	liningThickness: readonly number[],
): boolean {
	if (liningThickness.length !== liningToPanelOffsetX.length) {
		// Python: `zip(lining_thickness, lining_to_panel_offset_x, strict=True)` raises
		// `ValueError` on a length mismatch.
		throw new Error(
			`windowLShapeCheck: liningThickness (length ${liningThickness.length}) and liningToPanelOffsetX (length ${liningToPanelOffsetX.length}) must have the same length.`,
		);
	}
	if (liningToPanelOffsetYFull >= liningDepth) return false;
	return liningThickness.some((th, i) => liningToPanelOffsetX[i] < th);
}

/**
 * `lining_thickness` and `x_offsets` are expected to be defined as a list, similarly to
 * `createIfcWindowFrameSimple`'s `thickness` argument (Python: `create_ifc_window`).
 */
export function createIfcWindow(
	builder: ShapeBuilder,
	liningSize: readonly [number, number, number],
	liningThickness: readonly [number, number, number, number],
	liningToPanelOffsetX: number,
	liningToPanelOffsetYFull: number,
	frameSize: readonly [number, number, number],
	frameThickness: number,
	glassThickness: number,
	position: readonly [number, number, number],
	xOffsetsIn?: readonly [number, number, number, number] | null,
): { lining: EntityInstance[]; framing: EntityInstance[]; glazing: EntityInstance[] } {
	const liningItems: EntityInstance[] = [];
	let mainLiningSize: [number, number, number] = [...liningSize];

	const xOffsets: readonly [number, number, number, number] = xOffsetsIn ?? [
		liningToPanelOffsetX,
		liningToPanelOffsetX,
		liningToPanelOffsetX,
		liningToPanelOffsetX,
	];

	// Need to check offsets to decide whether lining should be a rectangle or L shaped.
	const lShapeCheck = windowLShapeCheck(liningToPanelOffsetYFull, liningSize[1], xOffsets, liningThickness);

	if (lShapeCheck) {
		mainLiningSize = [...liningSize];
		mainLiningSize[1] = liningToPanelOffsetYFull;

		const secondLiningSize: [number, number, number] = [...liningSize];
		secondLiningSize[1] = liningSize[1] - liningToPanelOffsetYFull;
		const secondLiningPosition: [number, number, number] = [0, liningToPanelOffsetYFull, 0];
		const secondLiningThickness = liningThickness.map((th, i) => Math.min(th, xOffsets[i])) as [
			number,
			number,
			number,
			number,
		];

		const secondLiningItems = createIfcWindowFrameSimple(
			builder,
			secondLiningSize,
			secondLiningThickness,
			secondLiningPosition,
		);
		liningItems.push(...secondLiningItems);
	}

	const mainLiningItems = createIfcWindowFrameSimple(builder, mainLiningSize, liningThickness);
	liningItems.push(...mainLiningItems);

	const framePosition: [number, number, number] = [xOffsets[0], liningToPanelOffsetYFull, xOffsets[3]];

	const frameExtrudedItems = createIfcWindowFrameSimple(builder, frameSize, frameThickness, framePosition);

	const extrudeKwargsY = builder.extrudeKwargs("Y");
	const glassPosition: [number, number, number] = [
		framePosition[0],
		framePosition[1] + frameSize[1] / 2 - glassThickness / 2,
		framePosition[2],
	];
	const glassRect = builder.deepCopy(
		((frameExtrudedItems[0].get("SweptArea") as EntityInstance).get("InnerCurves") as EntityInstance[])[0],
	);
	const glass = builder.extrude(
		glassRect,
		glassThickness,
		glassPosition,
		extrudeKwargsY.extrusionVector,
		extrudeKwargsY.positionZAxis,
		extrudeKwargsY.positionXAxis,
	);

	builder.translate([...liningItems, ...frameExtrudedItems, glass], position);

	return { lining: liningItems, framing: frameExtrudedItems, glazing: [glass] };
}

/** Python: `Usecase.execute`'s `create_ifc_window_2d_representation`'s `get_lining_shape`
 * nested closure, hoisted to a top-level helper since it's a pure function of its own
 * arguments (no closure over per-panel loop state beyond what's passed explicitly). */
function getLiningShape(
	builder: ShapeBuilder,
	g: WindowGeometryParams,
	liningToPanelOffsetYFull: number,
	panelWidth: number,
	liningThicknessArg: number,
	closed: boolean,
	mirror: boolean,
	xOffsetArg?: number,
): EntityInstance {
	const xOffset = xOffsetArg ?? g.liningToPanelOffsetX;
	const lShapeCheck = windowLShapeCheck(liningToPanelOffsetYFull, g.liningDepth, [xOffset], [liningThicknessArg]);
	let liningShape: EntityInstance;
	if (lShapeCheck) {
		liningShape = builder.polyline(
			[
				[0, g.liningDepth],
				[xOffset, g.liningDepth],
				[xOffset, liningToPanelOffsetYFull],
				[liningThicknessArg, liningToPanelOffsetYFull],
				[liningThicknessArg, 0],
				[0, 0],
			],
			closed,
		);
	} else {
		liningShape = builder.polyline(
			[
				[0, g.liningDepth],
				[liningThicknessArg, g.liningDepth],
				[liningThicknessArg, 0],
				[0, 0],
			],
			closed,
		);
	}

	if (mirror) {
		builder.mirror(liningShape, [1, 0], [panelWidth / 2, 0]);
	}

	return liningShape;
}

/** Python: `Usecase.execute`'s `create_ifc_window_2d_representation` (the `PLAN_VIEW` branch). */
function createIfcWindow2dRepresentation(
	builder: ShapeBuilder,
	context: EntityInstance,
	overallWidth: number,
	reversedPanelSchema: readonly (readonly number[])[],
	panels: readonly ResolvedWindowPanelProperties[],
	g: WindowGeometryParams,
): EntityInstance {
	const items2d: EntityInstance[] = [];

	const topRow = reversedPanelSchema[reversedPanelSchema.length - 1];
	const uniqueCols = new Set(topRow).size;
	const builtPanels: number[] = [];
	let accumulatedWidth = 0;

	for (let columnI = 0; columnI < topRow.length; columnI++) {
		const panelI = topRow[columnI];
		const curPanelItems: EntityInstance[] = [];

		// Lists represent left and right linings.
		const windowLiningThickness: [number, number] = [g.liningThickness, g.liningThickness];
		const closedLining: [boolean, boolean] = [true, true];

		if (builtPanels.includes(panelI)) continue;

		// Detect mullion.
		const hasMullion = uniqueCols > 1;
		const firstColumn = columnI === 0;
		const lastColumn = columnI === uniqueCols - 1;
		const leftToMullion = hasMullion && !lastColumn;
		const rightToMullion = hasMullion && !firstColumn;

		let panelWidth: number;
		if (hasMullion) {
			if (firstColumn) panelWidth = g.firstMullionOffset;
			else if (lastColumn) panelWidth = overallWidth - accumulatedWidth;
			else panelWidth = g.secondMullionOffset - accumulatedWidth;

			// Mullion thickness.
			if (!firstColumn) {
				windowLiningThickness[0] = g.mullionThickness;
				closedLining[0] = false;
			}
			if (!lastColumn) {
				windowLiningThickness[1] = g.mullionThickness;
				closedLining[1] = false;
			}
		} else {
			panelWidth = overallWidth;
		}

		const cur = panels[panelI];
		const frameDepth = cur.frameDepth;
		const frameThickness = cur.frameThickness;
		const liningToPanelOffsetYFull = g.liningDepth - frameDepth + g.liningToPanelOffsetY;
		const baseFrameClear = g.liningToPanelOffsetX + frameThickness - g.liningThickness;
		const currentOffsetX = baseFrameClear - frameThickness + g.mullionThickness;

		// Add lining.
		curPanelItems.push(
			builder.polyline([
				[windowLiningThickness[0], 0],
				[panelWidth - windowLiningThickness[1], 0],
			]),
		);

		curPanelItems.push(
			getLiningShape(
				builder,
				g,
				liningToPanelOffsetYFull,
				panelWidth,
				windowLiningThickness[0],
				closedLining[0],
				false,
				rightToMullion ? currentOffsetX : undefined,
			),
			getLiningShape(
				builder,
				g,
				liningToPanelOffsetYFull,
				panelWidth,
				windowLiningThickness[1],
				closedLining[1],
				true,
				leftToMullion ? currentOffsetX : undefined,
			),
		);

		// Add frame.
		const frameItems: EntityInstance[] = [];

		const framePosition: [number, number] = [
			rightToMullion ? currentOffsetX : g.liningToPanelOffsetX,
			liningToPanelOffsetYFull,
		];

		let frameWidth = panelWidth;
		frameWidth -= leftToMullion ? currentOffsetX : g.liningToPanelOffsetX;
		frameWidth -= rightToMullion ? currentOffsetX : g.liningToPanelOffsetX;

		const frameVertical = builder.rectangle([frameThickness, frameDepth]);
		frameItems.push(frameVertical, builder.mirror(frameVertical, [1, 0], [frameWidth / 2, 0], true) as EntityInstance);

		const frameHorizontal = builder.polyline([
			[frameThickness, 0],
			[frameWidth - frameThickness, 0],
		]);
		frameItems.push(frameHorizontal, builder.translate(frameHorizontal, [0, frameDepth], true) as EntityInstance);
		// Glass.
		frameItems.push(builder.translate(frameHorizontal, [0, frameDepth / 2], true) as EntityInstance);

		builder.translate(frameItems, framePosition);
		curPanelItems.push(...frameItems);

		builder.translate(curPanelItems, [accumulatedWidth, 0]);

		accumulatedWidth += panelWidth;
		builtPanels.push(panelI);
		items2d.push(...curPanelItems);
	}

	builder.translate(items2d, [0, g.liningOffset]);
	return builder.getRepresentation(context, items2d);
}

/** Python: `Usecase.execute`'s `ELEVATION_VIEW` early-return branch. */
function createIfcWindowElevationRepresentation(
	builder: ShapeBuilder,
	context: EntityInstance,
	overallWidth: number,
	overallHeight: number,
): EntityInstance {
	const rect = builder.rectangle([overallWidth, 0, overallHeight]);
	return builder.getRepresentation(context, rect);
}

/** Python: `Usecase.execute`'s main (non-`ELEVATION_VIEW`/`PLAN_VIEW`) 3D loop. */
function createIfcWindowModelRepresentation(
	file: IfcFile,
	builder: ShapeBuilder,
	context: EntityInstance,
	overallWidth: number,
	overallHeight: number,
	reversedPanelSchema: readonly (readonly number[])[],
	panels: readonly ResolvedWindowPanelProperties[],
	g: WindowGeometryParams,
	partOfProduct: EntityInstance | null,
): EntityInstance {
	const panelSchema = reversedPanelSchema;
	const accumulatedHeight: number[] = new Array(panelSchema[0].length).fill(0);
	const builtPanels: number[] = [];
	const windowItems: EntityInstance[] = [];
	const liningItems: EntityInstance[] = [];
	const framingItems: EntityInstance[] = [];
	const glazingItems: EntityInstance[] = [];

	// TODO (matches Python): need a more readable way to define panel width and height.
	const uniqueRowsInCol: number[] = panelSchema[0].map(
		(_, columnI) => new Set(panelSchema.map((row) => row[columnI])).size,
	);

	for (let rowI = 0; rowI < panelSchema.length; rowI++) {
		const panelRow = panelSchema[rowI];
		let accumulatedWidth = 0;
		const uniqueCols = new Set(panelRow).size;

		for (let columnI = 0; columnI < panelRow.length; columnI++) {
			const panelI = panelRow[columnI];

			// Detect mullion.
			const hasMullion = uniqueCols > 1;
			const firstColumn = columnI === 0;
			const lastColumn = columnI === uniqueCols - 1;
			const leftToMullion = hasMullion && !lastColumn;
			const rightToMullion = hasMullion && !firstColumn;

			// Detect transom.
			const hasTransom = uniqueRowsInCol[columnI] > 1;
			const firstRow = rowI === 0;
			const lastRow = rowI === uniqueRowsInCol[columnI] - 1;
			const topToTransom = hasTransom && !firstRow;
			const bottomToTransom = hasTransom && !lastRow;

			// Calculate current panel dimensions.
			let panelWidth: number;
			if (hasMullion) {
				if (firstColumn) panelWidth = g.firstMullionOffset;
				else if (lastColumn) panelWidth = overallWidth - accumulatedWidth;
				else panelWidth = g.secondMullionOffset - accumulatedWidth;
			} else {
				panelWidth = overallWidth;
			}

			let panelHeight: number;
			if (hasTransom) {
				if (firstRow) panelHeight = g.firstTransomOffset;
				else if (lastRow) panelHeight = overallHeight - accumulatedHeight[columnI];
				else panelHeight = g.secondTransomOffset - accumulatedHeight[columnI];
			} else {
				panelHeight = overallHeight;
			}

			if (builtPanels.includes(panelI)) {
				accumulatedHeight[columnI] += panelHeight;
				accumulatedWidth += panelWidth;
				continue;
			}

			const curPanel = panels[panelI];
			const frameDepth = curPanel.frameDepth;
			const frameThickness = curPanel.frameThickness;
			const liningToPanelOffsetYFull = g.liningDepth - frameDepth + g.liningToPanelOffsetY;

			// Calculate lining thickness and frame size/offset, taking into account
			// mullions and transoms.
			const windowLiningThickness: [number, number, number, number] = [
				rightToMullion ? g.mullionThickness : g.liningThickness,
				bottomToTransom ? g.transomThickness : g.liningThickness,
				leftToMullion ? g.mullionThickness : g.liningThickness,
				topToTransom ? g.transomThickness : g.liningThickness,
			];

			// X offsets can differ if there are mullions or transoms because we're trying
			// to maintain symmetry.
			const baseFrameClear = g.liningToPanelOffsetX + frameThickness - g.liningThickness;
			const currentOffsetX = baseFrameClear - frameThickness + g.mullionThickness;
			const currentOffsetZ = baseFrameClear - frameThickness + g.transomThickness;
			const xOffsets: [number, number, number, number] = [
				rightToMullion ? currentOffsetX : g.liningToPanelOffsetX, // LEFT
				bottomToTransom ? currentOffsetZ : g.liningToPanelOffsetX, // TOP
				leftToMullion ? currentOffsetX : g.liningToPanelOffsetX, // RIGHT
				topToTransom ? currentOffsetZ : g.liningToPanelOffsetX, // BOTTOM
			];

			const windowLiningSize: [number, number, number] = [panelWidth, g.liningDepth, panelHeight];
			const frameSize: [number, number, number] = [
				panelWidth - (xOffsets[0] + xOffsets[2]),
				frameDepth,
				panelHeight - (xOffsets[1] + xOffsets[3]),
			];

			const windowPanelPosition: [number, number, number] = [accumulatedWidth, 0, accumulatedHeight[columnI]];

			// Create window panel.
			const currentWindowItems = createIfcWindow(
				builder,
				windowLiningSize,
				windowLiningThickness,
				g.liningToPanelOffsetX,
				liningToPanelOffsetYFull,
				frameSize,
				frameThickness,
				g.glassThickness,
				windowPanelPosition,
				xOffsets,
			);
			builtPanels.push(panelI);
			windowItems.push(...currentWindowItems.lining, ...currentWindowItems.framing, ...currentWindowItems.glazing);
			liningItems.push(...currentWindowItems.lining);
			framingItems.push(...currentWindowItems.framing);
			glazingItems.push(...currentWindowItems.glazing);

			accumulatedHeight[columnI] += panelHeight;
			accumulatedWidth += panelWidth;
		}
	}

	builder.translate(windowItems, [0, g.liningOffset, 0]); // Wall offset.
	const representation = builder.getRepresentation(context, windowItems);
	if (partOfProduct) {
		addShapeAspect(file, { name: "Lining", items: liningItems, representation, partOfProduct });
		addShapeAspect(file, { name: "Framing", items: framingItems, representation, partOfProduct });
		addShapeAspect(file, { name: "Glazing", items: glazingItems, representation, partOfProduct });
	}

	return representation;
}

function convertSiToUnit(value: number, unitScale: number): number {
	return value / unitScale;
}

/** See this file's header comment: real Python's own genuine evaluation-order bug --
 * `Usecase.settings` is accessed (via `convert_si_to_unit`) before it is ever assigned,
 * whenever `overallHeight`/`overallWidth` is omitted. Preserved verbatim as an explicit
 * throw at the exact same point real Python would crash. */
function resolveOverallDimension(
	value: number | null | undefined,
	paramName: "overallHeight" | "overallWidth",
): number {
	if (value !== undefined && value !== null) return value;
	throw new Error(
		`addWindowRepresentation: '${paramName}' was omitted. Real Python's own add_window_representation() has a genuine, verbatim-preserved evaluation-order bug computing this exact default (it calls Usecase.convert_si_to_unit() before Usecase.settings is ever assigned, raising "AttributeError: 'Usecase' object has no attribute 'settings'") -- see this file's own header comment. Pass '${paramName}' explicitly to work around it.`,
	);
}

function addWindowRepresentationUsecase(file: IfcFile, settings: AddWindowRepresentationSettings): EntityInstance {
	const { context } = settings;
	// Define unit_scale first as it's going to be used setting default arguments.
	const unitScale = settings.unitScale ?? calculateUnitScale(file);

	const resolvedLining = resolveWindowLiningProperties(settings.liningProperties, unitScale);

	const panelPropertiesIn = settings.panelProperties ?? [{}];
	const panels = panelPropertiesIn.map((p) => resolveWindowPanelProperties(p, unitScale));

	// See this file's header comment: throws here (or on the next line) if either
	// dimension is omitted, reproducing real Python's own genuine, verbatim-preserved bug.
	const overallHeight = resolveOverallDimension(settings.overallHeight, "overallHeight");
	const overallWidth = resolveOverallDimension(settings.overallWidth, "overallWidth");

	const partitionType = settings.partitionType ?? "SINGLE_PANEL";
	const panelSchema = DEFAULT_PANEL_SCHEMAS[partitionType];
	if (!panelSchema) {
		throw new Error(`addWindowRepresentation: unknown partitionType '${partitionType}'.`);
	}

	const builder = new ShapeBuilder(file);

	if ((context.get("TargetView") as string | null) === "ELEVATION_VIEW") {
		return createIfcWindowElevationRepresentation(builder, context, overallWidth, overallHeight);
	}

	const reversedPanelSchema = [...panelSchema].reverse();

	const liningThickness = resolvedLining.liningThickness;
	const liningDepth = resolvedLining.liningDepth;
	const liningOffset = resolvedLining.liningOffset;
	const liningToPanelOffsetX = resolvedLining.liningToPanelOffsetX;
	const liningToPanelOffsetY = resolvedLining.liningToPanelOffsetY;
	// Real Python quirk: computed, never used again anywhere else in the function -- see
	// this file's header comment.
	const overallDepth = liningDepth + liningToPanelOffsetY;
	void overallDepth;

	const g: WindowGeometryParams = {
		liningThickness,
		liningDepth,
		liningOffset,
		liningToPanelOffsetX,
		liningToPanelOffsetY,
		mullionThickness: resolvedLining.mullionThickness / 2,
		firstMullionOffset: resolvedLining.firstMullionOffset,
		secondMullionOffset: resolvedLining.secondMullionOffset,
		transomThickness: resolvedLining.transomThickness / 2,
		firstTransomOffset: resolvedLining.firstTransomOffset,
		secondTransomOffset: resolvedLining.secondTransomOffset,
		glassThickness: convertSiToUnit(0.01, unitScale),
	};

	if ((context.get("TargetView") as string | null) === "PLAN_VIEW") {
		return createIfcWindow2dRepresentation(builder, context, overallWidth, reversedPanelSchema, panels, g);
	}

	return createIfcWindowModelRepresentation(
		file,
		builder,
		context,
		overallWidth,
		overallHeight,
		reversedPanelSchema,
		panels,
		g,
		settings.partOfProduct ?? null,
	);
}

/**
 * Adds a window representation (Python: `ifcopenshell.api.geometry.add_window_representation`).
 *
 * **Read this file's own header comment before using this function**: real Python's own
 * implementation has a genuine, verbatim-preserved evaluation-order bug that crashes
 * whenever `overallHeight`/`overallWidth` is omitted -- both must be supplied explicitly.
 * Beyond that, the actual 3D solid geometry this function builds cannot be produced today
 * on ANY schema (a separate, pre-existing, already-tracked `ShapeBuilder`/`entityInstance.ts`
 * primitive-layer gap -- see the header comment for the exact blocked call per `TargetView`/
 * schema combination).
 *
 * @param settings.context The `IfcGeometricRepresentationContext` for the representation.
 * @param settings.overallHeight Overall window height. Must be supplied explicitly (see
 * this file's header comment).
 * @param settings.overallWidth Overall window width. Must be supplied explicitly (see this
 * file's header comment).
 * @param settings.partitionType Type of the window. Defaults to `"SINGLE_PANEL"`.
 * @param settings.liningProperties `WindowLiningProperties`. See that interface's own field
 * docs for details.
 * @param settings.panelProperties A list of `WindowPanelProperties`. See that interface's
 * own field docs for details.
 * @param settings.unitScale The unit scale as calculated by `calculateUnitScale`. If not
 * provided, it will be automatically calculated.
 * @returns The `IfcShapeRepresentation` for a window.
 */
export const addWindowRepresentation = wrapUsecase(
	"geometry.add_window_representation",
	addWindowRepresentationUsecase,
);
