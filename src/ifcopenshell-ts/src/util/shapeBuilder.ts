// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/shape_builder.py` (src/ifcopenshell-python,
// 2312 lines, ~20 module-level functions + a 60-method `ShapeBuilder` class) -- a Phase 4
// ("`util` Tier B") chunk, landed across two PRs given its unusual size. **Part 1** (PR
// #58) ported every module-level function and every `ShapeBuilder` method EXCEPT the four
// MEP-specific methods. **Part 2** (this chunk) adds those four: `mepTransitionShape`,
// `mepTransitionLength`, `mepTransitionCalculate`, `mepBendShape`
// (`mep_transition_shape`/`mep_transition_length`/`mep_transition_calculate`/
// `mep_bend_shape`, shape_builder.py:1736-2312) -- the module is now **fully ported**, no
// functions or methods remain unported. Confirmed **kernel-free** per `20-roadmap.md`'s Phase 4 section
// (no `shapely`/OpenCASCADE dependency despite the name) -- reuses `gl-matrix` (already
// this project's runtime dependency, added by `util/placement.ts`) for the handful of 4x4
// matrix operations; every other numeric operation here is on plain 2/3-component vectors,
// implemented with small hand-written helpers below (dot/cross/norm/etc.) rather than
// gl-matrix's `vec2`/`vec3` typed-array types, specifically to avoid the
// `Array.isArray()`-returns-`false`-for-typed-arrays pitfall that would otherwise silently
// break every `ifcSafeVectorType`/attribute-write call site fed a gl-matrix vector (see
// `entityInstance.ts`'s `valueToVariant`: its `AGGREGATE` branch dispatches on
// `Array.isArray`, not `ArrayBuffer.isView`) -- plain `number[]` is simplest here and this file has
// dozens of such call sites.
//
// *** Numeric verification methodology (per this project's `util.placement`/
// `util.geolocation` Tier-B bar: verify every non-trivial numpy -> TS mapping
// empirically, cross-check risky functions a second, independent way) ***
//
// - `npRotationMatrix`'s axis-literal ("X"/"Y"/"Z") branches reuse the exact row-major
//   3x3 literals `np_rotation_matrix` itself uses (a direct transcription, not a
//   re-derivation) and were spot-checked against `mat4.fromXRotation`/`fromYRotation`/
//   `fromZRotation` -- already verified correct against numpy's own formulas by
//   `util/placement.ts`'s header comment -- by converting each to a `mat4` via this
//   file's own `mat3RowMajorToMat4` and comparing flat arrays for several angles; all
//   matched to float precision.
// - `npRotationMatrix`'s Rodrigues (arbitrary-axis) branch was verified two independent
//   ways: (1) a disposable Node script (not committed) confirmed that rotating `(1,0,0)`
//   by 120 degrees around the axis `(1,1,1)` (normalized) cyclically permutes it to
//   `(0,1,0)` -- and `(0,1,0)` -> `(0,0,1)` -> `(1,0,0)` -- a well-known, independently
//   verifiable property of a 120-degree rotation around the cube diagonal, not derived
//   from the formula being tested. (2) `test/util/shapeBuilder.test.ts` pins this exact
//   case as a real Vitest assertion.
// - `npMatrixToEuler`'s composition convention (which of `Rz@Ry@Rx` vs `Rx@Ry@Rz` the
//   extraction formula `y=-asin(m[2,0])`/`x=atan2(m[2,1]/cosY,m[2,2]/cosY)`/
//   `z=atan2(m[1,0]/cosY,m[0,0]/cosY)` actually assumes) was **not assumed from the
//   docstring's "similar to mathutils.Matrix.to_euler" claim** -- it was determined
//   empirically with a disposable Node script: built `M` both ways (`Rz@Ry@Rx` and
//   `Rx@Ry@Rz`, via verified `mat4.fromZRotation`/etc. + `mat4.multiply`, matching
//   `util/placement.ts`'s own established composition-order convention: `mat4.multiply(out,
//   A, B)` = numpy's `A @ B`) for a genuinely non-trivial, non-axis-aligned angle triple
//   (x=20 deg, y=30 deg, z=40 deg -- none of them 0/90/multiples), extracted Euler angles
//   from each with the formula above, and confirmed only the `Rz@Ry@Rx` composition
//   round-trips to the original (x,y,z); `Rx@Ry@Rz` recovers a visibly different triple.
//   `npMatrixToEuler` below is therefore documented, and tested
//   (`test/util/shapeBuilder.test.ts`), as assuming `matrix = Rz(z) @ Ry(y) @ Rx(x)`.
// - `npIntersectLineLine` cross-checked two independent ways in
//   `test/util/shapeBuilder.test.ts`: (1) two 3D lines constructed to genuinely intersect
//   at a known point (not axis-aligned) -- both "closest points" returned must equal that
//   exact point; (2) two genuinely skew (non-intersecting, non-parallel) 3D lines, solved a
//   second way in the test itself (a from-scratch 2x2 linear system via Cramer's rule, not
//   a transliteration of this function's own cross-product formula) and compared to 1e-9.
// - `arcToPolylinePoints` cross-checked by independently computing, for every output
//   point, its angle from the fitted center via `atan2` and confirming even angular
//   spacing across the full sweep plus constant radius -- not just "it runs and returns
//   16 points."
//
// *** Two real, disclosed, pre-existing, BLOCKING primitive-layer gaps this chunk did
// NOT invent a workaround for -- consistent with this project's established policy that a
// single chunk does not silently patch a foundational (`entityInstance.ts`) primitive-layer
// behavior, even when a narrow fix is easy; see `TODOS.md`'s existing entries, both
// investigated (not assumed) against the real, built native addon before writing this file ***
//
// 1. **`.get("Dim")` unconditionally throws for any entity** (`IfcCurve.Dim`/
//    `IfcSurface.Dim` are EXPRESS DERIVED attributes; `entityInstance.ts`'s `.get()` has no
//    DERIVED-category fallback at all -- see that file's own header comment and
//    `util/representation.ts`'s `guessType` header-comment finding, both pre-existing, not
//    introduced here). This blocks, in THIS file: `profile()` (unconditionally checks
//    `outerCurve.get("Dim") !== 2` before doing anything else) and
//    `createSweptDiskSolid()` (same, for `pathCurve.get("Dim") !== 3`) -- both throw
//    immediately for any real curve today. Transitively, `getRepresentation()`'s
//    `representationType`-omitted path calls the already-shipped, already-disclosed-blocked
//    `guessType()` (`util/representation.ts`), which throws for any `items` list containing
//    a real `IfcCurve`/`IfcSurface` -- not a new finding, just a new caller hitting it.
//    Ported faithfully anyway (exactly like `guessType` itself was): every branch and
//    validation check is real, working code, reachable and correct the moment the
//    underlying gap is fixed, with zero further changes needed here.
// 2. **A freshly-created, not-yet-populated simple/defined-type instance cannot be given an
//    initial value** (`EntityInstance.setByIndex`'s `attribute_kind_of` call unconditionally
//    throws `"Attribute access is only supported on entity instances"` for a non-entity
//    target -- `TODOS.md`'s existing "`EntityInstance.setByIndex`/`IfcFile.createEntity`
//    cannot write an initial value into a freshly created simple/defined-type instance"
//    entry, found by `util/migrator.ts`'s chunk, explicitly flagged there as a foundational
//    fix requiring the orchestrating session's review, not something a single chunk patches
//    inline). `IfcLineIndex`/`IfcArcIndex` (both `LIST OF INTEGER` EXPRESS TYPE
//    declarations, i.e. simple/defined types, NOT entities -- confirmed: neither appears in
//    the generated `.d.ts` files, which only cover entity classes) hit this exact gap. This
//    is a genuinely significant, real limitation for THIS module specifically (confirmed
//    empirically against the real, built addon before writing this file, not assumed):
//    - `polyline()`'s closed-curve/arc-segment path (needed whenever `closed=true` or
//      `arcPoints` is non-empty, for any non-IFC2X3 schema -- IFC2X3's own branch needs no
//      `IfcLineIndex`/`IfcArcIndex` at all, just repeated `IfcCartesianPoint`s) throws when
//      it reaches the `createEntity("IfcLineIndex"/"IfcArcIndex", segment)` call. **This
//      means `rectangle()` (which always calls `polyline(..., closed=true)`) throws on
//      IFC4/IFC4X3 today** -- a real, load-bearing practical limitation, not a corner case;
//      it and `polyline()` fully work today on IFC2X3 (verified with a dedicated,
//      `AVAILABLE_SCHEMAS`-guarded test) and `polyline()`'s own straight-line
//      (`closed=false`, no `arcPoints`) path fully works on every schema (no
//      `IfcLineIndex`/`IfcArcIndex` needed there -- it goes straight to
//      `createIfcIndexedPolyCurve(Points=...)` with no `Segments` at all).
//    - `curveBetweenTwoPoints()` (always builds one `IfcArcIndex`) always throws.
//    - `getSimple2dcurveData(..., createIfcCurve=true)` throws at the same point; the
//      `createIfcCurve=false` (default) path -- pure point/segment-index computation, no IFC
//      entities at all -- is fully functional and independently useful/tested.
//      `createZProfileLipsCurve()` always passes `createIfcCurve=true`, so it always throws
//      today; `createTransitionArcIfc(..., createIfcCurve=true)` throws for the same reason,
//      but its default (`createIfcCurve=false`) path is fully functional.
//    All of the above is ported faithfully (real, correct, verbatim control flow up to the
//    exact blocked call), not stubbed or skipped -- every blocked path is pinned by a
//    dedicated regression test asserting the CURRENT, disclosed, blocked behavior (the
//    real thrown error), matching `util/migrator.ts`'s own established precedent for this
//    exact gap, not silently worked around. By contrast, every face-set/mesh-based method
//    (`mesh`/`facetedBrep`/`triangulatedFaceSet`/`polygonalFaceSet`/`extrudeFaceSet`) is
//    FULLY FUNCTIONAL and unaffected -- `IfcTriangulatedFaceSet`/`IfcPolygonalFaceSet`/
//    `IfcIndexedPolygonalFace(WithVoids)` are real ENTITY classes (confirmed via the
//    generated `.d.ts` files), not defined types, so `createEntity` with an initial value
//    works fine for them. Likewise `vertex`/`edge`/`face`/`sphere`/`block`/
//    `halfSpaceSolid`/`plane`/both `createAxis2Placement*` methods/`circle`/
//    `createEllipseCurve` are all fully functional (every entity they build is a real
//    ENTITY, not a defined type).
//
// *** Two real Python-source quirks/bugs found while reading the exact source lines,
// preserved verbatim rather than "fixed" (this project's established discipline) ***
//
// 1. `profile()`'s `innerCurves` Dim-validation is only performed inside the branch taken
//    when a caller passes a single (non-array) curve instead of a proper array
//    (shape_builder.py:758-766: the `if any(curve.Dim != 2 for curve in inner_curves):`
//    check is indented INSIDE the `if not isinstance(inner_curves, collections.abc.Iterable):`
//    block, not a sibling check that runs for both cases). The normal, well-typed case (a
//    real array of inner curves) therefore skips the Dim validation entirely -- reproduced
//    verbatim below (checked via `Array.isArray`, matching Python's
//    `collections.abc.Iterable` check, which a real `entity_instance` never satisfies --
//    confirmed: it defines `__getitem__` but not `__iter__`, and `collections.abc.Iterable`
//    checks specifically for `__iter__`). This also means the single-non-array-curve branch
//    is where this chunk's Dim gap (finding 1 above) becomes newly reachable through
//    `profile()` even for a caller who never triggers the OuterCurve Dim check to fail --
//    pinned by a dedicated test.
// 2. `rotateExtrusionKwargsByZ`'s `counterClockwise` parameter is accepted but genuinely
//    never used (shape_builder.py:1329-1347: `rot = np_rotation_matrix(-angle, 3, "Z")`
//    unconditionally negates `angle`, regardless of the flag's value) -- a real, disclosed,
//    verbatim-preserved Python-source quirk (the flag looks like it should control rotation
//    direction but doesn't), not an oversight in this port.
//
// *** One deliberate, disclosed, narrow robustness addition (not a "silent wrong answer"
// fix, matching this project's `mat4.invert`-return-value-check precedent from
// `util/geolocation.ts`) ***
//
// `mirror2dPoint` throws a descriptive error when `point2d`/`mirrorAxes`/`mirrorPoint` have
// mismatched lengths, rather than silently computing garbage via JS's permissive
// out-of-bounds-index-is-`undefined` array access (numpy would raise a `ValueError`
// broadcast error for the equivalent mismatched-shape case in Python, since
// `mirror_2d_point`'s `point_2d - mirror_point`/`* mirror_axes` numpy expressions require
// matching or broadcastable shapes). This is deliberately narrow -- only this one function
// (the fan-out point for `mirror()`'s per-point-type dispatch) gets the explicit guard,
// not every elementwise-array helper in this file.
//
// *** Part 2 (the four MEP methods) -- findings specific to this chunk ***
//
// - **`mepTransitionShape` is FULLY FUNCTIONAL today**, unlike the other three MEP
//   methods below (a genuinely good-news finding, verified by tracing every call it
//   makes): it never calls the blocked `profile()`/`polyline(..., closed=true |
//   arcPoints=...)` -- its only geometry-creation calls are `extrudeFaceSet()`/
//   `polygonalFaceSet()` (both already fully functional -- `IfcPolygonalFaceSet`/
//   `IfcIndexedPolygonalFace(WithVoids)` are real entities, not defined types), and its
//   one `getRepresentation()` call always passes an explicit `representationType`
//   ("Tesselation", see below), never triggering the blocked `guessType()` fallback.
// - **`mepBendShape` is UNCONDITIONALLY BLOCKED on every schema and every profile shape**
//   -- a new, transitive finding this chunk investigated directly (not assumed), for two
//   DIFFERENT reasons depending on schema:
//   - On IFC4/IFC4X3: its private `getBendRepresentationItem` closure always calls
//     `this.polyline(..., arcPoints=...)` with a non-empty `arcPoints` array in every
//     branch (circular profile: `[1]`; rectangular, degenerate-radius: `[2]`;
//     rectangular, general: `[1, 4]`), which hits finding 2 above (`IfcLineIndex`/
//     `IfcArcIndex` creation blocked).
//   - On IFC2X3: `IfcMaterialProfileSet` (needed by `mepGetProfile`/`get_profile` to
//     resolve ANY profile at all) is an IFC4+ entity -- confirmed absent from
//     `src/generated/ifc2x3.d.ts` -- so no real IFC2X3 caller could ever satisfy
//     `mep_bend_shape`'s own `assert profile` check in the first place. This means
//     IFC2X3 never even reaches `polyline()`'s own separate, real "Arcs are not
//     supported for IFC2X3" restriction (a genuine, pre-existing, unrelated Python-source
//     restriction) -- it throws earlier, via `assert profile`, for a distinct
//     schema-capability reason.
//   Either way, every call to `mepBendShape` throws today, regardless of schema -- ported
//   faithfully anyway (every branch is real, correct, verbatim-translated control flow,
//   reachable end-to-end for any non-IFC2X3 file the moment finding 2 is fixed), pinned by
//   dedicated regression tests for both cases.
// - `mepTransitionLength`/`mepTransitionCalculate` are pure math (no entity creation at
//   all) and are FULLY FUNCTIONAL and tested -- `test/util/shapeBuilder.test.ts` ports
//   `test_shape_builder.py`'s real `TestCalculateTransitions` class verbatim (all 6
//   cases, including the shared `calculate_and_test` helper's own independent 3-method
//   angle-recomputation cross-check).
// - `mepTransitionCalculate` is ported taking a single options object (`start_half_dim`/
//   `end_half_dim`/`offset`/`diff`/`end_profile`/`length`/`angle`/`verbose`) rather than
//   this file's usual positional-parameter style: every real Python call site
//   (`mep_transition_length`'s two calls, `test_shape_builder.py`'s own test harness) is
//   keyword-argument-only, several via `**dict`-spreading a shared arguments object -- an
//   options object is the faithful translation here, not a stylistic deviation.
// - Three real, disclosed, verbatim-preserved Python-source quirks found in
//   `mep_transition_calculate`/`mep_transition_length`/`mep_transition_shape` while
//   reading the exact source lines:
//   1. `mep_transition_calculate` silently returns `None` if BOTH `length` and `angle`
//      are already non-null on entry (neither its `if length is None` nor `elif angle is
//      None` branch executes, so the function falls off the end) -- preserved verbatim
//      (`mepTransitionCalculate` returns `null` in that case too).
//   2. `mep_transition_length`'s `return check_transition() or check_transition(True)`
//      relies on Python's `or` returning its second operand's own value whenever the
//      first is falsy (`None` OR a legitimate `0`) -- JS's `||` has the identical
//      falsy-short-circuit semantics for these two return types, so `checkTransition(false)
//      || checkTransition(true)` preserves this exactly, including the dormant quirk that
//      a legitimate zero-length result from the first call would be silently discarded in
//      favor of the second call's result. Confirmed dormant in practice (not exercised by
//      any test): `mepTransitionCalculate` only ever returns a length via `Math.sqrt` of a
//      value already checked `> 0`, so it can never legitimately return exactly `0`.
//   3. `mep_transition_shape` passes `"Tesselation"` (missing the second "l") as the
//      explicit `representationType` to `get_representation()` -- the real IFC
//      `RepresentationType` enumerant is `"Tessellation"`. A genuine Python-source typo,
//      preserved verbatim rather than corrected.
// - `mep_transition_shape`/`mep_bend_shape` both define an identical nested `get_profile`/
//   `get_dim` closure pair; since neither closes over any enclosing method state (both are
//   pure functions of their own parameters, calling only the free `get_material()`),
//   they're hoisted to shared module-private `mepGetProfile`/`mepGetDim` functions below
//   (next to `removeRedundantPoints`), matching that function's own established
//   "closure-free nested Python helper -> module-private function" precedent -- a
//   disclosed, non-behavioral simplification, not a deviation. `get_circle_points` differs
//   in signature/semantics between the two methods (and `mep_bend_shape`'s version closes
//   over several method-local variables -- `z_sign`/`lateral_axis`/`lateral_sign`), so
//   each stays as its own local nested closure, matching Python's own structure.
// - `mep_bend_shape`'s `next(i for i in range(2) if not is_x(rounded_bend_vector[i], 0))`
//   raises `StopIteration` in Python if `bend_vector`'s X and Y components are both
//   approximately zero (no lateral axis can be determined) -- reproduced as an explicit,
//   descriptive throw rather than a silent `undefined`-driven crash later.
//
// See `test/util/shapeBuilder.test.ts`'s own header comment for what was ported from the
// real `test/util/test_shape_builder.py` verbatim vs. added new.

import { mat4, vec3 } from "gl-matrix";
import type { EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";
import { copyDeep, getMaterial } from "./element";
import { getAxis2placement } from "./placement";
import type { MatrixType } from "./placement";
import { getContext, guessType } from "./representation";
import { calculateUnitScale } from "./unit";

export type { MatrixType };

/** Python's `VectorType`/`SequenceOfVectors` (`Union[Sequence[float], np.ndarray]`/
 * `Union[Sequence[VectorType], np.ndarray]`) -- represented as plain `number[]` arrays
 * throughout this file rather than gl-matrix's typed-array `vec2`/`vec3`, see this file's
 * header comment for why. */
export type VectorType = readonly number[];
export type SequenceOfVectors = readonly VectorType[];

export const PRECISION = 1.0e-5;

/** A principal rotation axis literal, as accepted by `npRotationMatrix`/`rotation()`. */
export type RotationAxis = "X" | "Y" | "Z";

/** Return shape of `extrudeKwargs()`, matching `extrude()`'s own `position_x_axis`/
 * `position_z_axis`/`extrusion_vector` keyword parameters. */
export interface ExtrudeKwargs {
	readonly positionXAxis: VectorType;
	readonly positionZAxis: VectorType;
	readonly extrusionVector: VectorType;
}

/** Return shape of `mepTransitionShape()`'s transition-geometry data
 * (`ShapeBuilder.mep_transition_shape`'s returned `dict[str, Any]`). */
export interface MepTransitionData {
	readonly startLength: number;
	readonly endLength: number;
	readonly angle: number;
	readonly profileOffset: VectorType;
	readonly transitionLength: number;
	readonly fullTransitionLength: number;
}

/**
 * Named-parameter bag for `mepTransitionCalculate()` -- see that method's own doc comment
 * (and this file's header comment) for why an options object, rather than this file's
 * usual positional-parameter style, is the faithful translation here: every real Python
 * call site is keyword-argument-only.
 */
export interface MepTransitionCalculateOptions {
	readonly startHalfDim: VectorType;
	readonly endHalfDim: VectorType;
	readonly offset: VectorType;
	readonly diff?: VectorType | null;
	readonly endProfile?: boolean;
	readonly length?: number | null;
	readonly angle?: number | null;
	readonly verbose?: boolean;
}

/** Return shape of `mepBendShape()`'s bend-geometry data (`ShapeBuilder.mep_bend_shape`'s
 * returned `dict[str, Any]`). */
export interface MepBendData {
	readonly startLength: number;
	readonly endLength: number;
	readonly radius: number;
	readonly angle: number;
	readonly lateralAxis: number;
	readonly lateralSign: number;
	readonly zAxisSign: number;
	readonly mainProfileDimension: number;
}

// --- internal vector-math helpers (not exported -- pure translation aids, operating on
// plain `number[]`, per this file's header comment) ---

function sub(a: VectorType, b: VectorType): number[] {
	return a.map((v, i) => v - b[i]);
}

function add(a: VectorType, b: VectorType): number[] {
	return a.map((v, i) => v + b[i]);
}

function dot(a: VectorType, b: VectorType): number {
	return a.reduce((s, v, i) => s + v * b[i], 0);
}

function vecLength(a: VectorType): number {
	return Math.sqrt(dot(a, a));
}

function cross3(a: VectorType, b: VectorType): number[] {
	return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** Elementwise vector multiply (`a * b` for two numpy arrays of matching length) -- added
 * for Part 2's MEP methods below (`mepTransitionShape`'s extensive `half_dim * (+-1, +-1,
 * +-1)`-style literal masking); no Part 1 caller needed it. */
function mul(a: VectorType, b: VectorType): number[] {
	return a.map((v, i) => v * b[i]);
}

/** Row-major matrix (any square size) times a vector: `result[i] = sum_j m[i][j] * v[j]`. */
function matVecMul(m: readonly (readonly number[])[], v: readonly number[]): number[] {
	return m.map((row) => row.reduce((s, val, j) => s + val * v[j], 0));
}

/** `np.allclose(a, b)` with numpy's own default `rtol=1e-5`/`atol=1e-8`. */
function allClose(a: readonly number[], b: readonly number[]): boolean {
	return a.every((v, i) => Math.abs(v - b[i]) <= 1e-8 + 1e-5 * Math.abs(b[i]));
}

/** `math.isclose(a, b, abs_tol=absTol)` with Python's default `rel_tol=1e-9`. */
function isCloseAbsTol(a: number, b: number, absTol: number, relTol = 1e-9): boolean {
	return Math.abs(a - b) <= Math.max(relTol * Math.max(Math.abs(a), Math.abs(b)), absTol);
}

/** Extracts a 4x4 `MatrixType`'s linear (rotation/scale) 3x3 part as a row-major nested
 * array (`matrix[:3, :3]` in numpy) -- flat column-major index for row `i`, col `j` is
 * `4*j + i` (the same convention `util/placement.ts`'s header comment verifies/documents). */
function mat4LinearPartRowMajor(m: MatrixType): number[][] {
	return [
		[m[0], m[4], m[8]],
		[m[1], m[5], m[9]],
		[m[2], m[6], m[10]],
	];
}

/** Builds a `MatrixType` (4x4) from a row-major 3x3 rotation/scale part, with translation
 * left at zero (`np_to_4x4`'s own `np.pad`-with-zero, not identity, semantics). */
function mat3RowMajorToMat4(m: readonly (readonly number[])[]): MatrixType {
	const out = mat4.create();
	out[0] = m[0][0];
	out[1] = m[1][0];
	out[2] = m[2][0];
	out[3] = 0;
	out[4] = m[0][1];
	out[5] = m[1][1];
	out[6] = m[2][1];
	out[7] = 0;
	out[8] = m[0][2];
	out[9] = m[1][2];
	out[10] = m[2][2];
	out[11] = 0;
	out[12] = 0;
	out[13] = 0;
	out[14] = 0;
	out[15] = 1;
	return out;
}

/** General 3x3 matrix inverse via the adjugate/determinant method (row-major in, row-major
 * out) -- NOT simplified to a transpose even though every real caller here passes an
 * orthonormal (rotation-only) matrix, matching Python's own choice to call the generic
 * `np.linalg.inv` rather than exploit orthonormality (`mirror()`'s
 * `np.linalg.inv(placement_matrix)`). Throws (rather than silently returning a bogus
 * result) for a singular matrix, matching `np.linalg.inv`'s own `LinAlgError` -- the same
 * "don't silently substitute a wrong answer" precedent as `util/geolocation.ts`'s
 * `invertOrThrow`. */
function invert3x3(m: readonly (readonly number[])[]): number[][] {
	const [[a, b, c], [d, e, f], [g, h, i]] = m;
	const cofA = e * i - f * h;
	const cofB = -(d * i - f * g);
	const cofC = d * h - e * g;
	const cofD = -(b * i - c * h);
	const cofE = a * i - c * g;
	const cofF = -(a * h - b * g);
	const cofG = b * f - c * e;
	const cofH = -(a * f - c * d);
	const cofI = a * e - b * d;
	const det = a * cofA + b * cofB + c * cofC;
	if (Math.abs(det) < 1e-12) {
		throw new Error(
			"invert3x3: matrix is singular (not invertible) -- numpy's np.linalg.inv would raise LinAlgError here",
		);
	}
	const invDet = 1 / det;
	return [
		[cofA * invDet, cofD * invDet, cofG * invDet],
		[cofB * invDet, cofE * invDet, cofH * invDet],
		[cofC * invDet, cofF * invDet, cofI * invDet],
	];
}

/** Python's `hasattr(instance, name)` for an EXPRESS forward attribute. */
function hasAttr(instance: EntityInstance, name: string): boolean {
	try {
		instance.get(name);
		return true;
	} catch {
		return false;
	}
}

/** Deep-converts any `ArrayLike`/typed-array/nested-array structure into plain nested
 * `number[]`/`number[][]` -- backs both `V()` and `ifcSafeVectorType()`. */
function toFloatArray(value: unknown): unknown {
	if (Array.isArray(value) || ArrayBuffer.isView(value)) {
		return Array.from(value as ArrayLike<unknown>, (el) => toFloatArray(el));
	}
	return Number(value);
}

/** `util/unit.ts`'s `pythonRound` (round-half-to-even, matching Python's builtin `round()`)
 * generalized to N decimal digits via the same scale/round/unscale technique --
 * `unit.ts` only exports the nearest-integer form, so this is duplicated here per this
 * project's "small per-module private helpers" convention. numpy's `np.round` uses the
 * identical round-half-to-even rule, so this same helper backs both `roundToPrecision`
 * (Python's builtin `round`) and `npRoundToPrecision` (`np.round`). */
function pythonRoundToDigits(x: number, digits: number): number {
	const scale = 10 ** digits;
	const scaled = x * scale;
	const floor = Math.floor(scaled);
	const diff = scaled - floor;
	const EPSILON = 1e-9;
	const rounded = Math.abs(diff - 0.5) < EPSILON ? (floor % 2 === 0 ? floor : floor + 1) : Math.round(scaled);
	return rounded / scale;
}

// --- module-level free functions (`ifcopenshell.util.shape_builder`'s own top-level
// functions, ported in full) ---

/**
 * Convert floats / vector / sequence of vectors to a plain float array
 * (`ifcopenshell.util.shape_builder.V`).
 *
 * Unlike numpy (which returns a real `np.float64` array either way), JS has only one
 * `number` type, so this mostly exists for API parity/its ported call sites' sake.
 */
export function V(...args: readonly unknown[]): number[] | number[][] {
	if (typeof args[0] === "number") {
		return args.map((a) => Number(a));
	}
	if (args.length !== 1) {
		throw new Error("V: only single argument is supported if providing a vector or a sequence of them.");
	}
	return toFloatArray(args[0]) as number[] | number[][];
}

/**
 * Convert vector / sequence of vectors to a plain (possibly nested) float array that's
 * safe to save as an IFC attribute value (`ifcopenshell.util.shape_builder.ifc_safe_vector_type`).
 *
 * Critically, this also converts any gl-matrix typed-array (`Float64Array`-backed
 * `vec2`/`vec3`/etc.) result into a genuine `Array` -- `EntityInstance.setByIndex`'s
 * variant-conversion logic (`entityInstance.ts`'s `valueToVariant`) dispatches on
 * `Array.isArray`, which is `false` for a typed array.
 */
export function ifcSafeVectorType(v: VectorType): number[];
export function ifcSafeVectorType(v: SequenceOfVectors): number[][];
export function ifcSafeVectorType(v: VectorType | SequenceOfVectors): number[] | number[][] {
	return toFloatArray(v) as number[] | number[][];
}

/** `ifcopenshell.util.shape_builder.is_x`. */
export function isX(value: number, x: number, siConversion?: number | null): boolean {
	const v = siConversion != null ? value * siConversion : value;
	return x + PRECISION > v && v > x - PRECISION;
}

/** `ifcopenshell.util.shape_builder.round_to_precision` -- Python's builtin `round(x *
 * siConversion, 5)`, see `pythonRoundToDigits`'s own comment for the round-half-to-even
 * rule this reproduces. */
export function roundToPrecision(x: number, siConversion: number): number {
	return pythonRoundToDigits(x * siConversion, 5) / siConversion;
}

/** `ifcopenshell.util.shape_builder.np_round_to_precision` -- the vector form of
 * `roundToPrecision`, elementwise. */
export function npRoundToPrecision(v: VectorType, siConversion: number): number[] {
	return v.map((x) => pythonRoundToDigits(x * siConversion, 5) / siConversion);
}

/** `ifcopenshell.util.shape_builder.np_normalized`. */
export function npNormalized(v: VectorType): number[] {
	const n = vecLength(v);
	return v.map((x) => x / n);
}

/** `ifcopenshell.util.shape_builder.np_matrix_normalized` -- normalizes columns 0/1/2 of a
 * `MatrixType` in place (returning a new matrix), leaving the translation column (and the
 * homogeneous row) untouched, matching Python's own "ensure translation is not affected"
 * comment. Ported for `MatrixType` (4x4) only -- unlike Python's dual 3x3-or-4x4 support,
 * this port's `MatrixType` is always a 4x4 `mat4` (the established convention since
 * `util/placement.ts`), and nothing in this codebase ever constructs a bare 3x3 "matrix"
 * value of the kind Python's alternate branch supports; a disclosed, narrow simplification.
 */
export function npMatrixNormalized(matrix: MatrixType): MatrixType {
	const out = mat4.clone(matrix);
	for (const base of [0, 4, 8] as const) {
		const n = Math.sqrt(out[base] * out[base] + out[base + 1] * out[base + 1] + out[base + 2] * out[base + 2]);
		out[base] /= n;
		out[base + 1] /= n;
		out[base + 2] /= n;
	}
	return out;
}

/** `ifcopenshell.util.shape_builder.np_lerp`. */
export function npLerp(a: VectorType, b: VectorType, t: number): number[] {
	return a.map((v, i) => v + (b[i] - v) * t);
}

/** `ifcopenshell.util.shape_builder.np_to_3d` -- converts a 2D/4D vector to 3D. */
export function npTo3d(v: VectorType, z = 0.0): number[] {
	const l = v.length;
	if (l === 2) return [v[0], v[1], z];
	if (l === 4) return [v[0], v[1], v[2]];
	throw new Error(`Unexpected vector length: ${l} (${JSON.stringify(v)}).`);
}

/** `ifcopenshell.util.shape_builder.np_to_4d` -- converts a 2D/3D vector to 4D. */
export function npTo4d(v: VectorType, z = 0.0, w = 1.0): number[] {
	const l = v.length;
	if (l === 2) return [v[0], v[1], z, w];
	if (l === 3) return [v[0], v[1], v[2], w];
	throw new Error(`Unexpected vector length: ${l} (${JSON.stringify(v)}).`);
}

/** `ifcopenshell.util.shape_builder.np_to_4x4` -- converts a row-major 3x3 matrix to a 4x4
 * `MatrixType`, per `mat3RowMajorToMat4`'s own doc comment. */
export function npTo4x4(matrix3x3: readonly (readonly number[])[]): MatrixType {
	return mat3RowMajorToMat4(matrix3x3);
}

/**
 * Applies a 4x4 affine transform to each of a sequence of 3D points
 * (`ifcopenshell.util.shape_builder.np_apply_matrix`).
 *
 * `vectors @ m3x3.T + translation` is algebraically identical to applying the full affine
 * matrix to each point (`(M @ v)[i] = sum_j M[i,j]*v[j] = sum_j v[j]*M.T[j,i] = (v @
 * M.T)[i]`) -- i.e. exactly `gl-matrix`'s `vec3.transformMat4` convention, already verified
 * against this same numpy expression shape by `util/geolocation.ts`'s header comment
 * (`auto_xyz2enh`'s `(np.linalg.inv(wcs) @ np.array((x,y,z,1)))[:3]` finding).
 */
export function npApplyMatrix(vectors: SequenceOfVectors, matrix: MatrixType): number[][] {
	return vectors.map((v) => {
		const out = vec3.create();
		vec3.transformMat4(out, [v[0], v[1], v[2]], matrix);
		return [out[0], out[1], out[2]];
	});
}

/** Angle between two vectors, in radians (`ifcopenshell.util.shape_builder.np_angle`). */
export function npAngle(a: VectorType, b: VectorType): number {
	return Math.acos(dot(a, b) / (vecLength(a) * vecLength(b)));
}

/** Signed angle between two 2D vectors, in radians, clockwise positive
 * (`ifcopenshell.util.shape_builder.np_angle_signed`). */
export function npAngleSigned(a: VectorType, b: VectorType): number {
	if (a.length !== 2 || b.length !== 2) {
		throw new Error("npAngleSigned: only 2D vectors are supported.");
	}
	const det = a[1] * b[0] - a[0] * b[1];
	return Math.atan2(det, dot(a, b));
}

/** `ifcopenshell.util.shape_builder.np_translation_matrix`. */
export function npTranslationMatrix(vector: VectorType): MatrixType {
	const out = mat4.create();
	mat4.fromTranslation(out, [vector[0], vector[1], vector[2]]);
	return out;
}

/**
 * Get a rotation matrix (`ifcopenshell.util.shape_builder.np_rotation_matrix`).
 *
 * @param angle Rotation angle, in radians.
 * @param size Matrix size (2, 3, or 4).
 * @param axis Rotation axis: required for size 3/4, either a principal-axis literal or an
 *   arbitrary vector (Rodrigues' rotation formula). Ignored (must be omitted) for size 2.
 */
export function npRotationMatrix(angle: number, size: 2): number[][];
export function npRotationMatrix(angle: number, size: 3, axis: RotationAxis | VectorType): number[][];
export function npRotationMatrix(angle: number, size: 4, axis: RotationAxis | VectorType): MatrixType;
export function npRotationMatrix(
	angle: number,
	size: 2 | 3 | 4,
	axis?: RotationAxis | VectorType,
): number[][] | MatrixType {
	if (size < 2 || size > 4) {
		throw new Error(`Size must be [2;4], got ${size}.`);
	}
	const cosTheta = Math.cos(angle);
	const sinTheta = Math.sin(angle);
	if (size === 2) {
		return [
			[cosTheta, -sinTheta],
			[sinTheta, cosTheta],
		];
	}
	if (axis === undefined) {
		throw new Error("For non-2D matrices 'axis' argument is not optional.");
	}
	let matrix: number[][];
	if (typeof axis === "string") {
		if (axis === "X") {
			matrix = [
				[1, 0, 0],
				[0, cosTheta, -sinTheta],
				[0, sinTheta, cosTheta],
			];
		} else if (axis === "Y") {
			matrix = [
				[cosTheta, 0, sinTheta],
				[0, 1, 0],
				[-sinTheta, 0, cosTheta],
			];
		} else if (axis === "Z") {
			matrix = [
				[cosTheta, -sinTheta, 0],
				[sinTheta, cosTheta, 0],
				[0, 0, 1],
			];
		} else {
			throw new Error(`npRotationMatrix: unsupported axis literal ${JSON.stringify(axis)}`);
		}
	} else {
		// Rodrigues' rotation formula -- verified against a known cyclic-permutation
		// case, see this file's header comment.
		const n = npNormalized(axis);
		const [ax, ay, az] = n;
		const K = [
			[0, -az, ay],
			[az, 0, -ax],
			[-ay, ax, 0],
		];
		matrix = [
			[0, 0, 0],
			[0, 0, 0],
			[0, 0, 0],
		];
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				const identityIj = i === j ? 1 : 0;
				matrix[i][j] = cosTheta * identityIj + (1 - cosTheta) * n[i] * n[j] + sinTheta * K[i][j];
			}
		}
	}
	if (size === 4) return mat3RowMajorToMat4(matrix);
	return matrix;
}

/**
 * Convert a rotation matrix to XYZ Euler angles, in radians
 * (`ifcopenshell.util.shape_builder.np_matrix_to_euler`).
 *
 * Assumes `matrix = Rz(z) @ Ry(y) @ Rx(x)` -- empirically verified (not assumed from the
 * Python docstring's "similar to mathutils" claim), see this file's header comment.
 */
export function npMatrixToEuler(matrix: MatrixType): readonly [number, number, number] {
	const m = npMatrixNormalized(matrix);
	const y = -Math.asin(m[2]);
	const cosY = Math.cos(y);
	const x = Math.atan2(m[6] / cosY, m[10] / cosY);
	const z = Math.atan2(m[1] / cosY, m[0] / cosY);
	return [x, y, z];
}

/** Normal of a 3D polygon defined by exactly 3 points
 * (`ifcopenshell.util.shape_builder.np_normal`). */
export function npNormal(vectors: SequenceOfVectors): number[] {
	if (vectors.length !== 3) {
		throw new Error("npNormal: 3 vectors required");
	}
	const [v0, v1, v2] = vectors;
	const normal = cross3(sub(v1, v0), sub(v2, v0));
	const n = vecLength(normal);
	return normal.map((x) => x / n);
}

/**
 * Get the 2 closest points on 2 lines (`ifcopenshell.util.shape_builder.np_intersect_line_line`).
 * First line: `(v1, v2)`. Second line: `(v3, v4)`.
 */
export function npIntersectLineLine(
	v1: VectorType,
	v2: VectorType,
	v3: VectorType,
	v4: VectorType,
): readonly [number[], number[]] {
	const d1 = sub(v2, v1);
	const d2 = sub(v4, v3);
	const crossD1D2 = cross3(d1, d2);
	const crossNorm = vecLength(crossD1D2);
	if (isX(crossNorm, 0)) {
		throw new Error("Lines are parallel and do not intersect uniquely.");
	}
	const r = sub(v3, v1);
	const t = dot(cross3(r, d2), crossD1D2) / crossNorm ** 2;
	const u = dot(cross3(r, d1), crossD1D2) / crossNorm ** 2;
	const pointOnLine1 = add(
		v1,
		d1.map((x) => x * t),
	);
	const pointOnLine2 = add(
		v3,
		d2.map((x) => x * u),
	);
	return [pointOnLine1, pointOnLine2];
}

/** Intersect a line defined by 2 points with a horizontal line at `y`
 * (`ifcopenshell.util.shape_builder.intersect_x_axis_2d`). */
export function intersectXAxis2d(p1: VectorType, p2: VectorType, y = 0): number | undefined {
	const [x1, y1] = p1;
	const [x2, y2] = p2;
	if (isX(y1, y2)) return undefined;
	const t = (y - y1) / (y2 - y1);
	return x1 + t * (x2 - x1);
}

/** Total signed angle (radians) from `aStart` to `aEnd` going through `aMid`
 * (`ifcopenshell.util.shape_builder._signed_sweep_through_mid`, private/unexported to
 * match Python's leading-underscore convention). JS's `%` can return a negative result for
 * a negative dividend (unlike Python's `%`, always same-sign-as-divisor for a positive
 * divisor) -- normalized to `[0, twoPi)` explicitly below. */
function signedSweepThroughMid(aStart: number, aMid: number, aEnd: number): number {
	const twoPi = 2 * Math.PI;
	const normMod = (x: number) => ((x % twoPi) + twoPi) % twoPi;
	const ccwTotal = normMod(aEnd - aStart);
	const ccwToMid = normMod(aMid - aStart);
	if (ccwToMid <= ccwTotal) return ccwTotal;
	return -normMod(aStart - aEnd);
}

/**
 * Approximate a circular arc through (start, mid, end) with chord points
 * (`ifcopenshell.util.shape_builder.arc_to_polyline_points`).
 *
 * @param subdivisions Sample `subdivisions + 1` points inclusive of the endpoints.
 * @throws if `subdivisions < 1`, or if 3D inputs have mismatched Z coordinates.
 */
export function arcToPolylinePoints(
	start: VectorType,
	mid: VectorType,
	end: VectorType,
	subdivisions = 16,
): number[][] {
	if (subdivisions < 1) {
		throw new Error(`subdivisions must be >= 1, got ${subdivisions}`);
	}
	if (start.length >= 3) {
		const zTol = 1e-9;
		if (!(isCloseAbsTol(start[2], mid[2], zTol) && isCloseAbsTol(start[2], end[2], zTol))) {
			throw new Error(
				`arcToPolylinePoints only handles arcs in the XY plane; got mismatched Z coordinates (${start[2]}, ${mid[2]}, ${end[2]}).`,
			);
		}
	}
	const [sx, sy] = start;
	const [mx, my] = mid;
	const [ex, ey] = end;
	const d = 2 * (sx * (my - ey) + mx * (ey - sy) + ex * (sy - my));
	if (Math.abs(d) < 1e-12) {
		return [[...start], [...end]];
	}
	const cx = ((sx ** 2 + sy ** 2) * (my - ey) + (mx ** 2 + my ** 2) * (ey - sy) + (ex ** 2 + ey ** 2) * (sy - my)) / d;
	const cy = ((sx ** 2 + sy ** 2) * (ex - mx) + (mx ** 2 + my ** 2) * (sx - ex) + (ex ** 2 + ey ** 2) * (mx - sx)) / d;
	const aStart = Math.atan2(sy - cy, sx - cx);
	const aMid = Math.atan2(my - cy, mx - cx);
	const aEnd = Math.atan2(ey - cy, ex - cx);
	const sweep = signedSweepThroughMid(aStart, aMid, aEnd);
	const radius = Math.hypot(sx - cx, sy - cy);
	const pts: number[][] = [];
	for (let i = 0; i <= subdivisions; i++) {
		const t = i / subdivisions;
		const angle = aStart + sweep * t;
		const x = cx + radius * Math.cos(angle);
		const y = cy + radius * Math.sin(angle);
		pts.push(start.length === 2 ? [x, y] : [x, y, start[2]]);
	}
	return pts;
}

/**
 * Convert an `IfcPolygonalFaceSet`/`IfcTriangulatedFaceSet` into an `IfcFacetedBrep`
 * (`ifcopenshell.util.shape_builder.polygonal_face_set_to_faceted_brep`).
 *
 * @throws TypeError if `faceSet` is not an `IfcPolygonalFaceSet`/`IfcTriangulatedFaceSet`.
 * @throws Error if `faceSet.Coordinates` is missing or a face references an out-of-range vertex.
 */
export function polygonalFaceSetToFacetedBrep(faceSet: EntityInstance): EntityInstance {
	if (!(faceSet.isA("IfcPolygonalFaceSet") || faceSet.isA("IfcTriangulatedFaceSet"))) {
		throw new TypeError(
			`polygonalFaceSetToFacetedBrep expected IfcPolygonalFaceSet or IfcTriangulatedFaceSet, got ${faceSet.isA()}.`,
		);
	}
	const coordinates = faceSet.get("Coordinates") as EntityInstance | null;
	if (coordinates === null) {
		throw new Error(`${faceSet.isA()} #${faceSet.id()} has no Coordinates point list.`);
	}
	const ifcFile = faceSet.file as IfcFile;
	const coords = coordinates.get("CoordList") as number[][];
	const vertexCount = coords.length;
	const ifcPoints = coords.map((c) => ifcFile.createEntity("IfcCartesianPoint", [...c]));

	const resolve = (indices: readonly number[]): EntityInstance[] => {
		const out: EntityInstance[] = [];
		for (const index of indices) {
			if (!(index >= 1 && index <= vertexCount)) {
				throw new Error(
					`${faceSet.isA()} #${faceSet.id()} face references vertex ${index}, outside CoordList range 1..${vertexCount}.`,
				);
			}
			out.push(ifcPoints[index - 1]);
		}
		return out;
	};

	const ifcFaces: EntityInstance[] = [];
	if (faceSet.isA("IfcTriangulatedFaceSet")) {
		for (const triangle of faceSet.get("CoordIndex") as number[][]) {
			const loop = ifcFile.createEntity("IfcPolyLoop", resolve(triangle));
			ifcFaces.push(ifcFile.createEntity("IfcFace", [ifcFile.createEntity("IfcFaceOuterBound", loop, true)]));
		}
	} else {
		for (const indexedFace of faceSet.get("Faces") as EntityInstance[]) {
			const outerLoop = ifcFile.createEntity("IfcPolyLoop", resolve(indexedFace.get("CoordIndex") as number[]));
			const bounds: EntityInstance[] = [ifcFile.createEntity("IfcFaceOuterBound", outerLoop, true)];
			if (indexedFace.isA("IfcIndexedPolygonalFaceWithVoids")) {
				const inner = (indexedFace.get("InnerCoordIndices") as number[][] | null) ?? [];
				for (const innerIndices of inner) {
					bounds.push(
						ifcFile.createEntity("IfcFaceBound", ifcFile.createEntity("IfcPolyLoop", resolve(innerIndices)), true),
					);
				}
			}
			ifcFaces.push(ifcFile.createEntity("IfcFace", bounds));
		}
	}

	return ifcFile.createEntity("IfcFacetedBrep", ifcFile.createEntity("IfcClosedShell", ifcFaces));
}

// Note: using ShapeBuilder try not to reuse IFC elements in the process otherwise you might
// run into a situation where builder.mirror or other operation is applied twice during one
// run to the same element which might produce undesirable results.

/**
 * Near-verbatim port of `ifcopenshell.util.shape_builder.ShapeBuilder`. See this file's
 * header comment for the two real, pre-existing, disclosed primitive-layer gaps that
 * genuinely block several of these methods today (`.get("Dim")`, defined-type-instance
 * creation with an initial value) and the real Python-source quirks preserved verbatim.
 */
export class ShapeBuilder {
	constructor(public readonly file: IfcFile) {}

	/**
	 * Generate an IfcIndexedPolyCurve based on the provided points (`polyline`).
	 *
	 * @param points List of 2D or 3D points.
	 * @param closed Whether the polyline should be closed.
	 * @param positionOffset Offset applied to all points.
	 * @param arcPoints Indices of the middle points for arcs.
	 * @throws (Non-IFC2X3 only) When `closed` or `arcPoints` is non-empty -- see this
	 *   file's header comment (finding 2): `IfcLineIndex`/`IfcArcIndex` creation is
	 *   currently blocked by a pre-existing primitive-layer gap. The straight-line
	 *   (`closed=false`, no `arcPoints`) path is fully functional on every schema.
	 */
	polyline(
		points: SequenceOfVectors,
		closed = false,
		positionOffset: VectorType | null = null,
		arcPoints: readonly number[] = [],
	): EntityInstance {
		if (arcPoints.length > 0 && this.file.schema === "IFC2X3") {
			throw new Error("Arcs are not supported for IFC2X3.");
		}

		let pts: number[][] = points.map((p) => [...p]);
		if (positionOffset !== null) {
			pts = pts.map((p) => add(p, positionOffset));
		}

		if (this.file.schema === "IFC2X3") {
			const ifcPoints = pts.map((p) => this.file.createEntity("IfcCartesianPoint", p));
			if (closed) ifcPoints.push(ifcPoints[0]);
			return this.file.createEntity("IfcPolyline", ifcPoints);
		}

		const dimensions = pts[0].length;
		let ifcPoints: EntityInstance;
		if (dimensions === 2) {
			ifcPoints = this.file.createEntity("IfcCartesianPointList2D", pts);
		} else if (dimensions === 3) {
			ifcPoints = this.file.createEntity("IfcCartesianPointList3D", pts);
		} else {
			throw new Error(`Point has unexpected number of dimensions - ${dimensions}.`);
		}

		if (!closed && arcPoints.length === 0) {
			return this.file.createEntity("IfcIndexedPolyCurve", ifcPoints);
		}

		// If the curve is closed or has arc points, we do need to build segments.
		const segments: number[][] = [];
		let curI = 0;
		let closedByArc = false;
		while (curI < pts.length - 1) {
			const curIIfc = curI + 1;
			if (arcPoints.includes(curI + 1)) {
				if (curIIfc + 1 < pts.length) {
					segments.push([curIIfc, curIIfc + 1, curIIfc + 2]);
				} else {
					segments.push([curIIfc, curIIfc + 1, 1]);
					closedByArc = true;
				}
				curI += 2;
			} else {
				segments.push([curIIfc, curIIfc + 1]);
				curI += 1;
			}
		}

		if (closed && !closedByArc) {
			segments.push([pts.length, 1]);
		}

		const ifcSegments: EntityInstance[] = [];
		// Because IfcLineIndex supports 2+ points, neighbor line segments are merged
		// into one.
		let currentLineSegment: number[] = [];
		const lastSegment = segments.length - 1;
		segments.forEach((segment, segI) => {
			if (segment.length === 2) {
				currentLineSegment = currentLineSegment.length === 0 ? [...segment] : [...currentLineSegment, segment[1]];
			}
			if (currentLineSegment.length && (segment.length === 3 || segI === lastSegment)) {
				// See this file's header comment (finding 2): throws today.
				ifcSegments.push(this.file.createEntity("IfcLineIndex", currentLineSegment));
				currentLineSegment = [];
			}
			if (segment.length === 3) {
				ifcSegments.push(this.file.createEntity("IfcArcIndex", segment));
			}
		});

		// NOTE: IfcIndexedPolyCurve supports only consecutive segments.
		return this.file.createEntity("IfcIndexedPolyCurve", ifcPoints, ifcSegments);
	}

	/**
	 * Get rectangle coords arranged as:
	 * ```
	 * 3 2
	 * 0 1
	 * ```
	 * (`ShapeBuilder.get_rectangle_coords`, a `@staticmethod` in Python.)
	 *
	 * @param size Rectangle size, 2D or 3D (use 0 for one 3D dimension for a 2D rectangle
	 *   embedded in 3D space).
	 * @param position Rectangle position, defaulting to the zero vector.
	 */
	static getRectangleCoords(size: VectorType = [1.0, 1.0], position: VectorType | null = null): number[][] {
		const dimensions = size.length;
		const points: number[][] = [0, 1, 2, 3].map(() => (position ? [...position] : new Array(dimensions).fill(0)));

		const nonEmptyCoords: number[] = [];
		for (let i = 0; i < size.length; i++) {
			if (size[i] !== 0) nonEmptyCoords.push(i);
		}
		if (nonEmptyCoords.length < 2) {
			// Python's `non_empty_coords[1]` would raise an IndexError here (numpy
			// `np.nonzero` returning fewer than 2 indices) -- reproduced as an explicit,
			// descriptive throw rather than a silent `undefined`-driven `NaN`.
			throw new Error(`getRectangleCoords: size must have at least 2 non-zero components, got ${JSON.stringify(size)}`);
		}
		const [a, b] = nonEmptyCoords;
		points[1][a] += size[a];
		for (let i = 0; i < dimensions; i++) points[2][i] += size[i];
		points[3][b] += size[b];
		return points;
	}

	/**
	 * Generate a rectangle polyline (`rectangle`). See `getRectangleCoords`. See this
	 * file's header comment (finding 2): currently throws on non-IFC2X3 schemas (`closed`
	 * is always `true`, needing the blocked `IfcLineIndex` creation).
	 */
	rectangle(size: VectorType = [1.0, 1.0], position: VectorType | null = null): EntityInstance {
		return this.polyline(ShapeBuilder.getRectangleCoords(size, position), true);
	}

	/** Create an `IfcCircle` (`circle`). */
	circle(center: VectorType = [0.0, 0.0], radius = 1.0): EntityInstance {
		const ifcCenter = this.createAxis2Placement2d(center);
		return this.file.createEntity("IfcCircle", ifcCenter, radius);
	}

	/** Create an `IfcPlane` (`plane`). */
	plane(location: VectorType = [0.0, 0.0, 0.0], normal: VectorType = [0.0, 0.0, 1.0]): EntityInstance {
		const roundedNormal = normal.map((x) => Math.round(x * 100) / 100);
		const arbitraryVector: VectorType = allClose(roundedNormal, [0.0, 0.0, 1.0]) ? [0.0, 1.0, 0.0] : [0.0, 0.0, 1.0];
		const xAxis = npNormalized(cross3(normal, arbitraryVector));
		const axisPlacement = this.createAxis2Placement3d(location, normal, xAxis);
		return this.file.createEntity("IfcPlane", axisPlacement);
	}

	/**
	 * Simple circle-based curve between two points (`curve_between_two_points`). Good for
	 * fillets, not continuous ellipse shapes. See this file's header comment (finding 2):
	 * currently always throws (always creates one `IfcArcIndex`).
	 */
	curveBetweenTwoPoints(points: readonly [VectorType, VectorType]): EntityInstance {
		const diff = sub(points[1], points[0]);
		let maxDiffI = 0;
		let maxAbs = Number.NEGATIVE_INFINITY;
		diff.forEach((d, i) => {
			if (Math.abs(d) > maxAbs) {
				maxAbs = Math.abs(d);
				maxDiffI = i;
			}
		});
		const diffSign = diff.map(() => 0);
		diffSign[maxDiffI] = Math.sign(diff[maxDiffI]);
		// Python literal `(0.01, 0.01) * diff_sign` is hardcoded to 2 components; ported
		// as `diffSign.map(...)` so it generalizes to `diffSign`'s own length (only ever
		// 2 in practice, matching this method's 2D-only real usage -- see its own
		// `IfcCartesianPointList2D` call below).
		const scaledDiff = diffSign.map((s) => s * 0.01);
		const middlePoint = add(points[0], scaledDiff);
		const pts = [points[0], middlePoint, points[1]].map((p) => ifcSafeVectorType(p));
		const seg = this.file.createEntity("IfcArcIndex", [1, 2, 3]);
		const ifcPoints = this.file.createEntity("IfcCartesianPointList2D", pts);
		return this.file.createEntity("IfcIndexedPolyCurve", ifcPoints, [seg]);
	}

	/**
	 * Get cardinal-point coordinates of an ellipse by index mask (`get_trim_points_from_mask`).
	 *
	 * The four cardinal points are numbered 0-3 counter-clockwise starting from +X:
	 * 0 -> `(x, 0)`, 1 -> `(0, y)`, 2 -> `(-x, 0)`, 3 -> `(0, -y)`.
	 */
	getTrimPointsFromMask(
		xAxisRadius: number,
		yAxisRadius: number,
		trimPointsMask: readonly number[],
		positionOffset: VectorType | null = null,
	): number[][] {
		const points: number[][] = [
			[xAxisRadius, 0],
			[0, yAxisRadius],
			[-xAxisRadius, 0],
			[0, -yAxisRadius],
		];
		const trimPoints = trimPointsMask.map((i) => points[i]);
		if (positionOffset === null) return trimPoints;
		return trimPoints.map((p) => add(p, positionOffset));
	}

	/**
	 * Create an `IfcEllipse`, optionally trimmed to an arc (`create_ellipse_curve`).
	 *
	 * If neither `trimPoints` nor `trimPointsMask` is provided, a full `IfcEllipse` is
	 * returned. Trimming points must be given in counter-clockwise order.
	 */
	createEllipseCurve(
		xAxisRadius: number,
		yAxisRadius: number,
		position: VectorType = [0.0, 0.0],
		trimPoints: SequenceOfVectors = [],
		refXDirection: VectorType = [1.0, 0.0],
		trimPointsMask: readonly number[] = [],
	): EntityInstance {
		const ifcPosition = this.createAxis2Placement2d(position, refXDirection);
		const ifcEllipse = this.file.createEntity("IfcEllipse", ifcPosition, xAxisRadius, yAxisRadius);

		let points = trimPoints;
		if (points.length === 0) {
			if (trimPointsMask.length === 0) return ifcEllipse;
			points = this.getTrimPointsFromMask(xAxisRadius, yAxisRadius, trimPointsMask, position);
		}

		const trim1 = [this.file.createEntity("IfcCartesianPoint", ifcSafeVectorType(points[0]))];
		const trim2 = [this.file.createEntity("IfcCartesianPoint", ifcSafeVectorType(points[1]))];

		return this.file.createEntity("IfcTrimmedCurve", ifcEllipse, trim1, trim2, true, "CARTESIAN");
	}

	/**
	 * Create a profile (`profile`). See this file's header comment (finding 1 -- throws
	 * unconditionally today) and the preserved Python-source quirk (finding 2): the
	 * `innerCurves` `Dim` validation only runs when a single (non-array) curve is passed.
	 *
	 * @returns IfcArbitraryClosedProfileDef or IfcArbitraryProfileDefWithVoids.
	 */
	profile(
		outerCurve: EntityInstance,
		name: string | null = null,
		innerCurves: readonly EntityInstance[] | EntityInstance = [],
		profileType = "AREA",
	): EntityInstance {
		if ((outerCurve.get("Dim") as number) !== 2) {
			throw new Error(
				`Outer curve for IfcArbitraryClosedProfileDef/IfcIfcArbitraryProfileDefWithVoid should be 2D to be valid, currently it has ${outerCurve.get("Dim")} dimensions.\nRef: https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcArbitraryClosedProfileDef.htm#8.15.3.1.4-Formal-propositions`,
			);
		}

		const isArrayInnerCurves = Array.isArray(innerCurves);
		const innerCurvesTruthy = isArrayInnerCurves
			? (innerCurves as readonly EntityInstance[]).length > 0
			: innerCurves != null;
		if (innerCurvesTruthy) {
			let curves: readonly EntityInstance[];
			if (isArrayInnerCurves) {
				curves = innerCurves as readonly EntityInstance[];
			} else {
				// See this file's header comment (quirk 1): the Dim check below only
				// runs in this branch, reachable only when a caller passes a single
				// curve instead of an array.
				const single = innerCurves as EntityInstance;
				curves = [single];
				if (curves.some((curve) => (curve.get("Dim") as number) !== 2)) {
					throw new Error(
						"WARNING. InnerCurve for IfcIfcArbitraryProfileDefWithVoid sould be 2D to be valid, " +
							"currently on one of the inner curves is using different amount of dimensions.\n" +
							"Ref: https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcArbitraryClosedProfileDef.htm#8.15.3.1.4-Formal-propositions",
					);
				}
			}
			return this.file.createEntity("IfcArbitraryProfileDefWithVoids", profileType, name, outerCurve, curves);
		}
		return this.file.createEntity("IfcArbitraryClosedProfileDef", profileType, name, outerCurve);
	}

	/**
	 * Translate a curve/representation item/representation (`translate`).
	 *
	 * @param curveOrItem A single item or a sequence of them.
	 * @param createCopy Whether to translate the provided item or a copy of it.
	 */
	translate(
		curveOrItem: EntityInstance | readonly EntityInstance[],
		translation: VectorType,
		createCopy = false,
	): EntityInstance | EntityInstance[] {
		const multipleObjects = Array.isArray(curveOrItem);
		const items: readonly EntityInstance[] = multipleObjects
			? (curveOrItem as readonly EntityInstance[])
			: [curveOrItem as EntityInstance];

		const processedObjects: EntityInstance[] = [];
		for (let c of items) {
			if (createCopy) c = copyDeep(this.file, c);

			const isA = c.isA();
			if (isA === "IfcIndexedPolyCurve" || isA === "IfcPolyline") {
				const coords = this.getPolylineCoords(c).map((co) => add(co, translation));
				this.setPolylineCoords(c, coords);
			} else if (isA === "IfcCircle" || isA === "IfcExtrudedAreaSolid" || isA === "IfcEllipse") {
				const location = (c.get("Position") as EntityInstance).get("Location") as EntityInstance;
				const basePosition = location.get("Coordinates") as number[];
				location.set("Coordinates", ifcSafeVectorType(add(basePosition, translation)));
			} else if (isA === "IfcTessellatedFaceSet") {
				const coordinates = c.get("Coordinates") as EntityInstance;
				const coordList = coordinates.get("CoordList") as number[][];
				coordinates.set("CoordList", ifcSafeVectorType(coordList.map((p) => add(p, translation))));
			} else if (isA === "IfcShapeRepresentation") {
				for (const item of c.get("Items") as EntityInstance[]) {
					this.translate(item, translation);
				}
			} else if (isA === "IfcTrimmedCurve") {
				const trim1 = (c.get("Trim1") as EntityInstance[])[0];
				const trim2 = (c.get("Trim2") as EntityInstance[])[0];
				trim1.set("Coordinates", ifcSafeVectorType(add(trim1.get("Coordinates") as number[], translation)));
				trim2.set("Coordinates", ifcSafeVectorType(add(trim2.get("Coordinates") as number[], translation)));
				this.translate(c.get("BasisCurve") as EntityInstance, translation);
			} else {
				throw new Error(`${isA} is not supported for translate() method.`);
			}

			processedObjects.push(c);
		}

		return multipleObjects ? processedObjects : processedObjects[0];
	}

	/**
	 * Rotate a single 2D point around a pivot (`rotate_2d_point`).
	 *
	 * @param angle Rotation angle, in degrees. Defaults to 90.
	 * @param counterClockwise If true, rotate counter-clockwise. Defaults to clockwise.
	 */
	rotate2dPoint(
		point2d: VectorType,
		angle = 90.0,
		pivotPoint: VectorType = [0.0, 0.0],
		counterClockwise = false,
	): number[] {
		const angleRad = ((angle * Math.PI) / 180) * (counterClockwise ? 1 : -1);
		const relative = sub(point2d, pivotPoint);
		const rotated = matVecMul(npRotationMatrix(angleRad, 2), relative);
		return add(rotated, pivotPoint);
	}

	/**
	 * Rotate a curve/representation item/representation (`rotate`).
	 *
	 * @param angle Rotation angle, in degrees.
	 */
	rotate(
		curveOrItem: EntityInstance | readonly EntityInstance[],
		angle = 90.0,
		pivotPoint: VectorType = [0.0, 0.0],
		counterClockwise = false,
		createCopy = false,
	): EntityInstance | EntityInstance[] {
		const multipleObjects = Array.isArray(curveOrItem);
		const items: readonly EntityInstance[] = multipleObjects
			? (curveOrItem as readonly EntityInstance[])
			: [curveOrItem as EntityInstance];

		const processedObjects: EntityInstance[] = [];
		for (let c of items) {
			if (createCopy) c = copyDeep(this.file, c);

			const isA = c.isA();
			if (isA === "IfcIndexedPolyCurve" || isA === "IfcPolyline") {
				const originalCoords = this.getPolylineCoords(c);
				const coords = originalCoords.map((co) => this.rotate2dPoint(co, angle, pivotPoint, counterClockwise));
				this.setPolylineCoords(c, coords);
			} else if (isA === "IfcCircle") {
				const location = (c.get("Position") as EntityInstance).get("Location") as EntityInstance;
				const basePosition = location.get("Coordinates") as number[];
				const newPosition = this.rotate2dPoint(basePosition, angle, pivotPoint, counterClockwise);
				location.set("Coordinates", ifcSafeVectorType(newPosition));
			} else if (isA === "IfcExtrudedAreaSolid") {
				// TODO (matches Python): add support for Z-axis too.
				const location = (c.get("Position") as EntityInstance).get("Location") as EntityInstance;
				const basePosition = location.get("Coordinates") as number[];
				const rotated2d = this.rotate2dPoint([basePosition[0], basePosition[1]], angle, pivotPoint, counterClockwise);
				const newPosition = npTo3d(rotated2d, basePosition[2]);
				location.set("Coordinates", ifcSafeVectorType(newPosition));

				const sweptArea = c.get("SweptArea") as EntityInstance;
				this.rotate(sweptArea.get("OuterCurve") as EntityInstance, angle, pivotPoint, counterClockwise);
			} else {
				throw new Error(`${isA} is not supported for rotate() method.`);
			}

			processedObjects.push(c);
		}

		return multipleObjects ? processedObjects : processedObjects[0];
	}

	/**
	 * Mirror a single 2D point across the specified axes (`mirror_2d_point`).
	 *
	 * @param mirrorAxes A positive value in a component mirrors that axis. `(1, 0)`
	 *   mirrors across the Y axis (negates X only); `(1, 1)` mirrors both.
	 * @throws if `point2d`/`mirrorAxes`/`mirrorPoint` have mismatched lengths -- see this
	 *   file's header comment for why this is a deliberate, disclosed robustness addition.
	 */
	mirror2dPoint(
		point2d: VectorType,
		mirrorAxes: VectorType = [1.0, 1.0],
		mirrorPoint: VectorType = [0.0, 0.0],
	): number[] {
		if (point2d.length !== mirrorAxes.length || point2d.length !== mirrorPoint.length) {
			throw new Error(
				`mirror2dPoint: point2d (len ${point2d.length}), mirrorAxes (len ${mirrorAxes.length}), and mirrorPoint (len ${mirrorPoint.length}) must all have matching length.`,
			);
		}
		const signs = mirrorAxes.map((v) => (v > 0 ? -1 : 1));
		const relative = sub(point2d, mirrorPoint).map((v, i) => v * signs[i]);
		return add(relative, mirrorPoint);
	}

	/** Create an `IfcAxis2Placement3D` (`create_axis2_placement_3d`). */
	createAxis2Placement3d(
		position: VectorType = [0.0, 0.0, 0.0],
		zAxis: VectorType = [0.0, 0.0, 1.0],
		xAxis: VectorType = [1.0, 0.0, 0.0],
	): EntityInstance {
		return this.file.createEntity(
			"IfcAxis2Placement3D",
			this.file.createEntity("IfcCartesianPoint", ifcSafeVectorType(position)),
			this.file.createEntity("IfcDirection", ifcSafeVectorType(zAxis)),
			this.file.createEntity("IfcDirection", ifcSafeVectorType(xAxis)),
		);
	}

	/** Create an `IfcAxis2Placement3D` from a 4x4 matrix (`create_axis2_placement_3d_from_matrix`). */
	createAxis2Placement3dFromMatrix(matrix: MatrixType | null = null): EntityInstance {
		const m = matrix ?? mat4.create();
		return this.createAxis2Placement3d([m[12], m[13], m[14]], [m[8], m[9], m[10]], [m[0], m[1], m[2]]);
	}

	/** Create an `IfcAxis2Placement2D` (`create_axis2_placement_2d`). */
	createAxis2Placement2d(position: VectorType = [0.0, 0.0], xDirection: VectorType | null = null): EntityInstance {
		const xDirectionTruthy = xDirection != null && xDirection.length > 0;
		const refDirection = xDirectionTruthy
			? this.file.createEntity("IfcDirection", ifcSafeVectorType(xDirection as VectorType))
			: null;
		return this.file.createEntity(
			"IfcAxis2Placement2D",
			this.file.createEntity("IfcCartesianPoint", ifcSafeVectorType(position)),
			refDirection,
		);
	}

	/** Create a topological vertex (`vertex`). */
	vertex(position: VectorType = [0.0, 0.0, 0.0]): EntityInstance {
		return this.file.createEntity(
			"IfcVertexPoint",
			this.file.createEntity("IfcCartesianPoint", ifcSafeVectorType(position)),
		);
	}

	/** Create a topological edge (`edge`). */
	edge(start: VectorType = [0.0, 0.0, 0.0], end: VectorType = [1.0, 0.0, 0.0]): EntityInstance {
		return this.file.createEntity("IfcEdge", this.vertex(start), this.vertex(end));
	}

	/** Create a single planar polyloop-defined face with an outer boundary (`face`). */
	face(points: SequenceOfVectors): EntityInstance {
		const verts = ifcSafeVectorType(points).map((p) => this.file.createEntity("IfcCartesianPoint", p));
		return this.file.createEntity("IfcFace", [
			this.file.createEntity("IfcFaceOuterBound", this.file.createEntity("IfcPolyLoop", verts), true),
		]);
	}

	/**
	 * Mirror a curve/representation item/representation (`mirror`).
	 *
	 * @param mirrorAxes A single mirror-axes vector, or a sequence of them (producing
	 *   multiple resulting curves per input item).
	 * @param placementMatrix Optional 3x3 (row-major) placement matrix for polylines.
	 */
	mirror(
		curveOrItem: EntityInstance | readonly EntityInstance[],
		mirrorAxes: VectorType | SequenceOfVectors = [1.0, 1.0],
		mirrorPoint: VectorType = [0.0, 0.0],
		createCopy = false,
		placementMatrix: readonly (readonly number[])[] | null = null,
	): EntityInstance | EntityInstance[] {
		const multipleObjects = Array.isArray(curveOrItem);
		const items: readonly EntityInstance[] = multipleObjects
			? (curveOrItem as readonly EntityInstance[])
			: [curveOrItem as EntityInstance];
		const multipleTransformations = typeof mirrorAxes[0] !== "number";
		const mirrorAxesData: readonly VectorType[] = multipleTransformations
			? (mirrorAxes as SequenceOfVectors)
			: [mirrorAxes as VectorType];

		const processedObjects: EntityInstance[] = [];
		for (const curveOrItemEl of items) {
			for (const axes of mirrorAxesData) {
				const c = createCopy ? copyDeep(this.file, curveOrItemEl) : curveOrItemEl;

				const isA = c.isA();
				if (isA === "IfcIndexedPolyCurve" || isA === "IfcPolyline") {
					const originalCoords = this.getPolylineCoords(c);
					const invertedPlacementMatrix = placementMatrix ? invert3x3(placementMatrix) : null;
					const coords: number[][] = [];
					for (const coBase0 of originalCoords) {
						let co: number[];
						if (placementMatrix) {
							const coBase = matVecMul(placementMatrix, npTo3d(coBase0));
							const mirrored = this.mirror2dPoint([coBase[0], coBase[1]], axes, mirrorPoint);
							const back3 = npTo3d(mirrored, coBase[2]);
							const backLocal = matVecMul(invertedPlacementMatrix as number[][], back3);
							co = [backLocal[0], backLocal[1]];
						} else {
							co = this.mirror2dPoint(coBase0, axes, mirrorPoint);
						}
						coords.push(co);
					}
					this.setPolylineCoords(c, coords);
				} else if (isA === "IfcCircle" || isA === "IfcEllipse") {
					const location = (c.get("Position") as EntityInstance).get("Location") as EntityInstance;
					const basePosition = location.get("Coordinates") as number[];
					const newPosition = this.mirror2dPoint(basePosition, axes, mirrorPoint);
					location.set("Coordinates", ifcSafeVectorType(newPosition));
				} else if (isA === "IfcExtrudedAreaSolid") {
					const position = c.get("Position") as EntityInstance;
					const placementMatrix3x3 = mat4LinearPartRowMajor(getAxis2placement(position));
					const location = position.get("Location") as EntityInstance;
					const basePosition = location.get("Coordinates") as number[];
					const newPosition2d = this.mirror2dPoint([basePosition[0], basePosition[1]], axes, mirrorPoint);
					const newPosition = npTo3d(newPosition2d, basePosition[2]);
					location.set("Coordinates", ifcSafeVectorType(newPosition));

					const sweptArea = c.get("SweptArea") as EntityInstance;
					const outerCurve = sweptArea.get("OuterCurve") as EntityInstance;
					this.translate(outerCurve, [basePosition[0], basePosition[1]]);
					this.mirror(outerCurve, axes, mirrorPoint, false, placementMatrix3x3);
					this.translate(outerCurve, [-newPosition[0], -newPosition[1]]);

					if (hasAttr(sweptArea, "InnerCurves")) {
						for (const innerCurve of sweptArea.get("InnerCurves") as EntityInstance[]) {
							this.translate(innerCurve, [basePosition[0], basePosition[1]]);
							this.mirror(innerCurve, axes, mirrorPoint, false, placementMatrix3x3);
							this.translate(innerCurve, [-newPosition[0], -newPosition[1]]);
						}
					}

					const extrudedDirection = c.get("ExtrudedDirection") as EntityInstance;
					const baseExtrudedDirection = extrudedDirection.get("DirectionRatios") as number[];
					const extrudedDirectionWorld = matVecMul(placementMatrix3x3, baseExtrudedDirection);
					const newDirection2d = this.mirror2dPoint(
						[extrudedDirectionWorld[0], extrudedDirectionWorld[1]],
						axes,
						[0.0, 0.0],
					);
					const newDirection3d = npTo3d(newDirection2d, extrudedDirectionWorld[2]);
					const newDirectionLocal = matVecMul(invert3x3(placementMatrix3x3), newDirection3d);
					extrudedDirection.set("DirectionRatios", ifcSafeVectorType(newDirectionLocal));
				} else if (isA === "IfcTrimmedCurve") {
					const trim1 = (c.get("Trim1") as EntityInstance[])[0];
					const trim2 = (c.get("Trim2") as EntityInstance[])[0];
					let trimCoords: number[][] = [trim1.get("Coordinates") as number[], trim2.get("Coordinates") as number[]].map(
						(basePosition) => this.mirror2dPoint(basePosition, axes, mirrorPoint),
					);
					if (axes.includes(0)) {
						trimCoords = [trimCoords[1], trimCoords[0]];
					}
					const safeCoords = ifcSafeVectorType(trimCoords);
					trim1.set("Coordinates", safeCoords[0]);
					trim2.set("Coordinates", safeCoords[1]);
					this.mirror(c.get("BasisCurve") as EntityInstance, axes, mirrorPoint);
				} else {
					throw new Error(`${isA} is not supported for mirror() method.`);
				}

				processedObjects.push(c);
			}
		}

		return multipleObjects || multipleTransformations ? processedObjects : processedObjects[0];
	}

	/** Create an `IfcSphere` (`sphere`). */
	sphere(radius = 1.0, center: VectorType = [0.0, 0.0, 0.0]): EntityInstance {
		return this.file.createEntity("IfcSphere", this.createAxis2Placement3d(center), radius);
	}

	/**
	 * Create an `IfcBlock` (`block`).
	 *
	 * @param position The bottom-left (min X/Y/Z) corner.
	 */
	block(position: VectorType = [0.0, 0.0, 0.0], xLength = 1.0, yLength = 1.0, zLength = 1.0): EntityInstance {
		return this.file.createEntity("IfcBlock", this.createAxis2Placement3d(position), xLength, yLength, zLength);
	}

	/**
	 * Create an `IfcHalfSpaceSolid` (`half_space_solid`).
	 *
	 * @param agreementFlag If false (default), the plane normal points toward the
	 *   *removed* material (the void).
	 */
	halfSpaceSolid(plane: EntityInstance, agreementFlag = false): EntityInstance {
		return this.file.createEntity("IfcHalfSpaceSolid", plane, agreementFlag);
	}

	/**
	 * Extrude a profile or curve to get an `IfcExtrudedAreaSolid` (`extrude`).
	 *
	 * REMEMBER: IFC uses a RIGHT-handed coordinate system.
	 *
	 * @throws if `magnitude` is 0, or (via `profile()`, when `profileOrCurve` is not
	 *   already an `IfcProfileDef`) per this file's header comment (finding 1).
	 */
	extrude(
		profileOrCurve: EntityInstance,
		magnitude = 1.0,
		position: VectorType = [0.0, 0.0, 0.0],
		extrusionVector: VectorType = [0.0, 0.0, 1.0],
		positionZAxis: VectorType = [0.0, 0.0, 1.0],
		positionXAxis: VectorType = [1.0, 0.0, 0.0],
		positionYAxis: VectorType | null = null,
	): EntityInstance {
		if (!magnitude) {
			throw new Error(
				"Extrusion magnitude must be greater than 0 to be valid.\n" +
					"Ref: https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcPositiveLengthMeasure.htm#8.11.2.71.3-Formal-representation",
			);
		}

		let profile = profileOrCurve;
		if (!profile.isA("IfcProfileDef")) {
			profile = this.profile(profile);
		}

		const zAxis = positionYAxis && positionYAxis.length > 0 ? cross3(positionXAxis, positionYAxis) : positionZAxis;

		const ifcPosition = this.createAxis2Placement3d(position, zAxis, positionXAxis);
		const ifcDirection = this.file.createEntity("IfcDirection", ifcSafeVectorType(extrusionVector));
		return this.file.createEntity("IfcExtrudedAreaSolid", profile, ifcPosition, ifcDirection, magnitude);
	}

	/**
	 * Create an `IfcSweptDiskSolid` -- a circular cross-section swept along a 3D path
	 * (`create_swept_disk_solid`). See this file's header comment (finding 1): throws
	 * unconditionally today.
	 */
	createSweptDiskSolid(pathCurve: EntityInstance, radius: number): EntityInstance {
		if ((pathCurve.get("Dim") as number) !== 3) {
			throw new Error(
				`Path curve for IfcSweptDiskSolid should be 3D to be valid, currently it has ${pathCurve.get("Dim")} dimensions.\nRef: https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcSweptDiskSolid.htm#8.8.3.42.4-Formal-propositions`,
			);
		}
		return this.file.createEntity("IfcSweptDiskSolid", pathCurve, radius);
	}

	/**
	 * Create an IFC representation for the given context and items (`get_representation`).
	 *
	 * **All items must belong to the same geometry category.** When `representationType`
	 * is omitted, `util.representation.guessType` infers it -- see this file's header
	 * comment (finding 1): throws for `IfcCurve`/`IfcSurface` items (a pre-existing,
	 * already-disclosed `guessType` limitation, not new here).
	 */
	getRepresentation(
		context: EntityInstance,
		items: EntityInstance | readonly EntityInstance[],
		representationType: string | null = null,
	): EntityInstance {
		const itemsArr: readonly EntityInstance[] = Array.isArray(items) ? items : [items as EntityInstance];
		const repType = representationType || guessType(itemsArr);
		const topologyTypes = ["Vertex", "Edge", "Path", "Face", "Shell"];
		const className =
			repType && topologyTypes.includes(repType) ? "IfcTopologyRepresentation" : "IfcShapeRepresentation";
		const identifier = context.get("ContextIdentifier") as string | null;
		return this.file.createEntity(className, context, identifier, repType, itemsArr);
	}

	/** Create a deep copy of an IFC element and all its referenced entities (`deep_copy`). */
	deepCopy(element: EntityInstance): EntityInstance {
		return copyDeep(this.file, element);
	}

	/**
	 * Shortcut to get kwargs for `extrude()` to extrude along a principal axis
	 * (`extrude_kwargs`).
	 *
	 * Assumes the 2D profile lies in the plane perpendicular to the extrusion axis.
	 */
	extrudeKwargs(axis: RotationAxis): ExtrudeKwargs {
		if (axis === "Y") {
			return { positionXAxis: [1, 0, 0], positionZAxis: [0, -1, 0], extrusionVector: [0, 0, -1] };
		}
		if (axis === "X") {
			return { positionXAxis: [0, 1, 0], positionZAxis: [1, 0, 0], extrusionVector: [0, 0, 1] };
		}
		return { positionXAxis: [1, 0, 0], positionZAxis: [0, 0, 1], extrusionVector: [0, 0, 1] };
	}

	/**
	 * Rotate extrusion kwargs around the Z axis (`rotate_extrusion_kwargs_by_z`).
	 *
	 * @param angle Rotation angle, in radians.
	 * @param counterClockwise Accepted but genuinely unused -- see this file's header
	 *   comment (quirk 2): a real, disclosed, verbatim-preserved Python-source quirk.
	 */
	rotateExtrusionKwargsByZ(kwargs: ExtrudeKwargs, angle: number, counterClockwise = false): ExtrudeKwargs {
		void counterClockwise;
		const rot = npRotationMatrix(-angle, 3, "Z");
		return {
			...kwargs,
			positionXAxis: matVecMul(rot, kwargs.positionXAxis),
			positionZAxis: matVecMul(rot, kwargs.positionZAxis),
		};
	}

	/** Extract the coordinate array from a polyline entity (`get_polyline_coords`). */
	getPolylineCoords(polyline: EntityInstance): number[][] {
		if (polyline.isA("IfcIndexedPolyCurve")) {
			return (polyline.get("Points") as EntityInstance).get("CoordList") as number[][];
		}
		if (polyline.isA("IfcPolyline")) {
			return (polyline.get("Points") as EntityInstance[]).map((p) => p.get("Coordinates") as number[]);
		}
		throw new Error(`Unsupported polyline type: ${polyline.isA()}`);
	}

	/** Update the coordinates of a polyline entity in place (`set_polyline_coords`). */
	setPolylineCoords(polyline: EntityInstance, coords: SequenceOfVectors): void {
		if (polyline.isA("IfcIndexedPolyCurve")) {
			(polyline.get("Points") as EntityInstance).set("CoordList", ifcSafeVectorType(coords));
			return;
		}
		if (polyline.isA("IfcPolyline")) {
			const ifcPoints = polyline.get("Points") as EntityInstance[];
			if (ifcPoints.length !== coords.length) {
				throw new Error(`setPolylineCoords: length mismatch (${ifcPoints.length} points, ${coords.length} coords)`);
			}
			const safeCoords = ifcSafeVectorType(coords);
			ifcPoints.forEach((point, i) => point.set("Coordinates", safeCoords[i]));
			return;
		}
		throw new Error(`Unsupported polyline type: ${polyline.isA()}`);
	}

	/**
	 * Creates a simple 2D curve (all fillets based on a 90-degree angle) from a set of 2D
	 * coords and a list of points with fillets (`get_simple_2dcurve_data`).
	 *
	 * @param filletRadius Either one radius per `fillets` entry, or a single number used
	 *   for all of them.
	 * @param createIfcCurve Whether to also build an `IfcIndexedPolyCurve` -- see this
	 *   file's header comment (finding 2): throws when `true`. The `false` (default) path
	 *   -- pure point/segment-index computation -- is fully functional.
	 * @returns `[points, segments, ifcCurve]`.
	 */
	getSimple2dcurveData(
		coords: SequenceOfVectors,
		fillets: readonly number[] = [],
		filletRadius: number | readonly number[] = [],
		closed = true,
		createIfcCurve = false,
	): readonly [number[][], number[][], EntityInstance | null] {
		const filletRadiusArr: readonly number[] =
			typeof filletRadius === "number" ? new Array(fillets.length).fill(filletRadius) : filletRadius;
		const filletsMap = new Map<number, number>();
		fillets.forEach((idx, i) => filletsMap.set(idx, filletRadiusArr[i]));

		let segments: number[][] = [];
		let points: number[][] = [];

		coords.forEach((co, coI) => {
			const currentPoint = points.length;
			if (filletsMap.has(coI)) {
				const r = filletsMap.get(coI) as number;
				const rsb = r * Math.cos(Math.PI / 4);
				const rss = r - rsb;
				const nextCo = coords[(coI + 1) % coords.length];
				const previousCo = coords[(coI - 1 + coords.length) % coords.length];
				const xDirection = co[0] < previousCo[0] || co[0] < nextCo[0] ? 1 : -1;
				const yDirection = co[1] < previousCo[1] || co[1] < nextCo[1] ? 1 : -1;
				const xshiftPoint = [co[0] + r * xDirection, co[1]];
				const middlePoint = [co[0] + rss * xDirection, co[1] + rss * yDirection];
				const yshiftPoint = [co[0], co[1] + r * yDirection];
				if (co[1] === previousCo[1]) {
					points.push(xshiftPoint, middlePoint, yshiftPoint);
				} else {
					points.push(yshiftPoint, middlePoint, xshiftPoint);
				}
				segments.push([currentPoint - 1, currentPoint]);
				segments.push([currentPoint, currentPoint + 1, currentPoint + 2]);
			} else {
				points.push([...co]);
				if (coI !== 0) {
					segments.push([currentPoint - 1, currentPoint]);
				}
			}
		});

		if (closed) {
			segments.push([points.length - 1, 0]);
		}
		if (segments[0][0] === -1) {
			segments[0][0] = points.length - 1;
		}

		[points, segments] = removeRedundantPoints(points, segments);

		let ifcCurve: EntityInstance | null = null;
		if (createIfcCurve) {
			const ifcPoints = this.file.createEntity("IfcCartesianPointList2D", ifcSafeVectorType(points));
			const ifcSegments: EntityInstance[] = [];
			for (const segment of segments) {
				const seg1 = segment.map((i) => i + 1);
				if (seg1.length === 2) {
					// See this file's header comment (finding 2): throws today.
					ifcSegments.push(this.file.createEntity("IfcLineIndex", seg1));
				} else if (seg1.length === 3) {
					ifcSegments.push(this.file.createEntity("IfcArcIndex", seg1));
				}
			}
			ifcCurve = this.file.createEntity("IfcIndexedPolyCurve", ifcPoints, ifcSegments);
		}
		return [points, segments, ifcCurve];
	}

	/**
	 * Create a Z-profile (cold-formed steel section) outline curve with lips and fillets
	 * (`create_z_profile_lips_curve`). All dimensions are in the IFC project's length
	 * units. See this file's header comment (finding 2): always throws today
	 * (`createIfcCurve` is always `true`).
	 */
	createZProfileLipsCurve(
		firstFlangeWidth: number,
		secondFlangeWidth: number,
		depth: number,
		girth: number,
		wallThickness: number,
		filletRadius: number,
	): EntityInstance {
		const x1 = firstFlangeWidth;
		const x2 = secondFlangeWidth;
		const y = depth / 2;
		const g = girth;
		const t = wallThickness;
		const r = filletRadius;

		const coords: number[][] = [
			[-t / 2, y],
			[x2, y],
			[x2, y - g],
			[x2 - t, y - g],
			[x2 - t, y - t],
			[t / 2, y - t],
			[t / 2, -y],
			[-x1, -y],
			[-x1, -y + g],
			[-x1 + t, -y + g],
			[-x1 + t, -y + t],
			[-t / 2, -y + t],
		];

		const [, , ifcCurve] = this.getSimple2dcurveData(
			coords,
			[0, 1, 4, 5, 6, 7, 10, 11],
			[r + t, r + t, r, r, r + t, r + t, r, r],
			true,
			true,
		);
		if (!ifcCurve) throw new Error("createZProfileLipsCurve: getSimple2dcurveData unexpectedly returned no curve");
		return ifcCurve;
	}

	/**
	 * Create an arc fitting inside a rectangle of the given width and height
	 * (`create_transition_arc_ifc`).
	 *
	 * If a single arc cannot span the full width, the longest possible radius is used and
	 * a straight segment is inserted in the middle.
	 *
	 * @param createIfcCurve If true, also create an `IfcIndexedPolyCurve` -- see this
	 *   file's header comment (finding 2): throws when `true`. The `false` (default) path
	 *   is fully functional.
	 * @returns `[points, segments, ifcCurve]`.
	 */
	createTransitionArcIfc(
		width: number,
		height: number,
		createIfcCurve = false,
	): readonly [number[][], number[][], EntityInstance | null] {
		const filletSize = width / 2 / height;
		let filletRadius: number;
		let curveCoords: number[][];
		let fillets: readonly number[];
		if (filletSize <= 1) {
			filletRadius = height * filletSize;
			curveCoords = [
				[0.0, 0.0],
				[0.0, height],
				[width * 0.5, height],
				[width, height],
				[width, 0.0],
			];
			fillets = [1, 3];
		} else {
			filletRadius = height;
			curveCoords = [
				[0.0, 0.0],
				[0.0, height],
				[filletRadius, height],
				[width - filletRadius, height],
				[width, height],
				[width, 0.0],
			];
			fillets = [1, 4];
		}
		return this.getSimple2dcurveData(curveCoords, fillets, filletRadius, false, createIfcCurve);
	}

	/**
	 * Create a tessellated mesh from points and face indices (`mesh`).
	 *
	 * Delegates to `facetedBrep` for IFC2X3, or `polygonalFaceSet` for IFC4+.
	 */
	mesh(points: SequenceOfVectors, faces: readonly (readonly number[])[]): EntityInstance {
		if (this.file.schema === "IFC2X3") {
			return this.facetedBrep(points, faces);
		}
		return this.polygonalFaceSet(points, faces);
	}

	/** Generate an `IfcFacetedBrep` with a closed shell (`faceted_brep`). */
	facetedBrep(points: SequenceOfVectors, faces: readonly (readonly number[])[]): EntityInstance {
		const verts = ifcSafeVectorType(points).map((p) => this.file.createEntity("IfcCartesianPoint", p));
		const ifcFaces = faces.map((f) =>
			this.file.createEntity("IfcFace", [
				this.file.createEntity(
					"IfcFaceOuterBound",
					this.file.createEntity(
						"IfcPolyLoop",
						f.map((v) => verts[v]),
					),
					true,
				),
			]),
		);
		return this.file.createEntity("IfcFacetedBrep", this.file.createEntity("IfcClosedShell", ifcFaces));
	}

	/** Generate an `IfcTriangulatedFaceSet` (`triangulated_face_set`). Not available in IFC2X3. */
	triangulatedFaceSet(points: SequenceOfVectors, faces: readonly (readonly number[])[]): EntityInstance {
		const ifcPoints = this.file.createEntity("IfcCartesianPointList3D", ifcSafeVectorType(points));
		const ifcFaces = faces.map((face) => face.map((i) => i + 1).slice(0, 3));
		return this.file.createEntity("IfcTriangulatedFaceSet", ifcPoints, null, null, ifcFaces);
	}

	/**
	 * Generate an `IfcPolygonalFaceSet` (`polygonal_face_set`). Not available in IFC2X3.
	 *
	 * @param faces Each face is a sequence of zero-based point indices; a sequence of
	 *   sequences means all but the first are inner voids.
	 */
	polygonalFaceSet(
		points: SequenceOfVectors,
		faces: readonly (readonly number[] | readonly (readonly number[])[])[],
	): EntityInstance {
		const isSequenceOfInts = (x: unknown): x is readonly number[] =>
			Array.isArray(x) && x.every((el) => typeof el === "number" && Number.isInteger(el));
		const isSequenceOfSequenceOfInts = (x: unknown): x is readonly (readonly number[])[] =>
			Array.isArray(x) && x.every((el) => isSequenceOfInts(el));
		const incr = (face: readonly number[]): number[] => face.map((i) => i + 1);

		if (!faces.every((f) => isSequenceOfInts(f) || isSequenceOfSequenceOfInts(f))) {
			throw new Error("Expected a sequence of int or sequence of sequence of int for each face");
		}

		const ifcPoints = this.file.createEntity("IfcCartesianPointList3D", ifcSafeVectorType(points));
		const ifcFaces = faces.map((face) =>
			isSequenceOfInts(face)
				? this.file.createEntity("IfcIndexedPolygonalFace", incr(face))
				: this.file.createEntity(
						"IfcIndexedPolygonalFaceWithVoids",
						incr(face[0] as readonly number[]),
						(face as readonly (readonly number[])[]).slice(1).map(incr),
					),
		);
		return this.file.createEntity("IfcPolygonalFaceSet", ifcPoints, null, ifcFaces);
	}

	/**
	 * Extrude by creating face sets rather than an `IfcExtrudedAreaSolid` (`extrude_face_set`).
	 *
	 * Useful when the representation already uses face sets and boolean-op-safe
	 * `CorrectItemsForType` needs to be preserved rather than mixing in a `SweptSolid`.
	 *
	 * @param points Points assumed to form a consecutive closed polyline.
	 */
	extrudeFaceSet(
		points: SequenceOfVectors,
		magnitude: number,
		extrusionVector: VectorType = [0, 0, 1],
		offset: VectorType | null = null,
		startCap = true,
		endCap = true,
	): EntityInstance {
		let startPoints = points.map((p) => [...p]);
		if (offset?.some((v) => v !== 0)) {
			startPoints = startPoints.map((p) => add(p, offset));
		}
		const extrusionOffset = extrusionVector.map((v) => v * magnitude);
		const endPoints = startPoints.map((p) => add(p, extrusionOffset));

		const allPoints = [...startPoints, ...endPoints];
		const faces: number[][] = [];
		const nVerts = startPoints.length;
		const lastVertI = nVerts - 1;
		for (let i = 0; i < lastVertI; i++) {
			faces.push([i, i + 1, nVerts + i + 1, nVerts + i]);
		}
		faces.push([lastVertI, 0, nVerts + 0, nVerts + lastVertI]); // Close the loop.

		if (endCap) {
			faces.push(Array.from({ length: nVerts }, (_, i) => nVerts + i));
		}
		if (startCap) {
			faces.push(Array.from({ length: nVerts }, (_, i) => nVerts - 1 - i));
		}

		return this.polygonalFaceSet(allPoints, faces);
	}

	// --- Part 2: MEP transition/bend methods (see this file's header comment for the
	// per-method findings) ---

	/**
	 * Generate a MEP transition shape for the provided segments (`mep_transition_shape`).
	 *
	 * Fully functional today (unlike `mepBendShape` below) -- see this file's header
	 * comment for why.
	 *
	 * @param startSegment Starting segment.
	 * @param endSegment Ending segment.
	 * @param startLength Start transition length.
	 * @param endLength End transition length.
	 * @param angle Transition angle, in degrees. Good default values from angle = 30/60
	 *   deg -- a 30-degree angle results in 75 degrees on the transition (`= 90 - angle/2`).
	 * @param profileOffset 2D vector for profile offset.
	 * @returns A tuple of the Model/Body/MODEL_VIEW `IfcShapeRepresentation` and a
	 *   transition-shape data object, or `[null, null]` if there was an error in the
	 *   process (e.g. unsupported profile types).
	 */
	mepTransitionShape(
		startSegment: EntityInstance,
		endSegment: EntityInstance,
		startLength: number,
		endLength: number,
		angle = 30.0,
		profileOffset: VectorType = [0.0, 0.0],
	): readonly [EntityInstance, MepTransitionData] | readonly [null, null] {
		const getCirclePoints = (radius: number, segments = 16): number[][] => {
			// Starting from (R, 0), going counter-clockwise.
			const step = (2 * Math.PI) / segments;
			return Array.from({ length: segments }, (_, i) => {
				const a = i * step;
				return [Math.cos(a) * radius, Math.sin(a) * radius, 0];
			});
		};

		const getRectanglePoints = (dim: VectorType): number[][] => {
			// Starting from (+X/2, +Y/2), going counter-clockwise.
			const half = dim.map((v) => v / 2);
			const offsets = [
				[1, 1, 0],
				[-1, 1, 0],
				[-1, -1, 0],
				[1, -1, 0],
			];
			return offsets.map((o) => mul(half, o));
		};

		const startProfile = mepGetProfile(startSegment);
		const endProfile = mepGetProfile(endSegment);
		if (startProfile === null || endProfile === null) return [null, null];

		const startHalfDim = mepGetDim(startProfile, startLength);
		const endHalfDim = mepGetDim(endProfile, endLength);
		// If profile types are not supported.
		if (startHalfDim === null || endHalfDim === null) return [null, null];

		const transitionItems: EntityInstance[] = [];
		const startOffset = [0, 0, startLength];

		let transitionLength = this.mepTransitionLength(startHalfDim, endHalfDim, angle, profileOffset);
		if (transitionLength === null) return [null, null];

		let faces: (readonly number[])[] = [];
		let endExtrusionOffset: number[] = [profileOffset[0], profileOffset[1], startLength + transitionLength];
		let points: number[][];

		if (startProfile.isA("IfcRectangleProfileDef") && endProfile.isA("IfcRectangleProfileDef")) {
			// No transition for exactly the same profiles.
			if (transitionLength === 0) return [null, null];

			faces = [
				[3, 4, 7, 0],
				[11, 8, 15, 12],
				[3, 11, 12, 4],
				[7, 15, 8, 0],
				// NOTE: clockwise order for correct face orientation.
				// start extrusion
				[0, 1, 2, 3],
				[8, 11, 10, 9],
				[0, 8, 9, 1],
				[1, 9, 10, 2],
				[2, 10, 11, 3],
				// end extrusion
				[4, 5, 6, 7],
				[12, 15, 14, 13],
				[4, 12, 13, 5],
				[5, 13, 14, 6],
				[6, 14, 15, 7],
			];
			points = [
				mul(startHalfDim, [-1, -1, 1]),
				mul(startHalfDim, [-1, -1, 0]),
				mul(startHalfDim, [1, -1, 0]),
				mul(startHalfDim, [1, -1, 1]),
				add(mul(endHalfDim, [1, -1, 0]), endExtrusionOffset),
				add(mul(endHalfDim, [1, -1, 1]), endExtrusionOffset),
				add(mul(endHalfDim, [-1, -1, 1]), endExtrusionOffset),
				add(mul(endHalfDim, [-1, -1, 0]), endExtrusionOffset),
				mul(startHalfDim, [-1, 1, 1]),
				mul(startHalfDim, [-1, 1, 0]),
				mul(startHalfDim, [1, 1, 0]),
				mul(startHalfDim, [1, 1, 1]),
				add(mul(endHalfDim, [1, 1, 0]), endExtrusionOffset),
				add(mul(endHalfDim, [1, 1, 1]), endExtrusionOffset),
				add(mul(endHalfDim, [-1, 1, 1]), endExtrusionOffset),
				add(mul(endHalfDim, [-1, 1, 0]), endExtrusionOffset),
			];
		} else if (startProfile.isA("IfcCircleProfileDef") && endProfile.isA("IfcCircleProfileDef")) {
			// No transition for exactly the same profiles.
			if (transitionLength === 0) return [null, null];

			const nSegments = 16;
			const firstProfilePoints = getCirclePoints(startProfile.get("Radius") as number, nSegments);
			const secondProfilePoints = getCirclePoints(endProfile.get("Radius") as number, nSegments);

			faces = [];
			for (let i = 0; i < nSegments; i++) {
				// For wrapping around the circle.
				const nextI = (i + 1) % nSegments;
				faces.push([i, nextI, nextI + nSegments, i + nSegments]);
			}

			transitionItems.push(
				this.extrudeFaceSet(firstProfilePoints, startLength, undefined, undefined, undefined, false),
			);
			transitionItems.push(this.extrudeFaceSet(secondProfilePoints, endLength, undefined, endExtrusionOffset, false));

			points = [
				...firstProfilePoints.map((p) => add(p, startOffset)),
				...secondProfilePoints.map((p) => add(p, endExtrusionOffset)),
			];
		} else {
			// One is circular, another one is rectangular.
			// Support transition from rectangle to circle of the same dimensions.
			if (transitionLength === 0) {
				transitionLength = (startLength + endLength) / 2;
				endExtrusionOffset = [endExtrusionOffset[0], endExtrusionOffset[1], endExtrusionOffset[2] + transitionLength];
			}

			const startingWithCircle = startProfile.isA("IfcCircleProfileDef");
			const circleProfile = startingWithCircle ? startProfile : endProfile;
			const rectProfile = startingWithCircle ? endProfile : startProfile;

			const circlePoints = getCirclePoints(circleProfile.get("Radius") as number);
			const rectPoints = getRectanglePoints([rectProfile.get("XDim") as number, rectProfile.get("YDim") as number, 0]);

			const startPoints = startingWithCircle ? circlePoints : rectPoints;
			const endPoints = startingWithCircle ? rectPoints : circlePoints;

			transitionItems.push(this.extrudeFaceSet(startPoints, startLength, undefined, undefined, undefined, false));
			transitionItems.push(this.extrudeFaceSet(endPoints, endLength, undefined, endExtrusionOffset, false));

			// Offset verts.
			const circlePointsOffset = circlePoints.map((p) => add(p, startingWithCircle ? startOffset : endExtrusionOffset));
			const rectPointsOffset = rectPoints.map((p) => add(p, startingWithCircle ? endExtrusionOffset : startOffset));

			// Circle verts are 0-15, rect verts are 16-19.
			points = [...circlePointsOffset, ...rectPointsOffset];
			let transitionFaces: number[][] = [
				[0, 19, 16], // base
				[0, 16, 1],
				[1, 16, 2],
				[2, 16, 3],
				[3, 16, 4],
				[4, 16, 17], // base
				[4, 17, 5],
				[5, 17, 6],
				[6, 17, 7],
				[7, 17, 8],
				[8, 17, 18], // base
				[8, 18, 9],
				[9, 18, 10],
				[10, 18, 11],
				[11, 18, 12],
				[12, 18, 19], // base
				[12, 19, 13],
				[13, 19, 14],
				[14, 19, 15],
				[15, 19, 0],
			];
			// Revert them in case it's starting with a circle profile, to keep the face
			// orientation.
			if (startingWithCircle) {
				transitionFaces = transitionFaces.map((f) => [...f].reverse());
			}
			faces = [...faces, ...transitionFaces];
		}

		const faceSet = this.polygonalFaceSet(points, faces);
		transitionItems.push(faceSet);

		const body = getContext(this.file, "Model", "Body", "MODEL_VIEW");
		if (!body) {
			throw new Error(
				"mepTransitionShape: no Model/Body/MODEL_VIEW representation context found (Python: assert body).",
			);
		}
		// Python: `"Tesselation"` (missing the second "l") -- a real Python-source typo
		// (the real IFC `RepresentationType` enumerant is `"Tessellation"`), preserved
		// verbatim -- see this file's header comment.
		const representation = this.getRepresentation(body, transitionItems, "Tesselation");

		const transitionData: MepTransitionData = {
			startLength,
			endLength,
			angle,
			profileOffset,
			transitionLength,
			fullTransitionLength: startLength + transitionLength + endLength,
		};

		return [representation, transitionData];
	}

	/**
	 * Get the transition length for two profile half-dimensions, an angle, and an XY
	 * offset (`mep_transition_length`).
	 *
	 * Unlike `mepTransitionCalculate()`, this method checks that the resulting length
	 * satisfies the angle constraint from both the start and end profile perspectives.
	 *
	 * TODO (matches Python): move to a separate `ShapeBuilder` method so the transition
	 * length could be checked without creating a representation.
	 *
	 * @param startHalfDim Half-dimensions of the start profile, `[halfX, halfY, depth]`.
	 *   For circular profiles `halfX === halfY === radius`.
	 * @param endHalfDim Half-dimensions of the end profile, in the same format.
	 * @param angle Maximum allowed transition angle, in degrees.
	 * @param profileOffset 2D XY offset between the centrelines of the start and end profiles.
	 * @param verbose If true, log diagnostic values during calculation (matches Python's
	 *   own debug-only `print`s, off by default -- enabling them logs on every transition
	 *   geometry computation).
	 * @returns Transition length, or `null` if no valid length exists for the given angle
	 *   and offset.
	 */
	mepTransitionLength(
		startHalfDim: VectorType,
		endHalfDim: VectorType,
		angle: number,
		profileOffset: VectorType = [0.0, 0.0],
		verbose = false,
	): number | null {
		const print: (...args: unknown[]) => void = verbose ? (...args) => console.log(...args) : () => {};

		// Vectors tend to have a bunch of floating-point garbage that can result in
		// errors when calculating the square root below.
		const offset = npRoundToPrecision(profileOffset, 1);
		const diff = [Math.abs(startHalfDim[0] - endHalfDim[0]), Math.abs(startHalfDim[1] - endHalfDim[1])];

		print(`offset = ${JSON.stringify(profileOffset)} / ${JSON.stringify(offset)}`);
		print(`diff = ${JSON.stringify(diff)}`);

		const checkTransition = (endProfile = false): number | null => {
			const length = this.mepTransitionCalculate({
				startHalfDim,
				endHalfDim,
				diff,
				offset,
				verbose,
				angle,
				endProfile,
			});
			if (length === null) return null;

			const otherSideAngle = this.mepTransitionCalculate({
				startHalfDim,
				endHalfDim,
				diff,
				offset,
				verbose,
				length,
				endProfile: !endProfile,
			});
			if (otherSideAngle === null) return null;

			// NOTE (matches Python): for now we just hardcode the good value for that case.
			const sameDimension = isX(endProfile ? diff[0] : diff[1], 0);
			const requestedAngle = sameDimension && isX(endProfile ? offset[0] : offset[1], 0) ? 90.0 : angle;

			print(`other_side_angle = ${otherSideAngle}, requested_angle = ${requestedAngle}`);
			// Need to make sure that the worst angle (maximum angle) for this transition
			// is `requestedAngle`.
			if (otherSideAngle < requestedAngle || isX(otherSideAngle, requestedAngle)) {
				print(`final length = ${length}, angle = ${requestedAngle}, other side angle = ${otherSideAngle}`);
				return length;
			}
			return null;
		};

		// Python: `return check_transition() or check_transition(True)` -- see this
		// file's header comment for the dormant falsy-short-circuit quirk this preserves.
		return checkTransition(false) || checkTransition(true);
	}

	/**
	 * Calculate MEP transition length from angle, or transition angle from length
	 * (`mep_transition_calculate`).
	 *
	 * Low-level calculation kernel used by `mepTransitionLength()`. Provide either
	 * `options.angle` or `options.length` (not both); the other value is computed and
	 * returned. Ported as a single options-object parameter -- see `MepTransitionCalculateOptions`'s
	 * own doc comment for why.
	 *
	 * @returns Transition length (if `angle` was given) or transition angle in degrees
	 *   (if `length` was given); `null` if the geometry is not feasible for the given
	 *   inputs, OR if BOTH `length` and `angle` are already non-null on entry -- see this
	 *   file's header comment for this preserved Python-source quirk.
	 */
	mepTransitionCalculate(options: MepTransitionCalculateOptions): number | null {
		const {
			startHalfDim,
			endHalfDim,
			offset: offsetIn,
			diff: diffIn = null,
			endProfile = false,
			length: lengthIn = null,
			angle: angleIn = null,
			verbose = false,
		} = options;
		const print: (...args: unknown[]) => void = verbose ? (...args) => console.log(...args) : () => {};

		let diff: readonly [number, number] =
			diffIn != null
				? [diffIn[0], diffIn[1]]
				: [Math.abs(startHalfDim[0] - endHalfDim[0]), Math.abs(startHalfDim[1] - endHalfDim[1])];
		let offset: readonly [number, number] = [offsetIn[0], offsetIn[1]];

		if (endProfile) {
			diff = [diff[1], diff[0]];
			offset = [offset[1], offset[0]];
		}

		const sameDimension = isX(diff[0], 0);
		const a = diff[0] + offset[0];
		const b = diff[0] - offset[0];

		let length = lengthIn;
		let angle = angleIn;

		if (length === null) {
			if (!sameDimension) {
				if (angle === null) {
					throw new Error(
						"mepTransitionCalculate: 'angle' is required when 'length' is not given and the profiles have different dimensions (Python: assert angle is not None).",
					);
				}
				const t = Math.tan((angle * Math.PI) / 180);
				const h0 = a ** 2 + 4 * a * b * t ** 2 + 2 * a * b + b ** 2;
				if (h0 < 0) {
					print(
						`B. Coulndn't calculate transition length for angle = ${angle}, offset = ${JSON.stringify(offset)}, diff = ${JSON.stringify(diff)}`,
					);
					return null;
				}
				const h = (a + b + Math.sqrt(h0)) / (2 * t);
				const lengthSquared = h ** 2 - offset[1] ** 2;
				if (lengthSquared <= 0) {
					print(`B. angle = ${angle} requires h = ${h} which is not possible with y offset = ${offset[1]}`);
					return null;
				}
				length = Math.sqrt(lengthSquared);

				if (verbose) {
					const A: number[] = [(endProfile ? endHalfDim : startHalfDim)[0], 0, 0];
					const endProfileOffset = npTo3d(offset, length);
					const D0: number[] = [(endProfile ? startHalfDim : endHalfDim)[0], 0, 0];
					const B = A.map((v) => -v);
					const C = add(
						D0.map((v) => -v),
						endProfileOffset,
					);
					const D = add(D0, endProfileOffset);
					const testedAngle = (npAngle(sub(A, D), sub(B, C)) * 180) / Math.PI;
					print(`A. length = ${length}, requested angle = ${angle}, tested angle = ${testedAngle}`);
				}
			} else if (isX(offset[0], 0)) {
				// NOTE (matches Python): for now we just hardcode the good value for that case.
				angle = 90;
				const h = startHalfDim[0] / Math.tan(((angle / 2) * Math.PI) / 180);
				const lengthSquared = h ** 2 - offset[1] ** 2;
				if (lengthSquared <= 0) {
					print(`B. angle = ${angle} requires h = ${h} which is not possible with y offset = ${offset[1]}`);
					return null;
				}
				length = Math.sqrt(lengthSquared);

				if (verbose) {
					const O = [0, 0, 0];
					const A = add([-startHalfDim[0], 0, length], npTo3d(offset));
					const B = mul(A, [-1, 1, 1]);
					const testedAngle = (npAngle(sub(A, O), sub(B, O)) * 180) / Math.PI;
					print(`B. length = ${length}, requested angle = ${angle}, tested angle = ${testedAngle}`);
				}
			} else {
				if (angle === null) {
					throw new Error(
						"mepTransitionCalculate: 'angle' is required in this branch (Python: assert angle is not None).",
					);
				}
				const h = offset[0] / Math.tan((angle * Math.PI) / 180);
				const lengthSquared = h ** 2 - offset[1] ** 2;
				if (lengthSquared <= 0) {
					print(`C. angle = ${angle} requires h = ${h} which is not possible with y offset = ${offset[1]}`);
					return null;
				}
				length = Math.sqrt(lengthSquared);

				if (verbose) {
					const A = [-startHalfDim[0], 0, 0];
					const H = [A[0], A[1], A[2] + length];
					H[1] += offset[1];
					const D = [...H];
					D[0] += offset[0];
					const testedAngle = (npAngle(sub(H, A), sub(D, A)) * 180) / Math.PI;
					print(`C. length = ${length}, requested angle = ${angle}, tested angle = ${testedAngle}`);
				}
			}
			return length as number;
		}

		if (angle === null) {
			if (!sameDimension) {
				if (length === 0) return 0;
				const h = Math.sqrt(length ** 2 + offset[1] ** 2);
				const t = (-h * (a + b)) / (a * b - h ** 2);
				angle = (Math.atan(t) * 180) / Math.PI;
			} else {
				const h = Math.sqrt(length ** 2 + offset[1] ** 2);
				if (isX(offset[0], 0)) {
					angle = (2 * Math.atan(startHalfDim[0] / h) * 180) / Math.PI;
				} else {
					angle = (Math.atan(offset[0] / h) * 180) / Math.PI;
				}
			}
			return angle;
		}

		// Python: neither branch above executes when both `length` and `angle` are
		// already non-null on entry -- silently falls off the end and returns `None`, a
		// genuine, disclosed Python-source quirk preserved verbatim; see this file's
		// header comment.
		return null;
	}

	/**
	 * Generate a MEP bend shape for the provided segment (`mep_bend_shape`).
	 *
	 * **Currently always throws, on every schema and every profile shape** -- a real,
	 * disclosed blockage (two different causes depending on schema); see this file's
	 * header comment for the full story. Ported faithfully anyway (every branch below is
	 * real, correct, verbatim-translated control flow), pinned by dedicated regression
	 * tests asserting the current, disclosed, blocked behavior.
	 *
	 * @param segment IfcFlowSegment for a bend. Note that for a bend, the start and end
	 *   segment types should match.
	 * @param angle Bend angle, in radians.
	 * @param radius Bend radius.
	 * @param bendVector Offset between start and end segments in local space of the start
	 *   segment, used mainly to determine the second bend axis and its direction (positive
	 *   or negative); the actual magnitude of the vector is not important (though near-zero
	 *   values will be ignored).
	 * @param flipZAxis Since the Z axis direction cannot be determined from the profile
	 *   offset alone, this flips it if the bend goes by the start segment's Z- axis.
	 * @returns A tuple of the Model/Body/MODEL_VIEW `IfcShapeRepresentation` and a
	 *   bend-shape data object.
	 */
	mepBendShape(
		segment: EntityInstance,
		startLength: number,
		endLength: number,
		angle: number,
		radius: number,
		bendVector: VectorType,
		flipZAxis: boolean,
	): readonly [EntityInstance, MepBendData] {
		const siConversion = calculateUnitScale(this.file);
		const profile = mepGetProfile(segment);
		if (!profile) {
			throw new Error("mepBendShape: segment has no supported single-profile material (Python: assert profile).");
		}
		const isCircularProfile = profile.isA("IfcCircleProfileDef");
		const profileDim = mepGetDim(profile, startLength);
		if (!profileDim) {
			throw new Error("mepBendShape: unsupported profile type (Python: assert profile_dim is not None).");
		}

		const roundedBendVector = npRoundToPrecision(bendVector, siConversion);
		const lateralAxisFound = [0, 1].find((i) => !isX(roundedBendVector[i], 0));
		if (lateralAxisFound === undefined) {
			throw new Error(
				"mepBendShape: bendVector has no significant X or Y component (Python: StopIteration from next()).",
			);
		}
		const lateralAxis = lateralAxisFound;
		const nonLateralAxis = lateralAxis === 0 ? 1 : 0;
		const lateralSign = Math.sign(bendVector[lateralAxis]);
		const zSign = flipZAxis ? -1 : 1;

		const repItems: EntityInstance[] = [];

		// Bend circle center.
		const O = [0, 0, 0];
		O[lateralAxis] = (radius + profileDim[lateralAxis]) * lateralSign;
		const theta = angle;

		/** @param angles Angles, in radians. */
		const getCirclePoints = (angles: readonly number[], r: number): number[][] => {
			return angles.map((a) => {
				const shifted = a - Math.PI / 2;
				const p = [0, 0, 0];
				p[2] = zSign * Math.cos(shifted) * r;
				p[lateralAxis] = lateralSign * Math.sin(shifted) * r;
				return p;
			});
		};

		/** @param a Angle, in radians. @returns Tangent vector. */
		const getCircleTangent = (a: number): number[] => {
			const tangent = [0, 0, 0];
			tangent[2] = Math.cos(a) * zSign;
			tangent[lateralAxis] = Math.sin(a) * lateralSign;
			return tangent;
		};

		const getBendRepresentationItem = (): EntityInstance => {
			let r = radius;
			const thetaSegments = [0.0, theta / 2, theta];
			let points: number[][];
			let arcPoints: readonly number[];
			if (isCircularProfile) {
				r += profileDim[lateralAxis];
				points = getCirclePoints(thetaSegments, r);
				arcPoints = [1];
			} else {
				const outerR = r + 2 * profileDim[lateralAxis];
				const outerPoints = getCirclePoints([...thetaSegments].reverse(), outerR);
				if (isX(r, 0)) {
					points = getCirclePoints([theta], r);
					points = [...points, ...outerPoints];
					arcPoints = [2];
				} else {
					const innerPoints = getCirclePoints(thetaSegments, r);
					points = [...innerPoints, ...outerPoints];
					arcPoints = [1, 4];
				}
			}
			points = points.map((p) => add(p, O));
			const offset = [0, 0, 0];
			offset[2] = zSign * startLength;

			if (isCircularProfile) {
				const bendPath = this.polyline(points, false, offset, arcPoints);
				return this.createSweptDiskSolid(bendPath, profileDim[lateralAxis]);
			}
			offset[nonLateralAxis] = -profileDim[nonLateralAxis];
			const extrusionKwargs = this.extrudeKwargs(nonLateralAxis === 0 ? "X" : "Y");
			const polylinePoints = points.map((p) => [p[lateralAxis], p[2]]);
			const profileCurve = this.polyline(polylinePoints, true, null, arcPoints);
			return this.extrude(
				this.profile(profileCurve),
				profileDim[nonLateralAxis] * 2,
				offset,
				extrusionKwargs.extrusionVector,
				extrusionKwargs.positionZAxis,
				extrusionKwargs.positionXAxis,
			);
		};

		repItems.push(getBendRepresentationItem());
		if (startLength) {
			repItems.push(this.extrude(profile, startLength, undefined, [0, 0, zSign]));
		}
		if (endLength) {
			const circlePointAtTheta = getCirclePoints([theta], radius + profileDim[lateralAxis])[0];
			let endPosition = add(O, circlePointAtTheta);
			endPosition = [endPosition[0], endPosition[1], endPosition[2] + startLength * zSign];

			// Define extrusion space for the segment after the bend.
			const zAxis = getCircleTangent(theta);
			// Since the tangent involves only two axes, it's safe to assume the
			// non-lateral axis is untouched.
			const xAxis = lateralAxis === 0 ? cross3(zAxis, [0, 1, 0]) : [1, 0, 0];

			repItems.push(this.extrude(profile, endLength, endPosition, [0, 0, 1], zAxis, xAxis));
		}

		const body = getContext(this.file, "Model", "Body", "MODEL_VIEW");
		if (!body) {
			throw new Error("mepBendShape: no Model/Body/MODEL_VIEW representation context found (Python: assert body).");
		}
		const rep = this.getRepresentation(body, repItems);

		const bendData: MepBendData = {
			startLength,
			endLength,
			radius,
			angle: (theta * 180) / Math.PI,
			lateralAxis,
			lateralSign,
			zAxisSign: flipZAxis ? -1 : 1,
			mainProfileDimension: profileDim[lateralAxis],
		};
		return [rep, bendData];
	}
}

/**
 * Removes redundant (duplicate) points from `get_simple_2dcurve_data`'s fillet output,
 * reindexing `segments` accordingly (`ShapeBuilder.get_simple_2dcurve_data`'s nested
 * `remove_redundant_points` closure, hoisted to a module-private function since TS nested
 * closures inside a class method would need to be re-declared per call -- functionally
 * identical, pure translation).
 */
function removeRedundantPoints(
	pointsIn: readonly (readonly number[])[],
	segmentsIn: readonly (readonly number[])[],
): [number[][], number[][]] {
	const points: number[][] = pointsIn.map((p) => [...p]);
	let segments: number[][] = segmentsIn.map((s) => [...s]);
	const pointsToRemove = new Set<number>();
	let prevPoint = 0;
	for (let i = 1; i < points.length; i++) {
		const p = points[i];
		if (!pointsEqual(p, points[prevPoint])) {
			prevPoint = i;
			continue;
		}
		segments = segments.map((s) => s.map((ps) => (ps === i ? prevPoint : ps)));
		pointsToRemove.add(i);
	}
	let validSegments = segments.filter((segment) => new Set(segment).size !== 1);
	const filteredPoints = points.filter((_, i) => !pointsToRemove.has(i));
	const uniquePoints = Array.from(new Set(validSegments.flat())).sort((a, b) => a - b);
	const translation = new Map<number, number>();
	uniquePoints.forEach((prev, i) => translation.set(prev, i));
	validSegments = validSegments.map((s) => s.map((p) => translation.get(p) as number));
	return [filteredPoints, validSegments];
}

function pointsEqual(a: readonly number[], b: readonly number[]): boolean {
	return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Shared helper for `mepTransitionShape()`/`mepBendShape()` -- both Python methods define
 * an identical nested `get_profile(element)` closure; hoisted here to a single
 * module-private function since neither closes over any enclosing method state (both are
 * pure functions of their own parameters, calling only the free `get_material()`),
 * matching `removeRedundantPoints`'s own precedent above -- a disclosed, non-behavioral
 * simplification, not a deviation.
 */
function mepGetProfile(element: EntityInstance): EntityInstance | null {
	const material = getMaterial(element, true);
	if (material?.isA("IfcMaterialProfileSet")) {
		const materialProfiles = material.get("MaterialProfiles") as EntityInstance[];
		if (materialProfiles.length === 1) {
			return materialProfiles[0].get("Profile") as EntityInstance | null;
		}
	}
	return null;
}

/**
 * Shared helper for `mepTransitionShape()`/`mepBendShape()` -- both Python methods define
 * an identical nested `get_dim(profile, depth)` closure; hoisted for the same reason as
 * `mepGetProfile` above.
 *
 * TODO (matches Python): support more profile types.
 */
function mepGetDim(profile: EntityInstance, depth: number): VectorType | null {
	if (profile.isA("IfcRectangleProfileDef")) {
		return [(profile.get("XDim") as number) / 2, (profile.get("YDim") as number) / 2, depth];
	}
	if (profile.isA("IfcCircleProfileDef")) {
		const radius = profile.get("Radius") as number;
		return [radius, radius, depth];
	}
	return null;
}
