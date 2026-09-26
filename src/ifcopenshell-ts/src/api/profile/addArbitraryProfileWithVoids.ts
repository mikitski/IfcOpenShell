// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/profile/add_arbitrary_profile_with_voids.py`
// (src/ifcopenshell-python, 114 lines, the largest file in this module) -- part of
// this project's brand-new `api.profile` module (see `./index.ts`'s own header
// comment).
//
// --- The `numpy`/`shape_builder` import is NOT a blocker -- same finding as
// `./addArbitraryProfile.ts`, confirmed independently by reading THIS file's own
// source directly ---
//
// The only actual numpy operation anywhere in this file is `co / self.unit_scale`
// (`convert_si_to_unit`), applied once to the outer profile and once per inner
// profile -- plain elementwise scalar division, no matrix/vector math of any kind.
// Ported with the identical `convertSiToUnit` local helper `./addArbitraryProfile.ts`
// already established (duplicated here per this project's "small per-module private
// helpers" convention, matching `../../util/shapeBuilder.ts`'s own header comment on
// why `pythonRoundToDigits` is likewise duplicated rather than shared).
//
// --- Real IFC2X3-vs-IFC4+ schema branch, ported verbatim -- same schema divergence
// as `./addArbitraryProfile.ts` (IFC2X3 has no `IfcIndexedPolyCurve`/
// `IfcCartesianPointList2D`/`3D` at all, confirmed against the generated `.d.ts`s) ---
//
// On IFC2X3: both the outer curve and every inner curve are built as an `IfcPolyline`
// of individual `IfcCartesianPoint`s. On IFC4/IFC4X3: both are built as an
// `IfcIndexedPolyCurve` over a single `IfcCartesianPointList2D`/`3D`.
//
// *** Disclosed real Python bug, preserved verbatim: the OUTER curve's point-list
// class is NEVER dimension-checked on IFC4+ -- always `IfcCartesianPointList3D`,
// even for 2D input ***
//
// Confirmed by reading the exact real source lines (add_arbitrary_profile_with_voids.py:97-101):
// unlike `./addArbitraryProfile.ts`'s own single-profile `execute` (which DOES branch
// on `points.shape[1]` before choosing `IfcCartesianPointList2D` vs. `3D`) and unlike
// THIS SAME FILE's own inner-profile loop three lines below (which DOES branch on
// `inner_point.shape[1]`), the outer curve on IFC4+ unconditionally does:
//
//     outer_curve = self.file.create_entity(
//         "IfcIndexedPolyCurve",
//         (self.file.create_entity("IfcCartesianPointList3D", ifc_safe_vector_type(outer_points))),
//     )
//
// with NO dimension check at all. This means the real Python docstring's own example
// (`outer_profile=[(0., 0.), (.4, 0.), (.4, .4), (0., .4), (0., 0.)]` -- plain 2-tuples)
// produces an `IfcCartesianPointList3D` whose `CoordList` entries each have only 2
// coordinates, not 3 -- schema-invalid per the EXPRESS definition of
// `IfcCartesianPointList3D.CoordList` (`LIST [1:?] OF LIST [3:3] OF IfcLengthMeasure`),
// though `ifcopenshell` doesn't validate this at entity-creation time so it doesn't
// throw. Reproduced exactly, not "fixed" to match the inner-profile loop's own,
// evidently-more-careful dimension branch -- see this file's own test suite for a
// dedicated regression test pinning this exact, disclosed asymmetry.
//
// --- Positional entity construction, verified against generated `.d.ts`s ---
//
// Identical shapes to `./addArbitraryProfile.ts`'s own write-up for
// `IfcCartesianPoint`/`IfcPolyline`/`IfcCartesianPointList2D`/`3D`/`IfcIndexedPolyCurve`.
// `IfcArbitraryProfileDefWithVoids`: `ProfileType`(0)/`ProfileName`(1)/`OuterCurve`(2)/
// `InnerCurves`(3), identical across all 3 schemas (confirmed against all three
// `.d.ts`s).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type SequenceOfVectors, V, ifcSafeVectorType } from "../../util/shapeBuilder";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";

/** Python's `convert_si_to_unit` -- see `./addArbitraryProfile.ts`'s own copy of this
 * helper for the full "not a numpy blocker" writeup; duplicated here per this
 * project's "small per-module private helpers" convention. */
function convertSiToUnit(points: readonly (readonly number[])[], unitScale: number): number[][] {
	return points.map((point) => point.map((n) => n / unitScale));
}

export interface AddArbitraryProfileWithVoidsSettings {
	/** A list of coordinates for the outer profile, in SI meters. */
	outerProfile: SequenceOfVectors;
	/** A list of polylines (each a list of coordinates, in SI meters) for the inner profiles/voids. */
	innerProfiles: readonly SequenceOfVectors[];
	/**
	 * If the profile is semantically significant (i.e. to be managed and reused by the
	 * user) then it must be named. Otherwise, this may be left unset.
	 */
	name?: string | null;
}

function addArbitraryProfileWithVoidsUsecase(
	file: IfcFile,
	settings: AddArbitraryProfileWithVoidsSettings,
): EntityInstance {
	const name = settings.name ?? null;
	const unitScale = calculateUnitScale(file);
	const outerPoints = convertSiToUnit(V(settings.outerProfile) as number[][], unitScale);
	const innerPointsList = settings.innerProfiles.map((p) => convertSiToUnit(V(p) as number[][], unitScale));

	let outerCurve: EntityInstance;
	const innerCurves: EntityInstance[] = [];
	if (file.schema === "IFC2X3") {
		outerCurve = file.createEntity(
			"IfcPolyline",
			outerPoints.map((p) => file.createEntity("IfcCartesianPoint", ifcSafeVectorType(p))),
		);
		for (const innerPoints of innerPointsList) {
			innerCurves.push(
				file.createEntity(
					"IfcPolyline",
					innerPoints.map((p) => file.createEntity("IfcCartesianPoint", ifcSafeVectorType(p))),
				),
			);
		}
	} else {
		// See this file's own header comment: unlike the inner-profile loop below, the
		// outer curve is NEVER dimension-checked in real Python -- always
		// `IfcCartesianPointList3D`, even for 2D input. Preserved verbatim.
		outerCurve = file.createEntity(
			"IfcIndexedPolyCurve",
			file.createEntity("IfcCartesianPointList3D", ifcSafeVectorType(outerPoints)),
		);
		for (const innerPoints of innerPointsList) {
			const dimensions = innerPoints[0].length;
			let ifcPoints: EntityInstance;
			if (dimensions === 2) {
				ifcPoints = file.createEntity("IfcCartesianPointList2D", ifcSafeVectorType(innerPoints));
			} else if (dimensions === 3) {
				ifcPoints = file.createEntity("IfcCartesianPointList3D", ifcSafeVectorType(innerPoints));
			} else {
				throw new Error(`Invalid dimensions: ${dimensions}.`);
			}
			innerCurves.push(file.createEntity("IfcIndexedPolyCurve", ifcPoints));
		}
	}
	return file.createEntity("IfcArbitraryProfileDefWithVoids", "AREA", name, outerCurve, innerCurves);
}

/**
 * Adds a new arbitrary polyline-based profile with voids (Python:
 * `ifcopenshell.api.profile.add_arbitrary_profile_with_voids`).
 *
 * The outer profile is represented as a polyline defined by a list of coordinates.
 * Only straight segments are allowed. Coordinates must be provided in SI meters.
 *
 * To represent a closed curve, the first and last coordinate must be identical.
 *
 * The inner profiles are represented as a list of polylines. Every polyline is
 * defined by a list of coordinates. Only straight segments are allowed. Coordinates
 * must be provided in SI meters.
 *
 * @example
 * ```ts
 * // A 400mm by 400mm square with a 200mm by 200mm hole in it.
 * const squareWithHole = api.profile.addArbitraryProfileWithVoids(model, {
 *   outerProfile: [[0.0, 0.0], [0.4, 0.0], [0.4, 0.4], [0.0, 0.4], [0.0, 0.0]],
 *   innerProfiles: [[[0.1, 0.1], [0.3, 0.1], [0.3, 0.3], [0.1, 0.3], [0.1, 0.1]]],
 *   name: "SK01 Hole Profile",
 * });
 * ```
 */
export const addArbitraryProfileWithVoids = wrapUsecase(
	"profile.add_arbitrary_profile_with_voids",
	addArbitraryProfileWithVoidsUsecase,
);
