// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `get_alignment_start_station.py` on
// its own (it's exercised indirectly by `test_add_stationing_to_alignment.py` and
// `test_distance_along_from_station.py`, both of which build their fixture via
// `ifcopenshell.api.alignment.create_by_pi_method`/`add_stationing_referent` -- not
// in this chunk's scope). Original test coverage written here, gated to IFC4X3.
//
// The "real Pset_Stationing.Station value" fixture below assigns a RAW JS `number`
// directly to `IfcPropertySingleValue.NominalValue` (a SELECT-typed, `IfcValue`
// attribute) at construction time, rather than building a standalone
// `IfcReal`/`IfcLengthMeasure` wrapper instance first -- confirmed EMPIRICALLY
// against this exact worktree's own built native addon that this path works fine end
// to end (`getPset` reads the raw number straight back via `unwrapSelectValue`'s own
// `raw instanceof EntityInstance ? raw.getByIndex(0) : raw` fallback). This is
// DIFFERENT from `./hasZeroLengthSegment.test.ts`'s own disclosed-uncoverable branch
// (which specifically needs `file.createEntity("IfcLengthMeasure", 0)` -- constructing
// a STANDALONE simple-type instance by name, the actual operation
// `TODOS.md`'s `EntityInstance.setByIndex`/`IfcFile.createEntity` entry documents as
// blocked) -- assigning a raw value directly to an already-real entity's OWN
// SELECT-typed attribute (at construction or via `.set()`) is a different code path
// that does not hit that gate, also confirmed empirically here. Not a correction to
// that chunk 1 entry (still accurate for what it actually claims), just a distinct,
// unblocked technique this chunk's own fixtures use instead.
//
// Covers the real, docstring-contradicting quirk
// `../../../src/api/alignment/getAlignmentStartStation.ts`'s own header comment
// discloses: an `IfcReferent` component with no `Pset_Stationing.Station` value
// overwrites the `0.0` default with `null`, rather than leaving it untouched.

import { describe, expect, test } from "vitest";
import { getAlignmentStartStation } from "../../../src/api/alignment/getAlignmentStartStation";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function nest(file: IfcFile, relating: EntityInstance, related: readonly EntityInstance[]): EntityInstance {
	return file.createEntity("IfcRelNests", guid.new(), null, null, null, relating, [...related]);
}

/** Builds an `IfcReferent` with a real `Pset_Stationing` `IfcPropertySet` attached
 * (see this file's own header comment for the raw-value-assignment technique). */
function referentWithStation(file: IfcFile, name: string, station: number): EntityInstance {
	const referent = file.createEntity("IfcReferent", guid.new(), null, name);
	const stationProp = file.createEntity("IfcPropertySingleValue", "Station", null, station, null);
	const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Pset_Stationing", null, [stationProp]);
	file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [referent], pset);
	return referent;
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getAlignmentStartStation (IFC4X3)", () => {
	test("throws TypeError for a non-IfcAlignment", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");

		expect(() => getAlignmentStartStation(file, horizontal)).toThrow(
			new TypeError("Expected entity type to be IfcAlignment, instead received IfcAlignmentHorizontal"),
		);
	});

	test("returns 0.0 for an alignment with no components at all", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		expect(getAlignmentStartStation(file, alignment)).toBe(0.0);
	});

	test("returns 0.0 when the only components are NOT IfcReferent (e.g. a nested layout)", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		nest(file, alignment, [horizontal]);

		expect(getAlignmentStartStation(file, alignment)).toBe(0.0);
	});

	test("returns the first IfcReferent's own Pset_Stationing.Station value", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const referent = referentWithStation(file, "1+00.00", 10000.0);
		nest(file, alignment, [referent]);

		expect(getAlignmentStartStation(file, alignment)).toBe(10000.0);
	});

	test("skips a non-IfcReferent component and a stationless IfcReferent, then finds the real value on a later one", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const stationlessReferent = file.createEntity("IfcReferent", guid.new(), null, "no-pset");
		const referent = referentWithStation(file, "1+00.00", 10000.0);
		nest(file, alignment, [horizontal, stationlessReferent, referent]);

		expect(getAlignmentStartStation(file, alignment)).toBe(10000.0);
	});

	test("recurses through the parent alignment via getParentAlignment", () => {
		const file = createTestFile("IFC4X3");
		const parent = file.createEntity("IfcAlignment", guid.new(), null, "Parent");
		const referent = referentWithStation(file, "1+00.00", 5000.0);
		nest(file, parent, [referent]);
		const child = file.createEntity("IfcAlignment", guid.new(), null, "Child");
		file.createEntity("IfcRelAggregates", guid.new(), null, null, null, parent, [child]);

		expect(getAlignmentStartStation(file, child)).toBe(5000.0);
	});

	test("quirk: an IfcReferent component with no Pset_Stationing overwrites the 0.0 default with null", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const referent = file.createEntity("IfcReferent", guid.new(), null, "R1");
		nest(file, alignment, [referent]);

		expect(getAlignmentStartStation(file, alignment)).toBeNull();
	});
});
