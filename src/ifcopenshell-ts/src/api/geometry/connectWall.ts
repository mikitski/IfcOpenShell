// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/connect_wall.py` (src/ifcopenshell-python, 64
// lines) -- part of this chunk's 8-file `api.geometry` addition (see `./index.ts`'s own
// header comment). This is the one file in this chunk with real geometry math
// (`numpy`/`util.shape_builder` imports) -- read completely, per this chunk's own task
// brief, rather than assumed blocked from the imports alone. Verified directly: every
// dependency is ALREADY LANDED, none of them via this file's own new work:
// `util.placement.getLocalPlacement` (`util/placement.ts`, landed by
// `./editObjectPlacement.ts`'s own earlier chunk), `util.representation.getReferenceLine`
// (`util/representation.ts`, already landed), `util.shapeBuilder.intersectXAxis2d` and
// `util.shapeBuilder.npApplyMatrix` (`util/shapeBuilder.ts`, already landed), and
// `api.geometry.connectPath` (this SAME chunk, see `./connectPath.ts`) -- no genuinely
// new/unported primitive at all.
//
// *** Matrix-math verification: `matrix1i @ matrix2 @ point` via `gl-matrix`, not
// assumed from `./editObjectPlacement.ts`'s own prior finding ***
//
// `./editObjectPlacement.ts`'s own header comment already verified `mat4.multiply(out,
// A, B)` matches numpy's `A @ B` for two 4x4 MATRICES. This file's own expression,
// `matrix1i @ matrix2 @ np.concatenate((point, (0, 1)))`, additionally chains a
// matrix-times-VECTOR multiply at the end -- a DIFFERENT gl-matrix primitive
// (`vec3.transformMat4`, which `npApplyMatrix` already wraps), not re-exercised by that
// prior finding. Verified with a disposable Node script (not assumed) using the exact
// same hand-checkable fixture as `editObjectPlacement.ts`'s own verification (a 90-
// degree-Z rotation composed with translation `(5,0,0)`, and a pure translation
// `(1,0,0)`): computed `composite = matrix1i @ matrix2` via `mat4.invert`/`mat4.multiply`,
// then applied `composite` to the world-space point `(0,0,0,1)` via
// `vec4.transformMat4` -- the result, `(~0, 4, 0, 1)` (floating-point noise on the
// x-component), matches the hand-derived expectation exactly (`inv(rotate90+translate
// (5,0,0))` applied to `translate(1,0,0)`'s own origin, i.e. the world point `(1,0,0)`,
// lands at local point `(0,4,0)` in the rotated+translated frame -- confirmed by hand:
// `R^-1 @ ((1,0,0) - (5,0,0)) = R^-1 @ (-4,0,0)`, and a -90-degree rotation of
// `(-4,0,0)` is `(0,4,0)`). This confirms `npApplyMatrix`'s own `vec3.transformMat4`
// convention (`(M @ v)[i] = sum_j M[i,j]*v[j]`, per that function's own doc comment)
// composes correctly with `mat4.multiply`'s `A @ B` convention for a chained
// `A @ B @ v` expression, not just a bare `A @ v`.
//
// *** Why `npApplyMatrix` (a 3D-point helper) is the right tool for a 2D-point
// expression, verified rather than assumed ***
//
// Real Python's own `np.concatenate((point_2d, (0, 1)))` builds a 4-vector `(x, y, 0,
// 1)` -- i.e. the 2D point promoted to 3D with `z = 0`, then homogenized with `w = 1`.
// `npApplyMatrix(vectors, matrix)` (`util/shapeBuilder.ts`) takes a 3D point and
// applies EXACTLY this same `vec3.transformMat4` convention (implicit `w = 1`, per
// `gl-matrix`'s own `vec3.transformMat4` semantics) -- so `npApplyMatrix([[x, y, 0]],
// composite)[0]` reproduces the real Python expression's full `(x, y, 0, 1)`
// homogeneous transform exactly; only the result's own `[0]`/`[1]` components
// (discarding `[2]`, the transformed z) are kept, matching Python's own trailing
// `[:2]` slice.
//
// *** `getReferenceLine`'s own mutable-vs-readonly return shape, and why this port
// copies before mutating ***
//
// `util/representation.ts`'s `getReferenceLine` returns `[readonly number[], readonly
// number[]]` -- TS's readonly-array typing, not a runtime-enforced immutability (the
// underlying arrays are the same plain JS arrays real Python's own `np.array(...)`
// would be). Real Python REASSIGNS `axis2[0]`/`axis2[1]` in place (a Python list
// supports item assignment even though `get_reference_line` itself returns a fresh
// list each call, so there's no actual aliasing hazard there either) -- this port
// builds fresh local mutable `[number, number]` tuples instead of trying to
// index-assign into the readonly-typed return value, achieving the identical final
// values without fighting the type system for a distinction with no real runtime
// consequence (this function's own `axis2` binding is entirely local, never handed
// back to any caller in either language).

import { mat4 } from "gl-matrix";
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getLocalPlacement } from "../../util/placement";
import { getReferenceLine } from "../../util/representation";
import { intersectXAxis2d, npApplyMatrix } from "../../util/shapeBuilder";
import { wrapUsecase } from "../hooks";
import { connectPath } from "./connectPath";

/** Transforms a 2D point `(x, y)` by `matrix`, matching real Python's own
 * `(matrix @ np.concatenate((point, (0, 1))))[:2]` -- see this file's header comment
 * for the full `npApplyMatrix` verification. */
function transformPoint2d(point: readonly [number, number], matrix: mat4): [number, number] {
	const transformed = npApplyMatrix([[point[0], point[1], 0]], matrix)[0] as [number, number, number];
	return [transformed[0], transformed[1]];
}

export interface ConnectWallSettings {
	/** The wall the new connection's `RelatingElement` will be. */
	wall1: EntityInstance;
	/** The wall the new connection's `RelatedElement` will be. */
	wall2: EntityInstance;
	/** If `true`, `wall2`'s own connection type is always `"ATPATH"` regardless of the computed intersection. Python default: `false`. */
	isAtpath?: boolean;
}

function connectWallUsecase(file: IfcFile, settings: ConnectWallSettings): EntityInstance | undefined {
	const { wall1, wall2 } = settings;
	const isAtpath = settings.isAtpath ?? false;

	const matrix1 = getLocalPlacement(wall1.get("ObjectPlacement") as EntityInstance | null);
	const matrix1i = mat4.create();
	if (!mat4.invert(matrix1i, matrix1)) {
		throw new Error("connectWall: wall1's placement matrix is singular and cannot be inverted");
	}
	const matrix2 = getLocalPlacement(wall2.get("ObjectPlacement") as EntityInstance | null);
	const composite = mat4.create();
	mat4.multiply(composite, matrix1i, matrix2);

	const axis1 = getReferenceLine(wall1);
	const rawAxis2 = getReferenceLine(wall2);
	const axis2: [[number, number], [number, number]] = [
		transformPoint2d([rawAxis2[0][0], rawAxis2[0][1]], composite),
		transformPoint2d([rawAxis2[1][0], rawAxis2[1][1]], composite),
	];

	const midx = (axis1[0][0] + axis1[1][0]) / 2;
	const starty = axis2[0][1];
	const endy = axis2[1][1];
	const y = axis1[0][1];

	const x = intersectXAxis2d(axis2[0], axis2[1], y);
	if (x === undefined) return undefined;

	const wall1End = x > midx ? "ATEND" : "ATSTART";
	let wall2End: string;
	if (isAtpath) {
		wall2End = "ATPATH";
	} else if (Math.abs(y - starty) < Math.abs(y - endy)) {
		wall2End = "ATSTART";
	} else {
		wall2End = "ATEND";
	}

	return connectPath(file, {
		relatingElement: wall1,
		relatedElement: wall2,
		relatingConnection: wall1End,
		relatedConnection: wall2End,
	});
}

/**
 * Connects two walls together, automatically computing the correct endpoint connection
 * types from their axis representations and placements (Python:
 * `ifcopenshell.api.geometry.connect_wall`).
 *
 * Transforms `wall2`'s reference axis into `wall1`'s local coordinate system, then
 * intersects it against `wall1`'s own reference axis (at `wall1`'s start height) to
 * determine which end of `wall1` the connection is nearest to, and (unless `isAtpath`
 * is `true`) which end of `wall2` is nearest the intersection point.
 *
 * @returns The new `IfcRelConnectsPathElements` (via `api.geometry.connectPath`), or
 * `undefined` if `wall2`'s reference axis never crosses `wall1`'s own axis line (a
 * real, reachable case for parallel or non-intersecting walls).
 */
export const connectWall = wrapUsecase("geometry.connect_wall", connectWallUsecase);
