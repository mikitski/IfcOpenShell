// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/clip_solid_bounded.py` (src/ifcopenshell-python,
// 117 lines) -- like `./clipSolid.ts`, but clips with a polygonally-bounded half-space
// (`IfcPolygonalBoundedHalfSpace`) rather than an unbounded one: the clipping plane is
// still infinite, but material is only removed within the extruded footprint of a 2D
// polygon.
//
// *** Deliberately does NOT reuse `util/data.ts`'s `Clipping.apply` -- duplicates its
// cross-product/normalize logic inline, matching real Python's own source exactly ***
//
// Real Python's `clip_solid_bounded.py` does NOT import `ifcopenshell.util.data` at
// all -- it re-derives `x_axis` via its own inline `np.cross(normal_arr,
// arbitrary_vector); x_axis /= np.linalg.norm(x_axis)` (plus the identical
// `np.allclose(normal_arr, [0,0,±1], atol=1e-2)` arbitrary-vector selection), rather than
// calling `Clipping.apply` or extracting a shared helper. Ported here as a genuine
// duplication of that same logic (a second, independent local `allClose`/`cross`/`norm`
// below), NOT refactored to share code with `../../util/data.ts` -- the real Python
// source itself doesn't share it, and this project's own established convention is to
// preserve that kind of duplication verbatim rather than "cleaning it up" into a shared
// abstraction the original authors didn't choose (see `../../util/data.ts`'s own header
// comment, and `../georeference/editWcs.ts`'s identically-reasoned `allClose`
// duplication, for the same precedent applied elsewhere in this codebase).
//
// *** `IfcPolygonalBoundedHalfSpace` verified to exist, with identical attribute order,
// across ALL 3 generated schemas -- not assumed ***
//
// `BaseSurface(IfcSurface)`, `AgreementFlag(boolean)`, `Position(IfcAxis2Placement3D)`,
// `PolygonalBoundary(IfcBoundedCurve)` -- confirmed byte-identical in `ifc2x3.d.ts`/
// `ifc4.d.ts`/`ifc4x3.d.ts` (this entity is NOT IFC4+-only, contrary to a first guess
// that a "polygonally bounded" refinement might be a later-schema addition -- it has
// existed since IFC2X3). `IfcPolyline(Points)` (the boundary's own concrete curve class,
// matching real Python's `file.createIfcPolyline`) and `IfcAxis2Placement3D`/
// `IfcCartesianPoint` are likewise identical across all 3 schemas. `apply` therefore
// runs unmodified against every schema -- confirmed by the real Python
// `test_clip_solid_bounded.py`'s own `TestClipSolidBoundedIFC2X3` subclass.
//
// *** The `element`/`BBIM_Boolean` pset branch: the IDENTICAL already-disclosed
// primitive-layer blocker as `./clipSolid.ts`, verified independently for this file too
// ***
//
// See `./clipSolid.ts`'s own header comment for the full writeup (`TODOS.md`'s
// `attribute_kind_of`/"Attribute access is only supported on entity instances" entry,
// via `editPset`'s own `castValueToPrimaryMeasureType`) -- this file's own `element`
// branch is byte-for-byte the same `get_pset`/`add_pset`/`edit_pset` shape as
// `clip_solid.py`'s (confirmed by reading both real Python sources side by side), so it
// hits the exact same gate, for the exact same reason, on every call regardless of
// whether `pset` is brand new or pre-existing. Ported completely and faithfully anyway,
// with no proactive guard; `test/api/geometry/clipSolidBounded.test.ts` pins this
// CURRENT, disclosed, blocked behavior for the `element`-provided test case.
//
// The boundary polygon's own closing-the-loop step (`scaled_pts.append(scaled_pts[0])`)
// is ported verbatim: the FIRST scaled point is pushed again onto the end of the array
// (a real, deliberate "repeat the first point to close the ring" convention for
// `IfcPolyline`, not a bug) -- `boundary_position`'s default `(0.0, 0.0, 0.0)` is also
// unit-scaled like every other coordinate here (even though it's usually the identity
// no-op `0/unit_scale = 0`), matching real Python's own unconditional division.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";
import { addPset } from "../pset/addPset";
import { editPset } from "../pset/editPset";

/** A plain 3-component vector -- see `../../util/data.ts`'s own identical `Vec3` type
 * doc comment for why this port uses plain arrays (not `gl-matrix`) for this kind of
 * small, non-matrix vector data. Duplicated here (not imported) since this file
 * deliberately does not depend on `util/data.ts` at all -- see this file's own header
 * comment. */
type Vec3 = readonly [number, number, number];

/** Python's `np.allclose(a, b, atol=...)`, with numpy's own default `rtol=1e-5` --
 * duplicated from (not imported from) `../../util/data.ts`'s own identically-shaped
 * private helper, matching this file's own header comment on why this whole
 * cross-product/normalize block is a deliberate duplication, not a shared import. */
function allClose(a: Vec3, b: Vec3, atol: number, rtol = 1e-5): boolean {
	return a.every((v, i) => Math.abs(v - b[i]) <= atol + rtol * Math.abs(b[i]));
}

/** Python's `np.cross(a, b)` for plain 3-component vectors -- duplicated, see above. */
function cross(a: Vec3, b: Vec3): Vec3 {
	return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** Python's `np.linalg.norm(v)` for a plain 3-component vector -- duplicated, see above. */
function norm(v: Vec3): number {
	return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/** Python's `ShapeBuilder.create_axis2_placement_3d` -- see `../../util/data.ts`'s own
 * identical helper's doc comment for why this one small method is duplicated per-module
 * rather than shared/imported. */
function createAxis2Placement3d(file: IfcFile, position: Vec3, zAxis: Vec3, xAxis: Vec3): EntityInstance {
	return file.createEntity(
		"IfcAxis2Placement3D",
		file.createEntity("IfcCartesianPoint", [position[0], position[1], position[2]]),
		file.createEntity("IfcDirection", [zAxis[0], zAxis[1], zAxis[2]]),
		file.createEntity("IfcDirection", [xAxis[0], xAxis[1], xAxis[2]]),
	);
}

export interface ClipSolidBoundedSettings {
	/** The solid to clip (`IfcSweptAreaSolid`, `IfcSweptDiskSolid`, or
	 * `IfcBooleanClippingResult`). */
	item: EntityInstance;
	/** A point on the (infinite) clipping plane, in the representation's local
	 * coordinate system (SI units). */
	location: Vec3;
	/** Plane normal pointing toward the material to be removed -- same convention as
	 * `./clipSolid.ts`'s own `normal`. */
	normal: Vec3;
	/**
	 * 2D `[x, y]` points (SI units) defining the closed polygonal boundary in the
	 * coordinate system of `boundaryPosition`. The polygon is automatically closed --
	 * do not repeat the first point.
	 */
	boundaryPoints: ReadonlyArray<readonly [number, number]>;
	/** 3D origin of the boundary coordinate system (axes default to the global X/Y/Z
	 * directions). Defaults to the origin. */
	boundaryPosition?: Vec3;
	/**
	 * If provided, the resulting `IfcBooleanClippingResult` is registered in the
	 * element's `BBIM_Boolean` property set. **Currently always throws** -- see this
	 * file's own header comment.
	 */
	element?: EntityInstance | null;
}

function clipSolidBoundedUsecase(file: IfcFile, settings: ClipSolidBoundedSettings): EntityInstance {
	const { item, location, normal, boundaryPoints, element } = settings;
	const boundaryPosition = settings.boundaryPosition ?? [0.0, 0.0, 0.0];

	const unitScale = calculateUnitScale(file);

	let arbitraryVector: Vec3;
	if (allClose(normal, [0.0, 0.0, 1.0], 1e-2) || allClose(normal, [0.0, 0.0, -1.0], 1e-2)) {
		arbitraryVector = [0.0, 1.0, 0.0];
	} else {
		arbitraryVector = [0.0, 0.0, 1.0];
	}
	const rawXAxis = cross(normal, arbitraryVector);
	const xAxisNorm = norm(rawXAxis);
	const xAxis: Vec3 = [rawXAxis[0] / xAxisNorm, rawXAxis[1] / xAxisNorm, rawXAxis[2] / xAxisNorm];

	const scaledLocation: Vec3 = [location[0] / unitScale, location[1] / unitScale, location[2] / unitScale];
	const planePlacement = createAxis2Placement3d(file, scaledLocation, normal, xAxis);
	const plane = file.createEntity("IfcPlane", planePlacement);

	const scaledBoundaryPosition: Vec3 = [
		boundaryPosition[0] / unitScale,
		boundaryPosition[1] / unitScale,
		boundaryPosition[2] / unitScale,
	];
	const boundaryPosEntity = file.createEntity(
		"IfcAxis2Placement3D",
		file.createEntity("IfcCartesianPoint", [
			scaledBoundaryPosition[0],
			scaledBoundaryPosition[1],
			scaledBoundaryPosition[2],
		]),
	);

	const scaledPts: Array<[number, number]> = boundaryPoints.map((p) => [p[0] / unitScale, p[1] / unitScale]);
	scaledPts.push(scaledPts[0]); // close the polygon -- see this file's own header comment.
	const ifcPts = scaledPts.map((p) => file.createEntity("IfcCartesianPoint", p));
	const boundary = file.createEntity("IfcPolyline", ifcPts);

	const halfSpace = file.createEntity("IfcPolygonalBoundedHalfSpace", plane, false, boundaryPosEntity, boundary);
	const result = file.createEntity("IfcBooleanClippingResult", "DIFFERENCE", item, halfSpace);

	if (element != null) {
		const psetData = elementUtil.getPset(element, "BBIM_Boolean") as Record<string, unknown> | null;
		let pset: EntityInstance;
		let data: number[];
		if (psetData) {
			pset = file.byId(psetData.id as number);
			const existing = JSON.parse(psetData.Data as string) as number[];
			data = [...new Set([...existing, result.id()])];
		} else {
			pset = addPset(file, { product: element, name: "BBIM_Boolean" });
			data = [result.id()];
		}
		// Currently always throws here -- see this file's own header comment.
		editPset(file, { pset, properties: { Data: JSON.stringify(data) } });
	}

	return result;
}

/**
 * Clips a solid with a polygonally bounded half-space, returning an
 * `IfcBooleanClippingResult` (Python: `ifcopenshell.api.geometry.clip_solid_bounded`).
 *
 * Like `clipSolid`, but the boolean subtraction is restricted to the region enclosed by
 * `boundaryPoints` rather than extending across the entire half-space. The clipping
 * plane is still infinite, but material is only removed within the extruded footprint
 * of the polygon.
 *
 * The `normal` convention is the same as `clipSolid`: it points toward the **removed**
 * material.
 *
 * After clipping, set the parent `IfcShapeRepresentation`'s `RepresentationType` to
 * `"Clipping"`.
 *
 * @example
 * ```ts
 * const bcr = api.geometry.clipSolidBounded(model, {
 *   item: extrusion,
 *   location: [2.5, 0.0, 2.0],
 *   normal: [0.6, 0.0, 0.8],
 *   boundaryPoints: [[2.0, 0.0], [3.0, 0.0], [3.0, 2.0], [2.0, 2.0]],
 * });
 * ```
 */
export const clipSolidBounded = wrapUsecase("geometry.clip_solid_bounded", clipSolidBoundedUsecase);
