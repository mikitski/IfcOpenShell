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
 * placeholder (the function under test never inspects it). */
function referentAtStation(
	file: IfcFile,
	name: string,
	distanceAlong: number,
	station: number,
	basisCurve: EntityInstance,
): EntityInstance {
	const location = file.createEntity("IfcPointByDistanceExpression", distanceAlong, null, null, null, basisCurve);
	const relativePlacement = file.createEntity("IfcAxis2PlacementLinear", location, null, null);
	const placement = file.createEntity("IfcLinearPlacement", null, relativePlacement, null);
	const referent = file.createEntity("IfcReferent", guid.new(), null, name, null, null, placement, null, "STATION");
	const stationProp = file.createEntity("IfcPropertySingleValue", "Station", null, station, null);
	const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Pset_Stationing", null, [stationProp]);
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
