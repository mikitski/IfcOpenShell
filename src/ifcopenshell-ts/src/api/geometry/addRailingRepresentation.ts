// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/add_railing_representation.py` (src/ifcopenshell-python,
// 646 lines) -- a parametric WALL_MOUNTED_HANDRAIL railing-geometry generator. Landed directly
// after `addWindowRepresentation.ts`/`addDoorRepresentation.ts` (see `./index.ts`'s own header
// comment for the module's overall scope). Unlike those 2 files, real Python here is NOT an
// internal-`Usecase`-class module -- it is already a flat set of module-level functions, split
// deliberately (per `ifcopenshell/api/geometry/__init__.py`'s own comment: "the pilot for a
// 'pure-compute + IFC-wrap' split") into a pure-geometry compute layer
// (`compute_wall_mounted_handrail_geometry`, no `ifcopenshell.file`/IFC dependency at all) and a
// thin IFC-wrapping layer (`add_railing_representation` itself). This port preserves that exact
// split: `computeWallMountedHandrailGeometry` (exported, zero IFC dependency, fully testable and
// genuinely UNBLOCKED today) and `addRailingRepresentationUsecase`/`addRailingRepresentation` (the
// thin `ShapeBuilder`-based wrapper, which -- see finding 3 below -- is unconditionally blocked
// on every input and every schema by a pre-existing primitive-layer gap).
//
// *** Branch structure (mapped completely before writing any code, per this port's own required
// process) ***
//
// `computeWallMountedHandrailGeometry`'s own pipeline, in real Python's own exact order:
// 1. Shift the input `railingPath` (documented as "the top of the railing, not the centre") by
//    `railingRadius` along Z (`np.subtract(railing_path, _Z_DOWN * railing_radius)` -- ported
//    byte-for-byte; not second-guessed despite the sign looking, at a glance, like it raises
//    rather than lowers the path, since `_Z_DOWN = (0,0,-1)` and `subtract(a, (0,0,-r)) = a +
//    (0,0,r)`).
// 2. If `loopedPath`, append the path's own first 2 points to its end (so the wrap-around edge at
//    the loop closure gets real fillet-arc/support treatment too).
// 3. `collectSupports` -- either one support per non-collinear internal vertex
//    (`useManualSupports`), or automatically spaced every `supportSpacing` along each
//    non-collinear-simplified edge (always >= 1 support per edge, via `divmod`).
// 4. `addArcsOnTurningPoints` -- walks the path once, replacing each non-collinear interior
//    vertex with a 3-point fillet arc (`getFilletPoints`) UNLESS the fillet is numerically
//    degenerate (falls back to the original sharp vertex instead) -- see finding 1 below for a
//    real, disclosed gap in exactly which degenerate cases this fallback actually covers.
// 5. Unless `loopedPath`, `addCap` is called once per end (`start=true`/`start=false`) to append
//    one of 5 real terminal-cap shapes (`TerminalType`: `"180"` a simple U-turn cap down;
//    `"TO_END_POST"` an L-shaped 2-point cap ending level with the path's own second-to-last
//    point; `"TO_WALL"` a partial arc that lands `clearWidth` away from (and level with) the
//    start point; `"TO_FLOOR"` a partial arc plus a straight vertical run down to
//    `heightBelowHandrail`; `"TO_END_POST_AND_FLOOR"` 2 real fillet arcs down to the floor AND
//    level with the second-to-last point) -- or `"NONE"`, which is a genuine early-return no-op
//    (real Python's own comment: a `"NONE"` dispatch-table slot would need an awkward
//    empty-`vstack` contract, so the early return exists specifically to avoid that).
// 6. `getArcIndices` maps each fillet/cap arc's own literal midpoint coordinate back to its index
//    in the final polyline (via `np.allclose`, one arc at a time, consuming a shrinking window of
//    the polyline as it goes -- ported exactly, including the real `throw`-on-not-found case,
//    which should be unreachable for any polyline this module itself constructs, matching real
//    Python's own `raise Exception(...)` there being a defensive invariant check, not a normal
//    control-flow path).
//
// `addRailingRepresentationUsecase`'s own pipeline: resolve `unitScale`/`railingPath`/
// `supportSpacing`/`railingDiameter`/`clearWidth`/`height` defaults (see finding 2 below for why
// this is NOT the same evaluation-order bug as `addWindowRepresentation`/
// `addDoorRepresentation`), call `computeWallMountedHandrailGeometry`, then for every support
// build a swept-disk-solid arc (`polyline` with 1 arc point + `createSweptDiskSolid`) plus a
// wall-attachment disk (`circle` + `extrude` along a Z-rotated "Y" axis), and finally sweep the
// handrail polyline itself into one more `IfcSweptDiskSolid` before wrapping everything into a
// single `IfcShapeRepresentation`.
//
// *** Finding 1 (real, disclosed, verbatim-preserved upstream-Python bug, INDEPENDENT of the 2
// primitive-layer gaps below): `addArcsOnTurningPoints`'s degenerate-fillet fallback has an
// incomplete `except` clause ***
//
// Real Python's `_get_fillet_points` calls `np_intersect_line_line` to locate the fillet arc's
// centre. That module-level helper (`ifcopenshell.util.shape_builder.np_intersect_line_line`,
// already landed as `npIntersectLineLine` in `util/shapeBuilder.ts`) raises a plain `ValueError`
// ("Lines are parallel and do not intersect uniquely.") when the 2 lines it is asked to intersect
// are parallel -- confirmed by reading its own real Python source directly (`shape_builder.py`
// line 277), not assumed. `_add_arcs_on_turning_points`'s own call site, however, only catches
// `except (ZeroDivisionError, FloatingPointError):` around its `_get_fillet_points` call -- a
// `ValueError` from `np_intersect_line_line` is NOT one of those 2 types, so it propagates
// UNCAUGHT, crashing `compute_wall_mounted_handrail_geometry`/`add_railing_representation`
// entirely, instead of falling back to a sharp-vertex corner the way every OTHER degenerate case
// (`ZeroDivisionError` from `radius / tan(edge_angle / 2)`'s own exact-zero denominator; any
// NaN/Inf fillet-point coordinate, checked explicitly afterward) already does.
//
// This is a real, reachable gap, not merely theoretical: `getFilletPoints`'s own 2 intermediate
// lines (`fillet_v1co -> fillet_v1co + cross(normal, dir1)` and the same for `dir2`) are just
// `dir1`/`dir2` themselves rotated 90 degrees about the shared `normal` -- a rotation preserves
// parallelism exactly in exact arithmetic, so `np_intersect_line_line`'s own `is_x(cross_norm, 0)`
// parallel-line check is testing essentially the SAME degeneracy condition
// `addArcsOnTurningPoints`'s own caller-side `collinear` check (`|d0 x d1| < PRECISION`) already
// tests on the UN-rotated `dir1`/`dir2` -- just recomputed independently, through a different
// chain of floating-point operations (an extra cross product and a `normalized()` call earlier),
// so a `dir1`/`dir2` pair that lands just barely on the "not collinear" side of the caller's own
// `PRECISION = 1e-5` threshold can still land on the "parallel" side of `np_intersect_line_line`'s
// OWN independently-computed, not-bit-identical `PRECISION` threshold. This is the exact class of
// precision-boundary instability `_collinear`'s own header comment already documents fixing ONE
// instance of (switching from `arccos(dot)` to `|cross|`) -- this is a second, still-open instance
// of the same underlying hazard, one level deeper in the same call chain.
//
// Ported VERBATIM, not fixed: `addArcsOnTurningPoints`'s own `try`/`catch` here catches only a
// dedicated `FilletDegenerateError` (thrown by `getFilletPoints` ONLY for the exact
// `ZeroDivisionError`-shaped case -- an exactly-zero `tan(edgeAngle / 2)` denominator, i.e. an
// exactly 0 or exactly pi `edgeAngle`, which the caller-side `collinear` check should already have
// filtered out before ever reaching here, making this branch largely defensive/dead in practice
// too) -- any OTHER error `getFilletPoints` throws (in particular, a plain `Error` from
// `npIntersectLineLine`'s own real "Lines are parallel..." message) propagates UNCAUGHT, exactly
// reproducing real Python's own incomplete-`except`-clause behavior. `getFilletPoints`'s own 2
// UNGUARDED call sites inside `capToEndPostAndFloor` (matching real Python's own
// `_cap_to_end_post_and_floor`, which has no `try`/`except` around either of its own 2 calls at
// all) are correspondingly left to throw uncaught here too, on either kind of degeneracy --
// exactly matching real Python.
//
// Not given a dedicated regression test: this is an inherently precision-boundary-dependent
// numerical hazard (see the "not bit-identical" paragraph above) -- constructing a deterministic,
// engine-independent repro would require reverse-engineering the exact floating-point rounding of
// 2 independent chains of vector operations, which is fragile by nature and not attempted here.
// The SELECTIVE catch (only `FilletDegenerateError`, matching real Python's own selective
// `except`) is what matters and IS directly asserted by this file's own dedicated unit test
// exercising `getFilletPoints`'s exact-zero-tan-denominator throw path.
//
// *** Finding 2: the evaluation-order bug from `addWindowRepresentation`/`addDoorRepresentation`
// does NOT apply here -- explicitly checked, not assumed ***
//
// Both of those 2 immediately-preceding files have a real, severe, upstream-Python bug where the
// public wrapper computes a documented default via `usecase.convert_si_to_unit(...)` BEFORE
// `usecase.settings` is ever assigned (both are internal-`Usecase`-class modules). This file has NO
// internal `Usecase` class at all -- `add_railing_representation` is a single plain function, with
// no `self.settings`-shaped state to race against. Its own default-resolution order, read directly
// from the real source, is: `unit_scale` is resolved FIRST (`if unit_scale is None: unit_scale =
// ifcopenshell.util.unit.calculate_unit_scale(file)`), and every other default
// (`railing_path`/`support_spacing`/`railing_diameter`/`clear_width`/`height`) is computed AFTER
// that, correctly using the now-resolved `unit_scale` each time. There is no attribute-access
// ordering hazard here at all -- confirmed by tracing every line of `add_railing_representation`'s
// own body directly, not assumed absent because the file "doesn't look like" the other 2.
//
// A DIFFERENT, unrelated quirk exists instead: real Python's own `railing_path: SequenceOfVectors`
// parameter has NO default value in its own signature (`*, ..., railing_path: SequenceOfVectors,
// ...` -- no `= None`), making it a required keyword-only argument. Omitting it in a real call
// raises `TypeError: add_railing_representation() missing 1 required keyword-only argument:
// 'railing_path'` -- yet the function's own body still contains an `if railing_path is None:
// railing_path = ...` default-computing branch, and the docstring claims "If not provided, default
// path ... will be used". That branch is reachable ONLY by explicitly passing `railing_path=None`,
// never by simple omission -- a real, if minor, internal inconsistency between the signature, the
// docstring, and the body. Preserved here: `railingPath` is a REQUIRED field on
// `AddRailingRepresentationSettings` (TypeScript's own compile-time analogue of "no default, must
// be supplied"), but since JS/TS has no runtime-visible distinction between "key omitted" and "key
// explicitly `undefined`" the way Python can distinguish "argument not passed" from "argument
// passed as `None`", this port treats an explicit `null` OR `undefined` value the same way --  both
// reach the same default-path computation real Python's own dead-unless-explicit-`None` branch
// would.
//
// *** Finding 3 (the big one): `addRailingRepresentation` itself -- unlike
// `computeWallMountedHandrailGeometry` -- is blocked on LITERALLY EVERY input, on EVERY schema, by
// a pre-existing `entityInstance.ts` primitive-layer gap, reached via `ShapeBuilder`'s
// `createSweptDiskSolid` (not merely "most real-world inputs", the way
// `addWindowRepresentation`/`addDoorRepresentation` were -- there is no code path around it) ***
//
// `ShapeBuilder.createSweptDiskSolid` (`util/shapeBuilder.ts`) reads `pathCurve.get("Dim")` to
// validate the curve is 3D before building the `IfcSweptDiskSolid` -- `IfcCurve.Dim` is a real
// EXPRESS DERIVED attribute (`TODOS.md`'s "`util.representation.guessType`'s `Curve2D`/...
// branches..." entry: `entityInstance.ts`'s `.get()` has no DERIVED-attribute rule-execution
// fallback at all, so `.get("Dim")` unconditionally throws `"entity instance of type '...' has no
// attribute 'Dim'"` for ANY entity, on every schema -- "Dim" is never a real EXPLICIT attribute, so
// this is not conditional on the curve's actual dimensionality). `add_railing_representation`
// calls `create_swept_disk_solid` UNCONDITIONALLY, at least once, on every single invocation --
// once per support (if any) and, with NO branch that skips it, once more for the handrail polyline
// itself at the very end. There is no `TargetView`/schema/parameter combination that avoids this
// call the way `addDoorRepresentation`'s own `PLAN_VIEW` + `Annotation` sliding-door branch avoided
// `extrude()`/`.profile()` entirely -- **`addRailingRepresentation()` therefore throws for every
// real invocation, full stop**, before the disclosed gap 2 below is even relevant.
//
// Gap 2, reached FIRST whenever it applies (before gap 1 above): `ShapeBuilder.polyline()` builds
// `IfcLineIndex`/`IfcArcIndex` defined-type instances whenever `closed` or `arcPoints` is non-empty
// -- already disclosed as blocked on IFC4/IFC4X3 only by `TODOS.md`'s "`EntityInstance.setByIndex`/
// `IfcFile.createEntity` cannot write an initial value into a freshly created simple/defined-type
// instance" entry (fully functional on IFC2X3, which never needs `IfcLineIndex`/`IfcArcIndex` at
// all). EVERY support's own `arc_polyline` is swept via `builder.polyline(support.arcPolyline,
// false, null, [1])` -- a FIXED, always-non-empty `arcPoints=[1]` (every support arc is a 3-point
// arc) -- so on IFC4/IFC4X3, the very FIRST support (if `useManualSupports=false`, i.e. the
// default, there is always >= 1 automatic support per edge, per `divmod`'s own `+ 1`) throws here,
// before `createSweptDiskSolid` is ever reached. The final handrail polyline itself also passes
// `arcPoints=geometry.handrailArcPointIndices`, non-empty whenever any fillet/cap arc was added --
// true for the documented `terminalType="180"` default even on a dead-straight, 0-support path.
// Only a `useManualSupports=true` + zero-internal-vertex path + `terminalType="NONE"` combination
// (0 supports, 0 fillet arcs, 0 cap arcs) avoids gap 2 entirely, on any schema -- and even THEN,
// gap 1's unconditional final `createSweptDiskSolid()` call still throws regardless. **There is no
// input that avoids both gaps.**
//
// Net effect: **`computeWallMountedHandrailGeometry` -- the pure-geometry compute function this
// module was deliberately split out FOR (per its own real Python `__init__.py` comment) -- is
// genuinely, fully UNBLOCKED today, on every input, with zero IFC dependency at all; the thin
// `addRailingRepresentation` IFC-wrapping layer on top of it is 100% blocked, on every input, on
// every schema, with no exception.** Ported completely and faithfully anyway (every branch --
// `useManualSupports`, all 5 `TerminalType`s + `"NONE"`, `loopedPath`, `unitScale` conversion, the
// support-disk/support-arc/handrail-sweep `ShapeBuilder` calls -- is real, correct,
// verbatim-translated control flow, reachable end-to-end the moment the underlying
// `entityInstance.ts` gap is fixed, with zero further changes needed in this file). Pinned by a
// large battery of tests against the genuinely-unblocked `computeWallMountedHandrailGeometry` (a
// close port of the real Python test file's own extensive compute-layer coverage -- see this
// file's own test file for the direct correspondence) plus one dedicated smoke test asserting
// `addRailingRepresentation`'s own disclosed, current throw.
//
// --- UPDATE (Phase EX-2's IFC4 second chunk, `src/express/rules/ifc4.ts`): gap 1's
//     OWN symptom, on IFC4 specifically, changes (the underlying total blockage does
//     not) ---
//
// `calc_IfcCurve_Dim`/`calc_IfcCartesianPointList_Dim` are now ported for IFC4, so
// `IfcCurve.Dim` itself no longer unconditionally throws "has no attribute 'Dim'" --
// but `addRailingRepresentation` still throws on every real IFC4 invocation, via a
// DIFFERENT still-unported dependency one step further down the same call chain:
// `builder.circle(...)` (the support disk profile) builds an `IfcCircle`, whose own
// `.Dim` (`IfcCurveDim`'s `IfcConic` branch) reads `Position.Dim` --
// `IfcAxis2Placement2D`'s own `Dim` is declared DERIVE at the `IfcPlacement`
// supertype level (`calc_IfcPlacement_Dim`), genuinely still UNPORTED for IFC4. This
// now surfaces as `TypeError: Cannot convert a Symbol value to a string` (`.profile()`'s
// own error-message template literal choking on `runtimeShim.INDETERMINATE`, the
// swallowed result of that still-missing dependency), not the original "has no
// attribute 'Dim'" -- re-verified directly against the real, built addon, not
// assumed. See `addRailingRepresentation.test.ts`'s own updated smoke test for the
// full citation. (Separately, gap 2's own "blocked by `IfcLineIndex`/`IfcArcIndex`
// defined-type creation" framing above predates PR #179, which already fixed that
// specific primitive gap -- a real, pre-existing staleness independent of this
// update, not investigated or corrected further here, out of scope for this DERIVE-
// porting chunk.)
//
// *** `ShapeBuilder` methods used, and their exact signatures verified directly against
// `util/shapeBuilder.ts` (not assumed from the Python method names alone) ***
//
// `circle(center?, radius?)`, `createSweptDiskSolid(pathCurve, radius)`, `extrude(profileOrCurve,
// magnitude?, position?, extrusionVector?, positionZAxis?, positionXAxis?, positionYAxis?)`,
// `extrudeKwargs(axis)`, `getRepresentation(context, items, representationType?)`, `polyline(points,
// closed?, positionOffset?, arcPoints?)`, `rotateExtrusionKwargsByZ(kwargs, angle,
// counterClockwise?)` -- all present with matching semantics. The module-level free functions this
// file also needs (`SequenceOfVectors`/`VectorType` types, `PRECISION`, `npAngle`, `npAngleSigned`,
// `npIntersectLineLine`, `npLerp`, `npNormal`, `npNormalized`, `npTo3d`) are ALL already exported
// from `util/shapeBuilder.ts` under this project's own camelCase convention, with matching
// signatures -- confirmed by reading each one's own implementation directly. `V` is NOT imported
// here despite real Python using it throughout: every real Python `V(...)` call in this file is
// just "wrap a plain list literal as an ndarray" -- a no-op in TS, where a `number[]`/`number[][]`
// literal already IS the value V() would return, so every call site is a plain array literal here
// instead. Real Python's own `PRECISION`/`NP_XY`/`NP_YX`/`NP_Z` module-level imports (a plain float
// constant; a `slice(2)`; a `[1, 0]` index-swap array; a plain axis-index integer, respectively) are
// NOT plain re-exportable TS constants for `NP_XY`/`NP_YX` (they are indexing OPERATIONS, not
// scalars) -- reimplemented as tiny local helper functions (`takeXY`/`swapYX`) instead;
// `PRECISION` is reused directly from `util/shapeBuilder.ts`'s own existing export; `NP_Z` is used
// as a plain literal array index (`2`) at its 2 call sites rather than a named constant, since
// naming a single literal `2` buys nothing here.
//
// `numpy`: only plain elementwise vector math (`+`, `-`, `*` by a scalar, cross/dot products,
// `.copy()`, reversal, slicing, `divmod`) on 2/3-component vectors -- ported as plain
// `number[]`/tuple arithmetic via a handful of small local helpers (`vecAdd`/`vecSub`/`vecScale`/
// `vecCross3`/`vecLen`/`allClose`), matching `addWindowRepresentation.ts`'s/
// `addDoorRepresentation.ts`'s own established convention (no gl-matrix needed) -- and matching
// `util/shapeBuilder.ts`'s own header comment precedent for why these small vector-math helpers are
// duplicated per-file rather than exported/shared. `dataclasses`: `RailingSupport`/
// `WallMountedHandrailGeometry` (both public, per real Python's own `__all__`) and the internal
// `_RailingDims` are ported per this project's established "dataclass -> interface" idiom (no
// separate "resolve function" needed for `RailingDims`, since it has no optional/defaulted fields
// of its own -- every field is always supplied by its one construction site).
//
// Entity classes: this file never directly calls `file.createEntity` for any IFC entity class --
// every entity is created exclusively through already-verified `ShapeBuilder` methods (see above),
// so no additional schema verification was needed here.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import {
	PRECISION,
	type SequenceOfVectors,
	ShapeBuilder,
	type VectorType,
	npAngle,
	npAngleSigned,
	npIntersectLineLine,
	npLerp,
	npNormal,
	npNormalized,
	npTo3d,
} from "../../util/shapeBuilder";
import { calculateUnitScale, mmToM } from "../../util/unit";
import { wrapUsecase } from "../hooks";

/** Python: `TERMINAL_TYPE = Literal[...]`. */
export type TerminalType = "180" | "TO_END_POST" | "TO_WALL" | "TO_FLOOR" | "TO_END_POST_AND_FLOOR" | "NONE";

// Geometric design constants for the WALL_MOUNTED_HANDRAIL railing type (millimetres).
const TERMINAL_RADIUS_MM = 150;
const HANDRAIL_FILLET_RADIUS_MM = 100;
const SUPPORT_ARC_RADIUS_MM = 10;
const SUPPORT_DISK_DEPTH_MM = 20;

// Default parameter values for `addRailingRepresentation` (millimetres).
const DEFAULT_SUPPORT_SPACING_MM = 1000;
const DEFAULT_RAILING_DIAMETER_MM = 50;
const DEFAULT_CLEAR_WIDTH_MM = 40;
const DEFAULT_HEIGHT_MM = 1000;

/**
 * Pure-geometry description of a single wall-mount support (Python: `RailingSupport` dataclass).
 *
 * A support consists of:
 * - A 3-point polyline (base at the handrail, mid-arc, floor end) swept into a cylinder of radius
 *   `arcRadius`.
 * - A short disk extrusion (wall-attachment plate) at the floor end.
 *
 * All values are in IFC project units.
 */
export interface RailingSupport {
	/** Shape `[3][3]`. */
	arcPolyline: number[][];
	arcRadius: number;
	/** Shape `[3]` -- equal to `arcPolyline[2]`. */
	diskPosition: number[];
	diskRadius: number;
	diskDepth: number;
	/** Rotation around Z applied to the disk's "Y" extrude axis. */
	diskZRotation: number;
}

/**
 * Pure-geometry description of a wall-mounted handrail (Python: `WallMountedHandrailGeometry`
 * dataclass).
 *
 * Decoupled from any IFC entity creation -- see this file's own header comment for why. All
 * values are in IFC project units.
 */
export interface WallMountedHandrailGeometry {
	/** Shape `[N][3]`. */
	handrailPolyline: number[][];
	handrailArcPointIndices: number[];
	handrailRadius: number;
	supports: RailingSupport[];
}

/** Derived dimensions for a wall-mounted-handrail compute pass (Python: `_RailingDims`, a frozen
 * dataclass). All values are in IFC project units. Private -- not part of this module's own public
 * surface in real Python either (leading underscore). */
interface RailingDims {
	railingRadius: number;
	heightBelowHandrail: number;
	terminalRadius: number;
	filletRadius: number;
	supportSpacing: number;
	supportLength: number;
	supportArcRadius: number;
	supportDiskRadius: number;
	supportDiskDepth: number;
	clearWidth: number;
	capType: TerminalType;
}

// --- small local vector-math helpers (plain `number[]` arithmetic -- see this file's header
// comment for why these are duplicated per-file rather than imported from `util/shapeBuilder.ts`'s
// own private, unexported equivalents) ---

function vecSub(a: VectorType, b: VectorType): number[] {
	return a.map((v, i) => v - b[i]);
}

function vecAdd(a: VectorType, b: VectorType): number[] {
	return a.map((v, i) => v + b[i]);
}

function vecScale(a: VectorType, s: number): number[] {
	return a.map((v) => v * s);
}

function vecCross3(a: VectorType, b: VectorType): number[] {
	return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function vecLen(a: VectorType): number {
	return Math.sqrt(a.reduce((s, v) => s + v * v, 0));
}

/** `np.allclose(a, b)` with numpy's own default `rtol=1e-5`/`atol=1e-8`. */
function allClose(a: readonly number[], b: readonly number[]): boolean {
	return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= 1e-8 + 1e-5 * Math.abs(b[i]));
}

/** Python's `vector[NP_XY]` (`NP_XY = slice(2)`, i.e. `vector[:2]`) -- reads the first 2
 * components of a vector. */
function takeXY(v: VectorType): [number, number] {
	return [v[0], v[1]];
}

/** Python's `vector[NP_YX]` (`NP_YX = [1, 0]`, a numpy fancy-index array) -- reads a vector's Y
 * then X components, in that order. */
function swapYX(v: VectorType): [number, number] {
	return [v[1], v[0]];
}

const Z_DOWN: VectorType = [0, 0, -1];
const ARC_MIDDLE_POINT_COS = Math.sin(Math.PI / 4);

/** Mirrors Python's `ZeroDivisionError` for `getFilletPoints`'s own `radius / tan(edgeAngle / 2)`
 * line -- see this file's header comment (finding 1) for why only THIS specific failure is caught
 * by `addArcsOnTurningPoints`, while any other error `getFilletPoints` throws (in particular, a
 * plain `Error` from `npIntersectLineLine`, mirroring Python's own `ValueError` there) is
 * deliberately left to propagate uncaught, reproducing a real, disclosed, verbatim-preserved
 * upstream incomplete-`except`-clause bug. */
export class FilletDegenerateError extends Error {}

/**
 * Cross-product magnitude collinearity test (Python: `_collinear`).
 *
 * The cross-product magnitude is linear near zero, so the test stays numerically stable for
 * near-parallel unit vectors. The natural `arccos(dot)` formulation is not stable here: sub-ulp
 * overshoot of `dot` past 1.0 returns NaN, which would silently break the fillet on straight
 * subdivided edges. Anti-parallel vectors also collapse `|d0 x d1|` to 0 -- and that "no usable
 * turn" outcome is what the fillet caller wants, so it is treated as collinear too.
 */
function collinear(d0: VectorType, d1: VectorType): boolean {
	return vecLen(vecCross3(d0, d1)) < PRECISION;
}

/**
 * Fillet arc points between edges `v0 v1` and `v1 v2` (Python: `_get_fillet_points`).
 *
 * @throws {FilletDegenerateError} When `tan(edgeAngle / 2)` is exactly 0 (mirrors Python's own
 *   `ZeroDivisionError` there). May also throw a plain `Error` (mirroring Python's own
 *   `ValueError`) via `npIntersectLineLine`, or return NaN/Inf points, on other numerically
 *   degenerate input -- callers that may receive degenerate input must guard, per this file's
 *   header comment (finding 1).
 */
function getFilletPoints(v0: VectorType, v1: VectorType, v2: VectorType, radius: number): number[][] {
	const dir1 = npNormalized(vecSub(v0, v1));
	const dir2 = npNormalized(vecSub(v2, v1));
	const edgeAngle = npAngle(dir1, dir2);
	const tanHalfAngle = Math.tan(edgeAngle / 2);
	if (tanHalfAngle === 0) {
		throw new FilletDegenerateError(
			"getFilletPoints: radius / tan(edgeAngle / 2) divides by exactly 0 (a straight or fully-reversed edge angle) -- mirrors Python's real ZeroDivisionError here.",
		);
	}
	const slideDistance = radius / tanHalfAngle;

	const filletV1co = vecAdd(v1, vecScale(dir1, slideDistance));
	const filletV2co = vecAdd(v1, vecScale(dir2, slideDistance));

	const normal = npNormal([v0, v1, v2]);
	const [center] = npIntersectLineLine(
		filletV1co,
		vecAdd(filletV1co, vecCross3(normal, dir1)),
		filletV2co,
		vecAdd(filletV2co, vecCross3(normal, dir2)),
	);

	const midDir = npNormalized(vecSub(npLerp(filletV1co, filletV2co, 0.5), center));
	const midpointco = vecAdd(center, vecScale(midDir, radius));
	return [filletV1co, midpointco, filletV2co];
}

/** Build a pure-geometry support description from a point + railing direction (Python:
 * `_make_support`). */
function makeSupport(point: VectorType, railingDirection: VectorType, dims: RailingDims): RailingSupport {
	const [ry, rx] = swapYX(railingDirection);
	const orthoDir2d: [number, number] = [ry * 1, rx * -1];
	const orthoDir = npNormalized(npTo3d(orthoDir2d));
	const arcCenter = vecAdd(point, vecScale(orthoDir, dims.supportLength));
	const supportPoints: number[][] = [
		[...point],
		vecAdd(
			vecSub(arcCenter, vecScale(orthoDir, dims.supportLength * Math.cos(Math.PI / 4))),
			vecScale(Z_DOWN, dims.supportLength * Math.sin(Math.PI / 4)),
		),
		vecAdd(arcCenter, vecScale(Z_DOWN, dims.supportLength)),
	];
	const angle = npAngleSigned([0, 1], takeXY(orthoDir));
	return {
		arcPolyline: supportPoints,
		arcRadius: dims.supportArcRadius,
		diskPosition: supportPoints[2],
		diskRadius: dims.supportDiskRadius,
		diskDepth: dims.supportDiskDepth,
		diskZRotation: angle,
	};
}

/**
 * Add 3-point fillet arcs on turning points of the railing path (Python:
 * `_add_arcs_on_turning_points`).
 *
 * @returns `[polylineWithArcs, arcMidpoints]`.
 */
function addArcsOnTurningPoints(
	basePoints: number[][],
	dims: RailingDims,
	loopedPath: boolean,
): [number[][], number[][]] {
	const arcPoints: number[][] = [];
	if (basePoints.length < 3) {
		return [basePoints, arcPoints];
	}

	// looking for turning points by checking non-collinear edges
	const outputPoints: number[][] = [basePoints[0]];
	let prevDir = npNormalized(vecSub(basePoints[1], basePoints[0]));
	let i = 1;
	while (i < basePoints.length - 1) {
		const curDir = npNormalized(vecSub(basePoints[i + 1], basePoints[i]));

		// Treat NaN curDir (zero-length edge -> npNormalized of zero) as collinear: a
		// coincident path vertex carries no turn information, so the safest fallback is
		// "stay on the previous direction".
		const curDirIsNaN = curDir.some((x) => Number.isNaN(x));

		if (curDirIsNaN || collinear(curDir, prevDir)) {
			outputPoints.push(basePoints[i]);
		} else {
			// User-supplied railing paths can produce numerically degenerate turns
			// (anti-parallel directions, nearly-collinear triangle, zero-length edges from
			// coincident vertices). Falling back to a sharp turn at the original vertex
			// keeps the rest of the polyline real-valued instead of poisoning it with NaN.
			let filletPoints: number[][] | null;
			try {
				filletPoints = getFilletPoints(basePoints[i - 1], basePoints[i], basePoints[i + 1], dims.filletRadius);
			} catch (err) {
				// See this file's header comment (finding 1): only this specific,
				// dedicated error type is treated as "no usable fillet" here, exactly
				// matching real Python's own selective `except (ZeroDivisionError,
				// FloatingPointError)` -- any other error (in particular, a plain
				// `Error` mirroring Python's own `ValueError` from
				// `npIntersectLineLine`) propagates uncaught.
				if (err instanceof FilletDegenerateError) {
					filletPoints = null;
				} else {
					throw err;
				}
			}

			if (filletPoints?.some((fp) => fp.some((x) => !Number.isFinite(x)))) {
				filletPoints = null;
			}

			if (filletPoints === null) {
				outputPoints.push(basePoints[i]);
			} else {
				outputPoints.push(...filletPoints);
				arcPoints.push(filletPoints[1]);
			}
		}

		// Only advance prevDir when curDir is well-defined -- keeping a NaN prevDir would
		// cascade through every subsequent collinearity check.
		if (!curDirIsNaN) {
			prevDir = curDir;
		}
		i += 1;
	}

	if (loopedPath) {
		outputPoints[0] = outputPoints[outputPoints.length - 1];
	} else {
		outputPoints.push(basePoints[basePoints.length - 1]);
	}
	return [outputPoints, arcPoints];
}

/** Build the list of supports for the railing path (Python: `_collect_supports`). */
function collectSupports(coords: number[][], manualSupports: boolean, dims: RailingDims): RailingSupport[] {
	const supports: RailingSupport[] = [];
	// simplifiedCoords is a list of points that form non-collinear edges
	const simplifiedCoords: number[][] = [coords[0]];
	let prevDir = npNormalized(vecSub(coords[1], coords[0]));

	// iterating over each edge of the railing path
	for (let i = 1; i < coords.length - 1; i++) {
		const curDir = npNormalized(vecSub(coords[i + 1], coords[i]));

		if (!collinear(curDir, prevDir)) {
			simplifiedCoords.push(coords[i]);
			prevDir = curDir;
		} else if (manualSupports) {
			// for manual supports each vertex on the railing path edge will be a point for
			// a support
			supports.push(makeSupport(coords[i], curDir, dims));
		}
	}

	simplifiedCoords.push(coords[coords.length - 1]);

	if (manualSupports) {
		return supports;
	}

	// create automatic supports based on the support spacing
	for (let i = 0; i < simplifiedCoords.length - 1; i++) {
		const v0 = simplifiedCoords[i];
		const v1 = simplifiedCoords[i + 1];
		const edge = vecSub(v1, v0);
		const length = vecLen(edge);
		const edgeDir = npNormalized(edge);
		// Python: `divmod(length, dims.support_spacing)`.
		const quotient = Math.floor(length / dims.supportSpacing);
		const remainder = length - quotient * dims.supportSpacing;
		const nSupports = quotient + 1;
		const supportOffset = remainder / 2;

		const startPosition = vecAdd(v0, vecScale(edgeDir, supportOffset));
		for (let supportI = 0; supportI < nSupports; supportI++) {
			const supportPosition = vecAdd(startPosition, vecScale(edgeDir, supportI * dims.supportSpacing));
			supports.push(makeSupport(supportPosition, edge, dims));
		}
	}

	return supports;
}

/** Per-cap-type builder signature (Python: `_CapBuilder`). Each takes the cap-frame inputs
 * (precomputed by `addCap`) and returns `[capCoords, newArcPoints]`. The shared orientation flip
 * and final coordinate concatenation live in `addCap` so the builders stay focused on the
 * geometric shape of their cap. */
type CapBuilder = (
	railingCoordsForCap: number[][],
	startPoint: VectorType,
	capDir: VectorType,
	orthoDir: VectorType,
	localZDown: VectorType,
	dims: RailingDims,
) => [number[][], number[][]];

function cap180(
	_railingCoordsForCap: number[][],
	startPoint: VectorType,
	capDir: VectorType,
	_orthoDir: VectorType,
	localZDown: VectorType,
	dims: RailingDims,
): [number[][], number[][]] {
	const arcPoint = vecAdd(
		vecAdd(startPoint, vecScale(capDir, dims.terminalRadius)),
		vecScale(localZDown, dims.terminalRadius),
	);
	const capCoords = [arcPoint, vecAdd(startPoint, vecScale(localZDown, dims.terminalRadius * 2))];
	return [capCoords, [arcPoint]];
}

function capToEndPost(
	railingCoordsForCap: number[][],
	startPoint: VectorType,
	capDir: VectorType,
	_orthoDir: VectorType,
	localZDown: VectorType,
	dims: RailingDims,
): [number[][], number[][]] {
	const arcPoint = vecAdd(
		vecAdd(startPoint, vecScale(capDir, dims.terminalRadius)),
		vecScale(localZDown, dims.terminalRadius),
	);
	const endPoint = [...railingCoordsForCap[railingCoordsForCap.length - 2]];
	endPoint[2] -= dims.terminalRadius * 2;
	const capCoords = [arcPoint, vecAdd(startPoint, vecScale(localZDown, dims.terminalRadius * 2)), endPoint];
	return [capCoords, [arcPoint]];
}

function capToWall(
	_railingCoordsForCap: number[][],
	startPoint: VectorType,
	capDir: VectorType,
	orthoDir: VectorType,
	_localZDown: VectorType,
	dims: RailingDims,
): [number[][], number[][]] {
	const arcPoint = vecAdd(
		vecAdd(startPoint, vecScale(capDir, dims.clearWidth * ARC_MIDDLE_POINT_COS)),
		vecScale(orthoDir, dims.clearWidth * (1 - ARC_MIDDLE_POINT_COS)),
	);
	const capCoords = [
		arcPoint,
		vecAdd(vecAdd(startPoint, vecScale(orthoDir, dims.clearWidth)), vecScale(capDir, dims.clearWidth)),
	];
	return [capCoords, [arcPoint]];
}

function capToFloor(
	_railingCoordsForCap: number[][],
	startPoint: VectorType,
	capDir: VectorType,
	_orthoDir: VectorType,
	_localZDown: VectorType,
	dims: RailingDims,
): [number[][], number[][]] {
	const arcPoint = vecAdd(
		vecAdd(startPoint, vecScale(capDir, dims.terminalRadius * ARC_MIDDLE_POINT_COS)),
		vecScale(Z_DOWN, dims.terminalRadius * (1 - ARC_MIDDLE_POINT_COS)),
	);
	const arcEnd = vecAdd(
		vecAdd(startPoint, vecScale(capDir, dims.terminalRadius)),
		vecScale(Z_DOWN, dims.terminalRadius),
	);
	const capCoords = [
		arcPoint,
		arcEnd,
		vecAdd(arcEnd, vecScale(Z_DOWN, dims.heightBelowHandrail - dims.terminalRadius)),
	];
	return [capCoords, [arcPoint]];
}

function capToEndPostAndFloor(
	railingCoordsForCap: number[][],
	startPoint: VectorType,
	capDir: VectorType,
	_orthoDir: VectorType,
	localZDown: VectorType,
	dims: RailingDims,
): [number[][], number[][]] {
	const firstArcEnd = vecAdd(
		vecAdd(startPoint, vecScale(capDir, dims.terminalRadius)),
		vecScale(localZDown, dims.terminalRadius),
	);
	// See this file's header comment (finding 1): these 2 calls are deliberately UNGUARDED,
	// matching real Python's own `_cap_to_end_post_and_floor` -- a degenerate fillet here
	// throws uncaught.
	const firstArcCoords = getFilletPoints(
		startPoint,
		vecAdd(startPoint, vecScale(capDir, dims.terminalRadius)),
		firstArcEnd,
		dims.terminalRadius,
	);
	const endPoint = [...railingCoordsForCap[railingCoordsForCap.length - 2]];
	endPoint[2] -= dims.heightBelowHandrail;
	const secondArcCoords = getFilletPoints(
		firstArcEnd,
		vecAdd(firstArcEnd, vecScale(localZDown, dims.terminalRadius)),
		endPoint,
		dims.terminalRadius,
	);
	const capCoords = [[...startPoint], ...firstArcCoords, ...secondArcCoords, endPoint];
	return [capCoords, [firstArcCoords[1], secondArcCoords[1]]];
}

/** Dispatch table for handrail terminal caps (Python: `_CAP_BUILDERS`). `"NONE"` stays out of
 * this table -- every other cap type appends real geometry to the polyline, so a `"NONE"` slot
 * would need an awkward empty-concatenation contract -- `addCap` early-returns unchanged instead. */
const CAP_BUILDERS: Record<Exclude<TerminalType, "NONE">, CapBuilder> = {
	"180": cap180,
	TO_END_POST: capToEndPost,
	TO_WALL: capToWall,
	TO_FLOOR: capToFloor,
	TO_END_POST_AND_FLOOR: capToEndPostAndFloor,
};

/**
 * Add a handrail terminal cap at one end of the railing (Python: `_add_cap`).
 *
 * Returns the inputs unchanged when `dims.capType === "NONE"`.
 */
function addCap(
	railingCoords: number[][],
	arcPointsList: number[][],
	start: boolean,
	dims: RailingDims,
): [number[][], number[][]] {
	const capType = dims.capType;
	if (capType === "NONE") {
		return [railingCoords, arcPointsList];
	}

	const railingCoordsForCap = start ? [...railingCoords].reverse() : railingCoords;
	let arcList = start ? [...arcPointsList].reverse() : arcPointsList;

	const startPoint = railingCoordsForCap[railingCoordsForCap.length - 1];
	const capDir = npNormalized(
		vecSub(railingCoordsForCap[railingCoordsForCap.length - 1], railingCoordsForCap[railingCoordsForCap.length - 2]),
	);
	let orthoDir = npNormalized(npTo3d(swapYX(capDir).map((v, i) => v * (i === 0 ? 1 : -1)) as [number, number]));
	const localZDown = vecCross3(capDir, orthoDir);
	if (start) {
		orthoDir = orthoDir.map((x) => -x);
	}

	const [capCoords, newArcPoints] = CAP_BUILDERS[capType](
		railingCoordsForCap,
		startPoint,
		capDir,
		orthoDir,
		localZDown,
		dims,
	);
	arcList = [...arcList, ...newArcPoints];
	let newRailingCoords = [...railingCoordsForCap, ...capCoords];

	if (start) {
		newRailingCoords = [...newRailingCoords].reverse();
		arcList = [...arcList].reverse();
	}
	return [newRailingCoords, arcList];
}

/** Map each fillet/cap arc's own literal midpoint coordinate back to its index in the final
 * polyline (Python: `_get_arc_indices`). */
function getArcIndices(points: number[][], arcPts: number[][]): number[] {
	let pointsSlice = points;
	const arcIndices: number[] = [];
	let iBase = 0;
	for (const arcPoint of arcPts) {
		let matchIndex = -1;
		for (let i = 0; i < pointsSlice.length; i++) {
			if (allClose(arcPoint, pointsSlice[i])) {
				matchIndex = i;
				const currentIndex = i + iBase;
				arcIndices.push(currentIndex);
				iBase = currentIndex + 1;
				break;
			}
		}
		if (matchIndex === -1) {
			throw new Error(
				`Arc point '${JSON.stringify(arcPoint)}' is not present in points:\n${JSON.stringify(pointsSlice)}\nFull points data:\n${JSON.stringify(points)}`,
			);
		}
		pointsSlice = pointsSlice.slice(matchIndex + 1);
	}
	return arcIndices;
}

/** Options for {@link computeWallMountedHandrailGeometry} (Python: `compute_wall_mounted_
 * handrail_geometry`'s own keyword-only parameters). */
export interface ComputeWallMountedHandrailGeometryOptions {
	/** Sequence of 3D points along the top of the handrail (not the centre). */
	railingPath: SequenceOfVectors;
	/** Distance between automatic supports. */
	supportSpacing: number;
	/** Handrail tube diameter. */
	railingDiameter: number;
	/** Clear gap between the wall and the handrail tube. */
	clearWidth: number;
	/** Total railing height (top of handrail to floor). */
	height: number;
	/** If true, one support is placed on every non-collinear vertex of `railingPath`; if false
	 * (default), supports are distributed automatically by `supportSpacing`. */
	useManualSupports?: boolean;
	/** Style of the terminal end cap, or `"NONE"` for no cap. Ignored when `loopedPath=true` (no
	 * open ends to cap). Defaults to `"180"`. */
	terminalType?: TerminalType;
	/** If true, the railing closes on its first point. Defaults to `false`. */
	loopedPath?: boolean;
	/** Output of `calculateUnitScale`. Defaults to `1.0` (i.e. inputs are already in metres). */
	unitScale?: number;
}

/**
 * Compute pure geometric data for a wall-mounted handrail (Python:
 * `compute_wall_mounted_handrail_geometry`).
 *
 * The result can be wrapped into an `IfcShapeRepresentation` by {@link addRailingRepresentation},
 * or converted directly to a Blender bmesh (or any other viewport mesh) for a live preview that
 * does not mutate the IFC file. This function has NO `ifcopenshell.file`/`IfcFile` dependency at
 * all -- see this file's own header comment.
 *
 * Geometric inputs (`railingPath`, `supportSpacing`, `railingDiameter`, `clearWidth`, `height`)
 * are expected in IFC project units. `unitScale` is used only to convert hard-coded millimetre
 * constants (fillet radius, support rod radius, etc.) into project units.
 *
 * Constraints (documented, not asserted -- matching real Python, which has no `assert` statements
 * here either):
 * - `railingPath` must contain at least 2 points.
 * - `railingDiameter` must be > 0.
 * - `height` must be >= `railingDiameter / 2` (otherwise the `TO_FLOOR` / `TO_END_POST_AND_FLOOR`
 *   caps extrude upward instead of down).
 * - `clearWidth` must be > 0 (otherwise the support wraps backward into the wall).
 */
export function computeWallMountedHandrailGeometry(
	options: ComputeWallMountedHandrailGeometryOptions,
): WallMountedHandrailGeometry {
	const {
		railingPath,
		supportSpacing,
		railingDiameter,
		clearWidth,
		height,
		useManualSupports = false,
		terminalType = "180",
		loopedPath = false,
		unitScale = 1.0,
	} = options;

	const railingRadius = railingDiameter / 2;
	// for calculations purposes we use height without railing radius
	const heightBelowHandrail = height - railingRadius;
	const zDownScaled = vecScale(Z_DOWN, railingRadius);
	let railingCoords: number[][] = railingPath.map((p) => vecSub(p, zDownScaled));

	const dims: RailingDims = {
		railingRadius,
		heightBelowHandrail,
		terminalRadius: mmToM(TERMINAL_RADIUS_MM) / unitScale,
		filletRadius: mmToM(HANDRAIL_FILLET_RADIUS_MM) / unitScale,
		supportSpacing,
		supportLength: clearWidth + railingRadius,
		supportArcRadius: mmToM(SUPPORT_ARC_RADIUS_MM) / unitScale,
		supportDiskRadius: railingRadius,
		supportDiskDepth: mmToM(SUPPORT_DISK_DEPTH_MM) / unitScale,
		clearWidth,
		capType: terminalType,
	};

	// need to add first two points to the path to create the turning arcs and supports on the
	// last segment of the loop
	if (loopedPath) {
		railingCoords = [...railingCoords, railingCoords[0], railingCoords[1]];
	}

	const supports = collectSupports(railingCoords, useManualSupports, dims);
	let [handrailPolyline, arcPoints] = addArcsOnTurningPoints(railingCoords, dims, loopedPath);

	if (!loopedPath) {
		[handrailPolyline, arcPoints] = addCap(handrailPolyline, arcPoints, true, dims);
		[handrailPolyline, arcPoints] = addCap(handrailPolyline, arcPoints, false, dims);
	}

	return {
		handrailPolyline,
		handrailArcPointIndices: getArcIndices(handrailPolyline, arcPoints),
		handrailRadius: railingRadius,
		supports,
	};
}

/**
 * Resolve an optional millimetre-defaulted parameter into project units (Python:
 * `_resolve_default_mm`).
 *
 * Callers pass `value` as the user-supplied override (or `null`/`undefined`) and `defaultMm` as
 * the integer millimetre default; the result is in project units (`mm/1000 / unitScale`).
 */
function resolveDefaultMm(value: number | null | undefined, defaultMm: number, unitScale: number): number {
	if (value !== null && value !== undefined) {
		return value;
	}
	return mmToM(defaultMm) / unitScale;
}

export interface AddRailingRepresentationSettings {
	/** The `IfcGeometricRepresentationContext` for the representation. */
	context: EntityInstance;
	/**
	 * A sequence of point coordinates for the railing path -- coordinates are expected to be at
	 * the top of the railing, not at the centre.
	 *
	 * **Real Python quirk, verbatim-preserved -- see this file's own header comment (finding
	 * 2):** this parameter has NO default value in real Python's own signature (a required
	 * keyword-only argument) -- yet its own body still has an `if railing_path is None:`
	 * default-computing branch (`[(0, 0, 1), (1, 0, 1), (2, 0, 1)]` in metres, converted to
	 * project units), contradicting the docstring's own "If not provided, default path ... will
	 * be used" claim. Omitting the argument in real Python raises `TypeError` BEFORE that branch
	 * is ever reached -- it is only reachable by explicitly passing `None`. This field is
	 * required here too (TypeScript's own compile-time analogue of "no default, must be
	 * supplied"), but an explicit `null` is treated the same as an explicit `undefined` (JS/TS
	 * has no runtime-visible distinction between "key omitted" and "key explicitly
	 * `undefined`") -- both reach the same default-path computation real Python's own
	 * dead-unless-explicit-`None` branch would.
	 */
	railingPath: SequenceOfVectors | null;
	/** If enabled, supports are added on every vertex on the edges of the railing path. If
	 * disabled, supports are added automatically based on the support spacing. Defaults to
	 * `false`. */
	useManualSupports?: boolean;
	/** Distance between supports if automatic supports are used. Defaults to 1m. */
	supportSpacing?: number | null;
	/** Railing diameter. Defaults to 50mm. */
	railingDiameter?: number | null;
	/** Clear width between the railing and the wall. Defaults to 40mm. */
	clearWidth?: number | null;
	/** Type of the cap, or `"NONE"` for no cap. Defaults to `"180"`. */
	terminalType?: TerminalType;
	/** Defaults to 1m. */
	height?: number | null;
	/** Whether to end the railing on the first point of `railingPath`. Defaults to `false`. */
	loopedPath?: boolean;
	/** The unit scale as calculated by `calculateUnitScale`. If not provided, it will be
	 * automatically calculated. */
	unitScale?: number;
}

function addRailingRepresentationUsecase(file: IfcFile, settings: AddRailingRepresentationSettings): EntityInstance {
	const { context } = settings;
	const unitScale = settings.unitScale ?? calculateUnitScale(file);

	// See `railingPath`'s own doc comment / this file's header comment (finding 2): real
	// Python's own `railing_path` has no default in its signature (a required keyword-only
	// argument) -- this branch mirrors its own dead-unless-explicit-`None` `if railing_path is
	// None` check, reached here via either an explicit `null` or an omitted field.
	const defaultRailingPath: number[][] = [
		[0, 0, 1],
		[1, 0, 1],
		[2, 0, 1],
	].map((p) => p.map((c) => c / unitScale));
	const railingPath: SequenceOfVectors = settings.railingPath ?? defaultRailingPath;

	const supportSpacing = resolveDefaultMm(settings.supportSpacing, DEFAULT_SUPPORT_SPACING_MM, unitScale);
	const railingDiameter = resolveDefaultMm(settings.railingDiameter, DEFAULT_RAILING_DIAMETER_MM, unitScale);
	const clearWidth = resolveDefaultMm(settings.clearWidth, DEFAULT_CLEAR_WIDTH_MM, unitScale);
	const height = resolveDefaultMm(settings.height, DEFAULT_HEIGHT_MM, unitScale);

	const geometry = computeWallMountedHandrailGeometry({
		railingPath,
		useManualSupports: settings.useManualSupports ?? false,
		supportSpacing,
		railingDiameter,
		clearWidth,
		terminalType: settings.terminalType ?? "180",
		height,
		loopedPath: settings.loopedPath ?? false,
		unitScale,
	});

	const builder = new ShapeBuilder(file);
	const items3d: EntityInstance[] = [];

	for (const support of geometry.supports) {
		// See this file's header comment (finding 3, gap 2): throws on IFC4/IFC4X3 today
		// (a fixed, always-non-empty `arcPoints=[1]`), fully functional on IFC2X3.
		const supportPolyline = builder.polyline(support.arcPolyline, false, null, [1]);
		// See this file's header comment (finding 3, gap 1): throws unconditionally today,
		// on every schema.
		items3d.push(builder.createSweptDiskSolid(supportPolyline, support.arcRadius));

		const diskCircle = builder.circle([0, 0], support.diskRadius);
		const yExtrusionKwargs = builder.rotateExtrusionKwargsByZ(builder.extrudeKwargs("Y"), support.diskZRotation);
		items3d.push(
			builder.extrude(
				diskCircle,
				support.diskDepth,
				support.diskPosition,
				yExtrusionKwargs.extrusionVector,
				yExtrusionKwargs.positionZAxis,
				yExtrusionKwargs.positionXAxis,
			),
		);
	}

	// See this file's header comment (finding 3): throws on IFC4/IFC4X3 whenever any fillet/cap
	// arc exists (gap 2, essentially always given the documented `terminalType="180"` default);
	// on IFC2X3, or when `handrailArcPointIndices` is genuinely empty, this call itself succeeds
	// but the unconditional `createSweptDiskSolid` call right below it (gap 1) always throws
	// regardless.
	const railingPathEntity = builder.polyline(geometry.handrailPolyline, false, null, geometry.handrailArcPointIndices);
	items3d.push(builder.createSweptDiskSolid(railingPathEntity, geometry.handrailRadius));

	return builder.getRepresentation(context, items3d);
}

/**
 * Adds a railing representation (Python: `ifcopenshell.api.geometry.add_railing_representation`).
 *
 * **Read this file's own header comment before using this function** (finding 3): this function
 * is blocked on EVERY input, on EVERY schema, by a pre-existing `entityInstance.ts`
 * primitive-layer gap (`ShapeBuilder.createSweptDiskSolid`'s own unconditional `.get("Dim")`
 * check) -- there is no `TargetView`/parameter combination that avoids it. The underlying
 * geometry math ({@link computeWallMountedHandrailGeometry}) is fully correct and genuinely
 * unblocked; only this thin IFC-wrapping layer on top of it is affected.
 *
 * Units are expected to be in IFC project units.
 *
 * @param settings.context The `IfcGeometricRepresentationContext` for the representation.
 * @param settings.railingPath A sequence of point coordinates for the railing path. See this
 * field's own doc comment for a real, disclosed Python-source quirk around its "default".
 * @param settings.useManualSupports If enabled, supports are added on every vertex on the edges
 * of the railing path. Defaults to `false`.
 * @param settings.supportSpacing Distance between supports if automatic supports are used.
 * Defaults to 1m.
 * @param settings.railingDiameter Railing diameter. Defaults to 50mm.
 * @param settings.clearWidth Clear width between the railing and the wall. Defaults to 40mm.
 * @param settings.terminalType Type of the cap, or `"NONE"` for no cap. Defaults to `"180"`.
 * @param settings.height Defaults to 1m.
 * @param settings.loopedPath Whether to end the railing on the first point of `railingPath`.
 * Defaults to `false`.
 * @param settings.unitScale The unit scale as calculated by `calculateUnitScale`. If not
 * provided, it will be automatically calculated for you.
 * @returns The `IfcShapeRepresentation` for a railing.
 */
export const addRailingRepresentation = wrapUsecase(
	"geometry.add_railing_representation",
	addRailingRepresentationUsecase,
);
