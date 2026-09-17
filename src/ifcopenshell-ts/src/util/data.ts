// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/util/data.py` (src/ifcopenshell-python, 102 lines) -- a single
// small dataclass, `Clipping`, plus its two methods (`parse`/`apply`), NOT a usecase.
// This is the first file in a new chunk (`util.data` + 3 `api.geometry` files:
// `clip_solid`/`clip_solid_bounded`/`add_axis_representation`, see `../api/geometry/
// index.ts`'s own updated header comment) -- ported first per this chunk's own task
// brief, since `clipSolid.ts`/`clipSolidBounded.ts` both reuse (or, for the bounded
// variant, duplicate -- see `clipSolidBounded.ts`'s own header comment for why) the
// matrix-column-slice/cross-product logic verified here.
//
// `test/util/test_data.py` does not exist anywhere in `src/ifcopenshell-python`
// (confirmed by a repo-wide search) -- no dedicated Python test file to port from.
// `test/util/data.test.ts` is therefore original coverage, written directly against
// `data.py`'s real source, covering `parse`'s 4 branches (entity/`Clipping`/dict-with-
// location-and-normal/dict-with-matrix) and its 3 real thrown-error conditions, plus
// `apply`'s own geometry construction (verified against the generated `.d.ts`s below).
//
// *** `parse`'s `matrix` dict branch: numpy `matrix[:, 2]`/`matrix[:, 3]` column-slice,
// verified against this project's own already-established convention, not assumed ***
//
// Real Python: `matrix = np.array(raw_data["matrix"])[:3]; raw_data["normal"] =
// matrix[:, 2].tolist(); raw_data["location"] = matrix[:, 3].tolist()`. Critically,
// `raw_data["matrix"]` here is a plain, user-supplied NESTED LIST (a "list of rows"
// numpy 2D array, e.g. `[[r00,r01,r02,r03], [r10,r11,r12,r13], [r20,r21,r22,r23],
// [0,0,0,1]]`) -- NOT a `gl-matrix`-shaped flat column-major `mat4` array. `[:3]` keeps
// only the first 3 ROWS (dropping a homogeneous 4th row, if present); `matrix[:, 2]`/
// `matrix[:, 3]` then read COLUMN 2 (across those 3 rows) as the normal, and COLUMN 3
// as the location -- numpy's row/column indexing is by mathematical convention, not by
// how the nested list happens to be laid out in memory, so this is genuinely a
// "column 2 = Z axis, column 3 = origin" reading of a row-major nested-array input, a
// DIFFERENT concrete data shape from (but the SAME conceptual column convention as)
// `util/placement.ts`'s/`util/shapeBuilder.ts`'s own `gl-matrix` flat-array encoding.
// Verified directly against this project's own already-landed, already-verified
// precedent for that exact "column 2 = Z axis, column 3 = origin" convention applied to
// a nested/positional matrix shape: `util/shapeBuilder.ts`'s own
// `createAxis2Placement3dFromMatrix` (`ShapeBuilder.create_axis2_placement_3d_from_matrix`)
// reads the identical real Python source line `z_axis=matrix[:3, 2], x_axis=matrix[:3,
// 0]` (plus `position=matrix[:3, 3]`) -- the SAME column indices (2 for Z, 3 for
// translation/origin) this file's own `parse` uses, independent confirmation that this
// isn't a guess. (`editObjectPlacement.ts`'s own header comment separately verifies the
// SAME column convention again for `gl-matrix`'s own flat-index encoding specifically --
// column 2 at flat indices 8/9/10, column 3 at flat indices 12/13/14 -- a different
// concrete array shape than this file's plain nested-list input, but the same
// mathematical column meaning throughout this codebase.)
//
// *** `apply`: `ShapeBuilder.create_axis2_placement_3d` -- NOT the full `ShapeBuilder`
// class ***
//
// Per this chunk's own task brief: only this one `ShapeBuilder` method is needed here,
// already ported as a small local per-file helper multiple times in this codebase
// (`../api/geometry/editObjectPlacement.ts`'s own `createAxis2Placement3d`, `../api/
// georeference/editWcs.ts`'s own identical copy) -- duplicated again here (a 4th copy),
// matching this project's own established "duplicate this one tiny helper per module
// rather than share it" convention (see either of those files' own header comments for
// why: a 3-line body isn't worth the coupling cost of a cross-module import). `np.cross`/
// `np.linalg.norm` are likewise hand-written below as plain 3-vector helpers -- trivial,
// no library needed, matching `util/shapeBuilder.ts`'s own established precedent of
// hand-writing small vector helpers rather than pulling in `gl-matrix`'s `vec3` type for
// plain `number[]`-shaped data (see that file's own header comment for why: `vec3`'s
// typed-array shape would silently break `EntityInstance`'s `Array.isArray`-based
// attribute-write dispatch).
//
// `np.allclose(normal, [0,0,1], atol=1e-2)` (and the `[0,0,-1]` case) explicitly pass a
// LARGER-than-numpy-default `atol` (`1e-2`, vs. numpy's own default `1e-8`) while still
// relying on numpy's default `rtol` (`1e-5`) -- ported below via a small local `allClose`
// helper taking an explicit `atol` parameter (unlike `editWcs.ts`'s own identically-named
// `allClose` helper, which hardcodes `atol=1e-8` since it never needs anything else --
// this is a distinct, not-shared, per-file helper, consistent with that same "duplicate
// small per-module helpers" convention, not a contradiction of it).
//
// *** Entity classes verified identical across all 3 generated schemas ***
//
// `IfcPlane(Position)`, `IfcHalfSpaceSolid(BaseSurface, AgreementFlag)`,
// `IfcBooleanClippingResult(Operator, FirstOperand, SecondOperand)`,
// `IfcAxis2Placement3D(Location, Axis, RefDirection)`, `IfcCartesianPoint(Coordinates)`,
// `IfcDirection(DirectionRatios)` -- confirmed identical attribute order across
// `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts` (only `IfcBooleanClippingResult`'s own
// `FirstOperand`/`SecondOperand` declared TS union type gains `IfcTessellatedFaceSet` on
// IFC4/IFC4X3, a type-level-only difference, matching `addBoolean.ts`'s own identical
// finding). `apply` therefore runs unmodified against every schema -- confirmed by the
// real Python `test_clip_solid.py`'s own `TestClipSolidIFC2X3` subclass, which exercises
// this exact code path via `clip_solid`.
//
// *** A minor, disclosed TS-vs-Python divergence in `parse`'s own thrown-error TEXT ***
//
// Real Python's `raise Exception(f"Provided clipping of unexpected IFC class: {raw_data}")`
// (and the final catch-all `f"Unexpected clipping type provided: {raw_data}"`) interpolate
// `raw_data` via Python's own `__repr__`/`__str__` (a real `entity_instance` prints its own
// STEP-like representation, e.g. `#33=IFCWALL(...)`). This port's `EntityInstance` class
// has no such `toString()` override (confirmed by reading `entityInstance.ts` directly --
// none exists), so interpolating an `EntityInstance` into a template literal would print
// the unhelpful default `"[object Object]"`. To keep the thrown message genuinely useful
// (not just textually close), the entity-class-mismatch message below names the offending
// class via `.isA()` instead of interpolating the raw instance -- a deliberate, disclosed
// substitution for a real JS limitation (matching `addPset.ts`'s own identical, already-
// established "JS has no typed exception classes"-style disclosure precedent for
// error-message text), not a silently different condition or control flow.
//
// *** One small, disclosed compensating check: a dict missing BOTH `location`/`normal`
// AND `matrix` ***
//
// Real Python's `cls(**raw_data)` (after the `matrix` branch's own key substitution, if
// any) relies on `Clipping`'s own dataclass constructor to throw a real `TypeError` if
// `location`/`normal` are missing (both are REQUIRED, no-default dataclass fields) --
// TS/JS has no equivalent "missing required constructor argument" runtime enforcement
// for a plain object literal, so a JS caller passing e.g. `{}` would otherwise silently
// construct a `Clipping` with `location`/`normal` both `undefined`, only failing much
// later (and far more confusingly) inside `apply`. A small explicit check below reproduces
// the SAME real-world effect (parse throws for this malformed input) via a different
// mechanism necessitated by the language difference, not a new validation rule Python
// itself doesn't also enforce.

import { EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";

/** A plain 3-component vector, matching this file's own plain-array (not `gl-matrix`)
 * convention for `location`/`normal` -- see this file's header comment for why `apply`
 * hand-writes `cross`/`norm` rather than reaching for `gl-matrix`'s `vec3`. */
export type Vec3 = readonly [number, number, number];

/**
 * The `{location, normal}`-shaped raw dict `Clipping.parse` accepts (Python: a plain
 * `dict` with `location`/`normal` keys, optionally also `type`/`operand_type` -- named
 * `operandType` here per this port's own camelCase convention).
 */
export interface ClippingLocationNormalDict {
	location: Vec3;
	normal: Vec3;
	type?: string;
	operandType?: string;
}

/**
 * The `{matrix}`-shaped raw dict `Clipping.parse` accepts (Python: a plain `dict` with a
 * `matrix` key -- "soon to be deprecated completely", per the real docstring, preserved
 * verbatim). `matrix` is a plain nested-row-array 4x4 (or 3x4) matrix -- see this file's
 * header comment for the exact column convention this shape uses, distinct from
 * `gl-matrix`'s own flat `mat4` encoding used elsewhere in this codebase.
 */
export interface ClippingMatrixDict {
	matrix: ArrayLike<ArrayLike<number>>;
	type?: string;
	operandType?: string;
}

/** Python: `Union[ifcopenshell.entity_instance, Clipping, dict[str, Any]]`. */
export type ClippingRawData = EntityInstance | Clipping | ClippingLocationNormalDict | ClippingMatrixDict;

/** Python's `isinstance(value, dict)` -- excludes arrays and `EntityInstance`s, matching
 * `file.ts`'s own identical, unexported `isPlainObject` helper's shape (duplicated here
 * per this project's established per-module convention -- `file.ts` doesn't export it). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof EntityInstance);
}

/** Python's `np.allclose(a, b, atol=...)`, with numpy's own default `rtol=1e-5` -- a
 * distinct, per-file helper from `../api/georeference/editWcs.ts`'s own identically-named
 * `allClose` (which hardcodes `atol=1e-8`); see this file's header comment for why this
 * one needs an explicit `atol` parameter instead. */
function allClose(a: Vec3, b: Vec3, atol: number, rtol = 1e-5): boolean {
	return a.every((v, i) => Math.abs(v - b[i]) <= atol + rtol * Math.abs(b[i]));
}

/** Python's `np.cross(a, b)` for plain 3-component vectors. */
function cross(a: Vec3, b: Vec3): Vec3 {
	return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** Python's `np.linalg.norm(v)` (Euclidean/L2 norm) for a plain 3-component vector. */
function norm(v: Vec3): number {
	return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/** Python's `ShapeBuilder.create_axis2_placement_3d` -- see this file's header comment
 * for why only this one `ShapeBuilder` method is duplicated here, as a small local
 * helper, not the full class. */
function createAxis2Placement3d(file: IfcFile, position: Vec3, zAxis: Vec3, xAxis: Vec3): EntityInstance {
	return file.createEntity(
		"IfcAxis2Placement3D",
		file.createEntity("IfcCartesianPoint", [position[0], position[1], position[2]]),
		file.createEntity("IfcDirection", [zAxis[0], zAxis[1], zAxis[2]]),
		file.createEntity("IfcDirection", [xAxis[0], xAxis[1], xAxis[2]]),
	);
}

/**
 * Represents an `IfcBooleanClippingResult` half-space clip, as a plain, IFC-independent
 * data holder (Python: `ifcopenshell.util.data.Clipping`, a `dataclass`).
 */
export class Clipping {
	readonly location: Vec3;
	readonly normal: Vec3;
	readonly type: string;
	readonly operandType: string;

	constructor(data: { location: Vec3; normal: Vec3; type?: string; operandType?: string }) {
		this.location = data.location;
		this.normal = data.normal;
		this.type = data.type ?? "IfcBooleanClippingResult";
		this.operandType = data.operandType ?? "IfcHalfSpaceSolid";
	}

	/**
	 * Parse various formats into a clipping object (Python: `Clipping.parse`).
	 *
	 * `rawData` can be either:
	 * - An `IfcBooleanResult` IFC entity.
	 * - A `Clipping` instance.
	 * - A dict to define a `Clipping` -- either `location` and `normal`, or a `matrix`
	 *   where the XY plane is the clipping boundary and +Z is removed. The `matrix` form
	 *   will soon be deprecated completely (real Python's own docstring, verbatim).
	 */
	static parse(rawData: ClippingRawData): EntityInstance | Clipping {
		if (rawData instanceof EntityInstance) {
			if (!rawData.isA("IfcBooleanResult")) {
				// See this file's header comment for why this names the class via `.isA()`
				// rather than interpolating the raw instance (a real JS-vs-Python
				// error-message-text divergence, disclosed).
				throw new Error(`Provided clipping of unexpected IFC class: ${rawData.isA()}`);
			}
			return rawData;
		}
		if (rawData instanceof Clipping) {
			return rawData;
		}
		if (isPlainObject(rawData)) {
			let location: Vec3 | undefined;
			let normal: Vec3 | undefined;
			if ("matrix" in rawData && (rawData as ClippingMatrixDict).matrix) {
				// See this file's header comment for the full column-slice verification.
				// `[:3]` -- only the first 3 rows matter (a possible 4th homogeneous row is
				// ignored).
				const matrix = (rawData as ClippingMatrixDict).matrix;
				normal = [matrix[0][2], matrix[1][2], matrix[2][2]];
				location = [matrix[0][3], matrix[1][3], matrix[2][3]];
			} else {
				const locationNormalDict = rawData as ClippingLocationNormalDict;
				location = locationNormalDict.location;
				normal = locationNormalDict.normal;
			}
			// See this file's header comment ("one small, disclosed compensating check").
			if (location === undefined || normal === undefined) {
				throw new TypeError("Clipping.parse: dict is missing required 'location'/'normal' fields (or a 'matrix')");
			}
			const dict = rawData as ClippingLocationNormalDict | ClippingMatrixDict;
			const clippingData = new Clipping({ location, normal, type: dict.type, operandType: dict.operandType });
			if (clippingData.type !== "IfcBooleanClippingResult") {
				throw new Error(`Provided clipping with unexpected result type "${clippingData.type}"`);
			}
			if (clippingData.operandType !== "IfcHalfSpaceSolid") {
				throw new Error(`Provided clipping with unexpected operand type "${clippingData.operandType}"`);
			}
			return clippingData;
		}
		throw new Error(`Unexpected clipping type provided: ${rawData}`);
	}

	/**
	 * Applies the clipping data as an `IfcBooleanClippingResult` to an operand (Python:
	 * `Clipping.apply`).
	 *
	 * @param ifcFile The model to create the entities in. Defaults to `firstOperand.file`
	 * when `null`.
	 * @param firstOperand The representation item to apply the boolean clipping to.
	 * @param unitScale The unit scale value to convert from the `Clipping`'s SI units to
	 * project units.
	 * @returns An `IfcBooleanClippingResult` which uses an `IfcHalfSpaceSolid` to clip
	 * `firstOperand`.
	 */
	apply(ifcFile: IfcFile | null, firstOperand: EntityInstance, unitScale: number): EntityInstance {
		const file = ifcFile ?? (firstOperand.file as IfcFile);

		const normal = this.normal;
		let arbitraryVector: Vec3;
		if (allClose(normal, [0.0, 0.0, 1.0], 1e-2) || allClose(normal, [0.0, 0.0, -1.0], 1e-2)) {
			arbitraryVector = [0.0, 1.0, 0.0];
		} else {
			arbitraryVector = [0.0, 0.0, 1.0];
		}

		const rawXAxis = cross(normal, arbitraryVector);
		const xAxisNorm = norm(rawXAxis);
		const xAxis: Vec3 = [rawXAxis[0] / xAxisNorm, rawXAxis[1] / xAxisNorm, rawXAxis[2] / xAxisNorm];

		const scaledLocation: Vec3 = [
			this.location[0] / unitScale,
			this.location[1] / unitScale,
			this.location[2] / unitScale,
		];

		const placement = createAxis2Placement3d(file, scaledLocation, this.normal, xAxis);
		const plane = file.createEntity("IfcPlane", placement);

		const secondOperand = file.createEntity("IfcHalfSpaceSolid", plane, false);
		return file.createEntity("IfcBooleanClippingResult", "DIFFERENCE", firstOperand, secondOperand);
	}
}
