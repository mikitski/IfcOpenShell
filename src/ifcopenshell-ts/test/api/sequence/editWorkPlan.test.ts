// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_work_plan.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python), so this coverage is written directly
// from the real source/docstring, including a dedicated pin for the disclosed IFC2X3
// `Duration`/`TotalFloat` schema-mismatch bug (`../../../src/api/sequence/
// editWorkPlan.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { addWorkPlan } from "../../../src/api/sequence/addWorkPlan";
import { editWorkPlan } from "../../../src/api/sequence/editWorkPlan";
import type { Duration } from "../../../src/util/date";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.sequence.editWorkPlan (%s)", (schema) => {
	test("edits a plain string attribute", () => {
		const file = createTestFile(schema);
		const workPlan = addWorkPlan(file, { name: "Construction" });
		editWorkPlan(file, { workPlan, attributes: { Description: "Construction of phase 1" } });
		expect(workPlan.get("Description")).toBe("Construction of phase 1");
	});

	test("converts a Date/Time-named attribute through datetime2ifc", () => {
		const file = createTestFile(schema);
		const workPlan = addWorkPlan(file, {});
		if (schema === "IFC2X3") {
			// IFC2X3's CreationDate is a real IfcDateAndTime/IfcCalendarDate/IfcLocalTime
			// entity -- datetime2ifc's own "IfcDateTime" branch only formats a plain
			// string on IFC4+, and real Python's own SWIG binding would reject writing
			// that string into what's actually a union-of-entities attribute. THIS PORT
			// DOES NOT: verified empirically (a disposable trace script against this
			// worktree's own built native addon) that `EntityInstance.set()` performs NO
			// declared-type validation at all -- it silently accepts and stores whatever
			// value it's given, entity-typed attribute or not. See
			// `../../../src/api/sequence/editWorkPlan.ts`'s own header comment (and its
			// `TODOS.md` cross-reference) for the full writeup of this general,
			// TS-port-specific divergence from real Python. Pinned here as the actual
			// (surprising) silent-write behavior, not a throw.
			editWorkPlan(file, { workPlan, attributes: { CreationDate: "2020-01-01T00:00:00" } });
			expect(workPlan.get("CreationDate")).toBe("2020-01-01T00:00:00");
			return;
		}
		editWorkPlan(file, { workPlan, attributes: { CreationDate: "2020-01-01T00:00:00" } });
		expect(workPlan.get("CreationDate")).toBe("2020-01-01T00:00:00");
	});

	// Real Python throws editing `Duration`/`TotalFloat` on IFC2X3 (`IfcTimeMeasure`,
	// i.e. `number`, not `IfcDuration`/`string` there) -- but this port's own `.set()`
	// performs no declared-type validation at all (verified empirically, see this file's
	// header comment and `editWorkPlan.ts`'s own), so it silently writes the formatted
	// ISO-8601 duration STRING into what the schema declares as a `number` attribute,
	// on every schema including IFC2X3. Ported/tested as the real, verified behavior,
	// not the Python-parity throw a first (unverified) pass assumed.
	test("converts a Duration through datetime2ifc", () => {
		const file = createTestFile(schema);
		const workPlan = addWorkPlan(file, {});
		const oneDay: Duration = { years: 0, months: 0, days: 1, hours: 0, minutes: 0, seconds: 0 };
		editWorkPlan(file, { workPlan, attributes: { Duration: oneDay } });
		expect(workPlan.get("Duration")).toBe("P1D");
	});

	test("a falsy value is written as-is, with no conversion attempted", () => {
		const file = createTestFile(schema);
		const workPlan = addWorkPlan(file, {});
		editWorkPlan(file, { workPlan, attributes: { Description: null } });
		expect(workPlan.get("Description")).toBe(null);
	});
});
