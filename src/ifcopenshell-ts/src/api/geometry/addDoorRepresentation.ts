// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/add_door_representation.py` (src/ifcopenshell-python,
// 675 lines) -- lands directly after `add_window_representation` (see `./index.ts`'s own
// header comment for the module's overall scope; `api.geometry` now has 27 of ~29 real files
// landed). A parametric door-geometry generator: lining/threshold/casing/panel/handle solids
// arranged per an `operation_type` (single/double swing, double-door, sliding), an optional
// "on top" window panel (a `TRANSOM`), plus separate 2D (`PLAN_VIEW`, including a distinct
// `ContextIdentifier === "Annotation"` sliding-door arrow-symbol sub-branch) and elevation
// (`ELEVATION_VIEW`) representations. `create_ifc_window` (this same module's own dependency,
// exported from `./addWindowRepresentation.ts`, landed immediately before this file) is
// called directly for the transom. No real Python test file exists for this module
// (confirmed by direct search -- `test/api/geometry/test_add_door_representation.py` does not
// exist); all test coverage below is original, written directly against the real source.
//
// *** READ THIS FIRST: a real, severe, PRE-EXISTING upstream-Python bug, THE SAME SHAPE as
// the one found and disclosed in the immediately-preceding `add_window_representation` chunk,
// independently re-verified here against THIS file's own actual source lines (not assumed
// from the window file's finding) -- blocks the DOCUMENTED DEFAULT USAGE of this function on
// every schema, before any geometry work even begins. ***
//
// Real Python's public wrapper function builds a plain `Usecase()` instance and assigns
// `usecase.file = file` -- but does NOT assign `usecase.settings` until AFTER the
// `settings.update({...})` dict-literal call that computes `overall_height`/`overall_width`'s
// own defaults:
//
//     usecase.file = file
//     ...
//     lining_properties.initialize_properties(unit_scale)      # doesn't touch usecase.settings
//     lining_properties = dataclasses.asdict(lining_properties)
//     panel_properties.initialize_properties(unit_scale)        # doesn't touch usecase.settings
//     panel_properties = dataclasses.asdict(panel_properties)
//     settings.update({
//         ...
//         "overall_height": overall_height if overall_height is not None else usecase.convert_si_to_unit(2.0),
//         "overall_width":  overall_width  if overall_width  is not None else usecase.convert_si_to_unit(0.9),
//         ...
//     })
//     usecase.settings = settings   # <-- only assigned HERE, AFTER the dict above was built
//
// Identical root cause to `add_window_representation`'s own disclosed bug: `Usecase` is a
// plain class with bare type annotations (`file: ifcopenshell.file` / `settings: dict[str,
// Any]`), which create NO actual instance/class attribute at all until a real assignment
// executes. `Usecase.convert_si_to_unit` reads `self.settings["unit_scale"]` -- so calling it
// (only reached because `overall_height`/`overall_width` is `None`, since the conditional
// expression's other branch is never evaluated) raises `AttributeError: 'Usecase' object has
// no attribute 'settings'`. This door file's own documented defaults are 2.0m/0.9m
// (DIFFERENT from window's 0.9m/0.6m) -- confirmed by reading `add_door_representation`'s own
// docstring and the `settings.update(...)` call's own literal values directly, not assumed
// identical to window's. **Every real call that omits either dimension (the documented
// default/most-common usage) crashes upstream, on every schema, before `Usecase.execute()` is
// ever reached** -- unrelated to any `ShapeBuilder` gap below; it fires purely from Python's
// own evaluation order, exactly as with `add_window_representation`. Not tracked as a new
// "fix later" TS-port item (nothing to port differently without deviating from real Python's
// own actual behavior) -- reproduced verbatim below as an explicit, descriptive throw at the
// exact same point real Python would crash, one parameter at a time in real Python's own
// dict-literal key order (`overall_height` before `overall_width`), pinned by dedicated
// regression tests.
//
// *** Second, independent class of blocker: the SAME 2 pre-existing, already-tracked
// `util/shapeBuilder.ts`/`entityInstance.ts` primitive-layer gaps disclosed by
// `addWindowRepresentation.ts`'s own header comment -- not new findings, just another
// pervasive real-world call site for them (`createIfcDoorLining`/`createIfcBox` both build a
// closed polyline/rectangle and then unconditionally extrude it; the PLAN_VIEW/ELEVATION_VIEW
// branches build closed polylines/rectangles too) ***
//
// 1. `ShapeBuilder.extrude()` auto-wraps a non-`IfcProfileDef` argument via its own internal
//    `this.profile(profile)` call -- which unconditionally throws via `.get("Dim")` (the
//    EXPRESS DERIVED-attribute gap; see `TODOS.md`'s "`util.representation.guessType`'s
//    `Curve2D`/... branches..." entry). Unlike `add_window_representation`'s own
//    `createIfcWindowFrameSimple` (which calls `builder.profile()` EXPLICITLY itself before
//    extruding, so its own explicit call is what throws), THIS file's `createIfcDoorLining`/
//    `createIfcBox` never call `.profile()` themselves at all -- they pass a raw curve/
//    rectangle straight into `builder.extrude()`, whose own internal auto-wrap is what
//    reaches the gap. Same underlying gap, reached one call-frame deeper.
// 2. `.rectangle()`/`.polyline(closed=true)` throw on IFC4/IFC4X3 only (the `IfcLineIndex`/
//    `IfcArcIndex` defined-type-creation gap; see `TODOS.md`'s "`EntityInstance.setByIndex`/
//    `IfcFile.createEntity` cannot write an initial value..." entry), fully functional on
//    IFC2X3.
//
// Traced precisely per branch (once `overallHeight`/`overallWidth` are both supplied so the
// settings-order bug above doesn't pre-empt everything):
//   - `ELEVATION_VIEW`: `builder.rectangle(...)` -- throws via gap 2 on IFC4/IFC4X3; on
//     IFC2X3, `rectangle()` succeeds, then the final `getRepresentation()` (no explicit
//     `representationType`) falls back to `guessType()`, which throws via gap 1's identical
//     `.get("Dim")` check on the resulting `IfcPolyline` -- same 2-gap shape as
//     `add_window_representation`'s own `ELEVATION_VIEW` branch.
//   - `PLAN_VIEW`, non-`Annotation` `ContextIdentifier`: the FIRST lining/panel curve built is
//     always either `builder.rectangle(...)` or `builder.polyline(..., closed=true)` (the
//     L-shaped-lining branch) -- throws via gap 2 on IFC4/IFC4X3. On IFC2X3, every lining/
//     panel/handle-adjacent 2D curve succeeds (this branch never calls `.extrude()` or
//     `.profile()` at all -- it only ever builds/mirrors/translates flat 2D curves), so
//     execution reaches the very end: the final `getRepresentation(context, items2d)` (no
//     explicit `representationType`) falls back to `guessType()`, which throws via gap 1.
//   - `PLAN_VIEW`, `ContextIdentifier === "Annotation"` (sliding doors only -- non-sliding
//     doors just return `null` here, no representation, no throw): **this sub-branch is
//     GENUINELY UNBLOCKED, on every schema.** Its own 2 `builder.polyline(...)` calls are
//     BOTH left `closed` at its default `false` (real Python never passes `closed=True` here,
//     unlike literally every other lining/panel curve in this file) -- so gap 2 is never
//     reached. Its own final `builder.getRepresentation(context, items2d, "Curve2D")` passes
//     an EXPLICIT `representationType`, bypassing `guessType()` entirely -- so gap 1 is never
//     reached either. Confirmed empirically (see `addDoorRepresentation.test.ts`'s own
//     dedicated non-throwing assertions) -- this is the ONE code path in this entire 675-line
//     file, across both this file and `add_window_representation`'s own equally-blocked
//     branches, that actually produces a real `IfcShapeRepresentation` today, on every schema.
//     A further real, disclosed Python-source quirk found while writing this branch's own
//     dedicated (non-throwing) tests: `door_swing_type` ("LEFT" vs "RIGHT", derived from
//     `operation_type`'s own suffix) is never computed or read anywhere in this early-return
//     branch -- so `SLIDING_TO_LEFT` and `SLIDING_TO_RIGHT` produce BYTE-IDENTICAL annotation
//     geometry (confirmed empirically: both directions' resulting polyline coordinates are
//     exactly equal, not just visually similar). Every OTHER branch that builds a sliding
//     door's own leaf geometry (`createIfcDoorPanel2d`'s own `create_ifc_door_sliding_panel_2d`
//     delegate; the main 3D `createIfcDoorPanel`) DOES mirror on `door_swing_type` -- this one
//     early-return branch simply never reaches that logic, since it returns before
//     `door_swing_type` is ever computed in real Python's own `execute()`. Preserved verbatim
//     (not treated as a bug to fix) since there is nothing to port differently without
//     deviating from real Python's own actual, oddly-direction-agnostic annotation behavior.
//   - Every other `TargetView` (`MODEL_VIEW`, or anything else -- real Python's own
//     `execute()` has no explicit else/default-view guard here either, matching
//     `add_window_representation`'s own identical quirk): the very first statement reachable
//     is `createIfcDoorLining(...)` (either the L-shaped second-lining branch or the main
//     lining, depending on `doorLShapeCheck`) -- its own internal `builder.polyline(...,
//     true)` throws via gap 2 on IFC4/IFC4X3. On IFC2X3, that polyline succeeds, and
//     `createIfcDoorLining`'s own subsequent `builder.extrude(...)` call reaches gap 1 (via
//     `extrude()`'s own internal auto-`.profile()` wrap -- see finding 1 above) immediately,
//     before threshold/casing/panel/handle/transom-window construction is ever reached.
//
// Net effect: **the real 3D solid door geometry, and the real 2D plan-view door leaf/lining
// drawing, this function exists to build cannot be produced today, on ANY schema** -- ported
// completely and faithfully anyway (every branch -- single/double swing, double-door,
// sliding, the L-shaped-lining check, threshold, casing, handle placement, the on-top
// "transom" window via `createIfcWindow` -- is real, correct, verbatim-translated control
// flow, reachable end-to-end the moment both underlying gaps are fixed, with zero further
// changes needed here) -- EXCEPT the `PLAN_VIEW`+`Annotation` sliding-door arrow symbol,
// which already works today and is pinned with real (non-throwing) geometry assertions
// rather than "throws the disclosed error".
//
// **UPDATE (Phase EX-2 chunks 1+2, `planning/ifcopenshell-ts/70-express-rules-plan.md` §4) --
// gap 1 ("`.get("Dim")`'s EXPRESS DERIVED-attribute gap") is now RESOLVED FOR IFC2X3, gap 2
// (`IfcLineIndex`/`IfcArcIndex`) is UNCHANGED.** `entityInstance.ts`'s DERIVE dispatch now
// resolves `IfcCurve.Dim`/`IfcElementarySurface.Dim`/etc. for real IFC2X3 geometry (see
// `TODOS.md`'s "`util.representation.guessType`'s `Curve2D`/... branches..." entry). On
// IFC2X3, every branch above that used to reach gap 1 (`guessType()`'s fallback, and
// `extrude()`'s internal auto-`.profile()` wrap) now succeeds instead, so this function
// completes end-to-end for every `TargetView`/`operationType` on IFC2X3 (verified against the
// real, built native addon). IFC4/IFC4X3 are unaffected -- gap 2 still fires first there,
// exactly as documented above. `addDoorRepresentation.test.ts` has been updated accordingly;
// this header's own narrative above is left intact as the ORIGINAL, still-accurate-for-
// IFC4/IFC4X3 description of how execution reaches each blocker.
//
// *** One more real, disclosed, verbatim-preserved Python-source quirk, independent of the
// blockers above: `DoorPanelProperties.PanelWidth`'s default (`1.0`) is a plain DATACLASS
// FIELD default, applied only when the key is OMITTED entirely -- unlike every other field in
// both `DoorLiningProperties`/`DoorPanelProperties`, whose defaulting instead goes through
// `initialize_properties`'s own `if getattr(self, attr) is not None: continue` check (which
// treats an EXPLICIT `None` the same as omission). A real `panel_properties={"PanelWidth":
// None}` therefore survives `initialize_properties` untouched (it's not one of the fields
// `initialize_properties` even looks at) and later crashes `door_opening_width *
// panel_props["PanelWidth"]` with a real Python `TypeError` (float * None). This port applies
// `panelWidth`'s default via `??` uniformly with every other field (an explicit `null` is
// treated the same as omission here), rather than reproducing the omission-vs-explicit-null
// distinction for this one field alone -- a corner case with no legitimate real-world use,
// and one that would require a different settings-resolution shape just for this field. ***
//
// *** `ShapeBuilder` methods used, and their exact signatures verified directly against
// `util/shapeBuilder.ts` (not assumed from the Python method names alone) -- the same set
// `addWindowRepresentation.ts`'s own header comment already verified, plus 2 new ones this
// file is the first `api.geometry` file to actually call ***
//
// `createEllipseCurve(xAxisRadius, yAxisRadius, position?, trimPoints?, refXDirection?,
// trimPointsMask?)` (NEW here -- used by the PLAN_VIEW swing-arc symbol), `extrude(...)`,
// `extrudeKwargs(axis)`, `getRepresentation(...)`, `mirror(...)`, `polyline(...)`,
// `rectangle(...)`, `translate(...)` -- all matching `addWindowRepresentation.ts`'s own
// already-verified signatures. `createEllipseCurve` itself never calls `.get("Dim")` (it
// builds an `IfcEllipse`/`IfcTrimmedCurve` directly, no `profile()`/`guessType()` involved) --
// confirmed by reading its own source, not assumed safe.
//
// *** Real Python implements this with an internal `Usecase` class -- flattened into several
// well-named top-level functions here, matching `addWindowRepresentation.ts`'s own
// established convention for this exact class of file: `createIfcDoorLining`/`createIfcBox`
// (exported, matching real Python's own public `create_ifc_door_lining`/`create_ifc_box`),
// `doorLShapeCheck` (exported, matching real Python's own nested `l_shape_check` closure --
// hoisted since it's a pure function of its own arguments), `resolveDoorLiningProperties`/
// `resolveDoorPanelProperties` (this file's own translation of the 2 real Python
// `@dataclass`es' own `initialize_properties` methods, per this project's established
// "dataclass -> interface + resolve function" convention), `computeDoorGeometryParams`
// (real Python's own large block of shared local variables computed once, right after the
// `ELEVATION_VIEW` early return, used by BOTH the `PLAN_VIEW` and 3D-model branches --
// bundled into one `DoorGeometryParams` object rather than threaded as 30+ separate
// parameters), `createIfcDoorElevationRepresentation`/`createIfcDoorAnnotationRepresentation`/
// `createIfcDoorPlanRepresentation`/`createIfcDoorModelRepresentation` (the mutually-exclusive
// `TargetView`/`ContextIdentifier` branches), `createIfcDoorPanel2d`/
// `createIfcDoorSlidingPanel2d`/`createIfcDoorPanel` (real Python's own nested closures,
// hoisted to module-private helpers since none of them are part of real Python's own public
// API). ***
//
// *** Entity classes verified against the generated `.d.ts`s, not assumed *** -- this file
// itself never directly calls `file.createEntity` for any IFC entity class: every entity is
// created exclusively through already-verified `ShapeBuilder` methods (`shapeBuilder.ts`'s own
// header comment covers their entity-shape verification), `createIfcWindow` (verified in
// `addWindowRepresentation.ts`'s own header comment), or `addShapeAspect` (verified in that
// file's own header comment) -- no additional schema verification needed here.
//
// `numpy`: only plain elementwise vector math (`+`, `-`, `.copy()`, slicing, `min()`/`max()`
// per component) on 2/3-component vectors -- ported as plain `number[]`/tuple arithmetic,
// matching `addWindowRepresentation.ts`'s own established convention (no gl-matrix needed).
// `dataclasses`: ported per this project's established idiom (`dataclass` -> `interface` +
// resolve function).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { ShapeBuilder } from "../../util/shapeBuilder";
import { calculateUnitScale, mmToM } from "../../util/unit";
import { wrapUsecase } from "../hooks";
import { addShapeAspect } from "./addShapeAspect";
import { createIfcWindow } from "./addWindowRepresentation";

/** Python: `DOOR_TYPE = Literal[...]`. */
export type DoorType =
	| "SINGLE_SWING_LEFT"
	| "SINGLE_SWING_RIGHT"
	| "DOUBLE_SWING_RIGHT"
	| "DOUBLE_SWING_LEFT"
	| "DOUBLE_DOOR_SINGLE_SWING"
	| "DOUBLE_DOOR_DOUBLE_SWING"
	| "SLIDING_TO_LEFT"
	| "SLIDING_TO_RIGHT"
	| "DOUBLE_DOOR_SLIDING";

/** Python: `SUPPORTED_DOOR_TYPES = get_args(DOOR_TYPE)`. */
export const SUPPORTED_DOOR_TYPES: readonly DoorType[] = [
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

/**
 * `thickness` of the profile is defined as a list in the following order: `(SIDE, TOP)` -- or
 * a single number, applied to both sides (Python: `create_ifc_door_lining`).
 */
export function createIfcDoorLining(
	builder: ShapeBuilder,
	size: readonly [number, number, number],
	thicknessIn: readonly number[] | number,
	position?: readonly [number, number, number] | null,
): EntityInstance {
	const thickness = Array.isArray(thicknessIn)
		? (thicknessIn as readonly number[])
		: [thicknessIn as number, thicknessIn as number];
	const [thSide, thUp] = thickness;

	const points: [number, number][] = [
		[0, 0],
		[0, size[2]],
		[size[0], size[2]],
		[size[0], 0],
		[size[0] - thSide, 0],
		[size[0] - thSide, size[2] - thUp],
		[thSide, size[2] - thUp],
		[thSide, 0],
	];

	const doorLiningCurve = builder.polyline(points, true);
	const extrudeKwargsY = builder.extrudeKwargs("Y");
	const doorLining = builder.extrude(
		doorLiningCurve,
		size[1],
		[0, 0, 0],
		extrudeKwargsY.extrusionVector,
		extrudeKwargsY.positionZAxis,
		extrudeKwargsY.positionXAxis,
	);
	builder.translate(doorLining, position ?? [0, 0, 0]);

	return doorLining;
}

/** Python: `create_ifc_box`. */
export function createIfcBox(
	builder: ShapeBuilder,
	size: readonly [number, number, number],
	position?: readonly [number, number, number] | null,
): EntityInstance {
	const rect = builder.rectangle([size[0], size[1]]);
	return builder.extrude(rect, size[2], position ?? [0, 0, 0], [0, 0, 1]);
}

/** Python: `DoorLiningProperties` dataclass (public, all-optional settings shape). */
export interface DoorLiningProperties {
	/** Optional, defaults to 50mm. */
	liningDepth?: number | null;
	/** Optional, defaults to 50mm. */
	liningThickness?: number | null;
	/** Offset from the outer side of the wall (by Y-axis). Optional, defaults to 0.0. */
	liningOffset?: number | null;
	/** Offset from the wall. Optional, defaults to 25mm. */
	liningToPanelOffsetX?: number | null;
	/** Offset from the X-axis (unlike windows). Optional, defaults to 25mm. */
	liningToPanelOffsetY?: number | null;
	/** Vertical distance between door and window panels. Optional, defaults to 0.0. */
	transomThickness?: number | null;
	/**
	 * Distance from the bottom door opening to the beginning of the transom -- unlike
	 * windows' `TransomOffset`, which goes to the center of the transom. Optional, defaults
	 * to 1.525m.
	 */
	transomOffset?: number | null;
	/** Optional. Deprecated argument, never used. */
	shapeAspectStyle?: null;
	/**
	 * Casing covers wall faces around the opening on the left, right and upper sides.
	 * Casing should be either on both sides of the wall or no casing -- if `liningOffset`
	 * is present then casing is not possible on the outer wall, therefore there will be no
	 * casing on the inner wall either. Optional, defaults to 5mm.
	 */
	casingDepth?: number | null;
	/** Casing thickness by Z-axis. Optional, defaults to 75mm. */
	casingThickness?: number | null;
	/** Threshold covers the bottom side of the opening. Optional, defaults to 100mm. */
	thresholdDepth?: number | null;
	/** Threshold thickness by Z-axis. Optional, defaults to 25mm. */
	thresholdThickness?: number | null;
	/** Threshold offset by Y-axis. Optional, defaults to 0.0. */
	thresholdOffset?: number | null;
}

interface ResolvedDoorLiningProperties {
	liningDepth: number;
	liningThickness: number;
	liningOffset: number;
	liningToPanelOffsetX: number;
	liningToPanelOffsetY: number;
	transomThickness: number;
	transomOffset: number;
	casingDepth: number;
	casingThickness: number;
	thresholdDepth: number;
	thresholdThickness: number;
	thresholdOffset: number;
}

/** Python: `DoorLiningProperties.initialize_properties`. */
function resolveDoorLiningProperties(
	props: DoorLiningProperties | undefined,
	unitScale: number,
): ResolvedDoorLiningProperties {
	const p = props ?? {};
	const siConversion = 1 / unitScale;
	const withDefault = (v: number | null | undefined, mm: number): number => v ?? mmToM(mm) * siConversion;
	return {
		liningDepth: withDefault(p.liningDepth, 50),
		liningThickness: withDefault(p.liningThickness, 50),
		liningOffset: withDefault(p.liningOffset, 0),
		liningToPanelOffsetX: withDefault(p.liningToPanelOffsetX, 25),
		liningToPanelOffsetY: withDefault(p.liningToPanelOffsetY, 25),
		transomThickness: withDefault(p.transomThickness, 0),
		transomOffset: withDefault(p.transomOffset, 1525),
		casingDepth: withDefault(p.casingDepth, 5),
		casingThickness: withDefault(p.casingThickness, 75),
		thresholdDepth: withDefault(p.thresholdDepth, 100),
		thresholdThickness: withDefault(p.thresholdThickness, 25),
		thresholdOffset: withDefault(p.thresholdOffset, 0),
	};
}

/** Python: `DoorPanelProperties` dataclass (public, all-optional settings shape). */
export interface DoorPanelProperties {
	/** Frame thickness by Y axis. Optional, defaults to 35mm. */
	panelDepth?: number | null;
	/** Ratio to the clear door opening. Optional, defaults to 1.0 -- **see this file's own
	 * header comment**: real Python's own default is a plain dataclass field default, not
	 * routed through `initialize_properties` like every other field here. */
	panelWidth?: number | null;
	/** Frame thickness by Y axis. Optional, defaults to 35mm. */
	frameDepth?: number | null;
	/** Frame thickness by X axis. Optional, defaults to 35mm. */
	frameThickness?: number | null;
	/** Optional, value is never used. */
	panelPosition?: null;
	/** Optional, value is never used. Defines the basic ways to describe how door panels operate. */
	panelOperation?: null;
	/** Optional. Deprecated argument, never used. */
	shapeAspectStyle?: null;
}

interface ResolvedDoorPanelProperties {
	panelDepth: number;
	panelWidth: number;
	frameDepth: number;
	frameThickness: number;
}

/** Python: `DoorPanelProperties.initialize_properties`. */
function resolveDoorPanelProperties(
	props: DoorPanelProperties | undefined,
	unitScale: number,
): ResolvedDoorPanelProperties {
	const p = props ?? {};
	const siConversion = 1 / unitScale;
	return {
		panelDepth: p.panelDepth ?? mmToM(35) * siConversion,
		// See this file's own header comment: real Python's own default here is a plain
		// dataclass field default (applied only on omission), unlike every other field.
		panelWidth: p.panelWidth ?? 1.0,
		frameDepth: p.frameDepth ?? mmToM(35) * siConversion,
		frameThickness: p.frameThickness ?? mmToM(35) * siConversion,
	};
}

export interface AddDoorRepresentationSettings {
	/** The `IfcGeometricRepresentationContext` for the representation. */
	context: EntityInstance;
	/**
	 * Overall door height. Defaults to 2m -- **but see this file's header comment**:
	 * omitting this reproduces a real, disclosed, verbatim-preserved upstream-Python bug
	 * (`Usecase.settings` accessed before assignment) and always throws. Must be supplied
	 * explicitly to avoid it.
	 */
	overallHeight?: number | null;
	/**
	 * Overall door width. Defaults to 0.9m -- **see `overallHeight`'s own doc comment**:
	 * omitting this hits the identical disclosed bug.
	 */
	overallWidth?: number | null;
	/**
	 * Type of the door. Defaults to `"SINGLE_SWING_LEFT"`.
	 * http://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcDoorTypeOperationEnum.htm
	 */
	operationType?: DoorType;
	/** `DoorLiningProperties`. See that interface's own field docs for details. */
	liningProperties?: DoorLiningProperties;
	/** `DoorPanelProperties`. See that interface's own field docs for details. */
	panelProperties?: DoorPanelProperties;
	partOfProduct?: EntityInstance | null;
	/**
	 * The unit scale as calculated by `calculateUnitScale`. If not provided, it will be
	 * automatically calculated.
	 */
	unitScale?: number;
}

/** Shared numeric lining/threshold/casing/panel/handle/transom settings, computed once (Python:
 * closure-captured locals in `execute()`, computed right after the `ELEVATION_VIEW` early
 * return) and threaded through both the `PLAN_VIEW` and 3D-model branch functions below. */
interface DoorGeometryParams {
	liningDepth: number;
	liningThicknessDefault: number;
	liningOffset: number;
	liningToPanelOffsetX: number;
	panelDepth: number;
	liningToPanelOffsetYFull: number;
	/** Already halved (Python: `lining_props["TransomThickness"] / 2`). */
	transomThickness: number;
	/** Forced to `0` when `transomThickness` is `0` (Python: `transfom_offset` -- sic). */
	transomOffset: number;
	windowLiningHeight: number;
	sideLiningThickness: number;
	panelLiningOverlapX: number;
	topLiningThickness: number;
	panelTopLiningOverlapX: number;
	doorOpeningWidth: number;
	thresholdThickness: number;
	thresholdDepth: number;
	thresholdOffset: number;
	thresholdWidth: number;
	casingThickness: number;
	casingDepth: number;
	panelWidth: number;
	frameDepth: number;
	frameThickness: number;
	frameHeight: number;
	glassThickness: number;
	handleSize: [number, number, number];
	handleOffset: [number, number, number];
	handleCenterOffset: [number, number, number];
	sliderArrowSymbolSize: number;
	panelHeight: number;
	liningHeight: number;
	liningSize: [number, number, number];
	/** `[side, top]` (Python: `lining_thickness`). */
	liningThickness: [number, number];
}

function convertSiToUnit(value: number, unitScale: number): number {
	return value / unitScale;
}

/**
 * Python: nested `l_shape_check` closure inside `Usecase.execute` -- hoisted since it's a
 * pure function of its own arguments. Checks a SINGLE `liningToPanelOffsetX` against
 * (potentially several) lining thicknesses -- a different shape from
 * `addWindowRepresentation.ts`'s own `windowLShapeCheck`, which zips 2 same-length lists
 * pairwise; this one compares one scalar offset against every thickness in the list.
 */
export function doorLShapeCheck(
	liningToPanelOffsetYFull: number,
	liningDepth: number,
	liningToPanelOffsetX: number,
	liningThickness: readonly number[],
): boolean {
	return liningToPanelOffsetYFull < liningDepth && liningThickness.some((th) => liningToPanelOffsetX < th);
}

/** Python: `Usecase.execute`'s own large block of shared locals, computed once right after
 * the `ELEVATION_VIEW` early return (unconditionally, even though only some fields are
 * actually used by the `PLAN_VIEW` branch). */
function computeDoorGeometryParams(
	overallHeight: number,
	overallWidth: number,
	doubleSwingDoor: boolean,
	slidingDoor: boolean,
	lining: ResolvedDoorLiningProperties,
	panel: ResolvedDoorPanelProperties,
	unitScale: number,
): DoorGeometryParams {
	const liningDepth = lining.liningDepth;
	const liningThicknessDefault = lining.liningThickness;
	const liningOffset = lining.liningOffset;
	const liningToPanelOffsetX = slidingDoor ? liningThicknessDefault : lining.liningToPanelOffsetX;
	const panelDepth = panel.panelDepth;
	const liningToPanelOffsetYFull = slidingDoor ? -panelDepth : lining.liningToPanelOffsetY;

	const transomThickness = lining.transomThickness / 2;
	let transomOffset = lining.transomOffset;
	if (transomThickness === 0) transomOffset = 0;
	const windowLiningHeight = overallHeight - transomOffset - transomThickness;

	let sideLiningThickness = liningThicknessDefault;
	const panelLiningOverlapX = slidingDoor ? 0 : Math.max(liningThicknessDefault - liningToPanelOffsetX, 0);

	let topLiningThickness = transomThickness || liningThicknessDefault;
	const panelTopLiningOverlapX = slidingDoor ? 0 : Math.max(topLiningThickness - liningToPanelOffsetX, 0);
	const doorOpeningWidth = overallWidth - liningToPanelOffsetX * 2;
	if (doubleSwingDoor) {
		sideLiningThickness = sideLiningThickness - panelLiningOverlapX;
		topLiningThickness = topLiningThickness - panelTopLiningOverlapX;
	}

	const thresholdThickness = lining.thresholdThickness;
	const thresholdDepth = lining.thresholdDepth;
	const thresholdOffset = lining.thresholdOffset;
	const thresholdWidth = overallWidth - sideLiningThickness * 2;

	const casingThickness = lining.casingThickness;
	const casingDepth = lining.casingDepth;

	// Panel params.
	const panelWidth = doorOpeningWidth * panel.panelWidth;
	const frameDepth = panel.frameDepth;
	const frameThickness = panel.frameThickness;
	const frameHeight = windowLiningHeight - liningToPanelOffsetX * 2;
	const glassThickness = convertSiToUnit(0.01, unitScale);

	// Handle dimensions (hardcoded).
	const handleSize: [number, number, number] = [
		convertSiToUnit(120 * 0.001, unitScale),
		convertSiToUnit(40 * 0.001, unitScale),
		convertSiToUnit(20 * 0.001, unitScale),
	];
	// To the handle center.
	const handleOffset: [number, number, number] = [
		convertSiToUnit(60 * 0.001, unitScale),
		convertSiToUnit(0 * 0.001, unitScale),
		convertSiToUnit(1000 * 0.001, unitScale),
	];
	const handleCenterOffset: [number, number, number] = [handleSize[1] / 2 / 2, 0, handleSize[2] / 2];
	const sliderArrowSymbolSize = convertSiToUnit(30 * 0.001, unitScale);

	let panelHeight: number;
	let liningHeight: number;
	if (transomOffset) {
		panelHeight = transomOffset + transomThickness - liningToPanelOffsetX - thresholdThickness;
		liningHeight = transomOffset + transomThickness;
	} else {
		panelHeight = overallHeight - liningToPanelOffsetX - thresholdThickness;
		liningHeight = overallHeight;
	}

	const liningSize: [number, number, number] = [overallWidth, liningDepth, liningHeight];
	const liningThickness: [number, number] = [sideLiningThickness, topLiningThickness];

	return {
		liningDepth,
		liningThicknessDefault,
		liningOffset,
		liningToPanelOffsetX,
		panelDepth,
		liningToPanelOffsetYFull,
		transomThickness,
		transomOffset,
		windowLiningHeight,
		sideLiningThickness,
		panelLiningOverlapX,
		topLiningThickness,
		panelTopLiningOverlapX,
		doorOpeningWidth,
		thresholdThickness,
		thresholdDepth,
		thresholdOffset,
		thresholdWidth,
		casingThickness,
		casingDepth,
		panelWidth,
		frameDepth,
		frameThickness,
		frameHeight,
		glassThickness,
		handleSize,
		handleOffset,
		handleCenterOffset,
		sliderArrowSymbolSize,
		panelHeight,
		liningHeight,
		liningSize,
		liningThickness,
	};
}

/** Python: `Usecase.execute`'s `ELEVATION_VIEW` early-return branch. */
function createIfcDoorElevationRepresentation(
	builder: ShapeBuilder,
	context: EntityInstance,
	overallWidth: number,
	overallHeight: number,
): EntityInstance {
	const rect = builder.rectangle([overallWidth, 0, overallHeight]);
	return builder.getRepresentation(context, rect);
}

/** Python: `Usecase.execute`'s `PLAN_VIEW` + `ContextIdentifier === "Annotation"` sub-branch
 * (sliding-door arrow symbol). See this file's own header comment: this is the ONE code path
 * in this entire file that is genuinely unblocked today, on every schema. */
function createIfcDoorAnnotationRepresentation(
	builder: ShapeBuilder,
	context: EntityInstance,
	panelSize: readonly [number, number],
	panelPosition: readonly [number, number],
	sliderArrowSymbolSize: number,
): EntityInstance {
	const arrowOffset = sliderArrowSymbolSize / Math.cos((15 * Math.PI) / 180);

	const arrowSymbol: EntityInstance[] = [];
	arrowSymbol.push(
		builder.polyline([
			[0.35 * panelSize[0], 0],
			[0.65 * panelSize[0], 0],
		]),
	);
	arrowSymbol.push(
		builder.polyline(
			[
				[sliderArrowSymbolSize, arrowOffset],
				[0, 0],
				[sliderArrowSymbolSize, -arrowOffset],
			],
			false,
			[0.35 * panelSize[0], 0],
		),
	);

	builder.translate(arrowSymbol, [panelPosition[0], panelPosition[1] - arrowOffset * 1.5]);

	const items2d: EntityInstance[] = [...arrowSymbol];
	return builder.getRepresentation(context, items2d, "Curve2D");
}

/** Python: nested `create_ifc_door_sliding_panel_2d` closure. */
function createIfcDoorSlidingPanel2d(
	builder: ShapeBuilder,
	panelSize: readonly [number, number],
	panelPosition: readonly [number, number],
	doorSwingType: "LEFT" | "RIGHT",
): EntityInstance[] {
	const door = builder.rectangle(panelSize, [panelPosition[0] - panelSize[0] * 0.5, panelPosition[1]]);
	if (doorSwingType === "RIGHT") {
		const mirrorPoint: [number, number] = [panelPosition[0] + panelSize[0] / 2, panelPosition[1]];
		builder.mirror(door, [1, 0], mirrorPoint);
	}
	return [door];
}

/** Python: nested `create_ifc_door_panel_2d` closure (the `PLAN_VIEW` swing-arc/rectangle leaf). */
function createIfcDoorPanel2d(
	builder: ShapeBuilder,
	doubleSwingDoor: boolean,
	panelSizeIn: readonly [number, number],
	panelPosition: readonly [number, number],
	doorSwingType: "LEFT" | "RIGHT",
	sliding: boolean,
): EntityInstance[] {
	if (sliding) {
		return createIfcDoorSlidingPanel2d(builder, panelSizeIn, panelPosition, doorSwingType);
	}

	const doorItems: EntityInstance[] = [];
	// Python: `panel_size = panel_size[np_YX]` -- swap X/Y into a NEW local array (numpy
	// fancy indexing never mutates the caller's own array).
	const panelSize: [number, number] = [panelSizeIn[1], panelSizeIn[0]];

	let trimPointsMask: readonly number[];
	if (doubleSwingDoor) {
		trimPointsMask = [3, 1];
		const secondSwingLine = builder.polyline([
			[0, 0],
			[0, -panelSize[1]],
			[panelSize[0], -panelSize[1]],
		]);
		doorItems.push(secondSwingLine);
	} else {
		trimPointsMask = [0, 1];
	}

	const semicircle = builder.createEllipseCurve(
		panelSize[1] - panelSize[0],
		panelSize[1],
		[panelSize[0], 0],
		[],
		[1, 0],
		trimPointsMask,
	);
	doorItems.push(semicircle);

	const door = builder.rectangle(panelSize);
	doorItems.push(door);

	builder.translate(doorItems, panelPosition);

	if (doorSwingType === "RIGHT") {
		const mirrorPoint: [number, number] = [panelPosition[0] + panelSize[1] / 2, panelPosition[1]];
		builder.mirror(doorItems, [1, 0], mirrorPoint);
	}
	return doorItems;
}

/** Python: `Usecase.execute`'s `PLAN_VIEW` branch (non-`Annotation` `ContextIdentifier`). */
function createIfcDoorPlanRepresentation(
	builder: ShapeBuilder,
	context: EntityInstance,
	operationType: DoorType,
	doubleDoor: boolean,
	slidingDoor: boolean,
	doubleSwingDoor: boolean,
	overallWidth: number,
	panelSize: [number, number],
	panelPosition: readonly [number, number],
	g: DoorGeometryParams,
): EntityInstance {
	const items2d: EntityInstance[] = [];

	const lining = doorLShapeCheck(g.liningToPanelOffsetYFull, g.liningDepth, g.liningToPanelOffsetX, [
		g.sideLiningThickness,
	])
		? builder.polyline(
				[
					[0, 0],
					[0, g.liningDepth],
					[g.liningToPanelOffsetX, g.liningDepth],
					[g.liningToPanelOffsetX, g.liningToPanelOffsetYFull],
					[g.liningThicknessDefault, g.liningToPanelOffsetYFull],
					[g.liningThicknessDefault, 0],
				],
				true,
			)
		: builder.rectangle([g.sideLiningThickness, g.liningDepth]);

	items2d.push(lining);
	items2d.push(builder.mirror(lining, [1, 0], [overallWidth / 2, 0], true) as EntityInstance);

	const doorItems: EntityInstance[] = [];
	if (doubleDoor) {
		panelSize[0] = panelSize[0] / 2;
		doorItems.push(...createIfcDoorPanel2d(builder, doubleSwingDoor, panelSize, panelPosition, "LEFT", slidingDoor));

		const mirrorPoint: [number, number] = [panelPosition[0] + g.doorOpeningWidth / 2, panelPosition[1]];
		doorItems.push(...(builder.mirror(doorItems, [1, 0], mirrorPoint, true) as EntityInstance[]));
	} else {
		const doorSwingType: "LEFT" | "RIGHT" = operationType.endsWith("LEFT") ? "LEFT" : "RIGHT";
		doorItems.push(
			...createIfcDoorPanel2d(builder, doubleSwingDoor, panelSize, panelPosition, doorSwingType, slidingDoor),
		);
	}
	items2d.push(...doorItems);

	builder.translate(items2d, [0, g.liningOffset]);
	return builder.getRepresentation(context, items2d);
}

/** Python: nested `create_ifc_door_panel` closure (3D door leaf + handle pair). */
function createIfcDoorPanel(
	builder: ShapeBuilder,
	panelSize: readonly [number, number, number],
	panelPosition: readonly [number, number, number],
	doorSwingType: "LEFT" | "RIGHT",
	handleSize: readonly [number, number, number],
	handleOffset: readonly [number, number, number],
	handleCenterOffset: readonly [number, number, number],
): EntityInstance[] {
	const doorItems: EntityInstance[] = [];
	doorItems.push(createIfcBox(builder, panelSize, panelPosition));

	const handlePoints: [number, number][] = [
		[0, 0],
		[0, -handleSize[1]],
		[handleSize[0], -handleSize[1]],
		[handleSize[0], -handleSize[1] / 2],
		[handleSize[1] / 2, -handleSize[1] / 2],
		[handleSize[1] / 2, 0],
	];
	const handlePolyline = builder.polyline(handlePoints, true);

	const handlePosition: [number, number, number] = [
		panelPosition[0] + handleOffset[0] - handleCenterOffset[0],
		panelPosition[1] + handleOffset[1] - handleCenterOffset[1],
		panelPosition[2] + handleOffset[2] - handleCenterOffset[2],
	];

	const doorHandle = builder.extrude(handlePolyline, handleSize[2], handlePosition);
	doorItems.push(doorHandle);

	if (doorSwingType === "LEFT") {
		const mirrorPoint: [number, number] = [panelPosition[0] + panelSize[0] / 2, panelPosition[1]];
		builder.mirror(doorHandle, [1, 0], mirrorPoint);
	}

	const doorHandleMirrorPoint: [number, number] = [handlePosition[0], handlePosition[1] + panelSize[1] / 2];
	const doorHandleMirrored = builder.mirror(doorHandle, [0, 1], doorHandleMirrorPoint, true) as EntityInstance;
	doorItems.push(doorHandleMirrored);

	return doorItems;
}

/** Python: `Usecase.execute`'s main (non-`ELEVATION_VIEW`/`PLAN_VIEW`) 3D branch. */
function createIfcDoorModelRepresentation(
	file: IfcFile,
	builder: ShapeBuilder,
	context: EntityInstance,
	operationType: DoorType,
	doubleDoor: boolean,
	doubleSwingDoor: boolean,
	overallHeight: number,
	overallWidth: number,
	unitScale: number,
	g: DoorGeometryParams,
	partOfProduct: EntityInstance | null,
): EntityInstance {
	const liningItems: EntityInstance[] = [];
	let mainLiningSize: [number, number, number] = [...g.liningSize];

	if (doorLShapeCheck(g.liningToPanelOffsetYFull, g.liningDepth, g.liningToPanelOffsetX, g.liningThickness)) {
		mainLiningSize = [...g.liningSize];
		mainLiningSize[1] = g.liningToPanelOffsetYFull;

		const secondLiningSize: [number, number, number] = [...g.liningSize];
		secondLiningSize[1] = g.liningSize[1] - g.liningToPanelOffsetYFull;
		const secondLiningPosition: [number, number, number] = [0, g.liningToPanelOffsetYFull, 0];
		const secondLiningThickness: [number, number] = [
			Math.min(g.liningThickness[0], g.liningToPanelOffsetX),
			Math.min(g.liningThickness[1], g.liningToPanelOffsetX),
		];

		const secondLining = createIfcDoorLining(builder, secondLiningSize, secondLiningThickness, secondLiningPosition);
		liningItems.push(secondLining);
	}

	const mainLining = createIfcDoorLining(builder, mainLiningSize, g.liningThickness);
	liningItems.push(mainLining);

	// Add threshold.
	const thresholdItems: EntityInstance[] = [];
	if (g.thresholdThickness) {
		const thresholdSize: [number, number, number] = [g.thresholdWidth, g.thresholdDepth, g.thresholdThickness];
		const thresholdPosition: [number, number, number] = [g.sideLiningThickness, g.thresholdOffset, 0];
		thresholdItems.push(createIfcBox(builder, thresholdSize, thresholdPosition));
	}

	// Add casings.
	const casingItems: EntityInstance[] = [];
	if (!g.liningOffset && g.casingThickness) {
		const casingWallOverlap = Math.max(g.casingThickness - g.liningThicknessDefault, 0);
		const innerCasingThickness: [number, number] = [
			g.casingThickness - g.panelLiningOverlapX,
			g.casingThickness - g.panelTopLiningOverlapX,
		];
		const outerCasingThickness: [number, number] | number = doubleSwingDoor
			? [...innerCasingThickness]
			: g.casingThickness;

		const casingSize: [number, number, number] = [
			overallWidth + casingWallOverlap * 2,
			g.casingDepth,
			overallHeight + casingWallOverlap,
		];
		const casingPosition: [number, number, number] = [-casingWallOverlap, -g.casingDepth, 0];
		const outerCasing = createIfcDoorLining(builder, casingSize, outerCasingThickness, casingPosition);
		casingItems.push(outerCasing);

		const innerCasingPosition: [number, number, number] = [-casingWallOverlap, g.liningDepth, 0];
		const innerCasing = createIfcDoorLining(builder, casingSize, innerCasingThickness, innerCasingPosition);
		casingItems.push(innerCasing);
	}

	let doorItems: EntityInstance[] = [];
	const panelSize: [number, number, number] = [g.panelWidth, g.panelDepth, g.panelHeight];
	const panelPosition: [number, number, number] = [
		g.liningToPanelOffsetX,
		g.liningToPanelOffsetYFull,
		g.thresholdThickness,
	];

	if (doubleDoor) {
		// Keeping a little space between doors for readability.
		const doubleDoorOffset = convertSiToUnit(0.001, unitScale);
		panelSize[0] = panelSize[0] / 2 - doubleDoorOffset;
		doorItems.push(
			...createIfcDoorPanel(
				builder,
				panelSize,
				panelPosition,
				"LEFT",
				g.handleSize,
				g.handleOffset,
				g.handleCenterOffset,
			),
		);

		const mirrorPoint: [number, number] = [panelPosition[0] + g.doorOpeningWidth / 2, panelPosition[1]];
		doorItems = [...doorItems, ...(builder.mirror(doorItems, [1, 0], mirrorPoint, true) as EntityInstance[])];
	} else {
		const doorSwingType: "LEFT" | "RIGHT" = operationType.endsWith("LEFT") ? "LEFT" : "RIGHT";
		doorItems.push(
			...createIfcDoorPanel(
				builder,
				panelSize,
				panelPosition,
				doorSwingType,
				g.handleSize,
				g.handleOffset,
				g.handleCenterOffset,
			),
		);
	}

	// Add on-top window (transom).
	let windowLiningItems: EntityInstance[] = [];
	let frameItems: EntityInstance[] = [];
	let glassItems: EntityInstance[] = [];
	if (g.transomThickness) {
		const windowLiningThickness: [number, number, number, number] = [
			g.sideLiningThickness,
			g.liningThicknessDefault,
			g.sideLiningThickness,
			g.transomThickness,
		];
		const windowLiningSize: [number, number, number] = [overallWidth, g.liningDepth, g.windowLiningHeight];
		const windowPosition: [number, number, number] = [0, 0, overallHeight - g.windowLiningHeight];
		const frameSize: [number, number, number] = [g.doorOpeningWidth, g.frameDepth, g.frameHeight];
		const currentWindowItems = createIfcWindow(
			builder,
			windowLiningSize,
			windowLiningThickness,
			g.liningToPanelOffsetX,
			g.liningToPanelOffsetYFull,
			frameSize,
			g.frameThickness,
			g.glassThickness,
			windowPosition,
		);
		windowLiningItems = currentWindowItems.lining;
		frameItems = currentWindowItems.framing;
		glassItems = currentWindowItems.glazing;
	}

	const liningOffsetItems = [...liningItems, ...doorItems, ...windowLiningItems, ...frameItems, ...glassItems];
	builder.translate(liningOffsetItems, [0, g.liningOffset, 0]);

	const outputItems = [...liningOffsetItems, ...thresholdItems, ...casingItems];

	const representation = builder.getRepresentation(context, outputItems);
	if (partOfProduct) {
		addShapeAspect(file, {
			name: "Lining",
			items: [...liningItems, ...windowLiningItems, ...thresholdItems, ...casingItems],
			representation,
			partOfProduct,
		});
		addShapeAspect(file, {
			name: "Framing",
			items: [...doorItems, ...frameItems],
			representation,
			partOfProduct,
		});
		if (glassItems.length > 0) {
			addShapeAspect(file, { name: "Glazing", items: glassItems, representation, partOfProduct });
		}
	}
	return representation;
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
		`addDoorRepresentation: '${paramName}' was omitted. Real Python's own add_door_representation() has a genuine, verbatim-preserved evaluation-order bug computing this exact default (it calls Usecase.convert_si_to_unit() before Usecase.settings is ever assigned, raising "AttributeError: 'Usecase' object has no attribute 'settings'") -- see this file's own header comment. Pass '${paramName}' explicitly to work around it.`,
	);
}

function addDoorRepresentationUsecase(file: IfcFile, settings: AddDoorRepresentationSettings): EntityInstance | null {
	const { context } = settings;
	const unitScale = settings.unitScale ?? calculateUnitScale(file);

	const resolvedLining = resolveDoorLiningProperties(settings.liningProperties, unitScale);
	const resolvedPanel = resolveDoorPanelProperties(settings.panelProperties, unitScale);

	// See this file's header comment: throws here (or on the next line) if either
	// dimension is omitted, reproducing real Python's own genuine, verbatim-preserved bug.
	const overallHeight = resolveOverallDimension(settings.overallHeight, "overallHeight");
	const overallWidth = resolveOverallDimension(settings.overallWidth, "overallWidth");

	const operationType = settings.operationType ?? "SINGLE_SWING_LEFT";

	const builder = new ShapeBuilder(file);

	const doubleSwingDoor = operationType.includes("DOUBLE_SWING");
	const doubleDoor = operationType.includes("DOUBLE_DOOR");
	const slidingDoor = operationType.includes("SLIDING");

	if ((context.get("TargetView") as string | null) === "ELEVATION_VIEW") {
		return createIfcDoorElevationRepresentation(builder, context, overallWidth, overallHeight);
	}

	const g = computeDoorGeometryParams(
		overallHeight,
		overallWidth,
		doubleSwingDoor,
		slidingDoor,
		resolvedLining,
		resolvedPanel,
		unitScale,
	);

	if ((context.get("TargetView") as string | null) === "PLAN_VIEW") {
		const panelSize: [number, number] = [g.panelWidth, g.panelDepth];
		const panelPosition: [number, number] = !slidingDoor
			? [g.liningToPanelOffsetX, g.liningDepth]
			: [g.liningToPanelOffsetX, -panelSize[1]];

		if ((context.get("ContextIdentifier") as string | null) === "Annotation") {
			// Only sliding doors have an annotation representation.
			if (!slidingDoor) return null;
			return createIfcDoorAnnotationRepresentation(builder, context, panelSize, panelPosition, g.sliderArrowSymbolSize);
		}

		return createIfcDoorPlanRepresentation(
			builder,
			context,
			operationType,
			doubleDoor,
			slidingDoor,
			doubleSwingDoor,
			overallWidth,
			panelSize,
			panelPosition,
			g,
		);
	}

	return createIfcDoorModelRepresentation(
		file,
		builder,
		context,
		operationType,
		doubleDoor,
		doubleSwingDoor,
		overallHeight,
		overallWidth,
		unitScale,
		g,
		settings.partOfProduct ?? null,
	);
}

/**
 * Adds a door representation (Python: `ifcopenshell.api.geometry.add_door_representation`).
 *
 * **Read this file's own header comment before using this function**: real Python's own
 * implementation has a genuine, verbatim-preserved evaluation-order bug that crashes
 * whenever `overallHeight`/`overallWidth` is omitted -- both must be supplied explicitly.
 * Beyond that, the actual 3D solid geometry and the main 2D plan-view drawing this function
 * builds cannot be produced today on ANY schema (the same 2 pre-existing, already-tracked
 * `ShapeBuilder`/`entityInstance.ts` primitive-layer gaps disclosed by
 * `addWindowRepresentation.ts`'s own header comment) -- EXCEPT the `PLAN_VIEW` +
 * `ContextIdentifier === "Annotation"` sliding-door arrow symbol, which is genuinely
 * unblocked today, on every schema.
 *
 * @param settings.context The `IfcGeometricRepresentationContext` for the representation.
 * @param settings.overallHeight Overall door height. Must be supplied explicitly (see this
 * file's header comment).
 * @param settings.overallWidth Overall door width. Must be supplied explicitly (see this
 * file's header comment).
 * @param settings.operationType Type of the door. Defaults to `"SINGLE_SWING_LEFT"`.
 * @param settings.liningProperties `DoorLiningProperties`. See that interface's own field
 * docs for details.
 * @param settings.panelProperties `DoorPanelProperties`. See that interface's own field docs
 * for details.
 * @param settings.unitScale The unit scale as calculated by `calculateUnitScale`. If not
 * provided, it will be automatically calculated.
 * @returns The `IfcShapeRepresentation` for a door, or `null` for a non-sliding door's
 * `PLAN_VIEW` `Annotation` representation (Python: same `None` return).
 */
export const addDoorRepresentation = wrapUsecase("geometry.add_door_representation", addDoorRepresentationUsecase);
