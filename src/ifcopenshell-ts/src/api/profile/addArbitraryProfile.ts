// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/profile/add_arbitrary_profile.py` (src/ifcopenshell-python,
// 83 lines) -- part of this project's brand-new `api.profile` module (see
// `./index.ts`'s own header comment).
//
// --- The `numpy`/`shape_builder` import is NOT a blocker -- confirmed by reading the
// real source directly, not assumed ---
//
// Real Python imports `numpy.typing as npt` and, from `ifcopenshell.util.shape_builder`,
// `SequenceOfVectors`/`V`/`ifc_safe_vector_type`. The ONLY actual numpy operation used
// anywhere in this file is `co / self.unit_scale` in `convert_si_to_unit` -- a plain
// elementwise scalar division of a list of 2D/3D coordinate tuples by a single scalar
// (`unit_scale`). There is NO matrix multiplication, NO linear algebra, NO cross/dot
// product anywhere in this file. `V(profile)` just turns the plain input (a list of
// coordinate tuples) into a numpy array so `/` broadcasts across it; `ifc_safe_vector_type`
// converts the array's elements back to plain floats for the final attribute write.
// This project already has a direct TS port of both (`../../util/shapeBuilder.ts`'s
// `V`/`ifcSafeVectorType`, landed in an earlier chunk and already reused by
// `../structural/editStructuralConnectionCs.ts`/`editStructuralItemAxis.ts` for the
// identical situation) -- reused here directly. `convert_si_to_unit` itself is ported
// as a tiny local helper (`convertSiToUnit` below) that maps over the plain
// `number[][]` `V()` already produced and divides every number by `unitScale` -- no
// real numpy port needed at all.
//
// --- Real IFC2X3-vs-IFC4+ schema branch, ported verbatim ---
//
// Confirmed directly against the generated `.d.ts`s: IFC2X3 has no
// `IfcIndexedPolyCurve`/`IfcCartesianPointList2D`/`IfcCartesianPointList3D` at all
// (all three are IFC4+ additions) -- a real, load-bearing schema divergence, not a
// stylistic choice in real Python. On IFC2X3 the profile's boundary curve is built as
// an `IfcPolyline` of individual `IfcCartesianPoint`s; on IFC4/IFC4X3 it's an
// `IfcIndexedPolyCurve` over a single `IfcCartesianPointList2D`/`3D` (chosen by the
// point array's own dimensionality), which is far more compact for large polylines.
// Both branches ported faithfully below.
//
// --- Positional entity construction, verified against generated `.d.ts`s ---
//
// `IfcCartesianPoint`: `Coordinates` only (index 0) -- `file.createEntity("IfcCartesianPoint",
// ifcSafeVectorType(p))`. `IfcPolyline`: `Points` only (index 0), an array of
// `IfcCartesianPoint`. `IfcCartesianPointList2D`/`3D`: `CoordList` first (index 0;
// IFC4X3 additionally has an optional, nullable `TagList` at index 1, left unset here
// exactly like real Python, which never passes it either). `IfcIndexedPolyCurve`:
// `Points` first (index 0; `Segments`/`SelfIntersect` both left unset, matching real
// Python's single-positional-argument call -- an unsegmented `IfcIndexedPolyCurve`
// implicitly represents a single straight polyline through every point in `Points`,
// in order). `IfcArbitraryClosedProfileDef`: `ProfileType`(0)/`ProfileName`(1)/
// `OuterCurve`(2), identical across all 3 schemas.
//
// Real Python's `assert False, f"Invalid dimensions: {dimensions}."` (reachable only
// if a caller passes coordinate tuples of some length other than 2 or 3) is ported as
// a thrown `Error` with the identical message -- unreachable in practice for any
// sane caller, preserved verbatim rather than silently dropped.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type SequenceOfVectors, V, ifcSafeVectorType } from "../../util/shapeBuilder";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";

/** Python's `convert_si_to_unit` -- divides every coordinate of every point by
 * `unitScale`, elementwise (the ONLY real numpy operation in this file -- see this
 * file's own header comment). */
function convertSiToUnit(points: readonly (readonly number[])[], unitScale: number): number[][] {
	return points.map((point) => point.map((n) => n / unitScale));
}

export interface AddArbitraryProfileSettings {
	/** A list of coordinates, in SI meters. */
	profile: SequenceOfVectors;
	/**
	 * If the profile is semantically significant (i.e. to be managed and reused by the
	 * user) then it must be named. Otherwise, this may be left unset.
	 */
	name?: string | null;
}

function addArbitraryProfileUsecase(file: IfcFile, settings: AddArbitraryProfileSettings): EntityInstance {
	const name = settings.name ?? null;
	const unitScale = calculateUnitScale(file);
	const points = convertSiToUnit(V(settings.profile) as number[][], unitScale);

	let curve: EntityInstance;
	if (file.schema === "IFC2X3") {
		curve = file.createEntity(
			"IfcPolyline",
			points.map((p) => file.createEntity("IfcCartesianPoint", ifcSafeVectorType(p))),
		);
	} else {
		const dimensions = points[0].length;
		let ifcPoints: EntityInstance;
		if (dimensions === 2) {
			ifcPoints = file.createEntity("IfcCartesianPointList2D", ifcSafeVectorType(points));
		} else if (dimensions === 3) {
			ifcPoints = file.createEntity("IfcCartesianPointList3D", ifcSafeVectorType(points));
		} else {
			throw new Error(`Invalid dimensions: ${dimensions}.`);
		}
		curve = file.createEntity("IfcIndexedPolyCurve", ifcPoints);
	}
	return file.createEntity("IfcArbitraryClosedProfileDef", "AREA", name, curve);
}

/**
 * Adds a new arbitrary polyline-based profile (Python:
 * `ifcopenshell.api.profile.add_arbitrary_profile`).
 *
 * The profile is represented as a polyline defined by a list of coordinates. Only
 * straight segments are allowed. Coordinates must be provided in SI meters.
 *
 * To represent a closed curve, the first and last coordinate must be identical.
 *
 * @example
 * ```ts
 * // A 10mm by 100mm rectangle, such that might be used as a wooden skirting board or kick plate.
 * const square = api.profile.addArbitraryProfile(model, {
 *   profile: [[0.0, 0.0], [0.01, 0.0], [0.01, 0.1], [0.0, 0.1], [0.0, 0.0]],
 *   name: "SK01 Profile",
 * });
 * ```
 */
export const addArbitraryProfile = wrapUsecase("profile.add_arbitrary_profile", addArbitraryProfileUsecase);
