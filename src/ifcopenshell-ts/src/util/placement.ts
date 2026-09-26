// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/placement.py` (src/ifcopenshell-python, 241
// lines, 7 functions) -- the first Phase 4 ("`util` Tier B") chunk in this project.
// `planning/ifcopenshell-ts/research/03-python-util-inventory.md`'s Porting priority
// section and `planning/ifcopenshell-ts/PROGRESS.md`'s Phase 4 table both name this as
// the #3 near-term `util` Tier B priority, and both explicitly name `gl-matrix` as the
// intended TS mapping for this module's numpy-based 4x4 matrix math -- a real,
// already-made project decision (not re-litigated here). `gl-matrix@3.4.4` is added as
// this project's first and only current *runtime* npm dependency beyond the native
// addon itself (every prior chunk, e.g. `selector.ts`'s key-path/`format()` grammars,
// correctly avoided a new dependency for a small hand-rollable parser -- this is
// different: real numerical linear algebra, not a parser, matching the "flag before
// adding a new dependency" convention this project otherwise follows). Pinned to an
// exact version (`"3.4.4"`, not `^3.4.4`) in `package.json`'s real `dependencies`
// (not `devDependencies`), per this chunk's task brief.
//
// Ported in full: `a2p`, `get_axis2placement` (as `getAxis2placement`),
// `get_local_placement` (as `getLocalPlacement`),
// `get_cartesiantransformationoperator3d` (as `getCartesiantransformationoperator3d`),
// `get_mappeditem_transformation` (as `getMappeditemTransformation`),
// `get_storey_elevation` (as `getStoreyElevation`), `rotation`.
//
// **Discrepancy vs. this chunk's own task brief, disclosed**: the brief's "orientation
// only" description mentioned "matrix decomposition (extracting translation/rotation/
// scale from a matrix) and construction (building a placement entity from a matrix)
// helpers" as part of this module. Reading the real 241-line source in full (as
// instructed) found no such functions anywhere in `placement.py` -- decomposition/
// construction-from-matrix logic (`edit_object_placement`) lives in
// `ifcopenshell.api.geometry`, a separate, much-later-phase module
// (`test/api/geometry/test_edit_object_placement.py`, not `test/util/test_placement.py`
// -- confirmed by reading both). Nothing is skipped here as a result; every function
// `util/placement.py` actually declares is ported below.
//
// *** The numpy -> gl-matrix mapping, and how row-major/column-major + composition
// order were verified (not assumed) ***
//
// numpy's `a2p(o, z, x)` builds (after its own internal `.T` transpose) a matrix whose
// *columns* are the local X/Y/Z basis vectors and the origin (`get_local_placement`'s
// own docstring spells this out: column 0 is `x_x,x_y,x_z,0`, column 3 is
// `x,y,z,1.0`). gl-matrix's `mat4` is *also* column-major, with translation stored at
// flat indices 12/13/14 (`mat4.fromTranslation`'s own well-known behavior) -- so the
// two libraries' *conceptual* layouts already agree; the risk this chunk's brief flagged
// (a naive element-by-element copy silently transposing) turned out to be a non-issue
// for this specific case, but was verified empirically rather than assumed either way,
// using a disposable Node script (`gl-matrix@3.4.4` installed locally, not committed)
// exercising the real library, not just its documentation:
// - `mat4.fromValues(m00,m01,...,m33)`/`mat4.set` write their 16 arguments into the flat
//   array in the exact same literal order given (`out[i] = argI`) -- i.e. NOT a
//   row-major-to-column-major transpose the way some other libraries' constructors work.
//   Confirmed with 16 distinct values (1..16): `fromValues(1,2,...,16)` produces the flat
//   array `[1,2,...,16]` verbatim, and `mat4.getTranslation` on it reads back `[13,14,15]`
//   (the *last* 4-tuple of arguments, at flat indices 12-14) -- so building `a2p`'s result
//   as raw flat-index assignment (`out[0..2]=x`, `out[4..6]=y`, `out[8..10]=z`,
//   `out[12..14]=o`, matching indices 3/7/11=0 and 15=1) is the direct, unambiguous,
//   verified encoding of numpy's `a2p` output -- not a guess from the docstring alone.
// - `mat4.multiply(out, A, B)` was confirmed to compose exactly like numpy's `A @ B`
//   (translate-by-B-then-A, i.e. `B` applies to the point first): composing a
//   translate-(1,0,0) matrix with a translate-(0,1,0) matrix via `mat4.multiply(out, A,
//   B)` and reading `out`'s translation back gives `(1,1,0)`, matching what `np.dot(A,
//   B)` would give for the same two matrices. This directly confirms
//   `get_local_placement`'s `np.dot(parent, get_axis2placement(...))` maps to
//   `mat4.multiply(out, parent, local)` (parent first arg, local second -- getting this
//   backwards is exactly the "easiest thing to get backwards" risk the brief called out;
//   verified, not assumed).
// - `mat4.fromXRotation`/`fromYRotation`/`fromZRotation` were each checked against a
//   concrete rotated-point example matching numpy's own `rotation()` matrix formulas for
//   all three axes (e.g. `fromZRotation(90deg)` rotates `(1,0,0)` to `(0,1,0)`, matching
//   numpy's Z-rotation matrix applied to the same point) -- confirmed identical, so
//   `rotation()` below delegates to these directly rather than hand-writing the 16
//   matrix entries per axis (safer and shorter than re-deriving the sin/cos layout by
//   hand, now that the underlying primitives are confirmed correct).
// - `mat4.scale(out, m, [sx, sy, sz])` was confirmed to scale exactly columns 0/1/2 of
//   `m` (leaving column 3, the translation, untouched) -- the exact operation numpy's
//   `get_cartesiantransformationoperator3d` performs via `m4.T[0] *= scale1` / `m4.T[1]
//   *= scale2` / `m4.T[2] *= scale3` (`m4.T[i]` is row `i` of the transpose, i.e. column
//   `i` of `m4` itself). Confirmed with a translated base matrix + non-uniform scale
//   `[2,3,4]`: the translation column survived unscaled, and columns 0-2 scaled exactly
//   as expected.
//
// *** A second, real, disclosed finding: gl-matrix defaults to `Float32Array` storage,
// which is NOT numpy-float64-equivalent and would silently lose real precision ***
//
// `gl-matrix`'s `ARRAY_TYPE` (`common.js`) defaults to `Float32Array` when available
// (only falling back to a plain `Array` -- itself IEEE-754-double, i.e. numpy-float64-
// equivalent -- in an environment with no typed arrays at all). This is a real, verified
// correctness hazard for this specific domain: IFC coordinates are frequently real-world
// survey/geolocated values (UTM easting/northing in the millions of units), and
// `Float32Array` only carries ~7 significant decimal digits. Verified empirically: a
// translation component of `6543210.123456789` (a plausible northing) round-trips through
// a default-`Float32Array` `mat4` as `6543210` -- a ~0.12-unit (e.g. 12cm at meter units)
// silent precision loss, reproduced with the real library, not a theoretical concern.
// Switching to `Float64Array` (`glMatrix.setMatrixArrayType(Float64Array)`, called once
// at this module's load time, matching how `gl-matrix` itself designed this API to be
// used) round-trips that exact same value with zero loss. This is a *global* mutation of
// `gl-matrix`'s shared module state (affects every `mat4`/`mat3`/`vec3`/`vec4` created via
// its factory functions from any code sharing this Node process's module cache, not just
// this file) -- correct and intentional here, since this port has exactly one module
// using `gl-matrix` today and numpy-float64-equivalent precision is the only correct
// choice for IFC geometry; flagged here in case a much later chunk ever wants
// `Float32Array` for a genuinely different (e.g. GPU-buffer-facing) use case and needs to
// know this module already claimed the global default.
//
// *** Three real, narrow Python-parity findings, all confirmed by reading the exact
// source lines, not assumed from context -- two preserved verbatim, one deliberately
// NOT reproduced (found by this chunk's own `/code-review` pass, fixed before shipping)
// ***
//
// 1. `get_cartesiantransformationoperator3d`'s `Scale`/`Scale2`/`Scale3` handling uses
//    two *different* null-check styles for what looks like the same kind of value:
//    `if inst.Scale:` (Python truthy -- a `Scale` of exactly `0.0` is treated as *unset*,
//    falling back to the default of `1.0`, not an intentional zero-scale) for `Scale1`,
//    but `inst.Scale2 if inst.Scale2 is not None else scale1` (explicit `is not None` --
//    a `Scale2`/`Scale3` of exactly `0.0` *is* honored as a real zero scale) for
//    `Scale2`/`Scale3`. Reproduced exactly: `scale1` below uses a truthy `if (scale)`
//    check (`0`/`null`/`undefined` all fall through to the `1.0` default, matching
//    Python's `0.0`-is-falsy), `scale2`/`scale3` use an explicit `!= null` check.
// 2. `get_mappeditem_transformation` has no `else` branch for a non-3D
//    `MappingTarget` (Python's own inline `# TODO 2d` comment acknowledges this as an
//    already-known upstream gap, not something introduced by this port) -- the function
//    implicitly returns Python `None` in that case. Ported as `MatrixType | null`,
//    returning `null` for the same case, rather than "completing" the 2D path Python
//    itself hasn't implemented.
// 3. **NOT reproduced, by deliberate choice**: `rotation`'s Python source has no
//    trailing `else` on its X/Y/Z `if`/`elif` chain (placement.py:219-240), so an
//    `axis` value outside `"X"`/`"Y"`/`"Z"` implicitly returns `None` there. An earlier
//    draft of `rotation` below matched this by leaving `out` as the freshly-created
//    identity matrix and falling through -- caught by this chunk's own `/code-review`
//    pass as a *worse* divergence than Python's own behavior: silently returning a
//    plausible-looking identity matrix is more dangerous than Python's falsy `None`
//    (which a caller checking truthiness would catch). `rotation` now throws a
//    descriptive error for this case instead -- reachable only via a TS type-system
//    bypass (`axis`'s real type, `"X" | "Y" | "Z"`, makes this branch statically
//    unreachable for any type-checked caller), so this is low-impact in practice, but
//    is a real, deliberate, disclosed divergence from Python's own implicit-`None`
//    return, not an oversight.
//
// *** One real, disclosed, narrow primitive-layer gap, investigated against the actual
// Python source before concluding it's genuine (not assumed) ***
//
// `get_axis2placement`'s `IfcAxis2Placement3D`/`IfcAxis2PlacementLinear` branch has a
// fallback path, taken only when `placement.Location` has no `Coordinates` attribute at
// all (true for `IfcAxis2PlacementLinear.Location`, typed `IfcPointByDistanceExpression`
// -- an IFC4X3+ alignment-referenced point with no direct Cartesian coordinates; never
// true for `IfcAxis2Placement3D.Location`, always a plain `IfcCartesianPoint`, which
// always has `Coordinates`). Python's fallback calls `ifcopenshell.geom.create_shape`
// (the native OpenCASCADE-backed geometry kernel) to resolve the point's real-world
// coordinates. This TS port has no `ifcopenshell.geom` binding at all yet (confirmed:
// no `geom`-named module anywhere under `src/`, and no native geometry-kernel primitive
// in `src/native/ifcopenshell_native.ts`) -- a genuine, narrow, cross-module hard
// blocker in the same category as `TODOS.md`'s existing `convert_file_length_units`/
// `util.selector`'s positional-key entries, not something to silently drop or fake.
// `getAxis2placement` below throws a clear, descriptive error naming the real gap
// (`ifcopenshell.geom` not ported) only when this exact branch is actually reached
// (i.e. only for a real `IfcAxis2PlacementLinear` whose `Location` genuinely has no
// `Coordinates` -- every other call, including every `IfcAxis2Placement3D` call and
// every `IfcAxis2Placement2D`/`IfcAxis1Placement` call, is unaffected and fully
// functional). Also noted in `TODOS.md`. `IfcAxis2PlacementLinear` is an IFC4X3-only
// EXPRESS type (alignment/linear-referencing), so this cannot be exercised at all under
// CI's current `SCHEMA_VERSIONS=4` (IFC4-only) build -- consistent with this project's
// established `AVAILABLE_SCHEMAS` skip-guard convention for schema-version-dependent
// test coverage.
//
// No other disclosed gap: every other function/branch here is a direct, faithful,
// fully-functional port with real, numerically-verified test coverage (see
// `test/util/placement.test.ts`'s own header comment for what was ported from
// `test/util/test_placement.py` verbatim vs. added new, including a from-scratch,
// multi-level, non-trivial nested-placement-hierarchy test built specifically to catch
// a composition-order or row/column-major regression, per this chunk's own task brief).
//
// *** This PR also touches `util/selector.ts` (a cross-module fix, caught by this
// chunk's own `/code-review` pass): *** landing `getLocalPlacement` here made
// `selector.ts`'s pre-existing `x`/`y`/`z` key-path blocker stale/misleading -- its
// error message still claimed `ifcopenshell.util.placement.get_local_placement` itself
// "is not ported yet," which became false the moment this file merged. `selector.ts`'s
// `x`/`y`/`z` keys are now wired to this file's real `getLocalPlacement`;
// `easting`/`northing`/`elevation`/`rotation_x`/`rotation_y`/`rotation_z` remain
// genuinely blocked there (need the still-unported `util.geolocation`/
// `util.shape_builder`). See `selector.ts`'s own header comment (finding #1, updated)
// and `TODOS.md`'s updated entry for the full story.

import { glMatrix, mat4, vec3 } from "gl-matrix";
import type { EntityInstance } from "../entityInstance";

// Force numpy-float64-equivalent double precision globally for every `gl-matrix`
// factory function (`mat4.create`/`vec3.create`/etc.) -- see this file's header comment
// (the `Float32Array`-precision-loss finding) for why this is necessary and why it is a
// deliberate, disclosed *global* side effect of importing this module. The cast below
// works around a real, narrow gap in `gl-matrix@3.4.4`'s own bundled `.d.ts`:
// `setMatrixArrayType`'s TS signature only declares
// `Float32ArrayConstructor | ArrayConstructor`, even though the real JS implementation
// (`common.js`'s `setMatrixArrayType`) accepts any array-like constructor and was
// verified (see header comment) to work correctly with `Float64Array` at runtime --
// this is a typings-only omission, not a real runtime restriction.
glMatrix.setMatrixArrayType(Float64Array as unknown as Float32ArrayConstructor);

/** Python's `MatrixType = npt.NDArray[np.float64]` -- a 4x4 (or, for `a2p`'s 2D
 * callers, still 4x4; IFC's own right-handed-3D convention means `a2p` is never
 * actually asked to build a 3x3) homogeneous transformation matrix, `gl-matrix`'s
 * column-major flat `mat4` layout (see header comment for the verified mapping). */
export type MatrixType = mat4;

// --- internal helpers (not exported -- pure translation aids, matching
// `util/element.ts`'s own "getattr(..., default)" idiom; duplicated here rather than
// imported since `element.ts` doesn't export them, per `util/schema.ts`'s own "small
// per-module private helpers" precedent) ---

/** Python's `getattr(instance, name, None)`. */
function attrOrNull(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return null;
	}
}

/**
 * Python's `numpy.linalg.norm(v)` (Euclidean/L2 norm) for a plain 3-component vector.
 * `gl-matrix`'s own `vec3.normalize` divides by this same norm internally, so `a2p`
 * below uses `vec3.normalize` directly rather than reimplementing it -- this helper
 * exists only for `getCartesiantransformationoperator3d`'s dot-product comparison,
 * which needs the *raw* (non-normalized) `axis2` vector, not a normalized copy.
 */
function dot3(a: ArrayLike<number>, b: ArrayLike<number>): number {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Converts an EXPRESS `IfcDirection.DirectionRatios`-shaped `number[]` (2 or 3
 * components) to a fixed 3-component vector, padding a missing Z with `0` -- Python's
 * `x.resize(3)` (`numpy.ndarray.resize`, in-place zero-pad-or-truncate) for
 * `IfcAxis2Placement2D`'s optional `RefDirection`, the only caller that can see a
 * 2-component `DirectionRatios` array here (`IfcAxis1Placement`/`IfcAxis2Placement3D`/
 * `IfcAxis2PlacementLinear`'s `Axis`/`RefDirection` are always 3D `IfcDirection`s in
 * every IFC schema version).
 */
function toVec3Padded(ratios: readonly number[]): vec3 {
	return vec3.fromValues(ratios[0] ?? 0, ratios[1] ?? 0, ratios[2] ?? 0);
}

// --- ported functions ---

/**
 * Converts a location, X, and Z axis vector to a 4x4 transformation matrix
 * (`ifcopenshell.util.placement.a2p`).
 *
 * IFC uses a right-handed coordinate system, so it is not necessary to provide the Y
 * axis.
 *
 * @param o The origin (i.e. location) of the matrix
 * @param z The +Z vector / axis of the matrix
 * @param x The +X vector / axis of the matrix
 * @returns A 4x4 `gl-matrix` matrix
 */
export function a2p(o: ArrayLike<number>, z: ArrayLike<number>, x: ArrayLike<number>): MatrixType {
	const xNorm = vec3.create();
	vec3.normalize(xNorm, [x[0], x[1], x[2]]);
	const zNorm = vec3.create();
	vec3.normalize(zNorm, [z[0], z[1], z[2]]);
	const y = vec3.create();
	vec3.cross(y, zNorm, xNorm);
	vec3.normalize(y, y);

	// Raw flat-index assignment, the verified encoding of numpy's `a2p` output (see
	// this file's header comment): column 0 = X axis, column 1 = Y axis, column 2 = Z
	// axis, column 3 = origin (homogeneous 1).
	const out = mat4.create();
	out[0] = xNorm[0];
	out[1] = xNorm[1];
	out[2] = xNorm[2];
	out[3] = 0;
	out[4] = y[0];
	out[5] = y[1];
	out[6] = y[2];
	out[7] = 0;
	out[8] = zNorm[0];
	out[9] = zNorm[1];
	out[10] = zNorm[2];
	out[11] = 0;
	out[12] = o[0];
	out[13] = o[1];
	out[14] = o[2];
	out[15] = 1;
	return out;
}

/**
 * Parses an IfcAxis2Placement (2D or 3D) to a 4x4 transformation matrix
 * (`ifcopenshell.util.placement.get_axis2placement`).
 *
 * Note that this function only parses a single placement axis. If you want to get the
 * placement of an element instead, element placements often are made out of multiple
 * placement axes or other alternative placement methods. You should use
 * `getLocalPlacement` instead.
 *
 * @param placement The `IfcAxis2Placement2D`/`IfcAxis2Placement3D`/
 *   `IfcAxis2PlacementLinear`/`IfcAxis1Placement` entity
 * @returns A 4x4 `gl-matrix` matrix
 */
export function getAxis2placement(placement: EntityInstance): MatrixType {
	const ifcClass = placement.isA();
	let z: ArrayLike<number>;
	let x: ArrayLike<number>;
	let o: ArrayLike<number>;

	if (ifcClass === "IfcAxis2Placement3D" || ifcClass === "IfcAxis2PlacementLinear") {
		const axis = attrOrNull(placement, "Axis") as EntityInstance | null;
		z = axis ? (axis.get("DirectionRatios") as number[]) : [0, 0, 1];
		const refDirection = attrOrNull(placement, "RefDirection") as EntityInstance | null;
		x = refDirection ? (refDirection.get("DirectionRatios") as number[]) : [1, 0, 0];
		const location = placement.get("Location") as EntityInstance;
		const coordinates = attrOrNull(location, "Coordinates") as number[] | null;
		if (coordinates?.length) {
			o = coordinates;
		} else {
			// `IfcAxis2PlacementLinear.Location` (`IfcPointByDistanceExpression`, no
			// `Coordinates`) -- see this file's header comment for the full,
			// disclosed `ifcopenshell.geom` gap.
			throw new Error(
				`getAxis2placement: cannot resolve a non-Cartesian Location (${(location as EntityInstance).isA()}, no Coordinates attribute) without ifcopenshell.geom, which is not yet ported in this TS port -- see util/placement.ts's header comment and TODOS.md.`,
			);
		}
	} else if (ifcClass === "IfcAxis2Placement2D") {
		z = [0, 0, 1];
		const refDirection = attrOrNull(placement, "RefDirection") as EntityInstance | null;
		if (refDirection) {
			x = toVec3Padded(refDirection.get("DirectionRatios") as number[]);
		} else {
			x = [1, 0, 0];
		}
		const location = placement.get("Location") as EntityInstance;
		const coords = location.get("Coordinates") as number[];
		o = [coords[0], coords[1], 0.0];
	} else if (ifcClass === "IfcAxis1Placement") {
		const axis = attrOrNull(placement, "Axis") as EntityInstance | null;
		z = axis ? (axis.get("DirectionRatios") as number[]) : [0, 0, 1];
		x = [1, 0, 0];
		const location = placement.get("Location") as EntityInstance;
		o = location.get("Coordinates") as number[];
	} else {
		throw new Error(`getAxis2placement: unsupported placement class '${ifcClass}'`);
	}

	return a2p(o, z, x);
}

/**
 * Parse a local placement into a 4x4 transformation matrix
 * (`ifcopenshell.util.placement.get_local_placement`).
 *
 * This is typically used to find the location and rotation of an element. The
 * transformation matrix takes the form of:
 *
 * ```
 * [ [ x_x, y_x, z_x, x   ]
 *   [ x_y, y_y, z_y, y   ]
 *   [ x_z, y_z, z_z, z   ]
 *   [ 0.0, 0.0, 0.0, 1.0 ] ]
 * ```
 *
 * Example:
 *
 * ```ts
 * const placement = file.byType("IfcBeam")[0].get("ObjectPlacement");
 * const matrix = util.placement.getLocalPlacement(placement);
 * ```
 *
 * @param placement The `IfcLocalPlacement` entity
 * @returns A 4x4 `gl-matrix` matrix
 */
export function getLocalPlacement(placement?: EntityInstance | null): MatrixType {
	if (placement == null) return mat4.create();
	const relTo = attrOrNull(placement, "PlacementRelTo") as EntityInstance | null;
	const parent = relTo == null ? mat4.create() : getLocalPlacement(relTo);
	const local = getAxis2placement(placement.get("RelativePlacement") as EntityInstance);
	const out = mat4.create();
	// numpy: `np.dot(parent, get_axis2placement(...))` -- verified (see header
	// comment) to correspond directly to `mat4.multiply(out, parent, local)`, parent
	// first, local second.
	mat4.multiply(out, parent, local);
	return out;
}

/**
 * Parses an IfcCartesianTransformationOperator into a 4x4 transformation matrix
 * (`ifcopenshell.util.placement.get_cartesiantransformationoperator3d`).
 *
 * Note that in general you will not need to call this directly. See
 * `getMappeditemTransformation` instead.
 *
 * @param inst The `IfcCartesianTransformationOperator3D`/
 *   `IfcCartesianTransformationOperator3DnonUniform` entity
 * @returns A 4x4 `gl-matrix` transformation matrix
 */
export function getCartesiantransformationoperator3d(inst: EntityInstance): MatrixType {
	const origin = (inst.get("LocalOrigin") as EntityInstance).get("Coordinates") as number[];

	let axis1: [number, number, number] = [1.0, 0.0, 0.0];
	let axis2: [number, number, number] = [0.0, 1.0, 0.0];
	const axis3Entity = attrOrNull(inst, "Axis3") as EntityInstance | null;
	let axis3: [number, number, number] = [0.0, 0.0, 1.0];

	const axis1Entity = attrOrNull(inst, "Axis1") as EntityInstance | null;
	if (axis1Entity) {
		const r = axis1Entity.get("DirectionRatios") as number[];
		axis1 = [r[0], r[1], r[2]];
	}
	const axis2Entity = attrOrNull(inst, "Axis2") as EntityInstance | null;
	if (axis2Entity) {
		const r = axis2Entity.get("DirectionRatios") as number[];
		axis2 = [r[0], r[1], r[2]];
	}
	if (axis3Entity) {
		const r = axis3Entity.get("DirectionRatios") as number[];
		axis3 = [r[0], r[1], r[2]];
	}

	const m4 = a2p(origin, axis3, axis1);

	// Negate axis2 (introduce mirroring) when supplied axis2 is opposite of
	// constructed axis2, but remains orthogonal. `m4.T[1]` is column 1 (the Y axis) of
	// `m4` -- flat indices 4-7.
	if (dot3([m4[4], m4[5], m4[6]], axis2) < 0.0) {
		m4[4] *= -1.0;
		m4[5] *= -1.0;
		m4[6] *= -1.0;
		m4[7] *= -1.0;
	}

	// Scale1 uses Python's truthy `if inst.Scale:` check (a `Scale` of exactly `0.0`
	// is treated as unset, defaulting to `1.0`); Scale2/Scale3 use `is not None`
	// (`0.0` is honored as a real zero scale) -- see this file's header comment,
	// finding 1, for why these two checks genuinely differ in the real Python source.
	const scaleAttr = attrOrNull(inst, "Scale") as number | null;
	let scale1 = 1.0;
	let scale2: number;
	let scale3: number;
	if (scaleAttr) scale1 = scaleAttr;

	if (inst.isA("IfcCartesianTransformationOperator3DnonUniform")) {
		const scale2Attr = attrOrNull(inst, "Scale2") as number | null;
		const scale3Attr = attrOrNull(inst, "Scale3") as number | null;
		scale2 = scale2Attr != null ? scale2Attr : scale1;
		scale3 = scale3Attr != null ? scale3Attr : scale1;
	} else {
		scale2 = scale1;
		scale3 = scale1;
	}

	// numpy: `m4.T[0] *= scale1; m4.T[1] *= scale2; m4.T[2] *= scale3` -- scaling
	// columns 0/1/2 of `m4` (verified equivalent to `mat4.scale`, see header comment).
	mat4.scale(m4, m4, [scale1, scale2, scale3]);

	return m4;
}

/**
 * Parse an IfcMappedItem into a 4x4 transformation matrix
 * (`ifcopenshell.util.placement.get_mappeditem_transformation`).
 *
 * Mapped items take a representation with an origin and transform them with a cartesian
 * transformation operation. This function returns the final transformation matrix.
 *
 * @param item The `IfcMappedItem` entity
 * @returns A 4x4 `gl-matrix` transformation matrix, or `null` if `MappingTarget` is not
 *   an `IfcCartesianTransformationOperator3D` -- Python's own source has no `else`
 *   branch here (an inline `# TODO 2d` comment), implicitly returning `None`; this is
 *   an existing upstream gap, not something this port completes (see header comment,
 *   finding 2).
 */
export function getMappeditemTransformation(item: EntityInstance): MatrixType | null {
	const m4 = getAxis2placement((item.get("MappingSource") as EntityInstance).get("MappingOrigin") as EntityInstance);
	// TODO 2d
	const mappingTarget = item.get("MappingTarget") as EntityInstance;
	if (mappingTarget.isA("IfcCartesianTransformationOperator3D")) {
		const out = mat4.create();
		mat4.multiply(out, getCartesiantransformationoperator3d(mappingTarget), m4);
		return out;
	}
	return null;
}

/**
 * Get the Z elevation in project units of a building storey
 * (`ifcopenshell.util.placement.get_storey_elevation`).
 *
 * Building storeys store elevation in two possible locations: the Z value of its
 * placement, or as a fallback the `Elevation` attribute.
 *
 * @param storey The `IfcBuildingStorey` entity
 * @returns The elevation in project units
 */
export function getStoreyElevation(storey: EntityInstance): number {
	const placement = attrOrNull(storey, "ObjectPlacement") as EntityInstance | null;
	if (placement) {
		const matrix = getLocalPlacement(placement);
		const translation = vec3.create();
		mat4.getTranslation(translation, matrix);
		return translation[2];
	}
	// Python's `getattr(storey, "Elevation", 0.0) or 0.0` -- `getattr`'s default
	// covers a class with no `Elevation` attribute at all (e.g. `IfcBuilding`); the
	// trailing `or 0.0` covers a declared-but-unset (`None`) or exactly-`0.0` value.
	let elevation: unknown;
	try {
		elevation = storey.get("Elevation");
	} catch {
		elevation = 0.0;
	}
	return (elevation as number) || 0.0;
}

/**
 * Create a 4x4 matrix representing an euler rotation (`ifcopenshell.util.placement.rotation`).
 *
 * @param angle The angle of rotation
 * @param axis The axis to rotate around, either X, Y, or Z.
 * @param isDegrees Whether or not the angle is specified in degrees or radians.
 *   Defaults to true (i.e. degrees).
 * @returns A 4x4 `gl-matrix` rotation matrix
 */
export function rotation(angle: number, axis: "X" | "Y" | "Z", isDegrees = true): MatrixType {
	const theta = isDegrees ? (angle * Math.PI) / 180 : angle;
	const out = mat4.create();
	// `mat4.fromXRotation`/`fromYRotation`/`fromZRotation` were each verified (see
	// header comment) to produce results identical to numpy's own `rotation()` matrix
	// formulas for all three axes.
	if (axis === "X") mat4.fromXRotation(out, theta);
	else if (axis === "Y") mat4.fromYRotation(out, theta);
	else if (axis === "Z") mat4.fromZRotation(out, theta);
	else {
		// A real, disclosed divergence from Python found by this chunk's own
		// `/code-review` pass, not present in an earlier draft: Python's `rotation`
		// has no trailing `else` for its `if`/`elif` chain (placement.py:219-240),
		// so an `axis` value matching none of "X"/"Y"/"Z" implicitly returns `None`
		// there. `axis`'s TS type (`"X" | "Y" | "Z"`) makes this branch unreachable
		// for any statically-checked caller -- reachable only via an explicit type
		// bypass (`as Axis`/`as any`) or genuinely untyped input (e.g. parsed JSON).
		// Silently returning the identity matrix in that case (an earlier version of
		// this function did exactly that) would be a *worse* divergence than Python's
		// own `None` -- a caller relying on Python's falsy-`None` check to detect the
		// bad input would instead silently receive a plausible-looking, wrong
		// transform. Throwing here fails loudly instead, which is strictly safer than
		// either Python's silent `None` or a silent identity matrix, at the cost of
		// being a deliberate (disclosed) behavioral divergence for this one
		// TS-type-system-unreachable-in-practice case.
		throw new Error(`rotation: axis must be "X", "Y", or "Z", got ${JSON.stringify(axis)}`);
	}
	return out;
}
