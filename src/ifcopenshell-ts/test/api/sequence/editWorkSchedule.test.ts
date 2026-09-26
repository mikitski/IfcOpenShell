// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_work_schedule.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python), so this coverage is written directly
// from the real source/docstring. Structurally identical to `./editWorkPlan.test.ts` --
// see that file's own header comment and `../../../src/api/sequence/
// editWorkSchedule.ts`'s own header comment for the shared, disclosed IFC2X3
// `Duration`/`TotalFloat` schema-mismatch bug.

import { describe, expect, test } from "vitest";
import { addWorkSchedule } from "../../../src/api/sequence/addWorkSchedule";
import { editWorkSchedule } from "../../../src/api/sequence/editWorkSchedule";
import type { Duration } from "../../../src/util/date";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.sequence.editWorkSchedule (%s)", (schema) => {
	test("edits a plain string attribute", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkSchedule(file, { name: "Construction Schedule A" });
		editWorkSchedule(file, { workSchedule, attributes: { Description: "3 crane design option" } });
		expect(workSchedule.get("Description")).toBe("3 crane design option");
	});

	// Real Python's own SWIG binding would reject a plain formatted string written into
	// IFC2X3's real `IfcDateAndTime`/`IfcCalendarDate`/`IfcLocalTime`-typed `CreationDate`
	// -- but this port's own `.set()` performs no declared-type validation at all
	// (verified empirically against this worktree's own built native addon; see
	// `../../../src/api/sequence/editWorkPlan.ts`'s own header comment and its `TODOS.md`
	// cross-reference for the full writeup), so it silently accepts and stores the string
	// on every schema including IFC2X3. Ported/tested as the real, verified behavior.
	test("converts a Date/Time-named attribute through datetime2ifc", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkSchedule(file, {});
		editWorkSchedule(file, { workSchedule, attributes: { CreationDate: "2020-01-01T00:00:00" } });
		expect(workSchedule.get("CreationDate")).toBe("2020-01-01T00:00:00");
	});

	// Same story for `Duration`/`TotalFloat` on IFC2X3 (`IfcTimeMeasure`/`number` there,
	// not `IfcDuration`/`string`) -- real Python throws, this port's own type-validation-
	// free `.set()` doesn't, on any schema.
	test("converts a Duration through datetime2ifc", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkSchedule(file, {});
		const oneDay: Duration = { years: 0, months: 0, days: 1, hours: 0, minutes: 0, seconds: 0 };
		editWorkSchedule(file, { workSchedule, attributes: { TotalFloat: oneDay } });
		expect(workSchedule.get("TotalFloat")).toBe("P1D");
	});

	test("a falsy value is written as-is, with no conversion attempted", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkSchedule(file, {});
		editWorkSchedule(file, { workSchedule, attributes: { Description: null } });
		expect(workSchedule.get("Description")).toBe(null);
	});
});
