// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_work_time.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python), so this coverage is written directly
// from the real source/docstring, including dedicated pins for the disclosed IFC2X3
// schema-absence gap and the "orphaned IfcWorkTime for an undocumented timeType" quirk
// (`../../../src/api/sequence/addWorkTime.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { addWorkCalendar } from "../../../src/api/sequence/addWorkCalendar";
import { addWorkTime } from "../../../src/api/sequence/addWorkTime";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.addWorkTime (%s)", (schema) => {
	test("adds a work time to WorkingTimes by default", () => {
		const file = createTestFile(schema);
		const calendar = addWorkCalendar(file, {});
		const workTime = addWorkTime(file, { workCalendar: calendar });
		expect(workTime.isA("IfcWorkTime")).toBe(true);
		expect((calendar.get("WorkingTimes") as EntityInstance[]).map((w) => w.identity())).toEqual([workTime.identity()]);
		expect(calendar.get("ExceptionTimes")).toBeFalsy();
	});

	test("appends further work times to WorkingTimes", () => {
		const file = createTestFile(schema);
		const calendar = addWorkCalendar(file, {});
		const first = addWorkTime(file, { workCalendar: calendar, timeType: "WorkingTimes" });
		const second = addWorkTime(file, { workCalendar: calendar, timeType: "WorkingTimes" });
		expect((calendar.get("WorkingTimes") as EntityInstance[]).map((w) => w.identity())).toEqual([
			first.identity(),
			second.identity(),
		]);
	});

	test("adds a holiday time to ExceptionTimes", () => {
		const file = createTestFile(schema);
		const calendar = addWorkCalendar(file, {});
		const holiday = addWorkTime(file, { workCalendar: calendar, timeType: "ExceptionTimes" });
		expect((calendar.get("ExceptionTimes") as EntityInstance[]).map((w) => w.identity())).toEqual([holiday.identity()]);
		expect(calendar.get("WorkingTimes")).toBeFalsy();
	});

	test("an undocumented timeType creates an orphaned IfcWorkTime, attached nowhere (disclosed, ported-verbatim Python quirk)", () => {
		const file = createTestFile(schema);
		const calendar = addWorkCalendar(file, {});
		// biome-ignore lint/suspicious/noExplicitAny: deliberately passing a value outside the documented literal type, matching real Python's own un-enforced runtime string parameter.
		const workTime = addWorkTime(file, { workCalendar: calendar, timeType: "Bogus" as any });
		expect(workTime.isA("IfcWorkTime")).toBe(true);
		expect(calendar.get("WorkingTimes")).toBeFalsy();
		expect(calendar.get("ExceptionTimes")).toBeFalsy();
	});
});

// --- IFC2X3: IfcWorkTime doesn't exist -- see this file's header comment ---
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.sequence.addWorkTime (IFC2X3)", () => {
	test("throws at addWorkTime's own bare file.createEntity('IfcWorkTime') call", () => {
		const file = createTestFile("IFC2X3");
		// IfcWorkCalendar itself doesn't exist on IFC2X3 either (see
		// ../../../src/api/sequence/addWorkCalendar.ts's own header comment), so a plain
		// `IfcWall` stand-in is used here purely to reach addWorkTime's own first
		// statement -- this function's own IFC2X3 failure is independently confirmed
		// (`file.createEntity("IfcWorkTime")` itself, before `workCalendar` is ever
		// touched), matching real Python's own unguarded behavior.
		const fakeCalendar = file.createEntity("IfcWall");
		expect(() => addWorkTime(file, { workCalendar: fakeCalendar })).toThrow();
	});
});
