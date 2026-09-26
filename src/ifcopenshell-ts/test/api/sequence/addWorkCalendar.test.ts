// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_work_calendar.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python -- no `test_add_work_calendar.py`), so
// this coverage is written directly from the real source/docstring, run against every
// schema where `IfcWorkCalendar` actually exists (`../../../src/api/sequence/
// addWorkCalendar.ts`'s own header comment: absent on IFC2X3), plus a dedicated pin for
// the disclosed IFC2X3 throw.

import { describe, expect, test } from "vitest";
import { addWorkCalendar } from "../../../src/api/sequence/addWorkCalendar";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.addWorkCalendar (%s)", (schema) => {
	test("creates a work calendar with defaults and declares it against the project", () => {
		const file = createTestFile(schema);
		const calendar = addWorkCalendar(file, {});
		expect(calendar.isA("IfcWorkCalendar")).toBe(true);
		expect(calendar.get("Name")).toBe("Unnamed");
		expect(calendar.get("PredefinedType")).toBe("NOTDEFINED");

		const context = file.byType("IfcContext")[0];
		const declares = context.get("Declares") as EntityInstance[];
		expect(declares.length).toBe(1);
		expect((declares[0].get("RelatedDefinitions") as EntityInstance[]).map((d) => d.identity())).toEqual([
			calendar.identity(),
		]);
	});

	test("creates a work calendar with a custom name/predefined type", () => {
		const file = createTestFile(schema);
		const calendar = addWorkCalendar(file, { name: "5 Day Week", predefinedType: "FIRSTSHIFT" });
		expect(calendar.get("Name")).toBe("5 Day Week");
		expect(calendar.get("PredefinedType")).toBe("FIRSTSHIFT");
	});
});

// --- IFC2X3: `IfcWorkCalendar` doesn't exist -- see this file's header comment ---
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.sequence.addWorkCalendar (IFC2X3)", () => {
	test("throws -- IfcWorkCalendar doesn't exist on IFC2X3", () => {
		const file = createTestFile("IFC2X3");
		expect(() => addWorkCalendar(file, {})).toThrow();
	});
});
