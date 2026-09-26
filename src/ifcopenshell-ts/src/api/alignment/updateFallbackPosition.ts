// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/update_fallback_position.py`
// (src/ifcopenshell-python, 60 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 3 of many). Depends on already-landed
// `util.placement.getLocalPlacement` (`../../util/placement.ts`, verified against its
// real exported name/signature before use) -- no NEW blocker, though see this file's
// own note below about the SAME already-tracked `getAxis2placement` gap.
//
// `p[row, col]` (numpy) -> flat `gl-matrix` `mat4` index mapping used below (`p[0,3]`
// etc.) was independently re-derived from `util/placement.ts`'s own `a2p`/real numpy
// `a2p` source (row-major `R = r.T` where `r`'s rows 0-2 are the X/Y/Z basis vectors
// and row 3 is `[o0,o1,o2,1]`) and cross-checked against this SAME project's own
// already-landed `api/geometry/editObjectPlacement.ts`, which independently extracts
// the identical `x = [matrix[0], matrix[1], matrix[2]]` / `z = [matrix[8], matrix[9],
// matrix[10]]` / `o = [matrix[12], matrix[13], matrix[14]]` triples off a
// `getLocalPlacement` result -- confirmed to agree exactly, not assumed from one
// source alone: column 3 (index 12-14) is the translation, column 0 (index 0-2) is
// the local +X axis (`RefDirection`), column 2 (index 8-10) is the local +Z axis
// (`Axis`).
//
// *** NOT a new blocker, but worth flagging: this function's own REAL-WORLD usage
// almost always hits the SAME already-tracked `util/placement.ts` header-comment gap
// ***. `lp.RelativePlacement` is schema-typed `IfcAxis2PlacementLinear`, whose own
// `Location` is schema-typed `IfcPoint` -- concretely, for a real alignment-module
// `IfcLinearPlacement` (per this module's own docstring, "stationing referents" etc.),
// that `Location` is an `IfcPointByDistanceExpression` (no `Coordinates` attribute),
// not an `IfcCartesianPoint`. `getLocalPlacement(lp)` -> `getAxis2placement(lp
// .RelativePlacement)` therefore reaches `getAxis2placement`'s own already-disclosed
// `ifcopenshell.geom`-needing `else` branch (`util/placement.ts`'s header comment,
// finding shared with `TODOS.md`'s very first entry) for that common case -- this is
// the IDENTICAL pre-existing gap, not a new one introduced by this file, and this
// file makes no attempt to guard against or work around it (matching this project's
// "let the native/already-disclosed gap fail naturally" precedent). An
// `IfcAxis2PlacementLinear.Location` that DOES resolve to a real `IfcCartesianPoint`
// (a valid, if unusual for this module's own real usage, `IfcPoint` subtype) hits the
// fully-portable branch instead and works correctly end to end -- this file's own
// test suite exercises exactly that branch, since building a fixture for the
// `IfcPointByDistanceExpression` case would only re-exercise the already-disclosed,
// already-tested `getAxis2placement` gap, not this function's own logic.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getLocalPlacement } from "../../util/placement";

/**
 * Updates the `IfcLinearPlacement.CartesianPosition` fallback position (Python:
 * `ifcopenshell.api.alignment.update_fallback_position`).
 *
 * If `CartesianPosition` is not assigned to the `IfcLinearPlacement`, one will be
 * created.
 *
 * @param file The file.
 * @param lp The linear placement.
 */
export function updateFallbackPosition(file: IfcFile, lp: EntityInstance): void {
	if (!lp.get("CartesianPosition")) {
		lp.set(
			"CartesianPosition",
			file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0])),
		);
	}

	const p = getLocalPlacement(lp);

	const x = p[12];
	const y = p[13];
	const z = p[14];

	const rx = p[0];
	const ry = p[1];
	const rz = p[2];

	const ax = p[8];
	const ay = p[9];
	const az = p[10];

	const cartesianPosition = lp.get("CartesianPosition") as EntityInstance;
	(cartesianPosition.get("Location") as EntityInstance).set("Coordinates", [x, y, z]);

	if (!cartesianPosition.get("RefDirection")) {
		cartesianPosition.set("RefDirection", file.createEntity("IfcDirection", [1.0, 0.0, 0.0]));
	}

	if (!cartesianPosition.get("Axis")) {
		cartesianPosition.set("Axis", file.createEntity("IfcDirection", [0.0, 0.0, 1.0]));
	}

	(cartesianPosition.get("RefDirection") as EntityInstance).set("DirectionRatios", [rx, ry, rz]);
	(cartesianPosition.get("Axis") as EntityInstance).set("DirectionRatios", [ax, ay, az]);
}
