// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_referent_distance_along.py` (src/ifcopenshell-python,
// new file, 37 lines), added by real upstream commit
// `b5670c4fc5347ec5c2c621f3f53a1a737bd21d2b` ("Reverts from automatically adding stationing
// to alignments because of missing initial geometry. Adds support for stationing with
// decreasing values.") -- see `planning/ifcopenshell-ts/90-upstream-sync-plan.md` §4c and
// `TODOS.md`'s "Upstream sync, chunk 3 of 4" entry for the full context.
//
// Factors out the `DistanceAlong`-reading helper that used to be private to
// `distance_along_from_station.py` alone (`_distance_along_of_referent`, this port's own
// `./distanceAlongFromStation.ts`'s former `distanceAlongOfReferent`) into its own shared
// module, so `add_stationing_referent.py` can reuse it too: referents nested under an
// alignment must be sorted by increasing `DistanceAlong` (IFC CT 4.1.4.4.3), NOT by
// `Pset_Stationing.Station` directly -- for a reverse-stationed alignment (decreasing
// station values), increasing `DistanceAlong` means DECREASING `Station`, so sorting on
// `Station` would put referents in the wrong order.
//
// Module-private (`_`-prefixed, matching real Python's own leading underscore and this
// project's own established convention for a shared-but-not-public helper -- see
// `./_sortNest.ts`'s own header comment for the precedent) -- NOT re-exported from
// `./index.ts`. Both `./addStationingReferent.ts` (for its own `_sortNest` call) and
// `./distanceAlongFromStation.ts` (for its own per-referent (D, S, HasIncreasingStation)
// extraction) import this directly by relative path, matching real Python's own
// `from ifcopenshell.api.alignment._referent_distance_along import _referent_distance_along`
// in both files.
//
// No dependency of any kind, no blocker: reads `ObjectPlacement`/`RelativePlacement`/
// `Location`/`DistanceAlong`, all plain attribute reads. `DistanceAlong` is a real
// `IfcLengthMeasure`-SELECT-typed (`IfcCurveMeasureSelect`) attribute -- read via
// `.getByIndex(0)`, not `.get("wrappedValue")`, matching this project's established
// cross-module `wrappedValueOf` convention (see `./distanceAlongFromStation.ts`'s own
// header comment for why: the N-API attribute-value shim doesn't support the
// pseudo-attribute name `"wrappedValue"` on a standalone declared-type instance, only
// `.getByIndex(0)` -- reading an already-populated simple-type value this way is
// confirmed to work fine regardless of how the instance was constructed).
//
// Real Python's own `if placement and placement.is_a("IfcLinearPlacement"):` guards
// against `placement` itself being falsy/`None` -- a real, if minor, difference from the
// OLD private `_distance_along_of_referent` this replaces (which read
// `placement.is_a(...)` unguarded, assuming `ObjectPlacement` was always set). Ported
// with the equivalent TS null-guard (`placement?.isA(...)`).
import { EntityInstance } from "../../entityInstance";

/** Python's `x.wrappedValue` for a defined/select-type-wrapped scalar -- see this
 * file's own header comment. */
function wrappedValueOf(value: unknown): unknown {
	return value instanceof EntityInstance ? value.getByIndex(0) : value;
}

/**
 * The distance along the basis curve at which a referent is placed (Python:
 * `ifcopenshell.api.alignment._referent_distance_along`).
 *
 * Read from `IfcLinearPlacement.RelativePlacement.Location.DistanceAlong`. An
 * `IfcLocalPlacement` fallback (semantic-only alignment, or a placement that could not
 * yet be expressed relative to a basis curve) carries no `DistanceAlong`; it is only
 * ever used for the starting referent, at distance `0.0` (the global origin).
 *
 * Referents nested under an alignment are ordered by increasing `DistanceAlong` (IFC CT
 * 4.1.4.4.3) -- which, for a reverse-stationed alignment, means by decreasing `Station`.
 * Sort on this, never on `Pset_Stationing.Station`.
 *
 * @param referent The `IfcReferent`.
 * @returns The distance along the basis curve, or `0.0` for a non-`IfcLinearPlacement`
 *   (or missing) `ObjectPlacement`.
 */
export function _referentDistanceAlong(referent: EntityInstance): number {
	const placement = referent.get("ObjectPlacement") as EntityInstance | null;
	if (placement?.isA("IfcLinearPlacement")) {
		const relativePlacement = placement.get("RelativePlacement") as EntityInstance;
		const location = relativePlacement.get("Location") as EntityInstance;
		return wrappedValueOf(location.get("DistanceAlong")) as number;
	}
	return 0.0;
}
