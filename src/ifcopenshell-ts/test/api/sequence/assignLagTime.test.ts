// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `assign_lag_time.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python).
//
// **Reference-parity chunk 4 of 5 update (2026-09-25):** `TODOS.md`'s "EntityInstance
// .setByIndex/IfcFile.createEntity ..." gate (PR #179, "fifteenth consequence") is now
// fixed -- constructing the standalone `IfcDuration`/`IfcLagTime` no longer throws.
// Flipped to real, verified end-to-end assertions (a real `IfcLagTime` with the right
// `LagValue`/`DurationType`, assigned to `relSequence.TimeLag`) -- confirmed against
// this chunk's own freshly-built native addon on both IFC4 and IFC4X3.

import { describe, expect, test } from "vitest";
import { assignLagTime } from "../../../src/api/sequence/assignLagTime";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.assignLagTime (%s)", (schema) => {
	test("creates a real IfcLagTime and assigns it to relSequence.TimeLag", () => {
		const file = createTestFile(schema);
		// A bare `IfcRelSequence` stand-in -- sufficient, since `assignLagTime` never
		// reads any other attribute of `relSequence` besides `TimeLag`.
		const relSequence = file.createEntity("IfcRelSequence");

		const lagTime = assignLagTime(file, { relSequence, lagValue: "P1D" });

		expect(lagTime.isA("IfcLagTime")).toBe(true);
		expect((lagTime.get("LagValue") as EntityInstance).getByIndex(0)).toBe("P1D");
		expect(lagTime.get("DurationType")).toBe("WORKTIME");
		expect((relSequence.get("TimeLag") as EntityInstance).equals(lagTime)).toBe(true);
	});
});

// --- IFC2X3: `IfcDuration` doesn't exist at all (added in IFC4) -- an INDEPENDENT
//     confirmed throw, unaffected by (and unrelated to) the gate above ---
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.sequence.assignLagTime (IFC2X3)", () => {
	test("throws -- IfcDuration doesn't exist on IFC2X3 (confirmed empirically, distinct from the primitive-layer gap)", () => {
		const file = createTestFile("IFC2X3");
		const relSequence = file.createEntity("IfcRelSequence");
		expect(() => assignLagTime(file, { relSequence, lagValue: "P1D" })).toThrow(
			"Entity with name 'IfcDuration' not found in schema 'IFC2X3'",
		);
	});
});
