// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_lag_time.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python). Written directly from the real
// source/docstring, pinning the CURRENT, disclosed, blocked `LagValue`-editing behavior
// (see `../../../src/api/sequence/editLagTime.ts`'s own header comment: BLOCKED on every
// schema whenever a non-null `LagValue` is actually supplied, by the already-tracked
// `TODOS.md` primitive-layer gap) -- matching `assignLagTime.test.ts`'s own established
// precedent for this exact gap. Editing any OTHER attribute is fully portable and tested
// for real below (built against a bare, unpopulated `IfcLagTime` -- the only kind this
// port can currently construct, see `../../../src/api/sequence/assignLagTime.ts`'s own
// header comment for why).
//
// `IfcLagTime` doesn't exist on IFC2X3 at all (confirmed against `ifc2x3.d.ts`, matching
// this module's own chunk 1 finding for `assignLagTime`), so IFC2X3 is excluded from the
// main suite and given its own dedicated "doesn't exist" test instead.

import { describe, expect, test } from "vitest";
import { editLagTime } from "../../../src/api/sequence/editLagTime";
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

	test("setting a numeric LagValue (IfcRatioMeasure branch) currently throws (pinned, disclosed primitive-layer gap)", () => {
		const file = createTestFile(schema);
		const lagTime = file.createEntity("IfcLagTime");
		expect(() => editLagTime(file, { lagTime, attributes: { LagValue: 1.5 } })).toThrow(
			"Attribute access is only supported on entity instances",
		);
	});

	test("setting a duration-string LagValue (IfcDuration branch) currently throws (pinned, disclosed primitive-layer gap)", () => {
		const file = createTestFile(schema);
		const lagTime = file.createEntity("IfcLagTime");
		expect(() => editLagTime(file, { lagTime, attributes: { LagValue: "P1D" } })).toThrow(
			"Attribute access is only supported on entity instances",
		);
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.sequence.editLagTime (IFC2X3)", () => {
	test("IfcLagTime doesn't exist on IFC2X3 at all", () => {
		const file = createTestFile("IFC2X3");
		expect(() => file.createEntity("IfcLagTime")).toThrow("not found in schema 'IFC2X3'");
	});
});
