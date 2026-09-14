// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/library/test_edit_library.py` (src/ifcopenshell-python) --
// the sole real Python test method ported, using a bare `file.createEntity(
// "IfcLibraryInformation")` for real Python's own bare, unrelated
// `self.file.createIfcLibraryInformation()` fixture (NOT `api.library.addLibrary`,
// which mandates a `name`, and NOT `api.root.createEntity`, which assumes an `IfcRoot`
// subtype -- `IfcLibraryInformation` is neither), and `util/date.ts`'s own `IsoDateTime`
// shape (`kind: "datetime"`) in place of Python's `datetime.datetime.now()` -- see
// `../../../src/api/library/editLibrary.ts`'s own header comment for why that's this
// project's established `isinstance` substitute.

import { describe, expect, test } from "vitest";
import { editLibrary } from "../../../src/api/library/editLibrary";
import type { EntityInstance } from "../../../src/entityInstance";
import * as dateUtil from "../../../src/util/date";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const dt: dateUtil.IsoDateTime = {
	kind: "datetime",
	year: 2024,
	month: 3,
	day: 15,
	hour: 10,
	minute: 30,
	second: 0,
	microsecond: 0,
};

describe.each(AVAILABLE_SCHEMAS)("api.library.editLibrary (%s)", (schema) => {
	test("editing a library", () => {
		const file = createTestFile(schema);
		const library = file.createEntity("IfcLibraryInformation");
		const isIfc2x3 = schema === "IFC2X3";

		const attributes: Record<string, unknown> = { Name: "Name", Version: "Version", VersionDate: dt };
		if (!isIfc2x3) {
			attributes.Location = "Location";
			attributes.Description = "Description";
		}

		editLibrary(file, { library, attributes });

		expect(library.get("Name")).toBe("Name");
		expect(library.get("Version")).toBe("Version");
		if (!isIfc2x3) {
			expect(library.get("VersionDate")).toBe(dateUtil.datetime2ifc(dt, "IfcDateTime"));
			expect(library.get("Location")).toBe("Location");
			expect(library.get("Description")).toBe("Description");
		} else {
			const versionDate = library.get("VersionDate") as EntityInstance;
			const calendarDate = dateUtil.datetime2ifc(dt, "IfcCalendarDate") as Record<string, number>;
			expect(versionDate.get("DayComponent")).toBe(calendarDate.DayComponent);
			expect(versionDate.get("MonthComponent")).toBe(calendarDate.MonthComponent);
			expect(versionDate.get("YearComponent")).toBe(calendarDate.YearComponent);
		}
	});
});

// --- Original coverage: a non-`datetime` `VersionDate` value is left untouched, not
// exercised anywhere in real Python's own `test_edit_library.py` (which only ever passes
// an actual `datetime.datetime`). Pins `isDateTimeValue`'s `isinstance` guard. ---

describe.each(AVAILABLE_SCHEMAS)("api.library.editLibrary VersionDate pass-through (%s)", (schema) => {
	test("a plain string VersionDate is assigned as-is, not converted", () => {
		const file = createTestFile(schema);
		const library = file.createEntity("IfcLibraryInformation");

		editLibrary(file, { library, attributes: { VersionDate: "2024-03-15T10:30:00" } });

		expect(library.get("VersionDate")).toBe("2024-03-15T10:30:00");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.library.editLibrary Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous attribute values; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const library = file.createEntity("IfcLibraryInformation");

		file.beginTransaction();
		editLibrary(file, { library, attributes: { Name: "Name", Version: "Version" } });
		file.endTransaction();

		expect(library.get("Name")).toBe("Name");
		expect(library.get("Version")).toBe("Version");

		file.undo();
		expect(library.get("Version")).toBeNull();

		file.redo();
		expect(library.get("Name")).toBe("Name");
		expect(library.get("Version")).toBe("Version");
	});
});
