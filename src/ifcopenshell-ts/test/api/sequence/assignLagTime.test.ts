// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `assign_lag_time.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python). This pins the CURRENT, disclosed,
// blocked behavior (see `../../../src/api/sequence/assignLagTime.ts`'s own header
// comment: FULLY BLOCKED on every schema by the already-tracked `TODOS.md` primitive-
// layer gap -- constructing a valued, standalone `IfcDuration`) -- matching
// `addApplication.test.ts`'s/`util/cost.test.ts`'s own established precedent for this
// exact gap. Not silently skipped: this test starts failing (a good thing) the moment
// that gap is ever closed, at which point it should be replaced with real end-to-end
// assertions (an `IfcLagTime` with the right `LagValue`/`DurationType`, correctly
// assigned to `rel_sequence.TimeLag`).

import { describe, expect, test } from "vitest";
import { assignLagTime } from "../../../src/api/sequence/assignLagTime";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.assignLagTime (%s)", (schema) => {
	test("currently throws (pinned, disclosed primitive-layer gap)", () => {
		const file = createTestFile(schema);
		// A bare `IfcRelSequence` stand-in -- sufficient to reach assignLagTime's own
		// first statement, which throws before `relSequence` is ever touched.
		const relSequence = file.createEntity("IfcRelSequence");
		expect(() => assignLagTime(file, { relSequence, lagValue: "P1D" })).toThrow(
			"Attribute access is only supported on entity instances",
		);
	});
});

// --- IFC2X3: `IfcDuration` doesn't exist at all (added in IFC4) -- an INDEPENDENT
//     confirmed throw, reached before the primitive-layer gap above would even matter ---
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.sequence.assignLagTime (IFC2X3)", () => {
	test("throws -- IfcDuration doesn't exist on IFC2X3 (confirmed empirically, distinct from the primitive-layer gap)", () => {
		const file = createTestFile("IFC2X3");
		const relSequence = file.createEntity("IfcRelSequence");
		expect(() => assignLagTime(file, { relSequence, lagValue: "P1D" })).toThrow(
			"Entity with name 'IfcDuration' not found in schema 'IFC2X3'",
		);
	});
});
