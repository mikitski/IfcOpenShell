// This file was generated with the assistance of an AI coding tool.
//
// Port of `test_edit_work_time.py` (src/ifcopenshell-python) -- real Python's own test
// (IFC4 uses `Start`/`Finish`; IFC4X3 uses `StartDate`/`FinishDate`, plus a dedicated
// `test_ifc4_code_to_work_in_ifc4x3` re-running the IFC4-named attributes against an
// IFC4X3 file) is ported directly below, run against both schemas `IfcWorkTime` actually
// exists on (absent on IFC2X3 -- see `../../../src/api/sequence/index.ts`'s own chunk 1
// header-comment finding).

import { describe, expect, test } from "vitest";
import { editWorkTime } from "../../../src/api/sequence/editWorkTime";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.editWorkTime (%s)", (schema) => {
	test("edits Name/DataOrigin/UserDefinedDataOrigin/RecurrencePattern plus Start/Finish, written by index", () => {
		const file = createTestFile(schema);
		const workTime = file.createEntity("IfcWorkTime");
		const recurrencePattern = file.createEntity("IfcRecurrencePattern");
		const attributes = {
			Name: "Test",
			DataOrigin: "USERDEFINED",
			UserDefinedDataOrigin: "Custom",
			RecurrencePattern: recurrencePattern,
			Start: "2020-01-01T00:00:00",
			Finish: "2020-02-01T00:00:00",
		};

		editWorkTime(file, { workTime, attributes });
		expect(workTime.get("Name")).toBe("Test");
		expect(workTime.get("DataOrigin")).toBe("USERDEFINED");
		expect(workTime.get("UserDefinedDataOrigin")).toBe("Custom");
		expect((workTime.get("RecurrencePattern") as EntityInstance).identity()).toBe(recurrencePattern.identity());
		expect(workTime.getByIndex(4)).toBe("2020-01-01");
		expect(workTime.getByIndex(5)).toBe("2020-02-01");
	});

	test.skipIf(schema !== "IFC4X3")("also accepts StartDate/FinishDate (IFC4X3's own renamed attribute names)", () => {
		const file = createTestFile(schema);
		const workTime = file.createEntity("IfcWorkTime");
		const recurrencePattern = file.createEntity("IfcRecurrencePattern");
		const attributes = {
			Name: "Test",
			DataOrigin: "USERDEFINED",
			UserDefinedDataOrigin: "Custom",
			RecurrencePattern: recurrencePattern,
			StartDate: "2020-01-01T00:00:00",
			FinishDate: "2020-02-01T00:00:00",
		};

		editWorkTime(file, { workTime, attributes });
		expect(workTime.get("Name")).toBe("Test");
		expect(workTime.get("StartDate")).toBe("2020-01-01");
		expect(workTime.get("FinishDate")).toBe("2020-02-01");
	});
});
