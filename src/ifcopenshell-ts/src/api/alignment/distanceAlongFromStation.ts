// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/distance_along_from_station.py`
// (src/ifcopenshell-python, 102 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 2 of many). Depends on chunk 1's
// already-landed `getStationingNest` and this same chunk's own
// `getAlignmentStartStation` (`./getAlignmentStartStation.ts`) and `util.element`'s
// already-landed `getPset` -- no blocker.
//
// `_distanceAlongOfReferent`'s `placement.RelativePlacement.Location.DistanceAlong
// .wrappedValue` reads a defined/select-type-wrapped scalar
// (`IfcCurveMeasureSelect`, wrapping an `IfcNonNegativeLengthMeasure`/
// `IfcParameterValue`) -- ported via `.getByIndex(0)` (`wrappedValueOf` below), NOT
// `.get("wrappedValue")`, matching this project's established cross-module
// `wrappedValueOf` convention (see `./hasZeroLengthSegment.ts`'s own doc comment for
// why: the N-API attribute-value shim doesn't support the pseudo-attribute name
// `"wrappedValue"`, only `.getByIndex(0)`, on a standalone declared-type instance;
// `entityInstance.ts`'s own header comment, and `TODOS.md`'s
// `EntityInstance.setByIndex`/`IfcFile.createEntity` entry, document the *write*
// half of this same primitive-layer boundary -- *reading* an already-populated
// simple-type value via `getByIndex` is confirmed to work fine regardless of how the
// instance was constructed, so this file's own read-only usage hits no blocker).
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
import { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getPset } from "../../util/element";
import { getAlignmentStartStation } from "./getAlignmentStartStation";
import { getStationingNest } from "./getStationingNest";

/** Python's `x.wrappedValue` for a defined/select-type-wrapped scalar -- see this
 * file's own header comment. */
function wrappedValueOf(value: unknown): unknown {
	return value instanceof EntityInstance ? value.getByIndex(0) : value;
}

/**
 * Python's `_distance_along_of_referent`. Returns the `DistanceAlong` of a
 * `STATION` referent's `IfcLinearPlacement`, or `0.0` for an `IfcLocalPlacement`
 * fallback (e.g. semantic-only alignment, or the placement could not yet be
 * expressed relative to a basis curve) -- which carries no `DistanceAlong`; it is
 * only ever used for the starting referent, at distance `0.0`.
 */
function distanceAlongOfReferent(referent: EntityInstance): number {
	const placement = referent.get("ObjectPlacement") as EntityInstance;
	if (placement.isA("IfcLinearPlacement")) {
		const relativePlacement = placement.get("RelativePlacement") as EntityInstance;
		const location = relativePlacement.get("Location") as EntityInstance;
		return wrappedValueOf(location.get("DistanceAlong")) as number;
	}
	return 0.0;
}

/**
 * Given a station, returns the distance along the horizontal alignment (Python:
 * `ifcopenshell.api.alignment.distance_along_from_station`).
 *
 * If the alignment does not have stationing defined with an `IfcReferent`, the start
 * of the alignment is assumed to be at station `0.0`. That is, the station is the
 * distance along.
 *
 * Station equations (where `Pset_Stationing.IncomingStation` is set on a referent)
 * are taken into account. For each `STATION` referent nested to the alignment,
 * `DistanceAlong` (D) and the outgoing station (S, i.e. `Pset_Stationing.Station`)
 * are read off, sorted by `DistanceAlong`. The requested station is located within
 * the segment defined by the last referent whose outgoing station is less than or
 * equal to it, and the distance along is computed as `D + (station - S)` for that
 * referent.
 *
 * If the station falls within a gap introduced by a forward (gap) station equation
 * -- that is, it was skipped over by the equation -- there is no distance along that
 * corresponds to it, and `null` is returned.
 *
 * Note that an overlap (backward) station equation causes a range of stations to
 * correspond to two distinct distances along the alignment, one on either side of
 * the equation. This implementation returns the distance along in the segment
 * following the equation (i.e. the outgoing side).
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

	const stations: Array<[number, number]> = (stationingNest.get("RelatedObjects") as EntityInstance[]).map(
		(referent) => [distanceAlongOfReferent(referent), getPset(referent, "Pset_Stationing", "Station") as number],
	);
	stations.sort((a, b) => a[0] - b[0]);

	let index: number | null = null;
	for (let i = 0; i < stations.length; i++) {
		const [, outgoingStation] = stations[i];
		if (outgoingStation <= station) index = i;
	}

	if (index === null) {
		// station precedes the alignment's starting station; extrapolate from the first referent
		const [distanceAlong, outgoingStation] = stations[0];
		return distanceAlong + (station - outgoingStation);
	}

	const [distanceAlong, outgoingStation] = stations[index];

	if (index + 1 < stations.length) {
		const [nextDistanceAlong] = stations[index + 1];
		if (station - outgoingStation > nextDistanceAlong - distanceAlong) {
			// the station was skipped over by a forward (gap) station equation
			return null;
		}
	}

	return distanceAlong + (station - outgoingStation);
}
