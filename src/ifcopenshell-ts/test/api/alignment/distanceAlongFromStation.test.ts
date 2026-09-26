// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/alignment/test_distance_along_from_station.py`
// (src/ifcopenshell-python, both `test_distance_along_from_station` -- no station
// equations -- and `test_distance_along_from_station_with_station_equations` -- the
// worked IFC Alignment Geometry Implementation Guide chapter 9.2.6 example). Real
// Python's own fixture builds a full alignment via
// `ifcopenshell.api.alignment.create_by_pi_method`/`add_stationing_referent` --
// neither ported in this chunk's scope. This port instead builds the referents
// `add_stationing_referent` would itself produce directly (an `IfcReferent` with an
// `IfcLinearPlacement`/`IfcAxis2PlacementLinear`/`IfcPointByDistanceExpression`
// placement carrying a real `DistanceAlong`, plus a real `Pset_Stationing.Station`
// `IfcPropertySet`) -- assigning raw JS `number`s directly to both SELECT-typed
// attributes (`DistanceAlong`, `IfcPropertySingleValue.NominalValue`) at construction
// time, confirmed EMPIRICALLY to work end to end against this exact worktree's own
// built native addon (see `./getAlignmentStartStation.test.ts`'s own header comment
// for the full writeup of why this is a DIFFERENT, unblocked code path from
// `./hasZeroLengthSegment.test.ts`'s own disclosed-uncoverable
// standalone-simple-type-instance gap). This lets every one of real Python's own 7
// numeric assertions (2 from the no-equations test, 5 from the station-equations
// test) be ported verbatim, using just 1 (no-equations) or 3 (start + the P3/P4
// station-equation referents from the worked example) hand-built referents in place
// of the unported `create_by_pi_method`'s own full PI-method-generated alignment.
//
// Also covers a real divergence from Python's own crash semantics: real Python's
// `station - start_station` (the no-stationing-nest branch) raises `TypeError` when
// `get_alignment_start_station` returns `None` (that function's own disclosed
// docstring-contradicting quirk -- see `./getAlignmentStartStation.ts`'s own header
// comment); JS's `-` operator instead coerces `null` to `0`, so this port silently
// returns `station` unchanged in that same scenario rather than crashing. This is
// reachable even though it can't happen from THIS alignment's own directly-nested
// `IfcReferent`s (any such referent would also make `get_stationing_nest` non-null,
// routing to the OTHER branch entirely) -- it requires the null to come from a PARENT
// alignment's own components via `get_alignment_start_station`'s recursive walk,
// while THIS (child) alignment has no stationing nest of its own.
//
// --- Upstream sync, chunk 3 of 4 (real upstream commit
//     `b5670c4fc5347ec5c2c621f3f53a1a737bd21d2b`) ---
//
// Ports real upstream's own 4 new test functions covering reverse (decreasing)
// stationing and `HasIncreasingStation` direction switches -- see
// `../../../src/api/alignment/distanceAlongFromStation.ts`'s own header comment for the
// algorithm this exercises. `referentAtStation` below gains an optional
// `hasIncreasingStation` parameter, writing `Pset_Stationing.HasIncreasingStation` only
// when given (matching `addStationingReferent`'s own real "omit when not given" write
// behavior). Every one of real upstream's own new numeric assertions (across all 4 new
// test functions) is ported verbatim.

import { describe, expect, test } from "vitest";
import { distanceAlongFromStation } from "../../../src/api/alignment/distanceAlongFromStation";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function nest(file: IfcFile, relating: EntityInstance, related: readonly EntityInstance[]): EntityInstance {
	return file.createEntity("IfcRelNests", guid.new(), null, null, null, relating, [...related]);
}

/** Builds a `STATION` `IfcReferent` matching real `add_stationing_referent`'s own
 * shape: an `IfcLinearPlacement`/`IfcAxis2PlacementLinear`/
 * `IfcPointByDistanceExpression` placement carrying `distanceAlong`, plus a real
 * `Pset_Stationing.Station` property set carrying `station` -- see this file's own
 * header comment for the raw-value-assignment technique. `basisCurve` is a
 * placeholder (the function under test never inspects it). `hasIncreasingStation`,
 * when given (not `undefined`), also writes `Pset_Stationing.HasIncreasingStation` --
 * see this file's own header comment for the upstream-sync chunk 3 of 4 addition. */
function referentAtStation(
	file: IfcFile,
	name: string,
	distanceAlong: number,
	station: number,
	basisCurve: EntityInstance,
	hasIncreasingStation?: boolean,
): EntityInstance {
	const location = file.createEntity("IfcPointByDistanceExpression", distanceAlong, null, null, null, basisCurve);
	const relativePlacement = file.createEntity("IfcAxis2PlacementLinear", location, null, null);
	const placement = file.createEntity("IfcLinearPlacement", null, relativePlacement, null);
	const referent = file.createEntity("IfcReferent", guid.new(), null, name, null, null, placement, null, "STATION");
	const properties = [file.createEntity("IfcPropertySingleValue", "Station", null, station, null)];
	if (hasIncreasingStation !== undefined) {
		properties.push(
			file.createEntity("IfcPropertySingleValue", "HasIncreasingStation", null, hasIncreasingStation, null),
		);
	}
	const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Pset_Stationing", null, properties);
	file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [referent], pset);
	return referent;
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.distanceAlongFromStation (IFC4X3)", () => {
	test("no stationing nest: distance along is station minus the (0.0 default) start station", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		expect(distanceAlongFromStation(file, alignment, 200.0)).toBe(200.0);
	});

	test("no station equations: distance along is station minus the real start station (real test_distance_along_from_station assertions)", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const basisCurve = file.createEntity("IfcCompositeCurve", [], false);
		const start = referentAtStation(file, "100+00.00", 0.0, 10000.0, basisCurve);
		nest(file, alignment, [start]);

		// Station 138+83.96
		expect(distanceAlongFromStation(file, alignment, 13883.96)).toBeCloseTo(3883.96);
		// Station 175+25.36
		expect(distanceAlongFromStation(file, alignment, 17525.36)).toBeCloseTo(7525.36);
	});

	test("station equations: reproduces the IFC Alignment Geometry Implementation Guide 9.2.6 worked example", () => {
		// A gap equation (P3: incoming 14+00.00, outgoing 17+00.00) and an overlap
		// equation (P4: incoming 19+00.00, outgoing 18+50.00) -- real
		// `test_distance_along_from_station_with_station_equations`'s own fixture,
		// scaled down 10x (start_station=1000.0) exactly as that real test does.
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const basisCurve = file.createEntity("IfcCompositeCurve", [], false);
		const start = referentAtStation(file, "start", 0.0, 1000.0, basisCurve);
		const p3 = referentAtStation(file, "P3", 400.0, 1700.0, basisCurve);
		const p4 = referentAtStation(file, "P4", 600.0, 1850.0, basisCurve);
		nest(file, alignment, [start, p3, p4]);

		// between P2 and P3: Sta. 13+00.00
		expect(distanceAlongFromStation(file, alignment, 1300.0)).toBeCloseTo(300.0);
		// between P3 and P4: Sta. 18+00.00
		expect(distanceAlongFromStation(file, alignment, 1800.0)).toBeCloseTo(500.0);
		// between P4 and P5: Sta. 19+25.00
		expect(distanceAlongFromStation(file, alignment, 1925.0)).toBeCloseTo(675.0);
		// Sta. 15+00.00 falls inside the gap opened by the equation at P3 and has no
		// corresponding distance along.
		expect(distanceAlongFromStation(file, alignment, 1500.0)).toBeNull();
		// Sta. 18+75.00 falls inside the overlap zone at P4; the post-equation
		// (outgoing) match is returned.
		expect(distanceAlongFromStation(file, alignment, 1875.0)).toBeCloseTo(625.0);
	});

	// Upstream sync chunk 3 of 4: real upstream's own
	// `test_distance_along_from_station_reverse_stationing_with_gap_equation`.
	test("reverse stationing with a gap equation: real IFC Alignment Geometry Implementation Guide-style reverse fixture", () => {
		// R1: D 0.0,   Station 20+00.00,  HasIncreasingStation=False
		// R2: D 400.0, Station 15+50.00,  IncomingStation 16+00.00  (gap of 50)
		// R3: D 800.0, Station 11+50.00
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const basisCurve = file.createEntity("IfcCompositeCurve", [], false);
		// Note: `distanceAlongFromStation`'s own algorithm infers the gap purely from the
		// (DistanceAlong, Station) deltas between consecutive referents -- it never reads
		// `Pset_Stationing.IncomingStation` itself (that property is display metadata
		// only), so `referentAtStation` deliberately doesn't set it here either, matching
		// this file's own pre-existing "station equations" test's identical convention.
		const r1 = referentAtStation(file, "R1", 0.0, 2000.0, basisCurve, false);
		const r2 = referentAtStation(file, "R2", 400.0, 1550.0, basisCurve);
		const r3 = referentAtStation(file, "R3", 800.0, 1150.0, basisCurve);
		nest(file, alignment, [r1, r2, r3]);

		// Sta. 18+00.00 -> governed by R1
		expect(distanceAlongFromStation(file, alignment, 1800.0)).toBeCloseTo(200.0);
		// Sta. 13+00.00 -> governed by R2; naive subtraction from the start would
		// overstate by the 50 ft gap
		expect(distanceAlongFromStation(file, alignment, 1300.0)).toBeCloseTo(650.0);
		// Sta. 15+75.00 falls inside the range the gap equation at R2 skipped -> no
		// distance along
		expect(distanceAlongFromStation(file, alignment, 1575.0)).toBeNull();
	});

	// Upstream sync chunk 3 of 4: real upstream's own
	// `test_distance_along_from_station_direction_switch_increasing_then_decreasing`.
	test("direction switch: increasing then decreasing (a peak)", () => {
		// R1 D 0.0   S 1000.0
		// R2 D 500.0 S 1500.0  HasIncreasingStation=False
		// R3 D 1000.0 S 1000.0
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const basisCurve = file.createEntity("IfcCompositeCurve", [], false);
		const r1 = referentAtStation(file, "R1", 0.0, 1000.0, basisCurve);
		const r2 = referentAtStation(file, "R2", 500.0, 1500.0, basisCurve, false);
		const r3 = referentAtStation(file, "R3", 1000.0, 1000.0, basisCurve);
		nest(file, alignment, [r1, r2, r3]);

		// Sta 12+00 appears twice (rising at D 200, falling at D 800); the downstream
		// match is returned
		expect(distanceAlongFromStation(file, alignment, 1200.0)).toBeCloseTo(800.0);
		// the peak label sits at the single point D 500
		expect(distanceAlongFromStation(file, alignment, 1500.0)).toBeCloseTo(500.0);
		// the end label
		expect(distanceAlongFromStation(file, alignment, 1000.0)).toBeCloseTo(1000.0);
		// Sta 16+00 is above the peak - it exists nowhere on the alignment
		expect(distanceAlongFromStation(file, alignment, 1600.0)).toBeNull();
	});

	// Upstream sync chunk 3 of 4: real upstream's own
	// `test_distance_along_from_station_direction_switch_decreasing_then_increasing`.
	test("direction switch: decreasing then increasing (a valley)", () => {
		// R1 D 0.0    S 2000.0  HasIncreasingStation=False
		// R2 D 500.0  S 1500.0  HasIncreasingStation=True
		// R3 D 1000.0 S 2000.0
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const basisCurve = file.createEntity("IfcCompositeCurve", [], false);
		const r1 = referentAtStation(file, "R1", 0.0, 2000.0, basisCurve, false);
		const r2 = referentAtStation(file, "R2", 500.0, 1500.0, basisCurve, true);
		const r3 = referentAtStation(file, "R3", 1000.0, 2000.0, basisCurve);
		nest(file, alignment, [r1, r2, r3]);

		// Sta 18+00 appears twice (falling at D 200, rising at D 800); the downstream
		// match is returned
		expect(distanceAlongFromStation(file, alignment, 1800.0)).toBeCloseTo(800.0);
		// the valley label sits at the single point D 500
		expect(distanceAlongFromStation(file, alignment, 1500.0)).toBeCloseTo(500.0);
		// Sta 14+00 is below the valley - it exists nowhere on the alignment
		expect(distanceAlongFromStation(file, alignment, 1400.0)).toBeNull();
	});

	// Upstream sync chunk 3 of 4: real upstream's own
	// `test_distance_along_from_station_multiple_direction_switches`. Not realistic, but
	// valid IFC: stationing direction flips at every referent.
	test("multiple direction switches: direction flips at every referent", () => {
		// R1 D 0.0    S 1000.0                            increasing  [0, 300]   1000 -> 1300
		// R2 D 300.0  S 1300.0  HasIncreasingStation=False decreasing  [300, 600] 1300 -> 1000
		// R3 D 600.0  S 1000.0  HasIncreasingStation=True  increasing  [600, 900] 1000 -> 1300
		// R4 D 900.0  S 1300.0  HasIncreasingStation=False decreasing  [900, 1200] 1300 -> 1000
		// R5 D 1200.0 S 1000.0
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "TestAlignment");
		const basisCurve = file.createEntity("IfcCompositeCurve", [], false);
		const r1 = referentAtStation(file, "R1", 0.0, 1000.0, basisCurve);
		const r2 = referentAtStation(file, "R2", 300.0, 1300.0, basisCurve, false);
		const r3 = referentAtStation(file, "R3", 600.0, 1000.0, basisCurve, true);
		const r4 = referentAtStation(file, "R4", 900.0, 1300.0, basisCurve, false);
		const r5 = referentAtStation(file, "R5", 1200.0, 1000.0, basisCurve);
		nest(file, alignment, [r1, r2, r3, r4, r5]);

		// Sta 11+00 appears in every one of the four regions; the last (most downstream)
		// match wins
		expect(distanceAlongFromStation(file, alignment, 1100.0)).toBeCloseTo(1100.0);
		// the shared min label resolves to the very end of the alignment
		expect(distanceAlongFromStation(file, alignment, 1000.0)).toBeCloseTo(1200.0);
		// Sta 13+50 is above every peak - nowhere on the alignment
		expect(distanceAlongFromStation(file, alignment, 1350.0)).toBeNull();
		// a label exactly at a peak
		expect(distanceAlongFromStation(file, alignment, 1300.0)).toBeCloseTo(900.0);
	});

	test("divergence: a null start station (via a parent alignment's own docstring-contradicting quirk) is coerced to 0 by JS's `-`, not a Python-style crash", () => {
		const file = createTestFile("IFC4X3");
		const parent = file.createEntity("IfcAlignment", guid.new(), null, "Parent");
		const stationlessReferent = file.createEntity("IfcReferent", guid.new(), null, "no-pset");
		nest(file, parent, [stationlessReferent]);
		const child = file.createEntity("IfcAlignment", guid.new(), null, "Child");
		file.createEntity("IfcRelAggregates", guid.new(), null, null, null, parent, [child]);

		// Child has no stationing nest of its own, so this takes the
		// no-stationing-nest branch; `getAlignmentStartStation` recurses to the
		// parent and returns `null` there (the parent's own referent has no
		// Pset_Stationing) -- real Python would raise `TypeError` computing
		// `station - None`; this port instead returns `station` unchanged.
		expect(distanceAlongFromStation(file, child, 200.0)).toBe(200.0);
	});
});
