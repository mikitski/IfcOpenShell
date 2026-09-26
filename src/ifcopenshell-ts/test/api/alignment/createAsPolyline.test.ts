// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `create_as_polyline.py` (confirmed by reading
// the whole real test directory). Original test coverage written here, gated to
// IFC4X3.
//
// The `Dim`-EXPRESS-DERIVED-attribute gap this file's own comment used to describe
// (`IfcCartesianPoint.Dim`) was closed by Phase EX-2's IFC4X3 `calc_IfcPoint_Dim`
// port -- `createAsPolyline` now runs to completion end-to-end.
//
// --- Upstream sync, chunk 3 of 4 (real upstream commit
//     `b5670c4fc5347ec5c2c621f3f53a1a737bd21d2b`) ---
//
// `startStation` is now optional (default `null`, meaning "no stationing referent"),
// not defaulted to `0.0` -- see `../../../src/api/alignment/createAsPolyline.ts`'s own
// header comment. Added a new dedicated test confirming that omitting `startStation`
// creates NO `IfcReferent` at all (the two pre-existing tests below -- one omitting
// `startStation`, one passing it explicitly -- already exercised both the "no referent"
// and "referent" cases by coincidence before this change, since the OLD default `0.0`
// happened to be a valid station value too; this new test makes the "omitted means no
// referent" behavior explicit and unambiguous).

import { describe, expect, test } from "vitest";
import { createAsPolyline } from "../../../src/api/alignment/createAsPolyline";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.createAsPolyline (IFC4X3)", () => {
	test("succeeds end-to-end: creates the IfcAlignment with a real polyline representation", () => {
		const file = createTestFile("IFC4X3");
		const points = [
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcCartesianPoint", [10.0, 0.0]),
		];
		const alignmentCountBefore = file.byType("IfcAlignment").length;

		const alignment = createAsPolyline(file, "P1", points);

		expect(file.byType("IfcAlignment").length).toBe(alignmentCountBefore + 1);
		expect(alignment.get("Name")).toBe("P1");
		expect(alignment.get("ObjectPlacement")).not.toBeNull();
	});

	test("startStation omitted (null default): no IfcReferent is created", () => {
		const file = createTestFile("IFC4X3");
		const points = [
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcCartesianPoint", [5.0, 0.0]),
		];

		createAsPolyline(file, "P0", points);

		expect(file.byType("IfcReferent")).toHaveLength(0);
	});

	test("reaches addStationingReferent/aggregation: a real IfcReferent and IfcRelAggregates are created", () => {
		const file = createTestFile("IFC4X3");
		const points = [
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcCartesianPoint", [5.0, 0.0]),
		];
		const referentCountBefore = file.byType("IfcReferent").length;
		const relAggregatesCountBefore = file.byType("IfcRelAggregates").length;

		const alignment = createAsPolyline(file, "P2", points, 4900.0);

		expect(file.byType("IfcReferent").length).toBe(referentCountBefore + 1);
		expect(file.byType("IfcRelAggregates").length).toBe(relAggregatesCountBefore + 1);
		expect(alignment.get("Name")).toBe("P2");
	});
});
