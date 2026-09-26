// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/distance_along_from_station.py`
// (src/ifcopenshell-python, 102 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 2 of many). Depends on chunk 1's
// already-landed `getStationingNest` and this same chunk's own
// `getAlignmentStartStation` (`./getAlignmentStartStation.ts`) and `util.element`'s
// already-landed `getPset` -- no blocker.
//
// --- UPDATE (upstream sync chunk 3 of 4, upstream commit
//     `b5670c4fc5347ec5c2c621f3f53a1a737bd21d2b`): reverse (decreasing) stationing
//     support ---
//
// See `TODOS.md`'s "Upstream sync, chunk 3 of 4" entry and
// `planning/ifcopenshell-ts/90-upstream-sync-plan.md` §4c for the full context. Real
// upstream's own 70-line rewrite of `distance_along_from_station.py` does two things:
//
// 1. **Factors the former private `_distance_along_of_referent` helper out** into a new
//    shared file, `_referent_distance_along.py` (this port: `./_referentDistanceAlong.ts`),
//    so `add_stationing_referent.py` can reuse it for its own nest-sort call too. This
//    file's own former local `distanceAlongOfReferent`/`wrappedValueOf` pair is REMOVED;
//    both now live in `./_referentDistanceAlong.ts`, imported directly.
// 2. **Adds a direction-sign ("sigma") walk over the sorted referents**, reading each
//    referent's own optional `Pset_Stationing.HasIncreasingStation` alongside its
//    `DistanceAlong`/`Station`. `sigma` starts at `+1.0` (increasing) and is reassigned
//    to `+1.0`/`-1.0` at any referent carrying an EXPLICIT `HasIncreasingStation` value
//    (a `null` -- i.e. absent -- value leaves the current `sigma` unchanged, it does NOT
//    reset to `+1.0`) -- so each referent's own "governs from here on" region has a
//    known direction. The old `outgoingStation <= station` per-region test (which
//    implicitly assumed stations only ever increase) becomes `sigma * (station -
//    outgoingStation) >= 0.0`, and the old `distanceAlong + (station - outgoingStation)`
//    extrapolation/interpolation becomes `distanceAlong + sigma * (station -
//    outgoingStation))` throughout -- `sigma` may flip any number of times along the
//    alignment (unrealistic, but valid IFC per real upstream's own new test,
//    `test_distance_along_from_station_multiple_direction_switches`), and this handles
//    that correctly. When `sigma` never flips (the common, `HasIncreasingStation`-never-set
//    case), `sigma` stays `1.0` throughout and this is byte-for-byte the same computation
//    as before -- a real, verified backward-compatible generalization, not a rewrite of
//    the non-reverse-stationing behavior.
//
// Note that "gap"/"overlap" station equations and a `HasIncreasingStation` direction
// reversal are now the SAME mechanism from this function's own point of view -- both are
// just a place where the (distanceAlong, outgoingStation, sigma) triples stop advancing
// monotonically in the way a plain forward walk would expect, and the shared
// "does the next referent's own advance overshoot the gap to the FOLLOWING referent"
// gap-detection test (`advance > nextDistanceAlong - distanceAlong`) and
// "return the most downstream (last, by DistanceAlong) match" overlap-resolution rule
// both still apply unchanged, whichever mechanism created the discontinuity.
//
// Real Python's own `station - start_station` (the no-`stationing_nest` branch) would
// raise `TypeError` if `get_alignment_start_station` returns `None` (a real, disclosed
// quirk of that function -- see `./getAlignmentStartStation.ts`'s own header
// comment). JS's `-` operator coerces `null` to `0` instead of throwing, so this port
// silently returns `station` rather than crashing in that same scenario -- reachable
// via `get_alignment_start_station`'s own recursive parent-alignment walk (THIS
// alignment has no stationing nest of its own -- any directly-nested `IfcReferent`
// would also make `get_stationing_nest` non-null, routing to the OTHER branch
// entirely -- but a PARENT alignment's own `IfcReferent` with no
// `Pset_Stationing.Station` makes the recursive call return `null`); see
// `./distanceAlongFromStation.test.ts`'s own dedicated test for this exact scenario.
// Not independently guarded against here -- preserving the CALLED function's own
// already-disclosed quirk is this file's job, not re-deriving Python's exact crash
// semantics for a value it merely passes through arithmetically.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getPset } from "../../util/element";
import { _referentDistanceAlong } from "./_referentDistanceAlong";
import { getAlignmentStartStation } from "./getAlignmentStartStation";
import { getStationingNest } from "./getStationingNest";

/**
 * Given a station, returns the distance along the horizontal alignment (Python:
 * `ifcopenshell.api.alignment.distance_along_from_station`).
 *
 * If the alignment does not have stationing defined with an `IfcReferent`, the start
 * of the alignment is assumed to be at station `0.0`. That is, the station is the
 * distance along.
 *
 * Station equations (where `Pset_Stationing.IncomingStation` is set on a referent) and
 * reverse (decreasing) stationing (where `Pset_Stationing.HasIncreasingStation` is
 * `false`) are taken into account.
 *
 * For each `STATION` referent nested to the alignment, `DistanceAlong` (D) and the
 * outgoing station (S, i.e. `Pset_Stationing.Station`) are read off and sorted by
 * `DistanceAlong`. A direction sign is tracked while walking the sorted referents: it
 * starts at `+1` and is set to `+1` or `-1` at any referent that carries an explicit
 * `Pset_Stationing.HasIncreasingStation`, so each referent's region has a sign sigma of
 * `+1` (increasing) or `-1` (decreasing). `HasIncreasingStation` may flip any number of
 * times along the alignment -- unrealistic, but valid IFC, and handled. The governing
 * referent is the last one, by `DistanceAlong`, for which `sigma * (station - S) >= 0`,
 * and the distance along is `D + sigma * (station - S)`.
 *
 * If the station falls within a gap introduced by a station equation -- that is, it was
 * skipped over by the equation -- there is no distance along that corresponds to it, and
 * `null` is returned.
 *
 * Note that an overlap station equation -- or a `HasIncreasingStation` direction
 * reversal, which creates an equivalent overlap zone -- causes a range of stations to
 * correspond to two (or more) distinct distances along the alignment. This
 * implementation returns the most downstream one (largest `DistanceAlong`), i.e. the
 * match in the region following the last equation/reversal.
 *
 * @param file The model.
 * @param alignment The alignment.
 * @param station Station value.
 * @returns Distance along the horizontal alignment, or `null` if the station falls
 *   inside a station equation gap.
 *
 * @example
 * ```ts
 * // alignment with start station 1+00.00
 * const alignment = file.byType("IfcAlignment")[0];
 * const distAlong = api.alignment.distanceAlongFromStation(model, alignment, 200.0);
 * console.log(distAlong); // 100.00
 * ```
 */
export function distanceAlongFromStation(file: IfcFile, alignment: EntityInstance, station: number): number | null {
	const stationingNest = getStationingNest(file, alignment);
	if (stationingNest === null) {
		const startStation = getAlignmentStartStation(file, alignment);
		return station - (startStation as number);
	}

	const referents: Array<[number, number, boolean | null]> = (
		stationingNest.get("RelatedObjects") as EntityInstance[]
	).map((referent) => [
		_referentDistanceAlong(referent),
		getPset(referent, "Pset_Stationing", "Station") as number,
		getPset(referent, "Pset_Stationing", "HasIncreasingStation") as boolean | null,
	]);
	referents.sort((a, b) => a[0] - b[0]);

	// Assign each referent's region a direction sign: +1 increasing, -1 decreasing. The
	// sign starts increasing and flips at any referent carrying an explicit
	// HasIncreasingStation (a `null`/absent value leaves the current sign unchanged).
	let sigma = 1.0;
	const stations: Array<[number, number, number]> = [];
	for (const [distanceAlong, outgoingStation, hasIncreasingStation] of referents) {
		if (hasIncreasingStation !== null && hasIncreasingStation !== undefined) {
			sigma = hasIncreasingStation ? 1.0 : -1.0;
		}
		stations.push([distanceAlong, outgoingStation, sigma]);
	}

	let index: number | null = null;
	for (let i = 0; i < stations.length; i++) {
		const [, outgoingStation, regionSign] = stations[i];
		if (regionSign * (station - outgoingStation) >= 0.0) index = i;
	}

	if (index === null) {
		// station precedes the alignment's starting station; extrapolate from the first referent
		const [distanceAlong, outgoingStation, regionSign] = stations[0];
		return distanceAlong + regionSign * (station - outgoingStation);
	}

	const [distanceAlong, outgoingStation, regionSign] = stations[index];
	const advance = regionSign * (station - outgoingStation);

	if (index + 1 < stations.length) {
		const [nextDistanceAlong] = stations[index + 1];
		if (advance > nextDistanceAlong - distanceAlong) {
			// the station was skipped over by a gap station equation
			return null;
		}
	}

	return distanceAlong + advance;
}
