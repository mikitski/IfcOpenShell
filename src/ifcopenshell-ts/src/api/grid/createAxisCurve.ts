// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/grid/create_axis_curve.py` (src/ifcopenshell-python, 92
// lines) -- part of this project's brand-new `api.grid` module (see `./index.ts`'s own
// header comment), and the most complex of the module's 3 files: it localizes a
// world-space 2-point line into the owning `IfcGrid`'s own local coordinate system via
// real 4x4 matrix math (`np.linalg.inv` + a matrix-vector transform), then stores it as
// a 2D `IfcPolyline`.
//
// --- Every dependency confirmed already-landed, none of this is a blocker ---
//
// `util.element.remove_deep2` -> `util/element.ts`'s `removeDeep2` (already landed, and
// already this module's own `removeGridAxis.ts` dependency). `util.placement.
// get_local_placement` -> `util/placement.ts`'s `getLocalPlacement` (already landed and
// already verified -- see that file's own header comment -- for the exact `gl-matrix`
// `mat4` column-major flat-index encoding this port relies on). `util.unit.
// calculate_unit_scale` -> `util/unit.ts`'s `calculateUnitScale` (already landed,
// already reused by `../profile/addArbitraryProfile.ts` for the identical "SI meters ->
// project units" division). `util.shape_builder.V`/`ifc_safe_vector_type`/
// `np_apply_matrix` -> `util/shapeBuilder.ts`'s already-landed `V`/`ifcSafeVectorType`/
// `npApplyMatrix` -- all three reused directly below, not reinvented (`npApplyMatrix`
// in particular already exists as a general-purpose exported helper, built on
// `vec3.transformMat4`; see its own doc comment in `shapeBuilder.ts` for why that's the
// verified, algebraically-identical `gl-matrix` equivalent of numpy's `vectors @
// m3x3.T + translation`).
//
// --- `np.linalg.inv` -> `mat4.invert`: reusing the ALREADY-VERIFIED convention, not
//     re-deriving it ---
//
// This function's one non-trivial operation, `np.linalg.inv(get_local_placement(grid.
// ObjectPlacement))`, is a strict subset of what `../geometry/editObjectPlacement.ts`'s
// own `getRelativePlacement` already needed and verified (`np.linalg.inv(A) @ B`, of
// which this is just the `inv(A)` half, applied to points instead of composed with a
// second matrix) -- see that file's own header comment for the full empirical
// verification (`mat4.invert`/`mat4.multiply` cross-checked against numpy's `inv(A) @
// B` with hand-checkable matrices, both independently and via a disposable Node/Python
// script pair). Reused identically here: `mat4.invert(out, gridMatrix)` matches `np.
// linalg.inv(gridMatrix)` exactly, no new verification needed. Like that file,
// `mat4.invert` returning `null` (a singular matrix) is guarded with a thrown error
// rather than silently propagating a bogus all-zero result -- numpy's own `np.linalg.
// inv` raises `LinAlgError` for the same input, so this is parity, not an added
// restriction; genuinely unreachable in practice since `getLocalPlacement`'s output is
// always a real orthonormal rotation + translation (always invertible).
//
// --- `np_apply_matrix` -> `vec3.transformMat4`: already a landed, general-purpose
//     helper, not something this file introduces ---
//
// `util/shapeBuilder.ts`'s own header comment documents the full algebraic proof that
// `vectors @ m3x3.T + translation` (numpy's `np_apply_matrix`) is identical to
// `gl-matrix`'s `vec3.transformMat4` convention for a standard affine (rotation +
// translation, homogeneous `w=1`) 4x4 matrix -- this file's own `gridMatrixI` (the
// inverse of a real placement matrix) is exactly such a matrix, so `npApplyMatrix` is
// reused directly here with no further per-caller verification needed.
//
// --- Semantics ported in Python's own order ---
//
// 1. `existingCurve = gridAxis.AxisCurve` is read FIRST (before any mutation), matching
//    real Python's own read-before-overwrite ordering.
// 2. `points = V([p1, p2])` builds a 2x3 array; `isSi` (default `true`) divides every
//    coordinate by `calculateUnitScale(file)` -- SI meters -> project units -- BEFORE
//    the matrix transform is applied (real Python's own order: unit conversion happens
//    in "world" space, the placement matrix transform happens afterward, both still in
//    project units).
// 3. The owning `IfcGrid` is found via `file.getInverse(gridAxis)`, filtered to
//    `isA("IfcGrid")` -- reproducing real Python's own `next(i for i in
//    file.get_inverse(grid_axis) if i.is_a("IfcGrid"))` exactly (NOT the
//    `PartOfU`/`PartOfV`/`PartOfW` inverse-attribute shortcut `../drawing/
//    assignProduct.ts`'s sibling function uses for a similar lookup -- real Python's
//    own `create_axis_curve.py` genuinely uses the generic inverse scan instead, so
//    that's what's ported here, not "improved" to match the other file's approach).
//    Real Python's `next(...)` raises `StopIteration` if no `IfcGrid` references this
//    axis (an axis that was never added to any grid's `UAxes`/`VAxes`/`WAxes`) -- this
//    port throws a descriptive `Error` for the same unreachable-in-normal-use case
//    (matching this project's established "throw a clear, real error rather than
//    silently propagate `undefined`" convention, not a verbatim `StopIteration`
//    message, since JS has no equivalent built-in to reproduce byte-for-byte).
// 4. `gridMatrixI = inv(getLocalPlacement(grid.ObjectPlacement))`; `p1, p2 =
//    ifcSafeVectorType(npApplyMatrix(points, gridMatrixI))` -- the points, now in the
//    grid's own local coordinate system, in project units.
// 5. `gridAxis.AxisCurve` is set to a new `IfcPolyline` over `p1.slice(0, 2)`/
//    `p2.slice(0, 2)` (Python's `p1[:2]`/`p2[:2]`) -- ONLY the X/Y components are kept
//    (grid axes are inherently planar/2D, matching the function's own docstring: "the
//    coordinates will be localized relative to IfcGrid and saved as 2D").
// 6. `existingCurve` (read in step 1) is purged via `removeDeep2` LAST, only if it was
//    set -- and only AFTER `gridAxis.AxisCurve` has already been reassigned to the new
//    curve (a direct, non-null-intermediate entity-to-entity reassignment, exactly like
//    real Python's own `grid_axis.AxisCurve = file.create_entity(...)` followed by a
//    separate `remove_deep2` call). This is NOT the buggy `.set(name, null)` code path
//    `../geometry/editObjectPlacement.ts`'s header comment discloses (that bug is
//    specific to explicitly nulling an attribute that previously held a value) --
//    here, the attribute goes directly from its old entity value to a brand-new one,
//    the case that file's own investigation already confirmed correctly unregisters
//    the old inverse, so `existingCurve`'s own inverse count is already accurately zero
//    (assuming nothing else references it) by the time `removeDeep2` runs.
//
// No unported dependency, no disclosed primitive-layer gap, no Python-source bug found
// in this file (unlike its 2 sibling files in this module -- see `removeGridAxis.ts`'s
// own header comment for a real, disclosed bug in a DIFFERENT file of this module).
//
// --- Positional entity construction, verified against all 3 generated `.d.ts`s ---
//
// `IfcCartesianPoint`: `Coordinates` only (index 0) -- identical in all 3 schemas.
// `IfcPolyline`: `Points` only (index 0, an array of `IfcCartesianPoint`) -- identical
// in all 3 schemas. No schema divergence anywhere in this file.
//
// --- No real Python test exists for this file ---
//
// `test/api/grid/` only has `test_create_grid_axis.py`/`test_remove_grid_axis.py` --
// confirmed by directory listing, no `test_create_axis_curve.py` anywhere in the real
// Python test suite. `createAxisCurve.test.ts` is therefore written from scratch,
// directly from this file's own real source semantics/docstring example, with
// positions independently hand-verified (not just "doesn't throw") -- see that test
// file's own header comment for the exact hand worked-out rotation/translation
// fixture and its expected numeric result.

import { mat4 } from "gl-matrix";
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { getLocalPlacement } from "../../util/placement";
import { V, type VectorType, ifcSafeVectorType, npApplyMatrix } from "../../util/shapeBuilder";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";

/** Python's `next(i for i in file.get_inverse(grid_axis) if i.is_a("IfcGrid"))` --
 * throws (matching Python's own `StopIteration`, see this file's header comment) if
 * `gridAxis` isn't referenced by any `IfcGrid`. */
function findOwningGrid(file: IfcFile, gridAxis: EntityInstance): EntityInstance {
	for (const inverse of file.getInverse(gridAxis) as Set<EntityInstance>) {
		if (inverse.isA("IfcGrid")) return inverse;
	}
	throw new Error(
		"createAxisCurve: gridAxis is not referenced by any IfcGrid's UAxes/VAxes/WAxes (real Python's own `next(...)` would raise StopIteration here).",
	);
}

export interface CreateAxisCurveSettings {
	/** The first point of the grid axis, in world space. */
	p1: VectorType;
	/** The second point of the grid axis, in world space. */
	p2: VectorType;
	/** The `IfcGridAxis` element to add geometry to. */
	gridAxis: EntityInstance;
	/** If `true` (the default), `p1`/`p2` are in meters, not project units. */
	isSi?: boolean;
}

function createAxisCurveUsecase(file: IfcFile, settings: CreateAxisCurveSettings): void {
	const existingCurve = settings.gridAxis.get("AxisCurve") as EntityInstance | null;

	let points = V([settings.p1, settings.p2]) as number[][];
	const isSi = settings.isSi ?? true;
	if (isSi) {
		const unitScale = calculateUnitScale(file);
		points = points.map((point) => point.map((n) => n / unitScale));
	}

	const grid = findOwningGrid(file, settings.gridAxis);
	const gridMatrixI = mat4.create();
	// See this file's header comment for the full `np.linalg.inv` -> `mat4.invert`
	// verification (reused, not re-derived, from `../geometry/editObjectPlacement.ts`).
	if (!mat4.invert(gridMatrixI, getLocalPlacement(grid.get("ObjectPlacement") as EntityInstance | null))) {
		throw new Error("createAxisCurve: the grid's placement matrix is singular and cannot be inverted");
	}
	const [p1, p2] = ifcSafeVectorType(npApplyMatrix(points, gridMatrixI));

	settings.gridAxis.set(
		"AxisCurve",
		file.createEntity("IfcPolyline", [
			file.createEntity("IfcCartesianPoint", p1.slice(0, 2)),
			file.createEntity("IfcCartesianPoint", p2.slice(0, 2)),
		]),
	);

	if (existingCurve) {
		elementUtil.removeDeep2(file, existingCurve);
	}
}

/**
 * Adds curve geometry to a grid axis to represent the axis extents (Python:
 * `ifcopenshell.api.grid.create_axis_curve`).
 *
 * An IFC grid will have a minimum of two axes (typically perpendicular). Each axis will
 * then have a line which represents the extents of the axis.
 *
 * Points are provided as 3D coordinates in world space. During axis creation, the
 * coordinates will be localized relative to `IfcGrid` and saved as 2D.
 *
 * @example
 * ```ts
 * // A pretty standard rectangular grid, with only two axes.
 * const grid = api.root.createEntity(model, { ifcClass: "IfcGrid" });
 * const axisA = api.grid.createGridAxis(model, { axisTag: "A", uvwAxes: "UAxes", grid });
 * const axis1 = api.grid.createGridAxis(model, { axisTag: "1", uvwAxes: "VAxes", grid });
 *
 * // By convention, alphabetic grids are horizontal, and numeric are vertical
 * api.grid.createAxisCurve(model, { p1: [0, 0, 0], p2: [10, 0, 0], gridAxis: axisA });
 * api.grid.createAxisCurve(model, { p1: [0, 0, 0], p2: [0, 10, 0], gridAxis: axis1 });
 * ```
 */
export const createAxisCurve = wrapUsecase("grid.create_axis_curve", createAxisCurveUsecase);
