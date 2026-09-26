// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/boundary/assign_connection_geometry.py` (src/ifcopenshell-
// python, 133 lines, the most complex file in this project's brand-new `api.boundary`
// module -- see `./index.ts`'s own header comment). Builds an `IfcConnectionSurfaceGeometry`
// (a bounded plane) from an outer boundary polyline, zero or more inner boundary
// polylines, and a positional matrix (location/axis/ref direction), and assigns it to
// an `IfcRelSpaceBoundary`'s `ConnectionGeometry` attribute.
//
// --- The `numpy`/`shape_builder` import is NOT a blocker -- confirmed by reading the
// real source directly, not assumed ---
//
// Real Python imports `numpy as np`/`numpy.typing as npt` and, from
// `ifcopenshell.util.shape_builder`, `SequenceOfVectors`/`V`/`ifc_safe_vector_type`.
// There are exactly TWO real numpy operations anywhere in this file, and NEITHER is
// matrix math or linear algebra (unlike `api.grid`/`api.geometry.editObjectPlacement`'s
// own real 4x4 matrix-inversion work, which this file needs none of):
//
// 1. `point / self.unit_scale` (`create_point`) -- a plain elementwise scalar division
//    of a 2/3-component coordinate array by a single scalar, the SAME already-
//    established pattern `../profile/addArbitraryProfile.ts`'s/
//    `../structural/`'s own `convert_si_to_unit`-style helpers already use. This
//    project already has a direct TS port of `V`/`ifcSafeVectorType`
//    (`../../util/shapeBuilder.ts`, landed in an earlier chunk) -- reused directly
//    below; no real numpy port needed for this operation at all.
// 2. `np.allclose(points[0], points[-1])` (`create_polyline`) -- an approximate-
//    equality check between two coordinate arrays, used to detect whether the caller
//    already explicitly closed their polyline by repeating the first point as the last
//    (so it isn't double-closed by `close_polyline` below). Ported as a small local
//    `allClose` helper reproducing numpy's own default tolerance formula (`abs(a - b)
//    <= atol + rtol * abs(b)`, with numpy's own defaults `rtol=1e-5`/`atol=1e-8`),
//    applied per-coordinate across the two points (all coordinates must be within
//    tolerance for the points to be considered equal) -- duplicated as a per-module
//    private helper rather than imported, per this project's established "small
//    per-module private helpers" convention (`../../util/shapeBuilder.ts`'s own,
//    module-private `allClose` -- used internally there for an unrelated call site --
//    is NOT exported and is not reused here for that same reason; both are independent
//    transcriptions of the identical numpy formula).
//
// There is no other numpy usage anywhere in this file -- confirmed by reading it in
// full.
//
// --- Schema divergence check: NONE found ---
//
// `IfcRelSpaceBoundary`/`IfcCurveBoundedPlane`/`IfcConnectionSurfaceGeometry`/
// `IfcPlane`/`IfcAxis2Placement3D`/`IfcPolyline`/`IfcCartesianPoint`/`IfcDirection` are
// all identical in shape/attribute order across `ifc2x3.d.ts`/`ifc4.d.ts`/
// `ifc4x3.d.ts` (confirmed directly). `ConnectionGeometry` itself is a plain, always-
// present, nullable `IfcConnectionGeometry` attribute on `IfcRelSpaceBoundary` in every
// schema -- no `hasattr`-style guard is needed here (unlike `./editAttributes.ts`'s own
// `ParentBoundary`/`CorrespondingBoundary` handling).
//
// --- Positional entity construction, verified against generated `.d.ts`s ---
//
// `IfcCartesianPoint`: `Coordinates` only (index 0). `IfcDirection`:
// `DirectionRatios` only (index 0). `IfcAxis2Placement3D`: `Location`(0)/`Axis`(1)/
// `RefDirection`(2) -- identical across all 3 schemas. `IfcPlane`: `Position` only
// (index 0). `IfcPolyline`: `Points` only (index 0). `IfcCurveBoundedPlane`:
// `BasisSurface`(0)/`OuterBoundary`(1)/`InnerBoundaries`(2), a non-nullable
// `IfcCurve[]` in every schema -- real Python always passes a (possibly empty) tuple,
// never omits it, ported the same way below. `IfcConnectionSurfaceGeometry`:
// `SurfaceOnRelatingElement`(0)/`SurfaceOnRelatedElement`(1, nullable) -- real Python's
// own single-positional-argument call (`create_entity("IfcConnectionSurfaceGeometry",
// curve_bounded_plane)`) leaves `SurfaceOnRelatedElement` unset, ported identically.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type SequenceOfVectors, V, type VectorType, ifcSafeVectorType } from "../../util/shapeBuilder";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";

/** `np.allclose(a, b)` with numpy's own default `rtol=1e-5`/`atol=1e-8` -- see this
 * file's own header comment for why this is duplicated rather than imported from
 * `../../util/shapeBuilder.ts`'s own identical, module-private helper. */
function allClose(a: readonly number[], b: readonly number[]): boolean {
	return a.every((v, i) => Math.abs(v - b[i]) <= 1e-8 + 1e-5 * Math.abs(b[i]));
}

/** Python's `create_point` -- divides every coordinate of `point` by `unitScale`
 * (the ONLY other real numpy operation in this file -- see this file's own header
 * comment), then writes it as an `IfcCartesianPoint`. */
function createPoint(file: IfcFile, point: readonly number[], unitScale: number): EntityInstance {
	return file.createEntity("IfcCartesianPoint", ifcSafeVectorType(point.map((n) => n / unitScale)));
}

/** Python's `close_polyline` -- appends the first point again to the end, closing the
 * loop. */
function closePolyline(points: readonly EntityInstance[]): EntityInstance[] {
	return [...points, points[0]];
}

/** Python's `create_polyline`. If the caller already explicitly closed their polyline
 * by repeating the first point as the last (`allClose`), that trailing duplicate is
 * dropped first so `closePolyline` doesn't double-close it. */
function createPolyline(file: IfcFile, points: readonly (readonly number[])[], unitScale: number): EntityInstance {
	let pts = points;
	if (allClose(pts[0], pts[pts.length - 1])) {
		pts = pts.slice(0, pts.length - 1);
	}
	const ifcPoints = pts.map((point) => createPoint(file, point, unitScale));
	return file.createEntity("IfcPolyline", closePolyline(ifcPoints));
}

/** Python's `create_plane`. */
function createPlane(
	file: IfcFile,
	location: readonly number[],
	axis: readonly number[],
	refDirection: readonly number[],
	unitScale: number,
): EntityInstance {
	return file.createEntity(
		"IfcPlane",
		file.createEntity(
			"IfcAxis2Placement3D",
			createPoint(file, location, unitScale),
			file.createEntity("IfcDirection", ifcSafeVectorType(axis)),
			file.createEntity("IfcDirection", ifcSafeVectorType(refDirection)),
		),
	);
}

export interface AssignConnectionGeometrySettings {
	/** The space boundary relationship to assign the connection geometry to. */
	relSpaceBoundary: EntityInstance;
	/**
	 * A list of 2D points representing an open polyline. The last point will connect
	 * to the first point. The coordinates of the points are relative to the
	 * positional matrix arguments.
	 */
	outerBoundary: SequenceOfVectors;
	/**
	 * The local origin of the connection geometry, defined as an XYZ coordinate
	 * relative to the placement of the space that is being bounded.
	 */
	location: VectorType;
	/**
	 * The local X axis of the connection geometry, defined as an XYZ vector relative
	 * to the placement of the space that is being bounded.
	 */
	axis: VectorType;
	/**
	 * The local Z axis of the connection geometry, defined as an XYZ vector relative
	 * to the placement of the space that is being bounded. The Y vector is
	 * automatically derived using the right hand rule.
	 */
	refDirection: VectorType;
	/**
	 * A list of zero or more inner boundaries to use for the plane. Each boundary is
	 * represented by an open polyline, as defined by `outerBoundary`.
	 */
	innerBoundaries?: SequenceOfVectors;
	/**
	 * The unit scale as calculated by `calculateUnitScale`. If not provided, it will
	 * be automatically calculated for you.
	 */
	unitScale?: number;
}

function assignConnectionGeometryUsecase(file: IfcFile, settings: AssignConnectionGeometrySettings): void {
	const outerBoundary = V(settings.outerBoundary) as number[][];
	// `V()` is only typed for one level of vector/sequence-of-vector nesting (see its
	// own doc comment); `innerBoundaries` is a sequence OF sequences of vectors, so
	// each inner boundary is converted individually, matching
	// `../profile/addArbitraryProfileWithVoids.ts`'s own identical
	// `innerProfiles.map((p) => V(p) as number[][])` precedent for the same shape.
	const innerBoundaries = (settings.innerBoundaries ?? []).map((boundary) => V(boundary) as number[][]);
	const location = V(settings.location) as number[];
	const axis = V(settings.axis) as number[];
	const refDirection = V(settings.refDirection) as number[];
	const unitScale = settings.unitScale ?? calculateUnitScale(file);

	const outerBoundaryCurve = createPolyline(file, outerBoundary, unitScale);
	const innerBoundaryCurves = innerBoundaries.map((boundary) => createPolyline(file, boundary, unitScale));
	const plane = createPlane(file, location, axis, refDirection, unitScale);
	const curveBoundedPlane = file.createEntity("IfcCurveBoundedPlane", plane, outerBoundaryCurve, innerBoundaryCurves);
	const connectionGeometry = file.createEntity("IfcConnectionSurfaceGeometry", curveBoundedPlane);
	settings.relSpaceBoundary.set("ConnectionGeometry", connectionGeometry);
}

/**
 * Create and assign a connection geometry to a space boundary relationship (Python:
 * `ifcopenshell.api.boundary.assign_connection_geometry`).
 *
 * A space boundary may optionally have a plane that represents how that space is
 * adjacent to another space, known as the connection geometry. You may specify this
 * plane in terms of an outer boundary polyline, zero or more inner boundaries (such as
 * for windows), and a positional matrix for the orientation of the plane.
 *
 * @example
 * ```ts
 * api.boundary.assignConnectionGeometry(model, {
 *   relSpaceBoundary: boundary,
 *   outerBoundary: [[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0]],
 *   location: [0.0, 0.0, 0.0],
 *   axis: [1.0, 0.0, 0.0],
 *   refDirection: [0.0, 0.0, 1.0],
 * });
 * ```
 */
export const assignConnectionGeometry = wrapUsecase(
	"boundary.assign_connection_geometry",
	assignConnectionGeometryUsecase,
);
