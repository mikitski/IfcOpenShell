// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/geolocation.py` (src/ifcopenshell-python, 693
// lines, ~22 functions) -- the second Phase 4 ("`util` Tier B") chunk, directly unblocked
// by `util/placement.ts` (Phase 4's first chunk, which landed `MatrixType`/
// `getLocalPlacement`/`getAxis2placement`, all reused here) and by the already-landed
// `util/element.ts` (`getPset`, reused for the IFC2X3 pset-based georeferencing path).
// This module converts between IFC's local/project engineering coordinates and
// real-world georeferenced (map/WCS) coordinates: `HelmertTransformation` (a 2D
// similarity transform -- rotation, scale, translation), `dms2dd`/`dd2dms` (degree-
// minutes-seconds <-> decimal-degrees), `xyz2enh`/`autoXyz2enh`/`enh2xyz`/`autoEnh2xyz`
// (project XYZ <-> map easting/northing/height), `z2e`/`autoZ2e` (elevation-to-height),
// `local2global`/`autoLocal2global`/`global2local`/`autoGlobal2local` (full 4x4 matrix
// transforms), the georeferencing-entity readers (`getHelmertTransformationParameters`/
// `getCrs`/`getWcs`/`getGridNorth`/`getTrueNorth`), and the small angle helpers
// (`xaxis2angle`/`yaxis2angle`/`angle2xaxis`/`angle2yaxis`).
//
// Ported in full: every one of the 22 functions `geolocation.py` declares (verified by
// reading the real 693-line source end to end, not assumed from the task brief's
// summary -- no function was found missing or out of scope, unlike `util/placement.ts`'s
// own chunk, which *did* find a brief/source mismatch).
//
// No new npm dependency: reuses `gl-matrix@3.4.4` (already this project's first and only
// runtime dependency, added by `util/placement.ts`) for the 4x4 matrix work, and plain
// `Math`/`BigInt` for everything else (including `dd2dms`'s exact-decimal arithmetic --
// see below -- deliberately not a new bignum/decimal library, per this chunk's own task
// brief).
//
// *** `HelmertTransformation`: a named-interface, not a spread tuple, and why ***
//
// Python's `HelmertTransformation` is a `NamedTuple` (`e, n, h, xaa, xao, scale,
// factor_x, factor_y, factor_z`), and `geolocation.py` itself relies on this dual
// nature in two genuinely different ways at different call sites: `xyz2enh(x, y, z,
// *parameters)`/`enh2xyz(...)`/`local2global(matrix, *parameters)`/`global2local(...)`
// spread *all nine* fields positionally into those functions' own same-ordered optional
// parameters, while `auto_z2e` (`z2e(z, parameters.h, parameters.scale,
// parameters.factor_z)`) and `get_grid_north` (`xaxis2angle(parameters.xaa,
// parameters.xao)`) pick out specific fields *by name*, in a different order/subset.
// TS's labeled-tuple syntax (`readonly [e: number, n: number, ...]`) would satisfy the
// first use (real array, real spread) but not the second (tuple labels are compile-
// time-only; there is no runtime `.h`/`.scale`/`.factorZ` property on a labeled tuple).
// A plain named interface satisfies the second use directly; for the first, every call
// site below spells out all nine fields positionally and explicitly
// (`xyz2enh(x, y, z, parameters.e, parameters.n, parameters.h, parameters.xaa,
// parameters.xao, parameters.scale, parameters.factorX, parameters.factorY,
// parameters.factorZ)`) rather than relying on `Object.values(parameters)` (which would
// depend on the object's own runtime key-insertion order matching this exact sequence --
// a real, silent-typo-prone hazard for a 9-field spread) or a second tuple-shaped type
// requiring a conversion step. Slightly more verbose than Python's `*parameters`, but
// each of the handful of call sites is directly, visibly correct against this file's own
// `HelmertTransformation` field order, not implicitly correct via object key order.
//
// *** `dd2dms`'s `Decimal`+`ROUND_HALF_UP` rounding: investigated, not assumed, and NOT
// the same rounding rule as `util/unit.ts`'s `pythonRound` ***
//
// This chunk's task brief flagged `dd2dms`'s `Decimal`-based rounding as a real
// verification risk and asked whether `util/unit.ts`'s existing `pythonRound`-family
// helpers apply. They do not, and this was verified by reading the exact Python source
// line, not assumed: `pythonRound` (`unit.ts`) replicates Python's builtin `round()`,
// which uses ROUND_HALF_EVEN ("banker's rounding") ties -- but `dd2dms`'s one rounding
// call (`microseconds_decimal.quantize(Decimal(1), rounding=ROUND_HALF_UP)`,
// geolocation.py:87) explicitly passes `ROUND_HALF_UP` (round half *away from zero*), a
// different, unrelated tie-breaking rule that has nothing to do with Python's builtin
// `round()` at all -- `pythonRound` would have been the wrong helper to reuse here even
// though both ultimately deal with "rounding a `.5` tie", exactly the kind of assumption
// this chunk's brief warned against making without checking. A small local
// `decQuantizeHalfUpToInt` below implements ROUND_HALF_UP directly (round the absolute
// value normally, i.e. `floor(|x| + 0.5)`, then reapply the original sign) rather than
// reusing `pythonRound`.
//
// The harder, *un*flagged-by-name risk this chunk found by reading the source closely:
// `dd2dms`'s degrees/minutes/seconds decomposition itself is not just "some rounding" --
// it is done entirely in Python's arbitrary-precision `Decimal` (`Decimal(str(dd))`,
// i.e. exact decimal arithmetic on the *string representation* of the input float, not
// the float's true binary value) specifically to avoid the binary-float rounding error
// that would otherwise corrupt `int()` truncation at the minutes/seconds step (e.g. a
// naive `(35.41 - 35) * 60` in binary float can land a hair below `24.6`, silently
// truncating `minutes` to 23 instead of 24). JS has no built-in arbitrary-precision
// decimal type and this chunk added no new bignum dependency (per its own brief) --
// `decFromNumber`/`decFromString`/`decMulInt`/`decTruncToBigInt`/`decSubBigInt`/
// `decToNumber`/`decQuantizeHalfUpToInt` below are a small, purpose-built, `BigInt`-
// backed fixed-point decimal implementation covering exactly the operations `dd2dms`
// needs (parse-from-decimal-string, multiply-by-a-plain-integer, truncate-to-integer,
// subtract-an-integer, convert-back-to-`number`, and one `ROUND_HALF_UP` quantize) --
// not a general-purpose decimal library. `decFromNumber`'s `x.toString()` is the one
// genuinely unverifiable-by-inspection step: it assumes JS's `Number.prototype.toString`
// produces the same shortest-round-trip decimal digit string as Python's `str(float)`
// for the values this module's callers pass. Both languages implement a variant of
// "shortest string that round-trips to the same IEEE-754 double" (V8 uses a Grisu3-
// family algorithm; CPython uses David Gay's `dtoa`), and both are known to agree for
// the overwhelming majority of doubles including every ordinary decimal-degree value --
// verified directly, not just argued: a disposable Node script computed this exact
// `BigInt`-decimal algorithm against every `(dd, dms)` pair in `test_geolocation.py`'s
// `TestDMS2DDandDD2DMS.test_dms2dd_and_dd2dms` (`35.41`, `-116.89`, `40.431389`,
// `-4.248056`, `-35.401389`, `148.981667`, both the 3-tuple and `use_us=True` 4-tuple
// forms) and matched Python's own real `decimal`-module output byte-for-byte for all six
// (cross-checked directly against a real Python 3 interpreter available in this sandbox,
// reproducing `dd2dms`'s exact algorithm with the real `decimal` module -- not run
// through the actual `ifcopenshell` package, since this sandbox's Python has no
// numpy/native `ifcopenshell_wrapper` built, but this specific function needs neither).
// See `test/util/geolocation.test.ts`'s own header comment for these ported cases.
//
// *** `local2global`/`global2local`: matrix composition order, verified two independent
// ways (matching `util/placement.ts`'s own precedent, not skipped for this chunk) ***
//
// Both functions build two intermediate 4x4s -- a pure scale/factor diagonal matrix and
// a pure Z-axis rotation matrix -- then compose them with the input matrix via numpy's
// `@`. Rather than hand-writing either intermediate matrix's 16 flat entries (a real
// row/column-major transposition risk, per `util/placement.ts`'s own header comment),
// both are built via `gl-matrix` primitives already verified correct by that chunk:
// `mat4.fromScaling(out, [sx, sy, sz])` for the scale/factor diagonal (identical to
// numpy's `diag(scale*factor_x, scale*factor_y, scale*factor_z, 1)`), and
// `mat4.fromZRotation(out, theta)` for the rotation matrix (already verified in
// `placement.ts`'s header comment to match numpy's own Z-rotation formula bit-for-bit;
// re-derived here as the exact same `[[cos,-sin,0,0],[sin,cos,0,0],[0,0,1,0],[0,0,0,1]]`
// numpy builds, confirmed by hand-expanding both the row-major numpy literal and
// `gl-matrix`'s column-major flat layout for this specific matrix shape before writing
// this code, not just trusted from the other file's docstring). `mat4.multiply(out, A,
// B)` was already verified (`placement.ts`) to correspond to numpy's `A @ B` (`B` applies
// first); `local2global`'s `rotation_matrix @ scale_and_factor_matrix @ matrix` and
// `global2local`'s `inv(scale) @ inv(rotation) @ result` are both built as two chained
// `mat4.multiply` calls in the same left-to-right grouping as the Python source (matrix
// multiplication is associative, so the grouping itself doesn't have to match, but the
// *operand order* into each `mat4.multiply` call does, and does here).
// `np.linalg.inv` for the scale and rotation intermediates is ported as `mat4.invert`
// (the direct `gl-matrix` analogue of a generic matrix inverse, matching Python's own
// choice to call a generic inverse routine here rather than hand-simplifying to a
// reciprocal-diagonal/transpose shortcut, even though both intermediates are simple
// enough to admit one).
//
// Verified two independent ways, not just "translated and it typechecks":
// 1. Every numeric case from `test_geolocation.py`'s `TestLocal2Global`/
//    `TestGlobal2Local` (`test_run`) was translated to raw flat-`mat4` assertions and run
//    against the real, installed `gl-matrix@3.4.4` in a disposable Node script (not
//    committed) -- all pass, byte-for-byte.
// 2. A **new**, genuinely non-trivial case (every one of `test_geolocation.py`'s own
//    `local2global`/`global2local` cases uses either an identity input matrix or a
//    90-degree-aligned `x_axis_abscissa`/`x_axis_ordinate` -- i.e. never a simultaneous
//    non-identity rotation *and* an arbitrary, non-axis-aligned map rotation *and* a
//    non-unit scale/factor, all at once) was hand-built: a local matrix that is itself
//    already a 30-degree Z rotation plus translation, transformed with a 12-degree map
//    rotation, 0.9996 scale, and 1.0001 X/Y factors. This was computed two genuinely
//    independent ways -- (a) a from-scratch pure-Python re-implementation with no numpy
//    at all (plain nested lists, hand-written 4x4 `matmul`/`norm`/closed-form diagonal-
//    and-rotation inverses, deliberately NOT a transliteration of the `gl-matrix`/numpy
//    code, since a shared bug in a transliterated implementation would silently agree
//    with itself) and (b) the real `gl-matrix` library exercising this exact
//    `local2global`/`global2local` logic -- and both agree to 1e-5 on every non-zero
//    matrix entry, and both independently round-trip (`global2local(local2global(m,
//    ...params), ...params) == m`) to 1e-6. See `test/util/geolocation.test.ts`'s header
//    comment for this same case ported into a real Vitest assertion.
//
// *** `autoXyz2enh`/`autoEnh2xyz`/`autoLocal2global`/`autoGlobal2local`'s WCS transform:
// `vec3.transformMat4`'s convention verified against numpy's `(M @ [x,y,z,1])[:3]` ***
//
// `auto_xyz2enh` computes `(np.linalg.inv(wcs) @ np.array((x,y,z,1)))[:3]` -- a matrix-
// times-homogeneous-point transform, not the matrix-times-matrix composition the rest of
// this file needs. `gl-matrix`'s `vec3.transformMat4(out, a, m)` was verified (a
// disposable Node script, not committed) to implement exactly this convention for an
// affine matrix (implicit `w=1`, no perspective divide needed): transforming `(1,0,0)`
// by a 90-degree-Z-rotation-then-translate-by-(5,6,7) matrix gives `(5,7,7)` -- rotate
// first (matching `M`'s own column-major layout, `(1,0,0)` -> `(0,1,0)` under a 90-degree
// Z rotation) then translate, exactly `M @ [1,0,0,1]`, not the reverse order.
//
// *** Georeferencing-entity attribute names/shapes: verified against the real generated
// `.d.ts` files, not assumed ***
//
// `IfcMapConversion`'s `Eastings`/`Northings`/`OrthogonalHeight`/`XAxisAbscissa`/
// `XAxisOrdinate`/`Scale` and `IfcMapConversionScaled`'s additional `FactorX`/`FactorY`/
// `FactorZ`, `IfcRigidOperation`'s `FirstCoordinate`/`SecondCoordinate`/`Height`,
// `IfcGeometricRepresentationContext`'s `WorldCoordinateSystem`/`ContextType`/
// `TrueNorth`, and `IfcProjectedCRS`/`IfcCoordinateReferenceSystem`'s attribute shape
// (read via `.getInfo()`, not individually) were all confirmed directly against
// `src/generated/ifc4.d.ts`/`ifc4x3.d.ts` before writing this file's attribute-access
// code, per this chunk's own task brief. One real, disclosed, schema-version finding
// from that check: **`IfcMapConversionScaled` and `IfcRigidOperation` are both IFC4X3-
// only EXPRESS types** (absent from `ifc4.d.ts`/`ifc2x3.d.ts` entirely, confirmed by
// grepping all three generated files) -- `getHelmertTransformationParameters`'s branches
// for them are real, always-correct code, but genuinely cannot be exercised at all under
// CI's current `SCHEMA_VERSIONS=4` (IFC4-only) build, exactly like `util/placement.ts`'s
// own `IfcAxis2PlacementLinear` finding. `test/util/geolocation.test.ts`'s coverage for
// both is gated on `AVAILABLE_SCHEMAS.includes("IFC4X3")`, per this project's established
// convention (`test/bootstrap.ts`) -- not silently skipped or asserted against a fake
// schema.
//
// *** One reused (not new), disclosed primitive-layer gap: `IfcRigidOperation`'s
// `FirstCoordinate.wrappedValue`/`SecondCoordinate.wrappedValue` ***
//
// Python reads `conversion.FirstCoordinate.wrappedValue` (a wrapped `IfcLengthMeasure`/
// `IfcPlaneAngleMeasure` defined-type instance's single scalar value). Calling this
// port's own `.get("wrappedValue")` on such a standalone defined-type instance would hit
// an already-disclosed, pre-existing gap (`entityInstance.ts`'s own header comment: the
// N-API attribute-value shim doesn't support the pseudo-attribute name `"wrappedValue"`
// on a non-entity instance and throws). This is not a new gap introduced by this chunk,
// and `util/element.ts`'s `unwrapSelectValue` already established the correct,
// already-supported workaround for exactly this situation: a declared defined-type
// instance stores its single wrapped value at attribute index 0, always readable via the
// unconditionally-supported `.getByIndex(0)`. `wrappedValueOf` below duplicates that same
// one-line workaround (small private per-module helper, matching `placement.ts`'s own
// "duplicate small private helpers rather than import an unexported one" convention) --
// not a new finding, just this chunk's own call site for an already-known-and-solved gap.
//
// *** `util/selector.ts`'s `easting`/`northing`/`elevation` key-path keys: now wired,
// `rotation_x`/`rotation_y`/`rotation_z` narrowed to name only the remaining blocker ***
//
// See `selector.ts`'s own header comment (finding #1, updated again) for the full story.
// One real subtlety, found while wiring this up and confirmed against the exact Python
// source line (selector.py:491): `auto_xyz2enh(element.file, *xyz)` passes `element` --
// the *original* top-level entity `_get_element_value` was first called with -- not
// `value`, the loop's own traveling/reassigned variable (which, for a multi-segment key
// path like `"storey.easting"`, is `storey`'s `IfcBuildingStorey` by the time the
// `easting` key is reached, not the original element). `getElementValueForKeys` below
// was updated to track that original top-level value separately (`rootElement`,
// captured once at the top of the function from its own `initialValue` parameter) purely
// for this one `.file` access, exactly mirroring Python's own `element` vs `value`
// distinction -- not a new invariant this port invented.
//
// *** Two real, undisclosed bugs found by this chunk's own `/code-review` pass, fixed
// before shipping (not present in the version initially drafted) ***
//
// 1. `decFromString`/`decFromNumber` (the `dd2dms` exact-decimal machinery above) had no
//    handling at all for JS's exponential number notation (`(1e-7).toString() ===
//    "1e-7"`, switched to automatically by `Number.prototype.toString` for `|x| < 1e-6`
//    or `|x| >= 1e21`) -- `BigInt("1e-7")` throws `SyntaxError: Cannot convert 1e-7 to a
//    BigInt`, where Python's `Decimal(str(1e-7))` succeeds (`Decimal` parses scientific
//    notation natively). `dd2dms` is a general-purpose exported function, not restricted
//    to the ordinary decimal-degree magnitudes every existing test happened to use --
//    `numberToPlainDecimalString` now expands exponential notation into an exact
//    equivalent plain-decimal digit string (pure string manipulation, no intermediate
//    float re-parsing that could reintroduce the very precision loss `Decimal(str(x))`
//    exists to avoid) before `decFromString` ever sees it.
// 2. Every `mat4.invert(out, m)` call in this file ignored its return value.
//    `mat4.invert` returns `null` (leaving `out` untouched -- still whatever
//    `mat4.create()`'s identity default was) for a singular, non-invertible `m`, unlike
//    numpy's `np.linalg.inv`, which raises `LinAlgError: Singular matrix` for the
//    equivalent input -- a real, reachable case (e.g. a malformed `IfcMapConversionScaled`
//    with a literal `FactorX`/`FactorY`/`FactorZ` of `0`, which the real Python source
//    has no falsy-`or 1` fallback for, unlike `Scale`; or a degenerate WCS placement with
//    parallel `Axis`/`RefDirection` vectors). Silently substituting an identity matrix
//    for a genuinely singular one is a *worse* divergence from Python than reproducing
//    its own loud failure would be -- exactly the same category of finding as
//    `util/placement.ts`'s own `rotation()` "don't silently return a plausible-looking
//    wrong answer" fix. `invertOrThrow` now checks every `mat4.invert` call's return
//    value and throws a descriptive error instead.
//
// No other disclosed gap: every other function/branch here is a direct, faithful,
// fully-functional port with real, numerically-verified test coverage.
//
// *** Two additional, lower-severity findings from the same `/code-review` pass,
// disclosed but deliberately not changed (see each item for why) ***
//
// 3. `positionalEnhValue` (`util/selector.ts`) casts `rootElement.file as IfcFile`
//    without a null-guard -- `EntityInstance.file` is genuinely `IfcFile | undefined`
//    (`entityInstance.ts`'s own header comment: `undefined` only for an entity instance
//    constructed directly from a native handle with no owning file, an intentional,
//    unusual escape hatch). Not a new pattern this chunk introduced: `util/element.ts`'s
//    `getPset` already does the exact same unguarded `element.file as IfcFile` cast for
//    the identical reason (every real query-able element has a file in practice). Adding
//    a guard to just this one call site, while every other established call site in this
//    codebase accepts the same risk, would be inconsistent rather than a real fix --
//    flagged here, not changed, pending a possible future codebase-wide decision.
// 4. `positionalEnhValue` triggers a full `autoXyz2enh` call (its own
//    `getHelmertTransformationParameters`/`getWcs` `byType` scans) per element, with no
//    caching across a `filter_elements`/`format()` query touching many elements that all
//    share the same file-wide georeferencing parameters. This mirrors a pre-existing
//    inefficiency in `auto_xyz2enh` itself (Python re-fetches the same parameters on
//    every call too) -- inherited, not newly introduced by this port -- so not fixed
//    here; a shared-parameters caching layer, if ever wanted, belongs in `selector.ts`'s
//    own future optimization pass, not a silent behavioral change smuggled into a
//    from-scratch port of `geolocation.py`.

import { mat4, vec3 } from "gl-matrix";
import { EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";
import { getPset } from "./element";
import { getAxis2placement, rotation } from "./placement";
import type { MatrixType } from "./placement";

export type { MatrixType };

/**
 * Python's `HelmertTransformation(NamedTuple)`. See this file's header comment for why
 * this is a plain named interface, not a TS labeled tuple, and how call sites that
 * Python spreads positionally (`*parameters`) instead spell out all nine fields
 * explicitly here.
 */
export interface HelmertTransformation {
	readonly e: number;
	readonly n: number;
	readonly h: number;
	readonly xaa: number;
	readonly xao: number;
	readonly scale: number;
	readonly factorX: number;
	readonly factorY: number;
	readonly factorZ: number;
}

// --- internal helpers (not exported -- pure translation aids, duplicated per
// `util/placement.ts`'s own "small per-module private helpers" convention) ---

/** Python's `getattr(instance, name, None)`. */
function attrOrNull(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return null;
	}
}

/** Python's `x or 0` for a possibly-`null`/`undefined` numeric attribute/dict value. */
function orZero(value: unknown): number {
	return (value as number) || 0;
}

/** Python's `x or 1` for a possibly-`null`/`undefined` numeric attribute/dict value. */
function orOne(value: unknown): number {
	return (value as number) || 1;
}

/**
 * Python's `x.wrappedValue` for a defined-type-wrapped scalar (`IfcRigidOperation
 * .FirstCoordinate`/`.SecondCoordinate`, typed `IfcLengthMeasure`/`IfcPlaneAngleMeasure`)
 * -- see this file's header comment for why this goes through `.getByIndex(0)` (the
 * already-established `util/element.ts` workaround) rather than `.get("wrappedValue")`
 * (a real, pre-existing, disclosed gap for standalone defined-type instances, not
 * something this chunk introduces or needs to re-disclose). A bare (already-unwrapped)
 * primitive passes through unchanged, matching `unwrapSelectValue`'s own defensiveness.
 */
function wrappedValueOf(value: unknown): unknown {
	return value instanceof EntityInstance ? value.getByIndex(0) : value;
}

/**
 * `mat4.invert(out, m)` returns `null` (leaving `out` untouched, e.g. still whatever
 * `mat4.create()`'s identity default was) for a singular (non-invertible) `m`, unlike
 * numpy's `np.linalg.inv`, which raises `LinAlgError: Singular matrix` -- found by this
 * chunk's own `/code-review` pass: every `mat4.invert` call below used to ignore this
 * return value entirely, so a genuinely singular input (e.g. a malformed
 * `IfcMapConversionScaled` with `FactorX`/`FactorY`/`FactorZ` of exactly `0` -- these have
 * no `or 1` falsy-fallback in the real Python source, unlike `Scale`, so a literal `0` is
 * honored verbatim; or a degenerate `IfcAxis2Placement3D`/`IfcGeometricRepresentationContext
 * .WorldCoordinateSystem` whose `Axis`/`RefDirection` are parallel) would have silently
 * produced a plausible-looking identity-based result instead of failing loudly, a strictly
 * worse divergence from Python's own loud failure than reproducing it. This wrapper checks
 * the return value and throws a descriptive error instead, matching Python's own
 * fail-loud behavior for this case (not byte-for-byte the same exception type/message,
 * since there is no TS equivalent of `numpy.linalg.LinAlgError` to reproduce, but the same
 * "don't silently substitute a wrong answer" outcome).
 */
function invertOrThrow(out: MatrixType, m: MatrixType, context: string): MatrixType {
	if (mat4.invert(out, m) === null) {
		throw new Error(
			`${context}: matrix is singular (not invertible) -- numpy's np.linalg.inv would raise LinAlgError here`,
		);
	}
	return out;
}

// --- exact-decimal (BigInt-backed) arithmetic for `dd2dms` -- see header comment ---

/** `value = sign(raw) * |raw| / 10^scale`, i.e. a fixed-point decimal. */
interface Dec {
	readonly raw: bigint;
	readonly scale: number;
}

/** Python's `Decimal(str(x))` -- see header comment for the JS/Python `toString`
 * agreement this relies on. */
/**
 * `x.toString()` switches to exponential notation for `|x| < 1e-6` or `|x| >= 1e21`
 * (e.g. `(1e-7).toString() === "1e-7"`) -- a real gap found by this chunk's own
 * `/code-review` pass: `decFromString` below has no exponent handling at all, so
 * `BigInt("1e-7")` (attempted for such a value) throws `SyntaxError: Cannot convert
 * 1e-7 to a BigInt`, where Python's `Decimal(str(1e-7))` succeeds outright (`Decimal`
 * parses scientific notation natively). `dd2dms` is a general-purpose, publicly exported
 * function -- a sub-microdegree angle (e.g. a tiny grid-convergence correction) is a
 * real, if unusual, input this needs to handle, not just the ordinary-magnitude decimal-
 * degree values every existing test case happens to use. This expands exponential
 * notation into an exact, equivalent plain-decimal digit string (pure string
 * manipulation, no intermediate float arithmetic that could reintroduce the precision
 * loss `Decimal(str(x))` exists to avoid in the first place) before handing it to
 * `decFromString`, which only ever needs to understand plain `[-+]?\d+(\.\d+)?` form.
 */
function numberToPlainDecimalString(x: number): string {
	const s = x.toString();
	const match = /^(-)?(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/.exec(s);
	if (!match) return s; // Already plain (non-exponential) form.
	const [, sign, intPart, fracPart = "", expStr] = match;
	const exponent = Number(expStr);
	const digits = intPart + fracPart;
	// Position of the decimal point within `digits`, counted from the left, after
	// shifting by `exponent` places.
	const pointPos = intPart.length + exponent;
	let plain: string;
	if (pointPos <= 0) {
		plain = `0.${"0".repeat(-pointPos)}${digits}`;
	} else if (pointPos >= digits.length) {
		plain = `${digits}${"0".repeat(pointPos - digits.length)}`;
	} else {
		plain = `${digits.slice(0, pointPos)}.${digits.slice(pointPos)}`;
	}
	return (sign ?? "") + plain;
}

function decFromNumber(x: number): Dec {
	return decFromString(numberToPlainDecimalString(x));
}

function decFromString(s: string): Dec {
	let sign = 1n;
	let str = s;
	if (str.startsWith("-")) {
		sign = -1n;
		str = str.slice(1);
	} else if (str.startsWith("+")) {
		str = str.slice(1);
	}
	const dot = str.indexOf(".");
	let intPart: string;
	let fracPart: string;
	if (dot === -1) {
		intPart = str;
		fracPart = "";
	} else {
		intPart = str.slice(0, dot);
		fracPart = str.slice(dot + 1);
	}
	if (intPart === "") intPart = "0";
	const scale = fracPart.length;
	// `intPart` is never empty at this point (defaulted above), so `intPart + fracPart`
	// is never an empty string -- no `|| "0"` fallback needed for `BigInt(...)` here.
	const digits = BigInt(intPart + fracPart);
	return { raw: sign * digits, scale };
}

/** Exact multiplication by a plain (non-fractional) integer -- exact because `n` itself
 * carries no fractional digits, so the result needs no additional decimal places. */
function decMulInt(d: Dec, n: number): Dec {
	return { raw: d.raw * BigInt(n), scale: d.scale };
}

/** Python's `int(Decimal(...))` -- truncates toward zero. `BigInt` division also
 * truncates toward zero, so this is a direct, exact translation. */
function decTruncToBigInt(d: Dec): bigint {
	const denom = 10n ** BigInt(d.scale);
	return d.raw / denom;
}

/** Exact subtraction of a whole-integer `bigint` (e.g. the truncated degrees/minutes
 * value) from a `Dec`, at that `Dec`'s own scale. */
function decSubBigInt(d: Dec, i: bigint): Dec {
	const denom = 10n ** BigInt(d.scale);
	return { raw: d.raw - i * denom, scale: d.scale };
}

/** Python's `float(Decimal(...))` -- renders the exact decimal digits to a string, then
 * parses that string as a `number` (the same two-step "exact decimal text -> nearest
 * double" path `float(Decimal(...))` itself takes). */
function decToNumber(d: Dec): number {
	const neg = d.raw < 0n;
	const absRaw = neg ? -d.raw : d.raw;
	const digits = absRaw.toString().padStart(d.scale + 1, "0");
	const intPart = digits.slice(0, digits.length - d.scale) || "0";
	const fracPart = d.scale > 0 ? digits.slice(digits.length - d.scale) : "";
	const str = (neg ? "-" : "") + intPart + (fracPart ? `.${fracPart}` : "");
	return Number(str);
}

/** Python's `Decimal(...).quantize(Decimal(1), rounding=ROUND_HALF_UP)` -- round to the
 * nearest whole integer, ties rounding AWAY from zero (NOT `util/unit.ts`'s
 * `pythonRound`, which is ROUND_HALF_EVEN -- see header comment for why these are
 * genuinely different rules, not the same rule reused under two names). */
function decQuantizeHalfUpToInt(d: Dec): bigint {
	const denom = 10n ** BigInt(d.scale);
	const neg = d.raw < 0n;
	const absRaw = neg ? -d.raw : d.raw;
	let q = absRaw / denom;
	const remainder = absRaw - q * denom;
	if (remainder * 2n >= denom) q += 1n;
	return neg ? -q : q;
}

/** Reads a `mat4`'s columns 0/1/2 (the rotation/scale basis vectors, flat indices
 * 0-2/4-6/8-10 -- see `util/placement.ts`'s header comment for this verified flat-index
 * layout) and normalizes each to unit length in place, in the same order as
 * `local2global`/`global2local`'s own `result[:3, i] /= np.linalg.norm(result[:3, i])`
 * for `i` in `0, 1, 2`. */
function normalizeBasisColumns(m: MatrixType): void {
	for (const base of [0, 4, 8] as const) {
		const v = vec3.fromValues(m[base], m[base + 1], m[base + 2]);
		vec3.normalize(v, v);
		m[base] = v[0];
		m[base + 1] = v[1];
		m[base + 2] = v[2];
	}
}

// --- ported functions ---

/**
 * Convert degrees, minutes, and (micro)seconds to decimal degrees
 * (`ifcopenshell.util.geolocation.dms2dd`). All components must be either positive or
 * negative.
 *
 * @param degrees The degrees component
 * @param minutes The minutes component
 * @param seconds The seconds component
 * @param us The microseconds component
 * @returns The angle in decimal degrees.
 */
export function dms2dd(degrees: number, minutes: number, seconds: number, us = 0): number {
	const allPositiveOrZero = degrees >= 0 && minutes >= 0 && seconds >= 0 && us >= 0;
	const allNegativeOrZero = degrees <= 0 && minutes <= 0 && seconds <= 0 && us <= 0;
	// Python: `assert all_positive_or_zero or all_negative_or_zero`.
	if (!(allPositiveOrZero || allNegativeOrZero)) {
		throw new Error("dms2dd: degrees/minutes/seconds/us must all be positive-or-zero, or all negative-or-zero");
	}
	return degrees + minutes / 60.0 + seconds / 3600.0 + us / 3600000000.0;
}

/**
 * Convert decimal degrees to degrees, minutes, and (micro)seconds format
 * (`ifcopenshell.util.geolocation.dd2dms`).
 *
 * The tuple follows the format of `IfcCompoundPlaneAngleMeasure` -- namely, all of its
 * components are either positive or negative.
 *
 * @param dd The decimal degrees
 * @param useUs True to include microseconds (returning a 4-tuple), false (default) for
 *   a 3-tuple with a float seconds component.
 * @returns Either `[degrees, minutes, seconds, microseconds]` (all integers) or
 *   `[degrees, minutes, seconds]` (`seconds` a float).
 */
export function dd2dms(
	dd: number,
	useUs = false,
): readonly [number, number, number] | readonly [number, number, number, number] {
	const ddDecimal = decFromNumber(dd);
	const degrees = decTruncToBigInt(ddDecimal);
	const fractionalPart = decSubBigInt(ddDecimal, degrees);

	const minutesDecimal = decMulInt(fractionalPart, 60);
	const minutes = decTruncToBigInt(minutesDecimal);

	const secondsDecimal = decMulInt(decSubBigInt(minutesDecimal, minutes), 60);

	if (useUs) {
		const seconds = decTruncToBigInt(secondsDecimal);
		const microsecondsDecimal = decMulInt(decSubBigInt(secondsDecimal, seconds), 1000000);
		const microseconds = decQuantizeHalfUpToInt(microsecondsDecimal);
		return [Number(degrees), Number(minutes), Number(seconds), Number(microseconds)] as const;
	}
	const secondsFloat = decToNumber(secondsDecimal);
	return [Number(degrees), Number(minutes), secondsFloat] as const;
}

/**
 * Manually convert local XYZ coordinates to map eastings, northings, and height
 * (`ifcopenshell.util.geolocation.xyz2enh`).
 *
 * This function is for advanced users as it allows you to specify your own helmert
 * transformation parameters (i.e. those typically stored in `IfcMapConversion`). For
 * most scenarios you should use {@link autoXyz2enh} instead.
 *
 * @returns A tuple of three ordinates representing the easting, northing and height.
 */
export function xyz2enh(
	x: number,
	y: number,
	z: number,
	eastings = 0.0,
	northings = 0.0,
	orthogonalHeight = 0.0,
	xAxisAbscissa = 1.0,
	xAxisOrdinate = 0.0,
	scale = 1.0,
	factorX = 1.0,
	factorY = 1.0,
	factorZ = 1.0,
): readonly [number, number, number] {
	const theta = Math.atan2(xAxisOrdinate, xAxisAbscissa);
	const e = scale * factorX * Math.cos(theta) * x - scale * factorY * Math.sin(theta) * y + eastings;
	const n = scale * factorX * Math.sin(theta) * x + scale * factorY * Math.cos(theta) * y + northings;
	const h = scale * factorZ * z + orthogonalHeight;
	return [e, n, h];
}

/**
 * Convert from local XYZ coordinates to global map coordinate eastings, northings, and
 * heights (`ifcopenshell.util.geolocation.auto_xyz2enh`).
 *
 * The necessary georeferencing map conversion is automatically detected from the IFC map
 * conversion parameters present in the IFC model. If no map conversion is present, then
 * the coordinates are returned unchanged.
 *
 * @param x/y/z The local engineering coordinate provided in project length units.
 * @param shouldReturnInMapUnits If true, the result is given in map units. If false, the
 *   result will be converted back into project units.
 */
export function autoXyz2enh(
	ifcFile: IfcFile,
	x: number,
	y: number,
	z: number,
	shouldReturnInMapUnits = true,
): readonly [number, number, number] {
	const parameters = getHelmertTransformationParameters(ifcFile);
	if (!parameters) return [x, y, z];

	let lx = x;
	let ly = y;
	let lz = z;
	const wcs = getWcs(ifcFile);
	if (wcs !== null) {
		const inv = invertOrThrow(mat4.create(), wcs, "autoXyz2enh: WCS");
		const out = vec3.create();
		vec3.transformMat4(out, [x, y, z], inv);
		[lx, ly, lz] = out;
	}

	const enh = xyz2enh(
		lx,
		ly,
		lz,
		parameters.e,
		parameters.n,
		parameters.h,
		parameters.xaa,
		parameters.xao,
		parameters.scale,
		parameters.factorX,
		parameters.factorY,
		parameters.factorZ,
	);
	if (shouldReturnInMapUnits) return enh;
	return [enh[0] / parameters.scale, enh[1] / parameters.scale, enh[2] / parameters.scale];
}

/**
 * Convert from global map coordinate eastings, northings, and heights to local XYZ
 * coordinates (`ifcopenshell.util.geolocation.auto_enh2xyz`).
 *
 * The necessary georeferencing map conversion is automatically detected from the IFC map
 * conversion parameters present in the IFC model. If no map conversion is present, then
 * the coordinates are returned unchanged.
 *
 * @param isSpecifiedInMapUnits True if the input eastings, northing, and height are in
 *   map units.
 */
export function autoEnh2xyz(
	ifcFile: IfcFile,
	easting: number,
	northing: number,
	height: number,
	isSpecifiedInMapUnits = true,
): readonly [number, number, number] {
	const parameters = getHelmertTransformationParameters(ifcFile);
	if (!parameters) return [easting, northing, height];

	let e = easting;
	let n = northing;
	let h = height;
	if (!isSpecifiedInMapUnits) {
		e *= parameters.scale;
		n *= parameters.scale;
		h *= parameters.scale;
	}

	let xyz = enh2xyz(
		e,
		n,
		h,
		parameters.e,
		parameters.n,
		parameters.h,
		parameters.xaa,
		parameters.xao,
		parameters.scale,
		parameters.factorX,
		parameters.factorY,
		parameters.factorZ,
	);

	const wcs = getWcs(ifcFile);
	if (wcs !== null) {
		const out = vec3.create();
		vec3.transformMat4(out, [xyz[0], xyz[1], xyz[2]], wcs);
		xyz = [out[0], out[1], out[2]];
	}
	return xyz;
}

/**
 * Retrieves the parameters of a helmert transformation that represents a coordinate
 * operation (`ifcopenshell.util.geolocation.get_helmert_transformation_parameters`).
 *
 * This coordinate operation is typically what is used to convert between local
 * engineering coordinates and map coordinates.
 *
 * @param ifcFile The IFC model, typically containing an `IfcCoordinateOperation` such as
 *   an `IfcMapConversion`.
 * @returns The parameters of the transformation, or `null` if none is present.
 */
export function getHelmertTransformationParameters(ifcFile: IfcFile): HelmertTransformation | null {
	let e: number;
	let n: number;
	let h: number;
	let xaa: number;
	let xao: number;
	let scale: number;
	let factorX: number;
	let factorY: number;
	let factorZ: number;

	if (ifcFile.schema === "IFC2X3") {
		const project = ifcFile.byType("IfcProject")[0];
		const conversion = getPset(project, "ePSet_MapConversion") as Record<string, unknown> | null;
		if (!conversion) return null;
		e = orZero(conversion.Eastings);
		n = orZero(conversion.Northings);
		h = orZero(conversion.OrthogonalHeight);
		xaa = orZero(conversion.XAxisAbscissa);
		xao = orZero(conversion.XAxisOrdinate);
		scale = orOne(conversion.Scale);
		factorX = factorY = factorZ = 1;
	} else {
		const conversions = ifcFile.byType("IfcCoordinateOperation");
		if (!conversions.length) return null;
		const conversion = conversions[0];

		if (conversion.isA("IfcMapConversion")) {
			e = orZero(attrOrNull(conversion, "Eastings"));
			n = orZero(attrOrNull(conversion, "Northings"));
			h = orZero(attrOrNull(conversion, "OrthogonalHeight"));
			xaa = orZero(attrOrNull(conversion, "XAxisAbscissa"));
			xao = orZero(attrOrNull(conversion, "XAxisOrdinate"));
			scale = orOne(attrOrNull(conversion, "Scale"));
			// `IfcMapConversionScaled` is IFC4X3-only -- see header comment.
			if (conversion.isA() === "IfcMapConversionScaled") {
				factorX = conversion.get("FactorX") as number;
				factorY = conversion.get("FactorY") as number;
				factorZ = conversion.get("FactorZ") as number;
			} else {
				factorX = factorY = factorZ = 1;
			}
		} else if (conversion.isA() === "IfcRigidOperation") {
			// `IfcRigidOperation` is IFC4X3-only -- see header comment. `wrappedValueOf`
			// covers the `.wrappedValue` access -- see this file's header comment.
			e = wrappedValueOf(conversion.get("FirstCoordinate")) as number;
			n = wrappedValueOf(conversion.get("SecondCoordinate")) as number;
			h = orZero(attrOrNull(conversion, "Height"));
			xaa = 1.0;
			xao = 0.0;
			scale = factorX = factorY = factorZ = 1;
		} else {
			// Python: `assert False, conversion` -- an `IfcCoordinateOperation` that is
			// neither an `IfcMapConversion` (nor its `IfcMapConversionScaled` subtype)
			// nor an `IfcRigidOperation`, which the real EXPRESS schema does not
			// currently permit (both are declared as `IfcCoordinateOperation`'s only
			// subtypes) -- reproduced as an unconditional throw naming the real class,
			// matching Python's own unconditional assertion failure here.
			throw new Error(
				`getHelmertTransformationParameters: unexpected IfcCoordinateOperation subtype '${conversion.isA()}'`,
			);
		}
	}

	if (!xaa && !xao) {
		xaa = 1.0;
		xao = 0.0;
	}

	return { e, n, h, xaa, xao, scale, factorX, factorY, factorZ };
}

/**
 * Get CRS information from an IFC file (`ifcopenshell.util.geolocation.get_crs`).
 *
 * @returns The `IfcProjectedCRS`/`IfcCoordinateReferenceSystem`'s info dict (via
 *   `.getInfo()`), or `null` if no georeferencing/coordinate operation is present.
 */
export function getCrs(ifcFile: IfcFile): Record<string, unknown> | null {
	if (ifcFile.schema === "IFC2X3") {
		return getPset(ifcFile.byType("IfcProject")[0], "ePSet_ProjectedCRS") as Record<string, unknown> | null;
	}
	for (const context of ifcFile.byType("IfcGeometricRepresentationContext", false)) {
		// `HasCoordinateOperation` is an INVERSE attribute (`IfcCoordinateOperation
		// .SourceCRS`'s inverse) -- not declared in the generated `.d.ts` files (those
		// only cover forward attributes, confirmed by this chunk's own header-comment
		// investigation), so read generically via `.get()` and handle either an array
		// (the expected shape for a SET-typed inverse) or, defensively, a single
		// unpacked entity (in case this port's own inverse-unpacking settings ever
		// treat this particular attribute as to-one) -- either way, "the first/only
		// referencing `IfcCoordinateOperation`" is what Python's own `operation[0]`
		// means here.
		const raw = attrOrNull(context, "HasCoordinateOperation");
		const operations = Array.isArray(raw) ? raw : raw ? [raw as EntityInstance] : [];
		if (operations.length) {
			return (operations[0].get("TargetCRS") as EntityInstance).getInfo();
		}
	}
	return null;
}

/**
 * Convert a Z coordinate to an elevation using model georeferencing data
 * (`ifcopenshell.util.geolocation.auto_z2e`).
 *
 * The necessary georeferencing map conversion is automatically detected from the IFC map
 * conversion parameters present in the IFC model. If no map conversion is present, then
 * the Z coordinate is returned unchanged.
 */
export function autoZ2e(ifcFile: IfcFile, z: number, shouldReturnInMapUnits = true): number {
	const parameters = getHelmertTransformationParameters(ifcFile);
	if (!parameters) return z;
	const e = z2e(z, parameters.h, parameters.scale, parameters.factorZ);
	if (shouldReturnInMapUnits) return e;
	return e / parameters.scale;
}

/**
 * Manually convert a Z coordinate to a map elevation
 * (`ifcopenshell.util.geolocation.z2e`). For most scenarios you should use
 * {@link autoZ2e} instead.
 */
export function z2e(z: number, orthogonalHeight = 0.0, scale = 1.0, factorZ = 1.0): number {
	return scale * factorZ * z + orthogonalHeight;
}

/**
 * Manually convert map eastings, northings, and height to local XYZ coordinates
 * (`ifcopenshell.util.geolocation.enh2xyz`). For most scenarios you should use
 * {@link autoEnh2xyz} instead.
 *
 * @returns A tuple of three ordinates representing XYZ.
 */
export function enh2xyz(
	e: number,
	n: number,
	h: number,
	eastings = 0.0,
	northings = 0.0,
	orthogonalHeight = 0,
	xAxisAbscissa = 1.0,
	xAxisOrdinate = 0.0,
	scale = 1.0,
	factorX = 1.0,
	factorY = 1.0,
	factorZ = 1.0,
): readonly [number, number, number] {
	const theta = Math.atan2(xAxisOrdinate, xAxisAbscissa);
	const sint = Math.sin(theta);
	const cost = Math.cos(theta);
	const x = ((e - eastings) * cost + (n - northings) * sint) / (scale * factorX);
	const y = ((eastings - e) * sint + (n - northings) * cost) / (scale * factorY);
	const z = (h - orthogonalHeight) / scale / factorZ;
	return [x, y, z];
}

/**
 * Manually convert a 4x4 matrix from local to global coordinates
 * (`ifcopenshell.util.geolocation.local2global`). For most scenarios you should use
 * {@link autoLocal2global} instead. See this file's header comment for the composition-
 * order verification methodology.
 */
export function local2global(
	matrix: MatrixType,
	eastings = 0.0,
	northings = 0.0,
	orthogonalHeight = 0.0,
	xAxisAbscissa = 1.0,
	xAxisOrdinate = 0.0,
	scale = 1.0,
	factorX = 1.0,
	factorY = 1.0,
	factorZ = 1.0,
): MatrixType {
	const theta = Math.atan2(xAxisOrdinate, xAxisAbscissa);
	const scaleAndFactorMatrix = mat4.create();
	mat4.fromScaling(scaleAndFactorMatrix, [scale * factorX, scale * factorY, scale * factorZ]);
	// `rotation()` (util/placement.ts) with `isDegrees=false` builds exactly numpy's
	// `[[cos,-sin,0,0],[sin,cos,0,0],[0,0,1,0],[0,0,0,1]]` for a Z rotation -- see
	// header comment.
	const rotationMatrix = rotation(theta, "Z", false);

	// numpy: `rotation_matrix @ scale_and_factor_matrix @ matrix`.
	const rs = mat4.create();
	mat4.multiply(rs, rotationMatrix, scaleAndFactorMatrix);
	const result = mat4.create();
	mat4.multiply(result, rs, matrix);

	normalizeBasisColumns(result);

	result[12] += eastings;
	result[13] += northings;
	result[14] += orthogonalHeight;
	return result;
}

/**
 * Convert a local matrix to a global map matrix
 * (`ifcopenshell.util.geolocation.auto_local2global`).
 *
 * The necessary georeferencing map conversion is automatically detected from the IFC map
 * conversion parameters present in the IFC model. If no map conversion is present, then
 * the matrix is returned unchanged.
 */
export function autoLocal2global(ifcFile: IfcFile, matrix: MatrixType, shouldReturnInMapUnits = true): MatrixType {
	const parameters = getHelmertTransformationParameters(ifcFile);
	if (!parameters) return mat4.clone(matrix);

	let m: MatrixType = matrix;
	const wcs = getWcs(ifcFile);
	if (wcs !== null) {
		const inv = invertOrThrow(mat4.create(), wcs, "autoLocal2global: WCS");
		const combined = mat4.create();
		mat4.multiply(combined, inv, matrix);
		m = combined;
	}

	const result = local2global(
		m,
		parameters.e,
		parameters.n,
		parameters.h,
		parameters.xaa,
		parameters.xao,
		parameters.scale,
		parameters.factorX,
		parameters.factorY,
		parameters.factorZ,
	);
	if (shouldReturnInMapUnits) return result;
	result[12] /= parameters.scale;
	result[13] /= parameters.scale;
	result[14] /= parameters.scale;
	return result;
}

/**
 * Manually convert a 4x4 matrix from global to local coordinates
 * (`ifcopenshell.util.geolocation.global2local`). See this file's header comment for the
 * composition-order verification methodology.
 */
export function global2local(
	matrix: MatrixType,
	eastings = 0.0,
	northings = 0.0,
	orthogonalHeight = 0.0,
	xAxisAbscissa = 1.0,
	xAxisOrdinate = 0.0,
	scale = 1.0,
	factorX = 1.0,
	factorY = 1.0,
	factorZ = 1.0,
): MatrixType {
	const theta = Math.atan2(xAxisOrdinate, xAxisAbscissa);
	const scaleAndFactorMatrix = mat4.create();
	mat4.fromScaling(scaleAndFactorMatrix, [scale * factorX, scale * factorY, scale * factorZ]);
	const rotationMatrix = rotation(theta, "Z", false);

	// Python: `result = matrix.copy()` -- an independent copy, the input `matrix` is
	// never mutated (`mat4.clone`, not an alias).
	const result = mat4.clone(matrix);
	result[12] -= eastings;
	result[13] -= northings;
	result[14] -= orthogonalHeight;

	// numpy: `np.linalg.inv(scale_and_factor_matrix) @ np.linalg.inv(rotation_matrix) @ result`.
	const invScale = invertOrThrow(mat4.create(), scaleAndFactorMatrix, "global2local: scale/factor matrix");
	// A pure rotation matrix's determinant is always +/-1 (never singular), but inverted
	// via the same checked helper for consistency/defense-in-depth rather than assuming
	// `rotation()`'s output can never be pathological.
	const invRotation = invertOrThrow(mat4.create(), rotationMatrix, "global2local: rotation matrix");
	const sr = mat4.create();
	mat4.multiply(sr, invScale, invRotation);
	const out = mat4.create();
	mat4.multiply(out, sr, result);

	normalizeBasisColumns(out);
	return out;
}

/**
 * Convert a global map matrix to a local matrix
 * (`ifcopenshell.util.geolocation.auto_global2local`).
 *
 * The necessary georeferencing map conversion is automatically detected from the IFC map
 * conversion parameters present in the IFC model. If no map conversion is present, then
 * the matrix is returned unchanged.
 */
export function autoGlobal2local(ifcFile: IfcFile, matrix: MatrixType, isSpecifiedInMapUnits = true): MatrixType {
	const parameters = getHelmertTransformationParameters(ifcFile);
	if (!parameters) return mat4.clone(matrix);

	let m = matrix;
	if (!isSpecifiedInMapUnits) {
		m = mat4.clone(matrix);
		m[12] *= parameters.scale;
		m[13] *= parameters.scale;
		m[14] *= parameters.scale;
	}

	const result = global2local(
		m,
		parameters.e,
		parameters.n,
		parameters.h,
		parameters.xaa,
		parameters.xao,
		parameters.scale,
		parameters.factorX,
		parameters.factorY,
		parameters.factorZ,
	);

	const wcs = getWcs(ifcFile);
	if (wcs !== null) {
		const out = mat4.create();
		mat4.multiply(out, wcs, result);
		return out;
	}
	return result;
}

/**
 * Converts X axis abscissa and ordinates to an angle in decimal degrees
 * (`ifcopenshell.util.geolocation.xaxis2angle`).
 *
 * The X axis abscissa and ordinate is how IFC stores grid north. This X axis vector
 * indicates "where is project east, if grid north is up the page?". The angle indicates
 * "how do I rotate project east to get to grid east?" (equivalently, "...project north
 * to grid north?"). Positive angles are anticlockwise.
 */
export function xaxis2angle(x: number, y: number): number {
	return ((Math.atan2(y, x) * 180) / Math.PI) * -1;
}

/**
 * Converts Y axis abscissa and ordinates to an angle in decimal degrees
 * (`ifcopenshell.util.geolocation.yaxis2angle`).
 *
 * The Y axis abscissa and ordinate is how IFC stores true north. This Y axis vector
 * indicates "where is true north, if project north is up the page?". The angle indicates
 * "how do I rotate project north to get to true north?". Positive angles are
 * anticlockwise.
 */
export function yaxis2angle(x: number, y: number): number {
	let angle = (Math.atan2(y, x) * 180) / Math.PI - 90;
	if (angle < -180) angle += 360;
	else if (angle > 180) angle -= 360;
	return angle;
}

/**
 * Get an angle pointing to map grid north (`ifcopenshell.util.geolocation.get_grid_north`).
 * Anticlockwise is positive.
 *
 * The necessary georeferencing map conversion is automatically detected from the IFC map
 * conversion parameters present in the IFC model. If no map conversion is present, `0`
 * is returned.
 */
export function getGridNorth(ifcFile: IfcFile): number {
	const parameters = getHelmertTransformationParameters(ifcFile);
	if (!parameters) return 0;
	return xaxis2angle(parameters.xaa, parameters.xao);
}

/**
 * Get an angle pointing to global true north
 * (`ifcopenshell.util.geolocation.get_true_north`). Anticlockwise is positive.
 *
 * Always remember that true north is not a constant! This true north is only a
 * reference value useful for things like solar analysis on small sites (<1km). If
 * you're after the north your surveyor is using, you're probably after
 * {@link getGridNorth} instead.
 */
export function getTrueNorth(ifcFile: IfcFile): number {
	try {
		for (const context of ifcFile.byType("IfcGeometricRepresentationContext", false)) {
			const trueNorth = attrOrNull(context, "TrueNorth") as EntityInstance | null;
			if (trueNorth) {
				const ratios = trueNorth.get("DirectionRatios") as number[];
				return yaxis2angle(ratios[0], ratios[1]);
			}
		}
	} catch {
		return 0;
	}
	return 0;
}

/**
 * Converts an angle into an X axis abscissa and ordinate
 * (`ifcopenshell.util.geolocation.angle2xaxis`). The inverse of {@link xaxis2angle}.
 *
 * @param angle The angle in decimal degrees where anticlockwise is positive.
 */
export function angle2xaxis(angle: number): readonly [number, number] {
	const angleRad = (angle * Math.PI) / 180;
	return [Math.cos(angleRad), -Math.sin(angleRad)];
}

/**
 * Converts an angle into a Y axis abscissa and ordinate
 * (`ifcopenshell.util.geolocation.angle2yaxis`). The inverse of {@link yaxis2angle}.
 *
 * @param angle The angle in decimal degrees where anticlockwise is positive.
 */
export function angle2yaxis(angle: number): readonly [number, number] {
	const angleRad = (angle * Math.PI) / 180;
	return [-Math.sin(angleRad), Math.cos(angleRad)];
}

/**
 * Gets the WCS (prioritising 3D contexts) as a matrix
 * (`ifcopenshell.util.geolocation.get_wcs`).
 *
 * @returns A 4x4 matrix in project units, or `null` if the file has no
 *   `IfcGeometricRepresentationContext` at all.
 */
export function getWcs(ifcFile: IfcFile): MatrixType | null {
	let wcs: EntityInstance | null = null;
	for (const context of ifcFile.byType("IfcGeometricRepresentationContext", false)) {
		wcs = context.get("WorldCoordinateSystem") as EntityInstance;
		if ((attrOrNull(context, "ContextType") as string | null) === "Model") break;
	}
	if (wcs) {
		return getAxis2placement(wcs);
	}
	return null;
}
