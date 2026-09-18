// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file exists for `create_as_polyline.py` (confirmed by reading
// the whole real test directory). Original test coverage written here, gated to
// IFC4X3.
//
// Every real invocation of `createAsPolyline` currently throws inside the
// already-landed `_createPolylineRepresentation` (chunk 6)'s own already-disclosed
// `IfcCartesianPoint.Dim` EXPRESS DERIVED-attribute gap (see `createAsPolyline.ts`'s
// own header comment for why this chunk's own real `_create_layout` helper is
// confirmed DEAD CODE, and is therefore NOT the actual blocker here, correcting this
// chunk's own original task brief). The test below confirms the real `IfcAlignment`
// entity is ALREADY created in the file by the time that throw happens -- pinning that
// real orchestration logic genuinely runs first, not that the whole function is a
// no-op stub. Neither the stationing referent (`addStationingReferent`) nor project
// aggregation is ever reached for any real `points` input, since both come strictly
// after the blocked `_createPolylineRepresentation` call.

import { describe, expect, test } from "vitest";
import { createAsPolyline } from "../../../src/api/alignment/createAsPolyline";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.createAsPolyline (IFC4X3)", () => {
	test("throws the already-disclosed Dim gap, with the IfcAlignment already created (real preamble ran)", () => {
		const file = createTestFile("IFC4X3");
		const points = [
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcCartesianPoint", [10.0, 0.0]),
		];
		const alignmentCountBefore = file.byType("IfcAlignment").length;

		expect(() => createAsPolyline(file, "P1", points)).toThrow(/has no attribute 'Dim'/);

		expect(file.byType("IfcAlignment").length).toBe(alignmentCountBefore + 1);
		expect(file.byType("IfcAlignment")[alignmentCountBefore].get("Name")).toBe("P1");
	});

	test("never reaches addStationingReferent/aggregation: no IfcReferent or IfcRelAggregates is created", () => {
		const file = createTestFile("IFC4X3");
		const points = [
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcCartesianPoint", [5.0, 0.0]),
		];
		const referentCountBefore = file.byType("IfcReferent").length;
		const relAggregatesCountBefore = file.byType("IfcRelAggregates").length;

		expect(() => createAsPolyline(file, "P2", points, 4900.0)).toThrow();

		expect(file.byType("IfcReferent").length).toBe(referentCountBefore);
		expect(file.byType("IfcRelAggregates").length).toBe(relAggregatesCountBefore);
	});
});
