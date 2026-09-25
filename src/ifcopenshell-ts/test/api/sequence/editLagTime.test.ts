// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_lag_time.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python). Written directly from the real
// source/docstring.
//
// **Reference-parity chunk 4 of 5 update (2026-09-25):** `TODOS.md`'s "EntityInstance
// .setByIndex/IfcFile.createEntity ..." gate (PR #179, "sixteenth consequence") is now
// fixed -- constructing the standalone `IfcRatioMeasure`/`IfcDuration` no longer
// throws. Both `LagValue` branches are flipped to real, verified end-to-end assertions
// -- confirmed against this chunk's own freshly-built native addon on both IFC4 and
// IFC4X3.
//
// `IfcLagTime` doesn't exist on IFC2X3 at all (confirmed against `ifc2x3.d.ts`, matching
// this module's own chunk 1 finding for `assignLagTime`), so IFC2X3 is excluded from the
// main suite and given its own dedicated "doesn't exist" test instead.

import { describe, expect, test } from "vitest";
import { editLagTime } from "../../../src/api/sequence/editLagTime";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.editLagTime (%s)", (schema) => {
	test("editing a non-LagValue attribute works normally", () => {
		const file = createTestFile(schema);
		const lagTime = file.createEntity("IfcLagTime");
		editLagTime(file, { lagTime, attributes: { DurationType: "ELAPSEDTIME", Name: "Weather delay" } });
		expect(lagTime.get("DurationType")).toBe("ELAPSEDTIME");
		expect(lagTime.get("Name")).toBe("Weather delay");
	});

	test("setting LagValue to null works normally (no construction needed)", () => {
		const file = createTestFile(schema);
		const lagTime = file.createEntity("IfcLagTime");
		editLagTime(file, { lagTime, attributes: { LagValue: null } });
		expect(lagTime.get("LagValue")).toBe(null);
	});

	test("setting a numeric LagValue wraps it in a real IfcRatioMeasure", () => {
		const file = createTestFile(schema);
		const lagTime = file.createEntity("IfcLagTime");
		editLagTime(file, { lagTime, attributes: { LagValue: 1.5 } });
		const lagValue = lagTime.get("LagValue") as EntityInstance;
		expect(lagValue.isA("IfcRatioMeasure")).toBe(true);
		expect(lagValue.getByIndex(0)).toBe(1.5);
	});

	test("setting a duration-string LagValue wraps it in a real IfcDuration", () => {
		const file = createTestFile(schema);
		const lagTime = file.createEntity("IfcLagTime");
		editLagTime(file, { lagTime, attributes: { LagValue: "P1D" } });
		const lagValue = lagTime.get("LagValue") as EntityInstance;
		expect(lagValue.isA("IfcDuration")).toBe(true);
		expect(lagValue.getByIndex(0)).toBe("P1D");
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.sequence.editLagTime (IFC2X3)", () => {
	test("IfcLagTime doesn't exist on IFC2X3 at all", () => {
		const file = createTestFile("IFC2X3");
		expect(() => file.createEntity("IfcLagTime")).toThrow("not found in schema 'IFC2X3'");
	});
});
