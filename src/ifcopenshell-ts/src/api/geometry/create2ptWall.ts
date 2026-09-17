// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/create_2pt_wall.py` (src/ifcopenshell-python, 92
// lines) -- a plain function (no internal `Usecase` class, unlike most `api.geometry`
// files), so nothing to flatten here. A shortcut wrapping this same module's own
// already-landed `addWallRepresentation` and `editObjectPlacement` (see each file's own
// header comment): computes `length` from `p1`/`p2`, calls `addWallRepresentation` to
// build the wall's `IfcShapeRepresentation`, then hand-builds a 4x4 rotation+translation
// matrix from the normalized `p1`->`p2` direction and calls `editObjectPlacement` to
// place `element` at `p1` facing that direction.
//
// *** The matrix: hand-built via raw flat-index `mat4` construction, NOT `a2p` --
// verified, not assumed, that this produces the identical matrix `a2p` itself would ***
//
// Real Python builds the matrix as a literal, ROW-MAJOR nested list (not via
// `ShapeBuilder`/`a2p` at all):
// ```
// matrix = np.array([
//     [v[0], -v[1], 0, p1_[0]],
//     [v[1],  v[0], 0, p1_[1]],
//     [0,     0,    1, elevation],
//     [0,     0,    0, 1],
// ])
// ```
// This project's own `util/placement.ts`'s own header comment already verified numpy's
// column-major *conceptual* layout (column 0 = X axis, column 2 = Z axis, column 3 =
// origin) maps directly to `gl-matrix`'s own flat-index `mat4` encoding (flat indices
// 0-2/8-10/12-14 respectively), and that `mat4.fromValues(a0..a15)` writes its 16
// arguments into the flat array in the exact literal order given (no transpose). Reading
// the real matrix's own COLUMNS (not rows) directly off the nested list above: column 0
// (X axis) = `(v[0], v[1], 0)`, column 1 (Y axis) = `(-v[1], v[0], 0)`, column 2 (Z axis)
// = `(0, 0, 1)`, column 3 (origin) = `(p1_[0], p1_[1], elevation)` -- ported below via
// `mat4.fromValues` fed those exact 16 values in flat (column-major) order. Cross-checked
// (not just asserted): this is exactly what `util/placement.ts`'s own `a2p(o, z, x)`
// would independently compute for `o = (p1_[0], p1_[1], elevation)`, `z = (0, 0, 1)`,
// `x = (v[0], v[1], 0)` -- `a2p`'s own `y = normalize(cross(z, x))` gives
// `cross((0,0,1), (v0,v1,0)) = (-v1, v0, 0)`, already unit length since `x`/`z` are
// orthonormal, matching the real Python matrix's own column 1 exactly. This port still
// constructs the matrix directly via `mat4.fromValues` (matching real Python's own direct
// literal-array construction), rather than calling `a2p` (not used by the real source),
// but the cross-check confirms the flat-index mapping used here is correct.
//
// *** A real, disclosed BUG in the real Python source, preserved verbatim: `v` mixes
// unit scales when `is_si` is `False` ***
//
// When `is_si` is `False`, real Python converts `p1_`, `elevation`, `length`, `height`,
// and `thickness` to SI in place -- but, per its own comment ("No need to convert p2 as
// length is already calculated"), `p2_` is deliberately NEVER converted, since it's only
// needed (in project units) to compute `length` earlier. However, `v = p2_ - p1_` is
// computed AFTER that conversion, from the (still-project-units) `p2_` and the
// (now-SI-converted) `p1_` -- genuinely subtracting two vectors in different unit
// scales. `v` is then merely normalized (`v /= norm(v)`), so this only produces the
// mathematically-correct wall direction when `p1_` and `p2_` are close to the origin
// relative to the unit-scale factor (the SI-conversion-induced shift in `p1_` is
// negligible next to `p2_`'s own project-unit magnitude); for points far from the
// origin (e.g. real-world survey coordinates) or a unit scale far from `1.0`, this
// silently produces the WRONG wall direction. Confirmed by reading the exact source
// lines (not assumed), and reproduced verbatim below -- not "fixed" -- per this
// project's established discipline of preserving real Python bugs/quirks rather than
// silently correcting them. Only reachable when `isSi: false` is passed; the default
// (`isSi: true`, no conversion at all) is unaffected.

import { mat4 } from "gl-matrix";
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";
import { addWallRepresentation } from "./addWallRepresentation";
import { editObjectPlacement } from "./editObjectPlacement";

export interface Create2ptWallSettings {
	/** Wall IFC element. */
	element: EntityInstance;
	/**
	 * The `IfcGeometricRepresentationContext` for the representation, only
	 * Model/Body/MODEL_VIEW type of representations are currently supported.
	 */
	context: EntityInstance;
	/** The starting point (x, y) of the wall. */
	p1: readonly [number, number];
	/** The ending point (x, y) of the wall. */
	p2: readonly [number, number];
	/** The base elevation (z-coordinate) for the wall. */
	elevation: number;
	/** The height of the wall. */
	height: number;
	/** The thickness of the wall. */
	thickness: number;
	/**
	 * If `true` (the default), the provided arguments' units are treated as SI (meters).
	 * If `false`, values are converted from project units to SI. See this file's header
	 * comment for a real, disclosed Python bug that only affects the `false` case.
	 */
	isSi?: boolean;
}

function convertUnitToSi(co: number, siConversion: number): number {
	return co * siConversion;
}

function create2ptWallUsecase(file: IfcFile, settings: Create2ptWallSettings): EntityInstance {
	const { element, context } = settings;
	const isSi = settings.isSi ?? true;
	const siConversion = calculateUnitScale(file);

	let p1: readonly [number, number] = settings.p1;
	const p2 = settings.p2;
	let elevation = settings.elevation;
	let height = settings.height;
	let thickness = settings.thickness;

	let length = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);

	if (!isSi) {
		length = convertUnitToSi(length, siConversion);
		height = convertUnitToSi(height, siConversion);
		thickness = convertUnitToSi(thickness, siConversion);
		// No need to convert p2 as length is already calculated (real Python's own
		// comment, preserved verbatim) -- see this file's header comment for the real,
		// disclosed unit-mixing bug this causes in `v` below.
		p1 = [convertUnitToSi(p1[0], siConversion), convertUnitToSi(p1[1], siConversion)];
		elevation = convertUnitToSi(elevation, siConversion);
	}

	const representation = addWallRepresentation(file, { context, length, height, thickness });

	// `v = p2_ - p1_` -- see this file's header comment: `p2` is never SI-converted even
	// when `isSi` is `false`, while `p1` (above) is, a genuine mixed-unit bug preserved
	// verbatim.
	const rawV: [number, number] = [p2[0] - p1[0], p2[1] - p1[1]];
	const vLength = Math.hypot(rawV[0], rawV[1]);
	const v: [number, number] = [rawV[0] / vLength, rawV[1] / vLength];

	// See this file's header comment for the full flat-index derivation/cross-check
	// against `a2p`.
	const matrix = mat4.fromValues(v[0], v[1], 0, 0, -v[1], v[0], 0, 0, 0, 0, 1, 0, p1[0], p1[1], elevation, 1);
	editObjectPlacement(file, { product: element, matrix });

	return representation;
}

/**
 * Creates a wall between two points, `p1` and `p2` (Python:
 * `ifcopenshell.api.geometry.create_2pt_wall`).
 *
 * A shortcut for `addWallRepresentation` + `editObjectPlacement`.
 *
 * @returns The new `IfcShapeRepresentation` (Python's own return value -- `element`'s
 * placement is also updated as a side effect, matching real Python exactly).
 */
export const create2ptWall = wrapUsecase("geometry.create_2pt_wall", create2ptWallUsecase);
