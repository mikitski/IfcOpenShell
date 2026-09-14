// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_edit_person.py` (src/ifcopenshell-python) --
// the sole real Python test method ported.

import { describe, expect, test } from "vitest";
import { editPerson } from "../../../src/api/owner/editPerson";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.editPerson (%s)", (schema) => {
	test("editing a person", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		editPerson(file, {
			person,
			attributes: {
				[schema !== "IFC2X3" ? "Identification" : "Id"]: "Identification",
				FamilyName: "FamilyName",
				GivenName: "GivenName",
				MiddleNames: ["Middle", "Names"],
				PrefixTitles: ["Prefix", "Titles"],
				SuffixTitles: ["Suffix", "Titles"],
			},
		});
		expect(person.getByIndex(0)).toBe("Identification");
		expect(person.get("FamilyName")).toBe("FamilyName");
		expect(person.get("GivenName")).toBe("GivenName");
		expect(person.get("MiddleNames")).toEqual(["Middle", "Names"]);
		expect(person.get("PrefixTitles")).toEqual(["Prefix", "Titles"]);
		expect(person.get("SuffixTitles")).toEqual(["Suffix", "Titles"]);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.editPerson Transaction/undo-redo (%s)", (schema) => {
	test("undo reverts the edited attributes; redo reapplies them", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");

		file.beginTransaction();
		editPerson(file, { person, attributes: { FamilyName: "FamilyName", GivenName: "GivenName" } });
		file.endTransaction();

		expect(person.get("FamilyName")).toBe("FamilyName");
		expect(person.get("GivenName")).toBe("GivenName");

		file.undo();
		expect(person.get("FamilyName")).toBeNull();
		expect(person.get("GivenName")).toBeNull();

		file.redo();
		expect(person.get("FamilyName")).toBe("FamilyName");
		expect(person.get("GivenName")).toBe("GivenName");
	});
});
